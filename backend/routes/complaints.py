import uuid
import os
import aiofiles
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select
from core.database import get_session
from models.complaints import Complaint, ComplaintStatus, ComplaintCategory
from schemas.complaints import ComplaintRead

UPLOAD_DIR = "uploads/complaints"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(tags=["Complaints"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif"}

@router.post("/", response_model=ComplaintRead)
async def create_complaint(
    description: str = Form(...),
    category: ComplaintCategory = Form(...),
    file: UploadFile | None = File(None),
    session: Session = Depends(get_session),
):
    file_path: str | None = None

    if file:
        # Check type
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {file.content_type}. Only images are allowed.",
            )

        # Save file asynchronously
        try:
            file_ext = os.path.splitext(file.filename)[1]
            saved_filename = f"{uuid.uuid4()}{file_ext}"
            file_path = os.path.join(UPLOAD_DIR, saved_filename)

            import aiofiles
            async with aiofiles.open(file_path, "wb") as out_file:
                content = await file.read()
                await out_file.write(content)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    complaint = Complaint(
        description=description,
        category=category,
        evidence=file_path,
        status=ComplaintStatus.pending,
    )

    try:
        session.add(complaint)
        session.commit()
        session.refresh(complaint)
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return complaint

@router.get("/", response_model=List[ComplaintRead])
def list_complaints(session: Session = Depends(get_session)):
    """
    Retrieve all complaints.
    """
    complaints = session.exec(select(Complaint)).all()
    return complaints

@router.get("/{complaint_id}", response_model=ComplaintRead)
def get_complaint_by_id(
    complaint_id: str,
    session: Session = Depends(get_session),
):
    """
    Retrieve a complaint by its ID.
    """
    try:
        complaint_uuid = uuid.UUID(complaint_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")

    complaint = session.get(Complaint, complaint_uuid)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    return complaint