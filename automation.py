import serial
import time
import joblib
import pandas as pd
import requests
from datetime import datetime, timezone

# API base URL
API_URL = "http://localhost:8000/api"

# --- Global variables for override management ---
override_schedule = []
active_overrides = set()
last_schedule_check = 0
SCHEDULE_CHECK_INTERVAL = 900  # 15 minutes



# Load the model trained on luminosity data.
model_file = "street_light_model.joblib"
try:
    luminosity_model = joblib.load(f'models/{model_file}')
except FileNotFoundError:
    print(f"Error: Model file '{model_file}' not found in 'models/' directory.")
    exit()

# Set up the serial connection to the Arduino
try:
    arduino = serial.Serial(port='/dev/ttyACM0', baudrate=115200, timeout=0.1)
    time.sleep(2) # Wait for the connection to establish
    print("Connected to Arduino.")
except serial.SerialException:
    print("Error: Could not connect to Arduino. Check port and permissions.")
    exit()


def suggest_action(timestamp, live_lux, live_pir1, live_pir2, active_overrides):
    """
    Final decision function combining the ML model's context with live PIR data.
    """
    # Check for overrides first
    if 1 in active_overrides:
        led1_action = '2'  # BRIGHT
    else:
        # Normal logic
        data = pd.DataFrame([(live_lux, timestamp)], columns=["ambience_lux", "seconds_of_day"])
        night_mode_active = luminosity_model.predict(data)[0]
        if night_mode_active == 0:
            led1_action = '0'  # OFF
        else:
            if live_pir1 == 1:
                led1_action = '2'  # BRIGHT
            else:
                led1_action = '1'  # DIM

    if 2 in active_overrides:
        led2_action = '2'  # BRIGHT
    else:
        # Normal logic
        data = pd.DataFrame([(live_lux, timestamp)], columns=["ambience_lux", "seconds_of_day"])
        night_mode_active = luminosity_model.predict(data)[0]
        if night_mode_active == 0:
            led2_action = '0'  # OFF
        else:
            if live_pir2 == 1:
                led2_action = '2'  # BRIGHT
            else:
                led2_action = '1'  # DIM

    return f"{led1_action},{led2_action}"

def update_streetlight_status(light_id, status):
    """
    Update the status of a streetlight via the API.
    """
    try:
        response = requests.patch(f"{API_URL}/streetlights/{light_id}", json={"status": status})
        response.raise_for_status()  # Raise an exception for bad status codes
    except requests.exceptions.RequestException as e:
        print(f"Error updating streetlight {light_id}: {e}")

def log_status_change(light_id, status):
    """
    Log a status change event to the database via the API.
    """
    try:
        response = requests.post(f"{API_URL}/logs", json={"streetlight_id": light_id, "status": status})
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error logging status for streetlight {light_id}: {e}")

def register_streetlights():
    """
    Register two streetlights if they don't already exist.
    """
    for i in range(1, 3):
        try:
            # This is a simplified check. A real app might need a GET request first.
            response = requests.post(f"{API_URL}/streetlights", json={"name": f"Streetlight {i}", "status": "OFF"})
            if response.status_code == 200:
                print(f"Streetlight {i} registered successfully.")
            # The user creation endpoint returns 400 if user exists, assuming similar logic here
            elif response.status_code == 400 and "already registered" in response.text:
                 print(f"Streetlight {i} is already registered.")
            else:
                response.raise_for_status()
        except requests.exceptions.RequestException as e:
            # This will catch connection errors or if the light already exists (depending on API design)
            print(f"Could not register streetlight {i}: {e}")

# --- Main loop ---
print("Beginning operation. Press Ctrl+C to exit.")
register_streetlights()

# Initialize last known statuses
last_status1 = "OFF"
last_status2 = "OFF"

while True:
    try:
        # --- Override Management ---
        current_time = time.time()
        if current_time - last_schedule_check > SCHEDULE_CHECK_INTERVAL:
            try:
                response = requests.get(f"{API_URL}/overrides/schedule")
                response.raise_for_status()
                override_schedule = response.json()
                last_schedule_check = current_time
            except requests.exceptions.RequestException as e:
                print(f"Error fetching override schedule: {e}")

        # Update active overrides based on the schedule
        now_utc = datetime.now(timezone.utc)
        active_overrides.clear()
        for override in override_schedule:
            start_time = datetime.fromisoformat(override['override_start_time'].replace('Z', '+00:00'))
            end_time = datetime.fromisoformat(override['override_end_time'].replace('Z', '+00:00'))
            if start_time <= now_utc <= end_time:
                active_overrides.add(override['light_id'])

        # Check if there is data waiting from the Arduino
        if arduino.in_waiting > 0:
            # Read a line of data and decode it
            line = arduino.readline().decode('utf-8').rstrip()
            # Parse the data
            parts = line.split(',')
            if len(parts) == 3:
                current_lux = float(parts[0])
                pir1_status = int(parts[1])
                pir2_status = int(parts[2])

                # Decide the action
                now = time.localtime()
                now_seconds = now.tm_hour * 3600 + now.tm_min * 60 + now.tm_sec
                action = suggest_action(now_seconds, current_lux, pir1_status, pir2_status, active_overrides)
                
                # Send the action command to the Arduino
                arduino.write(action.encode())
                
                # Update status via API
                led1_action, led2_action = action.split(',')
                status1 = "ON" if led1_action in ['1', '2'] else "OFF"
                status2 = "ON" if led2_action in ['1', '2'] else "OFF"
                
                if status1 != last_status1:
                    update_streetlight_status(1, status1)
                    log_status_change(1, status1)
                    last_status1 = status1

                if status2 != last_status2:
                    update_streetlight_status(2, status2)
                    log_status_change(2, status2)
                    last_status2 = status2

                # Print status for debugging
                print(f"{time.strftime('%H:%M:%S', now)} Lux: {current_lux}, PIRs: [{pir1_status},{pir2_status}], Action: {action}, Overrides: {active_overrides}")

    except (KeyboardInterrupt, SystemExit):
        print("\nExiting program.")
        # Set lights to OFF on exit
        if last_status1 != "OFF":
            update_streetlight_status(1, "OFF")
            log_status_change(1, "OFF")
        if last_status2 != "OFF":
            update_streetlight_status(2, "OFF")
            log_status_change(2, "OFF")
        arduino.close()
        break
    except Exception as e:
        print(f"An error occurred: {e}")
        time.sleep(2) # Wait before retrying
