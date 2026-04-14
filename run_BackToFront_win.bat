@echo off

REM ======================================
REM Start Back & Frontend Script
REM -Runs Back & Frontend, requiring no manual input from user
REM (Note: does not run migrations)
REM ======================================

echo Starting Project...

REM Start Backend
echo Starting Backend...
start cmd /k "cd backend && venv\Scripts\activate && python manage.py runserver"

REM Start Frontend
echo Starting Frontend...
start cmd /k "cd frontend && npm run dev"

REM Wait a few seconds for servers to start
timeout /t 5 >nul

REM Open browser tabs (default browser)
start http://127.0.0.1:8000/admin/
start http://localhost:5173