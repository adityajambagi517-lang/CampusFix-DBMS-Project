# CampusFix — Team Member Contributions & Work Distribution
**Course:** DBMS Experiential Learning — Level 3 Project  
**Section:** A / B  
**Project:** CampusFix — Campus Complaint & Maintenance Intelligence System  

---

## Team Overview

| Member Name | Student Registration Number (SRN) | Primary Responsibility |
| :--- | :--- | :--- |
| **Aditya Basavaraj Jambagi** | **PES2UG24CS030** | Database Architecture, Backend Integration & Security |
| **Team Member 2** | *(To be finalized by student)* | Frontend UI, Dashboard Integration & Analytics Reporting |

---

## Detailed Division of Responsibilities

### Aditya Basavaraj Jambagi (PES2UG24CS030)
#### Database Contributions:
- Formulated the Entity-Relationship (ER) model and mapped 13 entities to Third Normal Form (3NF).
- Authored the formal DBML schema file ([`database/campusfix_er.dbml`](file:///d:/DBMS/dbms%20team%20project/database/campusfix_er.dbml)).
- Wrote production PostgreSQL 15 DDL script ([`database/campusfix_schema.sql`](file:///d:/DBMS/dbms%20team%20project/database/campusfix_schema.sql)) with primary keys, foreign keys, cascades, unique constraints, and check constraints.
- Integrated the `pgvector` extension and designed the 384-dimensional HNSW index architecture.
- Developed database triggers (`trg_set_sla_due_at`, `trg_complaint_status_history`) and transactional stored functions (`fn_assign_complaint`, `fn_resolve_complaint`, `fn_match_similar_complaints`).
- Created automated PowerShell database setup automation ([`database/setup_db.ps1`](file:///d:/DBMS/dbms%20team%20project/database/setup_db.ps1)).

#### Application Contributions:
- Implemented the database connection pool (`pg.Pool`) and ACID transaction wrapper (`withTransaction`) in `src/lib/db.ts`.
- Built the JWT authentication and bcrypt password hashing service (`src/lib/auth.ts`).
- Created Next.js API Route Handlers for authentication, complaint transactions, technician assignments, comments, and semantic similarity.
- Configured application security (HTTP-only cookies, least privilege role `campusfix_app`, SQL injection immunity via parameterized queries).

---

### Team Member 2
#### Database Contributions:
- Designed and verified relational views (`vw_department_workload`, `vw_location_hotspots`, `vw_staff_metrics`, `vw_complaint_details`).
- Formulated realistic campus seed datasets across 5 departments, 8 campus zones, and diverse equipment failure scenarios.
- Prepared SQL demonstration queries covering JOINs, subqueries, `GROUP BY`, and `HAVING` clauses.

#### Application Contributions:
- Implemented modern Next.js 14 App Router UI pages using Tailwind CSS and Lucide icons.
- Built the Student Portal with real-time vector similarity warning alerts.
- Built the Maintenance Staff Workstation and Admin Dispatch Center interfaces.
- Developed the Analytics Dashboard visualizing PostgreSQL views and SLA breach rates.
- Co-authored comprehensive project documentation and viva preparation guides.

