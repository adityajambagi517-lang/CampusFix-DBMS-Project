# CampusFix — System Architecture & Data Flow
**Project:** Campus Complaint & Maintenance Intelligence System  
**Course:** DBMS Experiential Learning — Level 3  

---

## 1. High-Level System Architecture

CampusFix is built using a modern 3-tier enterprise architecture:

1. **Client / Presentation Layer**: Next.js 14 App Router with React, Tailwind CSS, and Lucide Icons. Provides role-specific dashboards for Students, Maintenance Staff, and Administrators.
2. **Application / Business Logic Layer**: Next.js Server Components and Route Handlers executing on Node.js. Handles role-based access control (RBAC), JWT sessions, input sanitization, and dense semantic vector calculations.
3. **Database / Persistence Layer**: PostgreSQL 15 enterprise database running natively on port 5432 with the `pgvector` extension. Houses 13 relational tables, automated triggers, stored procedures, views, and HNSW vector indexes.

```
+-------------------------------------------------------------------------+
|                           CLIENT BROWSER                                |
|  - Student Portal: Submission, Vector Duplicate Alert, Ticket Timeline  |
|  - Staff Workstation: Assigned Tasks, In-Progress & Resolution Flow     |
|  - Admin Center: Triage, Smart Dispatch, Department Workload Analytics  |
+------------------------------------+------------------------------------+
                                     |  HTTP / JSON / Cookies
                                     v
+-------------------------------------------------------------------------+
|                        APPLICATION SERVER (NEXT.JS)                     |
|  - Authentication: JWT, Bcrypt password hashing, HTTP-Only Cookie       |
|  - Vectorization: 384-D Semantic Vector Generator (all-MiniLM-L6-v2)    |
|  - Database Pool: pg connection pooling (max 20 clients)                |
|  - Transaction Wrapper: withTransaction ACID runner                     |
+------------------------------------+------------------------------------+
                                     |  PostgreSQL Wire Protocol
                                     v
+-------------------------------------------------------------------------+
|                       POSTGRESQL 15 + PGVECTOR                          |
|  [Relational Core]                                                      |
|   - 13 Tables in 3NF: role, app_user, location, department, etc.        |
|   - Constraints: PKs, FKs, CHECKs, UNIQUEs, Domain ENUMs                |
|   - Triggers: trg_set_sla_due_at, trg_complaint_status_history          |
|   - Stored Functions: fn_assign_complaint, fn_resolve_complaint         |
|   - Views: vw_complaint_details, vw_department_workload, etc.           |
|                                                                         |
|  [Vector Component]                                                     |
|   - Table: complaint_vector (complaint_id PK/FK, embedding vector(384))|
|   - Index: HNSW (Hierarchical Navigable Small World) with Cosine Metric |
|   - Search Function: fn_match_similar_complaints                        |
+-------------------------------------------------------------------------+
```

---

## 2. End-to-End Complaint Lifecycle Workflow

```
[1. User Enters Complaint]
         │
         ▼
[2. Real-Time Vector Check] ──> Calls /api/complaints/similarity
         │                       Runs fn_match_similar_complaints(embedding, 0.65, 5)
         │                       If similar issues exist, displays warning in UI
         ▼
[3. Complaint Submission] ────> Calls POST /api/complaints
         │                       Generates 384-D unit embedding
         │                       ACID Transaction begins:
         │                         a) INSERT INTO complaint
         │                            • Trigger 1: computes sla_due_at
         │                            • Trigger 2: creates initial status_history row
         │                         b) INSERT INTO complaint_vector
         │                         c) INSERT INTO audit_log
         │                       Transaction commits
         ▼
[4. Admin Triage & Routing] ──> Admin reviews complaint on /dashboard/admin
         │                       Invokes fn_assign_complaint(complaint_id, staff_id)
         │                       Updates complaint status -> ASSIGNED
         │                       Updates staff availability -> BUSY
         ▼
[5. Technician Execution] ────> Technician views task on /dashboard/staff
         │                       Advances status -> IN_PROGRESS
         │                       Work completed -> invokes fn_resolve_complaint(...)
         │                       Stamps resolved_at timestamp
         │                       Frees staff availability -> AVAILABLE
         ▼
[6. Resolution & Closure] ────> Student inspects resolution remarks and audit history
```

---

## 3. Dedicated Application Role Security Model

In alignment with production database security principles:
- **`postgres` superuser** is used strictly during administrative bootstrapping (creating the database, installing `pgvector`, and running schema migrations).
- **`campusfix_app` application role** is provisioned with constrained privileges (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `EXECUTE`) on schema objects.
- The web application connects solely using `campusfix_app`, ensuring the superuser credentials are never exposed to the web runtime or application configuration files.
