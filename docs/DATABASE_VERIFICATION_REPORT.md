# CampusFix — PostgreSQL 15 & pgvector Verification Report
**Course:** DBMS Experiential Learning — Level 3  
**Database:** PostgreSQL 15 (`campusfix_db`)  
**Extension:** `vector` (pgvector v0.7.4)  
**Dedicated Application Role:** `campusfix_app`  

---

## 1. Extension Verification
```sql
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
```
- **Status:** Installed & Enabled
- **Version:** `0.7.4`
- **Supported Vector Types:** `vector(384)`
- **Indexing Methods:** `HNSW` (Hierarchical Navigable Small World) & `IVFFlat`

---

## 2. Relational Tables Verification (13 Entities)

| No. | Table Name | Key Constraints | Foreign Keys | Status |
| :---: | :--- | :--- | :--- | :---: |
| 1 | `role` | PK (`role_id`), UNIQUE (`role_name`) | *None* | Verified |
| 2 | `app_user` | PK (`user_id`), UNIQUE (`email`) | FK $\rightarrow$ `role(role_id)` | Verified |
| 3 | `location` | PK (`location_id`), UNIQUE (`building, floor, room`) | *None* | Verified |
| 4 | `department` | PK (`department_id`), UNIQUE (`department_name`) | *None* | Verified |
| 5 | `category` | PK (`category_id`), CHECK (`default_sla_hours > 0`) | FK $\rightarrow$ `department(department_id)` | Verified |
| 6 | `staff` | PK (`staff_id`), UNIQUE (`user_id`) | FK $\rightarrow$ `app_user(user_id)` | Verified |
| 7 | `complaint` | PK (`complaint_id`) | FK $\rightarrow$ `app_user`, `category`, `location` | Verified |
| 8 | `assignment` | PK (`assignment_id`) | FK $\rightarrow$ `complaint`, `staff`, `app_user` | Verified |
| 9 | `status_history`| PK (`history_id`) | FK $\rightarrow$ `complaint`, `app_user` (nullable) | Verified |
| 10| `attachment` | PK (`attachment_id`) | FK $\rightarrow$ `complaint` (CASCADE) | Verified |
| 11| `comment` | PK (`comment_id`) | FK $\rightarrow$ `complaint` (CASCADE), `app_user` | Verified |
| 12| `audit_log` | PK (`log_id`) | FK $\rightarrow$ `app_user` (nullable) | Verified |
| 13| `complaint_vector`| PK/FK (`complaint_id`) | FK $\rightarrow$ `complaint(complaint_id)` (CASCADE) | Verified |

---

## 3. Database Objects Verification

### A. Triggers Active
- `trg_set_sla_due_at`: Evaluates category turnaround time and computes target SLA timestamp on insertion.
- `trg_complaint_status_history`: Automatically writes immutable state transition logs to `status_history`.

### B. Stored Functions Active
- `fn_assign_complaint(complaint_id, staff_id, admin_id)`: Dispatches complaint, sets status to `ASSIGNED`, marks technician `BUSY`.
- `fn_resolve_complaint(complaint_id, staff_id, remarks)`: Marks status `RESOLVED`, stamps `resolved_at`, marks technician `AVAILABLE`.
- `fn_escalate_overdue_complaints()`: Escalates tickets past their SLA target to `CRITICAL` / `ESCALATED`.
- `fn_match_similar_complaints(query_embedding, threshold, limit)`: Performs cosine distance query over `complaint_vector`.

### C. Views Active
- `vw_complaint_details`: Master denormalized view with joined reporter, category, department, location, technician, and SLA calculation.
- `vw_department_workload`: Departmental workload, open counts, in-progress counts, resolved counts, and average resolution time.
- `vw_location_hotspots`: Groups complaints by campus room/zone with `HAVING COUNT(*) > 0`.
- `vw_staff_metrics`: Technician capacities, active tasks, completed tasks, and average turnaround time.

### D. Vector Index Active
- `idx_complaint_vector_hnsw` on `complaint_vector USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)`.
