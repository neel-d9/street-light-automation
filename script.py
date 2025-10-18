
import serial
import time
import joblib
import pandas as pd

# --- Initialization ---
# Load the simple model you trained only on luminosity data.
try:
    luminosity_model = joblib.load('model/street_light_model.pkl')
except FileNotFoundError:
    print("Error: Model file 'street_light_model.pkl' not found.")
    exit()

# Set up the serial connection to the Arduino
# Note: The port name '/dev/ttyUSB0' might be different on your system.
# Common names are /dev/ttyACM0 or /dev/ttyUSB1.
try:
    arduino = serial.Serial(port='/dev/ttyACM0', baudrate=9600, timeout=1)
    time.sleep(2) # Wait for the connection to establish
    print("Connected to Arduino.")
except serial.SerialException:
    print("Error: Could not connect to Arduino. Check port and permissions.")
    exit()


def get_final_light_command(timestamp, live_lux, live_pir1, live_pir2):
    """
    Final decision function combining the ML model's context with live PIR data.
    """
    data = pd.DataFrame([(live_lux, timestamp)], columns=["ambience_lux", "seconds_of_day"])
    night_mode_active = luminosity_model.predict(data)
    print(night_mode_active)
    if night_mode_active==0:
        return '0' # OFF
    else:
        if live_pir1 == 1 or live_pir2 == 1:
            return '2' # BRIGHT
        else:
            return '1' # DIM

# --- Main Project Loop ---
print("Starting main control loop...")
while True:
    try:
        # Check if there is data waiting from the Arduino
        if arduino.in_waiting > 0:
            # Read a line of data and decode it

            line = arduino.readline().decode('utf-8').rstrip()
            # Parse the data
            parts = line.split(',')
            if len(parts) == 4:
                uptime_ms = int(parts[0])
                current_lux = float(parts[1])
                pir1_status = int(parts[2])
                pir2_status = int(parts[3])

                # Get the final command
                loctime = time.time() + uptime_ms / 1000.00
                final_command = get_final_light_command(loctime, current_lux, pir1_status, pir2_status)
                # Send the command character back to the Arduino
                arduino.write(final_command.encode())
                # Optional: Print the status for debugging
                print(f"Time: {time.strftime('%H:%M:%S', time.localtime(loctime))}, Lux: {current_lux}, PIRs: [{pir1_status},{pir2_status}], Suggested: {final_command}")

    except (KeyboardInterrupt, SystemExit):
        print("\nExiting program.")
        arduino.close()
        break
    except Exception as e:
        print(f"An error occurred: {e}")
        time.sleep(2) # Wait before retrying
