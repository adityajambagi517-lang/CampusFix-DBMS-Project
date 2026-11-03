-- ============================================================================
-- CampusFix — Advanced DBMS Concepts: Triggers, Stored Functions & Views
-- Target: PostgreSQL 15+ (with pgvector)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. STORED FUNCTIONS & TRIGGERS
-- ----------------------------------------------------------------------------

-- Trigger Function 1: Automatically compute and set sla_due_at based on Category SLA
CREATE OR REPLACE FUNCTION fn_trg_set_sla_due_at()
RETURNS TRIGGER AS $$
DECLARE
    v_sla_hours INT;
BEGIN
    IF NEW.sla_due_at IS NULL THEN
        SELECT default_sla_hours INTO v_sla_hours
        FROM category
        WHERE category_id = NEW.category_id;
        
        IF v_sla_hours IS NULL THEN
            v_sla_hours := 24; -- Fallback default
        END IF;
        
        NEW.sla_due_at := NEW.created_at + (v_sla_hours || ' hours')::INTERVAL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_sla_due_at ON complaint;
CREATE TRIGGER trg_set_sla_due_at
    BEFORE INSERT ON complaint
    FOR EACH ROW
    EXECUTE FUNCTION fn_trg_set_sla_due_at();

-- Trigger Function 2: Automatically record state changes into status_history
CREATE OR REPLACE FUNCTION fn_trg_record_status_history()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO status_history (
            complaint_id,
            old_status,
            new_status,
            changed_by,
            remarks,
            changed_at
        ) VALUES (
            NEW.complaint_id,
            NULL,
            NEW.status,
            NEW.user_id,
            'Complaint registered in system.',
            CURRENT_TIMESTAMP
        );
    ELSIF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO status_history (
            complaint_id,
            old_status,
            new_status,
            changed_by,
            remarks,
            changed_at
        ) VALUES (
            NEW.complaint_id,
            OLD.status,
            NEW.status,
            NEW.user_id,
            'Status transitioned from ' || OLD.status::text || ' to ' || NEW.status::text,
            CURRENT_TIMESTAMP
        );
        
        -- Automatically stamp resolved_at when marked RESOLVED or CLOSED
        IF NEW.status IN ('RESOLVED', 'CLOSED') AND NEW.resolved_at IS NULL THEN
            NEW.resolved_at := CURRENT_TIMESTAMP;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_complaint_status_history ON complaint;
CREATE TRIGGER trg_complaint_status_history
    BEFORE INSERT OR UPDATE OF status ON complaint
    FOR EACH ROW
    EXECUTE FUNCTION fn_trg_record_status_history();

-- ----------------------------------------------------------------------------
-- 2. TRANSACTIONAL STORED PROCEDURES / FUNCTIONS
-- ----------------------------------------------------------------------------

-- Procedure 1: Atomic Dispatch / Assignment of Complaint
CREATE OR REPLACE FUNCTION fn_assign_complaint(
    p_complaint_id INT,
    p_staff_id INT,
    p_admin_id INT,
    p_remarks TEXT DEFAULT 'Assigned to maintenance technician'
)
RETURNS VOID AS $$
BEGIN
    -- 1. Insert assignment record
    INSERT INTO assignment (complaint_id, staff_id, assigned_by, assigned_at)
    VALUES (p_complaint_id, p_staff_id, p_admin_id, CURRENT_TIMESTAMP);
    
    -- 2. Update complaint status to ASSIGNED
    UPDATE complaint
    SET status = 'ASSIGNED'
    WHERE complaint_id = p_complaint_id;
    
    -- 3. Update staff availability status to BUSY
    UPDATE staff
    SET availability_status = 'BUSY'
    WHERE staff_id = p_staff_id;
    
    -- 4. Record in audit log
    INSERT INTO audit_log (user_id, action, entity, entity_id, created_at)
    VALUES (p_admin_id, 'ASSIGN_STAFF', 'complaint', p_complaint_id::text, CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql;

-- Procedure 2: Atomic Resolution of Complaint by Staff
CREATE OR REPLACE FUNCTION fn_resolve_complaint(
    p_complaint_id INT,
    p_staff_id INT,
    p_remarks TEXT DEFAULT 'Work completed and verified'
)
RETURNS VOID AS $$
DECLARE
    v_user_id INT;
BEGIN
    SELECT user_id INTO v_user_id FROM staff WHERE staff_id = p_staff_id;

    -- 1. Update complaint status and resolution timestamp
    UPDATE complaint
    SET status = 'RESOLVED',
        resolved_at = CURRENT_TIMESTAMP
    WHERE complaint_id = p_complaint_id;
    
    -- 2. Free technician availability
    UPDATE staff
    SET availability_status = 'AVAILABLE'
    WHERE staff_id = p_staff_id;
    
    -- 3. Add technician resolution note in comment
    IF p_remarks IS NOT NULL AND LENGTH(TRIM(p_remarks)) > 0 THEN
        INSERT INTO comment (complaint_id, author_id, body, created_at)
        VALUES (p_complaint_id, v_user_id, '[Resolution Note]: ' || p_remarks, CURRENT_TIMESTAMP);
    END IF;

    -- 4. Record audit log
    INSERT INTO audit_log (user_id, action, entity, entity_id, created_at)
    VALUES (v_user_id, 'RESOLVE_COMPLAINT', 'complaint', p_complaint_id::text, CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql;

-- Procedure 3: Automatic SLA Escalation Routine
CREATE OR REPLACE FUNCTION fn_escalate_overdue_complaints()
RETURNS INT AS $$
DECLARE
    v_escalated_count INT := 0;
    r RECORD;
BEGIN
    FOR r IN
        SELECT complaint_id, title
        FROM complaint
        WHERE status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS')
          AND sla_due_at < CURRENT_TIMESTAMP
          AND priority != 'CRITICAL'
    LOOP
        UPDATE complaint
        SET priority = 'CRITICAL',
            status = 'ESCALATED'
        WHERE complaint_id = r.complaint_id;
        
        INSERT INTO audit_log (user_id, action, entity, entity_id, created_at)
        VALUES (NULL, 'AUTO_SLA_ESCALATION', 'complaint', r.complaint_id::text, CURRENT_TIMESTAMP);
        
        v_escalated_count := v_escalated_count + 1;
    END LOOP;
    
    RETURN v_escalated_count;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 3. VECTOR SIMILARITY SEARCH STORED FUNCTION
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_match_similar_complaints(
    query_embedding vector(384),
    similarity_threshold FLOAT DEFAULT 0.65,
    match_limit INT DEFAULT 5
)
RETURNS TABLE (
    complaint_id INT,
    title VARCHAR(200),
    description TEXT,
    status complaint_status,
    priority complaint_priority,
    category_name VARCHAR(100),
    department_name VARCHAR(100),
    building VARCHAR(100),
    room VARCHAR(50),
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.complaint_id,
        c.title,
        c.description,
        c.status,
        c.priority,
        cat.category_name,
        d.department_name,
        loc.building,
        loc.room,
        ROUND((1 - (cv.embedding <=> query_embedding))::numeric, 4)::FLOAT AS similarity
    FROM complaint_vector cv
    JOIN complaint c ON cv.complaint_id = c.complaint_id
    JOIN category cat ON c.category_id = cat.category_id
    JOIN department d ON cat.department_id = d.department_id
    JOIN location loc ON c.location_id = loc.location_id
    WHERE (1 - (cv.embedding <=> query_embedding)) >= similarity_threshold
    ORDER BY cv.embedding <=> query_embedding ASC
    LIMIT match_limit;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 4. ANALYTICS & OPERATIONAL VIEWS
-- ----------------------------------------------------------------------------

-- View 1: Denormalized Comprehensive Complaint View
CREATE OR REPLACE VIEW vw_complaint_details AS
SELECT 
    c.complaint_id,
    c.title,
    c.description,
    c.status,
    c.priority,
    c.created_at,
    c.resolved_at,
    c.sla_due_at,
    CASE 
        WHEN c.status IN ('RESOLVED', 'CLOSED') THEN 'RESOLVED'
        WHEN CURRENT_TIMESTAMP > c.sla_due_at THEN 'BREACHED'
        ELSE 'ON_TRACK'
    END AS sla_status,
    ROUND(EXTRACT(EPOCH FROM (COALESCE(c.resolved_at, CURRENT_TIMESTAMP) - c.created_at)) / 3600.0, 2) AS duration_hours,
    u.user_id AS reporter_id,
    u.full_name AS reporter_name,
    u.email AS reporter_email,
    cat.category_id,
    cat.category_name,
    d.department_id,
    d.department_name,
    loc.location_id,
    loc.building,
    loc.floor,
    loc.room,
    loc.zone,
    curr_staff.staff_id AS assigned_staff_id,
    staff_user.full_name AS assigned_staff_name,
    staff_user.email AS assigned_staff_email,
    curr_staff.specialization AS assigned_specialization
FROM complaint c
JOIN app_user u ON c.user_id = u.user_id
JOIN category cat ON c.category_id = cat.category_id
JOIN department d ON cat.department_id = d.department_id
JOIN location loc ON c.location_id = loc.location_id
LEFT JOIN LATERAL (
    SELECT a.staff_id 
    FROM assignment a 
    WHERE a.complaint_id = c.complaint_id 
    ORDER BY a.assigned_at DESC 
    LIMIT 1
) latest_assign ON TRUE
LEFT JOIN staff curr_staff ON latest_assign.staff_id = curr_staff.staff_id
LEFT JOIN app_user staff_user ON curr_staff.user_id = staff_user.user_id;

-- View 2: Department Workload & Performance Summary
CREATE OR REPLACE VIEW vw_department_workload AS
SELECT 
    d.department_id,
    d.department_name,
    COUNT(c.complaint_id) AS total_complaints,
    COUNT(c.complaint_id) FILTER (WHERE c.status = 'OPEN') AS open_count,
    COUNT(c.complaint_id) FILTER (WHERE c.status = 'ASSIGNED') AS assigned_count,
    COUNT(c.complaint_id) FILTER (WHERE c.status = 'IN_PROGRESS') AS in_progress_count,
    COUNT(c.complaint_id) FILTER (WHERE c.status IN ('RESOLVED', 'CLOSED')) AS resolved_count,
    COUNT(c.complaint_id) FILTER (WHERE c.status NOT IN ('RESOLVED', 'CLOSED') AND CURRENT_TIMESTAMP > c.sla_due_at) AS sla_breached_count,
    ROUND(AVG(EXTRACT(EPOCH FROM (c.resolved_at - c.created_at)) / 3600.0) FILTER (WHERE c.resolved_at IS NOT NULL), 2) AS avg_resolution_hours
FROM department d
LEFT JOIN category cat ON d.department_id = cat.department_id
LEFT JOIN complaint c ON cat.category_id = c.category_id
GROUP BY d.department_id, d.department_name;

-- View 3: Location Maintenance Hotspots (Identify recurring problem zones)
CREATE OR REPLACE VIEW vw_location_hotspots AS
SELECT 
    loc.location_id,
    loc.building,
    loc.floor,
    loc.room,
    loc.zone,
    COUNT(c.complaint_id) AS total_complaints,
    COUNT(c.complaint_id) FILTER (WHERE c.status NOT IN ('RESOLVED', 'CLOSED')) AS active_complaints,
    COUNT(c.complaint_id) FILTER (WHERE c.priority IN ('HIGH', 'CRITICAL')) AS critical_complaints
FROM location loc
LEFT JOIN complaint c ON loc.location_id = c.location_id
GROUP BY loc.location_id, loc.building, loc.floor, loc.room, loc.zone
HAVING COUNT(c.complaint_id) > 0
ORDER BY total_complaints DESC;

-- View 4: Maintenance Staff Capacity and Task Metrics
CREATE OR REPLACE VIEW vw_staff_metrics AS
SELECT 
    s.staff_id,
    u.user_id,
    u.full_name AS staff_name,
    u.email AS staff_email,
    s.specialization,
    s.availability_status,
    COUNT(a.assignment_id) AS lifetime_assigned,
    COUNT(a.assignment_id) FILTER (WHERE c.status IN ('ASSIGNED', 'IN_PROGRESS')) AS active_tasks,
    COUNT(a.assignment_id) FILTER (WHERE c.status IN ('RESOLVED', 'CLOSED')) AS completed_tasks,
    ROUND(AVG(EXTRACT(EPOCH FROM (c.resolved_at - a.assigned_at)) / 3600.0) FILTER (WHERE c.resolved_at IS NOT NULL), 2) AS avg_task_turnaround_hours
FROM staff s
JOIN app_user u ON s.user_id = u.user_id
LEFT JOIN assignment a ON s.staff_id = a.staff_id
LEFT JOIN complaint c ON a.complaint_id = c.complaint_id
GROUP BY s.staff_id, u.user_id, u.full_name, u.email, s.specialization, s.availability_status;
