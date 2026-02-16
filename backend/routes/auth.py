from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from uuid import UUID
from core.database import get_session
from models.user import User
from models.refresh_token import RefreshToken
from models.audit_log import AuditLog
from fastapi.security import OAuth2PasswordRequestForm
from typing import Optional
import uuid
from utils.security import (
    verify_password, create_access_token,
    create_refresh_token, decode_token,
    ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
)

router = APIRouter(tags=["Auth"])

# Schemas
class RefreshRequest(BaseModel):
    refresh_token: str

class RefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str

def log_action(session: Session, performed_by: uuid.UUID, action: str, details: Optional[str] = None):
    print(f"LOGGING: user={performed_by}, action={action}, details={details}")  # debug
    audit = AuditLog(
        action=action,
        details=details,
        user_id=performed_by,
        created_at=datetime.utcnow()
    )
    session.add(audit)
    session.commit()


# @router.post("/login", response_model=LoginResponse)
# def login(
#     form_data: OAuth2PasswordRequestForm = Depends(),
#     session: Session = Depends(get_session)
# ):
#     user = session.exec(select(User).where(User.username == form_data.username)).first()

#     if not user or not verify_password(form_data.password, user.password_hash):
#         raise HTTPException(status_code=401, detail="Invalid credentials")

#     # Generate tokens
#     token_data = {"user_id": str(user.id), "role": user.role.value}
#     access_token = create_access_token(token_data)
#     refresh_token = create_refresh_token(token_data)

#     # Save refresh token in DB
#     db_refresh = RefreshToken(
#         user_id=str(user.id),
#         token=refresh_token,
#         expires_at=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
#     )
#     session.add(db_refresh)
#     session.commit()

#     return {
#         "access_token": access_token,
#         "refresh_token": refresh_token,
#         "role": user.role.value
#     }


@router.post("/login", response_model=LoginResponse)
def login(
    request: LoginRequest,
    session: Session = Depends(get_session)
):
    user = session.exec(select(User).where(User.username == request.username)).first()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Generate tokens
    token_data = {"user_id": str(user.id), "role": user.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)  # keep same payload for consistency

    # Save refresh token in DB
    db_refresh = RefreshToken(
        user_id=str(user.id),
        token=refresh_token,
        expires_at=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    session.add(db_refresh)
    session.commit()

    log_action(
        session,
        performed_by=user.id,
        action="login",
        details=f"User '{user.username}' logged in"
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "role": user.role.value
    }

# Refresh
@router.post("/refresh", response_model=RefreshResponse)
def refresh(request: RefreshRequest, session: Session = Depends(get_session)):
    db_token = session.exec(
        select(RefreshToken).where(RefreshToken.token == request.refresh_token)
    ).first()

    if not db_token or db_token.revoked or db_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    try:
        user_id = UUID(db_token.user_id)  # only if your User.id is UUID
    except ValueError:
        user_id = db_token.user_id  # fallback if stored as string

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    token_data = {"user_id": str(user.id), "role": user.role.value}
    new_access_token = create_access_token(token_data)

    return {"access_token": new_access_token, "token_type": "bearer"}


# # Logout (invalidate refresh token)
# @router.post("/logout")
# def logout(request: RefreshRequest, session: Session = Depends(get_session)):
#     db_token = session.exec(
#         select(RefreshToken).where(RefreshToken.token == request.refresh_token)
#     ).first()

#     if db_token:
#         db_token.revoked = True
#         session.add(db_token)
#         session.commit()

#     return {"message": "Logged out successfully"}
