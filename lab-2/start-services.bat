@echo off
echo ============================================
echo   Laboratory1 Microservices - Start All
echo ============================================
echo.
echo Starting microservices...
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0

echo [1/4] Running database migrations for all services...
php "%SCRIPT_DIR%services\student-service\migrate.php"
echo.
php "%SCRIPT_DIR%services\course-service\migrate.php"
echo.
php "%SCRIPT_DIR%services\enrollment-service\migrate.php"
echo.

echo ============================================
echo   Starting Services on separate ports
echo ============================================
echo.

echo [2/4] Starting Student Service on port 8001...
start "Student Service (8001)" cmd /k "cd /d %SCRIPT_DIR%services\student-service && php -S localhost:8001 -t public"
timeout /t 2 /nobreak > nul

echo [3/4] Starting Course Service on port 8002...
start "Course Service (8002)" cmd /k "cd /d %SCRIPT_DIR%services\course-service && php -S localhost:8002 -t public"
timeout /t 2 /nobreak > nul

echo [4/4] Starting Enrollment Service on port 8003...
start "Enrollment Service (8003)" cmd /k "cd /d %SCRIPT_DIR%services\enrollment-service && php -S localhost:8003 -t public"
timeout /t 2 /nobreak > nul

echo.
echo ============================================
echo   All microservices are running!
echo ============================================
echo.
echo   Student Service:    http://localhost:8001
echo   Course Service:     http://localhost:8002
echo   Enrollment Service: http://localhost:8003
echo.
echo   Now start the API Gateway (main Laravel app):
echo   cd %SCRIPT_DIR% ^&^& php artisan serve --port=8000
echo.
echo   Or run: start-gateway.bat
echo.
echo   Health Check: http://localhost:8000/api/health
echo ============================================
pause
