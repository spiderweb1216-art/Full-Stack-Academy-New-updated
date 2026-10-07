@echo off
setlocal
cd /d "%~dp0"
title Full Stack Academy LMS - Local Server

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0START-LOCALHOST.ps1"

if errorlevel 1 (
  echo.
  echo Could not start the local website server.
  echo Make sure XAMPP is installed and PHP is available.
  echo.
  pause
)

endlocal
