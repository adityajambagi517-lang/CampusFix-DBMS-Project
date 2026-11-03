# CampusFix — Comprehensive SQL & Advanced DBMS Demonstration
**Course:** DBMS Experiential Learning — Level 3  
**Database:** PostgreSQL 15 with `pgvector`  

This document provides complete, production-tested SQL demonstrations for all foundational and advanced database concepts implemented in the CampusFix system.

---

## 1. DDL: CREATE, ALTER, DROP

### A. CREATE (Tables, Types & Extensions)
```sql
-- Enable vector extension for 384-dimensional semantic embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Define domain-specific enumerated status type
CREATE TYPE complaint_status AS ENUM (
    'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED'
);

-- Create category table with default SLA hours constraint
CREATE TABLE category (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    default_sla_hours INT NOT NULL DEFAULT 24 CHECK (default_sla_hours > 0)
);
```
- **Explanation**: Creates PostgreSQL custom ENUMs, extensions, and tables with default values and check constraints.
- **Why used**: Guarantees valid status states and enforces that SLA turnaround time is strictly positive.
- **Used by**: Category management and complaint creation workflow.

### B. ALTER (Schema Modification)
```sql
-- Safe Demonstration: Add emergency contact column to location
ALTER TABLE location 
ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(50) DEFAULT 'Campus Security Ext 100';

-- Modify column constraint
ALTER TABLE category 
ALTER COLUMN default_sla_hours SET DEFAULT 12;
```
- **Explanation**: Modifies table structure by adding new attributes and updating default values without dropping data.
- **Why used**: Accommodates evolving infrastructure requirements during campus facility expansion.

### C. DROP (Safe Demonstration Table)
```sql
-- Safe Demonstration: Create and drop a temporary maintenance scratch table
CREATE TABLE temp_maintenance_audit (
    scratch_id SERIAL PRIMARY KEY,
    temp_note TEXT,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drop the demonstration table cleanly
DROP TABLE IF EXISTS temp_maintenance_audit CASCADE;
```
- **Explanation**: Safely creates and drops an unneeded temporary table with `CASCADE` semantics.
- **Why used**: Demonstrates non-destructive execution of DDL `DROP` on isolated objects.

---

## 2. DML: INSERT, UPDATE, DELETE

### A. INSERT
```sql
INSERT INTO complaint (title, description, user_id, category_id, location_id, priority)
VALUES (
    'Water tap leaking continuously in 2nd floor restroom',
    'Main washroom sink tap will not shut off completely, wasting clean drinking water.',
    6, 4, 1, 'HIGH'
) RETURNING complaint_id, created_at, status;
```
- **Explanation**: Inserts a new complaint record. PostgreSQL executes `trg_set_sla_due_at` and `trg_complaint_status_history` automatically, and returns generated attributes.
- **Used by**: Student Complaint Form (`/dashboard/student`).

### B. UPDATE
```sql
UPDATE complaint
SET status = 'IN_PROGRESS'
WHERE complaint_id = 1 AND status = 'ASSIGNED'
RETURNING complaint_id, status;
```
- **Explanation**: Updates complaint lifecycle state. The trigger automatically appends a row into `status_history`.
- **Used by**: Technician Workstation (`/dashboard/staff`).

### C. DELETE (Demonstration on Test Comment)
```sql
-- Insert a test comment
INSERT INTO comment (complaint_id, author_id, body)
VALUES (1, 1, 'Temporary test comment for deletion demonstration')
RETURNING comment_id;

-- Delete the specific test comment
DELETE FROM comment 
WHERE body LIKE 'Temporary test comment%'
RETURNING comment_id, body;
```
- **Explanation**: Deletes a specific row matching a predicate.
- **Used by**: Comment moderation and ticket cleanup.

---

## 3. SELECT with WHERE and ORDER BY

```sql
SELECT 
    complaint_id, 
    title, 
    priority, 
    status, 
    created_at
FROM complaint
WHERE status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS')
  AND priority IN ('HIGH', 'CRITICAL')
ORDER BY 
    CASE 
        WHEN priority = 'CRITICAL' THEN 1
        WHEN priority = 'HIGH' THEN 2
        ELSE 3
    END,
    created_at ASC;
```
- **Explanation**: Filters open issues requiring immediate attention and orders them with Critical priority first, then FIFO by submission date.
- **Used by**: Admin Triage Dispatch Center (`/dashboard/admin`).

---

## 4. Multi-Table JOIN Operations

```sql
SELECT 
    c.complaint_id,
    c.title,
    c.status,
    c.priority,
    u.full_name AS reporter_name,
    cat.category_name,
    d.department_name,
    loc.building,
    loc.room,
    staff_user.full_name AS assigned_technician
FROM complaint c
JOIN app_user u ON c.user_id = u.user_id
JOIN category cat ON c.category_id = cat.category_id
JOIN department d ON cat.department_id = d.department_id
JOIN location loc ON c.location_id = loc.location_id
LEFT JOIN assignment a ON c.complaint_id = a.complaint_id
LEFT JOIN staff s ON a.staff_id = s.staff_id
LEFT JOIN app_user staff_user ON s.user_id = staff_user.user_id
ORDER BY c.created_at DESC;
```
- **Explanation**: Joins 7 tables (`complaint`, `app_user`, `category`, `department`, `location`, `assignment`, `staff`) using inner and left outer joins to assemble a complete ticket overview.
- **Used by**: `vw_complaint_details` view and Complaint Detail Page (`/complaints/[id]`).

---

## 5. GROUP BY and HAVING

```sql
SELECT 
    loc.building,
    loc.room,
    COUNT(c.complaint_id) AS total_complaints,
    COUNT(c.complaint_id) FILTER (WHERE c.priority IN ('HIGH', 'CRITICAL')) AS critical_complaints
FROM location loc
JOIN complaint c ON loc.location_id = c.location_id
GROUP BY loc.building, loc.room
HAVING COUNT(c.complaint_id) >= 2
ORDER BY total_complaints DESC;
```
- **Explanation**: Groups complaints by building and room. The `HAVING` clause filters only rooms with 2 or more complaints to identify true campus hotspots.
- **Used by**: Infrastructure Hotspots Analytics (`/analytics`).

---

## 6. Aggregate Functions

```sql
SELECT 
    COUNT(*) AS total_tickets,
    COUNT(*) FILTER (WHERE status = 'RESOLVED') AS resolved_tickets,
    ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600.0), 2) AS avg_resolution_hours,
    MIN(created_at) AS oldest_active_ticket,
    MAX(created_at) AS newest_ticket
FROM complaint;
```
- **Explanation**: Applies `COUNT`, `AVG`, `MIN`, and `MAX` to compute turnaround metrics across the entire campus.
- **Used by**: Analytics Dashboard KPI Cards (`/analytics`).

---

## 7. Nested Subqueries

```sql
-- Find technicians who currently have more than the average number of active assignments
SELECT 
    u.full_name,
    s.specialization,
    active_tasks.task_count
FROM staff s
JOIN app_user u ON s.user_id = u.user_id
JOIN (
    SELECT staff_id, COUNT(*) AS task_count
    FROM assignment a
    JOIN complaint c ON a.complaint_id = c.complaint_id
    WHERE c.status IN ('ASSIGNED', 'IN_PROGRESS')
    GROUP BY staff_id
) active_tasks ON s.staff_id = active_tasks.staff_id
WHERE active_tasks.task_count > (
    SELECT AVG(count_per_staff)
    FROM (
        SELECT COUNT(*) AS count_per_staff
        FROM assignment a2
        JOIN complaint c2 ON a2.complaint_id = c2.complaint_id
        WHERE c2.status IN ('ASSIGNED', 'IN_PROGRESS')
        GROUP BY staff_id
    ) avg_tbl
);
```
- **Explanation**: Uses nested subqueries in both the `JOIN` clause and `WHERE` comparison predicate to balance staff load.
- **Used by**: Smart Dispatcher load-balancing algorithm.

---

## 8. Primary & Foreign Key Constraints

```sql
-- Role table with Primary Key
CREATE TABLE role (
    role_id SERIAL PRIMARY KEY,
    role_name role_type NOT NULL UNIQUE
);

-- User table referencing Role with ON DELETE RESTRICT
CREATE TABLE app_user (
    user_id SERIAL PRIMARY KEY,
    role_id INT NOT NULL,
    CONSTRAINT fk_app_user_role FOREIGN KEY (role_id)
        REFERENCES role (role_id)
        ON DELETE RESTRICT
);

-- Staff subtype enforcing 1-to-1 relationship with app_user
CREATE TABLE staff (
    staff_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    CONSTRAINT fk_staff_user FOREIGN KEY (user_id)
        REFERENCES app_user (user_id)
        ON DELETE CASCADE
);
```
- **Explanation**: Enforces entity integrity and referential actions (`RESTRICT` on roles to protect lookup data, `CASCADE` on staff subtype).
- **Used by**: Core database schema definition.

---

## 9. ACID Transactions: COMMIT & ROLLBACK

```sql
-- Demonstration of Atomic Technician Dispatch
BEGIN;

-- Step 1: Insert into assignment table
INSERT INTO assignment (complaint_id, staff_id, assigned_by, assigned_at)
VALUES (1, 1, 1, CURRENT_TIMESTAMP);

-- Step 2: Transition complaint status
UPDATE complaint
SET status = 'ASSIGNED'
WHERE complaint_id = 1;

-- Step 3: Update technician availability
UPDATE staff
SET availability_status = 'BUSY'
WHERE staff_id = 1;

-- Step 4: Record audit log
INSERT INTO audit_log (user_id, action, entity, entity_id)
VALUES (1, 'ASSIGN_STAFF', 'complaint', '1');

COMMIT;
```
- **Explanation**: Guarantees that assignment, status change, staff state, and audit log all commit together. If any step fails, `ROLLBACK` reverts all mutations.
- **Used by**: `withTransaction` in `src/lib/db.ts` and `POST /api/complaints/[id]/assign`.

---

## 10. Database Triggers

```sql
CREATE OR REPLACE FUNCTION fn_trg_record_status_history()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO status_history (
            complaint_id, old_status, new_status, changed_by, remarks, changed_at
        ) VALUES (
            NEW.complaint_id, OLD.status, NEW.status, NEW.user_id,
            'Status transitioned from ' || OLD.status::text || ' to ' || NEW.status::text,
            CURRENT_TIMESTAMP
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_complaint_status_history
    AFTER UPDATE OF status ON complaint
    FOR EACH ROW
    EXECUTE FUNCTION fn_trg_record_status_history();
```
- **Explanation**: Automatically fires whenever `complaint.status` changes, inserting an immutable audit entry without requiring application-level boilerplate.
- **Used by**: Status History timeline in `/complaints/[id]`.

---

## 11. Stored Procedures / Functions

```sql
CREATE OR REPLACE FUNCTION fn_assign_complaint(
    p_complaint_id INT,
    p_staff_id INT,
    p_admin_id INT,
    p_remarks TEXT DEFAULT 'Assigned to technician'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO assignment (complaint_id, staff_id, assigned_by, assigned_at)
    VALUES (p_complaint_id, p_staff_id, p_admin_id, CURRENT_TIMESTAMP);
    
    UPDATE complaint SET status = 'ASSIGNED' WHERE complaint_id = p_complaint_id;
    UPDATE staff SET availability_status = 'BUSY' WHERE staff_id = p_staff_id;
    
    INSERT INTO audit_log (user_id, action, entity, entity_id)
    VALUES (p_admin_id, 'ASSIGN_STAFF', 'complaint', p_complaint_id::text);
END;
$$ LANGUAGE plpgsql;
```
- **Explanation**: Encapsulates business logic directly inside PostgreSQL for guaranteed execution consistency.
- **Used by**: `POST /api/complaints/[id]/assign`.

---

## 12. Database Views

```sql
CREATE OR REPLACE VIEW vw_department_workload AS
SELECT 
    d.department_id,
    d.department_name,
    COUNT(c.complaint_id) AS total_complaints,
    COUNT(c.complaint_id) FILTER (WHERE c.status = 'OPEN') AS open_count,
    COUNT(c.complaint_id) FILTER (WHERE c.status = 'IN_PROGRESS') AS in_progress_count,
    COUNT(c.complaint_id) FILTER (WHERE c.status IN ('RESOLVED', 'CLOSED')) AS resolved_count,
    COUNT(c.complaint_id) FILTER (WHERE c.status NOT IN ('RESOLVED', 'CLOSED') AND CURRENT_TIMESTAMP > c.sla_due_at) AS sla_breached_count,
    ROUND(AVG(EXTRACT(EPOCH FROM (c.resolved_at - c.created_at)) / 3600.0) FILTER (WHERE c.resolved_at IS NOT NULL), 2) AS avg_resolution_hours
FROM department d
LEFT JOIN category cat ON d.department_id = cat.department_id
LEFT JOIN complaint c ON cat.category_id = c.category_id
GROUP BY d.department_id, d.department_name;
```
- **Explanation**: Pre-aggregates departmental load and SLA performance metrics into a clean virtual table.
- **Used by**: Department Workload table on `/analytics`.

---

## 13. Query Performance & Execution Plan (EXPLAIN ANALYZE)

```sql
EXPLAIN ANALYZE
SELECT complaint_id, title, priority, status
FROM complaint
WHERE status = 'OPEN' AND priority = 'HIGH';
```
- **Explanation**: Evaluates the PostgreSQL query planner. Uses the B-Tree indexes `idx_complaint_status` and `idx_complaint_priority` to execute an Index Scan instead of a sequential table scan.
- **Used by**: Fast query response on high-volume complaint tables.

---

## 14. Full-Text Search (tsvector / tsquery)

```sql
-- Search title and description using PostgreSQL full-text search engine
SELECT 
    complaint_id, 
    title, 
    ts_rank(to_tsvector('english', title || ' ' || description), query) AS rank
FROM complaint,
     to_tsquery('english', 'fan | light | water') AS query
WHERE to_tsvector('english', title || ' ' || description) @@ query
ORDER BY rank DESC;
```
- **Explanation**: Tokenizes complaint text, stems words (e.g. "leaking" $\rightarrow$ "leak"), and ranks results by keyword density.
- **Used by**: Keyword search bar on `/dashboard/admin`.

---

## 15. Vector Semantic Similarity Search (`pgvector`)

```sql
-- Semantic search using Cosine Distance (<=>) over 384-dimensional dense vectors
SELECT 
    c.complaint_id,
    c.title,
    c.status,
    loc.building,
    loc.room,
    ROUND((1 - (cv.embedding <=> (SELECT embedding FROM complaint_vector WHERE complaint_id = 1)))::numeric, 4) AS similarity_score
FROM complaint_vector cv
JOIN complaint c ON cv.complaint_id = c.complaint_id
JOIN location loc ON c.location_id = loc.location_id
WHERE cv.complaint_id != 1
  AND (1 - (cv.embedding <=> (SELECT embedding FROM complaint_vector WHERE complaint_id = 1))) >= 0.60
ORDER BY cv.embedding <=> (SELECT embedding FROM complaint_vector WHERE complaint_id = 1) ASC
LIMIT 3;
```
- **Explanation**: Compares dense vectors using the cosine distance operator `<=>` accelerated by the HNSW index. Returns semantically similar tickets even when different vocabulary is used.
- **Used by**: Real-time duplicate warning and Similar Complaints panel in `/complaints/[id]`.
