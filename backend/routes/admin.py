from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone, timedelta
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from typing import List
from models.task import Task, TaskStatus, TaskEvidence, TaskTemplate, TaskRework, DutyRoster, DutyRosterDay
from models.user import User, UserRole, UserStatus
from models.employee_complaint import EmployeeComplaint
from models.complaints import Complaint
from models.audit_log import AuditLog
from core.database import get_session
from utils.security import admin_required, hash_password
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from enum import Enum
import uuid
import httpx
import os

# Creating an east african time
EAT = timezone(timedelta(hours=3))

router = APIRouter(tags=["Admin"])

class TaskStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    reworked = "reworked"

class TaskEvidenceRead(BaseModel):
    id: str
    file_url: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


# Task response model
class TaskRead(BaseModel):
    id: str
    template_id: str
    title: str
    description: str
    status: TaskStatus
    assigned_to: str
    assigned_by: str
    is_rework: bool
    created_at: datetime
    updated_at: datetime
    evidence: List[TaskEvidenceRead] = []

    class Config:
        from_attributes = True

# Worker response model
class WorkerRead(BaseModel):
    id: uuid.UUID
    username: str
    role: UserRole
    status: UserStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 

# Helper: Audit log
def log_action(session: Session, performed_by: User, action: str, details: str = None):
    audit = AuditLog(
        action=action,
        details=details,
        user_id=performed_by
    )
    session.add(audit)
    session.commit()


def normalize_phone_number(phone_number: str) -> str:
    normalized = phone_number.strip()

    # Already valid international format
    if normalized.startswith("+"):
        return normalized

    # Local format (e.g. 07XXXXXXXX) → +2547XXXXXXXX
    if normalized.startswith("0"):
        return f"+254{normalized[1:]}"

    # Missing + but starts with 254 (e.g. 2547XXXXXXXX) → +2547XXXXXXXX
    if normalized.startswith("254"):
        return f"+{normalized}"

    # Anything else = reject
    raise HTTPException(status_code=400, detail="Invalid phone number format")

# Add a new worker
@router.post("/workers/")
def add_worker(
    username: str,
    password: str,
    phone_number: str,
    session: Session = Depends(get_session),
    admin: User = Depends(admin_required)
):
    # 1️⃣ Check if username already exists
    existing_user = session.exec(select(User).where(User.username == username)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    # 2️⃣ Normalize phone number
    phone_number = normalize_phone_number(phone_number)

    # 3️⃣ Check if phone number already exists
    existing_phone = session.exec(select(User).where(User.phone_number == phone_number)).first()
    if existing_phone:
        raise HTTPException(status_code=400, detail="Phone number already exists")

    # 4️⃣ Test phone number validity by sending SMS
    sms_payload = {
        "phone_number": phone_number,
        "message": f"Hello {username}, this is a verification test for your registration."
    }

    try:
        with httpx.Client(timeout=10) as client:
            sms_response = client.post("http://localhost:8000/sms/send-sms", json=sms_payload)
            sms_response.raise_for_status()
            sms_result = sms_response.json()
            if not sms_result.get("success"):
                raise HTTPException(status_code=400, detail=f"Phone number is not valid or SMS failed: {sms_result}")
    except Exception as sms_err:
        raise HTTPException(status_code=400, detail=f"Failed to verify phone number: {sms_err}")

    # 5️⃣ Create worker
    user = User(
        username=username,
        password_hash=hash_password(password),
        role=UserRole.worker,
        phone_number=phone_number
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # 6️⃣ Log action
    log_action(
        session,
        performed_by=admin.id,
        action="created_worker",
        details=f"Worker {username} with phone {phone_number} created and verified via SMS."
    )

    return {
        "created": True,
        "worker_id": str(user.id),
        "username": user.username,
        "phone_number": user.phone_number,
        "sms_verified": True
    }


# List all workers
@router.get("/workers/", response_model=List[WorkerRead])
def list_workers(
    session: Session = Depends(get_session),
    admin: User = Depends(admin_required)
):
    workers = session.exec(select(User).where(User.role == "worker")).all()
    log_action(session, performed_by=admin.id, action="viewed_workers_list")
    return workers


# View worker profile
@router.get("/workers/{username}", response_model=WorkerRead)
def view_worker(
    username: str,
    session: Session = Depends(get_session),
    admin: User = Depends(admin_required)
):
    # Find worker by username
    worker = session.exec(
        select(User).where(User.username == username, User.role == "worker")
    ).first()

    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    # Fetch complaints linked to worker
    complaints = session.exec(
        select(EmployeeComplaint).where(EmployeeComplaint.worker_id == worker.id)
    ).all()

    # Optional: attach tasks or any other info in the response

    log_action(
        session,
        performed_by=admin.id,
        action="viewed_worker_profile",
        details=f"Viewed worker {worker.username}"
    )

    return worker

# Update worker status
@router.patch("/workers/{username}/status", response_model=WorkerRead)
def update_worker_status(
    username: str,
    status: str,
    session: Session = Depends(get_session),
    admin: User = Depends(admin_required)
):
    # Find the worker by username
    worker = session.exec(
        select(User).where(User.username == username, User.role == "worker")
    ).first()

    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    allowed_statuses = ["active", "under_investigation"]
    if status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")

    worker.status = status
    session.add(worker)
    session.commit()
    session.refresh(worker)

    log_action(
        session,
        performed_by=admin.id,
        action="updated_worker_status",
        details=f"Worker '{worker.username}' status set to {status}"
    )

    return worker

def send_dismissal_sms(phone_number: str, worker_name: str):
    sms_payload = {
        "phone_number": phone_number,
        "message": f"Hello {worker_name}, you have been dismissed from your duties."
    }

    try:
        with httpx.Client(timeout=10) as client:
            sms_response = client.post(
                "http://localhost:8000/sms/send-sms",
                json=sms_payload
            )
            sms_response.raise_for_status()
            sms_result = sms_response.json()
            
            if not sms_result.get("success"):
                raise HTTPException(
                    status_code=400,
                    detail=f"SMS failed: {sms_result}"
                )
    except Exception as sms_err:
        raise HTTPException(status_code=400, detail=f"Failed to send dismissal SMS: {sms_err}")


@router.delete("/workers/{username}")
def remove_worker(username: str, session: Session = Depends(get_session), admin: User = Depends(admin_required)):
    # Find the worker
    worker = session.exec(
        select(User).where((User.username == username) & (User.role == "worker"))
    ).first()

    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    # Send dismissal SMS
    send_dismissal_sms(worker.phone_number, worker.username)

    # Delete worker from database
    session.delete(worker)
    session.commit()

    # Log the action
    log_action(
        session,
        performed_by=admin.id,
        action="removed_worker",
        details=f"Worker '{worker.username}' removed and notified via SMS"
    )

    return {"detail": f"Worker '{worker.username}' removed and SMS sent successfully"}


class TaskResponse(BaseModel):
    id: str
    template_id: str
    title: str
    description: str
    assigned_to: str
    assigned_by: str
    status: TaskStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@router.post("/tasks/", response_model=TaskResponse)
def create_task(
    template_id: str,  # changed from title/description
    assigned_to: str,
    session: Session = Depends(get_session),
    admin: User = Depends(admin_required)
):
    try:
        # 1️⃣ Ensure worker exists
        worker = session.exec(
            select(User).where(User.username == assigned_to)
        ).first()
        if not worker:
            raise HTTPException(status_code=404, detail="Assigned worker not found")

        # 2️⃣ Ensure they are a worker
        if worker.role != UserRole.worker:
            raise HTTPException(status_code=400, detail="Assigned user is not a worker")

        # 3️⃣ Ensure worker has no active tasks
        active_task = session.exec(
            select(Task).where(
                Task.assigned_to == assigned_to,
                Task.status.in_([TaskStatus.pending, TaskStatus.in_progress])
            )
        ).first()
        if active_task:
            raise HTTPException(
                status_code=400,
                detail=f"Worker '{assigned_to}' already has an active task"
            )

        # Check for upcoming rostered tasks within the next hour
        now_dt = datetime.now(EAT)
        today_str = now_dt.strftime("%A").upper()

        upcoming_rosters = session.exec(
            select(DutyRoster).where(
                DutyRoster.worker_name == assigned_to,
                DutyRoster.active == True
            )
        ).all()

        for roster in upcoming_rosters:
            roster_days = [d.day.name for d in roster.days]
            if today_str not in roster_days:
                continue

            roster_dt = datetime.combine(now_dt.date(), roster.start_time, tzinfo=EAT)
            if 0 <= (roster_dt - now_dt).total_seconds() <= 3600:  # 1 hour window
                raise HTTPException(
                    status_code=400,
                    detail=f"Worker '{assigned_to}' has a scheduled roster task at {roster.start_time}. Cannot assign manual task."
                )

        # 4️⃣ Load template
        template = session.get(TaskTemplate, template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Task template not found")
        
        task = Task(
            template_id=template.id,
            title=template.title,
            description=template.description,
            assigned_to=assigned_to,
            assigned_by=str(admin.username),  # keep string
            status=TaskStatus.pending,
            created_at=datetime.now(EAT),
            updated_at=datetime.now(EAT)
        )

        session.add(task)
        session.commit()
        session.refresh(task)

        # ✅ Send SMS notification (unchanged)
        sms_payload = {
            "phone_number": worker.phone_number,
            "message": f"You have been assigned a new task: {task.title}"
        }

        try:
            with httpx.Client() as client:
                print("👉 Sending SMS request...")
                sms_response = client.post("http://localhost:8000/sms/send-sms", json=sms_payload)
                sms_response.raise_for_status()

            sms_result = sms_response.json()
            success = sms_result.get("success", False)

            # Log SMS success/failure
            log_action(
                session,
                performed_by=admin.id,
                action="sms_notification_sent" if success else "sms_notification_failed",
                details=f"SMS to {worker.username} for task '{task.title}' | Result: {sms_result}"
            )

        except Exception as sms_err:
            # Log SMS failure
            log_action(
                session,
                performed_by=admin.id,
                action="sms_notification_failed",
                details=f"SMS to {worker.username} for task '{task.title}' failed | Error: {sms_err}"
            )

        # Log task creation
        log_action(
            session,
            performed_by=admin.id,
            action="created_task",
            details=f"Task '{task.title}' assigned to {task.assigned_to}"
        )

        return task  # FastAPI will serialize via TaskResponse

    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating task: {str(e)}")

@router.get("/tasks/", response_model=List[TaskRead])
def list_tasks(
    session: Session = Depends(get_session),
    admin: User = Depends(admin_required)
):
    tasks = session.exec(select(Task)).all()
    response_tasks: List[TaskRead] = []

    for task in tasks:
        evidences = session.exec(
            select(TaskEvidence).where(TaskEvidence.task_id == task.id)
        ).all()

        response_tasks.append(
            TaskRead(
                id=task.id,
                title=task.title,
                template_id=task.template_id,
                description=task.description,
                status=task.status,
                is_rework=task.is_rework,
                assigned_to=task.assigned_to,
                assigned_by=task.assigned_by,
                created_at=task.created_at,
                updated_at=task.updated_at,
                evidence=evidences
            )
        )

    log_action(session, performed_by=admin.id, action="viewed_tasks_list")
    return response_tasks


# View task details
@router.get("/tasks/{task_id}", response_model=TaskRead)
def view_task(task_id: str, session: Session = Depends(get_session), admin: User = Depends(admin_required)):
    task = session.exec(
        select(Task)
        .where(Task.id == task_id)
        .options(selectinload(Task.evidences))
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    response_task: TaskRead = {}

    evidence = session.exec(
            select(TaskEvidence).where(TaskEvidence.task_id == task.id)
    ).all()

    
    response_task = TaskRead(
                        id=task.id,
                        title=task.title,
                        template_id=task.template_id,
                        description=task.description,
                        status=task.status,
                        is_rework=task.is_rework,
                        assigned_to=task.assigned_to,
                        assigned_by=task.assigned_by,
                        created_at=task.created_at,
                        updated_at=task.updated_at,
                        evidence=evidence
                    )

    log_action(session, performed_by=admin.id, action="viewed_task", details=f"Viewed task '{task.title}'")
    return response_task

# Update task
@router.patch("/tasks/{task_id}", response_model=TaskRead)
def update_task(
    task_id: str,
    status: str = None,
    session: Session = Depends(get_session),
    admin: User = Depends(admin_required)
):
    task = session.exec(
        select(Task)
        .where(Task.id == task_id)
        .options(selectinload(Task.evidences))
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if status:
        try:
            task.status = TaskStatus(status)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status")

    task.updated_at = datetime.now(EAT)

    session.add(task)
    session.commit()
    session.refresh(task)

    log_action(session, performed_by=admin.id, action="updated_task", details=f"Updated task '{task.title}'")
    return task


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "..", "uploads")

@router.post("/tasks/{task_id}/reset-task-status")
def reset_task_status(
    task_id: str,
    reason: str,
    session: Session = Depends(get_session),
    admin: User = Depends(admin_required)
):
    # Find the task
    task = session.exec(select(Task).where(Task.id == task_id)).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Find the worker
    worker = session.exec(select(User).where(User.username == task.assigned_to)).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Assigned worker not found")

    evidences = session.exec(select(TaskEvidence).where(TaskEvidence.task_id == task.id)).all()
    for evidence in evidences:
        try:
            # Replace the file path with a placeholder instead of deleting the file
            evidence.file_url = "DELETED"
            session.add(evidence)

            log_action(
                session,
                performed_by=admin.id,
                action="evidence_path_redacted",
                details=f"Redacted evidence path for task '{task.title}' (uploaded_at preserved)"
            )

        except Exception as err:
            log_action(
                session,
                performed_by=admin.id,
                action="evidence_redaction_failed",
                details=f"Failed to redact evidence for task '{task.title}' | Error: {err}"
            )

    session.commit()

    # Reset status to pending and update timestamp
    task.status = TaskStatus.reworked
    task.updated_at = datetime.now(EAT)
    session.add(task)
    session.commit()
    session.refresh(task)

    # Create another instance of task for easier analytics
    rework_task = Task(
        title=task.title,
        description=task.description,
        assigned_to=task.assigned_to,
        assigned_by=task.assigned_by,
        template_id=task.template_id,
        is_rework=True,
        status=TaskStatus.pending,
    )

    session.add(rework_task)
    session.commit()
    session.refresh(rework_task)


    # Log the rework request in TaskRework table
    task_rework = TaskRework(
        task_id=task.id,
        worker_name=task.assigned_to,
        reset_by=admin.username,
        reset_at=datetime.now(EAT)
    )
    session.add(task_rework)
    session.commit()

    # Notify worker via SMS
    sms_payload = {
        "phone_number": worker.phone_number,
        "message": f"Your task '{task.title}' has been reset by admin. Reason: {reason}. "
                   f"Please work on it again."
    }

    try:
        with httpx.Client() as client:
            sms_response = client.post("http://localhost:8000/sms/send-sms", json=sms_payload)
            sms_response.raise_for_status()

        sms_result = sms_response.json()
        success = sms_result.get("success", False)

        log_action(
            session,
            performed_by=admin.id,
            action="sms_notification_sent" if success else "sms_notification_failed",
            details=f"Task '{task.title}' reset → SMS to {worker.phone_number} | Reason: {reason} | Result: {sms_result}"
        )

    except Exception as sms_err:
        log_action(
            session,
            performed_by=admin.id,
            action="sms_notification_failed",
            details=f"Task '{task.title}' reset → SMS to {worker.phone_number} failed | Reason: {reason} | Error: {sms_err}"
        )

    # Log the reset action
    log_action(
        session,
        performed_by=admin.id,
        action="task_reset",
        details=f"Task '{task.title}' was reset by admin. Reason: {reason}"
    )

    return {
        "success": True,
        "task_id": str(task.id),
        "new_status": task.status,
        "notified_worker": worker.username,
        "reason": reason
    }


# Delete tasks
@router.delete("/tasks/{task_id}", status_code=200)
def delete_task(
    task_id: str,
    session: Session = Depends(get_session),
    admin: User = Depends(admin_required)
):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Just delete the task; leave evidences intact
    session.delete(task)
    session.commit()

    log_action(session, performed_by=admin.id, action="deleted_task", details=f"Task ID: {task_id}")

    return {"detail": f"Task {task_id} deleted successfully"}

@router.get("/complaints/")
def list_complaints(
    session: Session = Depends(get_session),
    admin: User = Depends(admin_required)
):
    # Fetch from both tables
    employee_complaints = session.exec(select(EmployeeComplaint)).all()
    general_complaints = session.exec(select(Complaint)).all()

    # Merge results into one list with normalized format
    response = []

    # Employee complaints
    for c in employee_complaints:
        response.append({
            "id": str(c.id),
            "description": c.description,
            "category": None,                # no category in EmployeeComplaint
            "status": c.status,
            "evidence": None,                # Employee complaints don't have evidence
            "created_at": c.submitted_at,    # use submitted_at for created time
        })

    # General complaints
    for c in general_complaints:
        response.append({
            "id": str(c.id),
            "description": c.description,
            "category": c.category,
            "status": c.status,
            "evidence": c.evidence,          # evidence may be None
            "created_at": c.submitted_at,    # use submitted_at
        })

    # Log admin action
    log_action(
        session,
        performed_by=admin.id,
        action="viewed_complaints_list"
    )

    return response

# Update complaint status
@router.patch("/complaints/{complaint_id}/status")
def update_complaint_status(
    complaint_id: str,
    status: str,
    session: Session = Depends(get_session),
    admin: User = Depends(admin_required),
):
    try:
        complaint_uuid = uuid.UUID(complaint_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid complaint ID")

    allowed_statuses = ["pending", "reviewed", "resolved"]
    if status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")

    # Try fetching from both tables
    emp_complaint = session.get(EmployeeComplaint, complaint_uuid)
    complaint = session.get(Complaint, complaint_uuid)

    if not emp_complaint and not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found in either table")

    # Update whichever exists
    if emp_complaint:
        emp_complaint.status = status
        session.add(emp_complaint)

    if complaint:
        complaint.status = status
        session.add(complaint)

    session.commit()
    updated = emp_complaint or complaint

    log_action(
        session,
        performed_by=admin.id,
        action="updated_complaint_status",
        details=f"Complaint {complaint_id} set to {status}"
    )

    return {"id": str(updated.id), "status": updated.status, "table": updated.__class__.__name__}


# View audit logs
@router.get("/audit-logs/", response_model=List[AuditLog])
def view_audit_logs(session: Session = Depends(get_session), admin: User = Depends(admin_required)):
    logs = session.exec(select(AuditLog)).all()
    return logs