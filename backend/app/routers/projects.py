import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.database import get_db
from app.models.user import User, UserRole
from app.models.project import Project, ProjectSection, ProjectMilestone, ProjectStatus
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectSummary,
    SectionCreate, SectionUpdate, SectionResponse,
    MilestoneCreate, MilestoneUpdate, MilestoneResponse,
    AssignTeamRequest, ProjectStatsResponse,
)
from app.middleware.auth import get_current_user, require_roles

router = APIRouter(prefix="/projects", tags=["Projects"])

_admin         = require_roles(UserRole.ADMINISTRATOR)
_admin_or_pm   = require_roles(UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER)


# ═══════════════════════════════════════════════════════════════════════════════
# PROJECTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/stats", response_model=ProjectStatsResponse)
def get_project_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Dashboard KPIs — project counts and total contract value."""
    q = db.query(Project).filter(Project.is_active == True)

    # Clients only see their own data — future: filter by client_email
    total     = q.count()
    active    = q.filter(Project.status == ProjectStatus.ACTIVE).count()
    completed = q.filter(Project.status == ProjectStatus.COMPLETED).count()
    on_hold   = q.filter(Project.status == ProjectStatus.ON_HOLD).count()

    total_value = db.query(func.sum(Project.contract_value)).scalar() or 0.0

    return ProjectStatsResponse(
        total_projects=total,
        active_projects=active,
        completed_projects=completed,
        on_hold_projects=on_hold,
        total_contract_value=float(total_value),
        currency="BWP",
    )


@router.get("/", response_model=List[ProjectSummary])
def list_projects(
    skip: int = 0,
    limit: int = 50,
    status_filter: Optional[ProjectStatus] = Query(None, alias="status"),
    district: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all projects the current user can access.
    - Admins and PMs see all.
    - Site engineers, foremen, etc. see only their assigned projects.
    - Clients see only their client-linked projects.
    """
    q = db.query(Project).filter(Project.is_active == True)

    if status_filter:
        q = q.filter(Project.status == status_filter)
    if district:
        q = q.filter(Project.district.ilike(f"%{district}%"))

    # Restrict non-admin roles to assigned projects
    if current_user.role not in (UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER, UserRole.ACCOUNTANT):
        q = q.filter(Project.team_members.any(User.id == current_user.id))

    projects = q.order_by(Project.planned_start.desc()).offset(skip).limit(limit).all()

    result = []
    for p in projects:
        total_sections    = len(p.sections)
        completed_sections = sum(1 for s in p.sections if s.status.value == "completed")
        summary = ProjectSummary(
            id=p.id,
            name=p.name,
            project_number=p.project_number,
            location=p.location,
            status=p.status,
            completion_pct=p.completion_pct,
            planned_start=p.planned_start,
            planned_end=p.planned_end,
            contract_value=float(p.contract_value) if p.contract_value else None,
            currency=p.currency,
            total_sections=total_sections,
            sections_completed=completed_sections,
        )
        result.append(summary)
    return result


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_admin_or_pm),
):
    """Create a new road project. Admin and PM only."""
    if db.query(Project).filter(Project.project_number == payload.project_number).first():
        raise HTTPException(status_code=400, detail="Project number already exists")

    project = Project(**payload.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get full project detail including sections and milestones."""
    project = (
        db.query(Project)
        .options(
            joinedload(Project.sections),
            joinedload(Project.milestones),
        )
        .filter(Project.id == uuid.UUID(project_id), Project.is_active == True)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    _assert_project_access(current_user, project)
    return project


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_admin_or_pm),
):
    """Update project details. Admin and PM only."""
    project = _get_project_or_404(db, project_id)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_project(
    project_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(_admin),
):
    """Archive (soft delete) a project. Admin only."""
    project = _get_project_or_404(db, project_id)
    project.is_active = False
    db.commit()


# ═══════════════════════════════════════════════════════════════════════════════
# TEAM ASSIGNMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{project_id}/team", status_code=status.HTTP_204_NO_CONTENT)
def assign_team(
    project_id: str,
    payload: AssignTeamRequest,
    db: Session = Depends(get_db),
    _: User = Depends(_admin_or_pm),
):
    """Assign users to a project (replaces existing assignment)."""
    project = _get_project_or_404(db, project_id)
    users = db.query(User).filter(User.id.in_([str(uid) for uid in payload.user_ids])).all()

    if len(users) != len(payload.user_ids):
        raise HTTPException(status_code=400, detail="One or more user IDs are invalid")

    project.team_members = users
    db.commit()


@router.post("/{project_id}/team/add", status_code=status.HTTP_204_NO_CONTENT)
def add_team_member(
    project_id: str,
    payload: AssignTeamRequest,
    db: Session = Depends(get_db),
    _: User = Depends(_admin_or_pm),
):
    """Add users to a project without removing existing members."""
    project = _get_project_or_404(db, project_id)
    users = db.query(User).filter(User.id.in_([str(uid) for uid in payload.user_ids])).all()

    existing_ids = {u.id for u in project.team_members}
    for user in users:
        if user.id not in existing_ids:
            project.team_members.append(user)

    db.commit()


@router.delete("/{project_id}/team/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_team_member(
    project_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(_admin_or_pm),
):
    """Remove a user from a project team."""
    project = _get_project_or_404(db, project_id)
    project.team_members = [u for u in project.team_members if str(u.id) != user_id]
    db.commit()


# ═══════════════════════════════════════════════════════════════════════════════
# SECTIONS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/{project_id}/sections", response_model=List[SectionResponse])
def list_sections(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _get_project_or_404(db, project_id)
    _assert_project_access(current_user, project)
    return project.sections


@router.post("/{project_id}/sections", response_model=SectionResponse, status_code=status.HTTP_201_CREATED)
def create_section(
    project_id: str,
    payload: SectionCreate,
    db: Session = Depends(get_db),
    _: User = Depends(_admin_or_pm),
):
    project = _get_project_or_404(db, project_id)
    section = ProjectSection(project_id=project.id, **payload.model_dump())

    # Auto-calculate length_km from chainage if not provided
    if section.length_km is None and section.chainage_start is not None and section.chainage_end is not None:
        section.length_km = round(section.chainage_end - section.chainage_start, 3)

    db.add(section)
    db.commit()
    db.refresh(section)
    return section


@router.patch("/{project_id}/sections/{section_id}", response_model=SectionResponse)
def update_section(
    project_id: str,
    section_id: str,
    payload: SectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Engineers can update completion_pct and status.
    Admins/PMs can update everything.
    """
    section = _get_section_or_404(db, project_id, section_id)

    allowed_fields = payload.model_dump(exclude_unset=True)

    # Restrict field-level permissions for site engineers / foremen
    if current_user.role in (UserRole.SITE_ENGINEER, UserRole.FOREMAN):
        restricted = {"completion_pct", "status", "actual_start", "actual_end"}
        allowed_fields = {k: v for k, v in allowed_fields.items() if k in restricted}

    elif current_user.role not in (UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER):
        raise HTTPException(status_code=403, detail="Access denied")

    for field, value in allowed_fields.items():
        setattr(section, field, value)

    # Cascade progress to project level
    _recalculate_project_progress(db, project_id)

    db.commit()
    db.refresh(section)
    return section


@router.delete("/{project_id}/sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_section(
    project_id: str,
    section_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(_admin_or_pm),
):
    section = _get_section_or_404(db, project_id, section_id)
    db.delete(section)
    db.commit()


# ═══════════════════════════════════════════════════════════════════════════════
# MILESTONES
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/{project_id}/milestones", response_model=List[MilestoneResponse])
def list_milestones(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _get_project_or_404(db, project_id)
    _assert_project_access(current_user, project)
    return project.milestones


@router.post("/{project_id}/milestones", response_model=MilestoneResponse, status_code=status.HTTP_201_CREATED)
def create_milestone(
    project_id: str,
    payload: MilestoneCreate,
    db: Session = Depends(get_db),
    _: User = Depends(_admin_or_pm),
):
    project = _get_project_or_404(db, project_id)
    milestone = ProjectMilestone(project_id=project.id, **payload.model_dump())
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    return milestone


@router.patch("/{project_id}/milestones/{milestone_id}", response_model=MilestoneResponse)
def update_milestone(
    project_id: str,
    milestone_id: str,
    payload: MilestoneUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(_admin_or_pm),
):
    milestone = db.query(ProjectMilestone).filter(
        ProjectMilestone.id == uuid.UUID(milestone_id),
        ProjectMilestone.project_id == uuid.UUID(project_id),
    ).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(milestone, field, value)

    db.commit()
    db.refresh(milestone)
    return milestone


@router.delete("/{project_id}/milestones/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_milestone(
    project_id: str,
    milestone_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(_admin_or_pm),
):
    milestone = db.query(ProjectMilestone).filter(
        ProjectMilestone.id == uuid.UUID(milestone_id),
        ProjectMilestone.project_id == uuid.UUID(project_id),
    ).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    db.delete(milestone)
    db.commit()


# ═══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def _get_project_or_404(db: Session, project_id: str) -> Project:
    project = db.query(Project).filter(
        Project.id == uuid.UUID(project_id),
        Project.is_active == True,
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _get_section_or_404(db: Session, project_id: str, section_id: str) -> ProjectSection:
    section = db.query(ProjectSection).filter(
        ProjectSection.id == uuid.UUID(section_id),
        ProjectSection.project_id == uuid.UUID(project_id),
    ).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return section


def _assert_project_access(user: User, project: Project):
    """Raises 403 if user doesn't have access to this project."""
    unrestricted_roles = {UserRole.ADMINISTRATOR, UserRole.PROJECT_MANAGER, UserRole.ACCOUNTANT}
    if user.role in unrestricted_roles:
        return
    if user not in project.team_members:
        raise HTTPException(status_code=403, detail="You are not assigned to this project")


def _recalculate_project_progress(db: Session, project_id: str):
    """
    Recalculates project.completion_pct as the weighted average of section
    completion percentages (weighted by section length_km if available,
    otherwise by count).
    """
    sections = db.query(ProjectSection).filter(
        ProjectSection.project_id == project_id
    ).all()

    if not sections:
        return

    total_weight = sum(s.length_km or 1.0 for s in sections)
    weighted_sum = sum((s.completion_pct or 0.0) * (s.length_km or 1.0) for s in sections)

    project = db.query(Project).filter(Project.id == project_id).first()
    if project:
        project.completion_pct = round(weighted_sum / total_weight, 1) if total_weight else 0.0
