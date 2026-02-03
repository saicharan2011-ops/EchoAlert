# EchoAlert - Real-time Audio Emergency Detection System

EchoAlert is an advanced audio surveillance system designed to detect distress signals and dangerous events in real-time. Using Edge AI on Raspberry Pi, it classifies specific audio signatures (Gunshots, Screams, Explosions) and instantly alerts a centralized dashboard and mobile application.

## 🚀 Features

*   **Edge AI Detection:** Runs lightweight TFLite models (YAMNet) on Raspberry Pi for real-time inference.
*   **Instant Alerts:** Detects critical events:
    *   🔫 Gunfire
    *   🗣️ Screaming
    *   💥 Explosions/Glass Break
    *   🚨 Sirens
*   **Centralized Dashboard:** Real-time map visualization, event logs, and status monitoring.
*   **Mobile App:** Instant notification receiver for security personnel.
*   **Video Capture:** Automatically records and uploads a video clip when an event is triggered.
*   **Event Logging:** Automated Excel logging for record-keeping and analysis.

## 🛠️ Technology Stack

*   **Edge Device:** Raspberry Pi 4/5 (Python, TFLite Runtime, PyAudio)
*   **Backend:** Python Flask (API, Upload Management, Data Processing)
*   **Frontend (Dashboard):** React.js + Vite (Google Maps Integration, Recharts)
*   **Mobile App:** React Native + Expo (NativeWind, Maps)
*   **Data Storage:** Excel (Local Logging), In-memory State Management

## 📂 Project Structure

```
cityhear/
├── backend/            # Flask API Server
├── cityhear-mobile/    # React Native Expo App
├── dashboard/          # React Admin Dashboard
├── data/               # Model data and labeled audio samples
├── pi/                 # Raspberry Pi Logic (Audio Processing)
└── uploads/            # Stored video recordings of events
```

## ⚡ Quick Start (Laptop / Server)

This starts the Backend and the Dashboard simultaneously.

### Prerequisites
*   Python 3.9+
*   Node.js & npm

### Installation & Run
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/saicharan2011-ops/EchoAlert.git
    cd EchoAlert
    ```

2.  **Run the Startup Script**:
    The included script manages backend and frontend processes.
    ```bash
    ./start_laptop.sh
    ```
    *   This will activate the virtual environment (or use system python).
    *   Start Flask Backend at `http://localhost:5050`.
    *   Start Dashboard at `http://localhost:5173`.

3.  **Access the Dashboard**:
    Open your browser/mobile and navigate to the dashboard URL shown in the terminal.

## 🍓 Raspberry Pi Setup (Edge Deployment)

To deploy the audio detector on a Raspberry Pi:

1.  **Transfer files** to your Pi.
2.  **Run the Setup Script**:
    ```bash
    chmod +x setup_pi_lite.sh
    ./setup_pi_lite.sh
    ```
    This installs `tflite-runtime`, `pyaudio`, and other dependencies optimized for ARM.
3.  **Start the Detector**:
    ```bash
    python3 pi/realtime_infer.py
    ```

## 📱 Mobile App (Development)

1.  Navigate to the mobile directory:
    ```bash
    cd cityhear-mobile
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start Expo:
    ```bash
    npx expo start
    ```
4.  Scan the QR code with your phone (Expo Go app).

## 📄 License

This project is licensed under the MIT License.
