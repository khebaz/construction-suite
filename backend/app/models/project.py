import enum
from sqlalchemy import (
    Column, String, Text, Enum, Date, Numeric,
    Integer, Float, Boolean, ForeignKey, JSON
)
from sqlalchemy.types import Uuid
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class ProjectStatus(str, enum.Enum):
    PLANNING    = "planning"
    MOBILISING  = "mobilising"
    ACTIVE      = "active"
    ON_HOLD     = "on_hold"
    COMPLETED   = "completed"
    DEFECTS     = "defects_period"    # post-completion defects liability period
    CLOSED      = "closed"


class SectionStatus(str, enum.Enum):
    NOT_STARTED  = "not_started"
    IN_PROGRESS  = "in_progress"
    COMPLETED    = "completed"
    DEFECTIVE    = "defective"
    REMEDIATED   = "remediated"


class RoadSurfaceType(str, enum.Enum):
    GRAVEL      = "gravel"
    BITUMEN     = "bitumen"
    CONCRETE    = "concrete"
    PAVED       = "paved"
    MIXED       = "mixed"


class Project(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "projects"

    # ── Core Info ─────────────────────────────────────────────────────────────
    name            = Column(String(255),  nullable=False)
    project_number  = Column(String(50),   unique=True, nullable=False)
    description     = Column(Text,         nullable=True)
    location        = Column(String(255),  nullable=False)
    district        = Column(String(100),  nullable=True)   # e.g. Ngwaketse South
    village         = Column(String(100),  nullable=True)

    # ── Road Specifics ────────────────────────────────────────────────────────
    total_length_km  = Column(Float,       nullable=True)   # total road km
    surface_type     = Column(Enum(RoadSurfaceType), nullable=True)
    start_chainage   = Column(Float, default=0.0)           # km 0+000
    end_chainage     = Column(Float, nullable=True)         # km 12+400, etc.

    # ── Dates ─────────────────────────────────────────────────────────────────
    planned_start    = Column(Date,  nullable=False)
    planned_end      = Column(Date,  nullable=False)
    actual_start     = Column(Date,  nullable=True)
    actual_end       = Column(Date,  nullable=True)

    # ── Budget ────────────────────────────────────────────────────────────────
    contract_value   = Column(Numeric(15, 2), nullable=True)
    currency         = Column(String(5), default="BWP")

    # ── Client / Employer ─────────────────────────────────────────────────────
    client_name      = Column(String(255), nullable=True)
    client_contact   = Column(String(255), nullable=True)
    client_email     = Column(String(255), nullable=True)
    contract_number  = Column(String(100), nullable=True)

    # ── Status ────────────────────────────────────────────────────────────────
    status              = Column(Enum(ProjectStatus), default=ProjectStatus.PLANNING, nullable=False)
    completion_pct      = Column(Float, default=0.0)   # 0–100, auto-calculated
    is_active           = Column(Boolean, default=True)

    # ── GPS Bounding Box ──────────────────────────────────────────────────────
    gps_start_lat   = Column(Float, nullable=True)
    gps_start_lng   = Column(Float, nullable=True)
    gps_end_lat     = Column(Float, nullable=True)
    gps_end_lng     = Column(Float, nullable=True)

    # ── Relationships ─────────────────────────────────────────────────────────
    team_members = relationship(
        "User",
        secondary="user_project_assignments",
        back_populates="projects",
    )
    sections     = relationship("ProjectSection", back_populates="project", cascade="all, delete-orphan")
    milestones   = relationship("ProjectMilestone", back_populates="project", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Project {self.project_number} — {self.name}>"


class ProjectSection(UUIDMixin, TimestampMixin, Base):
    """
    A road project is divided into sections (chainage ranges).
    e.g. Section A: km 0+000 to km 3+500
    Progress is tracked per section.
    """
    __tablename__ = "project_sections"

    project_id      = Column(Uuid, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)

    section_name    = Column(String(100), nullable=False)   # "Section A", "Drainage Works", etc.
    description     = Column(Text,        nullable=True)

    # ── Chainage (road km markers) ────────────────────────────────────────────
    chainage_start  = Column(Float, nullable=True)   # km 0+000 → 0.0
    chainage_end    = Column(Float, nullable=True)   # km 3+500 → 3.5
    length_km       = Column(Float, nullable=True)   # computed or manual

    # ── Progress ──────────────────────────────────────────────────────────────
    status              = Column(Enum(SectionStatus), default=SectionStatus.NOT_STARTED, nullable=False)
    completion_pct      = Column(Float, default=0.0)
    planned_start       = Column(Date,  nullable=True)
    planned_end         = Column(Date,  nullable=True)
    actual_start        = Column(Date,  nullable=True)
    actual_end          = Column(Date,  nullable=True)

    # ── Assignment ────────────────────────────────────────────────────────────
    assigned_engineer_id = Column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    foreman_id           = Column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # ── GPS ───────────────────────────────────────────────────────────────────
    gps_start_lat   = Column(Float, nullable=True)
    gps_start_lng   = Column(Float, nullable=True)
    gps_end_lat     = Column(Float, nullable=True)
    gps_end_lng     = Column(Float, nullable=True)

    # ── Relationships ─────────────────────────────────────────────────────────
    project          = relationship("Project", back_populates="sections")
    assigned_engineer = relationship("User", foreign_keys=[assigned_engineer_id])
    foreman           = relationship("User", foreign_keys=[foreman_id])

    def __repr__(self):
        return f"<Section {self.section_name} [{self.status}]>"


class MilestoneStatus(str, enum.Enum):
    PENDING     = "pending"
    IN_PROGRESS = "in_progress"
    ACHIEVED    = "achieved"
    OVERDUE     = "overdue"
    CANCELLED   = "cancelled"


class ProjectMilestone(UUIDMixin, TimestampMixin, Base):
    """Key dates / deliverables on the Gantt chart."""
    __tablename__ = "project_milestones"

    project_id      = Column(Uuid, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    title           = Column(String(255),  nullable=False)
    description     = Column(Text,         nullable=True)
    due_date        = Column(Date,         nullable=False)
    achieved_date   = Column(Date,         nullable=True)
    status          = Column(Enum(MilestoneStatus), default=MilestoneStatus.PENDING, nullable=False)
    weight_pct      = Column(Float, default=0.0)  # this milestone's % of overall project

    project = relationship("Project", back_populates="milestones")

    def __repr__(self):
        return f"<Milestone {self.title} due {self.due_date}>"
