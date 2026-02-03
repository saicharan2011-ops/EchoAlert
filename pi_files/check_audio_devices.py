import sounddevice as sd

print("Listing Audio Devices...")
print(sd.query_devices())

print("\nHost APIs:")
for i, api in enumerate(sd.query_hostapis()):
    if len(api['devices']) > 0:
        print(f"API {i}: {api['name']}")

print("\n TIP: Look for your USB Microphone in the list above.")
print("Note the number (index) at the start of the line (e.g., 1 or 2).")
