#!/bin/bash

# Configuration
PI_USER="pi"
PI_HOST="cityhear-pi.local"
PI_DIR="/home/pi/cityhear"

# Ensure we are in the project root (where this script is likely located)
cd "$(dirname "$0")"

echo "🚀 Deploying fixes to Raspberry Pi ($PI_HOST)..."

# --- AUTO-UPDATE IP ADDRESS ---
echo "🌐 Detecting Laptop IP..."
# Try en0 (Wi-Fi) first
CURRENT_IP=$(ipconfig getifaddr en0)

if [ -z "$CURRENT_IP" ]; then
    echo "⚠️  Could not detect IP on en0 (Wi-Fi). Checking en1..."
    CURRENT_IP=$(ipconfig getifaddr en1)
fi

if [ -z "$CURRENT_IP" ]; then
    echo "❌ Could not detect Laptop IP! Please check your connection."
    echo "   (You might need to update pi_files/config.py manually)"
else
    echo "✅ Detected IP: $CURRENT_IP"
    echo "✏️  Updating pi_files/config.py..."
    
    # Create the config content
    cat > pi_files/config.py <<EOF
# CONFIGURATION for CityHear Pi
# Auto-updated by deploy script
LAPTOP_IP = "$CURRENT_IP" 
LAPTOP_PORT = 5050
EOF
fi
# -----------------------------

# 1. Copy files
echo "📦 Copying files..."
scp pi_files/realtime_infer.py $PI_USER@$PI_HOST:$PI_DIR/realtime_infer.py
scp pi_files/config.py $PI_USER@$PI_HOST:$PI_DIR/config.py
scp pi/camera_service.py $PI_USER@$PI_HOST:$PI_DIR/camera_service.py
scp yamnet.tflite $PI_USER@$PI_HOST:$PI_DIR/yamnet.tflite
scp setup_pi_lite.sh $PI_USER@$PI_HOST:$PI_DIR/setup_pi_lite.sh

# 2. Restart services
echo "🔄 Restarting services on Pi..."
ssh $PI_USER@$PI_HOST "cd $PI_DIR && \
    pkill -f realtime_infer.py; \
    pkill -f camera_service.py; \
    # Using global python since setup_pi_lite.sh installed there
    nohup python3 camera_service.py > camera.log 2>&1 & \
    nohup python3 realtime_infer.py > audio.log 2>&1 & \
    echo 'Services restarted'"

echo "✅ Deployment Complete! The Pi is now running the optimized code."
