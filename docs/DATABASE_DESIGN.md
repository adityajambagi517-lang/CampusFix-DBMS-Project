# CampusFix — Database Design & Schema Architecture
**Course:** DBMS Experiential Learning — Level 3  
**Database Paradigm:** Relational (PostgreSQL 15) + Vector (`pgvector`)  

---

## 1. Relational Paradigm Justification

Relational databases are uniquely suited for the structured, mission-critical operations of campus infrastructure management:
- **Strong Referential Integrity**: Maintenance complaints reference physical locations, departments, categories, and registered users. Foreign key constraints ensure complaints cannot exist against non-existent campus locations or deleted categories.
- **ACID Transactions**: Dispatching a technician involves recording an assignment, mutating the complaint status to `ASSIGNED`, and setting the technician's availability to `BUSY`. These steps must succeed or fail as a single atomic unit.
- **Audit Trails**: Government and academic compliance requires immutable state transition history (`status_history`) and security logs (`audit_log`).
- **Normalized Master Data**: Locations (building, floor, room) and departments are normalized to Third Normal Form (3NF) to eliminate update anomalies.

---

## 2. Vector Paradigm Justification (`pgvector`)

Campus complaints are filed in natural language text (e.g., *"The overhead fan in Lab 302 makes a terrible grinding sound"* vs. *"Lab 302 ceiling fan vibrating violently and making mechanical screeching"*).
- Traditional exact string matching (`LIKE` or `=`) fails completely because the wording differs.
- Traditional full-text search (`tsvector` / `tsquery`) matches individual keywords (e.g. "fan"), but cannot distinguish semantic context or measure degree of similarity.
- **Dense Vector Embeddings (`all-MiniLM-L6-v2`)**: Convert text into 384-dimensional floating-point vectors capturing deep semantic meaning.
- Storing vectors directly in PostgreSQL via `pgvector` allows hybrid queries combining relational filters (e.g., `WHERE status = 'OPEN' AND building = 'Tech Park'`) with vector distance calculations (`ORDER BY embedding <=> query_vector`).

---

## 3. Entity Classification (13 Tables)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        1. MASTER / LOOKUP TABLES                       │
│  - role: Access roles (STUDENT, STAFF_USER, MAINTENANCE_STAFF, ADMIN)  │
│  - department: Campus divisions (Electrical, Plumbing, IT, Civil, Lab) │
│  - location: Campus physical hierarchy (building, floor, room, zone)   │
│  - category: Domain classifications with default SLA turnaround hours  │
├────────────────────────────────────────────────────────────────────────┤
│                        2. USER & SPECIALIZATION                        │
│  - app_user: User credentials, full name, email, and role foreign key  │
│  - staff: 1-to-1 Subtype of app_user storing trade specialization      │
├────────────────────────────────────────────────────────────────────────┤
│                        3. CORE TRANSACTIONAL ENTITY                    │
│  - complaint: Ticket title, description, priority, status, SLA due     │
├────────────────────────────────────────────────────────────────────────┤
│                        4. WORKFLOW & AUDIT TRAIL                       │
│  - assignment: Technicians dispatched by administrators                │
│  - status_history: Immutable audit record of each lifecycle change     │
│  - comment: Communication thread between student, staff, and admin     │
│  - attachment: Photographic evidence and file attachments              │
│  - audit_log: Security and system audit ledger                         │
├────────────────────────────────────────────────────────────────────────┤
│                        5. VECTOR INTELLIGENCE ENTITY                   │
│  - complaint_vector: 1-to-1 vector(384) embedding for semantic search │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Normalization Analysis (3NF Proof)

1. **First Normal Form (1NF)**:
   - Every column contains atomic values (no multi-valued attributes or repeating groups).
   - Every table possesses an explicit Primary Key (`role_id`, `user_id`, `complaint_id`, etc.).
2. **Second Normal Form (2NF)**:
   - The schema is in 1NF.
   - All non-key attributes are fully functionally dependent on the entire primary key (no partial dependencies on composite keys). For example, in `category`, `category_name` and `default_sla_hours` depend entirely on `category_id`.
3. **Third Normal Form (3NF)**:
   - The schema is in 2NF.
   - No transitive functional dependencies exist ($X \rightarrow Y \rightarrow Z$).
   - In `complaint`, the department is NOT stored directly; instead, `category_id` references `category`, which in turn references `department_id`. This prevents transitive update anomalies.

---

## 5. Indexing Architecture

- **Primary Key B-Tree Indexes**: Created automatically on all 13 primary key columns.
- **Foreign Key B-Tree Indexes**:
  - `idx_app_user_role` on `app_user(role_id)`
  - `idx_category_dept` on `category(department_id)`
  - `idx_complaint_user` on `complaint(user_id)`
  - `idx_complaint_category` on `complaint(category_id)`
  - `idx_complaint_location` on `complaint(location_id)`
  - `idx_assignment_complaint` on `assignment(complaint_id)`
  - `idx_assignment_staff` on `assignment(staff_id)`
  - `idx_status_history_complaint` on `status_history(complaint_id)`
- **Operational Query Filters**:
  - `idx_complaint_status` on `complaint(status)`
  - `idx_complaint_priority` on `complaint(priority)`
  - `idx_complaint_created_at` on `complaint(created_at DESC)`
- **Vector Search Index**:
  - `idx_complaint_vector_hnsw` on `complaint_vector(embedding vector_cosine_ops)` using **HNSW (Hierarchical Navigable Small World)** with parameters `m = 16`, `ef_construction = 64`. Provides logarithmic $O(\log N)$ nearest-neighbor query performance.
