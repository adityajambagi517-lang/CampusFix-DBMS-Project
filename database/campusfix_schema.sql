-- ============================================================================
-- Project: CampusFix — Campus Complaint & Maintenance Intelligence System
-- Milestone: Relational Schema DDL Implementation
-- Target RDBMS: PostgreSQL 15+ (with pgvector extension)
-- ============================================================================

-- Enable pgvector extension for natural language semantic similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- 1. DROP EXISTING TABLES (Reverse Dependency Order for clean idempotency)
-- ============================================================================
DROP TABLE IF EXISTS complaint_vector CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS comment CASCADE;
DROP TABLE IF EXISTS attachment CASCADE;
DROP TABLE IF EXISTS status_history CASCADE;
DROP TABLE IF EXISTS assignment CASCADE;
DROP TABLE IF EXISTS complaint CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS category CASCADE;
DROP TABLE IF EXISTS department CASCADE;
DROP TABLE IF EXISTS location CASCADE;
DROP TABLE IF EXISTS app_user CASCADE;
DROP TABLE IF EXISTS role CASCADE;

-- ============================================================================
-- 2. ENUM TYPES
-- ============================================================================
DROP TYPE IF EXISTS role_type CASCADE;
CREATE TYPE role_type AS ENUM (
    'STUDENT',
    'STAFF_USER',
    'MAINTENANCE_STAFF',
    'ADMIN'
);

DROP TYPE IF EXISTS complaint_status CASCADE;
CREATE TYPE complaint_status AS ENUM (
    'OPEN',
    'ASSIGNED',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED',
    'ESCALATED'
);

DROP TYPE IF EXISTS complaint_priority CASCADE;
CREATE TYPE complaint_priority AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);

DROP TYPE IF EXISTS staff_availability CASCADE;
CREATE TYPE staff_availability AS ENUM (
    'AVAILABLE',
    'BUSY',
    'ON_LEAVE'
);

-- ============================================================================
-- 3. TABLE DEFINITIONS (Forward Dependency Order)
-- ============================================================================

-- Table 1: ROLE
CREATE TABLE role (
    role_id SERIAL PRIMARY KEY,
    role_name role_type NOT NULL UNIQUE
);

-- Table 2: APP_USER
CREATE TABLE app_user (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_app_user_role FOREIGN KEY (role_id)
        REFERENCES role (role_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- Table 3: LOCATION
CREATE TABLE location (
    location_id SERIAL PRIMARY KEY,
    building VARCHAR(100) NOT NULL,
    floor VARCHAR(20) NOT NULL,
    room VARCHAR(50) NOT NULL,
    zone VARCHAR(100),
    CONSTRAINT uq_location UNIQUE (building, floor, room)
);

-- Table 4: DEPARTMENT
CREATE TABLE department (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Table 5: CATEGORY
CREATE TABLE category (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    default_sla_hours INT NOT NULL DEFAULT 24 CHECK (default_sla_hours > 0),
    CONSTRAINT fk_category_department FOREIGN KEY (department_id)
        REFERENCES department (department_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT uq_category_dept UNIQUE (category_name, department_id)
);

-- Table 6: STAFF (1-to-1 Subtype of APP_USER for Maintenance Staff)
CREATE TABLE staff (
    staff_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    specialization VARCHAR(150) NOT NULL,
    availability_status staff_availability NOT NULL DEFAULT 'AVAILABLE',
    CONSTRAINT fk_staff_user FOREIGN KEY (user_id)
        REFERENCES app_user (user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Table 7: COMPLAINT
CREATE TABLE complaint (
    complaint_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    location_id INT NOT NULL,
    status complaint_status NOT NULL DEFAULT 'OPEN',
    priority complaint_priority NOT NULL DEFAULT 'MEDIUM',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    sla_due_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_complaint_user FOREIGN KEY (user_id)
        REFERENCES app_user (user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_complaint_category FOREIGN KEY (category_id)
        REFERENCES category (category_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_complaint_location FOREIGN KEY (location_id)
        REFERENCES location (location_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- Table 8: ASSIGNMENT
CREATE TABLE assignment (
    assignment_id SERIAL PRIMARY KEY,
    complaint_id INT NOT NULL,
    staff_id INT NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT NOT NULL,
    CONSTRAINT fk_assignment_complaint FOREIGN KEY (complaint_id)
        REFERENCES complaint (complaint_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_assignment_staff FOREIGN KEY (staff_id)
        REFERENCES staff (staff_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_assignment_assigned_by FOREIGN KEY (assigned_by)
        REFERENCES app_user (user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- Table 9: STATUS_HISTORY
CREATE TABLE status_history (
    history_id SERIAL PRIMARY KEY,
    complaint_id INT NOT NULL,
    old_status complaint_status,
    new_status complaint_status NOT NULL,
    changed_by INT,
    remarks TEXT,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_status_history_complaint FOREIGN KEY (complaint_id)
        REFERENCES complaint (complaint_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_status_history_changed_by FOREIGN KEY (changed_by)
        REFERENCES app_user (user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- Table 10: ATTACHMENT
CREATE TABLE attachment (
    attachment_id SERIAL PRIMARY KEY,
    complaint_id INT NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attachment_complaint FOREIGN KEY (complaint_id)
        REFERENCES complaint (complaint_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Table 11: COMMENT
CREATE TABLE comment (
    comment_id SERIAL PRIMARY KEY,
    complaint_id INT NOT NULL,
    author_id INT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comment_complaint FOREIGN KEY (complaint_id)
        REFERENCES complaint (complaint_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_comment_author FOREIGN KEY (author_id)
        REFERENCES app_user (user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- Table 12: AUDIT_LOG
CREATE TABLE audit_log (
    log_id SERIAL PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_log_user FOREIGN KEY (user_id)
        REFERENCES app_user (user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- Table 13: COMPLAINT_VECTOR (1-to-1 extension of COMPLAINT for AI embeddings)
CREATE TABLE complaint_vector (
    complaint_id INT PRIMARY KEY,
    embedding vector(384) NOT NULL,
    CONSTRAINT fk_complaint_vector_complaint FOREIGN KEY (complaint_id)
        REFERENCES complaint (complaint_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ============================================================================
-- 4. PERFORMANCE & OPERATIONAL INDEXES
-- ============================================================================

-- Foreign key lookup indexes
CREATE INDEX idx_app_user_role ON app_user(role_id);
CREATE INDEX idx_category_dept ON category(department_id);
CREATE INDEX idx_complaint_user ON complaint(user_id);
CREATE INDEX idx_complaint_category ON complaint(category_id);
CREATE INDEX idx_complaint_location ON complaint(location_id);
CREATE INDEX idx_assignment_complaint ON assignment(complaint_id);
CREATE INDEX idx_assignment_staff ON assignment(staff_id);
CREATE INDEX idx_status_history_complaint ON status_history(complaint_id);
CREATE INDEX idx_attachment_complaint ON attachment(complaint_id);
CREATE INDEX idx_comment_complaint ON comment(complaint_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);

-- Operational search and filtering indexes
CREATE INDEX idx_complaint_status ON complaint(status);
CREATE INDEX idx_complaint_priority ON complaint(priority);
CREATE INDEX idx_complaint_created_at ON complaint(created_at DESC);

-- HNSW Cosine Similarity Vector Index for all-MiniLM-L6-v2 embeddings
CREATE INDEX idx_complaint_vector_hnsw ON complaint_vector 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

