param (
    [string]$PsqlPath = "C:\Program Files\PostgreSQL\15\bin\psql.exe"
)

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  CampusFix — PostgreSQL 15 + pgvector Automated Setup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $PsqlPath)) {
    $cmd = Get-Command psql.exe -ErrorAction SilentlyContinue
    if ($cmd) {
        $PsqlPath = $cmd.Source
    } else {
        Write-Host "ERROR: psql.exe not found at $PsqlPath." -ForegroundColor Red
        Exit 1
    }
}

Write-Host "Enter your PostgreSQL 'postgres' superuser password below." -ForegroundColor Yellow
Write-Host "(Your password is typed securely and will NOT be displayed)" -ForegroundColor Gray
Write-Host ""

$securePassword = Read-Host -Prompt "Password for user 'postgres'" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

$env:PGPASSWORD = $plainPassword

try {
    Write-Host "`n[1/6] Verifying PostgreSQL connection..." -ForegroundColor Cyan
    $testResult = & $PsqlPath -U postgres -h localhost -p 5432 -d postgres -tAc "SELECT 1;" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Authentication failed. Please check your password." -ForegroundColor Red
        Exit 1
    }
    Write-Host "  -> PostgreSQL connected successfully." -ForegroundColor Green

    Write-Host "`n[2/6] Checking / Creating 'campusfix_db'..." -ForegroundColor Cyan
    $dbExists = & $PsqlPath -U postgres -h localhost -p 5432 -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'campusfix_db';"
    if ($dbExists.Trim() -ne "1") {
        & $PsqlPath -U postgres -h localhost -p 5432 -d postgres -c "CREATE DATABASE campusfix_db;"
        Write-Host "  -> Created database 'campusfix_db'." -ForegroundColor Green
    } else {
        Write-Host "  -> Database 'campusfix_db' already exists." -ForegroundColor Green
    }

    Write-Host "`n[3/6] Enabling pgvector extension..." -ForegroundColor Cyan
    & $PsqlPath -U postgres -h localhost -p 5432 -d campusfix_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
    Write-Host "  -> pgvector enabled." -ForegroundColor Green

    Write-Host "`n[4/6] Creating application role 'campusfix_app'..." -ForegroundColor Cyan
    $createRoleCmd = "DO ' BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = ''campusfix_app'') THEN CREATE ROLE campusfix_app WITH LOGIN PASSWORD ''CampusFix@2026_Secure''; END IF; GRANT ALL PRIVILEGES ON DATABASE campusfix_db TO campusfix_app; GRANT ALL ON SCHEMA public TO campusfix_app; END ';"
    & $PsqlPath -U postgres -h localhost -p 5432 -d campusfix_db -c "$createRoleCmd"
    Write-Host "  -> Application user 'campusfix_app' provisioned." -ForegroundColor Green

    Write-Host "`n[5/6] Executing DDL Schema, Triggers, Views & Seed Data..." -ForegroundColor Cyan
    $currentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    if (-not $currentDir) { $currentDir = Get-Location }

    $schemaFile = Join-Path $currentDir "campusfix_schema.sql"
    $advancedFile = Join-Path $currentDir "campusfix_advanced.sql"
    $seedsFile = Join-Path $currentDir "campusfix_seeds.sql"

    & $PsqlPath -U postgres -h localhost -p 5432 -d campusfix_db -f "$schemaFile" | Out-Null
    & $PsqlPath -U postgres -h localhost -p 5432 -d campusfix_db -f "$advancedFile" | Out-Null
    & $PsqlPath -U postgres -h localhost -p 5432 -d campusfix_db -f "$seedsFile" | Out-Null

    $grantCmd = "GRANT ALL ON ALL TABLES IN SCHEMA public TO campusfix_app; GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO campusfix_app; GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO campusfix_app; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO campusfix_app; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO campusfix_app; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO campusfix_app;"
    & $PsqlPath -U postgres -h localhost -p 5432 -d campusfix_db -c "$grantCmd" | Out-Null

    Write-Host "`n[6/6] Verifying Table Counts..." -ForegroundColor Cyan
    $tables = @("role", "app_user", "location", "department", "category", "staff", "complaint", "assignment", "status_history", "attachment", "comment", "audit_log", "complaint_vector")
    foreach ($t in $tables) {
        $cnt = (& $PsqlPath -U postgres -h localhost -p 5432 -d campusfix_db -tAc "SELECT count(*) FROM $t;").Trim()
        Write-Host "  * Table '$t': $cnt rows" -ForegroundColor Green
    }

    # Write .env file
    $rootPath = Split-Path -Parent $currentDir
    $envPath = Join-Path $rootPath ".env"
    $envText = "DATABASE_URL=`"postgresql://campusfix_app:CampusFix@2026_Secure@localhost:5432/campusfix_db`"`nJWT_SECRET=`"campusfix_super_secure_jwt_token_pes_university_2026_level3`"`nNEXT_PUBLIC_APP_NAME=`"CampusFix`"`nPORT=3000`n"
    [System.IO.File]::WriteAllText($envPath, $envText)

    # Write marker
    $markerPath = Join-Path $currentDir ".db_initialized"
    [System.IO.File]::WriteAllText($markerPath, "INITIALIZED")

    Write-Host "`nSUCCESS! Database configured and .env written." -ForegroundColor Green
}
catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    Exit 1
}
finally {
    $env:PGPASSWORD = $null
}
