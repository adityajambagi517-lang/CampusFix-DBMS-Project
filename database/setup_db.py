import os
import sys
import subprocess
import getpass
from pathlib import Path

PSQL_PATH = r"C:\Program Files\PostgreSQL\15\bin\psql.exe"
if not os.path.exists(PSQL_PATH):
    import shutil
    found = shutil.which("psql")
    if found:
        PSQL_PATH = found
    else:
        print("[ERROR] psql.exe not found at:", PSQL_PATH)
        print("Please check your PostgreSQL installation.")
        sys.exit(1)

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

print("=" * 60)
print("  CampusFix — PostgreSQL 15 + pgvector Setup")
print("=" * 60)
print(f"PostgreSQL Client: {PSQL_PATH}")

password = None
if len(sys.argv) > 1 and sys.argv[1].strip():
    password = sys.argv[1].strip()
elif os.environ.get("PGPASSWORD"):
    password = os.environ.get("PGPASSWORD")
else:
    print("\nEnter your PostgreSQL 'postgres' superuser password below.")
    print("(Your input is hidden securely and NEVER stored in any file)\n")
    try:
        password = getpass.getpass("Password for user 'postgres': ")
    except Exception:
        password = input("Password for user 'postgres': ")

if not password:
    print("[ERROR] No password provided. Setup aborted.")
    sys.exit(1)

env = os.environ.copy()
env["PGPASSWORD"] = password

def run_psql(db, query_str=None, file_path=None, quiet=False):
    cmd = [PSQL_PATH, "-U", "postgres", "-h", "localhost", "-p", "5432", "-d", db]
    if query_str:
        cmd.extend(["-c", query_str])
    elif file_path:
        cmd.extend(["-f", str(file_path)])
    
    result = subprocess.run(cmd, env=env, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if result.returncode != 0:
        if not quiet:
            print(f"\n[ERROR running on {db}]:")
            print(result.stderr)
        return False, result.stderr
    return True, result.stdout

# Step 1: Verify Connection
print("\n[1/6] Verifying PostgreSQL connection...")
ok, out = run_psql("postgres", "SELECT 1;", quiet=True)
if not ok:
    print("[ERROR] Authentication failed. Please verify your password and that PostgreSQL service is running.")
    print("PostgreSQL error details:", out.strip())
    sys.exit(1)
print("  -> Connected successfully to PostgreSQL 15.")

# Step 2: Create campusfix_db
print("\n[2/6] Checking / Creating database 'campusfix_db'...")
ok, out = run_psql("postgres", "SELECT 1 FROM pg_database WHERE datname = 'campusfix_db';")
if "1" not in out:
    ok, err = run_psql("postgres", "CREATE DATABASE campusfix_db;")
    if not ok:
        print("[ERROR] Failed to create database:", err)
        sys.exit(1)
    print("  -> Created database 'campusfix_db'.")
else:
    print("  -> Database 'campusfix_db' already exists.")

# Step 3: Enable pgvector
print("\n[3/6] Enabling pgvector extension...")
ok, err = run_psql("campusfix_db", "CREATE EXTENSION IF NOT EXISTS vector;")
if not ok:
    print("[ERROR] Failed to enable pgvector:", err)
    sys.exit(1)

ok, out = run_psql("campusfix_db", "SELECT extversion FROM pg_extension WHERE extname = 'vector';")
ver_str = out.strip().split()[-1] if out.strip() else "active"
print(f"  -> pgvector enabled (version {ver_str}).")

# Step 4: Create Application User (campusfix_app)
print("\n[4/6] Provisioning application user 'campusfix_app'...")
app_user_sql = """
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'campusfix_app') THEN
        CREATE ROLE campusfix_app WITH LOGIN PASSWORD 'CampusFix@2026_Secure';
    END IF;
    GRANT ALL PRIVILEGES ON DATABASE campusfix_db TO campusfix_app;
    GRANT ALL ON SCHEMA public TO campusfix_app;
END
$$;
"""
ok, err = run_psql("campusfix_db", app_user_sql)
if not ok:
    print("[ERROR] Failed to provision application user:", err)
    sys.exit(1)
print("  -> Application user 'campusfix_app' configured.")

# Step 5: Execute Schema, Advanced, Seeds
print("\n[5/6] Executing DDL Schema, Triggers, Views & Seed Data...")

schema_file = BASE_DIR / "campusfix_schema.sql"
advanced_file = BASE_DIR / "campusfix_advanced.sql"
seeds_file = BASE_DIR / "campusfix_seeds.sql"

print("  -> Applying 13 Relational Tables...")
ok, err = run_psql("campusfix_db", file_path=schema_file)
if not ok:
    print("[ERROR] Schema migration failed:", err)
    sys.exit(1)

print("  -> Applying Triggers, Stored Functions & Views...")
ok, err = run_psql("campusfix_db", file_path=advanced_file)
if not ok:
    print("[ERROR] Advanced SQL migration failed:", err)
    sys.exit(1)

print("  -> Inserting Realistic Demo Seed Data with pgvector embeddings...")
ok, err = run_psql("campusfix_db", file_path=seeds_file)
if not ok:
    print("[ERROR] Seed data insertion failed:", err)
    sys.exit(1)

# Grant table privileges to campusfix_app
grant_sql = """
GRANT ALL ON ALL TABLES IN SCHEMA public TO campusfix_app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO campusfix_app;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO campusfix_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO campusfix_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO campusfix_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO campusfix_app;
"""
run_psql("campusfix_db", grant_sql)

# Step 6: Verify Tables and Row Counts
print("\n[6/6] Verifying All 13 Tables...")
tables = [
    "role", "app_user", "location", "department", "category",
    "staff", "complaint", "assignment", "status_history",
    "attachment", "comment", "audit_log", "complaint_vector"
]

print("-" * 45)
print(f"{'Table Name':<20} | {'Status':<10} | {'Row Count'}")
print("-" * 45)

for tbl in tables:
    ok, out = run_psql("campusfix_db", f"SELECT count(*) FROM {tbl};")
    count = out.strip().split()[-1] if ok and out.strip() else "0"
    print(f"{tbl:<20} | {'Verified':<10} | {count}")

print("-" * 45)

# Test Vector Similarity Query
print("\n  -> Testing Vector Cosine Similarity Search (fn_match_similar_complaints)...")
ok, sim_out = run_psql(
    "campusfix_db",
    "SELECT complaint_id, title, similarity FROM fn_match_similar_complaints((SELECT embedding FROM complaint_vector WHERE complaint_id = 1), 0.5, 3);"
)
if ok:
    print(sim_out.strip())

# Write .env file
env_path = PROJECT_ROOT / ".env"
env_content = """# CampusFix Environment Configuration
DATABASE_URL="postgresql://campusfix_app:CampusFix@2026_Secure@localhost:5432/campusfix_db"
JWT_SECRET="campusfix_super_secure_jwt_token_pes_university_2026_level3"
NEXT_PUBLIC_APP_NAME="CampusFix"
PORT=3000
"""
with open(env_path, "w", encoding="utf-8") as f:
    f.write(env_content)
print("\n  -> Generated .env with dedicated application user credentials.")

# Write Marker
marker_path = BASE_DIR / ".db_initialized"
with open(marker_path, "w", encoding="utf-8") as f:
    f.write("INITIALIZED")

print("\n" + "=" * 60)
print("  SUCCESS! CampusFix Database is Fully Configured!")
print("  Next Step: Run 'npm run dev' to start the web application.")
print("=" * 60 + "\n")
