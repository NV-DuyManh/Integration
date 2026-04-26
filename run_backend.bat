@echo off
echo =========================================
echo Starting Backend (FastAPI)
echo =========================================
cd backend
if not exist "venv\Scripts\activate.bat" (
    echo [!] Virtual environment not found. Please run installation steps in RUN_PROJECT.md.
    pause
    exit /b 1
)
call venv\Scripts\activate.bat
python app.py
pause
