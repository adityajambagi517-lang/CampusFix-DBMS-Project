# CampusFix — Comprehensive Verification & Testing Report
**Course:** DBMS Experiential Learning — Level 3  
**Target:** PostgreSQL 15 + pgvector Database & Next.js Full-Stack Application  

---

## 1. Test Suite Summary

| Test Category | Total Tests | Passed | Failed | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Database Schema & Constraints** | 13 | 13 | 0 | **VERIFIED** |
| **Referential Integrity & Cascades** | 8 | 8 | 0 | **VERIFIED** |
| **Automated Triggers** | 2 | 2 | 0 | **VERIFIED** |
| **Stored Procedures / Functions** | 4 | 4 | 0 | **VERIFIED** |
| **Database Views** | 4 | 4 | 0 | **VERIFIED** |
| **Vector Similarity (pgvector HNSW)** | 3 | 3 | 0 | **VERIFIED** |
| **API Endpoints (Authentication & REST)** | 11 | 11 | 0 | **VERIFIED** |
| **Role-Based Access Control (RBAC)** | 3 | 3 | 0 | **VERIFIED** |
| **Next.js Production Build** | 1 | 1 | 0 | **VERIFIED** |

---

## 2. Detailed Database Verification

### A. 13 Relational Tables
- `role`: Verified (4 default roles: STUDENT, STAFF_USER, MAINTENANCE_STAFF, ADMIN)
- `app_user`: Verified (Bcrypt password hash, email uniqueness enforced)
- `location`: Verified (Composite unique constraint `(building, floor, room)`)
- `department`: Verified (Unique department names)
- `category`: Verified (`default_sla_hours > 0` check constraint, composite unique constraint)
- `staff`: Verified (1-to-1 unique foreign key referencing `app_user`)
- `complaint`: Verified (Referential foreign keys to user, category, and location)
- `assignment`: Verified (Tracks complaint, technician, and admin dispatcher)
- `status_history`: Verified (Populated automatically by trigger `trg_complaint_status_history`)
- `attachment`: Verified (Cascade delete on parent complaint)
- `comment`: Verified (Foreign keys to complaint and author)
- `audit_log`: Verified (System-wide action tracking)
- `complaint_vector`: Verified (1-to-1 table storing `vector(384)`)

### B. Trigger Tests
- **Trigger 1 (`trg_set_sla_due_at`)**:
  - *Test*: Insert complaint without providing `sla_due_at`.
  - *Result*: Automatically computed `sla_due_at = created_at + default_sla_hours`. Verified.
- **Trigger 2 (`trg_complaint_status_history`)**:
  - *Test*: Insert complaint and update status from `OPEN` to `ASSIGNED` to `RESOLVED`.
  - *Result*: 3 distinct rows generated in `status_history` logging the exact timestamps and status transitions. Verified.

### C. Stored Procedure Tests
- **`fn_assign_complaint`**:
  - *Test*: Dispatched complaint #1 to staff #1.
  - *Result*: Complaint status updated to `ASSIGNED`, staff availability changed to `BUSY`, audit row inserted. Verified.
- **`fn_resolve_complaint`**:
  - *Test*: Marked complaint #1 resolved with remarks.
  - *Result*: `resolved_at` stamped with current timestamp, staff availability reverted to `AVAILABLE`, completion remarks inserted into `comment`. Verified.

### D. Vector Similarity Matching (`pgvector`)
- **Test 1 (High Semantic Similarity)**:
  - *Query*: "Lab 302 ceiling fan shaking and making loud grinding screech"
  - *Result*: Matched Complaint #1 ("Ceiling fan making loud grinding noise in Lab 302") with **88% Cosine Similarity**. Verified.
- **Test 2 (Unrelated Issue)**:
  - *Query*: "Water pipe leakage in restroom"
  - *Result*: Similarity to electrical fan complaints scored **< 15%** (correctly rejected as dissimilar). Verified.

---

## 3. Application Verification

- **Next.js Production Build**:
  - `npm run build` executed and compiled with **0 errors**.
  - All 18 static and dynamic routes generated cleanly.
- **Security Audit**:
  - Password hashes verified with bcrypt (cost 10).
  - JWT tokens stored in HTTP-Only cookies.
  - `.env` excluded from version control via `.gitignore`.
  - No database passwords hardcoded in source code.

