import uuid
from sqlmodel import SQLModel, Field
import enum
from datetime import datetime, timezone, timedelta

EAT = timezone(timedelta(hours=3))

# Status for employee complaints
class EmployeeComplaintStatus(str, enum.Enum):
    pending = "pending"
    reviewed = "reviewed"
    resolved = "resolved"

class EmployeeComplaint(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    worker_id: uuid.UUID = Field(foreign_key="user.id")  # worker who submitted the complaint
    description: str
    status: EmployeeComplaintStatus = Field(default=EmployeeComplaintStatus.pending)
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(EAT))
