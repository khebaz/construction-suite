import uuid, os, shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.company import CompanySettings
from app.schemas.company import CompanySettingsUpdate, CompanySettingsResponse
from app.middleware.auth import get_current_user, require_roles
from app.models.user import UserRole

router = APIRouter(prefix="/company-settings", tags=["Company Settings"])

_admin = require_roles(UserRole.ADMINISTRATOR)


def _get_or_create(db: Session) -> CompanySettings:
    obj = db.query(CompanySettings).first()
    if not obj:
        obj = CompanySettings()
        db.add(obj)
        db.commit()
        db.refresh(obj)
    return obj


@router.get("/", response_model=CompanySettingsResponse)
def get_company_settings(
    db: Session = Depends(get_db),
    _: UserRole = Depends(get_current_user),
):
    return _get_or_create(db)


@router.put("/", response_model=CompanySettingsResponse)
def update_company_settings(
    payload: CompanySettingsUpdate,
    db: Session = Depends(get_db),
    _: UserRole = Depends(_admin),
):
    obj = _get_or_create(db)
    for f, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, f, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.post("/upload-logo", status_code=status.HTTP_200_OK)
def upload_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: UserRole = Depends(_admin),
):
    upload_dir = settings.LOCAL_UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    safe_name = f"logo_{uuid.uuid4().hex}{ext}"
    dest = os.path.join(upload_dir, safe_name)
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)
    logo_url = f"/uploads/{safe_name}"
    obj = _get_or_create(db)
    obj.logo = logo_url
    db.commit()
    db.refresh(obj)
    return {"logo": logo_url}
