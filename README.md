# Smart Street Light Automation

This project aims to prevent street lights from wasting energy by staying on when there is no traffic or when the road is naturally lit. It uses a machine learning model to determine if it's day or night and leverages PIR sensors to detect motion, ensuring lights are only active when needed.

## Key Features

- **Energy Efficient:** Lights are turned off during the day and dimmed at night when no motion is detected.
- **Intelligent Control:** A logistic regression model running on a Raspberry Pi makes real-time decisions based on ambient light.
- **Motion-Activated:** Dual PIR sensors provide coverage for motion detection, turning lights to full brightness only when traffic is present.
- **Three Light Modes:**
  - **OFF:** During the day.
  - **DIM:** At night with no motion, providing minimal safe illumination.
  - **BRIGHT:** At night when motion is detected.

## Hardware

- **Host Computer:** Raspberry Pi
- **Microcontroller:** Arduino Uno/Nano
- **Light Sensor:** BH1750 Ambient Light Sensor
- **Motion Sensors:** 2x PIR Motion Sensors
- **Actuators:** 2x LEDs (representing street lights)

## Software & Installation

### 1. Arduino Setup

- Upload the code from `controller/controller.ino` to your Arduino.

### 2. Python Environment Setup

- Ensure you have Python 3 installed on your Raspberry Pi.
- Install the required Python libraries using the `requirements.txt` file:
  ```bash
  pip install -r requirements.txt
  ```

### 3. Model Training

The machine learning model was trained using a logistic regression classifier. The Jupyter Notebook used for training can be found in the repository.

## How to Run the System

1.  **Connect Hardware:** Wire the sensors and LEDs to the Arduino as defined in the `.ino` file. Connect the Arduino to your Raspberry Pi via USB.
2.  **Run the Python Script:** Execute the main automation script on your Raspberry Pi.
    ```bash
    python automation.py
    ```
    The script will now listen for sensor data from the Arduino and send back commands to control the lights.
