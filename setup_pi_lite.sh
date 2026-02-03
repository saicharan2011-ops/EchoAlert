#!/bin/bash
echo "🚀 Setting up Lightweight Pi Environment..."

# Update system
sudo apt-get update

# Install system dependencies for audio and opencv
sudo apt-get install -y libatlas-base-dev libportaudio2 libopenblas-dev python3-pyaudio

# Install Python TFLite Runtime (much smaller than full TensorFlow)
# For Pi 4/5 (64-bit)
pip3 install tflite-runtime --break-system-packages 2>/dev/null || \
pip3 install https://github.com/google-coral/pycoral/releases/download/v2.0.0/tflite_runtime-2.5.0.post1-cp39-cp39-linux_aarch64.whl --break-system-packages

# Install other dependencies (Limit numpy to <2 for TFLite compatibility)
pip3 install "numpy<2" sounddevice librosa requests scikit-learn opencv-python-headless flask --break-system-packages

# Also patch the venv if it exists, just in case
if [ -d ".venv" ]; then
    echo "🛠️ Patching .venv with compatible NumPy..."
    source .venv/bin/activate
    pip3 install "numpy<2"
    deactivate
fi

echo "✅ Optimization Complete! You can now run the new realtime_infer.py"
