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
    # Fix for IPv6: Add brackets if missing (Same as realtime_infer.py)
    if ":" in LAPTOP_IP and not LAPTOP_IP.startswith("["):
        LAPTOP_IP = f"[{LAPTOP_IP}]"
except ImportError:
    print("Config not found. Using defaults.")
    LAPTOP_IP = "192.168.0.64"
    LAPTOP_PORT = 5050

# CONFIG
LAPTOP_BACKEND_URL = f"http://{LAPTOP_IP}:{LAPTOP_PORT}/api/event" 
BUFFER_DURATION = 3600  # 1 hour in seconds
CHUNK_DURATION = 1      # 1 second per chunk (easier to manage)
TEMP_DIR = "video_buffer"
os.makedirs(TEMP_DIR, exist_ok=True)

app = Flask(__name__)

# Global buffer index: [(timestamp, filepath), ...]
# We use a list to keep track of chunks
video_buffer = []
buffer_lock = threading.Lock()

MAX_BUFFER_FILES = 3600

def cleanup_buffer():
    """Removes old chunks to keep buffer size under limit."""
    global video_buffer
    # Cleanup based on count
    with buffer_lock:
        while len(video_buffer) > MAX_BUFFER_FILES:
            # Remove oldest
            try:
                ts, filepath = video_buffer.pop(0)
                if os.path.exists(filepath):
                    os.remove(filepath)
            except Exception as e:
                print(f"Error cleaning up file: {e}")
                pass

def record_camera():
    """Continuous recording loop."""
    print("📷 Camera Recording Started...")
    
    cap = cv2.VideoCapture(0)
    # Set resolution to 720p
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 30)
    
    camera_working = cap.isOpened()
    if not camera_working:
        print("⚠️ Camera not found! Using SIMULATION MODE (Black Frames).")

    while True:
        timestamp = time.time()
        filename = os.path.join(TEMP_DIR, f"{timestamp}.mp4")
        
        # Define codec and create VideoWriter object
        # Using 30 FPS to match standard webcam rate and avoid slow-mo
        try:
            fourcc = cv2.VideoWriter_fourcc(*'avc1')
            out = cv2.VideoWriter(filename, fourcc, 30.0, (640, 480))
        except:
             # Fallback
             fourcc = cv2.VideoWriter_fourcc(*'mp4v')
             out = cv2.VideoWriter(filename, fourcc, 30.0, (640, 480))
        
        start_time = time.time()
        # Record for CHUNK_DURATION
        while time.time() - start_time < CHUNK_DURATION:
            if camera_working:
                ret, frame = cap.read()
                if ret:
                    out.write(frame)
                else:
                    # Frame read failed, fallback to black
                    frame = np.zeros((480, 640, 3), dtype=np.uint8)
                    cv2.putText(frame, f"SIMULATION {time.time()}", (50, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                    out.write(frame)
            else:
                 # Simulation mode
                 frame = np.zeros((480, 640, 3), dtype=np.uint8)
                 cv2.putText(frame, f"SIMULATION {time.time()}", (50, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                 out.write(frame)
                 time.sleep(1/10) # Sim 10 FPS

        out.release()
        
        with buffer_lock:
            video_buffer.append((timestamp, filename))
            
        # Cleanup every 10 seconds effectively, but we can do it every chunk
        if len(video_buffer) % 10 == 0:
            cleanup_buffer()

def stitch_videos(trigger_time, pre_seconds=5, post_seconds=5):
    """
    Finds chunks covering [trigger_time - pre, trigger_time + post]
    and stitches them.
    Returns path to stitched video.
    """
    start_target = trigger_time - pre_seconds
    end_target = trigger_time + post_seconds
    
    selected_chunks = []
    
    with buffer_lock:
        # Sort just in case
        sorted_buffer = sorted(video_buffer, key=lambda x: x[0])
        
        for ts, filepath in sorted_buffer:
            # If chunk overlaps the target window + some margin
            # Each chunk is CHUNK_DURATION long.
            chunk_end = ts + CHUNK_DURATION
            if chunk_end >= start_target and ts <= end_target:
                selected_chunks.append(filepath)
                
    if not selected_chunks:
        return None
        
    # Stitching using cv2 (simple concatenation)
    output_filename = f"event_{int(trigger_time)}.mp4"
    output_path = os.path.join(TEMP_DIR, output_filename)
    
    # Read first chunk to get properties
    # Read first chunk to get properties
    first_cap = cv2.VideoCapture(selected_chunks[0])
    w = int(first_cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
    h = int(first_cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480
    fps = first_cap.get(cv2.CAP_PROP_FPS) or 30.0
    first_cap.release()
    
    fourcc = cv2.VideoWriter_fourcc(*'avc1')
    out = cv2.VideoWriter(output_path, fourcc, fps, (w, h))
    
    if not out.isOpened():
        # Fallback if avc1 fails to open
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (w, h))
    
    for chunk_path in selected_chunks:
        cap = cv2.VideoCapture(chunk_path)
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            out.write(frame)
        cap.release()
        
    out.release()
    
    # Verify file was created and has size
    if not os.path.exists(output_path) or os.path.getsize(output_path) < 1000:
        print(f"⚠️ Warning: Stitched video {output_filename} seems empty or failed.")
        
    return output_path

@app.route('/trigger', methods=['POST'])
def trigger_event():
    """
    Called by Audio Detection script.
    Payload: { "type": "gun", "timestamp": 1234567890, "location_id": "L1" }
    """
    data = request.json
    event_type = data.get('type')
    timestamp = data.get('timestamp', time.time())
    location_id = data.get('location_id', 'Unknown')
    
    print(f"🚨 EVENT TRIGGERED: {event_type}")
    
    # Wait a bit to ensure we have the 'post' checking footage
    # If we want 5 seconds after, we technically need to wait 5 seconds before processing?
    # Yes, we need to wait for the future frames to be recorded.
    
    def process_and_upload():
        time.sleep(4) # Wait slightly longer than post-buffer (3s needed, wait 4s)
        video_path = stitch_videos(timestamp, pre_seconds=3, post_seconds=3)
        
        if video_path and os.path.exists(video_path):
            print(f"Uploading {video_path} to backend...")
            try:
                with open(video_path, 'rb') as f:
                    files = {'video': f}
                    data_payload = {
                        'type': event_type,
                        'location_id': location_id,
                        'timestamp': datetime.datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')
                    }
                    # We need the user to configure the IP
                    backend_url = os.environ.get("BACKEND_URL", LAPTOP_BACKEND_URL)
                    requests.post(backend_url, data=data_payload, files=files)
                print("✅ Upload success")
                # Clean up stitched file
                os.remove(video_path)
            except Exception as e:
                print(f"❌ Upload failed: {e}")
        else:
            print("❌ Could not generate video")

    threading.Thread(target=process_and_upload).start()
    
    return jsonify({"status": "processing"})

if __name__ == '__main__':
    # Start recording in background thread
    threading.Thread(target=record_camera, daemon=True).start()
    # Start API
    app.run(host='0.0.0.0', port=5001)
