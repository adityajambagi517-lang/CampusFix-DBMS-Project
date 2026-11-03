# CampusFix — 5–10 Minute Academic Demonstration Script
**Project:** Campus Complaint & Maintenance Intelligence System  
**Course:** DBMS Experiential Learning — Level 3  

This script outlines the exact live demonstration flow to present CampusFix to faculty, evaluators, and project examiners.

---

### Phase 1: Problem Statement & ER Diagram (1.5 Minutes)
1. **Show Slide / Document**: Open [`docs/PROJECT_OVERVIEW.md`](file:///d:/DBMS/dbms%20team%20project/docs/PROJECT_OVERVIEW.md) or [`CampusFix_ER_Diagram.png`](file:///d:/DBMS/dbms%20team%20project/CampusFix_ER_Diagram.png).
2. **Speaker Script**:
   > *"Good morning professors. We are demonstrating CampusFix, an intelligent maintenance and complaint routing system designed for large educational campuses. When equipment fails in labs or lecture halls, traditional reporting results in duplicate tickets, zero SLA accountability, and chaotic dispatch. CampusFix combines a 13-entity normalized relational database in PostgreSQL 15 with pgvector semantic similarity search to solve duplicate tickets and automate campus maintenance."*
3. **Point out the ER Diagram**:
   - Highlight the 13 tables in 3NF.
   - Point out the 1-to-1 Subtype relationship (`app_user` $\rightarrow$ `staff`).
   - Point out the 1-to-1 Vector extension (`complaint` $\rightarrow$ `complaint_vector`).
   - Show audit tables (`status_history`, `audit_log`).

---

### Phase 2: Student Experience & Real-Time Vector Duplicate Detection (2 Minutes)
1. **Navigate to**: `http://localhost:3000/login`
2. **Click Demo Login**: **Student: Aditya Jambagi** (`aditya.student@campusfix.edu`).
3. **Action**:
   - Arrive on `/dashboard/student`.
   - Click **"Report New Issue"**.
   - Select:
     - Category: `Electrical Maintenance — Ceiling Fan / AC Malfunction`
     - Location: `Tech Park — 3rd Floor, Lab 302`
     - Title: `Overhead fan vibrating heavily and making grinding noise`
     - Description: `The fan in Lab 302 is shaking violently and screeching.`
4. **Demonstrate AI Intelligence**:
   - Notice the amber alert card appearing automatically below the form:
     > *"Semantic Match Warning: Similar issue(s) already reported! (85% match: Ceiling fan making loud grinding noise in Lab 302)"*
   - **Speaker Script**:
     > *"Notice that as I typed, our Next.js backend converted the text into a 384-dimensional dense vector and queried PostgreSQL's pgvector HNSW index using cosine similarity. It detected that another student already reported a broken fan in this exact lab, warning the student in real time."*
5. **Submit Complaint**:
   - Click **"Submit Complaint"**. Show the new ticket appear in the list with `OPEN` status and calculated SLA target.

---

### Phase 3: Admin Triage & Transactional Dispatch (2 Minutes)
1. **Switch Role**: Log out and click **Admin: Campus Administrator** (`admin@campusfix.edu`).
2. **Arrive on**: `/dashboard/admin`.
3. **Demonstrate Features**:
   - Point out KPI cards (Filtered Total, Unassigned/Open, Active/Dispatched, Critical).
   - Use search bar to filter tickets by keyword or building.
4. **Action (Smart Dispatch)**:
   - Find the newly created complaint. Click **"Assign"**.
   - Show the dropdown displaying technician availability status (`AVAILABLE`, `BUSY`) and trade specialization.
   - Select **Rajesh Kumar (Electrician)**. Click **"Confirm Assignment"**.
5. **Speaker Script**:
   > *"This assignment executed our stored procedure `fn_assign_complaint` inside an ACID transaction: it inserted the assignment, updated the complaint status to ASSIGNED, updated Rajesh's status to BUSY, and logged the audit trail atomically."*

---

### Phase 4: Technician Workstation & Task Resolution (2 Minutes)
1. **Switch Role**: Log out and click **Staff: Rajesh (Electrician)** (`rajesh.electrician@campusfix.edu`).
2. **Arrive on**: `/dashboard/staff`.
3. **Demonstrate Workflow**:
   - Show the newly assigned task in Rajesh's queue.
   - Point out the SLA countdown badge and room location details.
   - Click **"Start Work (In Progress)"**. Show status change to `IN_PROGRESS`.
   - Click **"Mark Task Resolved"**.
   - Enter completion note: *"Replaced capacitor, aligned motor blades, verified smooth operation at speed 5."*
   - Click **"Submit Resolution"**.
4. **Speaker Script**:
   > *"Our stored procedure `fn_resolve_complaint` stamped the exact resolution time, posted Rajesh's notes to the comments thread, marked the complaint RESOLVED, and freed Rajesh back to AVAILABLE status in the database."*

---

### Phase 5: Trigger Audit History & Database Views (2 Minutes)
1. **Click**: **"View Discussion & History"** to open `/complaints/[id]`.
2. **Demonstrate Database Features**:
   - Point out the **Lifecycle Audit Trail** on the right side:
     - Shows initial submission (`OPEN`).
     - Shows admin assignment (`ASSIGNED`).
     - Shows work start (`IN_PROGRESS`).
     - Shows resolution (`RESOLVED`) with remarks.
     - **Speaker Script**: *"This timeline was populated entirely by PostgreSQL trigger `trg_complaint_status_history` on the database level, guaranteeing tamper-proof auditability."*
3. **Click Navbar**: **"Analytics & Views"** (`/analytics`).
   - Show the live **Department Workload** table populated by view `vw_department_workload`.
   - Show the **Infrastructure Maintenance Hotspots** table populated by view `vw_location_hotspots`.
   - Show the **Staff Throughput** metrics from `vw_staff_metrics`.

---

### Phase 6: Conclusion (30 Seconds)
> *"In summary, CampusFix fulfills all DBMS Level 3 requirements: 13 normalized tables in 3NF, pgvector 384-D cosine similarity search, triggers, stored functions, relational views, ACID transactions, and a responsive Next.js application. Thank you, and we are ready for your questions."*
