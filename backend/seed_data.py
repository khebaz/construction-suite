import sqlite3, uuid
from datetime import date, timedelta

today = date.today()
db = sqlite3.connect("construction_suite.db")
c = db.cursor()

uid = lambda: uuid.uuid4().hex

# Get existing project and user IDs
c.execute("SELECT id FROM projects LIMIT 1")
project_id = c.fetchone()[0]

# Get user IDs by role
c.execute("SELECT id, role FROM users")
users = {row[1]: row[0] for row in c.fetchall()}

admin_id = users.get("administrator")
eng_id = users.get("site_engineer")
pm_id = users.get("project_manager")
foreman_id = users.get("foreman")

def insert(table, data_list):
    for row in data_list:
        cols = ", ".join(row.keys())
        vals = ", ".join("?" for _ in row)
        c.execute(f"INSERT INTO {table} ({cols}) VALUES ({vals})", list(row.values()))
    print(f"  {table}: {len(data_list)} rows")

# ── Site Reports ─────────────────────────────────────────────────────────────
insert("site_reports", [
    {"id": uid(), "project_id": project_id, "report_date": str(today - timedelta(days=2)), "weather": "Sunny 32°C", "temperature": "32", "work_done": "Survey and setting out of Section A. Clearing of vegetation along 500m.", "issues": "None", "planned_next": "Continue clearing Section A. Commence culvert excavation.", "status": "submitted", "reported_by_id": eng_id, "created_at": str(today), "updated_at": str(today)},
    {"id": uid(), "project_id": project_id, "report_date": str(today - timedelta(days=5)), "weather": "Partly cloudy 28°C", "temperature": "28", "work_done": "Site establishment. Setup of site office and material laydown area.", "issues": "Water bowser delivery delayed by 1 day.", "planned_next": "Survey works. Commence clearing.", "status": "approved", "reported_by_id": eng_id, "created_at": str(today), "updated_at": str(today)},
    {"id": uid(), "project_id": project_id, "report_date": str(today - timedelta(days=8)), "weather": "Overcast 26°C", "temperature": "26", "work_done": "Mobilisation of plant and equipment to site. Site induction for all workers.", "issues": "None", "planned_next": "Begin clearing Section A. Setup store area.", "status": "approved", "reported_by_id": pm_id, "created_at": str(today), "updated_at": str(today)},
])

# ── Equipment ────────────────────────────────────────────────────────────────
insert("equipment", [
    {"id": uid(), "project_id": project_id, "name": "CAT 320 Excavator", "equipment_type": "excavator", "make": "CAT", "model": "320D", "registration": "BWA-4501-G", "status": "in_use", "hours_used": 120.5, "fuel_consumption": 18.5, "assigned_to_id": eng_id, "notes": "", "created_at": str(today), "updated_at": str(today)},
    {"id": uid(), "project_id": project_id, "name": "Volvo G930 Grader", "equipment_type": "grader", "make": "Volvo", "model": "G930", "registration": "BWA-4502-G", "status": "available", "hours_used": 85.0, "fuel_consumption": 22.0, "assigned_to_id": None, "notes": "Recently serviced", "created_at": str(today), "updated_at": str(today)},
    {"id": uid(), "project_id": project_id, "name": "Bomag BW211 Roller", "equipment_type": "roller", "make": "Bomag", "model": "BW211", "registration": "BWA-4503-G", "status": "maintenance", "hours_used": 200.0, "fuel_consumption": 12.0, "assigned_to_id": None, "notes": "In for scheduled service", "created_at": str(today), "updated_at": str(today)},
    {"id": uid(), "project_id": project_id, "name": "Mack GU813 Tipper Truck", "equipment_type": "truck", "make": "Mack", "model": "GU813", "registration": "BWA-4504-G", "status": "in_use", "hours_used": 340.0, "fuel_consumption": 35.0, "assigned_to_id": foreman_id, "notes": "", "created_at": str(today), "updated_at": str(today)},
    {"id": uid(), "project_id": project_id, "name": "Water Tanker 12kl", "equipment_type": "water_tanker", "make": "Tata", "model": "LPT 2518", "registration": "BWA-4505-G", "status": "available", "hours_used": 60.0, "fuel_consumption": 20.0, "assigned_to_id": None, "notes": "", "created_at": str(today), "updated_at": str(today)},
])

# ── Materials ────────────────────────────────────────────────────────────────
insert("materials", [
    {"id": uid(), "project_id": project_id, "name": "G1 Crushed Stone", "category": "aggregate", "quantity": 500, "unit": "tons", "unit_price": 185.00, "supplier": "Kgosi Quarry", "received_date": str(today - timedelta(days=5)), "notes": "", "created_at": str(today), "updated_at": str(today)},
    {"id": uid(), "project_id": project_id, "name": "Cement 42.5N", "category": "cement", "quantity": 200, "unit": "bags", "unit_price": 85.00, "supplier": "BOTASH", "received_date": str(today - timedelta(days=3)), "notes": "Stored in warehouse", "created_at": str(today), "updated_at": str(today)},
    {"id": uid(), "project_id": project_id, "name": "ULS Diesel", "category": "fuel", "quantity": 5000, "unit": "liters", "unit_price": 15.50, "supplier": "Engen Botswana", "received_date": str(today), "notes": "", "created_at": str(today), "updated_at": str(today)},
    {"id": uid(), "project_id": project_id, "name": "Reinforcing Steel Y12", "category": "steel", "quantity": 50, "unit": "tons", "unit_price": 8500.00, "supplier": "Botswana Steel", "received_date": None, "notes": "On order. Expected next week.", "created_at": str(today), "updated_at": str(today)},
    {"id": uid(), "project_id": project_id, "name": "PVC Pipe 450mm", "category": "pipe", "quantity": 120, "unit": "lengths", "unit_price": 1200.00, "supplier": "Pipes Botswana", "received_date": str(today - timedelta(days=7)), "notes": "For culvert installation", "created_at": str(today), "updated_at": str(today)},
    {"id": uid(), "project_id": project_id, "name": "GABION BASKETS 2x1x1", "category": "aggregate", "quantity": 80, "unit": "units", "unit_price": 450.00, "supplier": "Kgosi Quarry", "received_date": str(today - timedelta(days=10)), "notes": "For drainage works", "created_at": str(today), "updated_at": str(today)},
])

# ── Attendance ───────────────────────────────────────────────────────────────
workers = ["John Modise", "Olebile Ramotsho", "Gofaone Motsumi", "Kealeboga Moipolai", "Tumelo Seretse", "Boitumelo Letsholo", "Godiraone Nkwe", "Onalenna Kago"]
att_data = []
for i, w in enumerate(workers):
    for d in range(5):
        wk_date = today - timedelta(days=d)
        if wk_date.weekday() < 6:
            att_data.append({"id": uid(), "project_id": project_id, "worker_name": w, "date": str(wk_date), "hours_worked": 9.0, "task": "Clearing & earthworks", "pay_rate": 35.00, "notes": "", "created_at": str(today), "updated_at": str(today)})
insert("attendance", att_data)

# ── Financial ────────────────────────────────────────────────────────────────
insert("financial_records", [
    {"id": uid(), "project_id": project_id, "record_type": "invoice", "category": "materials", "amount": 185000.00, "currency": "BWP", "description": "G1 Crushed Stone — 500 tons + delivery", "record_date": str(today - timedelta(days=7)), "reference": "INV-KQ-2024-001", "paid_by_id": admin_id, "status": "paid", "created_at": str(today), "updated_at": str(today)},
    {"id": uid(), "project_id": project_id, "record_type": "invoice", "category": "equipment", "amount": 45000.00, "currency": "BWP", "description": "Equipment hire — Excavator 320 (2 weeks)", "record_date": str(today - timedelta(days=3)), "reference": "INV-EQ-2024-002", "paid_by_id": None, "status": "pending", "created_at": str(today), "updated_at": str(today)},
    {"id": uid(), "project_id": project_id, "record_type": "expense", "category": "labor", "amount": 28800.00, "currency": "BWP", "description": "Weekly wages — 8 labourers x 5 days @ BWP 720/day", "record_date": str(today - timedelta(days=1)), "reference": "EXP-001", "paid_by_id": admin_id, "status": "paid", "created_at": str(today), "updated_at": str(today)},
    {"id": uid(), "project_id": project_id, "record_type": "invoice", "category": "fuel", "amount": 77500.00, "currency": "BWP", "description": "Diesel supply — 5000 liters @ BWP 15.50/L", "record_date": str(today), "reference": "INV-ENG-2024-003", "paid_by_id": None, "status": "pending", "created_at": str(today), "updated_at": str(today)},
    {"id": uid(), "project_id": project_id, "record_type": "payment", "category": "subcontractor", "amount": 125000.00, "currency": "BWP", "description": "Payment to Ditebogo Transport — material haulage", "record_date": str(today - timedelta(days=4)), "reference": "PAY-001", "paid_by_id": admin_id, "status": "paid", "created_at": str(today), "updated_at": str(today)},
    {"id": uid(), "project_id": project_id, "record_type": "expense", "category": "admin", "amount": 3500.00, "currency": "BWP", "description": "Site office supplies & stationery", "record_date": str(today - timedelta(days=2)), "reference": "EXP-002", "paid_by_id": admin_id, "status": "paid", "created_at": str(today), "updated_at": str(today)},
])

# ── Safety ───────────────────────────────────────────────────────────────────
insert("safety_incidents", [
    {"id": uid(), "project_id": project_id, "incident_date": str(today - timedelta(days=12)), "severity": "low", "incident_type": "near_miss", "description": "Worker almost stepped on a loose nail near the store area. No injury sustained.", "location": "Site store", "action_taken": "Area cleaned. Safety briefing conducted. All workers advised to wear safety boots.", "reported_by_id": foreman_id, "status": "resolved", "created_at": str(today), "updated_at": str(today)},
    {"id": uid(), "project_id": project_id, "incident_date": str(today - timedelta(days=6)), "severity": "medium", "incident_type": "hazard", "description": "Unprotected edge at culvert excavation — 2m deep trench without barriers or warning signs.", "location": "Km 1+200 — Culvert 3", "action_taken": "Barricades installed immediately. Warning signs posted. Toolbox talk conducted.", "reported_by_id": eng_id, "status": "closed", "created_at": str(today), "updated_at": str(today)},
    {"id": uid(), "project_id": project_id, "incident_date": str(today - timedelta(days=1)), "severity": "high", "incident_type": "accident", "description": "Tipper truck reversing without banksman — near collision with excavator. No injuries but potential for serious incident.", "location": "Km 0+800", "action_taken": "Driver issued warning. Reversing procedure reviewed. Banksman assigned.", "reported_by_id": eng_id, "status": "investigating", "created_at": str(today), "updated_at": str(today)},
])

# ── Documents ────────────────────────────────────────────────────────────────
insert("documents", [
    {"id": uid(), "project_id": project_id, "name": "Contract Agreement — DIRD-2024-001", "doc_type": "contract", "file_url": "/uploads/contract-dird-2024-001.pdf", "description": "Signed contract between DIRD and contractor for Moshupa-Kanye Road Rehabilitation", "uploaded_by_id": admin_id, "tags": "contract, legal", "created_at": str(today), "updated_at": str(today)},
    {"id": uid(), "project_id": project_id, "name": "Site Layout Drawing — Sheet 1 of 4", "doc_type": "drawing", "file_url": "/uploads/drawing-site-layout.pdf", "description": "Overall site layout with chainage markers and works areas", "uploaded_by_id": eng_id, "tags": "drawing, site", "created_at": str(today), "updated_at": str(today)},
    {"id": uid(), "project_id": project_id, "name": "Method Statement — Section A Clearing", "doc_type": "report", "file_url": "/uploads/method-statement-clearing.pdf", "description": "Approved method statement for clearing and grubbing Section A", "uploaded_by_id": eng_id, "tags": "method statement, section A", "created_at": str(today), "updated_at": str(today)},
    {"id": uid(), "project_id": project_id, "name": "Site Photo — Section A Clearing Progress", "doc_type": "photo", "file_url": "/uploads/photo-section-a-clearing.jpg", "description": "Photo of Section A clearing works taken on site", "uploaded_by_id": foreman_id, "tags": "photo, section A, clearing", "created_at": str(today), "updated_at": str(today)},
    {"id": uid(), "project_id": project_id, "name": "Material Test Report — G1 Crushed Stone", "doc_type": "report", "file_url": "/uploads/material-test-g1.pdf", "description": "Laboratory test results for G1 crushed stone — CBR and grading", "uploaded_by_id": eng_id, "tags": "test, material, G1", "created_at": str(today), "updated_at": str(today)},
])

# ── Reports ──────────────────────────────────────────────────────────────────
insert("reports", [
    {"id": uid(), "project_id": project_id, "name": "Weekly Progress Report — Week 1", "report_type": "weekly", "content": "**Week 1 Summary**\n\nMobilisation complete. Site clearing commenced on Section A. Survey works ongoing. First culvert excavation scheduled for next week.\n\n**Key Activities:**\n- Site establishment: 100% complete\n- Survey Section A: 80% complete\n- Clearing Section A: 30% complete\n\n**Issues:** None\n**Planned for Week 2:** Continue clearing Section A, commence culvert excavation at Km 1+200", "generated_date": str(today - timedelta(days=1)), "generated_by_id": eng_id, "status": "published", "created_at": str(today), "updated_at": str(today)},
    {"id": uid(), "project_id": project_id, "name": "Monthly Progress Report — June 2026", "report_type": "monthly", "content": "**Monthly Progress Report — June 2026**\n\nOverall progress: 3.2% complete. Section A clearing at 65%. Drainage works commenced. Budget expenditure within forecast.\n\n**Financial:** BWP 339,800 spent of BWP 8,500,000 (4.0% of budget)\n**Safety:** 3 incidents recorded, 2 resolved\n**Equipment:** 5 units on site, all operational", "generated_date": str(today), "generated_by_id": pm_id, "status": "draft", "created_at": str(today), "updated_at": str(today)},
    {"id": uid(), "project_id": project_id, "name": "Safety Statistics — Q2 2026", "report_type": "safety", "content": "**Q2 2026 Safety Report**\n\nTotal incidents: 3\n- Near misses: 1\n- Hazards: 1\n- Accidents: 1\n\nLost time injuries: 0\nSafety induction: 22 workers completed\nToolbox talks: 8 sessions conducted", "generated_date": str(today), "generated_by_id": foreman_id, "status": "published", "created_at": str(today), "updated_at": str(today)},
])

db.commit()
db.close()
print("\nAll module seed data inserted!")
