import uuid
from sqlmodel import SQLModel, Field
from datetime import datetime, timezone, timedelta

EAT = timezone(timedelta(hours=3))

class RefreshToken(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(index=True)
    token: str = Field(unique=True, index=True)
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(EAT))
    revoked: bool = Field(default=False)