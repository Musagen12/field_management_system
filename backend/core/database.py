from typing import Annotated
from models import audit_log, complaints, task, user
from fastapi import Depends, FastAPI, HTTPException, Query
from sqlmodel import Field, Session, SQLModel, create_engine, select
from dotenv import load_dotenv
import os

load_dotenv()

db_username = os.getenv("DB_USERNAME")
db_password = os.getenv("DB_PASSWORD")
db_name = os.getenv("DB_NAME")

DB_URL = f"mysql+pymysql://{db_username}:{db_password}@localhost:3306/{db_name}"

engine = create_engine(DB_URL, echo=False)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]