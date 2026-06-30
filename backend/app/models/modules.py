import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Enum, Date, Numeric, Integer, Float, Boolean, ForeignKey, JSON, DateTime
from sqlalchemy.types import Uuid
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class SiteReport(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "site_reports"

    project_id      = Column(Uuid, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    report_date     = Column(Date, nullable=False)
    weather         = Column(String(100), nullable=True)
    temperature     = Column(String(20), nullable=True)
    work_done       = Column(Text, nullable=True)
    issues          = Column(Text, nullable=True)
    planned_next    = Column(Text, nullable=True)
    reported_by_id  = Column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status          = Column(String(20), default="draft")

    project     = relationship("Project")
    reported_by = relationship("User")


class Equipment(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "equipment"

    project_id      = Column(Uuid, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name            = Column(String(255), nullable=False)
    equipment_type  = Column(String(100), nullable=True)
    make            = Column(String(100), nullable=True)
    model           = Column(String(100), nullable=True)
    registration    = Column(String(50), nullable=True)
    status          = Column(String(20), default="available")
    hours_used      = Column(Float, default=0)
    fuel_consumption = Column(Float, nullable=True)
    assigned_to_id  = Column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes           = Column(Text, nullable=True)

    project     = relationship("Project")
    assigned_to = relationship("User")


class Material(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "materials"

    project_id    = Column(Uuid, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name          = Column(String(255), nullable=False)
    category      = Column(String(100), nullable=True)
    quantity      = Column(Float, nullable=False)
    unit          = Column(String(20), nullable=False)
    unit_price    = Column(Numeric(12, 2), nullable=True)
    supplier      = Column(String(255), nullable=True)
    received_date = Column(Date, nullable=True)
    notes         = Column(Text, nullable=True)

    project = relationship("Project")


class Attendance(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "attendance"

    project_id   = Column(Uuid, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    worker_name  = Column(String(255), nullable=False)
    date         = Column(Date, nullable=False)
    hours_worked = Column(Float, nullable=False)
    task         = Column(String(255), nullable=True)
    pay_rate     = Column(Numeric(10, 2), nullable=True)
    notes        = Column(Text, nullable=True)

    project = relationship("Project")


class FinancialRecord(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "financial_records"

    project_id   = Column(Uuid, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    record_type  = Column(String(20), nullable=False)
    category     = Column(String(100), nullable=True)
    amount       = Column(Numeric(15, 2), nullable=False)
    currency     = Column(String(5), default="BWP")
    description  = Column(Text, nullable=True)
    record_date  = Column(Date, nullable=False)
    reference    = Column(String(100), nullable=True)
    paid_by_id   = Column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status       = Column(String(20), default="pending")

    project = relationship("Project")
    paid_by = relationship("User")


class SafetyIncident(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "safety_incidents"

    project_id      = Column(Uuid, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    incident_date   = Column(Date, nullable=False)
    severity        = Column(String(20), nullable=False)
    incident_type   = Column(String(100), nullable=True)
    description     = Column(Text, nullable=True)
    location        = Column(String(255), nullable=True)
    action_taken    = Column(Text, nullable=True)
    reported_by_id  = Column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status          = Column(String(20), default="open")

    project     = relationship("Project")
    reported_by = relationship("User")


class Document(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "documents"

    project_id     = Column(Uuid, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name           = Column(String(255), nullable=False)
    doc_type       = Column(String(100), nullable=True)
    file_url       = Column(String(500), nullable=True)
    description    = Column(Text, nullable=True)
    uploaded_by_id = Column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    tags           = Column(String(500), nullable=True)

    project     = relationship("Project")
    uploaded_by = relationship("User")


class Report(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "reports"

    project_id       = Column(Uuid, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name             = Column(String(255), nullable=False)
    report_type      = Column(String(100), nullable=True)
    content          = Column(Text, nullable=True)
    generated_date   = Column(Date, nullable=False)
    generated_by_id  = Column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status           = Column(String(20), default="draft")

    project      = relationship("Project")
    generated_by = relationship("User")
