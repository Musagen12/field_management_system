from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from pydantic import BaseModel
from core.database import get_session
from utils.security import admin_required
from models.task import TaskTemplate, Facility
from models.user import User
import enum

router = APIRouter(tags=["TaskTemplates"])

class TaskType(str, enum.Enum):
    RECURRING = "recurring"
    ONE_OFF_SHORT = "one_off_short"
    ONE_OFF_LONG = "one_off_long" 

# --- Response models ---
class FacilityResponseModel(BaseModel):
    name: str

    class Config:
        from_attributes = True

class TaskTemplateRead(BaseModel):
    id: str
    title: str
    description: str
    task_type: str
    facility: FacilityResponseModel  # always include facility

    class Config:
        from_attributes = True

class TaskTemplateCreate(BaseModel):
    title: str
    description: str
    task_type: TaskType
    facility_id: str

class TaskTemplateUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    facility_id: Optional[str] = None


# --- Routes ---

# 1️⃣ List all templates
@router.get("/task-templates/", response_model=List[TaskTemplateRead])
def list_templates(session: Session = Depends(get_session), admin: User = Depends(admin_required)):
    templates = session.exec(select(TaskTemplate)).all()
    response = []
    for template in templates:
        if not template.facility:
            raise HTTPException(status_code=400, detail=f"Facility not set for template '{template.title}'")
        response.append(
            TaskTemplateRead(
                id=template.id,
                title=template.title,
                description=template.description,
                task_type=template.task_type,
                facility=FacilityResponseModel(name=template.facility.name)
            )
        )
    return response

# 2️⃣ Create a new template
@router.post("/task-templates/", response_model=TaskTemplateRead)
def create_template(template: TaskTemplateCreate, session: Session = Depends(get_session), admin: User = Depends(admin_required)):
    facility = session.get(Facility, template.facility_id)
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")

    new_template = TaskTemplate(
        title=template.title,
        description=template.description,
        task_type=template.task_type,
        facility_id=template.facility_id
    )
    session.add(new_template)
    session.commit()
    session.refresh(new_template)

    return TaskTemplateRead(
        id=new_template.id,
        title=new_template.title,
        description=new_template.description,
        task_type=template.task_type,
        facility=FacilityResponseModel(name=facility.name)
    )

# 3️⃣ View a single template
@router.get("/task-templates/{template_id}", response_model=TaskTemplateRead)
def view_template(template_id: str, session: Session = Depends(get_session), admin: User = Depends(admin_required)):
    template = session.get(TaskTemplate, template_id)
    if not template or not template.facility:
        raise HTTPException(status_code=404, detail="Template or facility not found")
    return TaskTemplateRead(
        id=template.id,
        title=template.title,
        description=template.description,
        task_type=template.task_type,
        facility=FacilityResponseModel(name=template.facility.name)
    )

# 4️⃣ Update a template
@router.patch("/task-templates/{template_id}", response_model=TaskTemplateRead)
def update_template(template_id: str, template_update: TaskTemplateUpdate, session: Session = Depends(get_session), admin: User = Depends(admin_required)):
    template = session.get(TaskTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    if template_update.title is not None:
        template.title = template_update.title
    if template_update.description is not None:
        template.description = template_update.description
    if template_update.facility_id is not None:
        facility = session.get(Facility, template_update.facility_id)
        if not facility:
            raise HTTPException(status_code=404, detail="Facility not found")
        template.facility_id = template_update.facility_id

    session.add(template)
    session.commit()
    session.refresh(template)

    if not template.facility:
        raise HTTPException(status_code=400, detail="Facility not set for template")

    return TaskTemplateRead(
        id=template.id,
        title=template.title,
        description=template.description,
        task_type=template.task_type,
        facility=FacilityResponseModel(name=template.facility.name)
    )

# 5️⃣ Delete a template
@router.delete("/task-templates/{template_id}", status_code=200)
def delete_template(template_id: str, session: Session = Depends(get_session), admin: User = Depends(admin_required)):
    template = session.get(TaskTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    if template.tasks:
        raise HTTPException(status_code=400, detail="Cannot delete template with existing tasks")
    
    session.delete(template)
    session.commit()
    return {"detail": f"Template '{template.title}' deleted successfully"}
