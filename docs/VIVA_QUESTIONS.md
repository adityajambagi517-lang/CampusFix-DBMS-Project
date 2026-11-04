# CampusFix — Comprehensive Academic Viva Voce Questions & Answers
**Course:** DBMS Experiential Learning — Level 3  
**Project:** CampusFix — Campus Complaint & Maintenance Intelligence System  
**Option:** SQL (PostgreSQL 15) + Vector Database (`pgvector`)  

This document contains 50 comprehensive viva voce questions and precise answers covering every technical, theoretical, and architectural facet of CampusFix.

---

### Part 1: Relational Database Design & Normalization (Q1 – Q10)

**Q1: What is the primary real-world problem solved by CampusFix?**  
**A:** CampusFix centralizes campus maintenance complaints, eliminates duplicate tickets using semantic vector similarity search, automates SLA tracking via database triggers, and intelligently dispatches tasks to specialized technicians.

**Q2: How many entities are in the CampusFix relational schema?**  
**A:** Exactly 13 entities: `role`, `app_user`, `location`, `department`, `category`, `staff`, `complaint`, `assignment`, `status_history`, `attachment`, `comment`, `audit_log`, and `complaint_vector`.

**Q3: What normal form is the database design in, and why?**  
**A:** Third Normal Form (3NF). Every attribute is atomic (1NF), fully dependent on the primary key (2NF), and there are no transitive functional dependencies (3NF). Department is linked through category, not duplicated on complaint.

**Q4: How is the relationship between `app_user` and `staff` modeled?**  
**A:** As a 1-to-1 Subtype relationship. `staff.user_id` is a Foreign Key referencing `app_user.user_id` with a `UNIQUE` constraint and `ON DELETE CASCADE`. Only users with the `MAINTENANCE_STAFF` role have a record in `staff`.

**Q5: Why is `complaint` separated from `complaint_vector` into two tables?**  
**A:** Separation of concerns. High-dimensional vector columns (`vector(384)`) are wide and heavily accessed during mathematical distance calculations. Isolating them in `complaint_vector` keeps the transactional `complaint` table cache-friendly and compact for standard B-Tree queries.

**Q6: What is a surrogate key, and where is it used?**  
**A:** A surrogate key is an artificial, system-generated primary key without business meaning (such as `SERIAL` or `INT AUTO_INCREMENT`). CampusFix uses surrogate keys (`complaint_id`, `user_id`, etc.) for efficient joins and index storage.

**Q7: What composite constraints exist in the schema?**  
**A:** `location` has `UNIQUE(building, floor, room)` to prevent duplicate physical rooms. `category` has `UNIQUE(category_name, department_id)` to avoid duplicate categories within the same department.

**Q8: Explain the referential integrity rule on `complaint.category_id`.**  
**A:** It is defined with `ON DELETE RESTRICT`. This prevents accidental deletion of a category if complaints are actively linked to it.

**Q9: What is the purpose of the `status_history` table?**  
**A:** It provides an immutable, append-only chronological audit log of all status transitions (`old_status`, `new_status`, `changed_by`, `remarks`, `changed_at`).

**Q10: Why are `audit_log.user_id` and `status_history.changed_by` nullable?**  
**A:** Automated system operations (such as trigger-driven SLA escalations) occur without an active human user session. Allowing `NULL` ensures automated actions can be logged without violating foreign key constraints.

---

### Part 2: Vector Database & pgvector (Q11 – Q20)

**Q11: Why is a vector database needed in an infrastructure complaint system?**  
**A:** Complaints are written in free text. Different students describe the exact same breakdown with completely different words (e.g. "fan vibrating" vs "fan making grinding rattling noise"). Vector embeddings capture semantic meaning rather than exact keywords.

**Q12: Which embedding model does CampusFix use and what is its dimensionality?**  
**A:** `sentence-transformers/all-MiniLM-L6-v2`, producing dense floating-point vectors of exactly 384 dimensions.

**Q13: What distance metric is used to evaluate similarity between complaints?**  
**A:** Cosine Similarity, computed via the cosine distance operator `<=>` in pgvector. Similarity is calculated as `1 - (vector1 <=> vector2)`.

**Q14: What is the HNSW index and why is it preferred over IVFFlat?**  
**A:** HNSW (Hierarchical Navigable Small World) builds a multi-layer graph of vector points. It offers logarithmic search time $O(\log N)$, significantly higher recall, and does not require pre-clustering or a training phase like IVFFlat.

**Q15: How does pgvector index creation look in SQL?**  
**A:** `CREATE INDEX idx_complaint_vector_hnsw ON complaint_vector USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);`.

**Q16: What do the HNSW parameters `m` and `ef_construction` mean?**  
**A:** `m` (e.g., 16) is the maximum number of bidirectional connection links per node. `ef_construction` (e.g., 64) is the size of the dynamic candidate list evaluated during index construction. Higher values improve search accuracy at the cost of build time.

**Q17: Why do we normalize vector embeddings to unit length?**  
**A:** Normalizing vectors to unit length ($\|v\|_2 = 1$) makes cosine similarity equivalent to the dot product, maximizing mathematical calculation speed.

**Q18: What is the similarity threshold used in CampusFix?**  
**A:** A threshold of $0.65$ to $0.70$ (65%–70% similarity). Any existing complaints scoring above this threshold trigger a duplicate warning for the student.

**Q19: How are current complaints excluded during similarity search?**  
**A:** The query explicitly includes `WHERE cv.complaint_id != current_complaint_id` to prevent a complaint from matching with itself.

**Q20: Can pgvector handle hybrid relational and vector queries?**  
**A:** Yes. Unlike isolated vector databases, pgvector allows filtering by relational columns (e.g. `WHERE c.building = 'Tech Park' AND c.status = 'OPEN'`) in the exact same SQL statement as the vector distance calculation.

---

### Part 3: Advanced Database Concepts: Triggers, Procedures, Views (Q21 – Q30)

**Q21: Name the database triggers implemented in CampusFix.**  
**A:** 
1. `trg_complaint_status_history`: Automatically writes state transitions to `status_history` on INSERT or UPDATE.
2. `trg_set_sla_due_at`: Computes `sla_due_at = created_at + (category.default_sla_hours || ' hours')::INTERVAL` upon INSERT.

**Q22: What is the difference between a `BEFORE` trigger and an `AFTER` trigger?**  
**A:** A `BEFORE` trigger (like `trg_set_sla_due_at`) modifies `NEW` row values before they are written to disk. An `AFTER` trigger (like `trg_complaint_status_history`) runs after the parent row is safely committed to ensure related audit tables are updated.

**Q23: What does the stored procedure `fn_assign_complaint` do?**  
**A:** It atomically: 1) inserts a record into `assignment`, 2) updates `complaint.status = 'ASSIGNED'`, 3) updates `staff.availability_status = 'BUSY'`, and 4) logs the action in `audit_log`.

**Q24: What does the stored procedure `fn_resolve_complaint` do?**  
**A:** It updates `complaint.status = 'RESOLVED'`, sets `resolved_at = CURRENT_TIMESTAMP`, updates `staff.availability_status = 'AVAILABLE'`, and inserts technician resolution remarks into `comment`.

**Q25: What is the purpose of the `fn_escalate_overdue_complaints` stored procedure?**  
**A:** It identifies unresolved complaints where `CURRENT_TIMESTAMP > sla_due_at`, upgrades their priority to `'CRITICAL'`, marks their status as `'ESCALATED'`, and writes an escalation record to `audit_log`.

**Q26: Name the database views implemented in CampusFix.**  
**A:** 
1. `vw_complaint_details` (Comprehensive denormalized view)
2. `vw_department_workload` (Workload, resolution time, and SLA breach summary by department)
3. `vw_location_hotspots` (Chronic complaint counts by campus location)
4. `vw_staff_metrics` (Technician assignments, completed tasks, and average turnaround time)

**Q27: What is the primary benefit of using a View in an application?**  
**A:** Security and simplification. Complex multi-table joins and aggregation queries are centralized in the database; application code remains clean and query plans are easily optimized by DBAs.

**Q28: How does `vw_location_hotspots` identify recurring maintenance issues?**  
**A:** It groups complaints by `location_id`, `building`, `floor`, and `room`, applies `COUNT(complaint_id)`, and uses `HAVING COUNT(*) > 0 ORDER BY total_complaints DESC`.

**Q29: What is the difference between `WHERE` and `HAVING` in SQL?**  
**A:** `WHERE` filters individual rows *before* aggregation occurs. `HAVING` filters aggregated groups *after* the `GROUP BY` calculation has been evaluated.

**Q30: How are SLA breaches calculated dynamically in SQL?**  
**A:** Using a `CASE` expression: `CASE WHEN status IN ('RESOLVED', 'CLOSED') THEN 'RESOLVED' WHEN CURRENT_TIMESTAMP > sla_due_at THEN 'BREACHED' ELSE 'ON_TRACK' END`.

---

### Part 4: Transactions, Concurrency & Indexing (Q31 – Q40)

**Q31: What does ACID stand for?**  
**A:** Atomicity (all or nothing), Consistency (preserves database rules/constraints), Isolation (concurrent transactions do not interfere), Durability (committed data survives crashes).

**Q32: Where are ACID transactions strictly enforced in CampusFix?**  
**A:** During complaint submission (inserting into `complaint`, `complaint_vector`, and `audit_log`) and during technician assignment (updating `complaint`, inserting into `assignment`, updating `staff`). If any step fails, `ROLLBACK` undoes all modifications.

**Q33: How does the application implement transactions in Node.js?**  
**A:** Via the `withTransaction` utility in `src/lib/db.ts` which acquires a client from the connection pool, executes `BEGIN`, runs the user callback, executes `COMMIT`, or executes `ROLLBACK` on error, and finally releases the client.

**Q34: What is the default transaction isolation level in PostgreSQL?**  
**A:** `READ COMMITTED`, where a query only sees data committed before the query began.

**Q35: Why are foreign key columns explicitly indexed in PostgreSQL?**  
**A:** PostgreSQL automatically creates indexes for primary keys, but NOT for foreign keys. Indexing foreign keys (`idx_complaint_user`, `idx_complaint_category`, etc.) speeds up joins and prevents table locks during cascade operations.

**Q36: What is a B-Tree index and where is it used?**  
**A:** A self-balancing search tree supporting equality (`=`) and range queries (`<`, `>`, `BETWEEN`). Used on primary keys, foreign keys, timestamps (`created_at DESC`), and status fields.

**Q37: What is `EXPLAIN ANALYZE` in PostgreSQL?**  
**A:** A diagnostic command that parses, executes, and displays the query execution plan, showing actual execution time, node types (Index Scan vs. Seq Scan), and memory used.

**Q38: What is connection pooling and why is it used?**  
**A:** Creating a database connection is expensive (TCP handshake, authentication, process fork). A connection pool (`pg.Pool`) maintains reusable connections in memory to handle concurrent user requests efficiently.

**Q39: How does CampusFix protect against SQL Injection?**  
**A:** By exclusively using parameterized queries (`$1`, `$2`, `$3`) across all API routes and database helpers. Input values are sent separately from SQL code and treated strictly as literals by the parser.

**Q40: How does Full-Text Search in PostgreSQL differ from `LIKE '%keyword%'`?**  
**A:** `LIKE` performs a slow, sequential scan examining character substrings. PostgreSQL Full-Text Search uses `to_tsvector` and `to_tsquery` to parse text into normalized lexemes (stems), ignores stop words, and utilizes GIN indexes for sub-millisecond retrieval.

---

### Part 5: Full-Stack Architecture, Security & Workflow (Q41 – Q50)

**Q41: What technology stack is used for the frontend and backend?**  
**A:** Next.js 14 (App Router, Server Components, Route Handlers), TypeScript, Tailwind CSS, Lucide Icons, and `node-postgres` (`pg`).

**Q42: What user roles are supported in CampusFix?**  
**A:** 
1. `STUDENT` (Submit, view own tickets, duplicate alerts, comments)
2. `STAFF_USER` (Faculty/department user)
3. `MAINTENANCE_STAFF` (View assigned work orders, update status to In Progress, resolve tickets)
4. `ADMIN` (Campus-wide triage, smart dispatch, technician capacity, analytics)

**Q43: How is authentication implemented?**  
**A:** Passwords are encrypted using `bcrypt` (salt rounds: 10). Upon successful authentication, a signed JSON Web Token (JWT) is issued and stored in an HTTP-only, secure, SameSite cookie.

**Q44: Where is role-based authorization enforced?**  
**A:** On the server inside API Route Handlers. The token is decrypted, user role is checked against required permissions (e.g., verifying `roleName === 'ADMIN'` in `/api/complaints/[id]/assign`), and unauthorized requests are rejected with HTTP 403 Forbidden.

**Q45: Why is a dedicated application user (`campusfix_app`) created?**  
**A:** Principle of Least Privilege. The web application connects using `campusfix_app`, which has DML permissions on application tables but cannot drop the database or reconfigure PostgreSQL server settings.

**Q46: How does the Student Dashboard alert users to duplicate complaints?**  
**A:** As the user types their title and description, a debounced API call sends the text to `/api/complaints/similarity`. If existing complaints exceed the cosine similarity threshold, a warning card shows matching tickets and similarity percentages before submission.

**Q47: What happens when a technician clicks "Mark Task Resolved"?**  
**A:** An inline dialog captures technician remarks. A `PATCH` request invokes `fn_resolve_complaint`, which updates `complaint.status = 'RESOLVED'`, stamps `resolved_at`, sets staff availability back to `'AVAILABLE'`, and logs a comment.

**Q48: How does the Admin Dispatch center assist in assigning complaints?**  
**A:** Admins can view technician availability status (`AVAILABLE`, `BUSY`, `ON_LEAVE`) and current workload. Clicking "Assign" invokes `fn_assign_complaint` transactionally.

**Q49: How are environment variables managed securely?**  
**A:** Sensitive values (`DATABASE_URL`, `JWT_SECRET`) are stored in `.env`, which is ignored by `.gitignore`. A sanitized template [`.env.example`](file:///d:/DBMS/dbms%20team%20project/.env.example) is committed for version control.

**Q50: What future enhancements can be added to CampusFix?**  
**A:** Push notifications via WebSockets, mobile push alerts for field technicians, IoT sensor integration for automatic fault detection in power and water lines, and automated inventory tracking for replacement spare parts.

