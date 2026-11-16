@echo off
setlocal
cd /d "%~dp0"
set PGPASSWORD=CampusFix@2026_Secure

echo ============================================================================
echo   CampusFix - Live PostgreSQL 15 Database (campusfix_db)
echo ============================================================================
echo.
echo [1] LATEST COMPLAINTS TABLE (complaint JOIN app_user):
echo ----------------------------------------------------------------------------
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U campusfix_app -d campusfix_db -p 5433 -h localhost -c "SELECT c.complaint_id as id, u.full_name as student, c.title, c.status, c.priority, c.created_at FROM complaint c JOIN app_user u ON c.user_id = u.user_id ORDER BY c.complaint_id DESC;"

echo.
echo [2] AUTOMATED TRIGGER AUDIT HISTORY TABLE (status_history):
echo ----------------------------------------------------------------------------
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U campusfix_app -d campusfix_db -p 5433 -h localhost -c "SELECT history_id as id, complaint_id as ticket_id, new_status, remarks, changed_at FROM status_history ORDER BY history_id DESC LIMIT 5;"

echo.
echo ============================================================================
echo   Press any key to close this window.
echo ============================================================================
pause >nul
