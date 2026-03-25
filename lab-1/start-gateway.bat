@echo off
echo ============================================
echo   Laboratory1 - API Gateway (port 8000)
echo ============================================
echo.
echo Starting Laravel API Gateway on port 8000...
echo Make sure all microservices are running first!
echo (Run start-services.bat first)
echo.
cd /d %~dp0
php artisan serve --port=8000
