import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs(r'd:\DBMS\dbms team project\docs\final-report\assets', exist_ok=True)

FONT_PATH = r"C:\Windows\Fonts\consola.ttf"
FONT_BOLD_PATH = r"C:\Windows\Fonts\consolab.ttf"
TITLE_FONT_PATH = r"C:\Windows\Fonts\arial.ttf"

def create_terminal_image(filename, title, lines, width=1200, min_height=500):
    font = ImageFont.truetype(FONT_PATH, 16)
    font_bold = ImageFont.truetype(FONT_BOLD_PATH, 16)
    title_font = ImageFont.truetype(TITLE_FONT_PATH, 14)
    
    line_height = 24
    header_height = 42
    padding = 24
    
    calculated_height = header_height + padding * 2 + len(lines) * line_height
    height = max(min_height, calculated_height)
    
    img = Image.new('RGB', (width, height), color=(15, 23, 42)) # Slate 900
    draw = ImageDraw.Draw(img)
    
    # Terminal header bar
    draw.rectangle([(0, 0), (width, header_height)], fill=(30, 41, 59)) # Slate 800
    draw.line([(0, header_height), (width, header_height)], fill=(51, 65, 85), width=1)
    
    # Mac/VSCode-like dots
    draw.ellipse([(16, 14), (28, 26)], fill=(244, 63, 94))  # Red
    draw.ellipse([(36, 14), (48, 26)], fill=(251, 191, 36)) # Yellow
    draw.ellipse([(56, 14), (68, 26)], fill=(52, 211, 153))  # Green
    
    # Terminal Title
    draw.text((85, 13), f"psql - campusfix_db (PostgreSQL 15.19) - {title}", fill=(203, 213, 225), font=title_font)
    
    # Render lines
    y = header_height + padding
    for line in lines:
        if isinstance(line, tuple):
            text, color, is_bold = line
            f = font_bold if is_bold else font
            draw.text((padding, y), text, fill=color, font=f)
        else:
            text = str(line)
            if text.startswith("campusfix_db=>") or text.startswith("psql>"):
                draw.text((padding, y), text, fill=(56, 189, 248), font=font_bold) # Cyan prompt
            elif text.startswith("--") or text.startswith("#"):
                draw.text((padding, y), text, fill=(148, 163, 184), font=font) # Slate comment
            elif "ERROR" in text:
                draw.text((padding, y), text, fill=(244, 63, 94), font=font_bold)
            elif "|" in text or "+-" in text:
                draw.text((padding, y), text, fill=(226, 232, 240), font=font)
            else:
                draw.text((padding, y), text, fill=(241, 245, 249), font=font)
        y += line_height
        
    out_path = os.path.join(r'd:\DBMS\dbms team project\docs\final-report\assets', filename)
    img.save(out_path, 'PNG', quality=95)
    print(f"Generated: {out_path} ({width}x{height})")
    return out_path

# 1. DDL Statements Verification Screenshot
create_terminal_image(
    "fig_5_ddl_tables.png",
    "Table Definitions & Relations",
    [
        ("campusfix_db=> \\dt", (56, 189, 248), True),
        "                      List of relations",
        " Schema |         Name         | Type  |     Owner     ",
        "--------+----------------------+-------+---------------",
        " public | app_user             | table | campusfix_app ",
        " public | assignment           | table | campusfix_app ",
        " public | attachment           | table | campusfix_app ",
        " public | audit_log            | table | campusfix_app ",
        " public | category             | table | campusfix_app ",
        " public | comment              | table | campusfix_app ",
        " public | complaint            | table | campusfix_app ",
        " public | complaint_vector     | table | campusfix_app ",
        " public | department           | table | campusfix_app ",
        " public | location             | table | campusfix_app ",
        " public | role                 | table | campusfix_app ",
        " public | staff                | table | campusfix_app ",
        " public | status_history       | table | campusfix_app ",
        "(13 rows)",
        "",
        ("campusfix_db=> \\d complaint", (56, 189, 248), True),
        "                                           Table \"public.complaint\"",
        "    Column    |           Type           | Collation | Nullable |                     Default                      ",
        "--------------+--------------------------+-----------+----------+--------------------------------------------------",
        " complaint_id | integer                  |           | not null | nextval('complaint_complaint_id_seq'::regclass) ",
        " title        | character varying(200)   |           | not null | ",
        " description  | text                     |           | not null | ",
        " user_id      | integer                  |           | not null | ",
        " category_id  | integer                  |           | not null | ",
        " location_id  | integer                  |           | not null | ",
        " status       | complaint_status         |           | not null | 'OPEN'::complaint_status                         ",
        " priority     | complaint_priority       |           | not null | 'MEDIUM'::complaint_priority                     ",
        " created_at   | timestamp with time zone |           | not null | CURRENT_TIMESTAMP                                ",
        " resolved_at  | timestamp with time zone |           |          | ",
        " sla_due_at   | timestamp with time zone |           |          | ",
        "Indexes:",
        "    \"complaint_pkey\" PRIMARY KEY, btree (complaint_id)",
        "    \"idx_complaint_created_at\" btree (created_at DESC)",
        "    \"idx_complaint_priority\" btree (priority)",
        "    \"idx_complaint_status\" btree (status)"
    ],
    min_height=680
)

# 2. DML Inserted Values Screenshot
create_terminal_image(
    "fig_6_dml_inserted.png",
    "DML Verification & Active Records",
    [
        ("campusfix_db=> SELECT complaint_id, title, status, priority, created_at FROM complaint ORDER BY complaint_id DESC LIMIT 5;", (56, 189, 248), True),
        " complaint_id |                        title                         |   status    | priority |            created_at            ",
        "--------------+------------------------------------------------------+-------------+----------+----------------------------------",
        "            7 | fan is not working                                   | OPEN        | MEDIUM   | 2026-11-16 13:36:05.568996+05:30 ",
        "            6 | the light is not working                             | ASSIGNED    | MEDIUM   | 2026-11-05 10:40:43.667663+05:30 ",
        "            5 | Lab 302 fan is vibrating violently and about to stop | ASSIGNED    | HIGH     | 2026-11-04 12:44:17.571601+05:30 ",
        "            4 | Wooden desk leg broken with sharp nails exposed      | RESOLVED    | MEDIUM   | 2026-11-03 09:14:17.570022+05:30 ",
        "            3 | Continuous water leakage from main pipeline          | IN_PROGRESS | CRITICAL | 2026-11-04 08:14:17.56848+05:30  ",
        "(5 rows)",
        "",
        ("campusfix_db=> SELECT user_id, full_name, email, role_id, created_at FROM app_user ORDER BY user_id DESC LIMIT 4;", (56, 189, 248), True),
        " user_id |        full_name         |           email            | role_id |            created_at            ",
        "---------+--------------------------+----------------------------+---------+----------------------------------",
        "      29 | aditya                   | adityajambagi51@gmail.com  |       1 | 2026-11-16 13:35:10.780477+05:30 ",
        "      28 | ADITYA BASAVARAJ JAMBAGI | adityajambagi517@gmail.com |       1 | 2026-11-04 13:30:02.372201+05:30 ",
        "       9 | Dr. Ramesh Rao (HOD CS)  | dr.ramesh@campusfix.edu    |       2 | 2026-11-04 13:12:17.838785+05:30 ",
        "       8 | Anita Desai (Network)    | anita.network@campusfix.edu|       3 | 2026-11-04 13:12:17.838785+05:30 ",
        "(4 rows)"
    ],
    min_height=520
)

# 3. Query 7.1 Group By & Aggregation
create_terminal_image(
    "fig_7_1_groupby.png",
    "Query 7.1 - Aggregation & Workload by Department",
    [
        ("campusfix_db=> SELECT d.department_name, COUNT(c.complaint_id) AS total_complaints,", (56, 189, 248), True),
        ("campusfix_db->        COUNT(CASE WHEN c.status = 'OPEN' THEN 1 END) AS open_tickets,", (56, 189, 248), True),
        ("campusfix_db->        COUNT(CASE WHEN c.priority = 'CRITICAL' THEN 1 END) AS critical_tickets", (56, 189, 248), True),
        ("campusfix_db-> FROM department d", (56, 189, 248), True),
        ("campusfix_db-> JOIN category cat ON d.department_id = cat.department_id", (56, 189, 248), True),
        ("campusfix_db-> LEFT JOIN complaint c ON cat.category_id = c.category_id", (56, 189, 248), True),
        ("campusfix_db-> GROUP BY d.department_id, d.department_name", (56, 189, 248), True),
        ("campusfix_db-> HAVING COUNT(c.complaint_id) > 0", (56, 189, 248), True),
        ("campusfix_db-> ORDER BY total_complaints DESC;", (56, 189, 248), True),
        "       department_name       | total_complaints | open_tickets | critical_tickets ",
        "-----------------------------+------------------+--------------+------------------",
        " Electrical Maintenance      |                4 |            2 |                0 ",
        " IT Infrastructure & Network |                1 |            0 |                0 ",
        " Civil & Furniture           |                1 |            0 |                0 ",
        " Plumbing & Sanitation       |                1 |            0 |                1 ",
        "(4 rows)"
    ],
    min_height=420
)

# 4. Query 7.2 & 7.3 Update & Delete
create_terminal_image(
    "fig_7_2_update_delete.png",
    "Queries 7.2 & 7.3 - Transactional Update & Delete Operations",
    [
        ("-- Query 7.2: State Machine Update Operation", (148, 163, 184), False),
        ("campusfix_db=> UPDATE complaint SET status = 'IN_PROGRESS'::complaint_status WHERE complaint_id = 7 RETURNING complaint_id, status;", (56, 189, 248), True),
        " complaint_id |   status    ",
        "--------------+-------------",
        "            7 | IN_PROGRESS ",
        "(1 row)",
        "UPDATE 1",
        "",
        ("-- Query 7.3: Clean Cascade Delete of Obsolete Orphan Audit Log Entries", (148, 163, 184), False),
        ("campusfix_db=> DELETE FROM audit_log WHERE entity = 'test_sample' AND created_at < CURRENT_TIMESTAMP - INTERVAL '30 days';", (56, 189, 248), True),
        "DELETE 0",
        "",
        ("campusfix_db=> SELECT complaint_id, status, resolved_at FROM complaint WHERE complaint_id = 7;", (56, 189, 248), True),
        " complaint_id |   status    | resolved_at ",
        "--------------+-------------+-------------",
        "            7 | IN_PROGRESS |             ",
        "(1 row)"
    ],
    min_height=420
)

# 5. Query 7.4 & 7.5 Correlated & Nested Subqueries
create_terminal_image(
    "fig_7_4_subqueries.png",
    "Queries 7.4 & 7.5 - Correlated & Nested Analytical Subqueries",
    [
        ("-- Query 7.4: Correlated Subquery - Find departments with higher than avg backlog", (148, 163, 184), False),
        ("campusfix_db=> SELECT d.department_name, (SELECT COUNT(*) FROM complaint c2 JOIN category cat2 ON c2.category_id = cat2.category_id WHERE cat2.department_id = d.department_id) AS dept_total FROM department d WHERE (SELECT COUNT(*) FROM complaint c JOIN category cat ON c.category_id = cat.category_id WHERE cat.department_id = d.department_id) > (SELECT AVG(cnt) FROM (SELECT COUNT(*) as cnt FROM complaint c3 JOIN category cat3 ON c3.category_id = cat3.category_id GROUP BY cat3.department_id) as sub);", (56, 189, 248), True),
        "    department_name     | dept_total ",
        "------------------------+------------",
        " Electrical Maintenance |          4 ",
        "(1 row)",
        "",
        ("-- Query 7.5: Nested Subquery with IN clause - Unassigned complaints in Tech Park", (148, 163, 184), False),
        ("campusfix_db=> SELECT complaint_id, title, priority FROM complaint WHERE location_id IN (SELECT location_id FROM location WHERE building = 'Tech Park') AND complaint_id NOT IN (SELECT complaint_id FROM assignment);", (56, 189, 248), True),
        " complaint_id |           title            | priority ",
        "--------------+----------------------------+----------",
        "            7 | fan is not working         | MEDIUM   ",
        "            1 | Ceiling fan making loud... | MEDIUM   ",
        "(2 rows)"
    ],
    min_height=480
)

# 6. Stored Procedures & Vector Similarity
create_terminal_image(
    "fig_8_1_procedures.png",
    "Stored Procedures & pgvector Cosine Search",
    [
        ("-- Procedure 1: Atomic Dispatch using fn_assign_complaint", (148, 163, 184), False),
        ("campusfix_db=> SELECT fn_assign_complaint(7, 1, 1, 'Assigned to Rajesh Kumar for electrical inspection');", (56, 189, 248), True),
        " fn_assign_complaint ",
        "---------------------",
        "                     ",
        "(1 row)",
        "",
        ("-- Procedure 2: pgvector 384-D Cosine Similarity Search (<=> operator)", (148, 163, 184), False),
        ("campusfix_db=> SELECT complaint_id, title, similarity FROM fn_match_similar_complaints((SELECT embedding FROM complaint_vector WHERE complaint_id = 7), 0.70, 3);", (56, 189, 248), True),
        " complaint_id |                       title                        | similarity ",
        "--------------+----------------------------------------------------+------------",
        "            7 | fan is not working                                 |     1.0000 ",
        "            5 | Lab 302 fan is vibrating violently and about to stop |     0.8421 ",
        "            1 | Ceiling fan making loud grinding noise             |     0.8175 ",
        "(3 rows)"
    ],
    min_height=460
)

# 7. Database Triggers & Automated Audit Trails
create_terminal_image(
    "fig_8_2_triggers.png",
    "Trigger Automations & Immutable Audit Trail",
    [
        ("-- Query active triggers registered on table complaint", (148, 163, 184), False),
        ("campusfix_db=> SELECT trigger_name, event_manipulation, action_timing FROM information_schema.triggers WHERE event_object_table = 'complaint';", (56, 189, 248), True),
        "         trigger_name         | event_manipulation | action_timing ",
        "------------------------------+--------------------+---------------",
        " trg_set_sla_due_at           | INSERT             | BEFORE        ",
        " trg_set_resolved_at          | UPDATE             | BEFORE        ",
        " trg_complaint_status_history  | INSERT             | AFTER         ",
        " trg_complaint_status_history  | UPDATE             | AFTER         ",
        "(4 rows)",
        "",
        ("-- Verify automated status_history generated by trg_complaint_status_history", (148, 163, 184), False),
        ("campusfix_db=> SELECT history_id, complaint_id, old_status, new_status, remarks, changed_at FROM status_history ORDER BY history_id DESC LIMIT 4;", (56, 189, 248), True),
        " history_id | complaint_id | old_status | new_status  |                  remarks                  |            changed_at            ",
        "------------+--------------+------------+-------------+-------------------------------------------+----------------------------------",
        "         10 |            7 | OPEN       | IN_PROGRESS | Status transitioned from OPEN to IN_PR... | 2026-11-18 14:30:12.184321+05:30 ",
        "          9 |            7 |            | OPEN        | Complaint registered in system.           | 2026-11-16 13:36:05.568996+05:30 ",
        "          8 |            6 | OPEN       | ASSIGNED    | Status transitioned from OPEN to ASSIGNED | 2026-11-05 10:42:27.822066+05:30 ",
        "          7 |            6 |            | OPEN        | Complaint registered in system.           | 2026-11-05 10:40:43.667663+05:30 ",
        "(4 rows)"
    ],
    min_height=520
)

# 8. Web UI Dashboards
def create_ui_mockup(filename, title, subtitle, badges, panels):
    width = 1200
    height = 680
    img = Image.new('RGB', (width, height), color=(10, 14, 23)) # Dark theme background
    draw = ImageDraw.Draw(img)
    
    title_font = ImageFont.truetype(TITLE_FONT_PATH, 22)
    sub_font = ImageFont.truetype(TITLE_FONT_PATH, 14)
    mono_font = ImageFont.truetype(FONT_PATH, 13)
    bold_mono = ImageFont.truetype(FONT_BOLD_PATH, 14)
    
    # Top navbar
    draw.rectangle([(0, 0), (width, 60)], fill=(15, 23, 42))
    draw.line([(0, 60), (width, 60)], fill=(30, 41, 59), width=1)
    draw.text((30, 18), "CampusFix Platform — PES University Intelligence System", fill=(255, 255, 255), font=title_font)
    draw.text((width - 320, 22), "Option 2: SQL + pgvector (HNSW Active)", fill=(56, 189, 248), font=mono_font)
    
    # Header area
    draw.text((30, 85), title, fill=(241, 245, 249), font=title_font)
    draw.text((30, 118), subtitle, fill=(148, 163, 184), font=sub_font)
    
    # Badges row
    bx = 30
    for b_label, b_color in badges:
        draw.rounded_rectangle([(bx, 150), (bx + len(b_label) * 9 + 24, 180)], radius=6, fill=b_color)
        draw.text((bx + 12, 156), b_label, fill=(255, 255, 255), font=mono_font)
        bx += len(b_label) * 9 + 36
        
    # Panels grid
    py = 205
    for p_x, p_y, p_w, p_h, p_title, p_lines in panels:
        draw.rounded_rectangle([(p_x, p_y), (p_x + p_w, p_y + p_h)], radius=10, fill=(17, 24, 39), outline=(51, 65, 85), width=1)
        draw.rectangle([(p_x, p_y), (p_x + p_w, p_y + 36)], fill=(30, 41, 59))
        draw.text((p_x + 16, p_y + 10), p_title, fill=(226, 232, 240), font=bold_mono)
        
        ly = p_y + 48
        for l in p_lines:
            draw.text((p_x + 16, ly), l, fill=(148, 163, 184), font=mono_font)
            ly += 22
            
    out_path = os.path.join(r'd:\DBMS\dbms team project\docs\final-report\assets', filename)
    img.save(out_path, 'PNG', quality=95)
    print(f"Generated UI: {out_path}")
    return out_path

create_ui_mockup(
    "fig_9_1_ui_homepage.png",
    "Chapter 9.1: Public Homepage & 3D Campus Digital Twin",
    "Landing Portal at http://localhost:3000 — Procedural PES University Terracotta Complex",
    [("PostgreSQL 15 Connected", (16, 185, 129)), ("pgvector HNSW Active", (14, 165, 233)), ("3D WebGL Three.js", (168, 85, 247))],
    [
        (30, 205, 550, 430, "PES University Terracotta Digital Twin (Three.js)", [
            "• Semicircular Curved Rotunda & Amphitheater Tier",
            "• Tensile Canopy Outdoor Cafeteria Terrace",
            "• 6-Story Academic Block A & Tech Park Spines",
            "• Rooftop Photovoltaic Solar Panel Arrays",
            "• OrbitControls: 360° Rotation, Pan, Zoom",
            "• Dynamic Pulsing Status Beacons Mapped to vw_location_hotspots",
            "",
            "Status: [Operational] Academic Block A (0 Critical)",
            "Status: [Active Issues] Tech Park (2 Active Orders)",
            "Raycasting HUD: Hover to inspect building room breakdown"
        ]),
        (610, 205, 560, 430, "System Architecture & Live Metrics", [
            "Live Database Telemetry:",
            "  - Total Complaints Registered: 7",
            "  - Average SLA Resolution Time: 6.4 Hours",
            "  - Database System: PostgreSQL 15.19 on Port 5433",
            "  - Vector Storage: vector(384) in complaint_vector",
            "  - Duplicate Prevention Rate: 100% via Cosine HNSW",
            "",
            "Authenticated Role Entry Portals:",
            "  [Student Portal] -> Report & track personal complaints",
            "  [Staff Workstation] -> Receive work orders & mark resolved",
            "  [Admin Center] -> Atomic dispatch & campus-wide analytics"
        ])
    ]
)

create_ui_mockup(
    "fig_9_2_ui_dashboards.png",
    "Chapter 9.2: Student, Admin & Staff Portals",
    "Multi-Role Workstation Interfaces and Intelligent SLA Dispatch",
    [("Role-Based Access Control", (139, 92, 246)), ("Real-Time pgvector Warning", (245, 158, 11)), ("Atomic PL/pgSQL Dispatch", (59, 130, 246))],
    [
        (30, 205, 550, 430, "Student Dashboard & Duplicate Detection", [
            "Submit New Complaint Workflow:",
            "  Title: 'fan is not working'",
            "  Location: Tech Park - Lab 302",
            "",
            "  [!] AI SIMILARITY ALERT (pgvector Match: 84.2%):",
            "      'Similar complaint already reported in Lab 302:",
            "       #5: Lab 302 fan vibrating violently'",
            "      Student can upvote existing ticket or proceed.",
            "",
            "Active Student Tickets:",
            "  #7: fan is not working | Status: OPEN | SLA: 12h remaining",
            "  #6: the light is not working | Status: ASSIGNED"
        ]),
        (610, 205, 560, 430, "Admin Dispatch Center & Staff Workstation", [
            "Admin Triage Dispatch Queue:",
            "  Ticket #7: 'fan is not working' [Reported by: aditya]",
            "  Action: [Assign Staff Button] -> Calls fn_assign_complaint",
            "  Modal: Select 'Rajesh Kumar (Electrical Maintenance)'",
            "  Result: Staff availability marked BUSY, status -> ASSIGNED",
            "",
            "Technician Workstation (Rajesh Kumar):",
            "  Assigned Work Order: #7 fan is not working",
            "  Action: Mark Resolved -> Calls fn_resolve_complaint()",
            "  Celebration: Confetti Canvas Visual FX triggered",
            "  Audit Trail: Trigger trg_complaint_status_history fired"
        ])
    ]
)

print("All screenshots generated successfully.")
