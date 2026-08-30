@echo off
cd /d "C:\Projects\Health Care\health-care"
echo Running eslint --fix...
npm run lint -- --fix --format json > "lint-fix-output.json" 2>nul
echo EXIT_CODE:%ERRORLEVEL%
echo Done.
