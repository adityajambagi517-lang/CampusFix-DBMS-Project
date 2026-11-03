# CampusFix — Master Academic Project Documentation
**Course:** DBMS Experiential Learning — Level 3 Project  
**Title:** CampusFix — Campus Complaint & Maintenance Intelligence System  
**Option:** Option 2 — SQL (PostgreSQL 15) + Vector Database (`pgvector`)  
**Team Member 1:** Aditya Basavaraj Jambagi (PES2UG24CS030)  
**Team Member 2:** *(Student Partner)*  

---

## 1. Executive Summary

CampusFix is an intelligent, full-stack campus maintenance management system developed for educational institutions. It replaces error-prone, informal communication channels with a centralized relational backbone and semantic vector intelligence.

By combining **PostgreSQL 15** (for normalized relational integrity, triggers, stored procedures, and views) with the **`pgvector` extension** (for 384-dimensional dense semantic vector similarity search), CampusFix eliminates duplicate work tickets, automates SLA monitoring, intelligently routes tasks to specialized technicians, and pinpoints recurring facility failure hotspots.

---

## 2. Technology Stack Justification

| Layer | Technology | Version | Justification |
| :--- | :--- | :--- | :--- |
| **Relational Database** | PostgreSQL | 15.19 | Industry-standard ACID compliance, native JSON/vector support, robust stored procedure (`plpgsql`) engine, and declarative constraints. |
| **Vector Engine** | `pgvector` | 0.7.4 | Integrates high-dimensional vector storage and HNSW indexing directly into PostgreSQL, enabling hybrid relational + vector queries without separate vector databases. |
| **Embedding Model** | `all-MiniLM-L6-v2` | 384-D | Lightweight, high-accuracy sentence transformer architecture producing 384-dimensional unit embeddings optimized for cosine similarity. |
| **Frontend Framework** | Next.js (App Router) | 14.2.15 | React-based server components, dynamic client routing, and unified API Route Handlers. |
| **Styling & Icons** | Tailwind CSS + Lucide | 3.4.14 | Responsive, accessible UI with mobile and desktop support. |
| **Database Client** | `node-postgres` (`pg`) | 8.13.1 | Direct PostgreSQL connection pooling with parameterized queries and transaction control. |
| **Authentication** | Bcrypt + JWT | 2.4.3 / 9.0.2 | Salted cryptographic password hashing and HTTP-only cookie session handling. |

---

## 3. Complete Relational Data Model (13 Entities)

The schema is normalized to **Third Normal Form (3NF)**:

### 1. `role`
- **Keys**: `role_id` (PK, `SERIAL`).
- **Attributes**: `role_name` (`role_type` ENUM: `STUDENT`, `STAFF_USER`, `MAINTENANCE_STAFF`, `ADMIN`, `UNIQUE`).
- **Purpose**: Defines system authorization boundaries.

### 2. `app_user`
- **Keys**: `user_id` (PK, `SERIAL`), `role_id` (FK $\rightarrow$ `role.role_id`).
- **Attributes**: `full_name`, `email` (`UNIQUE`), `password_hash`, `created_at`.
- **Purpose**: Unified account registry for all campus actors.

### 3. `location`
- **Keys**: `location_id` (PK, `SERIAL`).
- **Attributes**: `building`, `floor`, `room`, `zone`.
- **Constraints**: Composite `UNIQUE(building, floor, room)`.
- **Purpose**: Normalizes physical campus infrastructure hierarchy.

### 4. `department`
- **Keys**: `department_id` (PK, `SERIAL`).
- **Attributes**: `department_name` (`UNIQUE`), `description`.
- **Purpose**: Maintenance divisions (Electrical, Plumbing, IT, Civil, Lab).

### 5. `category`
- **Keys**: `category_id` (PK, `SERIAL`), `department_id` (FK $\rightarrow$ `department.department_id`).
- **Attributes**: `category_name`, `default_sla_hours` (`CHECK > 0`).
- **Constraints**: Composite `UNIQUE(category_name, department_id)`.
- **Purpose**: Classifies issues with default SLA resolution hours.

### 6. `staff`
- **Keys**: `staff_id` (PK, `SERIAL`), `user_id` (FK $\rightarrow$ `app_user.user_id`, `UNIQUE`).
- **Attributes**: `specialization`, `availability_status` (`staff_availability` ENUM: `AVAILABLE`, `BUSY`, `ON_LEAVE`).
- **Purpose**: 1-to-1 Subtype of `app_user` for maintenance technicians.

### 7. `complaint`
- **Keys**: `complaint_id` (PK, `SERIAL`), `user_id` (FK), `category_id` (FK), `location_id` (FK).
- **Attributes**: `title`, `description`, `status` (`complaint_status` ENUM), `priority` (`complaint_priority` ENUM), `created_at`, `resolved_at`, `sla_due_at`.
- **Purpose**: Central transactional ticket entity.

### 8. `assignment`
- **Keys**: `assignment_id` (PK, `SERIAL`), `complaint_id` (FK), `staff_id` (FK), `assigned_by` (FK).
- **Attributes**: `assigned_at`.
- **Purpose**: Records dispatch of technicians by administrators.

### 9. `status_history`
- **Keys**: `history_id` (PK, `SERIAL`), `complaint_id` (FK), `changed_by` (FK, nullable).
- **Attributes**: `old_status`, `new_status`, `remarks`, `changed_at`.
- **Purpose**: Append-only chronological audit log populated by triggers.

### 10. `attachment`
- **Keys**: `attachment_id` (PK, `SERIAL`), `complaint_id` (FK).
- **Attributes**: `file_url`, `file_type`, `uploaded_at`.
- **Purpose**: Stores photographic proof and documents.

### 11. `comment`
- **Keys**: `comment_id` (PK, `SERIAL`), `complaint_id` (FK), `author_id` (FK).
- **Attributes**: `body`, `created_at`.
- **Purpose**: Interactive communication thread between student, staff, and admin.

### 12. `audit_log`
- **Keys**: `log_id` (PK, `SERIAL`), `user_id` (FK, nullable).
- **Attributes**: `action`, `entity`, `entity_id`, `created_at`.
- **Purpose**: System-wide compliance and security ledger.

### 13. `complaint_vector`
- **Keys**: `complaint_id` (PK/FK referencing `complaint.complaint_id` with `ON DELETE CASCADE`).
- **Attributes**: `embedding` (`vector(384)`).
- **Index**: HNSW index with `vector_cosine_ops`.
- **Purpose**: Stores dense 384-D semantic embeddings for similarity matching.

---

## 4. Advanced DBMS Features

### 1. Triggers
- **`trg_set_sla_due_at`**: Runs `BEFORE INSERT` on `complaint`. Looks up `category.default_sla_hours` and computes `sla_due_at = created_at + INTERVAL default_sla_hours HOUR`.
- **`trg_complaint_status_history`**: Runs `AFTER INSERT OR UPDATE OF status` on `complaint`. Automatically appends an immutable row to `status_history`.

### 2. Transactional Stored Functions
- **`fn_assign_complaint(complaint_id, staff_id, admin_id)`**: Executes assignment, marks ticket `ASSIGNED`, marks technician `BUSY`, and logs audit trail.
- **`fn_resolve_complaint(complaint_id, staff_id, remarks)`**: Marks ticket `RESOLVED`, stamps `resolved_at`, marks technician `AVAILABLE`, and records completion notes.
- **`fn_match_similar_complaints(query_embedding, threshold, limit)`**: Executes cosine distance query over `complaint_vector`.

### 3. Database Views
- **`vw_complaint_details`**: Denormalized view joining complaint, reporter, category, department, location, and assigned staff with real-time SLA breach calculations.
- **`vw_department_workload`**: Aggregates total, open, in-progress, resolved, and SLA-breached tickets, plus average resolution turnaround time per department.
- **`vw_location_hotspots`**: Pinpoints chronic problem areas by grouping tickets by location and filtering with `HAVING COUNT(*) > 0`.
- **`vw_staff_metrics`**: Tracks technician capacities, active tasks, completed tasks, and average turnaround time.

---

## 5. Security & Data Protection

1. **Password Hashing**: Bcrypt with 10 salt rounds ensures irreversible password security.
2. **Server-Side Authorization**: Every API route validates JWT cookies and verifies permissions before modifying data.
3. **SQL Injection Defense**: Strict use of parameterized SQL queries (`$1`, `$2`) throughout the entire application.
4. **Dedicated Application Role**: Web app connects via least-privilege role `campusfix_app`.
5. **Secret Protection**: `.env` is ignored by Git; `.env.example` provides sanitized placeholders.

---

## 6. Limitations & Future Enhancements

- **Push Notifications**: Future iterations can integrate WebSockets or SMS/Email alerts for real-time status updates.
- **Automated IoT Sensors**: Direct telemetry ingestion from campus electricity meters and water flow sensors to auto-generate tickets.
- **Inventory Integration**: Linking equipment replacement to campus spare-parts inventory.
