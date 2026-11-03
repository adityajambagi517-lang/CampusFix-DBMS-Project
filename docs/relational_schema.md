# CampusFix — Relational Schema Design Document
**Project:** Campus Complaint & Maintenance Intelligence System  
**Course:** DBMS Experiential Learning — Level 3  
**Target Database:** PostgreSQL 15+ with `pgvector`  

---

## 1. Schema Overview

The CampusFix database schema maps the real-world operational domain of campus maintenance, incident reporting, smart assignment, state machine lifecycle management, and natural language semantic similarity search.

The design strictly implements:
- **13 Normalized Relational Entities** in Third Normal Form (3NF).
- **4 PostgreSQL ENUM Types** ensuring domain-level integrity.
- **1-to-1 Subtype Entity (`staff`)** extending `app_user` for maintenance technicians.
- **1-to-1 Vector Intelligence Entity (`complaint_vector`)** storing 384-dimensional dense embeddings with an HNSW cosine similarity index.
- **Append-only Historical Trails** via `status_history` and `audit_log`.

---

## 2. PostgreSQL ENUM Types

```sql
CREATE TYPE role_type AS ENUM (
    'STUDENT',
    'STAFF_USER',
    'MAINTENANCE_STAFF',
    'ADMIN'
);

CREATE TYPE complaint_status AS ENUM (
    'OPEN',
    'ASSIGNED',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED',
    'ESCALATED'
);

CREATE TYPE complaint_priority AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);

CREATE TYPE staff_availability AS ENUM (
    'AVAILABLE',
    'BUSY',
    'ON_LEAVE'
);
```

---

## 3. Formal Relational Schema (Schema Notation)

1. **`ROLE`** (`role_id` [PK], `role_name`)
2. **`APP_USER`** (`user_id` [PK], `full_name`, `email`, `password_hash`, `role_id` [FK], `created_at`)
3. **`LOCATION`** (`location_id` [PK], `building`, `floor`, `room`, `zone`)
4. **`DEPARTMENT`** (`department_id` [PK], `department_name`, `description`)
5. **`CATEGORY`** (`category_id` [PK], `category_name`, `department_id` [FK], `default_sla_hours`)
6. **`STAFF`** (`staff_id` [PK], `user_id` [FK, UNIQUE], `specialization`, `availability_status`)
7. **`COMPLAINT`** (`complaint_id` [PK], `title`, `description`, `user_id` [FK], `category_id` [FK], `location_id` [FK], `status`, `priority`, `created_at`, `resolved_at`, `sla_due_at`)
8. **`ASSIGNMENT`** (`assignment_id` [PK], `complaint_id` [FK], `staff_id` [FK], `assigned_at`, `assigned_by` [FK])
9. **`STATUS_HISTORY`** (`history_id` [PK], `complaint_id` [FK], `old_status`, `new_status`, `changed_by` [FK], `remarks`, `changed_at`)
10. **`ATTACHMENT`** (`attachment_id` [PK], `complaint_id` [FK], `file_url`, `file_type`, `uploaded_at`)
11. **`COMMENT`** (`comment_id` [PK], `complaint_id` [FK], `author_id` [FK], `body`, `created_at`)
12. **`AUDIT_LOG`** (`log_id` [PK], `user_id` [FK], `action`, `entity`, `entity_id`, `created_at`)
13. **`COMPLAINT_VECTOR`** (`complaint_id` [PK/FK], `embedding vector(384)`)

---

## 4. Entity-by-Entity Attribute and Constraint Specifications

### 1. `role`
Defines authorization groups within the application.
- `role_id`: `SERIAL` | **PRIMARY KEY**
- `role_name`: `role_type` | **NOT NULL**, **UNIQUE**

### 2. `app_user`
Stores authentication credentials and profiles for all actors (students, faculty, technicians, administrators).
- `user_id`: `SERIAL` | **PRIMARY KEY**
- `full_name`: `VARCHAR(100)` | **NOT NULL**
- `email`: `VARCHAR(255)` | **NOT NULL**, **UNIQUE**
- `password_hash`: `VARCHAR(255)` | **NOT NULL**
- `role_id`: `INT` | **NOT NULL**, **FOREIGN KEY** $\rightarrow$ `role(role_id)` (`ON DELETE RESTRICT`)
- `created_at`: `TIMESTAMP WITH TIME ZONE` | **NOT NULL**, **DEFAULT** `CURRENT_TIMESTAMP`

### 3. `location`
Normalizes physical campus locations where maintenance issues occur.
- `location_id`: `SERIAL` | **PRIMARY KEY**
- `building`: `VARCHAR(100)` | **NOT NULL**
- `floor`: `VARCHAR(20)` | **NOT NULL**
- `room`: `VARCHAR(50)` | **NOT NULL**
- `zone`: `VARCHAR(100)` | Nullable
- *Composite Constraint:* `UNIQUE(building, floor, room)` prevents duplicate location records.

### 4. `department`
Campus operational divisions responsible for equipment maintenance.
- `department_id`: `SERIAL` | **PRIMARY KEY**
- `department_name`: `VARCHAR(100)` | **NOT NULL**, **UNIQUE**
- `description`: `TEXT` | Nullable

### 5. `category`
Specific issue classifications mapped to managing departments.
- `category_id`: `SERIAL` | **PRIMARY KEY**
- `category_name`: `VARCHAR(100)` | **NOT NULL**
- `department_id`: `INT` | **NOT NULL**, **FOREIGN KEY** $\rightarrow$ `department(department_id)` (`ON DELETE RESTRICT`)
- `default_sla_hours`: `INT` | **NOT NULL**, **DEFAULT** `24`, `CHECK (default_sla_hours > 0)`
- *Composite Constraint:* `UNIQUE(category_name, department_id)`

### 6. `staff`
One-to-one specialization subtype of `app_user` for maintenance technicians.
- `staff_id`: `SERIAL` | **PRIMARY KEY**
- `user_id`: `INT` | **NOT NULL**, **UNIQUE**, **FOREIGN KEY** $\rightarrow$ `app_user(user_id)` (`ON DELETE CASCADE`)
- `specialization`: `VARCHAR(150)` | **NOT NULL** (e.g., Electrician, Plumber, HVAC, Network Engineer)
- `availability_status`: `staff_availability` | **NOT NULL**, **DEFAULT** `'AVAILABLE'`

### 7. `complaint`
Central transactional entity recording reported campus issues.
- `complaint_id`: `SERIAL` | **PRIMARY KEY**
- `title`: `VARCHAR(200)` | **NOT NULL**
- `description`: `TEXT` | **NOT NULL**
- `user_id`: `INT` | **NOT NULL**, **FOREIGN KEY** $\rightarrow$ `app_user(user_id)` (`ON DELETE RESTRICT`)
- `category_id`: `INT` | **NOT NULL**, **FOREIGN KEY** $\rightarrow$ `category(category_id)` (`ON DELETE RESTRICT`)
- `location_id`: `INT` | **NOT NULL**, **FOREIGN KEY** $\rightarrow$ `location(location_id)` (`ON DELETE RESTRICT`)
- `status`: `complaint_status` | **NOT NULL**, **DEFAULT** `'OPEN'`
- `priority`: `complaint_priority` | **NOT NULL**, **DEFAULT** `'MEDIUM'`
- `created_at`: `TIMESTAMP WITH TIME ZONE` | **NOT NULL**, **DEFAULT** `CURRENT_TIMESTAMP`
- `resolved_at`: `TIMESTAMP WITH TIME ZONE` | Nullable (set on transition to `RESOLVED`)
- `sla_due_at`: `TIMESTAMP WITH TIME ZONE` | Computed target deadline (`created_at + default_sla_hours`)

### 8. `assignment`
Records dispatch of a complaint to a technician by an administrator.
- `assignment_id`: `SERIAL` | **PRIMARY KEY**
- `complaint_id`: `INT` | **NOT NULL**, **FOREIGN KEY** $\rightarrow$ `complaint(complaint_id)` (`ON DELETE CASCADE`)
- `staff_id`: `INT` | **NOT NULL**, **FOREIGN KEY** $\rightarrow$ `staff(staff_id)` (`ON DELETE RESTRICT`)
- `assigned_at`: `TIMESTAMP WITH TIME ZONE` | **NOT NULL**, **DEFAULT** `CURRENT_TIMESTAMP`
- `assigned_by`: `INT` | **NOT NULL**, **FOREIGN KEY** $\rightarrow$ `app_user(user_id)` (`ON DELETE RESTRICT`)

### 9. `status_history`
Audit trail recording every state change in a complaint's lifecycle.
- `history_id`: `SERIAL` | **PRIMARY KEY**
- `complaint_id`: `INT` | **NOT NULL**, **FOREIGN KEY** $\rightarrow$ `complaint(complaint_id)` (`ON DELETE CASCADE`)
- `old_status`: `complaint_status` | Nullable (NULL upon initial submission)
- `new_status`: `complaint_status` | **NOT NULL**
- `changed_by`: `INT` | Nullable (allows automated system transitions), **FOREIGN KEY** $\rightarrow$ `app_user(user_id)` (`ON DELETE SET NULL`)
- `remarks`: `TEXT` | Nullable
- `changed_at`: `TIMESTAMP WITH TIME ZONE` | **NOT NULL**, **DEFAULT** `CURRENT_TIMESTAMP`

### 10. `attachment`
File uploads and photographic evidence associated with complaints.
- `attachment_id`: `SERIAL` | **PRIMARY KEY**
- `complaint_id`: `INT` | **NOT NULL**, **FOREIGN KEY** $\rightarrow$ `complaint(complaint_id)` (`ON DELETE CASCADE`)
- `file_url`: `VARCHAR(500)` | **NOT NULL**
- `file_type`: `VARCHAR(50)` | **NOT NULL**
- `uploaded_at`: `TIMESTAMP WITH TIME ZONE` | **NOT NULL**, **DEFAULT** `CURRENT_TIMESTAMP`

### 11. `comment`
Communication thread between complainant, technician, and administrative staff.
- `comment_id`: `SERIAL` | **PRIMARY KEY**
- `complaint_id`: `INT` | **NOT NULL**, **FOREIGN KEY** $\rightarrow$ `complaint(complaint_id)` (`ON DELETE CASCADE`)
- `author_id`: `INT` | **NOT NULL**, **FOREIGN KEY** $\rightarrow$ `app_user(user_id)` (`ON DELETE RESTRICT`)
- `body`: `TEXT` | **NOT NULL**
- `created_at`: `TIMESTAMP WITH TIME ZONE` | **NOT NULL**, **DEFAULT** `CURRENT_TIMESTAMP`

### 12. `audit_log`
System-wide security and administrative compliance ledger.
- `log_id`: `SERIAL` | **PRIMARY KEY**
- `user_id`: `INT` | Nullable, **FOREIGN KEY** $\rightarrow$ `app_user(user_id)` (`ON DELETE SET NULL`)
- `action`: `VARCHAR(100)` | **NOT NULL** (e.g., `CREATE`, `ASSIGN`, `STATUS_CHANGE`, `DELETE`)
- `entity`: `VARCHAR(50)` | **NOT NULL** (target table name)
- `entity_id`: `VARCHAR(50)` | **NOT NULL** (target record key)
- `created_at`: `TIMESTAMP WITH TIME ZONE` | **NOT NULL**, **DEFAULT** `CURRENT_TIMESTAMP`

### 13. `complaint_vector`
Stores semantic vector representations generated by `sentence-transformers/all-MiniLM-L6-v2`.
- `complaint_id`: `INT` | **PRIMARY KEY**, **FOREIGN KEY** $\rightarrow$ `complaint(complaint_id)` (`ON DELETE CASCADE`)
- `embedding`: `vector(384)` | **NOT NULL**
- *Vector Index:* Indexed via HNSW (`vector_cosine_ops`) for sub-millisecond semantic search.

---

## 5. Relationships & Cardinality Summary

| Relationship | Cardinality | Parent Table | Child Table | Foreign Key | Cascade Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Role $\rightarrow$ User** | $1 : N$ | `role` | `app_user` | `app_user.role_id` | `ON DELETE RESTRICT` |
| **User $\rightarrow$ Staff (Subtype)** | $1 : 1$ | `app_user` | `staff` | `staff.user_id` (UNIQUE) | `ON DELETE CASCADE` |
| **Department $\rightarrow$ Category** | $1 : N$ | `department` | `category` | `category.department_id` | `ON DELETE RESTRICT` |
| **User $\rightarrow$ Complaint** | $1 : N$ | `app_user` | `complaint` | `complaint.user_id` | `ON DELETE RESTRICT` |
| **Category $\rightarrow$ Complaint** | $1 : N$ | `category` | `complaint` | `complaint.category_id` | `ON DELETE RESTRICT` |
| **Location $\rightarrow$ Complaint** | $1 : N$ | `location` | `complaint` | `complaint.location_id` | `ON DELETE RESTRICT` |
| **Complaint $\rightarrow$ Assignment** | $1 : N$ | `complaint` | `assignment` | `assignment.complaint_id` | `ON DELETE CASCADE` |
| **Staff $\rightarrow$ Assignment** | $1 : N$ | `staff` | `assignment` | `assignment.staff_id` | `ON DELETE RESTRICT` |
| **User (Admin) $\rightarrow$ Assignment** | $1 : N$ | `app_user` | `assignment` | `assignment.assigned_by` | `ON DELETE RESTRICT` |
| **Complaint $\rightarrow$ Status History** | $1 : N$ | `complaint` | `status_history` | `status_history.complaint_id` | `ON DELETE CASCADE` |
| **User $\rightarrow$ Status History** | $1 : N$ | `app_user` | `status_history` | `status_history.changed_by` | `ON DELETE SET NULL` |
| **Complaint $\rightarrow$ Attachment** | $1 : N$ | `complaint` | `attachment` | `attachment.complaint_id` | `ON DELETE CASCADE` |
| **Complaint $\rightarrow$ Comment** | $1 : N$ | `complaint` | `comment` | `comment.complaint_id` | `ON DELETE CASCADE` |
| **User $\rightarrow$ Comment** | $1 : N$ | `app_user` | `comment` | `comment.author_id` | `ON DELETE RESTRICT` |
| **User $\rightarrow$ Audit Log** | $1 : N$ | `app_user` | `audit_log` | `audit_log.user_id` | `ON DELETE SET NULL` |
| **Complaint $\rightarrow$ Vector** | $1 : 1$ | `complaint` | `complaint_vector` | `complaint_vector.complaint_id` | `ON DELETE CASCADE` |

---

## 6. Verification and Integrity Check

1. **Third Normal Form (3NF)**:
   - All non-key attributes are fully functionally dependent on the primary key, and no transitive dependencies exist.
2. **Referential Integrity**:
   - Master data tables (`role`, `department`, `location`, `category`) use `RESTRICT` to prevent orphan complaints.
   - Child/transactional tables (`attachment`, `assignment`, `status_history`, `comment`, `complaint_vector`) cascade deletions when their parent complaint is removed.
3. **Auditability**:
   - `status_history` and `audit_log` permit `NULL` on user references to accommodate system triggers and background automated SLA escalations.

