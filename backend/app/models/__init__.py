# Import all models here so Alembic and SQLAlchemy can discover them.
from app.models.user import User, UserRole, user_project_assignments
from app.models.project import Project, ProjectSection, ProjectMilestone
from app.models.project import ProjectStatus, SectionStatus, MilestoneStatus, RoadSurfaceType
from app.models.modules import (
    SiteReport, Equipment, Material, Attendance,
    FinancialRecord, SafetyIncident, Document, Report,
)
from app.models.company import CompanySettings

__all__ = [
    "User", "UserRole", "user_project_assignments",
    "Project", "ProjectSection", "ProjectMilestone",
    "ProjectStatus", "SectionStatus", "MilestoneStatus", "RoadSurfaceType",
    "SiteReport", "Equipment", "Material", "Attendance",
    "FinancialRecord", "SafetyIncident", "Document", "Report",
    "CompanySettings",
]
