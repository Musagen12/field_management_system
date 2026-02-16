import uuid
from typing import Optional
from sqlmodel import SQLModel, Field
import enum
from datetime import datetime, timezone, timedelta

EAT = timezone(timedelta(hours=3))

class AuditAction(str, enum.Enum):
    # Task-related actions
    CREATED_TASK = "created_task"
    ASSIGNED_TASK = "assigned_task"
    UPDATED_TASK_STATUS = "updated_task_status"
    DELETED_TASK = "deleted_task"

    # Worker-related actions
    ADDED_WORKER = "added_worker"
    UPDATED_WORKER_STATUS = "updated_worker_status"
    REMOVED_WORKER = "removed_worker"
    PLACED_UNDER_INVESTIGATION = "placed_under_investigation"

    # Complaint-related actions
    REVIEWED_COMPLAINT = "reviewed_complaint"
    RESOLVED_COMPLAINT = "resolved_complaint"

class AuditLog(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    action: str  # e.g., "created_task", "updated_status", "removed_user"
    details: Optional[str] = None

    user_id: uuid.UUID = Field(foreign_key="user.id")  # who did the action
    created_at: datetime = Field(default_factory=lambda: datetime.now(EAT))
