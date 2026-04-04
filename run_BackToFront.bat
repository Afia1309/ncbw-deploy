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

echo All services started!
pause