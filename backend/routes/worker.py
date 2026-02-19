import uuid
import os
import aiofiles
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select
from typing import List
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import Optional
from models.task import Task, TaskStatus, TaskEvidence
from models.user import User, UserRole
from models.employee_complaint import EmployeeComplaint
from models.audit_log import AuditLog
from utils.security import hash_password
from core.database import get_session
from utils.security import get_current_user

# Creating an east african time
EAT = timezone(timedelta(hours=3))

UPLOAD_DIR = "uploads/tasks"
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif"}

router = APIRouter(tags=["Worker"])

# Task response model
class TaskRead(BaseModel):
    id: str
    title: str
    description: str
    status: TaskStatus
    assigned_to: str
    assigned_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TaskEvidenceRead(BaseModel):
    id: str
    file_url: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

class WorkerRead(BaseModel):
    id: uuid.UUID
    username: str
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True

def log_action(session: Session, performed_by: uuid.UUID, action: str, details: Optional[str] = None):
    # Debug print
    print(f"LOGGING: user={performed_by}, action={action}, details={details}")

    audit = AuditLog(
        action=action,
        details=details,
        user_id=performed_by
    )

    try:
        session.add(audit)
        session.commit()
    except Exception as e:
        print(f"Failed to log action: {e}")
        session.rollback()

# Get the currently authenticated worker's profile.
@router.get("/profile", response_model=WorkerRead)
def get_profile(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Ensure only workers can access this route
    if current_user.role != "worker":
        raise HTTPException(status_code=403, detail="Not authorized")

    worker = session.get(User, current_user.id)

    # Log the action using helper
    log_action(
        session,
        performed_by=current_user.id,
        action="viewed_profile",
        details=f"Worker '{current_user.username}' viewed their profile"
    )

    return worker

# Get assigned tasks
@router.get("/tasks", response_model=List[TaskRead])
def get_assigned_tasks(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if current_user.role != "worker":
        raise HTTPException(status_code=403, detail="Access forbidden")
    
    # tasks assigned to this worker
    statement = select(Task).where(Task.assigned_to == current_user.username)
    tasks = session.exec(statement).all()

    # Log the action
    log_action(
        session,
        performed_by=current_user.id,
        action="viewed_assigned_tasks",
        details=f"Worker '{current_user.username}' viewed {len(tasks)} tasks"
    )

    return tasks

@router.post("/tasks/{task_id}/evidence")
async def upload_task_evidence(
    task_id: str,
    files: List[UploadFile] = File(...),   # multiple photos allowed
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")

    # Ensure worker owns this task
    if task.assigned_to != current_user.username:
        raise HTTPException(403, "Not your task")
    
    # Ensure task is in progress
    if task.status != TaskStatus.in_progress:
        raise HTTPException(400, "Acknowledge the task first")

    # Ensure at least 1 file
    if not files:
        raise HTTPException(400, "At least one evidence photo is required")

    saved_files = []
    for file in files:
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(400, f"Invalid file type {file.content_type}")

        file_ext = os.path.splitext(file.filename)[1]
        saved_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, saved_filename)

        async with aiofiles.open(file_path, "wb") as out_file:
            content = await file.read()
            await out_file.write(content)

        evidence = TaskEvidence(task_id=task.id, file_url=file_path)
        session.add(evidence)
        saved_files.append(file_path)

    # Mark task as completed
    task.status = TaskStatus.completed
    session.add(task)
    session.commit()
    session.refresh(task)

    # Log audit action
    log_action(
        session,
        performed_by=current_user.id,
        action="uploaded_task_evidence",
        details=f"Worker '{current_user.username}' uploaded {len(files)} evidence file(s) for task '{task.title}'"
    )

    return {"message": "Evidence uploaded and task completed", "files": saved_files}


@router.patch("/tasks/{task_id}/acknowledge")
def acknowledge_task(task_id: str, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    if task.assigned_to != current_user.username:
        raise HTTPException(403, "Not your task")
    if task.status != TaskStatus.pending:
        raise HTTPException(400, "Task already acknowledged or in progress")

    task.status = TaskStatus.in_progress
    task.updated_at = datetime.now(EAT)
    task.acknowledged_at = datetime.now(EAT)
    session.commit()
    session.refresh(task)

    # Log action
    log_action(
        session,
        performed_by=current_user.id,
        action="acknowledged_task",
        details=f"Worker '{current_user.username}' acknowledged task '{task.title}'"
    )

    return {"message": "Acknowledged task."}


# User can update their password
@router.patch("/profile/password")
def update_password(
    password: str,
    current_user: User = Depends(get_current_user),  # extracted from JWT
    session: Session = Depends(get_session)
):
    worker = session.get(User, current_user.id)
    if not worker:
        raise HTTPException(status_code=404, detail="User not found")

    if worker.role != "worker":
        raise HTTPException(status_code=403, detail="Only workers can update password")

    worker.password_hash = hash_password(password)
    worker.updated_at = datetime.now(EAT)

    session.add(worker)
    session.commit()

    # Log action
    log_action(
        session,
        performed_by=current_user.id,
        action="updated_password",
        details=f"Worker '{current_user.username}' updated their password"
    )

    return {"message": "Password updated successfully"}

# Submit employee complaints
@router.post("/complaints", response_model=EmployeeComplaint)
def submit_employee_complaint(
    description: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if current_user.role != "worker":
        raise HTTPException(status_code=403, detail="Access forbidden")
    
    complaint = EmployeeComplaint(
        worker_id=current_user.id,
        description=description
    )
    session.add(complaint)
    session.commit()
    session.refresh(complaint)

    # Log complaint submission
    log_action(
        session,
        performed_by=current_user.id,
        action="submitted_complaint",
        details=f"Worker '{current_user.username}' submitted a complaint"
    )

    return complaint


# Get logged-in worker's complaints
@router.get("/complaints")
def get_worker_complaints(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if current_user.role != "worker":
        raise HTTPException(status_code=403, detail="Access forbidden")

    # Fetch complaints tied to the worker's UUID
    employee_complaints = session.exec(
        select(EmployeeComplaint).where(EmployeeComplaint.worker_id == current_user.id)
    ).all()

    response = []
    for c in employee_complaints:
        response.append({
            "id": str(c.id),
            "description": c.description,
            "status": c.status,
            "created_at": c.submitted_at,
        })

    return response