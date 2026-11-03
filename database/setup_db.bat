@echo off
title CampusFix Database Setup
echo ============================================================
echo   CampusFix - Launching PostgreSQL Automated Setup
echo ============================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup_db.ps1"
echo.
pause
