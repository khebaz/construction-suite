import enum
from sqlalchemy import Column, String, Boolean, Enum, Text, ForeignKey, Table
from sqlalchemy.types import Uuid
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class UserRole(str, enum.Enum):
    ADMINISTRATOR   = "administrator"
    PROJECT_MANAGER = "project_manager"
    SITE_ENGINEER   = "site_engineer"
    FOREMAN         = "foreman"
    STOREKEEPER     = "storekeeper"
    EQUIPMENT_MGR   = "equipment_manager"
    ACCOUNTANT      = "accountant"
    CLIENT          = "client"


# Many-to-many: users ↔ projects
user_project_assignments = Table(
    "user_project_assignments",
    Base.metadata,
    Column("user_id",    Uuid, ForeignKey("users.id",    ondelete="CASCADE"), primary_key=True),
    Column("project_id", Uuid, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
)


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"

    # ── Identity ──────────────────────────────────────────────────────────────
    first_name    = Column(String(100),  nullable=False)
    last_name     = Column(String(100),  nullable=False)
    email         = Column(String(255),  unique=True, nullable=False, index=True)
    phone         = Column(String(30),   nullable=True)
    password_hash = Column(String(255),  nullable=False)

    # ── Role & Status ─────────────────────────────────────────────────────────
    role          = Column(Enum(UserRole), nullable=False, default=UserRole.SITE_ENGINEER)
    is_active     = Column(Boolean, default=True, nullable=False)
    is_superuser  = Column(Boolean, default=False, nullable=False)

    # ── Profile ───────────────────────────────────────────────────────────────
    job_title     = Column(String(150),  nullable=True)
    profile_photo = Column(String(500),  nullable=True)   # file path / S3 key
    notes         = Column(Text,         nullable=True)

    # ── Relationships ─────────────────────────────────────────────────────────
    projects = relationship(
        "Project",
        secondary=user_project_assignments,
        back_populates="team_members",
    )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    def __repr__(self):
        return f"<User {self.email} [{self.role}]>"
