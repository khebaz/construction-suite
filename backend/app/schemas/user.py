from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
import uuid
from app.models.user import UserRole


class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    role: UserRole = UserRole.SITE_ENGINEER
    job_title: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "first_name": "Kabo",
                "last_name": "Mosweu",
                "email": "kabo@example.com",
                "password": "SecurePass!1",
                "role": "site_engineer",
                "job_title": "Site Engineer",
            }
        }


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    job_title: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class UserResponse(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    full_name: str
    email: str
    phone: Optional[str]
    role: UserRole
    job_title: Optional[str]
    is_active: bool
    profile_photo: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    full_name: str
    email: str
    role: UserRole
    job_title: Optional[str]
    is_active: bool
    phone: Optional[str]

    model_config = {"from_attributes": True}


class ResetPasswordRequest(BaseModel):
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v
