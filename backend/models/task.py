import uuid
import enum
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, timezone, timedelta, time
from typing import Optional, List

EAT = timezone(timedelta(hours=3))

class TaskStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    reworked = "reworked"

class TaskType(str, enum.Enum):
    RECURRING = "recurring"    # These are tasks that exist in the duty roster
    ONE_OFF_SHORT = "one_off_short"   # These are tasks that occur once but last for less than a day 
    ONE_OFF_LONG = "one_off_long"   # These are tasks that occur once but last for more than a day

class DaysOfTheWeek(str, enum.Enum):
    MONDAY = "moday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


# Facilities models
class Building(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, index=True)
    name: str
    facilities: List["Facility"] = Relationship(back_populates="building")


class Facility(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, index=True)
    name: str
    building_id: str = Field(foreign_key="building.id")
    building: Optional[Building] = Relationship(back_populates="facilities")
    task_templates: List["TaskTemplate"] = Relationship(back_populates="facility")


# Task models
class TaskTemplate(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, index=True)
    title: str
    description: str
    task_type: TaskType = Field(default=TaskType.ONE_OFF_SHORT)
    facility_id: str = Field(foreign_key="facility.id")
    facility: Optional[Facility] = Relationship(back_populates="task_templates")
    tasks: List["Task"] = Relationship(back_populates="template")
    duty_rosters: list["DutyRoster"] = Relationship(back_populates="template")

# A model for recurrent TaskTemplates
class DutyRoster(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, index=True)
    template_id: str = Field(foreign_key="tasktemplate.id")
    template: Optional[TaskTemplate] = Relationship(back_populates="duty_rosters")
    worker_name: str
    start_time: time
    days: list["DutyRosterDay"] = Relationship(back_populates="roster")
    active: bool = Field(default=True)
    
    # ✅ Track the last time this roster triggered a task
    last_run: Optional[datetime] = Field(default=None, nullable=True)

class DutyRosterDay(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    roster_id: str = Field(foreign_key="dutyroster.id")
    day: DaysOfTheWeek

    roster: DutyRoster = Relationship(back_populates="days")

class Task(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, index=True)

    # To avoid any breaking if the template is deleted
    title: str
    description: str

    status: TaskStatus = Field(default=TaskStatus.pending)

    assigned_to: str
    assigned_by: str

    template_id: str = Field(foreign_key="tasktemplate.id")

    created_at: datetime = Field(default_factory=lambda: datetime.now(EAT))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(EAT))

    acknowledged_at: datetime = Field(default_factory=lambda: datetime.now(EAT))
    is_rework: bool = Field(default=False)

    template: TaskTemplate = Relationship(back_populates="tasks")
    evidences: list["TaskEvidence"] = Relationship(back_populates="task")


# Evidence and rework models
class TaskEvidence(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, index=True)
    task_id: str = Field(foreign_key="task.id")
    file_url: str
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(EAT))

    task: Task = Relationship(back_populates="evidences")

class TaskRework(SQLModel, table=True):
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True
    )

    task_id: str = Field(foreign_key="task.id", index=True)
    worker_name: str = Field(foreign_key="task.assigned_to", index=True)

    reset_by: str

    reset_at: datetime = Field(default_factory=lambda: datetime.now(EAT))
