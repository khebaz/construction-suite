"""
Seed the database with:
  - One superadmin account
  - One of each role user
  - One sample road project with sections and milestones

Run from the backend/ directory:
    python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import date, timedelta
from app.database import SessionLocal, engine
from app.database import Base
import app.models  # registers all models
from app.models.user import User, UserRole
from app.models.project import (
    Project, ProjectSection, ProjectMilestone,
    ProjectStatus, SectionStatus, MilestoneStatus, RoadSurfaceType
)
from app.models.modules import (
    SiteReport, Equipment, Material, Attendance,
    FinancialRecord, SafetyIncident, Document, Report,
)
from app.services.auth_service import hash_password


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ── Users ─────────────────────────────────────────────────────────────
        users_data = [
            {
                "first_name": "System",
                "last_name": "Administrator",
                "email": "admin@construction.bw",
                "password": "Admin@1234",
                "role": UserRole.ADMINISTRATOR,
                "job_title": "System Administrator",
                "is_superuser": True,
            },
            {
                "first_name": "Thabo",
                "last_name": "Mokoena",
                "email": "thabo.pm@construction.bw",
                "password": "Pass@1234",
                "role": UserRole.PROJECT_MANAGER,
                "job_title": "Senior Project Manager",
            },
            {
                "first_name": "Kefilwe",
                "last_name": "Sithole",
                "email": "kefilwe.eng@construction.bw",
                "password": "Pass@1234",
                "role": UserRole.SITE_ENGINEER,
                "job_title": "Civil Engineer",
            },
            {
                "first_name": "Mpho",
                "last_name": "Dube",
                "email": "mpho.foreman@construction.bw",
                "password": "Pass@1234",
                "role": UserRole.FOREMAN,
                "job_title": "Site Foreman",
            },
            {
                "first_name": "Boitumelo",
                "last_name": "Kgosi",
                "email": "boitumelo.store@construction.bw",
                "password": "Pass@1234",
                "role": UserRole.STOREKEEPER,
                "job_title": "Storekeeper",
            },
            {
                "first_name": "Kagiso",
                "last_name": "Nkwe",
                "email": "kagiso.equip@construction.bw",
                "password": "Pass@1234",
                "role": UserRole.EQUIPMENT_MGR,
                "job_title": "Equipment Manager",
            },
            {
                "first_name": "Naledi",
                "last_name": "Phiri",
                "email": "naledi.accounts@construction.bw",
                "password": "Pass@1234",
                "role": UserRole.ACCOUNTANT,
                "job_title": "Accountant",
            },
            {
                "first_name": "Client",
                "last_name": "Representative",
                "email": "client@dird.gov.bw",
                "password": "Pass@1234",
                "role": UserRole.CLIENT,
                "job_title": "Roads Inspector — Department of Roads",
            },
        ]

        created_users = {}
        for u_data in users_data:
            existing = db.query(User).filter(User.email == u_data["email"]).first()
            if existing:
                created_users[u_data["role"]] = existing
                print(f"  ->  User exists: {u_data['email']}")
                continue

            user = User(
                first_name=u_data["first_name"],
                last_name=u_data["last_name"],
                email=u_data["email"],
                password_hash=hash_password(u_data["password"]),
                role=u_data["role"],
                job_title=u_data.get("job_title"),
                is_superuser=u_data.get("is_superuser", False),
            )
            db.add(user)
            db.flush()
            created_users[u_data["role"]] = user
            print(f"  OK  Created user: {user.email} [{user.role}]")

        # ── Project ───────────────────────────────────────────────────────────
        existing_project = db.query(Project).filter(
            Project.project_number == "DIRD-2024-001"
        ).first()

        if existing_project:
            print("  ->  Project exists: DIRD-2024-001")
        else:
            today = date.today()
            project = Project(
                name="Moshupa–Kanye Road Rehabilitation",
                project_number="DIRD-2024-001",
                description=(
                    "Rehabilitation and upgrading of the D516 road between "
                    "Moshupa and Kanye in Southern District. Works include "
                    "regravelling, drainage improvement, and culvert replacement."
                ),
                location="D516 Road, Moshupa to Kanye",
                district="Ngwaketse South",
                village="Moshupa",
                total_length_km=12.4,
                surface_type=RoadSurfaceType.GRAVEL,
                start_chainage=0.0,
                end_chainage=12.4,
                planned_start=today,
                planned_end=today + timedelta(days=180),
                actual_start=today,
                contract_value=8_500_000.00,
                currency="BWP",
                client_name="Department of Roads, Botswana",
                client_contact="Roads Inspector",
                client_email="client@dird.gov.bw",
                contract_number="DOR/DIRD-2024-001/CON",
                status=ProjectStatus.ACTIVE,
                completion_pct=0.0,
                gps_start_lat=-24.7833,
                gps_start_lng=25.4833,
                gps_end_lat=-24.9667,
                gps_end_lng=25.3500,
            )
            db.add(project)
            db.flush()

            # ── Sections ──────────────────────────────────────────────────────
            sections_data = [
                {
                    "section_name": "Section A — Moshupa Village to Km 3+500",
                    "chainage_start": 0.0, "chainage_end": 3.5,
                    "planned_start": today,
                    "planned_end": today + timedelta(days=45),
                    "status": SectionStatus.IN_PROGRESS,
                    "completion_pct": 15.0,
                    "gps_start_lat": -24.7833, "gps_start_lng": 25.4833,
                    "gps_end_lat": -24.8200,   "gps_end_lng": 25.4600,
                },
                {
                    "section_name": "Section B — Km 3+500 to Km 7+000",
                    "chainage_start": 3.5, "chainage_end": 7.0,
                    "planned_start": today + timedelta(days=40),
                    "planned_end": today + timedelta(days=100),
                    "status": SectionStatus.NOT_STARTED,
                    "completion_pct": 0.0,
                    "gps_start_lat": -24.8200, "gps_start_lng": 25.4600,
                    "gps_end_lat": -24.8800,   "gps_end_lng": 25.4100,
                },
                {
                    "section_name": "Section C — Km 7+000 to Km 10+500",
                    "chainage_start": 7.0, "chainage_end": 10.5,
                    "planned_start": today + timedelta(days=95),
                    "planned_end": today + timedelta(days=145),
                    "status": SectionStatus.NOT_STARTED,
                    "completion_pct": 0.0,
                    "gps_start_lat": -24.8800, "gps_start_lng": 25.4100,
                    "gps_end_lat": -24.9200,   "gps_end_lng": 25.3800,
                },
                {
                    "section_name": "Section D — Km 10+500 to Kanye (Km 12+400)",
                    "chainage_start": 10.5, "chainage_end": 12.4,
                    "planned_start": today + timedelta(days=140),
                    "planned_end": today + timedelta(days=175),
                    "status": SectionStatus.NOT_STARTED,
                    "completion_pct": 0.0,
                    "gps_start_lat": -24.9200, "gps_start_lng": 25.3800,
                    "gps_end_lat": -24.9667,   "gps_end_lng": 25.3500,
                },
                {
                    "section_name": "Drainage & Culverts — All Sections",
                    "chainage_start": 0.0, "chainage_end": 12.4,
                    "planned_start": today,
                    "planned_end": today + timedelta(days=180),
                    "status": SectionStatus.IN_PROGRESS,
                    "completion_pct": 5.0,
                },
            ]

            for s_data in sections_data:
                section = ProjectSection(
                    project_id=project.id,
                    section_name=s_data["section_name"],
                    chainage_start=s_data.get("chainage_start"),
                    chainage_end=s_data.get("chainage_end"),
                    length_km=round(
                        s_data["chainage_end"] - s_data["chainage_start"], 3
                    ) if s_data.get("chainage_start") is not None else None,
                    planned_start=s_data.get("planned_start"),
                    planned_end=s_data.get("planned_end"),
                    status=s_data["status"],
                    completion_pct=s_data["completion_pct"],
                    gps_start_lat=s_data.get("gps_start_lat"),
                    gps_start_lng=s_data.get("gps_start_lng"),
                    gps_end_lat=s_data.get("gps_end_lat"),
                    gps_end_lng=s_data.get("gps_end_lng"),
                )
                db.add(section)

            # ── Milestones ────────────────────────────────────────────────────
            milestones_data = [
                {
                    "title": "Site Mobilisation Complete",
                    "due_date": today + timedelta(days=14),
                    "weight_pct": 5.0,
                    "status": MilestoneStatus.IN_PROGRESS,
                },
                {
                    "title": "Section A Regravelling Complete",
                    "due_date": today + timedelta(days=45),
                    "weight_pct": 20.0,
                },
                {
                    "title": "Section B Complete",
                    "due_date": today + timedelta(days=100),
                    "weight_pct": 20.0,
                },
                {
                    "title": "Section C Complete",
                    "due_date": today + timedelta(days=145),
                    "weight_pct": 20.0,
                },
                {
                    "title": "All Culverts Installed",
                    "due_date": today + timedelta(days=160),
                    "weight_pct": 15.0,
                },
                {
                    "title": "Practical Completion",
                    "due_date": today + timedelta(days=180),
                    "weight_pct": 20.0,
                },
            ]

            for m_data in milestones_data:
                milestone = ProjectMilestone(
                    project_id=project.id,
                    title=m_data["title"],
                    due_date=m_data["due_date"],
                    weight_pct=m_data["weight_pct"],
                    status=m_data.get("status", MilestoneStatus.PENDING),
                )
                db.add(milestone)

            # ── Assign team ───────────────────────────────────────────────────
            team_roles = [
                UserRole.PROJECT_MANAGER, UserRole.SITE_ENGINEER,
                UserRole.FOREMAN, UserRole.STOREKEEPER,
                UserRole.EQUIPMENT_MGR, UserRole.CLIENT,
            ]
            for role in team_roles:
                user = created_users.get(role)
                if user:
                    project.team_members.append(user)

            print(f"  OK  Created project: {project.name}")

            # ── Module Seed Data ──────────────────────────────────────────────
            today = date.today()
            admin = created_users.get(UserRole.ADMINISTRATOR)
            engineer = created_users.get(UserRole.SITE_ENGINEER)
            pm = created_users.get(UserRole.PROJECT_MANAGER)
            foreman = created_users.get(UserRole.FOREMAN)

            # ── Site Reports ───────────────────────────────────────────────────
            if not db.query(SiteReport).filter(SiteReport.project_id == project.id).first():
                db.add(SiteReport(project_id=project.id, report_date=today, weather="Sunny 32°C", work_done="Survey and setting out of Section A. Clearing of vegetation along 500m.", issues="None", planned_next="Continue clearing Section A. Commence culvert excavation.", status="submitted", reported_by_id=engineer.id if engineer else None))
                db.add(SiteReport(project_id=project.id, report_date=today - timedelta(days=1), weather="Partly cloudy 28°C", work_done="Site establishment. Setup of site office and material laydown area.", issues="Water bowser delivery delayed by 1 day.", planned_next="Survey works. Commence clearing.", status="approved", reported_by_id=engineer.id if engineer else None))
                print("  OK  Seeded Site Reports")

            # ── Equipment ──────────────────────────────────────────────────────
            if not db.query(Equipment).filter(Equipment.project_id == project.id).first():
                equip_data = [
                    ("CAT 320 Excavator", "excavator", "CAT", "320D", "BWA-4501-G", "in_use", 120.5),
                    ("Volvo G930 Grader", "grader", "Volvo", "G930", "BWA-4502-G", "available", 85.0),
                    ("Bomag BW211 Roller", "roller", "Bomag", "BW211", "BWA-4503-G", "maintenance", 200.0),
                    ("Mack GU813 Truck", "truck", "Mack", "GU813", "BWA-4504-G", "in_use", 340.0),
                ]
                for name, etype, make, model, reg, status, hours in equip_data:
                    db.add(Equipment(project_id=project.id, name=name, equipment_type=etype, make=make, model=model, registration=reg, status=status, hours_used=hours))
                print("  OK  Seeded Equipment")

            # ── Materials ──────────────────────────────────────────────────────
            if not db.query(Material).filter(Material.project_id == project.id).first():
                materials_data = [
                    ("G1 Crushed Stone", "aggregate", 500, "tons", 185.00, "Kgosi Quarry", today),
                    ("Cement 42.5N", "cement", 200, "bags", 85.00, "BOTASH", today),
                    ("Diesel (ULS)", "fuel", 5000, "liters", 15.50, "Engen Botswana", today),
                    ("Reinforcing Steel Y12", "steel", 50, "tons", 8500.00, "Botswana Steel", None),
                    ("PVC Pipe 450mm", "pipe", 120, "lengths", 1200.00, "Pipes Botswana", today - timedelta(days=3)),
                ]
                for name, cat, qty, unit, price, supplier, rdate in materials_data:
                    db.add(Material(project_id=project.id, name=name, category=cat, quantity=qty, unit=unit, unit_price=price, supplier=supplier, received_date=rdate))
                print("  OK  Seeded Materials")

            # ── Attendance ─────────────────────────────────────────────────────
            if not db.query(Attendance).filter(Attendance.project_id == project.id).first():
                workers = ["John Modise", "Olebile Ramotsho", "Gofaone Motsumi", "Kealeboga Moipolai", "Tumelo Seretse"]
                for i, w in enumerate(workers):
                    db.add(Attendance(project_id=project.id, worker_name=w, date=today - timedelta(days=i % 5), hours_worked=9.0, task="Clearing & grubbing", pay_rate=35.00))
                print("  OK  Seeded Attendance")

            # ── Financial ──────────────────────────────────────────────────────
            if not db.query(FinancialRecord).filter(FinancialRecord.project_id == project.id).first():
                fin_data = [
                    ("invoice", "materials", 125000.00, "G1 Crushed Stone — 500 tons", today - timedelta(days=5), "INV-2024-001"),
                    ("payment", "equipment", 45000.00, "Equipment hire — Excavator (2 weeks)", today - timedelta(days=2), "PAY-001"),
                    ("expense", "labor", 28800.00, "Weekly wages — 8 labourers × 5 days", today - timedelta(days=1), "EXP-001"),
                    ("invoice", "materials", 17000.00, "Diesel supply — 5000 liters", today, "INV-2024-002"),
                ]
                for rtype, cat, amt, desc, rdate, ref in fin_data:
                    db.add(FinancialRecord(project_id=project.id, record_type=rtype, category=cat, amount=amt, description=desc, record_date=rdate, reference=ref, paid_by_id=admin.id if admin else None))
                print("  OK  Seeded Financial Records")

            # ── Safety ─────────────────────────────────────────────────────────
            if not db.query(SafetyIncident).filter(SafetyIncident.project_id == project.id).first():
                db.add(SafetyIncident(project_id=project.id, incident_date=today - timedelta(days=10), severity="low", incident_type="near_miss", description="Worker almost stepped on a loose nail near the store area.", location="Site store", action_taken="Area cleaned. Safety briefing conducted.", status="resolved", reported_by_id=foreman.id if foreman else None))
                db.add(SafetyIncident(project_id=project.id, incident_date=today - timedelta(days=3), severity="medium", incident_type="hazard", description="Unprotected edge at culvert excavation — 2m deep trench without barriers.", location="Km 1+200", action_taken="Barricades installed. Warning signs posted.", status="closed", reported_by_id=engineer.id if engineer else None))
                print("  OK  Seeded Safety Incidents")

            # ── Documents ─────────────────────────────────────────────────────
            if not db.query(Document).filter(Document.project_id == project.id).first():
                doc_data = [
                    ("Contract Agreement — DIRD-2024-001", "contract", "/uploads/contract-dird-2024-001.pdf", "Signed contract between DIRD and contractor"),
                    ("Site Layout Drawing — Sheet 1", "drawing", "/uploads/drawing-site-layout.pdf", "Overall site layout with chainage markers"),
                    ("Weekly Report — Week 1", "report", "/uploads/weekly-report-wk1.pdf", "Progress report for first week of works"),
                ]
                for name, dtype, url, desc in doc_data:
                    db.add(Document(project_id=project.id, name=name, doc_type=dtype, file_url=url, description=desc, uploaded_by_id=engineer.id if engineer else None))
                print("  OK  Seeded Documents")

            # ── Reports ────────────────────────────────────────────────────────
            if not db.query(Report).filter(Report.project_id == project.id).first():
                db.add(Report(project_id=project.id, name="Weekly Progress Report — Week 1", report_type="weekly", content="Mobilisation complete. Site clearing commenced on Section A. Survey works ongoing. First culvert excavation scheduled for next week.", generated_date=today - timedelta(days=1), generated_by_id=engineer.id if engineer else None, status="published"))
                db.add(Report(project_id=project.id, name="Monthly Progress Report — March 2026", report_type="monthly", content="Overall progress: 3.2% complete. Section A clearing at 65%. Drainage works commenced. Budget expenditure within forecast.", generated_date=today, generated_by_id=pm.id if pm else None, status="draft"))
                print("  OK  Seeded Reports")

        db.commit()
        print("\nDONE  Seed complete.")
        print("\n-- Login credentials ----------------------------------")
        print("  Admin:   admin@construction.bw       / Admin@1234")
        print("  PM:      thabo.pm@construction.bw    / Pass@1234")
        print("  Engineer: kefilwe.eng@construction.bw / Pass@1234")
        print("  Client:  client@dird.gov.bw          / Pass@1234")
        print("----------------------------------------------------")

    except Exception as e:
        db.rollback()
        print(f"\nFAIL  Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
