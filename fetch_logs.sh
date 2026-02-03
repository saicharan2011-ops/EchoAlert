#!/bin/bash

# Configuration
PI_USER="pi"
PI_HOST="cityhear-pi.local"
REMOTE_DIR="~/cityhear"

echo "📥 Fetching logs from Raspberry Pi ($PI_HOST)..."

# Fetch camera.log
scp "${PI_USER}@${PI_HOST}:${REMOTE_DIR}/camera.log" ./pi_camera.log
if [ $? -eq 0 ]; then
    echo "✅ Successfully downloaded camera.log to ./pi_camera.log"
else
    echo "❌ Failed to fetch camera.log"
fi

# Fetch audio.log (optional, but good to have)
scp "${PI_USER}@${PI_HOST}:${REMOTE_DIR}/audio.log" ./pi_audio.log
if [ $? -eq 0 ]; then
    echo "✅ Successfully downloaded audio.log to ./pi_audio.log"
fi

echo "Done. Please check the content of pi_camera.log"
