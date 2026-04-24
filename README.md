# ═══════════════════════════════════════════════════════════════════
#  Integrated HR & Payroll Middleware Dashboard
# ═══════════════════════════════════════════════════════════════════

> Middleware dashboard bridging **HUMAN_2025** (SQL Server) and **PAYROLL_2026** (MySQL) into a unified interface.

## Architecture

```
┌─────────────┐      ┌─────────────────────────────────────┐
│   React     │      │         FastAPI Backend              │
│   Frontend  │─────►│  api/ → services/ → repositories/   │
│   :3000     │      │         │                │           │
└─────────────┘      │    ┌────┴───┐      ┌────┴───┐       │
                     │    │HR Svc  │      │Pay Svc │       │
                     │    └───┬────┘      └───┬────┘       │
                     └────────┼───────────────┼────────────┘
                              │               │
                     ┌────────▼───┐   ┌───────▼────┐
                     │ SQL Server │   │   MySQL    │
                     │ HUMAN_2025 │   │PAYROLL_2026│
                     └────────────┘   └────────────┘
```

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env     # Edit with real credentials
python main.py
# → http://localhost:8000
# → Docs: http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

## Databases

| Database | Engine | Purpose |
|----------|--------|---------|
| HUMAN_2025 | SQL Server | HR / Employee data |
| PAYROLL_2026 | MySQL | Payroll / Salary data |

## Project Structure

```
InterationProject/
├── backend/
│   ├── main.py                  # FastAPI entry point
│   ├── requirements.txt
│   ├── .env.example
│   ├── app/
│   │   ├── config.py            # Settings from .env
│   │   └── database/
│   │       ├── sqlserver.py     # HUMAN_2025 connection
│   │       └── mysql.py         # PAYROLL_2026 connection
│   ├── api/
│   │   ├── hr_routes.py         # /api/hr/*
│   │   ├── payroll_routes.py    # /api/payroll/*
│   │   └── dashboard_routes.py  # /api/dashboard/*
│   ├── services/
│   │   ├── hr_service.py        # HR business logic
│   │   ├── payroll_service.py   # Payroll business logic
│   │   └── dashboard_service.py # Cross-DB aggregation
│   └── repositories/
│       ├── hr_repository.py     # SQL Server queries
│       └── payroll_repository.py# MySQL queries
└── frontend/                    # React + Vite
```