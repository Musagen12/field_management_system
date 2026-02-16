from fastapi import APIRouter, Depends, HTTPException, status
from datetime import time
from sqlmodel import Session, select
from typing import List, Optional
from models.task import TaskTemplate, DutyRoster, DutyRosterDay
from models.user import User, UserRole
from models.audit_log import AuditLog
from core.database import get_session
from utils.security import admin_required
from pydantic import BaseModel

router = APIRouter(tags=["DutyRoster"])

# --- Request schemas ---
class DutyRosterCreate(BaseModel):
    template_id: str
    worker_name: str
    start_time: time
    days: List[str]

class DutyRosterUpdate(BaseModel):
    start_time: Optional[time] = None
    active: Optional[bool] = None
    days: Optional[List[str]] = None

# --- Response schema ---
class DutyRosterResponse(BaseModel):
    id: str
    template_id: str
    worker_name: str
    start_time: time
    days: List[str]
    active: bool

    class Config:
        from_attributes = True

# List all the duty-rosters
@router.get("/", response_model=List[DutyRosterResponse])
def list_duty_rosters(session: Session = Depends(get_session), admin: User = Depends(admin_required)):
    rosters = session.exec(select(DutyRoster)).all()

    # We build the response manually only because we need to flatten the "days" objects
    result = []
    for r in rosters:
        result.append(DutyRosterResponse(
            id=r.id,
            template_id=r.template_id,
            worker_name=r.worker_name,
            start_time=r.start_time,
            days=[d.day for d in r.days],
            active=r.active
        ))
    return result

# Get one roster item
@router.get("/{roster_id}", response_model=DutyRosterResponse)
def get_duty_roster(roster_id: str, session: Session = Depends(get_session), admin: User = Depends(admin_required)):
    roster = session.get(DutyRoster, roster_id)
    if not roster:
        raise HTTPException(status_code=404, detail="DutyRoster not found")

    return DutyRosterResponse(
        id=roster.id,
        template_id=roster.template_id,
        worker_name=roster.worker_name,
        start_time=roster.start_time,
        days=[d.day for d in roster.days],
        active=roster.active
    )

@router.post("/", response_model=DutyRosterResponse)
def create_duty_roster(
    data: DutyRosterCreate,
    session: Session = Depends(get_session),
    admin: User = Depends(admin_required)
):
    # 1️⃣ Validate template
    template = session.get(TaskTemplate, data.template_id)
    if not template:
        raise HTTPException(status_code=404, detail="TaskTemplate not found")

    # 2️⃣ Validate worker
    worker = session.exec(
        select(User).where(User.username == data.worker_name)
    ).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    if worker.role != UserRole.worker:
        raise HTTPException(status_code=403, detail="User is not a worker")

    # 3️⃣ Normalize input days → ALWAYS UPPERCASE STRINGS
    incoming_days: set[str] = {d.upper() for d in data.days}
    incoming_time = data.start_time

    def to_minutes(t):
        return t.hour * 60 + t.minute

    incoming_minutes = to_minutes(incoming_time)

    # 4️⃣ Conflict check (±3 HOURS = 180 minutes)
    active_rosters = session.exec(
        select(DutyRoster).where(
            DutyRoster.worker_name == worker.username,
            DutyRoster.active.is_(True)
        )
    ).all()

    for roster in active_rosters:
        # ✅ Normalize stored days the SAME way
        existing_days = {
            d.day.upper() if isinstance(d.day, str) else d.day.name
            for d in roster.days
        }

        # No overlapping days → no conflict
        overlapping_days = incoming_days & existing_days
        if not overlapping_days:
            continue

        existing_minutes = to_minutes(roster.start_time)

        # Time window conflict
        if abs(existing_minutes - incoming_minutes) < 180:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Duty roster conflict: "
                    f"worker already has a roster within 3 hours "
                    f"({roster.start_time}) on {list(overlapping_days)}"
                )
            )

    # 5️⃣ Create roster
    roster = DutyRoster(
        template_id=template.id,
        worker_name=worker.username,
        start_time=incoming_time,
        active=True
    )
    session.add(roster)
    session.commit()
    session.refresh(roster)

    # 6️⃣ Attach days (stored consistently)
    for day in incoming_days:
        session.add(
            DutyRosterDay(
                roster_id=roster.id,
                day=day  # stored as UPPERCASE
            )
        )

    session.commit()
    session.refresh(roster)

    return DutyRosterResponse(
        id=roster.id,
        template_id=roster.template_id,
        worker_name=roster.worker_name,
        start_time=roster.start_time,
        days=[
            d.day.upper() if isinstance(d.day, str) else d.day.name
            for d in roster.days
        ],
        active=roster.active
    )

# Update a give roster entry
@router.patch("/{roster_id}", response_model=DutyRosterResponse)
def update_duty_roster(roster_id: str, data: DutyRosterUpdate, session: Session = Depends(get_session), admin: User = Depends(admin_required)):
    roster = session.exec(select(DutyRoster).where(DutyRoster.id == roster_id)).first()
    if not roster:
        raise HTTPException(status_code=404, detail="DutyRoster not found")

    changes = []
    if data.start_time is not None:
        roster.start_time = data.start_time
        changes.append(f"start_time={data.start_time}")
    
    if data.active is not None:
        roster.active = data.active
        changes.append(f"active={data.active}")

    if data.days is not None:
        # Delete old days
        for d in roster.days:
            session.delete(d)
        
        # Add new days
        for day_str in data.days:
            roster_day = DutyRosterDay(
                roster_id=roster.id,
                day=day_str.upper()
            )
            session.add(roster_day)
        changes.append(f"days={data.days}")

    session.add(roster)
    session.commit()
    session.refresh(roster)

    return DutyRosterResponse(
        id=roster.id,
        template_id=roster.template_id,
        worker_name=roster.worker_name,
        start_time=roster.start_time,
        days=[d.day for d in roster.days],
        active=roster.active
    )

# Delete the roster entry
@router.delete("/{roster_id}", status_code=status.HTTP_200_OK)
def delete_duty_roster(roster_id: str, session: Session = Depends(get_session), admin: User = Depends(admin_required)):
    roster = session.exec(select(DutyRoster).where(DutyRoster.id == roster_id)).first()
    if not roster:
        raise HTTPException(status_code=404, detail="DutyRoster not found")

    for d in roster.days:
        session.delete(d)

    session.delete(roster)
    session.commit()

    return {"response": "Deleted the entry"}