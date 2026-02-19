#!/bin/bash
# ===============================
# Full project setup script (Kali-safe)
# Handles backend, Celery, Redis, and two NPM projects
# ===============================

set -e

# -------------------------------
# Step 0: Script root
# -------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 Script directory: $SCRIPT_DIR"

# -------------------------------
# Step 1: Sanity checks
# -------------------------------

command -v python3 >/dev/null || {
    echo "❌ python3 not found"
    exit 1
}

command -v npm >/dev/null || {
    echo "❌ npm not found"
    exit 1
}

# Ensure venv support exists
if ! python3 - <<EOF >/dev/null 2>&1
import venv
EOF
then
    echo "🔧 Installing python3-venv..."
    sudo apt update
    sudo apt install -y python3-venv
fi

# -------------------------------
# Step 2: Install Redis if missing
# -------------------------------

if ! command -v redis-server >/dev/null; then
    echo "🔧 Installing Redis..."
    sudo apt update
    sudo apt install -y redis-server
fi

sudo systemctl enable redis-server
sudo systemctl start redis-server
echo "✅ Redis is running"

# -------------------------------
# Step 3: Backend setup
# -------------------------------
BACKEND_DIR="$SCRIPT_DIR/backend"

if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ backend folder not found"
    exit 1
fi

cd "$BACKEND_DIR"

echo "=== Setting up Python environment ==="
# Recreate venv if missing
if [ ! -f "venv/bin/python" ]; then
    echo "🧹 Creating virtual environment..."
    rm -rf venv
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate
echo "✅ Virtual environment active: $(python --version)"

# -------------------------------
# Step 4: Install backend dependencies
# -------------------------------
if [ ! -f "requirements.txt" ]; then
    echo "❌ requirements.txt not found"
    exit 1
fi

echo "📦 Installing backend dependencies..."
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r requirements.txt

# -------------------------------
# Step 5: Run backend server
# -------------------------------
echo "🚀 Starting backend server..."
nohup python -m uvicorn main:app \
    --reload \
    --host 0.0.0.0 \
    --port 8000 \
    > backend.log 2>&1 &

BACKEND_PID=$!
echo "✅ Backend running (PID: $BACKEND_PID)"

# -------------------------------
# Step 6: Start Celery worker + beat
# -------------------------------
echo "🚀 Starting Celery worker with beat..."
nohup celery -A celery_app.celery worker \
    --beat \
    --loglevel=info \
    > celery.log 2>&1 &

CELERY_PID=$!
echo "✅ Celery running (PID: $CELERY_PID)"

# -------------------------------
# Step 7: NPM projects
# -------------------------------
start_npm_project() {
    local project_dir="$SCRIPT_DIR/$1"
    if [ -d "$project_dir" ]; then
        cd "$project_dir"
        echo "📦 Installing NPM dependencies in $project_dir..."
        npm install
        echo "🚀 Starting dev server for $project_dir..."
        nohup npm run dev > "${project_dir//\//_}.log" 2>&1 &
        NPM_PID=$!
        echo "✅ $project_dir running (PID: $NPM_PID)"
    else
        echo "❌ Directory $project_dir not found, skipping."
    fi
}

start_npm_project "task-dispatch-pro"
start_npm_project "worker-insight-hub"

# -------------------------------
# Step 8: Post-start tasks
# -------------------------------
echo "⏳ Waiting 40 seconds for backend to initialize..."
sleep 40

if [ -f "$BACKEND_DIR/seed_admin.py" ]; then
    echo "🌱 Seeding admin user..."
    python "$BACKEND_DIR/seed_admin.py"
else
    echo "⚠️ seed_admin.py not found, skipping."
fi

# -------------------------------
# Step 9: Summary
# -------------------------------
echo "🎉 Setup complete."
echo "Backend PID: $BACKEND_PID"
echo "Celery PID: $CELERY_PID"
echo "Frontend logs: task-dispatch-pro.log, worker-insight-hub.log"
