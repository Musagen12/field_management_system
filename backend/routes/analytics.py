from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Dict
from models.task import Task
from models.user import User, UserRole
from core.database import get_session
from models.task import Task, TaskEvidence, TaskStatus, TaskRework
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
from models.user import UserStatus
import uuid
import httpx

EAT = timezone(timedelta(hours=3))

router = APIRouter(tags=["Analytics"])

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

# List all workers
@router.get("/workers/", response_model=List[WorkerRead])
def list_workers(
    session: Session = Depends(get_session)
):
    workers = session.exec(select(User).where(User.role == "worker")).all()
    return workers

@router.get("/worker/{username}/task-response-time", response_model=list[dict])
async def get_worker_response_time_data(
    username: str,
    db: Session = Depends(get_session)
):
    # Only tasks that are NOT pending (i.e. acknowledged or beyond)
    tasks = db.exec(
        select(Task)
        .where(
            Task.assigned_to == username,
            Task.status != TaskStatus.pending
        )
    ).all()

    if not tasks:
        raise HTTPException(
            status_code=404,
            detail=f"No acknowledged/completed tasks found for worker {username}"
        )

    task_data = []

    for task in tasks:
        # Use acknowledged_at, not updated_at
        if not task.acknowledged_at:
            continue

        response_time = (
            task.acknowledged_at - task.created_at
        ).total_seconds() / 60

        # Ignore garbage / zero deltas
        if response_time <= 0:
            continue

        task_data.append({
            "task_id": task.id,
            "title": task.title,
            "response_time_min": response_time
        })

    if not task_data:
        raise HTTPException(
            status_code=404,
            detail=f"No valid response-time data for worker {username}"
        )

    return task_data

@router.get("/workers/aggregated-response-time")
async def aggregate_worker_response_times(
    db: Session = Depends(get_session)
):
    # 1️⃣ Get workers
    workers = db.exec(
        select(User.username).where(User.role == UserRole.worker)
    ).all()

    if not workers:
        raise HTTPException(status_code=404, detail="No workers found")

    aggregated = []

    # 2️⃣ Call per-worker analytics route
    async with httpx.AsyncClient() as client:
        for username in workers:
            resp = await client.get(
                f"http://0.0.0.0:8000/analytics/worker/{username}/task-response-time"
            )

            if resp.status_code != 200:
                continue

            task_data = resp.json()

            if not task_data:
                continue

            # 3️⃣ Compute average
            times = [t["response_time_min"] for t in task_data if t["response_time_min"] > 0]

            if not times:
                continue

            avg_time = sum(times) / len(times)

            aggregated.append({
                "username": username,
                "average_response_time_min": round(avg_time, 2),
                "task_count": len(times)
            })

    if not aggregated:
        raise HTTPException(status_code=404, detail="No valid analytics data")

    # 4️⃣ Rank workers (fastest first)
    aggregated.sort(key=lambda x: x["average_response_time_min"])

    return {
        "worker_count": len(aggregated),
        "results": aggregated
    }

@router.get("/execution-time/by-task-and-worker")
def execution_time_by_task_and_worker(session: Session = Depends(get_session)):
    # Query all completed, non-rework tasks
    tasks = session.exec(
        select(Task)
        .where(
            Task.status != TaskStatus.pending,
            Task.is_rework == False             # exclude reworks
        )
    ).all()

    result: Dict[str, Dict[str, List[float]]] = {}

    for task in tasks:
        # skip tasks without acknowledged time
        if not task.acknowledged_at:
            continue

        # skip if no evidences
        if not task.evidences:
            continue

        # loop through all evidences for the task
        for evidence in task.evidences:
            if not evidence.uploaded_at:
                continue

            delta_seconds = (evidence.uploaded_at - task.acknowledged_at).total_seconds()
            if delta_seconds <= 0:
                continue

            # task title level
            if task.title not in result:
                result[task.title] = {}

            # worker level
            if task.assigned_to not in result[task.title]:
                result[task.title][task.assigned_to] = []

            result[task.title][task.assigned_to].append(delta_seconds)

    if not result:
        raise HTTPException(status_code=404, detail="No execution time data available")

    return result

@router.get("/workers/ranked-response-time")
def rank_workers_by_response_time(db: Session = Depends(get_session)):
    # Get all workers
    workers = db.exec(select(User).where(User.role == UserRole.worker)).all()
    if not workers:
        raise HTTPException(status_code=404, detail="No workers found")

    aggregated: List[Dict] = []

    for worker in workers:
        # Get all non-pending tasks for the worker
        tasks = db.exec(
            select(Task).where(
                Task.assigned_to == worker.username,
                Task.status != TaskStatus.pending
            )
        ).all()

        # Skip workers with no valid tasks
        if not tasks:
            continue

        response_times: List[float] = []
        for task in tasks:
            # Use acknowledged_at - created_at
            if not task.acknowledged_at or task.acknowledged_at <= task.created_at:
                continue
            delta = (task.acknowledged_at - task.created_at).total_seconds() / 60
            if delta > 0:
                response_times.append(delta)

        if not response_times:
            continue

        avg_response = sum(response_times) / len(response_times)
        aggregated.append({
            "username": worker.username,
            "average_response_time_min": round(avg_response, 2),
            "task_count": len(response_times)
        })

    if not aggregated:
        raise HTTPException(status_code=404, detail="No valid analytics data")

    # Rank workers by fastest average response time
    aggregated.sort(key=lambda x: x["average_response_time_min"])

    return {
        "worker_count": len(aggregated),
        "results": aggregated
    }

@router.get("/task-completion-times", response_model=Dict[str, Dict[str, List[str]]])
def task_completion_times(session: Session = Depends(get_session)):
    """
    Returns all uploaded_at timestamps per task title and worker.
    """
    tasks = session.exec(
        select(Task).where(Task.status != TaskStatus.pending)
    ).all()

    if not tasks:
        raise HTTPException(status_code=404, detail="No tasks found")

    result: Dict[str, Dict[str, List[str]]] = {}

    for task in tasks:
        # skip reworks if needed
        if getattr(task, "is_rework", False):
            continue

        if not task.evidences:
            continue

        if task.title not in result:
            result[task.title] = {}

        if task.assigned_to not in result[task.title]:
            result[task.title][task.assigned_to] = []

        for evidence in task.evidences:
            if evidence.uploaded_at:
                # store ISO-formatted string
                result[task.title][task.assigned_to].append(evidence.uploaded_at.isoformat())

    if not result:
        raise HTTPException(status_code=404, detail="No uploaded evidence timestamps found")

    return result

@router.get("/workers/rework-frequency", response_model=Dict[str, int])
def workers_rework_frequency(session: Session = Depends(get_session)):
    # Aggregate by worker_name
    stmt = (
        select(TaskRework.worker_name, func.count(TaskRework.id))
        .group_by(TaskRework.worker_name)
    )

    rows = session.exec(stmt).all()

    if not rows:
        raise HTTPException(status_code=404, detail="No rework data found")

    result: Dict[str, int] = {worker_name: count for worker_name, count in rows}

    return result