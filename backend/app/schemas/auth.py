from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int        # seconds
    user_id: str
    full_name: str
    email: str
    role: str


class TokenData(BaseModel):
    """Decoded JWT payload."""
    user_id: Optional[str] = None
    role: Optional[str] = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

    class Config:
        json_schema_extra = {
            "example": {
                "current_password": "oldpass123",
                "new_password": "newSecure!456",
            }
        }


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str
