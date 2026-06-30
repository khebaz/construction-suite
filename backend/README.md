# Construction Management Suite — Backend API

FastAPI + PostgreSQL backend for road construction project management.

## Quick Start

### Prerequisites
- Python 3.10+
- PostgreSQL 14+

### Setup

```bash
# 1. Clone and enter backend directory
cd construction_suite/backend

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL and SECRET_KEY

# 5. Create the PostgreSQL database
createdb construction_suite

# 6. Run migrations
alembic upgrade head

# 7. Seed with sample data
python seed.py

# 8. Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or just run: `bash run.sh`

---

## API Documentation

Once running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:**       http://localhost:8000/redoc

---

## Seed Users

| Role              | Email                            | Password    |
|-------------------|----------------------------------|-------------|
| Administrator     | admin@construction.bw            | Admin@1234  |
| Project Manager   | thabo.pm@construction.bw         | Pass@1234   |
| Site Engineer     | kefilwe.eng@construction.bw      | Pass@1234   |
| Foreman           | mpho.foreman@construction.bw     | Pass@1234   |
| Storekeeper       | boitumelo.store@construction.bw  | Pass@1234   |
| Equipment Manager | kagiso.equip@construction.bw     | Pass@1234   |
| Accountant        | naledi.accounts@construction.bw  | Pass@1234   |
| Client            | client@dird.gov.bw               | Pass@1234   |

---

## API Endpoints (Phase 1)

### Authentication
| Method | Endpoint                   | Description              | Auth |
|--------|----------------------------|--------------------------|------|
| POST   | /api/v1/auth/login         | Login, get JWT           | No   |
| GET    | /api/v1/auth/me            | Current user profile     | Yes  |
| POST   | /api/v1/auth/change-password | Change password        | Yes  |

### Users
| Method | Endpoint               | Description         | Roles            |
|--------|------------------------|---------------------|------------------|
| GET    | /api/v1/users/         | List all users      | Admin, PM        |
| POST   | /api/v1/users/         | Create user         | Admin            |
| GET    | /api/v1/users/{id}     | Get user            | Own or Admin     |
| PATCH  | /api/v1/users/{id}     | Update user         | Own or Admin     |
| DELETE | /api/v1/users/{id}     | Deactivate user     | Admin            |

### Projects
| Method | Endpoint                                       | Description              | Roles        |
|--------|------------------------------------------------|--------------------------|--------------|
| GET    | /api/v1/projects/stats                         | Dashboard KPIs           | All          |
| GET    | /api/v1/projects/                              | List projects            | All          |
| POST   | /api/v1/projects/                              | Create project           | Admin, PM    |
| GET    | /api/v1/projects/{id}                          | Project detail           | Assigned     |
| PATCH  | /api/v1/projects/{id}                          | Update project           | Admin, PM    |
| DELETE | /api/v1/projects/{id}                          | Archive project          | Admin        |
| POST   | /api/v1/projects/{id}/team                     | Set team (replace)       | Admin, PM    |
| POST   | /api/v1/projects/{id}/team/add                 | Add team member          | Admin, PM    |
| DELETE | /api/v1/projects/{id}/team/{user_id}           | Remove team member       | Admin, PM    |
| GET    | /api/v1/projects/{id}/sections                 | List sections            | Assigned     |
| POST   | /api/v1/projects/{id}/sections                 | Create section           | Admin, PM    |
| PATCH  | /api/v1/projects/{id}/sections/{sid}           | Update section progress  | Engineer+    |
| DELETE | /api/v1/projects/{id}/sections/{sid}           | Delete section           | Admin, PM    |
| GET    | /api/v1/projects/{id}/milestones               | List milestones          | Assigned     |
| POST   | /api/v1/projects/{id}/milestones               | Create milestone         | Admin, PM    |
| PATCH  | /api/v1/projects/{id}/milestones/{mid}         | Update milestone         | Admin, PM    |
| DELETE | /api/v1/projects/{id}/milestones/{mid}         | Delete milestone         | Admin, PM    |

---

## Project Structure

```
backend/
├── app/
│   ├── main.py              ← FastAPI app, CORS, router registration
│   ├── config.py            ← Settings (pydantic-settings, .env)
│   ├── database.py          ← SQLAlchemy engine, session, get_db
│   ├── models/
│   │   ├── base.py          ← UUID + Timestamp mixins
│   │   ├── user.py          ← User model, UserRole enum
│   │   └── project.py       ← Project, ProjectSection, ProjectMilestone
│   ├── schemas/
│   │   ├── auth.py          ← Login, Token Pydantic schemas
│   │   ├── user.py          ← UserCreate, UserResponse, etc.
│   │   └── project.py       ← ProjectCreate, SectionCreate, etc.
│   ├── routers/
│   │   ├── auth.py          ← /auth/login, /auth/me
│   │   ├── users.py         ← /users CRUD
│   │   └── projects.py      ← /projects + sections + milestones
│   ├── services/
│   │   └── auth_service.py  ← JWT, bcrypt
│   └── middleware/
│       └── auth.py          ← get_current_user, require_roles
├── alembic/
│   └── env.py               ← Auto-migration config
├── seed.py                  ← Sample data seeder
├── requirements.txt
├── alembic.ini
├── run.sh
└── .env.example
```

---

## Next Modules to Build

- **Phase 1 continued:**
  - Daily Site Reports (with photo upload + GPS)
  - Equipment Management + Fuel Logs
  - Materials Inventory
  - Attendance & Timesheets
- **Phase 2:** Financial (Budget, POs, Invoices)
- **Phase 3:** Safety & Quality
- **Phase 4:** PDF/Excel Reports
