import uuid, os, shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User, UserRole
from app.models.modules import (
    SiteReport, Equipment, Material, Attendance,
    FinancialRecord, SafetyIncident, Document, Report
)
from app.schemas.modules import (
    SiteReportCreate, SiteReportUpdate, SiteReportResponse,
    EquipmentCreate, EquipmentUpdate, EquipmentResponse,
    MaterialCreate, MaterialUpdate, MaterialResponse,
    AttendanceCreate, AttendanceUpdate, AttendanceResponse,
    FinancialRecordCreate, FinancialRecordUpdate, FinancialRecordResponse,
    SafetyIncidentCreate, SafetyIncidentUpdate, SafetyIncidentResponse,
    DocumentCreate, DocumentUpdate, DocumentResponse,
    ReportCreate, ReportUpdate, ReportResponse,
)
from app.middleware.auth import get_current_user

router = APIRouter(tags=["Modules"])


def _get_project_id_q(project_id: Optional[str] = None):
    """Return a base filter on project_id if provided."""
    if project_id:
        uid = uuid.UUID(project_id)
        return [lambda m: m.project_id == uid]
    return []


def _paginate(q, skip, limit):
    return q.order_by(None).offset(skip).limit(limit).all()


# ═══════════════════════════════════════════════════════════════════════════════
# SITE REPORTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/site-reports", response_model=List[SiteReportResponse])
def list_site_reports(
    project_id: Optional[str] = Query(None),
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(SiteReport)
    if project_id:
        q = q.filter(SiteReport.project_id == uuid.UUID(project_id))
    return q.order_by(SiteReport.report_date.desc()).offset(skip).limit(limit).all()


@router.post("/site-reports", response_model=SiteReportResponse, status_code=status.HTTP_201_CREATED)
def create_site_report(
    payload: SiteReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = payload.model_dump()
    data["project_id"] = uuid.UUID(data.pop("project_id"))
    data["reported_by_id"] = current_user.id
    obj = SiteReport(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/site-reports/{report_id}", response_model=SiteReportResponse)
def get_site_report(
    report_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    obj = db.query(SiteReport).filter(SiteReport.id == uuid.UUID(report_id)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Site report not found")
    return obj


@router.patch("/site-reports/{report_id}", response_model=SiteReportResponse)
def update_site_report(
    report_id: str, payload: SiteReportUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    obj = db.query(SiteReport).filter(SiteReport.id == uuid.UUID(report_id)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Site report not found")
    for f, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, f, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/site-reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_site_report(
    report_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    obj = db.query(SiteReport).filter(SiteReport.id == uuid.UUID(report_id)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Site report not found")
    db.delete(obj)
    db.commit()


# ═══════════════════════════════════════════════════════════════════════════════
# EQUIPMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/equipment", response_model=List[EquipmentResponse])
def list_equipment(
    project_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Equipment)
    if project_id:
        q = q.filter(Equipment.project_id == uuid.UUID(project_id))
    if status_filter:
        q = q.filter(Equipment.status == status_filter)
    return q.order_by(Equipment.name).offset(skip).limit(limit).all()


@router.post("/equipment", response_model=EquipmentResponse, status_code=status.HTTP_201_CREATED)
def create_equipment(
    payload: EquipmentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    data = payload.model_dump()
    data["project_id"] = uuid.UUID(data.pop("project_id"))
    obj = Equipment(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/equipment/{equipment_id}", response_model=EquipmentResponse)
def get_equipment(equipment_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.query(Equipment).filter(Equipment.id == uuid.UUID(equipment_id)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return obj


@router.patch("/equipment/{equipment_id}", response_model=EquipmentResponse)
def update_equipment(
    equipment_id: str, payload: EquipmentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    obj = db.query(Equipment).filter(Equipment.id == uuid.UUID(equipment_id)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Equipment not found")
    for f, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, f, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/equipment/{equipment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_equipment(equipment_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.query(Equipment).filter(Equipment.id == uuid.UUID(equipment_id)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Equipment not found")
    db.delete(obj)
    db.commit()


# ═══════════════════════════════════════════════════════════════════════════════
# MATERIALS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/materials", response_model=List[MaterialResponse])
def list_materials(
    project_id: Optional[str] = Query(None),
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Material)
    if project_id:
        q = q.filter(Material.project_id == uuid.UUID(project_id))
    return q.order_by(Material.name).offset(skip).limit(limit).all()


@router.post("/materials", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
def create_material(payload: MaterialCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    data = payload.model_dump()
    data["project_id"] = uuid.UUID(data.pop("project_id"))
    obj = Material(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/materials/{material_id}", response_model=MaterialResponse)
def get_material(material_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.query(Material).filter(Material.id == uuid.UUID(material_id)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Material not found")
    return obj


@router.patch("/materials/{material_id}", response_model=MaterialResponse)
def update_material(
    material_id: str, payload: MaterialUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    obj = db.query(Material).filter(Material.id == uuid.UUID(material_id)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Material not found")
    for f, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, f, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/materials/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_material(material_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.query(Material).filter(Material.id == uuid.UUID(material_id)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Material not found")
    db.delete(obj)
    db.commit()


# ═══════════════════════════════════════════════════════════════════════════════
# ATTENDANCE
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/attendance", response_model=List[AttendanceResponse])
def list_attendance(
    project_id: Optional[str] = Query(None),
    skip: int = 0, limit: int = 200,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Attendance)
    if project_id:
        q = q.filter(Attendance.project_id == uuid.UUID(project_id))
    return q.order_by(Attendance.date.desc()).offset(skip).limit(limit).all()


@router.post("/attendance", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def create_attendance(payload: AttendanceCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    data = payload.model_dump()
    data["project_id"] = uuid.UUID(data.pop("project_id"))
    obj = Attendance(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/attendance/{attendance_id}", response_model=AttendanceResponse)
def get_attendance(attendance_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.query(Attendance).filter(Attendance.id == uuid.UUID(attendance_id)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    return obj


@router.patch("/attendance/{attendance_id}", response_model=AttendanceResponse)
def update_attendance(
    attendance_id: str, payload: AttendanceUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    obj = db.query(Attendance).filter(Attendance.id == uuid.UUID(attendance_id)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    for f, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, f, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/attendance/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attendance(attendance_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.query(Attendance).filter(Attendance.id == uuid.UUID(attendance_id)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    db.delete(obj)
    db.commit()


# ═══════════════════════════════════════════════════════════════════════════════
# FINANCIAL
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/financial", response_model=List[FinancialRecordResponse])
def list_financial(
    project_id: Optional[str] = Query(None),
    record_type: Optional[str] = Query(None),
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(FinancialRecord)
    if project_id:
        q = q.filter(FinancialRecord.project_id == uuid.UUID(project_id))
    if record_type:
        q = q.filter(FinancialRecord.record_type == record_type)
    return q.order_by(FinancialRecord.record_date.desc()).offset(skip).limit(limit).all()


@router.post("/financial", response_model=FinancialRecordResponse, status_code=status.HTTP_201_CREATED)
def create_financial(
    payload: FinancialRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = payload.model_dump()
    data["project_id"] = uuid.UUID(data.pop("project_id"))
    data["paid_by_id"] = current_user.id
    obj = FinancialRecord(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/financial/{record_id}", response_model=FinancialRecordResponse)
def get_financial(record_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.query(FinancialRecord).filter(FinancialRecord.id == uuid.UUID(record_id)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Financial record not found")
    return obj


@router.patch("/financial/{record_id}", response_model=FinancialRecordResponse)
def update_financial(
    record_id: str, payload: FinancialRecordUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    obj = db.query(FinancialRecord).filter(FinancialRecord.id == uuid.UUID(record_id)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Financial record not found")
    for f, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, f, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/financial/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_financial(record_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.query(FinancialRecord).filter(FinancialRecord.id == uuid.UUID(record_id)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Financial record not found")
    db.delete(obj)
    db.commit()


# ═══════════════════════════════════════════════════════════════════════════════
# SAFETY INCIDENTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/safety", response_model=List[SafetyIncidentResponse])
def list_safety(
    project_id: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(SafetyIncident)
    if project_id:
        q = q.filter(SafetyIncident.project_id == uuid.UUID(project_id))
    if severity:
        q = q.filter(SafetyIncident.severity == severity)
    return q.order_by(SafetyIncident.incident_date.desc()).offset(skip).limit(limit).all()


@router.post("/safety", response_model=SafetyIncidentResponse, status_code=status.HTTP_201_CREATED)
def create_safety(
    payload: SafetyIncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = payload.model_dump()
    data["project_id"] = uuid.UUID(data.pop("project_id"))
    data["reported_by_id"] = current_user.id
    obj = SafetyIncident(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/safety/{incident_id}", response_model=SafetyIncidentResponse)
def get_safety(incident_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.query(SafetyIncident).filter(SafetyIncident.id == uuid.UUID(incident_id)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Safety incident not found")
    return obj


@router.patch("/safety/{incident_id}", response_model=SafetyIncidentResponse)
def update_safety(
    incident_id: str, payload: SafetyIncidentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    obj = db.query(SafetyIncident).filter(SafetyIncident.id == uuid.UUID(incident_id)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Safety incident not found")
    for f, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, f, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/safety/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_safety(incident_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.query(SafetyIncident).filter(SafetyIncident.id == uuid.UUID(incident_id)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Safety incident not found")
    db.delete(obj)
    db.commit()


# ═══════════════════════════════════════════════════════════════════════════════
# FILE UPLOAD
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/upload", status_code=status.HTTP_200_OK)
def upload_file(file: UploadFile = File(...)):
    upload_dir = settings.LOCAL_UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    safe_name = f"{uuid.uuid4().hex}{ext}"
    dest = os.path.join(upload_dir, safe_name)
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"file_url": f"/uploads/{safe_name}", "file_name": file.filename, "size": os.path.getsize(dest)}


# ═══════════════════════════════════════════════════════════════════════════════
# DOCUMENTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/documents", response_model=List[DocumentResponse])
def list_documents(
    project_id: Optional[str] = Query(None),
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Document)
    if project_id:
        q = q.filter(Document.project_id == uuid.UUID(project_id))
    return q.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def create_document(
    payload: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = payload.model_dump()
    data["project_id"] = uuid.UUID(data.pop("project_id"))
    data["uploaded_by_id"] = current_user.id
    obj = Document(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/documents/{document_id}", response_model=DocumentResponse)
def get_document(document_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.query(Document).filter(Document.id == uuid.UUID(document_id)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Document not found")
    return obj


@router.patch("/documents/{document_id}", response_model=DocumentResponse)
def update_document(
    document_id: str, payload: DocumentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    obj = db.query(Document).filter(Document.id == uuid.UUID(document_id)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Document not found")
    for f, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, f, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.query(Document).filter(Document.id == uuid.UUID(document_id)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(obj)
    db.commit()


# ═══════════════════════════════════════════════════════════════════════════════
# REPORTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/reports", response_model=List[ReportResponse])
def list_reports(
    project_id: Optional[str] = Query(None),
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Report)
    if project_id:
        q = q.filter(Report.project_id == uuid.UUID(project_id))
    return q.order_by(Report.generated_date.desc()).offset(skip).limit(limit).all()


@router.post("/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    payload: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = payload.model_dump()
    data["project_id"] = uuid.UUID(data.pop("project_id"))
    data["generated_by_id"] = current_user.id
    obj = Report(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/reports/{report_id}", response_model=ReportResponse)
def get_report(report_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.query(Report).filter(Report.id == uuid.UUID(report_id)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Report not found")
    return obj


@router.patch("/reports/{report_id}", response_model=ReportResponse)
def update_report(
    report_id: str, payload: ReportUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    obj = db.query(Report).filter(Report.id == uuid.UUID(report_id)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Report not found")
    for f, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, f, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(report_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.query(Report).filter(Report.id == uuid.UUID(report_id)).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Report not found")
    db.delete(obj)
    db.commit()
