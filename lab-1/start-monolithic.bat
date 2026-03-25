@echo off
echo.
echo ========================================
echo  Part A - Monolithic System
echo  Starting on http://localhost:8080
echo ========================================
echo.

REM Run migration first
echo Running database migration...
php monolithic/migrate.php
echo.

echo Starting Monolithic Server...
echo.
echo Endpoints available:
echo   POST /students         - Create a student
echo   GET  /courses          - List all courses
echo   POST /enrollments      - Create an enrollment
echo   GET  /enrollments/{id} - Get enrollment by ID
echo   GET  /health           - Health check
echo.
echo Press Ctrl+C to stop the server
echo.

php -S localhost:8080 -t monolithic/public
