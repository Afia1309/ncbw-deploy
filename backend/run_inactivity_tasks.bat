@echo off

REM ======================================
REM Training Portal Maintenance Script
REM Runs inactivity reminders + progress reset
REM ======================================

REM Move to the directory where this script is located (backend folder)
cd /d %~dp0


REM Check for virtual environment
IF NOT EXIST venv (
    echo Virtual environment not found.
    exit /b
)

REM Activate Django virtual environment
call venv\Scripts\activate


REM Create logs folder if missing
if not exist logs mkdir logs

REM Create new log file per day
set LOGFILE=logs\maintenance_%date:~-4,4%-%date:~-10,2%-%date:~-7,2%.log

echo ====================================== >> %LOGFILE%
echo Maintenance run: %date% %time% >> %LOGFILE%

echo Running inactivity reminder check... >> %LOGFILE%
python manage.py send_inactivity_emails >> %LOGFILE% 2>&1
REM (Testing) python manage.py send_inactivity_emails --minutes 1 >> %LOGFILE% 2>&1

echo Running inactivity progress reset check... >> %LOGFILE%
python manage.py reset_inactive_progress >> %LOGFILE% 2>&1

echo Maintenance complete. >> %LOGFILE%
echo. >> %LOGFILE%

REM Turn off virtual enviornment
deactivate