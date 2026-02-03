import os
import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
from openpyxl import load_workbook

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
# Fix Path Mismatch: Ensure we use absolute path relative to project root
BASE_DIR = os.path.dirname(os.path.abspath(__file__)) # .../backend
PROJECT_ROOT = os.path.dirname(BASE_DIR) # .../cityhear
UPLOAD_FOLDER = os.path.join(PROJECT_ROOT, 'uploads')
EVENTS_LOG_FILE = os.path.join(PROJECT_ROOT, 'events_log.xlsx')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Global state for hardware status (in-memory)
hardware_status = {
    "mic_active": False,
    "camera_active": False,
    "last_update": None,
    "audio_level": 0
}

# Global state for recent events (for dashboard polling)
recent_events = []

def log_event_to_excel(event_data, video_filename):
    """
    Logs the event to an Excel file.
    Columns: S.NO, TIME, EMERGENCY TYPE, LOCATION LINK
    """
    file_exists = os.path.isfile(EVENTS_LOG_FILE)
    
    timestamp = event_data.get('timestamp', datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    emergency_type = event_data.get('type', 'Unknown')
    location_id = event_data.get('location_id', 'Unknown')
    
    # If coordinates are passed in event_data, use them, else search query
    if 'lat' in event_data and 'lng' in event_data:
        location_link = f"https://www.google.com/maps/search/?api=1&query={event_data['lat']},{event_data['lng']}"
    else:
        location_link = f"https://www.google.com/maps/search/?api=1&query={location_id}"

    new_row = {
        "TIME": timestamp,
        "EMERGENCY TYPE": emergency_type,
        "LOCATION LINK": location_link,
        "VIDEO FILE": video_filename # Added for reference
    }

    if not file_exists:
        df = pd.DataFrame([new_row])
        # Add S.NO
        df.insert(0, 'S.NO', 1)
        df.to_excel(EVENTS_LOG_FILE, index=False)
    else:
        # Load existing, append
        # efficient append using openpyxl directly is better for huge files, 
        # but pandas is easier for hackathon scale.
        try:
            df = pd.read_excel(EVENTS_LOG_FILE)
            # Add S.NO
            new_row['S.NO'] = len(df) + 1
            new_df = pd.DataFrame([new_row])
            df = pd.concat([df, new_df], ignore_index=True)
            df.to_excel(EVENTS_LOG_FILE, index=False)
        except Exception as e:
            print(f"Error logging to Excel: {e}")

@app.route('/api/status', methods=['POST'])
def update_status():
    """
    Receives hardware status from Pi.
    """
    data = request.json
    global hardware_status
    hardware_status.update({
        "mic_active": data.get('mic_active', False),
        "camera_active": data.get('camera_active', False),
        "last_update": datetime.datetime.now().isoformat(),
        "audio_level": data.get('audio_level', 0)
    })
    return jsonify({"status": "success", "received": hardware_status})

@app.route('/api/status', methods=['GET'])
def get_status():
    """
    Returns current hardware status to Dashboard.
    """
    return jsonify(hardware_status)

@app.route('/api/event', methods=['POST'])
def receive_event():
    """
    Receives emergency event + video file.
    """
    # 1. Parse Data
    event_type = request.form.get('type')
    location_id = request.form.get('location_id')
    timestamp = request.form.get('timestamp')
    confidence = request.form.get('confidence', 0.95)
    
    print(f"Received Event: {event_type} at {location_id} (Conf: {confidence})")

    # 2. Handle Video File
    video_filename = None
    if 'video' in request.files:
        video = request.files['video']
        if video.filename != '':
            # Secure filename or create a timestamped one
            safe_name = f"{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}_{event_type}.mp4"
            video_path = os.path.join(UPLOAD_FOLDER, safe_name)
            video.save(video_path)
            video_filename = safe_name
            print(f"Saved video to {video_path}")

    # Random offset for demo map
    import random
    base_lat, base_lng = 17.3850, 78.4867
    lat = base_lat + random.uniform(-0.01, 0.01)
    lng = base_lng + random.uniform(-0.01, 0.01)

    # 3. Log to Excel
    event_data = {
        'type': event_type,
        'location_id': location_id,
        'timestamp': timestamp,
        'lat': lat,
        'lng': lng
    }
    log_event_to_excel(event_data, video_filename)

    
    confidence = request.form.get('confidence', '90') # Default 90 if not sent    
    
    # Use exact coordinates for Google Maps Link
    map_link = f"https://www.google.com/maps/search/?api=1&query={lat},{lng}"

    # 4. Update In-Memory Recent Events (for Dashboard)
    # Add video URL for frontend to access
    event_record = {
        "id": len(recent_events) + 1,
        "type": event_type,
        "location": location_id,
        "timestamp": timestamp,
        "video_url": f"/uploads/{video_filename}" if video_filename else None,
        "map_link": map_link,
        "lat": lat,
        "lng": lng,
        "confidence": int(float(confidence) * 100) if '.' in str(confidence) else int(confidence)
    }
    recent_events.insert(0, event_record) # Prepend
    if len(recent_events) > 10: # Keep last 10
        recent_events.pop()

    return jsonify({"status": "success", "event_id": event_record["id"]})

@app.route('/api/events', methods=['GET'])
def get_events():
    return jsonify(recent_events)

@app.route('/uploads/<path:filename>')
def serve_video(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == '__main__':
    # Host 0.0.0.0 is CRITICAL for Pi to access it
    # Change to :: to support both IPv6 and IPv4 (dual-stack)
    app.run(host='::', port=5050, debug=True)
