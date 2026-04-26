@echo off
echo =========================================
echo Starting Frontend (Vite/React)
echo =========================================
cd frontend
if not exist "node_modules\" (
    echo [!] node_modules not found. Running npm install...
    call npm install
)
call npm run dev
pause
