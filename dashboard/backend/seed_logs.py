import requests
import random
from datetime import datetime, timedelta

API_URL = "http://localhost:8001"

def register_streetlights():
    for i in [1, 2]:
        try:
            response = requests.post(
                f"{API_URL}/api/streetlights",
                json={"id": i, "status": "OFF"}
            )
            if response.status_code == 200:
                print(f"Streetlight {i} registered.")
            elif response.status_code == 400 and "already registered" in response.text:
                print(f"Streetlight {i} already registered.")
            else:
                print(f"Failed to register streetlight {i}: {response.text}")
        except Exception as e:
            print(f"Error registering streetlight {i}: {e}")

def generate_and_upload_logs():
    light_ids = [1, 2]

    end_time = datetime.now()
    start_time = end_time - timedelta(hours=48)

    current_time = start_time

    light_states = {
        1: {'status': 'OFF', 'patch_end': start_time},
        2: {'status': 'OFF', 'patch_end': start_time}
    }

    print(f"Starting data seeding from {start_time} to {end_time}...")

    while current_time <= end_time:
        hour = current_time.hour
        is_daytime = 6 <= hour < 18

        for light_id in light_ids:
            status = "OFF"

            if is_daytime:
                status = "OFF"
                light_states[light_id]['patch_end'] = current_time
            else:
                if current_time >= light_states[light_id]['patch_end']:
                    rand_val = random.random()
                    if rand_val < 0.4:
                        new_status = "DIM"
                    else:
                        new_status = "ON"

                    duration = random.randint(30, 150)
                    light_states[light_id]['status'] = new_status
                    light_states[light_id]['patch_end'] = current_time + timedelta(minutes=duration)

                status = light_states[light_id]['status']

            payload = {
                "streetlight_id": light_id,
                "status": status,
                "timestamp": current_time.isoformat(timespec='seconds')
            }

            try:
                response = requests.post(f"{API_URL}/api/logs", json=payload)
                if response.status_code == 200:
                    print(f"Logged: Light {light_id} | {status} | {current_time}")
                else:
                    print(f"Failed: {response.text}")
            except Exception as e:
                print(f"Connection Error: {e}")

        current_time += timedelta(minutes=15)

    print("Data seeding completed.")

if __name__ == "__main__":
    register_streetlights()
    generate_and_upload_logs()