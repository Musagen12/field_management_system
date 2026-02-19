<div align="center">

# 🏗️ Field Worker Tracker

**A real-time field operations management system for monitoring, auditing, and analyzing field worker activities.**

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python_3.13+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Celery](https://img.shields.io/badge/Celery-37814A?style=for-the-badge&logo=celery&logoColor=white)](https://docs.celeryq.dev)

</div>

---

## 🚨 The Problem This Solves

Field operations teams have traditionally relied on **manual, paper-based checklists** to track worker tasks — like the washroom cleaning checklist shown below, used by Jubilant Cleaning Services Limited:

> *Cleaners manually fill in task completion times (e.g. "Flush toilets", "Mop floor", "Refill soap dispenser") across multiple rounds per day. Supervisors then physically inspect, sign off, and annotate issues — all on paper.*

This approach creates serious operational challenges:

- 📄 **No real-time visibility** — managers can't see task status without physically checking
- ❌ **Missed tasks go undetected** — gaps in the sheet are only caught during periodic supervisor rounds
- 🔍 **Accountability gaps** — handwritten entries are hard to verify, audit, or trace
- 📦 **No historical analytics** — paper records make it nearly impossible to spot trends or patterns
- 🔔 **Delayed notifications** — issues like missing supplies or incomplete tasks aren't flagged instantly

**Field Worker Tracker digitizes this entire workflow** — replacing paper checklists with a real-time web platform where tasks are dispatched, tracked, completed, and audited digitally, with instant SMS alerts and a full analytics dashboard.

---

## 📖 Overview

Field Worker Tracker is a full-stack platform built for field operations teams. It combines a robust FastAPI backend with two dedicated frontend dashboards, background task processing via Celery, and real-time SMS notifications powered by Africa's Talking.

### System Components

| Component | Description | Port |
|-----------|-------------|------|
| **Backend API** | FastAPI + SQLModel — auth, database, REST API | `8000` |
| **Celery Worker** | Background jobs, scheduling, notifications | — |
| **Task Dispatch Pro** | Frontend for task dispatch & management | `5679` |
| **Worker Insight Hub** | Frontend for analytics & worker insights | `6057` |

---

## ✨ Features

- 🔐 **JWT Authentication** — Secure login with access and refresh tokens
- 👤 **Admin Dashboard** — Auto-seeded admin account on first run
- 📬 **SMS Notifications** — Real-time alerts via Africa's Talking API
- ⚙️ **Background Jobs** — Redis-backed Celery with beat scheduler
- 📊 **Analytics Dashboard** — Worker performance insights and reporting
- 🗂️ **Structured Logging** — Per-service log files for easy debugging

---

## 🛠️ Requirements

- **OS:** Linux (Ubuntu / Kali recommended)
- **Python:** 3.13+
- **Node.js** + npm
- **Redis** server (auto-installed by setup script if missing)

---

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Musagen12/field-worker.git
cd field-worker
```

### 2. Configure Environment Variables

> ⚠️ **This step must be completed before running `run.sh`.**

Create the file `backend/.env`:

```env
# ── Africa's Talking ──────────────────────────────
AFRICASTALKING_USERNAME=sandbox
AFRICASTALKING_API_KEY=your_api_key_here
AFRICASTALKING_SENDER_ID=32578

# ── Admin Credentials ────────────────────────────
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_PHONE=+254700000001

# ── JWT / Auth ───────────────────────────────────
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
```

> Replace `your_api_key_here` and `your_secret_key_here` with your actual credentials.

### 3. Run the Setup Script

```bash
chmod +x run.sh
./run.sh
```

The script will automatically:

1. Create a Python virtual environment and install dependencies
2. Install and start Redis (if not already present)
3. Launch the backend server with Uvicorn
4. Start the Celery worker and beat scheduler
5. Seed the admin user into the database
6. Install dependencies and start both frontend projects

---

## 📁 Project Structure

```
field-worker/
├── backend/                  # FastAPI backend
│   ├── venv/                 # Python virtual environment
│   ├── main.py               # App entry point
│   ├── models/               # SQLModel database models
│   ├── routes/               # API route handlers
│   ├── celery_app.py         # Celery configuration
│   ├── seed_admin.py         # Admin user seeder
│   ├── database.db           # SQLite database (auto-created)
│   └── .env                  # Environment variables (you create this)
├── task-dispatch-pro/        # Task management frontend
├── worker-insight-hub/       # Analytics & insights frontend
├── run.sh                    # One-command setup script
└── README.md
```

---

## 🚀 Accessing the System

Once `run.sh` completes, the following services will be available:

| Service | URL |
|---------|-----|
| **Backend API** | http://localhost:8000 |
| **API Docs (Swagger)** | http://localhost:8000/docs |
| **Task Dispatch Pro** | http://localhost:5679 |
| **Worker Insight Hub** | http://localhost:6057 |

---

## 📋 Logs

All services write logs to dedicated files for easy troubleshooting:

| Service | Log File |
|---------|----------|
| Backend | `backend/backend.log` |
| Celery Worker | `backend/celery.log` |
| Task Dispatch Pro | `task-dispatch-pro/task-dispatch-pro.log` |
| Worker Insight Hub | `worker-insight-hub/worker-insight-hub.log` |

---

## 📝 Recommended Workflow

```bash
# 1. Set up your environment file
nano backend/.env

# 2. Run the full setup
chmod +x run.sh
./run.sh

# 3. Open your browser
# Task Management  → http://localhost:5679
# Worker Analytics → http://localhost:6057
# API Explorer     → http://localhost:8000/docs
```

---

## 💡 Notes

- The `backend/.env` file **must exist** before running `run.sh` — the script depends on it.
- The SQLite database (`database.db`) always lives inside `backend/` and is created automatically.
- Frontends are launched **last** intentionally, ensuring the backend and Celery are fully initialized first.
- Update your Africa's Talking credentials in `.env` to enable live SMS notifications. Use `sandbox` mode for testing.

---

<div align="center">

Made with ❤️ for field operations teams

</div>
