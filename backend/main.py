from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from core.database import create_db_and_tables
from contextlib import asynccontextmanager
from routes import complaints, auth, worker, admin, sms, task_template, analytics, facilities, buildings, duty_roster
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(title="Field Service Tracker", lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://localhost:5679",
        "http://localhost:5679",
        "https://localhost:6057", 
        "http://localhost:6057",
        "https://localhost:8080",
        "http://localhost:8080"
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path where images are stored
UPLOAD_DIR = "uploads"

# Make sure the folder exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Expose uploads directory at /uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.include_router(auth.router, prefix="/auth")
app.include_router(admin.router, prefix="/admin")
app.include_router(task_template.router, prefix="/task_template")
app.include_router(worker.router, prefix="/worker")
app.include_router(analytics.router, prefix="/analytics")
app.include_router(complaints.router, prefix="/complaints")
app.include_router(buildings.router, prefix="/buildings")
app.include_router(facilities.router, prefix="/facilities")
app.include_router(duty_roster.router, prefix="/duty_roster")
app.include_router(sms.router, prefix="/sms")

@app.get("/", tags=["Test"])
def root():
    return {"message": "Field Service Tracker API running"}
