@echo off
title CampusFix - Launcher
cd /d "%~dp0"

echo ============================================================
echo   CampusFix - Starting Database & Web Server
echo ============================================================
echo.

echo [1/2] Starting PostgreSQL 15 on port 5433...
start "CampusFix PostgreSQL Daemon" "C:\Program Files\PostgreSQL\15\bin\postgres.exe" -D "database\pgdata"

echo Waiting 3 seconds for database initialization...
timeout /t 3 /nobreak >nul

echo [2/2] Starting Next.js Production Web Server on port 3000...
echo.
echo ============================================================
echo   CampusFix is opening at http://localhost:3000
echo ============================================================
echo.

npm run start
pause
