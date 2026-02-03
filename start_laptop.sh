#!/bin/bash

# Determine absolute path to project root
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_ROOT"

# Activate venv explicitly
if [ -d ".venv" ]; then
    echo "🐍 Activating virtual environment..."
    source .venv/bin/activate
else
    echo "⚠️ .venv not found! Checking for global flask..."
fi

# Start Backend
echo "🔌 Starting Backend on Port 5050..."
if [ -f ".venv/bin/python" ]; then
    .venv/bin/python backend/server.py > backend.log 2>&1 &
else
    # Fallback to system python if venv python missing (unlikely if venv exists)
    python3 backend/server.py > backend.log 2>&1 &
fi
BACKEND_PID=$!

# Start Dashboard
echo "💻 Starting Dashboard..."
cd dashboard
npm run dev > ../dashboard.log 2>&1 &
DASHBOARD_PID=$!
cd ..

echo "✅ System Running!"
echo "Backend PID: $BACKEND_PID"
echo "Dashboard PID: $DASHBOARD_PID"
echo "logs availabe in backend.log and dashboard.log"
echo "Press 'q' to stop everything."

while true; do
    read -n 1 k <&1
    if [[ $k = q ]] ; then
        echo "🛑 Stopping..."
        kill $BACKEND_PID
        kill $DASHBOARD_PID
        pkill -f "vite"
        break
    fi
done
