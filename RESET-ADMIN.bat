@echo off
setlocal
cd /d "%~dp0"
title Full Stack Academy - Reset Admin Login

set "PHP_EXE="
if exist "C:\xampp\php\php.exe" set "PHP_EXE=C:\xampp\php\php.exe"
if not defined PHP_EXE if exist "D:\xampp\php\php.exe" set "PHP_EXE=D:\xampp\php\php.exe"
if not defined PHP_EXE for %%P in (php.exe) do if not "%%~$PATH:P"=="" set "PHP_EXE=%%~$PATH:P"

if not defined PHP_EXE (
  echo PHP was not found. Start/install XAMPP first.
  pause
  exit /b 1
)

netstat -ano | findstr /R /C:":3306 .*LISTENING" >nul
if errorlevel 1 (
  if exist "C:\xampp\mysql_start.bat" start "XAMPP MySQL" /min "C:\xampp\mysql_start.bat"
  if exist "D:\xampp\mysql_start.bat" start "XAMPP MySQL" /min "D:\xampp\mysql_start.bat"
  timeout /t 2 /nobreak >nul
)

"%PHP_EXE%" "%~dp0RESET-ADMIN.php"
echo.
if errorlevel 1 (
  echo The reset did not complete. Read the error above.
) else (
  echo You can now run OPEN-ADMIN.bat and sign in with the credentials shown above.
)
echo.
pause
endlocal
