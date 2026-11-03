# CampusFix — Academic Submission Screenshot Checklist
**Course:** DBMS Experiential Learning — Level 3  
**Target Submission Folder:** `docs/evidence/`  

Use this checklist to capture and organize the genuine screenshots required for your final report submission and viva demonstration.

---

### Screenshot Mapping Table

| No. | Evidence Item | Source Screen / Query | What Must Be Visible | Status in Project |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **ER Diagram** | dbdiagram.io export | All 13 entities, PKs, FKs, 1:1, 1:N relations | `docs/CampusFix_ER_Diagram.png` (Ready) |
| **2** | **Relational Schema** | DBML / Markdown view | Formal relational notation in 3NF | `docs/relational_schema.md` (Ready) |
| **3** | **PostgreSQL Service & Extension** | psql / Terminal | Output of `\dx` showing `vector` v0.7.4 installed in `campusfix_db` | Captured via `database/setup_db.bat` |
| **4** | **13 Tables Verification** | psql / Terminal | Output of `\dt` listing all 13 verified relations | Captured via `database/setup_db.bat` |
| **5** | **Login Page** | `http://localhost:3000/login` | Login form with One-Click Demo buttons for Student, Staff, Admin | Built in Next.js (Ready) |
| **6** | **Student Dashboard** | `http://localhost:3000/dashboard/student` | Active student complaints, status badges, and "+ Report New Issue" button | Built in Next.js (Ready) |
| **7** | **Complaint Form** | Student Dashboard Modal | Category, location, title, and priority selection fields | Built in Next.js (Ready) |
| **8** | **AI Vector Similarity Warning** | Real-time on Complaint Form | Amber warning banner showing "85% match" for duplicate issue in Lab 302 | Built in Next.js (Ready) |
| **9** | **Complaint Details & Audit Trail** | `http://localhost:3000/complaints/1` | Full complaint description, location, and right-hand trigger-backed history timeline | Built in Next.js (Ready) |
| **10** | **Maintenance Staff Workstation** | `http://localhost:3000/dashboard/staff` | Assigned work orders, SLA deadlines, "Start Work", and "Mark Resolved" buttons | Built in Next.js (Ready) |
| **11** | **Work Resolution Dialog** | Staff Workstation | Modal where technician types completion remarks before marking resolved | Built in Next.js (Ready) |
| **12** | **Admin Dispatch Center** | `http://localhost:3000/dashboard/admin` | Triage table, KPI stat cards, search filters, and "Assign" buttons | Built in Next.js (Ready) |
| **13** | **Technician Dispatch Operation** | Admin Dashboard Modal | Modal showing technician availability status (`AVAILABLE`, `BUSY`) and dispatch button | Built in Next.js (Ready) |
| **14** | **Analytics: Department Workload** | `http://localhost:3000/analytics` | Live table displaying data from PostgreSQL view `vw_department_workload` | Built in Next.js (Ready) |
| **15** | **Analytics: Infrastructure Hotspots** | `http://localhost:3000/analytics` | Live table displaying recurring problem zones from `vw_location_hotspots` | Built in Next.js (Ready) |
| **16** | **Trigger Execution Proof** | psql / SQL Terminal | Querying `SELECT * FROM status_history WHERE complaint_id = 1;` | Detailed in `ADVANCED_SQL_EXPLANATION.md` |
| **17** | **Vector Similarity SQL Output** | psql / SQL Terminal | Output of `SELECT * FROM fn_match_similar_complaints(...);` | Detailed in `ADVANCED_SQL_EXPLANATION.md` |

---

### Recommended Folder Structure for Screenshots
Store all captured image files in:
```
docs/
└── evidence/
    ├── 01_er_diagram.png
    ├── 02_relational_schema.png
    ├── 03_psql_extensions.png
    ├── 04_psql_tables.png
    ├── 05_login_page.png
    ├── 06_student_dashboard.png
    ├── 07_complaint_form.png
    ├── 08_vector_similarity_alert.png
    ├── 09_complaint_timeline.png
    ├── 10_staff_workstation.png
    ├── 11_staff_resolution_modal.png
    ├── 12_admin_dashboard.png
    ├── 13_admin_dispatch_modal.png
    ├── 14_analytics_department_workload.png
    ├── 15_analytics_location_hotspots.png
    ├── 16_trigger_status_history.png
    └── 17_vector_cosine_sql_result.png
```
