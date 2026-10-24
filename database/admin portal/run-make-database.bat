@echo off
setlocal
title Quick2Learn - Make Admin Portal Database

echo ========================================================
echo   Quick2Learn - Make & Seed Admin Portal Database
echo ========================================================
echo.
echo Running setup and seeding scripts for Admin Portal...
echo.

node "%~dp0make-admin-portal-database.js"

echo.
pause
