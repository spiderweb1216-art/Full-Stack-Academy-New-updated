@echo off
setlocal
cd /d "%~dp0"
title Full Stack Academy Admin

set "PHP_EXE="
if exist "C:\xampp\php\php.exe" set "PHP_EXE=C:\xampp\php\php.exe"
if not defined PHP_EXE if exist "D:\xampp\php\php.exe" set "PHP_EXE=D:\xampp\php\php.exe"
if not defined PHP_EXE for %%P in (php.exe) do if not "%%~$PATH:P"=="" set "PHP_EXE=%%~$PATH:P"

if not defined PHP_EXE (
  echo PHP was not found. Start/install XAMPP first.
  pause
  exit /b 1
)

REM Start MySQL from XAMPP when port 3306 is not listening.
netstat -ano | findstr /R /C:":3306 .*LISTENING" >nul
if errorlevel 1 (
  if exist "C:\xampp\mysql_start.bat" start "XAMPP MySQL" /min "C:\xampp\mysql_start.bat"
  if exist "D:\xampp\mysql_start.bat" start "XAMPP MySQL" /min "D:\xampp\mysql_start.bat"
  timeout /t 2 /nobreak >nul
)

REM Start the project web server only when port 8000 is free.
netstat -ano | findstr /R /C:":8000 .*LISTENING" >nul
if errorlevel 1 (
  start "FSA PHP Server" /min "%PHP_EXE%" -S 127.0.0.1:8000 -t "%CD%"
  timeout /t 1 /nobreak >nul
)

REM Clean admin URL: no index.html is shown.
start "" "http://127.0.0.1:8000/admin/"
endlocal
