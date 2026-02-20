import uuid
from sqlmodel import SQLModel, Field, Column, Enum
import enum
from datetime import datetime, timezone, timedelta

EAT = timezone(timedelta(hours=3))

class UserStatus(str, enum.Enum):
    active = "active"
    under_investigation = "under_investigation"

class UserRole(str, enum.Enum):
    worker = "worker"
    admin = "admin"

class User(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    username: str = Field(index=True, unique=True)
    password_hash: str
    phone_number: str = Field(index=True, unique=True)
    role: UserRole = Field(default=UserRole.worker)
    status: UserStatus = Field(default=UserStatus.active)
    created_at: datetime = Field(default_factory=lambda: datetime.now(EAT))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(EAT))