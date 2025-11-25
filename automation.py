import serial
import time
import joblib
import pandas as pd
import requests
from datetime import datetime

API_URL = "http://localhost:8001"

override_schedule = []
active_overrides = set()
last_schedule_check = 0
SCHEDULE_CHECK_INTERVAL = 30

model_file = "street_light_model.joblib"
try:
    luminosity_model = joblib.load(f'models/{model_file}')
except FileNotFoundError:
    print(f"Error: Model file '{model_file}' not found in 'models/' directory.")
    exit()

try:
    arduino = serial.Serial(port='/dev/ttyACM0', baudrate=115200, timeout=0.1)
    time.sleep(2)
    print("Connected to Arduino.")
except serial.SerialException:
    print("Error: Could not connect to Arduino. Check port and permissions.")
    exit()


def suggest_action(timestamp, live_lux, live_pir1, live_pir2, active_overrides):
    """
    Final decision function combining the ML model's context with live PIR data.
    """
    actions = []
    for i, live_pir in zip([1, 2], [live_pir1, live_pir2]):
        if i in active_overrides:
            actions.append('2')
        else:
            data = pd.DataFrame([(live_lux, timestamp)], columns=["ambience_lux", "seconds_of_day"])
            night_mode_active = luminosity_model.predict(data)[0]
            if night_mode_active == 0:
                actions.append('0')
            else:
                actions.append('2' if live_pir == 1 else '1')
    return f"{actions[0]},{actions[1]}"

def update_streetlight_status(light_id, status):
    """
    Update the status of a streetlight via the API.
    """
    try:
        response = requests.patch(f"{API_URL}/api/streetlights/{light_id}", json={"status": status})
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error updating streetlight {light_id}: {e}")

def log_status_change(light_id, status):
    """
    Log a status change event to the database via the API.
    """
    try:
        response = requests.post(f"{API_URL}/api/logs", json={"streetlight_id": light_id, "status": status, "timestamp": time.localtime()})
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error logging status for streetlight {light_id}: {e}")

def register_streetlights():
    """
    Register two streetlights if they don't already exist.
    """
    for i in range(1, 3):
        try:
            response = requests.post(f"{API_URL}/api/streetlights", json={"id": i, "status": "OFF"}) 
            if response.status_code == 200:
                print(f"Streetlight {i} registered successfully.")
            elif response.status_code == 400 and "Streetlight ID already registered" in response.text: 
                 print(f"Streetlight {i} is already registered.")
            else:
                response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"Could not register streetlight {i}: {e}")

print("Beginning operation. Press Ctrl+C to exit.")
register_streetlights()

last_status1 = "OFF"
last_status2 = "OFF"

while True:
    try:
        current_time = time.time()
        if current_time - last_schedule_check > SCHEDULE_CHECK_INTERVAL:
            try:
                response = requests.get(f"{API_URL}/api/overrides/schedule")
                response.raise_for_status()
                override_schedule = response.json()
                last_schedule_check = current_time
            except requests.exceptions.RequestException as e:
                print(f"Error fetching override schedule: {e}")

        now = datetime.now()
        active_overrides.clear()
        for override in override_schedule:
            start_time = datetime.fromisoformat(override['override_start_time'])
            end_time = datetime.fromisoformat(override['override_end_time'])
            print(start_time)
            print(end_time)
            if start_time <= now <= end_time:
                active_overrides.add(override['light_id'])

        if arduino.in_waiting > 0:
            line = arduino.readline().decode('utf-8').rstrip()
            parts = line.split(',')
            if len(parts) == 3:
                current_lux = float(parts[0])
                pir1_status = int(parts[1])
                pir2_status = int(parts[2])

                now = time.localtime()
                now_seconds = now.tm_hour * 3600 + now.tm_min * 60 + now.tm_sec
                action = suggest_action(now_seconds, current_lux, pir1_status, pir2_status, active_overrides)

                arduino.write(action.encode())

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

                print(f"{time.strftime('%H:%M:%S', now)} Lux: {current_lux}, PIRs: [{pir1_status},{pir2_status}], Action: {action}, Overrides: {active_overrides}")

    except (KeyboardInterrupt, SystemExit):
        print("\nExiting program.")
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
        time.sleep(2)