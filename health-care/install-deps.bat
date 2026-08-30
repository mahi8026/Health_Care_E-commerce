@echo off
cd /d "C:\Projects\Health Care\health-care"
"C:\Program Files\nodejs\npm.cmd" install --legacy-peer-deps --no-audit --no-fund
echo EXIT_CODE:%ERRORLEVEL%
