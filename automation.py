import serial
import time
import joblib
import pandas as pd

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


def suggest_action(timestamp, live_lux, live_pir1, live_pir2):
    """
    Final decision function combining the ML model's context with live PIR data.
    """
    data = pd.DataFrame([(live_lux, timestamp)], columns=["ambience_lux", "seconds_of_day"])
    night_mode_active = luminosity_model.predict(data)[0]

    if night_mode_active == 0:
        led1_action = '0'  # OFF
        led2_action = '0'  # OFF
    else:
        if live_pir1 == 1:
            led1_action = '2'  # BRIGHT
        else:
            led1_action = '1'  # DIM

        if live_pir2 == 1:
            led2_action = '2'  # BRIGHT
        else:
            led2_action = '1'  # DIM

    return f"{led1_action},{led2_action}"

# --- Main loop ---
print("Beginning operation. Press Ctrl+C to exit.")
while True:
    try:
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
                action = suggest_action(now_seconds, current_lux, pir1_status, pir2_status)
                # Send the action command to the Arduino
                arduino.write(action.encode())
                # Print status for debugging
                print(f"{time.strftime('%H:%M:%S', now)} Lux: {current_lux}, PIRs: [{pir1_status},{pir2_status}], Suggested Light Level: {action}")

    except (KeyboardInterrupt, SystemExit):
        print("\nExiting program.")
        arduino.close()
        break
    except Exception as e:
        print(f"An error occurred: {e}")
        time.sleep(2) # Wait before retrying
