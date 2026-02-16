import uuid
from typing import Optional
from pydantic import BaseModel
from models.complaints import ComplaintCategory, ComplaintStatus

# Request schema for creating a complaint
class ComplaintCreate(BaseModel):
    description: str
    category: ComplaintCategory
    location: Optional[str] = None

# Response schema
class ComplaintRead(BaseModel):
    id: uuid.UUID
    description: str
    category: ComplaintCategory
    status: ComplaintStatus
    evidence: Optional[str]  # path to file if uploaded

    class Config:
        from_attributes = True  # allows reading from ORM objects
