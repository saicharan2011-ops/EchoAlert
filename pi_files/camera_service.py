import cv2
import time
import os
import datetime
import threading
import requests
import numpy as np
from flask import Flask, request, jsonify

# IMPORT CONFIG
try:
    from config import LAPTOP_IP, LAPTOP_PORT
    # Fix for IPv6: Add brackets if missing
    if ":" in LAPTOP_IP and not LAPTOP_IP.startswith("["):
        LAPTOP_IP = f"[{LAPTOP_IP}]"
except ImportError:
    print("Config not found. Using defaults.")
    LAPTOP_IP = "localhost"
    LAPTOP_PORT = 5050

# CONFIG
LAPTOP_BACKEND_URL = f"http://{LAPTOP_IP}:{LAPTOP_PORT}/api/event"
BUFFER_DURATION = 3600  # 1 hour
CHUNK_DURATION = 1      # 1 second
TEMP_DIR = "video_buffer"
os.makedirs(TEMP_DIR, exist_ok=True)

app = Flask(__name__)

# Global buffer index: [(timestamp, filepath), ...]
video_buffer = []
buffer_lock = threading.Lock()

def cleanup_buffer():
    global video_buffer
    now = time.time()
    with buffer_lock:
        valid_buffer = []
        for ts, filepath in video_buffer:
            if now - ts < BUFFER_DURATION:
                valid_buffer.append((ts, filepath))
            else:
                try:
                    os.remove(filepath)
                except OSError:
                    pass
        video_buffer = valid_buffer

def record_camera():
    print("Camera Recording Started...")
    cap = cv2.VideoCapture(0)
    # Try high res if available
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    camera_working = cap.isOpened()
    if not camera_working:
        print("Camera not found! Using SIMULATION MODE (Frames).")

    while True:
        timestamp = time.time()
        filename = os.path.join(TEMP_DIR, f"{timestamp}.mp4")
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        # Standard Pi Webcam FPS is often variable, let's target 10 to match real performance
        out = cv2.VideoWriter(filename, fourcc, 10.0, (1280, 720))
        
        start_time = time.time()
        while time.time() - start_time < CHUNK_DURATION:
            if camera_working:
                ret, frame = cap.read()
                if ret:
                    out.write(frame)
                else:
                    # Fallback to black frame
                    frame = np.zeros((720, 1280, 3), dtype=np.uint8)
                    cv2.putText(frame, f"CAM ERROR {time.time()}", (50, 360), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                    out.write(frame)
            else:
                 # Simulation mode (if running on Pi without cam for tests)
                 frame = np.zeros((720, 1280, 3), dtype=np.uint8)
                 cv2.putText(frame, f"PI SIMULATION {time.time()}", (50, 360), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                 out.write(frame)
                 time.sleep(1/20)

        out.release()
        with buffer_lock:
            video_buffer.append((timestamp, filename))
        
        if len(video_buffer) % 10 == 0:
            cleanup_buffer()

def stitch_videos(trigger_time, pre_seconds=5, post_seconds=5):
    start_target = trigger_time - pre_seconds
    end_target = trigger_time + post_seconds
    selected_chunks = []
    
    with buffer_lock:
        sorted_buffer = sorted(video_buffer, key=lambda x: x[0])
        for ts, filepath in sorted_buffer:
            if (ts + CHUNK_DURATION) >= start_target and ts <= end_target:
                selected_chunks.append(filepath)
                
    if not selected_chunks: return None
        
    output_filename = f"event_{int(trigger_time)}.mp4"
    output_path = os.path.join(TEMP_DIR, output_filename)
    
    # Read first chunk props
    first_cap = cv2.VideoCapture(selected_chunks[0])
    w = int(first_cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 1280
    h = int(first_cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 720
    fps = first_cap.get(cv2.CAP_PROP_FPS) or 20.0
    first_cap.release()
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (w, h))
    
    for chunk_path in selected_chunks:
        cap = cv2.VideoCapture(chunk_path)
        while True:
            ret, frame = cap.read()
            if not ret: break
            out.write(frame)
        cap.release()
    out.release()
    return output_path

@app.route('/trigger', methods=['POST'])
def trigger_event():
    data = request.json
    event_type = data.get('type')
    timestamp = data.get('timestamp', time.time())
    location_id = data.get('location_id', 'Pi-Cam-1')
    
    print(f"EVENT TRIGGERED: {event_type}")
    
    def process_and_upload():
        time.sleep(5) 
        video_path = stitch_videos(timestamp, pre_seconds=5, post_seconds=5)
        
        if video_path and os.path.exists(video_path):
            print(f"Uploading {video_path} to {LAPTOP_BACKEND_URL}...")
            try:
                with open(video_path, 'rb') as f:
                    files = {'video': f}
                    data_payload = {
                        'type': event_type,
                        'location_id': location_id,
                        'timestamp': datetime.datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')
                    }
                    requests.post(LAPTOP_BACKEND_URL, data=data_payload, files=files, timeout=10)
                print("Upload success")
                os.remove(video_path)
            except Exception as e:
                print(f"Upload failed: {e}")
                # Removing failed upload file to save space? Or keep for retry? 
                # For hackathon, keep simple.
        else:
            print("Could not generate video")

    threading.Thread(target=process_and_upload).start()
    return jsonify({"status": "processing"})

if __name__ == '__main__':
    threading.Thread(target=record_camera, daemon=True).start()
    # Runs on Pi's port 5001 (Camera Service)
    app.run(host='0.0.0.0', port=5001)
