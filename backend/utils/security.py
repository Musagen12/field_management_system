# import uuid
# from passlib.context import CryptContext
# from datetime import datetime, timedelta
# from jose import JWTError, jwt
# from fastapi import Depends, HTTPException
# from fastapi.security import OAuth2PasswordBearer
# from sqlmodel import Session
# from core.database import get_session
# from models.user import User

# # Config
# SECRET_KEY = "xdXqTpxa1U1ms8vmuXgfQH1bfGecFsoSM8ozhEr6)mS02QgWwe91rP33ZPloQ"
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = 60
# REFRESH_TOKEN_EXPIRE_DAYS = 7

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# # Helper functions
# def hash_password(password: str) -> str:
#     return pwd_context.hash(password)

# def verify_password(plain_password: str, hashed_password: str) -> bool:
#     return pwd_context.verify(plain_password, hashed_password)

# def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
#     to_encode = data.copy()
#     expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
#     to_encode.update({"exp": expire})
#     return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# def create_refresh_token(data: dict, expires_delta: timedelta | None = None) -> str:
#     to_encode = data.copy()
#     expire = datetime.utcnow() + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
#     to_encode.update({"exp": expire, "type": "refresh"})
#     return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# def decode_access_token(token: str) -> dict | None:
#     try:
#         return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#     except JWTError:
#         return None

# # Dependencies
# def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)) -> User:
#     payload = decode_access_token(token)
#     if not payload:
#         raise HTTPException(status_code=401, detail="Invalid or expired token")
    
#     user_id_str = payload.get("user_id")
#     if not user_id_str:
#         raise HTTPException(status_code=401, detail="Invalid token payload")

#     try:
#         user_id = uuid.UUID(user_id_str)
#     except ValueError:
#         raise HTTPException(status_code=401, detail="Invalid user ID in token")

#     user = session.get(User, user_id)
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")

#     return user

# def admin_required(current_user: User = Depends(get_current_user)) -> User:
#     if current_user.role != "admin":
#         raise HTTPException(status_code=403, detail="Admin access required")
#     return current_user

import uuid
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session
from core.database import get_session
from models.user import User

# Config
SECRET_KEY = "xdXqTpxa1U1ms8vmuXgfQH1bfGecFsoSM8ozhEr6)mS02QgWwe91rP33ZPloQ"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# -------------------------
# Password helpers
# -------------------------
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# -------------------------
# JWT helpers
# -------------------------
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Create a short-lived access token (default 60 min).
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Create a long-lived refresh token (default 7 days).
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict | None:
    """
    Decode a JWT (works for both access & refresh tokens).
    """
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


# -------------------------
# Dependencies
# -------------------------
def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)) -> User:
    """
    Dependency to get the current user from an access token.
    """
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid or expired access token")
    
    user_id_str = payload.get("user_id")
    if not user_id_str:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid user ID in token")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


def admin_required(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency to restrict access to admin-only routes.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
