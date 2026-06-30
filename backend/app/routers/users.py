import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse, ResetPasswordRequest
from app.services.auth_service import hash_password
from app.middleware.auth import get_current_user, require_roles

router = APIRouter(prefix="/users", tags=["Users"])

_admin = require_roles(UserRole.ADMINISTRATOR)
_admin_or_pm = require_roles(UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER)


@router.get("/", response_model=List[UserListResponse])
def list_users(
    skip: int = 0,
    limit: int = 100,
    role: UserRole = None,
    is_active: bool = None,
    db: Session = Depends(get_db),
    _: User = Depends(_admin_or_pm),
):
    """List all users. Admin and PM only."""
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    if is_active is not None:
        q = q.filter(User.is_active == is_active)
    return q.order_by(User.first_name).offset(skip).limit(limit).all()


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(_admin),
):
    """Create a new user account. Admin only."""
    if db.query(User).filter(User.email == payload.email.lower()).first():
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    user = User(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email.lower(),
        phone=payload.phone,
        role=payload.role,
        job_title=payload.job_title,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a user by ID. Users can view their own; admins can view all."""
    if str(current_user.id) != user_id and current_user.role != UserRole.ADMINISTRATOR:
        raise HTTPException(status_code=403, detail="Access denied")

    user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a user. Users can update their own profile; admins can update any."""
    is_self = str(current_user.id) == user_id
    is_admin = current_user.role == UserRole.ADMINISTRATOR

    if not is_self and not is_admin:
        raise HTTPException(status_code=403, detail="Access denied")

    user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Non-admins cannot change their own role or activation status
    update_data = payload.model_dump(exclude_unset=True)
    if not is_admin:
        update_data.pop("role", None)
        update_data.pop("is_active", None)

    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(_admin),
):
    """Hard delete a user. Admin only."""
    user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()


@router.post("/{user_id}/reset-password", status_code=status.HTTP_200_OK)
def reset_user_password(
    user_id: str,
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
    _: User = Depends(_admin),
):
    """Admin resets a user's password. Admin only."""
    user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"detail": "Password reset successfully"}
