# Construction Suite — Road Project Management System

A full-stack construction project management dashboard for road infrastructure projects. Built with **FastAPI** (Python) + **React** (Vite).

## Features

- **Role-based dashboards** — Admin, Project Manager, Site Engineer, Foreman, Storekeeper, Equipment Manager, Accountant, Client — each sees only what they need
- **9 sidebar modules**: Dashboard, Projects, Site Reports, Equipment, Materials, Attendance, Financial, Safety, Documents, Reports, Settings
- **Company settings** — customise company name, logo, and contact details that appear on all pages
- **User management** — admins can create, delete, and reset passwords for users
- **File uploads** — attach images/PDFs to documents
- **Full CRUD** on all modules with View / Edit / Delete
- **Drill-down projects** — sections, milestones, chainage bar, progress charts
- **SQLite** — zero-config database, no server setup needed

## Quick Start

### Prerequisites

- **Python 3.12+** — [download](https://www.python.org/downloads/)
- **Node.js 20+** — [download](https://nodejs.org/)

### One-Click Launch

Double-click **`start.bat`** (Windows). It will:

1. Install Python packages (`pip install -r requirements.txt`)
2. Seed the SQLite database with demo data (first run only)
3. Install frontend packages (`npm install`)
4. Start the backend API on `http://127.0.0.1:8000`
5. Start the frontend dev server on `http://localhost:5173`
6. Open the browser automatically

### Manual Launch

```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
python seed_data.py          # first run only
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

## Project Structure

```
construction-suite/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py             # Settings (DB URL, CORS, etc.)
│   │   ├── database.py           # SQLAlchemy engine + session
│   │   ├── models/               # SQLAlchemy models
│   │   ├── schemas/              # Pydantic request/response models
│   │   ├── routers/              # API route handlers
│   │   ├── middleware/auth.py    # JWT auth + role enforcement
│   │   └── services/auth_service.py
│   ├── uploads/                  # Uploaded files (gitignored)
│   ├── seed_data.py              # Database seeder
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Main app, sidebar, routing
│   │   ├── ModulePages.jsx       # All 9 module pages + Settings
│   │   ├── api.js                # API client with auth
│   │   └── main.jsx              # React entry
│   └── package.json
├── start.bat                     # One-click setup & launch
└── README.md
```

## Deployment

### Single-Server (no Docker)

```bash
cd frontend
npm run build                     # produces frontend/dist/
cd ../backend
pip install waitress
waitress-serve --host 0.0.0.0 --port 8000 app.main:app
```

Then put **nginx** in front with an SSL cert (Let's Encrypt) and set `ALLOWED_ORIGINS` in `.env`.

### Docker

```bash
docker build -t construction-suite .
docker run -p 8000:8000 construction-suite
```

## API Documentation

When the backend is running, visit http://127.0.0.1:8000/docs for interactive Swagger docs.
