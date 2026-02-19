# celery_app.py
from celery import Celery
from datetime import datetime, timezone, timedelta
from core.database import get_session
from sqlmodel import select
from models.task import DutyRoster, DutyRosterDay, Task, TaskTemplate, TaskStatus
from models.user import User, UserRole
from dotenv import load_dotenv
import httpx
import os

load_dotenv()

EAT = timezone(timedelta(hours=3))

celery = Celery(
    "tasks",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0"),
)

celery.conf.beat_schedule = {
    "check-rosters-every-minute": {
        "task": "check_duty_rosters",
        "schedule": 60.0,  # every minute
    },
}

def log_action(session, performed_by, action, details=None):
    print(f"[{datetime.now(EAT)}] ACTION={action} BY={performed_by} DETAILS={details}")


@celery.task(name="check_duty_rosters")
def check_duty_rosters():
    now = datetime.now(EAT)
    today_str = now.strftime("%A").upper()

    # Use next() to get session from generator
    session = next(get_session())

    try:
        rosters = session.exec(select(DutyRoster).where(DutyRoster.active == True)).all()

        for roster in rosters:
            roster_days = [d.day.name for d in roster.days]
            if today_str not in roster_days:
                continue

            if now.time() < roster.start_time:
                continue

            # one-time guard
            if roster.last_run:
                last_run = roster.last_run
                if last_run.tzinfo is None:
                    last_run = last_run.replace(tzinfo=EAT)
                if (now - last_run) < timedelta(hours=1):
                    continue

            worker = session.exec(select(User).where(User.username == roster.worker_name)).first()
            if not worker or worker.role != UserRole.worker:
                continue

            active_task = session.exec(
                select(Task).where(
                    Task.assigned_to == worker.username,
                    Task.status.in_([TaskStatus.pending, TaskStatus.in_progress])
                )
            ).first()
            if active_task:
                continue

            template = session.get(TaskTemplate, roster.template_id)
            if not template:
                continue

            task = Task(
                template_id=template.id,
                title=template.title,
                description=template.description,
                assigned_to=worker.username,
                assigned_by="SYSTEM",
                status=TaskStatus.pending,
                created_at=now,
                updated_at=now,
            )

            session.add(task)
            roster.last_run = now
            session.add(roster)
            session.commit()
            session.refresh(task)

            # SMS
            try:
                with httpx.Client() as client:
                    client.post(
                        "http://localhost:8000/sms/send-sms",
                        json={
                            "phone_number": worker.phone_number,
                            "message": f"You have been assigned a new task: {task.title}"
                        },
                    ).raise_for_status()
            except Exception:
                pass

            log_action(
                session,
                performed_by="SYSTEM",
                action="created_task_via_roster",
                details=f"Task {task.id} → {worker.username}"
            )

    finally:
        session.close()  # Make sure to close the session manually



###################################################
# celery -A celery_app.celery worker --beat --loglevel=info
###################################################