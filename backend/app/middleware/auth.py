import uuid
from typing import List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.services.auth_service import decode_token

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency.
    Extracts the JWT from the Authorization header, verifies it,
    and returns the authenticated User object.
    """
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token_data = decode_token(credentials.credentials)
    except JWTError:
        raise credentials_exc

    user = db.query(User).filter(User.id == uuid.UUID(token_data.user_id)).first()
    if user is None or not user.is_active:
        raise credentials_exc
    return user


def require_roles(*allowed_roles: UserRole):
    """
    Factory that returns a FastAPI dependency enforcing role-based access.

    Usage:
        @router.post("/", dependencies=[Depends(require_roles(UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER))])
    or:
        current_user: User = Depends(require_roles(UserRole.ADMINISTRATOR))
    """
    def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in allowed_roles]}",
            )
        return current_user
    return _check


# ── Convenience aliases ────────────────────────────────────────────────────────

def admin_only(current_user: User = Depends(get_current_user)) -> User:
    return require_roles(UserRole.ADMINISTRATOR)(current_user)


def management_only(current_user: User = Depends(get_current_user)) -> User:
    return require_roles(
        UserRole.ADMINISTRATOR,
        UserRole.PROJECT_MANAGER,
    )(current_user)


def site_staff(current_user: User = Depends(get_current_user)) -> User:
    """Engineers, foremen, and above."""
    return require_roles(
        UserRole.ADMINISTRATOR,
        UserRole.PROJECT_MANAGER,
        UserRole.SITE_ENGINEER,
        UserRole.FOREMAN,
    )(current_user)


def can_view_financials(current_user: User = Depends(get_current_user)) -> User:
    return require_roles(
        UserRole.ADMINISTRATOR,
        UserRole.PROJECT_MANAGER,
        UserRole.ACCOUNTANT,
    )(current_user)
