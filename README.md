# CampusFix — Campus Complaint & Maintenance Intelligence System
**DBMS Experiential Learning — Level 3 Project**  
**Team Member 1:** Aditya Basavaraj Jambagi (PES2UG24CS030)  
**Database Architecture:** Option 2 — Relational Database (PostgreSQL 15) + Vector Database (`pgvector`)

---

## 1. Project Overview

CampusFix is a centralized, AI-enhanced campus maintenance intelligence platform. It replaces manual, disorganized reporting channels with a structured relational backbone and natural language semantic similarity search.

### Real-World Problems Solved:
1. **Duplicate Complaint Elimination**: When multiple students report the same issue (e.g. broken fan in Lab 302 or Wi-Fi blackout in Lecture Hall 201), `pgvector` computes dense 384-dimensional cosine similarity across descriptions to alert users and administrators before duplicate work is scheduled.
2. **Automated SLA Tracking & Escalation**: PostgreSQL triggers automatically calculate resolution deadlines based on category severity and escalate overdue complaints.
3. **Smart Technician Routing**: Atomic dispatch procedures (`fn_assign_complaint`) route tickets to specialized technicians (Electrical, Plumbing, LAN/Network, Carpentry) and manage technician availability.
4. **Maintenance Analytics & Hotspots**: PostgreSQL views group recurring infrastructure failures by building, floor, room, and department to reveal chronic maintenance hotspots.

---

## 2. Advanced DBMS Concepts Implemented

| DBMS Concept | Implementation in CampusFix | File Reference |
| :--- | :--- | :--- |
| **Relational Schema (13 Entities)** | 3NF normalized tables: `role`, `app_user`, `location`, `department`, `category`, `staff`, `complaint`, `assignment`, `status_history`, `attachment`, `comment`, `audit_log`, `complaint_vector` | [`database/campusfix_schema.sql`](file:///d:/DBMS/dbms%20team%20project/database/campusfix_schema.sql) |
| **Vector Similarity (Semantic Search)** | 384-dimensional dense vectors (`vector(384)`) indexed using **HNSW** (`vector_cosine_ops`) for real-time duplicate matching (`fn_match_similar_complaints`) | [`database/campusfix_schema.sql`](file:///d:/DBMS/dbms%20team%20project/database/campusfix_schema.sql) & [`src/lib/vector.ts`](file:///d:/DBMS/dbms%20team%20project/src/lib/vector.ts) |
| **Triggers (Automation & Audit)** | `trg_complaint_status_history`: Automatically writes immutable state transitions to `status_history`.<br>`trg_set_sla_due_at`: Calculates SLA target deadline upon complaint insertion. | [`database/campusfix_advanced.sql`](file:///d:/DBMS/dbms%20team%20project/database/campusfix_advanced.sql) |
| **Stored Procedures / Functions** | `fn_assign_complaint`: Atomically assigns complaint, sets status to `ASSIGNED`, and updates technician status.<br>`fn_resolve_complaint`: Records work completion remarks, stamps timestamp, and frees technician.<br>`fn_match_similar_complaints`: Executes cosine distance query over vector embeddings. | [`database/campusfix_advanced.sql`](file:///d:/DBMS/dbms%20team%20project/database/campusfix_advanced.sql) |
| **Relational Views** | `vw_complaint_details`: Denormalized master view.<br>`vw_department_workload`: Aggregates active load, resolution turnaround, and SLA breach rate per department.<br>`vw_location_hotspots`: Pinpoints recurring breakdown zones on campus.<br>`vw_staff_metrics`: Tracks technician throughput and active assignments. | [`database/campusfix_advanced.sql`](file:///d:/DBMS/dbms%20team%20project/database/campusfix_advanced.sql) |
| **ACID Transactions** | Multi-statement transactional blocks (`withTransaction`) ensuring atomic updates across `complaint`, `complaint_vector`, and `audit_log`. | [`src/lib/db.ts`](file:///d:/DBMS/dbms%20team%20project/src/lib/db.ts) |
| **Security & RBAC** | Bcrypt password hashing, HTTP-only JWT sessions, role-based scoping (Student, Maintenance Staff, Admin), and dedicated application role (`campusfix_app`). | [`src/lib/auth.ts`](file:///d:/DBMS/dbms%20team%20project/src/lib/auth.ts) |

---

## 3. Demo Credentials for Evaluation

All demo accounts use the uniform password: **`Password@123`** (or click the One-Click Demo buttons on the `/login` page):

| Role | Name | Email | Default Dashboard |
| :--- | :--- | :--- | :--- |
| **Campus Admin** | Campus Administrator | `admin@campusfix.edu` | `/dashboard/admin` |
| **Maintenance Staff** | Rajesh Kumar (Electrician) | `rajesh.electrician@campusfix.edu` | `/dashboard/staff` |
| **Maintenance Staff** | Suresh Patil (Plumber) | `suresh.plumber@campusfix.edu` | `/dashboard/staff` |
| **Maintenance Staff** | Anita Desai (Network Eng) | `anita.network@campusfix.edu` | `/dashboard/staff` |
| **Student** | Aditya Jambagi | `aditya.student@campusfix.edu` | `/dashboard/student` |
| **Student** | Priya Sharma | `priya.student@campusfix.edu` | `/dashboard/student` |

---

## 4. Setup and Execution Instructions

### Step 1: Database Setup (PostgreSQL 15 + pgvector)
Run the automated database configuration script:
```powershell
# In PowerShell:
.\database\setup_db.bat
# Or directly with PowerShell:
powershell -ExecutionPolicy Bypass -File .\database\setup_db.ps1
```
The script will prompt for your local PostgreSQL `postgres` password securely (hidden input). It automatically:
1. Connects to PostgreSQL 15 on port 5432.
2. Creates the `campusfix_db` database.
3. Enables the `vector` extension.
4. Provisions the dedicated application user `campusfix_app` (so your superuser password is never stored).
5. Applies the 13 tables, constraints, indexes, triggers, stored functions, views, and seed data.
6. Writes a verified report to `docs/database_verification_report.md`.

### Step 2: Start the Next.js Web Application
```powershell
# Development mode:
npm run dev

# Or Production optimized build:
npm run build
npm start
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**.

---

## 5. Project Directory Structure

```
├── database/
│   ├── campusfix_schema.sql     # 13 tables, keys, constraints, pgvector HNSW index
│   ├── campusfix_advanced.sql   # Triggers, stored functions, and analytical views
│   ├── campusfix_seeds.sql      # Demo dataset with 384-D vector embeddings
│   ├── setup_db.ps1             # Automated interactive PowerShell setup script
│   ├── setup_db.bat             # Batch launcher for setup script
│   ├── campusfix_er.dbml        # DBML source for dbdiagram.io
│   └── init-db.sql              # Docker container initializer
├── docs/
│   ├── relational_schema.md     # Relational schema specifications
│   ├── CampusFix_ER_Diagram.png # Rendered ER diagram (Screenshot 1)
│   └── database_verification_report.md # Table row counts and test logs
├── src/
│   ├── app/
│   │   ├── api/                 # Next.js API Route Handlers (Auth, Complaints, Analytics, Similarity)
│   │   ├── dashboard/           # Student, Maintenance Staff, and Admin portals
│   │   ├── complaints/[id]/     # Complaint investigation view & history audit timeline
│   │   ├── analytics/           # PostgreSQL views dashboard
│   │   ├── login/ & register/   # Role-based authentication pages
│   │   ├── layout.tsx & page.tsx# Layout and landing page
│   ├── components/              # Shared UI components (Navbar, badges)
│   ├── lib/                     # Database pool (pg), JWT/bcrypt auth, vector calculation
│   └── types/                   # TypeScript interfaces
├── .env.example                 # Environment configuration template
├── package.json                 # Next.js 14, pg, bcryptjs, jsonwebtoken, lucide-react
└── README.md                    # Project documentation and evaluation guide
```

