from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
import uuid


# ─── Site Report ──────────────────────────────────────────────────────────────

class SiteReportCreate(BaseModel):
    project_id: str
    report_date: date
    weather: Optional[str] = None
    temperature: Optional[str] = None
    work_done: Optional[str] = None
    issues: Optional[str] = None
    planned_next: Optional[str] = None
    status: str = "draft"


class SiteReportUpdate(BaseModel):
    report_date: Optional[date] = None
    weather: Optional[str] = None
    temperature: Optional[str] = None
    work_done: Optional[str] = None
    issues: Optional[str] = None
    planned_next: Optional[str] = None
    status: Optional[str] = None


class SiteReportResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    report_date: date
    weather: Optional[str]
    temperature: Optional[str]
    work_done: Optional[str]
    issues: Optional[str]
    planned_next: Optional[str]
    reported_by_id: Optional[uuid.UUID]
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Equipment ────────────────────────────────────────────────────────────────

class EquipmentCreate(BaseModel):
    project_id: str
    name: str
    equipment_type: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    registration: Optional[str] = None
    status: str = "available"
    hours_used: float = 0
    fuel_consumption: Optional[float] = None
    notes: Optional[str] = None


class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    equipment_type: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    registration: Optional[str] = None
    status: Optional[str] = None
    hours_used: Optional[float] = None
    fuel_consumption: Optional[float] = None
    assigned_to_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None


class EquipmentResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    equipment_type: Optional[str]
    make: Optional[str]
    model: Optional[str]
    registration: Optional[str]
    status: str
    hours_used: float
    fuel_consumption: Optional[float]
    assigned_to_id: Optional[uuid.UUID]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Material ─────────────────────────────────────────────────────────────────

class MaterialCreate(BaseModel):
    project_id: str
    name: str
    category: Optional[str] = None
    quantity: float
    unit: str
    unit_price: Optional[float] = None
    supplier: Optional[str] = None
    received_date: Optional[date] = None
    notes: Optional[str] = None


class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = None
    supplier: Optional[str] = None
    received_date: Optional[date] = None
    notes: Optional[str] = None


class MaterialResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    category: Optional[str]
    quantity: float
    unit: str
    unit_price: Optional[float]
    supplier: Optional[str]
    received_date: Optional[date]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Attendance ───────────────────────────────────────────────────────────────

class AttendanceCreate(BaseModel):
    project_id: str
    worker_name: str
    date: date
    hours_worked: float
    task: Optional[str] = None
    pay_rate: Optional[float] = None
    notes: Optional[str] = None


class AttendanceUpdate(BaseModel):
    worker_name: Optional[str] = None
    date: Optional[date] = None
    hours_worked: Optional[float] = None
    task: Optional[str] = None
    pay_rate: Optional[float] = None
    notes: Optional[str] = None


class AttendanceResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    worker_name: str
    date: date
    hours_worked: float
    task: Optional[str]
    pay_rate: Optional[float]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Financial ────────────────────────────────────────────────────────────────

class FinancialRecordCreate(BaseModel):
    project_id: str
    record_type: str
    category: Optional[str] = None
    amount: float
    currency: str = "BWP"
    description: Optional[str] = None
    record_date: date
    reference: Optional[str] = None
    status: str = "pending"


class FinancialRecordUpdate(BaseModel):
    record_type: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    description: Optional[str] = None
    record_date: Optional[date] = None
    reference: Optional[str] = None
    status: Optional[str] = None


class FinancialRecordResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    record_type: str
    category: Optional[str]
    amount: float
    currency: str
    description: Optional[str]
    record_date: date
    reference: Optional[str]
    paid_by_id: Optional[uuid.UUID]
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Safety Incident ──────────────────────────────────────────────────────────

class SafetyIncidentCreate(BaseModel):
    project_id: str
    incident_date: date
    severity: str
    incident_type: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    action_taken: Optional[str] = None
    status: str = "open"


class SafetyIncidentUpdate(BaseModel):
    incident_date: Optional[date] = None
    severity: Optional[str] = None
    incident_type: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    action_taken: Optional[str] = None
    status: Optional[str] = None


class SafetyIncidentResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    incident_date: date
    severity: str
    incident_type: Optional[str]
    description: Optional[str]
    location: Optional[str]
    action_taken: Optional[str]
    reported_by_id: Optional[uuid.UUID]
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Document ─────────────────────────────────────────────────────────────────

class DocumentCreate(BaseModel):
    project_id: str
    name: str
    doc_type: Optional[str] = None
    file_url: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None


class DocumentUpdate(BaseModel):
    name: Optional[str] = None
    doc_type: Optional[str] = None
    file_url: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None


class DocumentResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    doc_type: Optional[str]
    file_url: Optional[str]
    description: Optional[str]
    uploaded_by_id: Optional[uuid.UUID]
    tags: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Report ───────────────────────────────────────────────────────────────────

class ReportCreate(BaseModel):
    project_id: str
    name: str
    report_type: Optional[str] = None
    content: Optional[str] = None
    generated_date: date
    status: str = "draft"


class ReportUpdate(BaseModel):
    name: Optional[str] = None
    report_type: Optional[str] = None
    content: Optional[str] = None
    generated_date: Optional[date] = None
    status: Optional[str] = None


class ReportResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    report_type: Optional[str]
    content: Optional[str]
    generated_date: date
    generated_by_id: Optional[uuid.UUID]
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
