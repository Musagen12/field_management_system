from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from pydantic import BaseModel
from models.task import Facility, Building
from models.user import User
from core.database import get_session
from utils.security import admin_required

router = APIRouter(tags=["Facilities"])

# response modelS
class TaskTemplateResponseModel(BaseModel):
    id: str
    title: str
    description: str

class FacilityResponseModel(BaseModel):
    id: str
    name: str
    building_id: str
    task_templates: List[TaskTemplateResponseModel] = []

# list all facilities
@router.get("/", response_model=List[FacilityResponseModel])
def list_facilities(session: Session = Depends(get_session), admin: User = Depends(admin_required)):
    facilities = session.exec(select(Facility)).all()

    result = []
    for facility in facilities:
        facility_data = FacilityResponseModel(
            id=facility.id,
            name=facility.name,
            building_id=facility.building_id,
            task_templates=[
                TaskTemplateResponseModel(
                    id=task.id,
                    title=task.title,
                    description=task.description
                ) for task in facility.task_templates
            ]
        )
        result.append(facility_data)
    
    return result
    # return facilities


# create a facility
@router.post("/", response_model=FacilityResponseModel)
def create_facility(name: str, building_id: str, session: Session = Depends(get_session), admin: User = Depends(admin_required)):
    # Check building exists
    building = session.get(Building, building_id)
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")

    # Optional: prevent duplicate facility names in same building
    existing = session.exec(
        select(Facility).where(Facility.name == name, Facility.building_id == building_id)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Facility with this name already exists in this building")

    facility = Facility(name=name, building_id=building_id)
    session.add(facility)
    session.commit()
    session.refresh(facility)
    return facility


# update a facility's name
@router.patch("/{facility_id}", response_model=FacilityResponseModel)
def update_facility(facility_id: str, name: str, session: Session = Depends(get_session), admin: User = Depends(admin_required)):
    facility = session.get(Facility, facility_id)
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")

    facility.name = name
    session.add(facility)
    session.commit()
    session.refresh(facility)
    return facility


# delete a facility
@router.delete("/{facility_id}")
def delete_facility(facility_id: str, session: Session = Depends(get_session), admin: User = Depends(admin_required)):
    facility = session.get(Facility, facility_id)
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")

    session.delete(facility)
    session.commit()
    return {"detail": f"Facility {facility.name} was deleted."}
