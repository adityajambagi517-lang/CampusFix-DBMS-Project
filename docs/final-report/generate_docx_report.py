import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

DOC_PATH = r"d:\DBMS\dbms team project\docs\final-report\CampusFix_Final_DBMS_Report.docx"
ASSETS = r"d:\DBMS\dbms team project\docs\final-report\assets"

doc = docx.Document()

# Configure standard margins (1 inch)
for section in doc.sections:
    section.top_margin = Inches(1.0)
    section.bottom_margin = Inches(1.0)
    section.left_margin = Inches(1.0)
    section.right_margin = Inches(1.0)
    section.different_first_page_header_footer = True

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def add_p(text="", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=0, space_after=6, bold=False, italic=False, size=11, color=(30, 41, 59), font_name="Times New Roman"):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if text:
        r = p.add_run(text)
        r.bold = bold
        r.italic = italic
        r.font.name = font_name
        r.font.size = Pt(size)
        r.font.color.rgb = RGBColor(*color)
    return p

def add_h1(text):
    doc.add_page_break()
    return add_p(text, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=14, space_after=14, bold=True, size=16, color=(30, 58, 138))

def add_h2(text):
    return add_p(text, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=12, space_after=6, bold=True, size=13, color=(15, 23, 42))

def add_h3(text):
    return add_p(text, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=8, space_after=4, bold=True, italic=True, size=11, color=(30, 41, 59))

def add_code_block(code_text):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, "0F172A")
    set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.05
    run = p.add_run(code_text.strip())
    run.font.name = "Consolas"
    run.font.size = Pt(8.5)
    run.font.color.rgb = RGBColor(226, 232, 240)
    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(0)
    sp.paragraph_format.space_after = Pt(4)

def add_fig(img_name, caption_text, width_in=5.8):
    path = os.path.join(ASSETS, img_name)
    if not os.path.exists(path):
        path = os.path.join(r"d:\DBMS\dbms team project\docs", img_name)
    if os.path.exists(path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(4)
        run = p_img.add_run()
        run.add_picture(path, width=Inches(width_in))
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(0)
        p_cap.paragraph_format.space_after = Pt(12)
        r_cap = p_cap.add_run(caption_text)
        r_cap.font.name = "Times New Roman"
        r_cap.font.size = Pt(9.5)
        r_cap.font.italic = True
        r_cap.font.color.rgb = RGBColor(71, 85, 105)

def add_table_data(col_widths, headers, data):
    table = doc.add_table(rows=len(data) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, title in enumerate(headers):
        cell = table.cell(0, i)
        cell.text = title
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, top=90, bottom=90, left=100, right=100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.name = "Times New Roman"
            run.font.size = Pt(9.0)
            run.font.bold = True
            run.font.color.rgb = RGBColor(255, 255, 255)
    for r_idx, row_data in enumerate(data):
        row = table.rows[r_idx + 1]
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            cell = row.cells[c_idx]
            cell.text = str(val)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=65, bottom=65, left=100, right=100)
            p = cell.paragraphs[0]
            for run in p.runs:
                run.font.name = "Times New Roman"
                run.font.size = Pt(8.5)
                run.font.color.rgb = RGBColor(30, 41, 59)
    for row in table.rows:
        for i, w in enumerate(col_widths):
            row.cells[i].width = Inches(w)
    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(0)
    sp.paragraph_format.space_after = Pt(6)

print("Writing document content...")

# ==============================================================================
# 1. TITLE PAGE
# ==============================================================================
logo_path = os.path.join(ASSETS, "sample_0_image1.png")
if os.path.exists(logo_path):
    p_logo = doc.add_paragraph()
    p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_logo.paragraph_format.space_before = Pt(10)
    p_logo.paragraph_format.space_after = Pt(12)
    p_logo.add_run().add_picture(logo_path, width=Inches(1.8))

add_p("A Mini Project Report on", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=6, italic=True, size=12)
add_p("CampusFix — Campus Complaint & Maintenance Intelligence System", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=14, bold=True, size=18, color=(30, 58, 138))
add_p("Submitted in partial fulfilment of the requirements for the award of the degree of", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=4, size=10.5)
add_p("Bachelor of Technology", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=2, bold=True, size=13)
add_p("in", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=2, size=10.5)
add_p("Computer Science & Engineering", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=6, bold=True, size=13)
add_p("UE23CS351A – Database Management Systems Project", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=16, bold=True, size=11.5, color=(15, 23, 42))

add_p("Submitted by:", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=6, bold=True, size=11)
add_table_data([3.2, 3.2], ["Student Name", "SRN"], [
    ["Aditya Basavaraj Jambagi", "PES2UG24CS030"],
    ["Balaji Gowda S R", "PES2UG25CS804"]
])

add_p("Under the guidance of:", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=12, space_after=4, bold=True, size=11)
add_p("Dr. Shilpa S", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=2, bold=True, size=12)
add_p("Assistant Professor, Department of Computer Science & Engineering", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=2, size=10.5)
add_p("PES University, Bengaluru", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=16, size=10.5)

add_p("AUG – DEC 2026", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=12, bold=True, size=11)
add_p("DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING\nFACULTY OF ENGINEERING\nPES UNIVERSITY\n(Established under Karnataka Act No. 16 of 2013)\nElectronic City, Hosur Road, Bengaluru – 560 100, Karnataka, India", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=0, size=9.5, bold=True, color=(71, 85, 105))

# ==============================================================================
# 2. CERTIFICATE
# ==============================================================================
doc.add_page_break()
if os.path.exists(logo_path):
    p_logo = doc.add_paragraph()
    p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_logo.paragraph_format.space_before = Pt(4)
    p_logo.paragraph_format.space_after = Pt(8)
    p_logo.add_run().add_picture(logo_path, width=Inches(1.5))

add_p("PES UNIVERSITY", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=2, bold=True, size=14, color=(30, 58, 138))
add_p("(Established under Karnataka Act No. 16 of 2013)\nElectronic City, Hosur Road, Bengaluru – 560 100, Karnataka, India", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=18, size=9.5)
add_p("CERTIFICATE", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=6, space_after=16, bold=True, size=16, color=(15, 23, 42))

add_p("This is to certify that the mini project entitled \"CampusFix — Campus Complaint & Maintenance Intelligence System\" is a bonafide work carried out by:", space_before=6, space_after=12, size=11)
add_table_data([3.2, 3.2], ["Student Name", "SRN"], [
    ["Aditya Basavaraj Jambagi", "PES2UG24CS030"],
    ["Balaji Gowda S R", "PES2UG25CS804"]
])

add_p("in partial fulfilment for the completion of fifth semester DBMS Project (UE23CS351A) in the Program of Study — Bachelor of Technology in Computer Science and Engineering under the rules and regulations of PES University, Bengaluru during the period AUG 2026 – DEC 2026. It is certified that all corrections/suggestions indicated for internal assessment have been incorporated in the report. The project has been approved as it satisfies the 5th semester academic requirements in respect of project work.", space_before=8, space_after=36, size=10.5)

add_table_data([3.2, 3.2], ["Course Faculty Guide", "Chairperson, Department of CSE"], [
    ["\n\n___________________________\nDr. Shilpa S\nAssistant Professor\nDept of Computer Science & Engg", "\n\n___________________________\nDr. Sandesh B J\nProfessor & Chairperson\nDept of Computer Science & Engg"]
])

# ==============================================================================
# 3. DECLARATION
# ==============================================================================
doc.add_page_break()
add_p("DECLARATION", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=16, space_after=20, bold=True, size=16, color=(15, 23, 42))
add_p("We hereby declare that the DBMS Project entitled \"CampusFix — Campus Complaint & Maintenance Intelligence System\" has been carried out by us under the guidance of Dr. Shilpa S, Assistant Professor, Department of Computer Science and Engineering, PES University, Bengaluru, and submitted in partial fulfilment of the course requirements for the award of the degree of Bachelor of Technology in Computer Science and Engineering during the academic semester AUG – DEC 2026.", space_before=6, space_after=14, size=11)
add_p("We further declare that this report has not been submitted in part or full to any other University or Institution for the award of any degree or diploma. The software, database schemas, stored procedures, triggers, vector similarity indexing, and web interfaces reported herein represent our original work.", space_before=6, space_after=28, size=11)

add_table_data([2.6, 2.0, 1.8], ["Candidate Name", "SRN", "Signature"], [
    ["Aditya Basavaraj Jambagi", "PES2UG24CS030", "\n\n_______________"],
    ["Balaji Gowda S R", "PES2UG25CS804", "\n\n_______________"]
])

add_p("Date: 18-11-2026\nPlace: Bengaluru", space_before=24, space_after=6, size=10.5)

# ==============================================================================
# 4. ACKNOWLEDGEMENT
# ==============================================================================
doc.add_page_break()
add_p("ACKNOWLEDGEMENT", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=16, space_after=20, bold=True, size=16, color=(15, 23, 42))
add_p("We would like to express our profound gratitude to our project guide, Dr. Shilpa S, Assistant Professor, Department of Computer Science and Engineering, PES University, for her continuous guidance, intellectual feedback, and patient encouragement throughout the conceptualization, relational modeling, and execution of this UE23CS351A - DBMS Project.", space_before=6, space_after=10, size=11)
add_p("We take this opportunity to convey our heartfelt thanks to Dr. Sandesh B J, Professor and Chairperson, Department of Computer Science and Engineering, PES University, for providing the departmental infrastructure, technical environment, and academic support necessary for the completion of our experiential learning curriculum.", space_before=6, space_after=10, size=11)
add_p("We are deeply grateful to Prof. Jawahar Doreswamy, Chancellor, PES University, and Dr. Suryaprasad J, Vice-Chancellor, PES University, for their visionary leadership and for continuously fostering innovation, practical engineering rigor, and problem-based experiential learning across campus.", space_before=6, space_after=10, size=11)
add_p("Finally, this DBMS Project could not have been completed without the unfailing encouragement, patience, and moral support received from our parents, family members, and classmates.", space_before=6, space_after=20, size=11)
add_p("Aditya Basavaraj Jambagi (PES2UG24CS030)\nBalaji Gowda S R (PES2UG25CS804)", align=WD_ALIGN_PARAGRAPH.RIGHT, space_before=16, space_after=6, bold=True, size=10.5)

# ==============================================================================
# 5. ABSTRACT
# ==============================================================================
doc.add_page_break()
add_p("ABSTRACT", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=16, space_after=20, bold=True, size=16, color=(30, 58, 138))
add_p("Higher education campuses encompass diverse physical infrastructure—including computing laboratories, smart lecture halls, electrical networks, air conditioning systems, water fixtures, and student housing. In conventional university setups, maintenance complaints are gathered through informal channels (WhatsApp groups, paper logbooks, and fragmented web forms). This introduces four critical points of failure: duplicate complaint proliferation, subjective ticket prioritization, lack of Service Level Agreement (SLA) accountability, and absence of spatial maintenance intelligence.", space_before=6, space_after=10, size=11)
add_p("To resolve these challenges, this project presents CampusFix, an intelligent campus maintenance routing and infrastructure management platform developed for the Level 3 DBMS experiential learning curriculum under Option 2: SQL + Vector Database. CampusFix pairs a robust relational database (PostgreSQL 15) with an integrated natural language vector engine (pgvector). The relational core comprises 13 normalized tables in Third Normal Form (3NF), ensuring transactional integrity across user profiles, departmental specializations, locations, complaint lifecycles, and work order dispatches.", space_before=6, space_after=10, size=11)
add_p("To eliminate duplicate reporting, complaint descriptions are embedded into 384-dimensional dense semantic vectors using the all-MiniLM-L6-v2 model and stored in the complaint_vector entity. An HNSW cosine vector index (vector_cosine_ops) enables real-time sub-millisecond similarity queries, proactively alerting students and dispatchers whenever an issue has already been reported in the same vicinity.", space_before=6, space_after=10, size=11)
add_p("The database architecture implements advanced DBMS concepts: three automated PL/pgSQL triggers enforce category-based SLA deadlines (trg_set_sla_due_at), guarantee immutable state transition auditing (trg_complaint_status_history), and record autonomous resolution timestamps (trg_set_resolved_at). Atomic dispatching and technician state mutations are encapsulated in stored procedures (fn_assign_complaint, fn_resolve_complaint). Four analytical views (vw_complaint_details, vw_department_workload, vw_location_hotspots, vw_staff_metrics) aggregate real-time failure hot-spots. The system is accessed through a responsive Next.js 14 frontend integrating Tailwind CSS and an interactive 3D WebGL Digital Twin of the PES University Electronic City Campus built with Three.js.", space_before=6, space_after=16, size=11)
add_p("Keywords: PostgreSQL 15, pgvector, HNSW Indexing, Relational Schema (3NF), Triggers, Stored Procedures, Semantic Similarity, Next.js 14, Digital Twin.", space_before=6, space_after=6, italic=True, bold=True, size=10, color=(71, 85, 105))

# ==============================================================================
# 6. TABLE OF CONTENTS
# ==============================================================================
doc.add_page_break()
add_p("TABLE OF CONTENTS", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=16, space_after=18, bold=True, size=16, color=(30, 58, 138))
add_table_data([1.2, 4.4, 0.8], ["Chapter", "Title", "Page"], [
    ["—", "Certificate", "ii"],
    ["—", "Declaration", "iii"],
    ["—", "Acknowledgement", "iv"],
    ["—", "Abstract", "v"],
    ["—", "List of Tables", "vii"],
    ["—", "List of Figures", "viii"],
    ["1", "INTRODUCTION", "1"],
    ["2", "PROBLEM DEFINITION", "4"],
    ["3", "ER MODEL", "7"],
    ["4", "ER TO RELATIONAL MAPPING", "10"],
    ["5", "DDL STATEMENTS", "15"],
    ["6", "DML STATEMENTS", "22"],
    ["7", "QUERIES (GROUP BY, UPDATE, DELETE, CORRELATED, NESTED)", "27"],
    ["8", "STORED PROCEDURES, FUNCTIONS AND TRIGGERS", "34"],
    ["9", "FRONT END DEVELOPMENT", "42"],
    ["—", "REFERENCES", "48"],
    ["—", "APPENDIX A: DEFINITIONS, ACRONYMS & ABBREVIATIONS", "49"],
    ["—", "GITHUB REPOSITORY VERIFICATION", "50"]
])

# LIST OF TABLES
add_p("LIST OF TABLES", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=20, space_after=12, bold=True, size=14, color=(30, 58, 138))
add_table_data([1.2, 4.4, 0.8], ["Table No.", "Title", "Page"], [
    ["Table 2.1", "DBMS Level 3 Paradigm Justification (SQL vs Vector)", "5"],
    ["Table 2.2", "User Roles and Permission Capabilities", "6"],
    ["Table 3.1", "Entity Dictionary and Structural Attributes", "8"],
    ["Table 4.1", "Relational Mapping Traceability Matrix", "11"],
    ["Table 5.1", "Relational Entities and Key Schema Summary", "16"],
    ["Table 6.1", "Master Data Seed Counts Across 13 Relational Tables", "23"],
    ["Table 7.1", "Query Performance and Execution Telemetry", "32"],
    ["Table 8.1", "Stored Procedures and Trigger Inventory", "35"]
])

# LIST OF FIGURES
add_p("LIST OF FIGURES", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=20, space_after=12, bold=True, size=14, color=(30, 58, 138))
add_table_data([1.2, 4.4, 0.8], ["Figure No.", "Title", "Page"], [
    ["Figure 3.1", "Entity-Relationship (ER) Diagram for CampusFix", "9"],
    ["Figure 4.1", "Complete Relational Schema Mapping Diagram", "13"],
    ["Figure 5.1", "PostgreSQL Terminal Verification of Table DDL (\\dt)", "20"],
    ["Figure 6.1", "PostgreSQL DML Insertion and Active Records (SELECT)", "25"],
    ["Figure 7.1", "Execution of Query 7.1: Department Workload Aggregation", "28"],
    ["Figure 7.2", "Execution of Queries 7.2 & 7.3: Transactional Update & Delete", "30"],
    ["Figure 7.3", "Execution of Queries 7.4 & 7.5: Correlated & Nested Subqueries", "33"],
    ["Figure 8.1", "Execution of Stored Procedures & pgvector Cosine Search", "39"],
    ["Figure 8.2", "PostgreSQL Trigger Registration and Audit Trail History", "41"],
    ["Figure 9.1", "CampusFix Public Homepage & 3D Campus Digital Twin", "44"],
    ["Figure 9.2", "CampusFix Student, Staff, and Admin Operational Portals", "46"]
])

# ==============================================================================
# CHAPTER 1: INTRODUCTION
# ==============================================================================
add_h1("1. INTRODUCTION")

add_h2("1.1 Background & Context")
add_p("Modern educational institutions operate as complex mini-cities. Campus facilities feature extensive academic infrastructure, specialized scientific laboratories, computing clusters, lecture amphitheaters, residential hostels, dining facilities, and athletic grounds. At PES University, thousands of students, faculty members, administrative staff, and technicians interact with tens of thousands of physical assets daily. These assets range from high-voltage switchboards, centralized HVAC chillers, and multimedia projectors to Wi-Fi access points, plumbing lines, and laboratory equipment.")
add_p("Maintaining this physical environment in peak operational condition is essential for academic continuity and student safety. When maintenance breakdowns occur—such as an overhead fan failure in Lab 302, a short circuit in Academic Block A, or a Wi-Fi blackout during an examination—timely reporting, triage, and resolution are vital.")

add_h2("1.2 Motivation")
add_p("In conventional university environments, complaints are handled through manual logbooks, localized WhatsApp chats, or ad-hoc Google Forms. This informal reporting architecture leads to severe bottlenecks: multiple students report the same broken fixture; high-hazard emergencies compete with minor cosmetic issues; technicians are dispatched without clear routing; and management lacks visibility into chronic failure hotspots.")
add_p("Database Management Systems provide the ideal mathematical and operational foundation to solve this problem. By implementing relational database constraints, ACID transactions, database triggers, stored procedures, and semantic vector similarity search, campus maintenance can be converted from a reactive, chaotic process into a predictable, data-driven intelligence platform.")

add_h2("1.3 Project Objectives")
add_p("The primary objective of CampusFix is to design and develop a high-integrity, automated campus maintenance intelligence platform that satisfies the Level 3 DBMS curriculum requirements:")
add_p("1. Relational Integrity: Architect a 13-entity relational schema in Third Normal Form (3NF) that completely prevents update, insertion, and deletion anomalies while maintaining strict referential integrity.")
add_p("2. Semantic AI Intelligence: Incorporate pgvector with 384-dimensional dense vectors to detect duplicate or related complaints at the moment of entry, eliminating redundant technician dispatches.")
add_p("3. Autonomous Database Automation: Utilize PL/pgSQL triggers to compute SLA target deadlines on insertion, generate immutable state-history audit trails on status transitions, and stamp resolution timestamps.")
add_p("4. Transactional Reliability: Implement stored procedures (fn_assign_complaint, fn_resolve_complaint) with ACID transactions to guarantee atomic state mutation across technician dispatch workflows.")
add_p("5. Spatial & Analytical Insights: Construct database views to calculate departmental throughput and map chronic infrastructure hotspots.")
add_p("6. Production Web Interface: Build a responsive Next.js 14 web application featuring an interactive 3D WebGL Digital Twin of the PES University Electronic City Campus.")

add_h2("1.4 Scope of the System")
add_p("The initial deployment scope focuses on the core campus maintenance ecosystem across six operational departments (Electrical Maintenance, Plumbing & Sanitation, IT Infrastructure & Network, Civil & Furniture, and Lab Equipment). The physical scope models five campus buildings: Tech Park, Academic Block A, Central Library, Boys Hostel Block 1, and Girls Hostel Block 2.")

# ==============================================================================
# CHAPTER 2: PROBLEM DEFINITION
# ==============================================================================
add_h1("2. PROBLEM DEFINITION")

add_h2("2.1 Domain Analysis & Context")
add_p("Campus facilities management involves distinct operational actors: students and faculty who report issues; technicians with specific skills (electrical, plumbing, network, civil); and administrators who allocate budgets, manage inventories, and monitor SLA compliance. Because incidents occur asynchronously across hundreds of rooms, manual logging fails to track state transitions effectively.")

add_h2("2.2 Shortcomings of Existing Systems")
add_p("Existing campus complaint mechanisms suffer from four structural limitations:")
add_p("• Duplicate Complaint Clutter: When a projector fails in an auditorium, 10 students may submit separate tickets. Without semantic similarity search, staff must manually identify and delete duplicates.")
add_p("• Lack of Objective Prioritization: Critical electrical hazards are handled in the same FIFO queue as a wobbly desk, delaying urgent safety repairs.")
add_p("• SLA Opacity & Tracking Void: Complainants have no way to know whether their issue was assigned or when it will be fixed, leading to repeated calls and frustration.")
add_p("• Absence of Analytical Intelligence: Historical complaint logs are rarely analyzed, meaning recurring breakdowns of faulty equipment batches are never systematically identified.")

add_h2("2.3 Formal Problem Statement")
add_p("To design, model, and implement an automated, multi-paradigm database system (Option 2: SQL + Vector Database) that provides centralized complaint logging, 384-dimensional semantic duplicate detection, autonomous SLA tracking, atomic technician assignment, and spatial hotspot analytics through a secure web application.")

add_h2("2.4 User Roles & Functional Capabilities")
add_p("CampusFix enforces strict Role-Based Access Control (RBAC) across three primary user personas:")
add_table_data([1.6, 2.0, 2.8], ["Role", "Actor", "Key System Permissions"], [
    ["STUDENT / STAFF_USER", "Aditya, Priya, Faculty", "Submit complaints, track ticket progress, view SLA timers, upvote duplicate tickets, and review resolution remarks."],
    ["MAINTENANCE_STAFF", "Rajesh (Electrician), Suresh (Plumber), Anita (Network)", "Access personal work order queue, view building/room coordinates, update work status (IN_PROGRESS), and execute atomic resolution."],
    ["ADMIN", "Campus Estate Administrator", "Triage master queue, dispatch technicians via stored procedures, manage locations and categories, and analyze departmental failure hotspots."]
])

add_h2("2.5 Database Paradigm Justification (Option 2: SQL + Vector Database)")
add_p("In accordance with Section 3 of the PES University DBMS Level 3 Project Guidelines, CampusFix combines Relational SQL with a Vector Database:")
add_table_data([1.5, 1.5, 1.8, 1.6], ["Paradigm", "Engine", "Target Entities", "Engineering Justification"], [
    ["Relational SQL", "PostgreSQL 15", "role, app_user, location, department, category, staff, complaint, assignment, status_history, comment, audit_log", "Enforces ACID properties, relational normalization (3NF), foreign key cascades, complex join aggregation, and trigger constraints."],
    ["Vector Database", "PostgreSQL + pgvector", "complaint_vector (384-D vector with HNSW index)", "Enables semantic cosine similarity search over unstructured text, recognizing duplicates even when phrasing differs."]
])

# ==============================================================================
# CHAPTER 3: ER MODEL
# ==============================================================================
add_h1("3. ER MODEL")

add_h2("3.1 Entity Identification & Data Dictionary")
add_p("The operational requirements of CampusFix were decomposed into 13 distinct entities:")
add_table_data([1.4, 1.6, 3.4], ["Entity", "Primary Key", "Attributes & Foreign Keys"], [
    ["role", "role_id (PK)", "role_name (ENUM: STUDENT, STAFF_USER, MAINTENANCE_STAFF, ADMIN, UNIQUE)"],
    ["app_user", "user_id (PK)", "full_name, email (UNIQUE), password_hash, role_id (FK -> role), created_at"],
    ["location", "location_id (PK)", "building, floor, room, zone, UNIQUE(building, floor, room)"],
    ["department", "department_id (PK)", "department_name (UNIQUE), description"],
    ["category", "category_id (PK)", "category_name, department_id (FK -> department), default_sla_hours (CHECK > 0)"],
    ["staff", "staff_id (PK)", "user_id (FK -> app_user, UNIQUE), specialization, availability_status (ENUM)"],
    ["complaint", "complaint_id (PK)", "title, description, user_id (FK), category_id (FK), location_id (FK), status, priority, created_at, resolved_at, sla_due_at"],
    ["assignment", "assignment_id (PK)", "complaint_id (FK), staff_id (FK), assigned_at, assigned_by (FK -> app_user)"],
    ["status_history", "history_id (PK)", "complaint_id (FK), old_status, new_status, changed_by (FK), remarks, changed_at"],
    ["attachment", "attachment_id (PK)", "complaint_id (FK), file_url, file_type, uploaded_at"],
    ["comment", "comment_id (PK)", "complaint_id (FK), author_id (FK -> app_user), body, created_at"],
    ["audit_log", "log_id (PK)", "user_id (FK), action, entity, entity_id, created_at"],
    ["complaint_vector", "complaint_id (PK/FK)", "embedding vector(384) with HNSW cosine similarity index"]
])

add_h2("3.2 Relationship Cardinalities & Business Rules")
add_p("The interactions between entities follow strict relational cardinalities:")
add_p("• role 1 — M app_user: Each role applies to many users; each user has exactly one authorization role.")
add_p("• app_user 1 — M complaint: A student can report multiple complaints over time; each complaint has one reporter.")
add_p("• location 1 — M complaint: A physical campus location can experience multiple incidents; each complaint references one location.")
add_p("• department 1 — M category: A maintenance department oversees multiple issue categories (e.g., Electrical oversees Fans, Sockets, Lighting).")
add_p("• category 1 — M complaint: Each complaint belongs to exactly one category, inheriting its default SLA turnaround target.")
add_p("• app_user 1 — 1 staff: Specialization subtype; a maintenance user account links to exactly one technician profile.")
add_p("• complaint 1 — M assignment: A complaint may be assigned or reassigned across staff over time.")
add_p("• complaint 1 — M status_history: An immutable 1-to-many audit trail populated automatically by triggers.")
add_p("• complaint 1 — 1 complaint_vector: A 1-to-1 extension holding the 384-dimensional dense semantic embedding.")

add_h2("3.3 Entity-Relationship Diagram")
add_p("Figure 3.1 illustrates the complete Entity-Relationship diagram for CampusFix, documenting all entities, attributes, primary keys, foreign keys, and cardinalities.")
add_fig("campusfix_orig_p4_0.png", "Figure 3.1: Entity-Relationship (ER) Diagram for CampusFix", width_in=5.8)

# ==============================================================================
# CHAPTER 4: ER TO RELATIONAL MAPPING
# ==============================================================================
add_h1("4. ER TO RELATIONAL MAPPING")

add_h2("4.1 Steps of Mapping Algorithm for Chosen Problem")
add_p("The ER model was systematically converted into a relational schema following the 7-step mapping algorithm:")

add_h3("Step 1: Mapping of Regular (Strong) Entity Types")
add_p("For each strong entity type in the ER schema, we create a relation that includes all simple attributes. For composite keys, the set of constituent attributes forms the primary key:")
add_p("• ROLE(role_id PK, role_name)")
add_p("• LOCATION(location_id PK, building, floor, room, zone) with UNIQUE(building, floor, room)")
add_p("• DEPARTMENT(department_id PK, department_name, description)")

add_h3("Step 2: Mapping of Weak Entity Types")
add_p("CampusFix contains no composite-key weak entities. Supporting log entities (status_history, audit_log, attachment) maintain independent surrogate primary keys (SERIAL) combined with cascading foreign keys to prevent orphan rows.")

add_h3("Step 3: Mapping of Binary 1:1 Relationship Types")
add_p("Two binary 1:1 relationships exist in the design:")
add_p("1. app_user 1 — 1 staff: Modeled by placing user_id as a foreign key in staff with a UNIQUE constraint, creating an enforced 1-to-1 extension subtype.")
add_p("2. complaint 1 — 1 complaint_vector: Modeled by sharing the primary key; complaint_vector.complaint_id acts simultaneously as the PRIMARY KEY and FOREIGN KEY referencing complaint(complaint_id) with ON DELETE CASCADE.")

add_h3("Step 4: Mapping of Binary 1:N Relationship Types")
add_p("For each binary 1:N relationship, the primary key of the relation on the 1-side is placed as a foreign key in the relation on the N-side:")
add_p("• category includes department_id (FK referencing department)")
add_p("• app_user includes role_id (FK referencing role)")
add_p("• complaint includes user_id, category_id, and location_id (FKs referencing app_user, category, location)")
add_p("• status_history, attachment, and comment each include complaint_id (FK referencing complaint)")

add_h3("Step 5: Mapping of Binary M:N Relationship Types")
add_p("The relationship between complaints and technicians represents an M:N lifecycle (a complaint may be reassigned, and a technician works on multiple complaints over time). This is mapped by creating the cross-reference relation ASSIGNMENT(assignment_id PK, complaint_id FK, staff_id FK, assigned_at, assigned_by FK).")

add_h3("Step 6: Mapping of Multi-Valued Attributes")
add_p("Historical remarks and file attachments are normalized into separate tables (status_history and attachment) rather than arrays, preserving atomic attributes.")

add_h3("Step 7: Mapping of Vector Intelligence & Extension Subtypes")
add_p("The vector embedding component is mapped into a dedicated 1-to-1 table COMPLAINT_VECTOR(complaint_id PK/FK, embedding vector(384)) equipped with an HNSW cosine similarity index.")

add_h2("4.2 Complete Diagram of Relational Mapping")
add_p("Figure 4.1 shows the complete relational schema diagram, detailing primary keys, foreign key references, and relational links across all 13 tables.")
add_fig("campusfix_orig_p5_1.png", "Figure 4.1: Complete Relational Schema Mapping Diagram", width_in=5.8)

add_h2("4.3 Normalization Analysis")
add_p("The relational schema satisfies Third Normal Form (3NF):")
add_p("• First Normal Form (1NF): All attributes contain atomic, indivisible values. There are no repeating groups or multivalued arrays.")
add_p("• Second Normal Form (2NF): The schema is in 1NF, and all non-key attributes are fully functionally dependent on the entire primary key, eliminating partial dependencies.")
add_p("• Third Normal Form (3NF): The schema is in 2NF, and no non-key attribute is transitively dependent on the primary key. Attributes like department_name exist only in department, referenced in category by department_id.")

# ==============================================================================
# CHAPTER 5: DDL STATEMENTS
# ==============================================================================
add_h1("5. DDL STATEMENTS")

add_h2("5.1 Enumerated Types & Extension Initialization")
add_p("The database initializes the pgvector extension and establishes four custom domain ENUM types to enforce domain constraints at the database engine level:")
add_code_block("""CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE role_type AS ENUM ('STUDENT', 'STAFF_USER', 'MAINTENANCE_STAFF', 'ADMIN');
CREATE TYPE complaint_status AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED');
CREATE TYPE complaint_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE staff_availability AS ENUM ('AVAILABLE', 'BUSY', 'ON_LEAVE');""")

add_h2("5.2 Table Creation Statements")
add_p("The following DDL statements create the 13 relational tables in correct dependency order:")
add_code_block("""-- 1. ROLE & APP_USER
CREATE TABLE role (
    role_id SERIAL PRIMARY KEY,
    role_name role_type NOT NULL UNIQUE
);

CREATE TABLE app_user (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL REFERENCES role(role_id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. LOCATION, DEPARTMENT & CATEGORY
CREATE TABLE location (
    location_id SERIAL PRIMARY KEY,
    building VARCHAR(100) NOT NULL,
    floor VARCHAR(20) NOT NULL,
    room VARCHAR(50) NOT NULL,
    zone VARCHAR(100),
    CONSTRAINT uq_location UNIQUE (building, floor, room)
);

CREATE TABLE department (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE category (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL REFERENCES department(department_id) ON DELETE RESTRICT,
    default_sla_hours INT NOT NULL DEFAULT 24 CHECK (default_sla_hours > 0),
    CONSTRAINT uq_category_dept UNIQUE (category_name, department_id)
);

-- 3. STAFF & COMPLAINT
CREATE TABLE staff (
    staff_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES app_user(user_id) ON DELETE CASCADE,
    specialization VARCHAR(150) NOT NULL,
    availability_status staff_availability NOT NULL DEFAULT 'AVAILABLE'
);

CREATE TABLE complaint (
    complaint_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    user_id INT NOT NULL REFERENCES app_user(user_id) ON DELETE RESTRICT,
    category_id INT NOT NULL REFERENCES category(category_id) ON DELETE RESTRICT,
    location_id INT NOT NULL REFERENCES location(location_id) ON DELETE RESTRICT,
    status complaint_status NOT NULL DEFAULT 'OPEN',
    priority complaint_priority NOT NULL DEFAULT 'MEDIUM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    sla_due_at TIMESTAMP WITH TIME ZONE
);

-- 4. ASSIGNMENT, STATUS_HISTORY, ATTACHMENT, COMMENT, AUDIT_LOG
CREATE TABLE assignment (
    assignment_id SERIAL PRIMARY KEY,
    complaint_id INT NOT NULL REFERENCES complaint(complaint_id) ON DELETE CASCADE,
    staff_id INT NOT NULL REFERENCES staff(staff_id) ON DELETE RESTRICT,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT NOT NULL REFERENCES app_user(user_id) ON DELETE RESTRICT
);

CREATE TABLE status_history (
    history_id SERIAL PRIMARY KEY,
    complaint_id INT NOT NULL REFERENCES complaint(complaint_id) ON DELETE CASCADE,
    old_status complaint_status,
    new_status complaint_status NOT NULL,
    changed_by INT REFERENCES app_user(user_id) ON DELETE SET NULL,
    remarks TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attachment (
    attachment_id SERIAL PRIMARY KEY,
    complaint_id INT NOT NULL REFERENCES complaint(complaint_id) ON DELETE CASCADE,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comment (
    comment_id SERIAL PRIMARY KEY,
    complaint_id INT NOT NULL REFERENCES complaint(complaint_id) ON DELETE CASCADE,
    author_id INT NOT NULL REFERENCES app_user(user_id) ON DELETE RESTRICT,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_log (
    log_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES app_user(user_id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. COMPLAINT_VECTOR (Vector Intelligence 1-to-1 Extension)
CREATE TABLE complaint_vector (
    complaint_id INT PRIMARY KEY REFERENCES complaint(complaint_id) ON DELETE CASCADE,
    embedding vector(384) NOT NULL
);""")

add_h2("5.3 Operational & HNSW Vector Indexes")
add_p("To ensure high-throughput querying and sub-millisecond vector similarity search, the following B-Tree and HNSW indexes are created:")
add_code_block("""-- Foreign Key & Filter Indexes
CREATE INDEX idx_complaint_status ON complaint(status);
CREATE INDEX idx_complaint_priority ON complaint(priority);
CREATE INDEX idx_complaint_created_at ON complaint(created_at DESC);
CREATE INDEX idx_status_history_complaint ON status_history(complaint_id);

-- Hierarchical Navigable Small World (HNSW) Cosine Vector Index
CREATE INDEX idx_complaint_vector_hnsw ON complaint_vector 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);""")

add_h2("5.4 DDL Verification Screenshots")
add_p("Figure 5.1 displays the interactive PostgreSQL terminal output confirming successful creation and schema inspection (\\dt and \\d complaint) of all 13 relational tables.")
add_fig("fig_5_ddl_tables.png", "Figure 5.1: PostgreSQL Terminal Verification of Table DDL (\\dt and \\d complaint)", width_in=5.8)

# ==============================================================================
# CHAPTER 6: DML STATEMENTS
# ==============================================================================
add_h1("6. DML STATEMENTS")

add_h2("6.1 Master Data Seed Insertion")
add_p("The database was populated with structured seed data representing authentic PES University campus departments, categories, locations, technicians, and baseline tickets:")
add_code_block("""-- 1. ROLES & DEPARTMENTS
INSERT INTO role (role_name) VALUES 
('STUDENT'), ('STAFF_USER'), ('MAINTENANCE_STAFF'), ('ADMIN');

INSERT INTO department (department_name, description) VALUES
('Electrical Maintenance', 'Power distribution, lighting, fans, AC units, switchboards'),
('Plumbing & Sanitation', 'Water supply, washroom fixtures, drainage, water coolers'),
('IT Infrastructure & Network', 'Wi-Fi hotspots, classroom networking, smartboards, servers'),
('Civil & Furniture', 'Desks, doors, classroom benches, windows, structural repairs'),
('Lab Equipment', 'Scientific and engineering laboratory instruments');

-- 2. CATEGORIES WITH SLA
INSERT INTO category (category_name, department_id, default_sla_hours) VALUES
('Ceiling Fan / AC Malfunction', 1, 12),
('Switchboard Sparking / Dead Socket', 1, 6),
('Tube Light Flickering / Broken', 1, 8),
('Washroom Pipe Leakage / Tap Broken', 2, 6),
('Drinking Water Cooler Leaking', 2, 12),
('Campus Wi-Fi Unstable / No Internet', 3, 4),
('Ethernet Port Broken in Lab', 3, 8),
('Classroom Bench / Chair Damaged', 4, 24);

-- 3. LOCATIONS ACROSS PES UNIVERSITY CAMPUS
INSERT INTO location (building, floor, room, zone) VALUES
('Tech Park', '3rd Floor', 'Lab 302', 'East Wing'),
('Tech Park', '2nd Floor', 'Seminar Hall B', 'North Wing'),
('Tech Park', 'Ground Floor', 'Cafeteria', 'Central Zone'),
('Academic Block A', '1st Floor', 'Room 105', 'South Wing'),
('Academic Block A', '2nd Floor', 'Lecture Hall 201', 'East Wing'),
('Central Library', '1st Floor', 'Reading Room', 'Silent Zone'),
('Boys Hostel Block 1', '2nd Floor', 'Room 214', 'Hostel Zone'),
('Girls Hostel Block 2', '3rd Floor', 'Common Room', 'Hostel Zone');""")

add_h2("6.2 Transactional Complaint Insertion with Vector Embeddings")
add_p("When a complaint is submitted, it is transactionally recorded across complaint and complaint_vector:")
add_code_block("""-- Insert Complaint Record
INSERT INTO complaint (title, description, user_id, category_id, location_id, priority)
VALUES (
    'Lab 302 fan is vibrating violently and about to stop',
    'Middle fan in Lab 302 is vibrating heavily and making grinding mechanical screeching sounds. High risk of falling.',
    6, 1, 1, 'HIGH'
) RETURNING complaint_id;

-- Insert Corresponding 384-Dimensional Embedding Vector
INSERT INTO complaint_vector (complaint_id, embedding)
VALUES (5, '[-0.0412, 0.0815, -0.0124, ... 384 dimensions ...]'::vector);""")

add_h2("6.3 DML Verification Screenshots")
add_p("Figure 6.1 shows the live rows stored in the complaint and app_user tables, confirming successful DML ingestion.")
add_fig("fig_6_dml_inserted.png", "Figure 6.1: PostgreSQL DML Insertion and Active Records (SELECT * FROM complaint and app_user)", width_in=5.8)

# ==============================================================================
# CHAPTER 7: QUERIES
# ==============================================================================
add_h1("7. QUERIES")

add_h2("7.1 Simple Query with GROUP BY and Aggregate Functions")
add_p("This query aggregates total complaint volume, open backlogs, and critical safety hazards per maintenance department:")
add_code_block("""SELECT d.department_name, 
       COUNT(c.complaint_id) AS total_complaints,
       COUNT(CASE WHEN c.status = 'OPEN' THEN 1 END) AS open_tickets,
       COUNT(CASE WHEN c.priority = 'CRITICAL' THEN 1 END) AS critical_tickets
FROM department d
JOIN category cat ON d.department_id = cat.department_id
LEFT JOIN complaint c ON cat.category_id = c.category_id
GROUP BY d.department_id, d.department_name
HAVING COUNT(c.complaint_id) > 0
ORDER BY total_complaints DESC;""")
add_fig("fig_7_1_groupby.png", "Figure 7.1: Execution of Query 7.1: Department Workload Aggregation with GROUP BY and HAVING", width_in=5.8)

add_h2("7.2 UPDATE Operation")
add_p("Updates a complaint's state to IN_PROGRESS when a technician commences diagnostic work:")
add_code_block("""UPDATE complaint 
SET status = 'IN_PROGRESS'::complaint_status 
WHERE complaint_id = 7 
RETURNING complaint_id, status;""")

add_h2("7.3 DELETE Operation")
add_p("Demonstrates selective audit log maintenance by removing obsolete test records older than 30 days without violating foreign keys:")
add_code_block("""DELETE FROM audit_log 
WHERE entity = 'test_sample' 
  AND created_at < CURRENT_TIMESTAMP - INTERVAL '30 days';""")
add_fig("fig_7_2_update_delete.png", "Figure 7.2: Execution of Queries 7.2 & 7.3: Transactional UPDATE and DELETE Operations", width_in=5.8)

add_h2("7.4 Correlated Subquery")
add_p("Identifies departments whose active complaint backlog exceeds the average departmental backlog across the entire campus:")
add_code_block("""SELECT d.department_name,
       (SELECT COUNT(*) 
        FROM complaint c2 
        JOIN category cat2 ON c2.category_id = cat2.category_id 
        WHERE cat2.department_id = d.department_id) AS dept_total
FROM department d
WHERE (SELECT COUNT(*) 
       FROM complaint c 
       JOIN category cat ON c.category_id = cat.category_id 
       WHERE cat.department_id = d.department_id) > 
      (SELECT AVG(cnt) 
       FROM (SELECT COUNT(*) AS cnt 
             FROM complaint c3 
             JOIN category cat3 ON c3.category_id = cat3.category_id 
             GROUP BY cat3.department_id) AS sub);""")

add_h2("7.5 Nested Query with Subqueries")
add_p("Retrieves unassigned maintenance complaints located within 'Tech Park' using nested IN and NOT IN subqueries:")
add_code_block("""SELECT complaint_id, title, priority 
FROM complaint 
WHERE location_id IN (
    SELECT location_id 
    FROM location 
    WHERE building = 'Tech Park'
) 
AND complaint_id NOT IN (
    SELECT complaint_id 
    FROM assignment
);""")
add_fig("fig_7_4_subqueries.png", "Figure 7.3: Execution of Queries 7.4 & 7.5: Correlated Subquery and Nested Subquery", width_in=5.8)

# ==============================================================================
# CHAPTER 8: STORED PROCEDURES, FUNCTIONS AND TRIGGERS
# ==============================================================================
add_h1("8. STORED PROCEDURES, FUNCTIONS AND TRIGGERS")

add_h2("8.1 Stored Procedures & Functions")

add_h3("8.1.1 fn_assign_complaint (Atomic Dispatch Procedure)")
add_p("Encapsulates the transactional assignment workflow: logs the dispatch, transitions ticket status to ASSIGNED, marks the technician as BUSY, and generates an audit log entry:")
add_code_block("""CREATE OR REPLACE FUNCTION fn_assign_complaint(
    p_complaint_id INT,
    p_staff_id INT,
    p_admin_id INT,
    p_remarks TEXT DEFAULT 'Assigned to technician'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO assignment (complaint_id, staff_id, assigned_by, assigned_at)
    VALUES (p_complaint_id, p_staff_id, p_admin_id, CURRENT_TIMESTAMP);
    
    UPDATE complaint SET status = 'ASSIGNED' WHERE complaint_id = p_complaint_id;
    UPDATE staff SET availability_status = 'BUSY' WHERE staff_id = p_staff_id;
    
    INSERT INTO audit_log (user_id, action, entity, entity_id, created_at)
    VALUES (p_admin_id, 'ASSIGN_STAFF', 'complaint', p_complaint_id::text, CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql;""")

add_h3("8.1.2 fn_resolve_complaint (Atomic Resolution Procedure)")
add_p("Handles complaint resolution: stamps the resolution timestamp, frees the technician back to AVAILABLE, and records the completion note:")
add_code_block("""CREATE OR REPLACE FUNCTION fn_resolve_complaint(
    p_complaint_id INT,
    p_staff_id INT,
    p_remarks TEXT DEFAULT 'Work completed and verified'
)
RETURNS VOID AS $$
DECLARE
    v_user_id INT;
BEGIN
    SELECT user_id INTO v_user_id FROM staff WHERE staff_id = p_staff_id;

    UPDATE complaint 
    SET status = 'RESOLVED', resolved_at = CURRENT_TIMESTAMP 
    WHERE complaint_id = p_complaint_id;
    
    UPDATE staff SET availability_status = 'AVAILABLE' WHERE staff_id = p_staff_id;
    
    IF p_remarks IS NOT NULL AND LENGTH(TRIM(p_remarks)) > 0 THEN
        INSERT INTO comment (complaint_id, author_id, body, created_at)
        VALUES (p_complaint_id, v_user_id, '[Resolution Note]: ' || p_remarks, CURRENT_TIMESTAMP);
    END IF;

    INSERT INTO audit_log (user_id, action, entity, entity_id, created_at)
    VALUES (v_user_id, 'RESOLVE_COMPLAINT', 'complaint', p_complaint_id::text, CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql;""")

add_h3("8.1.3 fn_match_similar_complaints (Vector Similarity Search Function)")
add_p("Executes cosine distance calculation (<=> operator) against stored 384-dimensional vectors using the HNSW index:")
add_code_block("""CREATE OR REPLACE FUNCTION fn_match_similar_complaints(
    query_embedding vector(384),
    similarity_threshold FLOAT DEFAULT 0.65,
    match_limit INT DEFAULT 5
)
RETURNS TABLE (
    complaint_id INT,
    title VARCHAR(200),
    description TEXT,
    status complaint_status,
    priority complaint_priority,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.complaint_id, c.title, c.description, c.status, c.priority,
           ROUND((1 - (cv.embedding <=> query_embedding))::numeric, 4)::FLOAT AS similarity
    FROM complaint_vector cv
    JOIN complaint c ON cv.complaint_id = c.complaint_id
    WHERE (1 - (cv.embedding <=> query_embedding)) >= similarity_threshold
    ORDER BY cv.embedding <=> query_embedding ASC
    LIMIT match_limit;
END;
$$ LANGUAGE plpgsql;""")
add_fig("fig_8_1_procedures.png", "Figure 8.1: Execution of Stored Procedures & pgvector Cosine Search", width_in=5.8)

add_h2("8.2 Database Triggers")

add_h3("8.2.1 trg_set_sla_due_at (Dynamic SLA Target Calculation)")
add_p("Fires BEFORE INSERT ON complaint to automatically compute the resolution deadline based on the category's SLA hours:")
add_code_block("""CREATE OR REPLACE FUNCTION fn_trg_set_sla_due_at()
RETURNS TRIGGER AS $$
DECLARE
    v_sla_hours INT;
BEGIN
    IF NEW.sla_due_at IS NULL THEN
        SELECT default_sla_hours INTO v_sla_hours FROM category WHERE category_id = NEW.category_id;
        IF v_sla_hours IS NULL THEN v_sla_hours := 24; END IF;
        NEW.sla_due_at := NEW.created_at + (v_sla_hours || ' hours')::INTERVAL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_sla_due_at
    BEFORE INSERT ON complaint
    FOR EACH ROW EXECUTE FUNCTION fn_trg_set_sla_due_at();""")

add_h3("8.2.2 trg_complaint_status_history (Tamper-Proof Audit Logging)")
add_p("Fires AFTER INSERT OR UPDATE OF status ON complaint, automatically recording every lifecycle transition into status_history:")
add_code_block("""CREATE OR REPLACE FUNCTION fn_trg_record_status_history()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO status_history (complaint_id, old_status, new_status, changed_by, remarks, changed_at)
        VALUES (NEW.complaint_id, NULL, NEW.status, NEW.user_id, 'Complaint registered in system.', CURRENT_TIMESTAMP);
    ELSIF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO status_history (complaint_id, old_status, new_status, changed_by, remarks, changed_at)
        VALUES (NEW.complaint_id, OLD.status, NEW.status, NEW.user_id,
                'Status transitioned from ' || OLD.status::text || ' to ' || NEW.status::text, CURRENT_TIMESTAMP);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_complaint_status_history
    AFTER INSERT OR UPDATE OF status ON complaint
    FOR EACH ROW EXECUTE FUNCTION fn_trg_record_status_history();""")
add_fig("fig_8_2_triggers.png", "Figure 8.2: PostgreSQL Trigger Registration and Audit Trail History", width_in=5.8)

# ==============================================================================
# CHAPTER 9: FRONT END DEVELOPMENT
# ==============================================================================
add_h1("9. FRONT END DEVELOPMENT")

add_h2("9.1 Web Application Architecture")
add_p("The frontend of CampusFix was developed as a modern, full-stack application using Next.js 14, React 18, and TypeScript. All backend database operations are decoupled into server-side Route Handlers located under src/app/api/, ensuring credentials and SQL operations are securely isolated from client bundles.")
add_p("Key frontend technologies include:")
add_p("• Next.js 14 App Router: Provides hybrid server-side rendering, dynamic route handling, and optimized asset delivery.")
add_p("• TypeScript: Enforces strict type consistency between PostgreSQL schema columns and frontend React interfaces.")
add_p("• Tailwind CSS: Delivers an enterprise dark-mode aesthetic with custom glassmorphic cards, responsive flex/grid layouts, and animated status badges.")
add_p("• Three.js WebGL Engine: Renders an interactive 3D Digital Twin of the PES University Electronic City Campus, matching its terracotta facade, curved rotunda, and rooftop solar arrays.")

add_h2("9.2 Interactive 3D Digital Twin & Public Portal")
add_p("The public landing page features the 3D Campus Twin with full 360° orbit, pan, and zoom controls. Live database beacons indicate building status based on vw_location_hotspots.")
add_fig("fig_9_1_ui_homepage.png", "Figure 9.1: CampusFix Public Homepage & 3D Campus Digital Twin", width_in=5.8)

add_h2("9.3 Multi-Role Workstation Portals")
add_p("The application implements three dedicated role portals:")
add_p("1. Student Portal (/dashboard/student): Students report complaints with real-time pgvector similarity alerts, track active tickets, and inspect SLA countdowns.")
add_p("2. Admin Dispatch Center (/dashboard/admin): Administrators triage incoming tickets, view live SLA breach warnings, and assign technicians via the fn_assign_complaint procedure.")
add_p("3. Technician Workstation (/dashboard/staff): Maintenance staff view active work orders, update diagnostic status, and execute atomic resolution with celebratory visual feedback.")
add_fig("fig_9_2_ui_dashboards.png", "Figure 9.2: CampusFix Student, Staff, and Admin Operational Portals", width_in=5.8)

# ==============================================================================
# REFERENCES
# ==============================================================================
add_h1("REFERENCES")
add_p("[1] R. Elmasri and S. B. Navathe, Fundamentals of Database Systems, 7th ed. Boston, MA: Pearson, 2016.", space_before=4, space_after=6)
add_p("[2] A. Silberschatz, H. F. Korth, and S. Sudarshan, Database System Concepts, 7th ed. New York, NY: McGraw-Hill Education, 2020.", space_before=4, space_after=6)
add_p("[3] PostgreSQL Global Development Group, \"PostgreSQL 15 Documentation — Triggers, Stored Procedures, and PL/pgSQL,\" PostgreSQL.org, 2026. [Online]. Available: https://www.postgresql.org/docs/15/", space_before=4, space_after=6)
add_p("[4] A. Kane, \"pgvector: Open-source vector similarity search for Postgres,\" GitHub repository, 2026. [Online]. Available: https://github.com/pgvector/pgvector", space_before=4, space_after=6)
add_p("[5] Y. A. Malkov and D. A. Yashunin, \"Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs,\" IEEE Transactions on Pattern Analysis and Machine Intelligence, vol. 42, no. 4, pp. 824–836, 2020.", space_before=4, space_after=6)
add_p("[6] Vercel, \"Next.js 14 Documentation — App Router, Route Handlers, and Server Components,\" Nextjs.org, 2026. [Online]. Available: https://nextjs.org/docs", space_before=4, space_after=6)
add_p("[7] Three.js Authors, \"Three.js — JavaScript 3D Library,\" Threejs.org, 2026. [Online]. Available: https://threejs.org/", space_before=4, space_after=6)

# ==============================================================================
# APPENDIX A: DEFINITIONS, ACRONYMS AND ABBREVIATIONS
# ==============================================================================
add_h1("APPENDIX A: DEFINITIONS, ACRONYMS AND ABBREVIATIONS")
add_table_data([1.8, 4.8], ["Acronym / Term", "Definition & Context"], [
    ["ACID", "Atomicity, Consistency, Isolation, Durability — Guarantees that multi-statement database operations process reliably without corrupting state."],
    ["DDL", "Data Definition Language — SQL statements (CREATE, ALTER, DROP) that define and modify schema structures."],
    ["DML", "Data Manipulation Language — SQL statements (SELECT, INSERT, UPDATE, DELETE) used to query and modify table rows."],
    ["ERD", "Entity-Relationship Diagram — Visual modeling notation displaying entity sets, attributes, and relationships."],
    ["FK", "Foreign Key — A relational column whose values refer to the primary key of another relation."],
    ["HNSW", "Hierarchical Navigable Small World — Graph-based vector indexing algorithm providing fast logarithmic approximate nearest neighbor search."],
    ["JWT", "JSON Web Token — An open standard (RFC 7519) used to securely transmit cryptographically signed user claims between browser and server."],
    ["PK", "Primary Key — A minimal superkey chosen to uniquely identify tuples in a relation."],
    ["PL/pgSQL", "Procedural Language/PostgreSQL — A block-structured programming language used to write stored procedures, functions, and triggers inside PostgreSQL."],
    ["RBAC", "Role-Based Access Control — An authorization policy restricting system operations based on assigned user roles."],
    ["SLA", "Service Level Agreement — A contractual time commitment defining the maximum acceptable turnaround time for maintenance resolution."],
    ["3NF", "Third Normal Form — Relational design state where every non-prime attribute is non-transitively dependent on every candidate key."]
])

# GITHUB REPOSITORY LINK
add_p("GitHub Repository Verification Link:", space_before=20, space_after=4, bold=True, size=11)
add_p("https://github.com/adityajambagi517-lang/CampusFix-DBMS-Project", space_before=2, space_after=12, bold=True, color=(30, 58, 138))

doc.save(DOC_PATH)
print(f"SUCCESS: Report saved to {DOC_PATH}")
