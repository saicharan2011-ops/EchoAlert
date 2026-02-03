#!/bin/bash

# Navigate to the directory where this script is located
cd "$(dirname "$0")"

echo "Starting CityHear Pi System..."
echo "Target Laptop: $(grep 'LAPTOP_IP' config.py)"

# Activate Virtual Env (assuming it exists in current dir or std location)
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Start Camera Service in Background
python3 camera_service.py > camera.log 2>&1 &
CAMERA_PID=$!
echo "Camera Service started (PID $CAMERA_PID)"

# Wait for Camera Service to initialize
sleep 5

# Start Audio Inference via venv python
# We force python from venv if active
python realtime_infer.py > audio.log 2>&1 &
AUDIO_PID=$!
echo "Audio Inference started (PID $AUDIO_PID)"

echo "System Running. Logs are in camera.log and audio.log"
echo "Press q to stop."

# Simple loop to keep script alive or wait for user input to kill
while true; do
    read -n 1 k <&1
    if [[ $k = q ]] ; then
        echo "Stopping..."
        kill $CAMERA_PID
        kill $AUDIO_PID
        break
    fi
done
