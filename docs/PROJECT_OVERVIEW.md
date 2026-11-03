# CampusFix — Project Overview & Academic Problem Statement
**Course:** DBMS Experiential Learning — Level 3  
**Project Title:** CampusFix — Campus Complaint & Maintenance Intelligence System  
**Option Chosen:** Option 2 — SQL (PostgreSQL 15) + Vector Database (`pgvector`)  
**Primary Contributor:** Aditya Basavaraj Jambagi (PES2UG24CS030)  

---

## 1. Problem Statement

Across higher educational institutions and large college campuses, thousands of physical assets—including laboratory instruments, classroom projection systems, high-speed Wi-Fi access points, ceiling fans, electrical switchboards, plumbing infrastructure, and study desks—are subjected to heavy daily usage. 

When equipment malfunctions, complaints are conventionally reported via disconnected or informal channels (such as physical logbooks, generic Google Forms, WhatsApp messages, or verbal requests to estate managers). This informal architecture causes severe systemic failures:
1. **Duplicate Complaint Overload**: Multiple students reporting the exact same breakdown (e.g. 5 students filing separate complaints about a flickering tube light in Lab 302) lead to duplicated work tickets, wasted administrative triage, and dispatch clutter.
2. **Lack of Objective Prioritization**: High-hazard issues (such as electrical sparks or flooding pipes) get buried in the same queue as cosmetic repairs (such as a squeaky door hinge).
3. **SLA Opacity & Tracking Void**: Students and faculty have no visibility into the resolution lifecycle, technician assignment, or expected turnaround times.
4. **Maintenance Blind Spots**: Campus administrators cannot easily aggregate historical incident patterns to detect recurring structural failures in specific buildings, floors, or equipment brands.

---

## 2. Proposed Solution: CampusFix

CampusFix provides an end-to-end, intelligent maintenance routing and infrastructure management platform that bridges relational rigor with modern vector embeddings:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Student/Faculty │       │   Technician    │       │ Campus Admin    │
│ Reporting Portal│       │   Workstation   │       │ Dispatch Center │
└────────┬────────┘       └────────┬────────┘       └────────┬────────┘
         │                         │                         │
         └─────────────────────────┼─────────────────────────┘
                                   │
                                   ▼
             ┌───────────────────────────────────────────┐
             │       Next.js 14 Web Application          │
             │   App Router • TypeScript • Tailwind CSS  │
             └─────────────────────┬─────────────────────┘
                                   │
                                   ▼
             ┌───────────────────────────────────────────┐
             │         Next.js API Route Handlers        │
             │   JWT Auth • RBAC • Vector Generation     │
             └─────────────────────┬─────────────────────┘
                                   │
                                   ▼
   ┌───────────────────────────────────────────────────────────────┐
   │                  PostgreSQL 15 Database                       │
   │  ┌─────────────────────────┐     ┌─────────────────────────┐  │
   │  │   Relational Schema     │     │    pgvector Extension   │  │
   │  │   13 Normalized Tables  │     │   384-D HNSW Index      │  │
   │  │   Triggers, Views, Procs│     │   Cosine Similarity     │  │
   │  └─────────────────────────┘     └─────────────────────────┘  │
   └───────────────────────────────────────────────────────────────┘
```

---

## 3. Project Objectives

1. **Relational Data Integrity**: Design and implement a robust 13-entity relational database in Third Normal Form (3NF) with enforced foreign key cascades, unique constraints, and check constraints.
2. **Semantic Similarity Intelligence**: Integrate the `pgvector` extension with 384-dimensional dense vectors to identify duplicate or related complaints at the moment of submission, reducing redundant work.
3. **Automated State Tracking**: Use database triggers to automatically record every complaint transition into an immutable audit table (`status_history`) and dynamically compute SLA deadlines (`sla_due_at`).
4. **Transactional Dispatch Operations**: Guarantee ACID properties during multi-table state mutations (dispatching technicians, updating availability, and logging audit events).
5. **Operational Analytics**: Aggregate real-time campus maintenance metrics through database views to identify departmental bottlenecks and physical infrastructure hotspots.
