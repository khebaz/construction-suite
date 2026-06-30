from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime
import uuid
from app.models.project import (
    ProjectStatus, SectionStatus, MilestoneStatus, RoadSurfaceType
)


# ─── Milestone ────────────────────────────────────────────────────────────────

class MilestoneCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: date
    weight_pct: float = 0.0


class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    achieved_date: Optional[date] = None
    status: Optional[MilestoneStatus] = None
    weight_pct: Optional[float] = None


class MilestoneResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str]
    due_date: date
    achieved_date: Optional[date]
    status: MilestoneStatus
    weight_pct: float

    model_config = {"from_attributes": True}


# ─── Section ─────────────────────────────────────────────────────────────────

class SectionCreate(BaseModel):
    section_name: str
    description: Optional[str] = None
    chainage_start: Optional[float] = None
    chainage_end: Optional[float] = None
    length_km: Optional[float] = None
    planned_start: Optional[date] = None
    planned_end: Optional[date] = None
    assigned_engineer_id: Optional[uuid.UUID] = None
    foreman_id: Optional[uuid.UUID] = None
    gps_start_lat: Optional[float] = None
    gps_start_lng: Optional[float] = None
    gps_end_lat: Optional[float] = None
    gps_end_lng: Optional[float] = None


class SectionUpdate(BaseModel):
    section_name: Optional[str] = None
    description: Optional[str] = None
    chainage_start: Optional[float] = None
    chainage_end: Optional[float] = None
    length_km: Optional[float] = None
    status: Optional[SectionStatus] = None
    completion_pct: Optional[float] = None
    planned_start: Optional[date] = None
    planned_end: Optional[date] = None
    actual_start: Optional[date] = None
    actual_end: Optional[date] = None
    assigned_engineer_id: Optional[uuid.UUID] = None
    foreman_id: Optional[uuid.UUID] = None
    gps_start_lat: Optional[float] = None
    gps_start_lng: Optional[float] = None
    gps_end_lat: Optional[float] = None
    gps_end_lng: Optional[float] = None


class SectionResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    section_name: str
    description: Optional[str]
    chainage_start: Optional[float]
    chainage_end: Optional[float]
    length_km: Optional[float]
    status: SectionStatus
    completion_pct: float
    planned_start: Optional[date]
    planned_end: Optional[date]
    actual_start: Optional[date]
    actual_end: Optional[date]
    assigned_engineer_id: Optional[uuid.UUID]
    foreman_id: Optional[uuid.UUID]
    gps_start_lat: Optional[float]
    gps_start_lng: Optional[float]
    gps_end_lat: Optional[float]
    gps_end_lng: Optional[float]

    model_config = {"from_attributes": True}


# ─── Project ──────────────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str
    project_number: str
    description: Optional[str] = None
    location: str
    district: Optional[str] = None
    village: Optional[str] = None
    total_length_km: Optional[float] = None
    surface_type: Optional[RoadSurfaceType] = None
    start_chainage: float = 0.0
    end_chainage: Optional[float] = None
    planned_start: date
    planned_end: date
    contract_value: Optional[float] = None
    currency: str = "BWP"
    client_name: Optional[str] = None
    client_contact: Optional[str] = None
    client_email: Optional[str] = None
    contract_number: Optional[str] = None
    gps_start_lat: Optional[float] = None
    gps_start_lng: Optional[float] = None
    gps_end_lat: Optional[float] = None
    gps_end_lng: Optional[float] = None

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Moshupa–Kanye Road Rehabilitation",
                "project_number": "DIRD-2024-001",
                "location": "Moshupa to Kanye, Southern District",
                "district": "Ngwaketse South",
                "village": "Moshupa",
                "total_length_km": 12.4,
                "surface_type": "gravel",
                "planned_start": "2024-05-01",
                "planned_end": "2024-11-30",
                "contract_value": 8500000.00,
                "currency": "BWP",
                "client_name": "Department of Roads, Botswana",
            }
        }


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    total_length_km: Optional[float] = None
    surface_type: Optional[RoadSurfaceType] = None
    planned_start: Optional[date] = None
    planned_end: Optional[date] = None
    actual_start: Optional[date] = None
    actual_end: Optional[date] = None
    contract_value: Optional[float] = None
    client_name: Optional[str] = None
    client_contact: Optional[str] = None
    client_email: Optional[str] = None
    contract_number: Optional[str] = None
    status: Optional[ProjectStatus] = None
    completion_pct: Optional[float] = None
    gps_start_lat: Optional[float] = None
    gps_start_lng: Optional[float] = None
    gps_end_lat: Optional[float] = None
    gps_end_lng: Optional[float] = None


class ProjectSummary(BaseModel):
    """Lightweight response for list views."""
    id: uuid.UUID
    name: str
    project_number: str
    location: str
    status: ProjectStatus
    completion_pct: float
    planned_start: date
    planned_end: date
    contract_value: Optional[float]
    currency: str
    total_sections: int = 0
    sections_completed: int = 0

    model_config = {"from_attributes": True}


class ProjectResponse(BaseModel):
    """Full project detail response."""
    id: uuid.UUID
    name: str
    project_number: str
    description: Optional[str]
    location: str
    district: Optional[str]
    village: Optional[str]
    total_length_km: Optional[float]
    surface_type: Optional[RoadSurfaceType]
    start_chainage: float
    end_chainage: Optional[float]
    planned_start: date
    planned_end: date
    actual_start: Optional[date]
    actual_end: Optional[date]
    contract_value: Optional[float]
    currency: str
    client_name: Optional[str]
    client_contact: Optional[str]
    client_email: Optional[str]
    contract_number: Optional[str]
    status: ProjectStatus
    completion_pct: float
    is_active: bool
    gps_start_lat: Optional[float]
    gps_start_lng: Optional[float]
    gps_end_lat: Optional[float]
    gps_end_lng: Optional[float]
    created_at: datetime
    updated_at: datetime
    sections: List[SectionResponse] = []
    milestones: List[MilestoneResponse] = []

    model_config = {"from_attributes": True}


class AssignTeamRequest(BaseModel):
    user_ids: List[uuid.UUID]


class ProjectStatsResponse(BaseModel):
    """KPIs for the dashboard."""
    total_projects: int
    active_projects: int
    completed_projects: int
    on_hold_projects: int
    total_contract_value: float
    currency: str
