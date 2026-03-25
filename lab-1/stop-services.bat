@echo off
echo ============================================
echo   Stop All Microservices
echo ============================================
echo.
echo Killing PHP development servers...
taskkill /FI "WINDOWTITLE eq Student Service*" /F 2>nul
taskkill /FI "WINDOWTITLE eq Course Service*" /F 2>nul
taskkill /FI "WINDOWTITLE eq Enrollment Service*" /F 2>nul
echo.
echo All microservices stopped.
pause
