import numpy as np
import sounddevice as sd
import librosa
import pickle
import os
import time
import requests
from sklearn.metrics.pairwise import cosine_similarity

# TFLite Runtime (Try importing the lightweight runtime first)
try:
    import tflite_runtime.interpreter as tflite
except ImportError:
    # Fallback to full TF if runtime not found (e.g. on Mac for testing)
    try:
        import tensorflow.lite as tflite
    except ImportError:
        print("❌ Error: TFLite not found. Please install tflite-runtime or tensorflow.")
        exit(1)

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

# ================= CONFIG =================
MIC_SAMPLE_RATE = 48000 # Back to 48k (Hardware supported)
MODEL_SAMPLE_RATE = 16000
WINDOW_SECONDS = 3.0
RMS_SILENCE_THRESHOLD = 0.01

MEMORY_FILE = "memory.pkl"
SIMILARITY_THRESHOLD = 0.85
EVENT_COOLDOWN = 3.0

LABELS = ["normal", "crash", "explosion", "gun", "scream"]
# =========================================

print("Loading YAMNet TFLite...")
# Load TFLite Model
try:
    interpreter = tflite.Interpreter(model_path="yamnet.tflite")
    # Resize input to match our 3s window (48000 samples @ 16k)
    # The default shape from conversion was [1] because of dynamic signature
    input_details = interpreter.get_input_details()
    interpreter.resize_tensor_input(input_details[0]['index'], [int(MODEL_SAMPLE_RATE * WINDOW_SECONDS)])
    interpreter.allocate_tensors()
    
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    print("Model loaded (Lite Mode)")
except Exception as e:
    print(f"❌ Failed to load yamnet.tflite: {e}")
    print("Make sure yamnet.tflite is in the same folder.")
    exit(1)

# ================= MEMORY =================
memory = []

if os.path.exists(MEMORY_FILE):
    with open(MEMORY_FILE, "rb") as f:
        raw_memory = pickle.load(f)

    # CLEAN OLD BAD ENTRIES
    for emb, lbl in raw_memory:
        if lbl is None:
            lbl = "normal"
        memory.append((emb, lbl))

    print(f"Loaded memory with {len(memory)} samples (cleaned)")
else:
    print("New empty memory")

# ================= UTILS =================
def rms_energy(audio):
    return np.sqrt(np.mean(audio ** 2))

def extract_embedding(audio_48k):
    # FAST DOWNSAMPLE: Slicing (taking every 3rd sample)
    # 48000 / 3 = 16000
    # This is much faster than librosa.resample() and good enough for detection
    audio_16k = audio_48k[::3]
    
    # Run TFLite Inference
    input_data = np.array(audio_16k, dtype=np.float32)
    
    interpreter.set_tensor(input_details[0]['index'], input_data)
    interpreter.invoke()
    
    # Get Embeddings
    embeddings = interpreter.get_tensor(output_details[0]['index'])
    
    # Average embeddings to get a single vector for the clip
    return np.mean(embeddings, axis=0)

def predict_from_memory(embedding):
    if not memory:
        return "normal", 0.0

    mem_embeddings = np.array([m[0] for m in memory])
    sims = cosine_similarity([embedding], mem_embeddings)[0]

    idx = np.argmax(sims)
    best_sim = sims[idx]
    label = memory[idx][1] or "normal"

    if best_sim >= SIMILARITY_THRESHOLD:
        return label, best_sim

    return "normal", best_sim

def save_memory():
    with open(MEMORY_FILE, "wb") as f:
        pickle.dump(memory, f)

# ================= STREAM =================
print("\nContinuous Mic Listening Started (Lite)")
print("Press CTRL+C to stop\n")

buffer = np.zeros(int(MIC_SAMPLE_RATE * WINDOW_SECONDS))
last_event_time = 0
last_embedding = None

try:
    BLOCK_SIZE = int(MIC_SAMPLE_RATE * 0.5)
    with sd.InputStream(
        device=None, 
        samplerate=MIC_SAMPLE_RATE,
        channels=1,
        blocksize=BLOCK_SIZE, 
    ) as stream:
        print("Listening...")

        while True:
            try:
                # Read 0.5 seconds of audio
                audio_chunk, overflowed = stream.read(BLOCK_SIZE)
                audio_chunk = audio_chunk.flatten()

                buffer = np.roll(buffer, -len(audio_chunk))
                buffer[-len(audio_chunk):] = audio_chunk

                current_energy = rms_energy(buffer)

                if current_energy < RMS_SILENCE_THRESHOLD:
                    continue

                if time.time() - last_event_time < EVENT_COOLDOWN:
                    continue

                # Run inference (Using TFLite!)
                embedding = extract_embedding(buffer)

                if last_embedding is not None:
                    # Fix: Handle empty embedding or dimension mismatch if any
                    try:
                        sim = cosine_similarity([embedding], [last_embedding])[0][0]
                        if sim > 0.95:
                            continue
                    except:
                        pass

                last_embedding = embedding

                pred_label, sim = predict_from_memory(embedding)
                pred_label = pred_label or "normal"

                if pred_label == 'normal': 
                    # Send heartbeat for Dashboard "Listening" status
                    try:
                         requests.post(f"http://{LAPTOP_IP}:{LAPTOP_PORT}/api/status", json={
                            "mic_active": True,
                            "camera_active": True,
                            "last_update": time.time(),
                            # Calculate dB: 20 * log10(energy) + calibration offset
                            "audio_level": max(0, float(20 * np.log10(current_energy + 1e-6) + 60)) 
                        }, timeout=0.2) 
                    except:
                        pass
                    
                    # DEBUG: Print status every now and then
                    print(f"Status: Normal | Energy: {current_energy:.4f}", end='\r')

                    # Update time even for normal to respect cooldown
                    last_event_time = time.time()

                else:
                    print("\nEVENT DETECTED (Lite)")
                    print(f"Prediction : {pred_label.upper()}")
                    print(f"Similarity : {sim:.2f}")

                    # AUTOMATED TRIGGER
                    try:
                        # 1. Trigger Local Camera Service
                        requests.post("http://localhost:5001/trigger", json={
                            "type": pred_label,
                            "timestamp": time.time(),
                            "location_id": "Pi-HQ"
                        }, timeout=1)
                        
                        # 2. Update Backend (Laptop) for status light
                        requests.post(f"http://{LAPTOP_IP}:{LAPTOP_PORT}/api/status", json={
                            "mic_active": True,
                            "camera_active": True, 
                        }, timeout=1)
                        
                    except Exception as e:
                        print(f"Trigger Failed: {e}")

                    print("Event Sent")
                    # Update time to start cooldown
                    last_event_time = time.time()
                
                time.sleep(0.1)

            except Exception as e:
                print(f"⚠️ Inference Loop Error: {e}")
                time.sleep(1.0) # Wait a bit before retrying to avoid spamming loop

except KeyboardInterrupt:
    print("\nStopped")
