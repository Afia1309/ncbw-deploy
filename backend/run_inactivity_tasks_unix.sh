#!/bin/bash

# ======================================
# Training Portal Maintenance Script
# Runs inactivity reminders + progress reset
# ======================================

# Move to the directory where this script is located
cd "$(dirname "$0")"

# Check for virtual environment
if [ ! -d "venv" ]; then
    echo "Virtual environment not found."
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Create logs folder if missing
mkdir -p logs

# Create new log file per day
LOGFILE="logs/maintenance_$(date +%Y-%m-%d).log"

echo "======================================" >> "$LOGFILE"
echo "Maintenance run: $(date)" >> "$LOGFILE"

echo "Running inactivity reminder check..." >> "$LOGFILE"
python manage.py send_inactivity_emails >> "$LOGFILE" 2>&1

echo "Running inactivity progress reset check..." >> "$LOGFILE"
python manage.py reset_inactive_progress >> "$LOGFILE" 2>&1

echo "Maintenance complete." >> "$LOGFILE"
echo "" >> "$LOGFILE"

# Deactivate virtual environment
deactivate