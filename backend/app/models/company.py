from sqlalchemy import Column, String, Text
from app.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class CompanySettings(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "company_settings"

    company_name = Column(String(255), nullable=True)
    logo = Column(String(500), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    website = Column(String(255), nullable=True)
    tax_id = Column(String(100), nullable=True)
