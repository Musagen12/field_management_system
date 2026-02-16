from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import List
from models.task import Building
from core.database import get_session
from models.user import User
from utils.security import admin_required

router = APIRouter(tags=["Buildings"])

class FacilityResponseModel(BaseModel):
    id: str
    name: str

class BuildingResponseModel(BaseModel):
    id: str
    name: str
    facilities: List[FacilityResponseModel] = []

# list all buildings
@router.get("/", response_model=List[BuildingResponseModel])
def list_buildings(session: Session = Depends(get_session), admin: User = Depends(admin_required)):
    buildings = session.exec(select(Building)).all()

    result = []
    for building in buildings:
        building_data = BuildingResponseModel(
            id=building.id,
            name=building.name,
            facilities=[FacilityResponseModel(id=f.id, name=f.name) for f in building.facilities]
        )
        result.append(building_data)
    
    return result

    # return buildings


# create a building
@router.post("/", response_model=BuildingResponseModel)
def create_building(name: str, session: Session = Depends(get_session), admin: User = Depends(admin_required)):
    existing_building = session.exec(select(Building).where(Building.name == name)).first()
    if existing_building:
        raise HTTPException(status_code=400, detail="Building already exists")

    building = Building(name=name)
    session.add(building)
    session.commit()
    session.refresh(building)

    return building


# update a building
@router.patch("/{building_id}", response_model=BuildingResponseModel)
def update_building(building_id: str, name: str, session: Session = Depends(get_session), admin: User = Depends(admin_required)):
    building = session.get(Building, building_id)
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")

    building.name = name
    session.add(building)
    session.commit()
    session.refresh(building)
    return building


# delete a building
@router.delete("/{building_id}")
def delete_building(building_id: str, session: Session = Depends(get_session), admin: User = Depends(admin_required)):
    building = session.get(Building, building_id)
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")

    session.delete(building)
    session.commit()
    return {"detail": f"Building {building.name} was deleted."}