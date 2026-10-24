@echo off
setlocal
title Quick2Learn - Delete Admin Portal Data

echo ========================================================
echo   Quick2Learn - Delete All Admin Portal Data
echo ========================================================
echo.
echo WARNING: This will permanently delete all Admin Portal data
echo          from the Quick2Learn database!
echo.
set /p CONFIRM="Are you sure you want to proceed? (y/N): "
if /i not "%CONFIRM%"=="y" (
    echo.
    echo Operation cancelled by user.
    pause
    exit /b 0
)

echo.
echo Executing deletion script...
echo.

node "%~dp0delete-admin-portal-data.js" --force

echo.
pause
