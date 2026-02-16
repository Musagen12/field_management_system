#!/bin/bash
# ===============================
# Full project setup script (Kali-safe)
# ===============================

set -e

# -------------------------------
# Step 0: Sanity checks
# -------------------------------

command -v python3 >/dev/null || {
    echo "❌ python3 not found"
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
# Step 1: Backend setup
# -------------------------------

cd backend || {
    echo "❌ backend folder not found"
    exit 1
}

echo "=== Setting up Python environment ==="

# Recreate venv if broken
if [ ! -f "venv/bin/python" ]; then
    echo "🧹 Creating virtual environment..."
    rm -rf venv
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate
echo "✅ Virtual environment active: $(python --version)"

# -------------------------------
# Step 2: Install dependencies
# -------------------------------

if [ ! -f "requirements.txt" ]; then
    echo "❌ requirements.txt not found"
    exit 1
fi

echo "📦 Installing backend dependencies..."
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r requirements.txt

# -------------------------------
# Step 3: Run backend
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
# Step 4: Post-start tasks
# -------------------------------

echo "⏳ Waiting 40 seconds for backend to initialize..."
sleep 40

if [ -f "seed_admin.py" ]; then
    echo "🌱 Seeding admin user..."
    python seed_admin.py
else
    echo "⚠️ seed_admin.py not found, skipping."
fi

echo "🎉 Setup complete."
