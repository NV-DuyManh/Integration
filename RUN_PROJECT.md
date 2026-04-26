# HR & Payroll Middleware — Run Guide

This document provides the exact steps to install, run, and test the Integration project.

## 1. Installation

### Backend Setup
Open a terminal and run:
```bat
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend Setup
Open a new terminal and run:
```bat
cd frontend
npm install
```

## 2. Running the Project

You can use the provided batch files for a one-click startup on Windows:
- Double-click `run_backend.bat`
- Double-click `run_frontend.bat`

Alternatively, you can run them manually:

### Start Backend
```bat
cd backend
.\venv\Scripts\activate
python app.py
```
*The backend runs on `http://localhost:8000`.*

### Start Frontend
```bat
cd frontend
npm run dev
```
*The frontend runs on `http://localhost:5173`.*

## 3. Testing Authentication (Login/Register)

1. Open your browser and go to [http://localhost:5173](http://localhost:5173).
2. You will see the Login page. Click the **Create Account** tab.
3. Fill in the registration form (e.g., Username: `testuser`, Password: `password123`).
4. Click **Create Account**. You will be automatically logged in and redirected to the Dashboard.
5. In the top right, click **Logout** to test the logout flow.
6. Now on the **Sign In** tab, log back in with the credentials you just created.

## 4. Troubleshooting

- **Backend starts and immediately shuts down?**
  This issue has been fixed (WatchFiles was detecting `auth.db` changes and triggering an infinite reload loop). If you ever experience this again, ensure `reload_excludes` in `backend/app.py` contains `"**/*.db*", "**/*.db-wal", "**/*.db-shm"`.
- **Port 8000 is occupied?**
  If port 8000 is in use by another process, `app.py` falls back to `8001`. The frontend is now configured to check for the `VITE_API_URL` environment variable, but it defaults to `http://localhost:8000`. To fix port conflicts, kill the zombie Python process or set a `.env` file in the frontend with `VITE_API_URL=http://localhost:8001`.
- **Database Connection Issues?**
  Make sure your SQL Server (`HUMAN_2025`) and MySQL (`PAYROLL_2026`) instances are running locally. Review `backend/.env` for connection parameters.
