@echo off
title CampusFix Database Setup
cd /d "%~dp0.."
echo ============================================================
echo   CampusFix - Automated Database Setup (PostgreSQL 15)
echo ============================================================
echo.

where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    python database\setup_db.py
) else (
    echo [ERROR] Python not found in PATH.
    pause
    exit /b 1
)

echo.
pause
