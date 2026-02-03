# 🥧 Raspberry Pi Setup Instructions

## 1️⃣ Prepare the Pi
1.  **Transfer files**: Move the entire `pi_files` folder to your Raspberry Pi (e.g., `/home/pi/cityhear/`).
    ```bash
    scp -r pi_files pi@raspberrypi.local:/home/pi/cityhear/
    ```
2.  **Ensure Audio/Video Drivers**:
    -   Make sure your USB Webcam is plugged in.
    -   Make sure your USB Microphone is plugged in.

## 2️⃣ Network Configuration (CRITICAL)
1.  **Find your Laptop's IP**:
    -   Mac: `ipconfig getifaddr en0` (or check Settings > Network).
    -   Example: `192.168.1.50`
2.  **Update Config on Pi**:
    -   Open `config.py` on the Pi:
        ```bash
        nano config.py
        ```
    -   Change `LAPTOP_IP` to your Laptop's IP.
    -   Save (Ctrl+O, Enter, Ctrl+X).

## 3️⃣ Install Dependencies (On Pi)
```bash
pip install -r requirements.txt
```
*Note: Installing TensorFlow/OpenCV on Pi can sometimes be tricky. If `pip` fails, use system packages:*
```bash
sudo apt update
sudo apt install python3-opencv python3-flask python3-requests python3-pyaudio
```

## 4️⃣ Usage
### On Laptop (Start First)
Run the automated script in your project root:
```bash
./start_laptop.sh
```

### On Raspberry Pi
Run the automated startup script:
```bash
./start_pi.sh
```
*This will start both the Camera Service and the Audio Listener.*

---
**Troubleshooting**:
-   If Video doesn't play: Check if `ffmpeg` or codecs are installed on Pi.
-   If "Connection Refused": Double check `LAPTOP_IP` in `config.py`.
