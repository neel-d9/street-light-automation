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

## Setup for dashboard development

### 1. One-Time Setup

These commands only need to be run once when setting up the project on a new machine.

**a. Clone the repository (if you haven't already):**
```bash
git clone https://github.com/neel-d9/street-light-automation.git
cd street-light-automation
```

**b. Create a Python virtual environment:**
*   **On Linux/macOS:**
    ```bash
    python3 -m venv ~/venvs/iot-env
    ```
*   **On Windows (CMD/PowerShell):**
    ```bash
    python -m venv %USERPROFILE%\venvs\iot-env
    ```

**c. Install all dependencies:**
*   **On Linux/macOS:**
    ```bash
    # Activate the virtual environment
    source ~/venvs/iot-env/bin/activate

    # Install Python packages
    pip install -r requirements.txt

    # Install Node.js packages
    cd dashboard/frontend
    npm install
    ```
*   **On Windows (CMD/PowerShell):**
    ```bash
    # Activate the virtual environment
    %USERPROFILE%\venvs\iot-env\Scripts\activate

    # Install Python packages
    pip install -r requirements.txt

    # Install Node.js packages
    cd dashboard\frontend
    npm install
    ```

### 2. Running the Application

To run the application, you need to start both the backend and frontend servers in separate terminals.

**a. Start the Backend Server:**
*   Make sure your virtual environment is activated.
*   From the project's root directory:
    ```bash
    uvicorn dashboard.backend.main:app --host 0.0.0.0 --reload
    ```

**b. Start the Frontend Server:**
*   In a **new terminal**, navigate to the frontend directory:
    ```bash
    cd dashboard/frontend
    npm run dev
    ```

The application will be running at `http://localhost:5173`.

### 3. Creating Test Users

**For Linux, macOS, or Windows PowerShell:**
```bash
# Admin User
curl -X POST -H "Content-Type: application/json" -d '{"username": "admin", "password": "password", "role": "admin"}' http://localhost:8000/create_user

# Standard User
curl -X POST -H "Content-Type: application/json" -d '{"username": "user", "password": "password", "role": "user"}' http://localhost:8000/create_user

# Provider
curl -X POST -H "Content-Type: application/json" -d '{"username": "provider", "password": "password", "role": "provider"}' http://localhost:8000/create_user
```

**For Windows Command Prompt (CMD):**

```cmd
# Admin User
curl -X POST -H "Content-Type: application/json" -d "{\"username\": \"admin\", \"password\": \"password\", \"role\": \"admin\"}" http://localhost:8000/create_user

# Standard User
curl -X POST -H "Content-Type: application/json" -d "{\"username\": \"user\", \"password\": \"password\", \"role\": \"user\"}" http://localhost:8000/create_user

# Provider
curl -X POST -H "Content-Type: application/json" -d "{\"username\": \"provider\", \"password\": \"password\", \"role\": \"provider\"}" http://localhost:8000/create_user
```

---

### Implemented Features

#### Backend (FastAPI)
*   **Database:** SQLite managed with SQLAlchemy.
*   **Tables:**
    *   `Users`: Stores `id`, `username`, `password` (plaintext), and `role`.
    *   `Issues`: Stores `id`, `submitted_by_user`, `light_id`, `type`, `description`, and `status`.
*   **API Endpoints:**
    *   `POST /login`: Authenticates a user and returns their role.
    *   `POST /create_user`: A utility endpoint to easily create new users for testing.
    *   `POST /api/requests`: An endpoint for users to submit new issues or requests, which are saved with a "pending" status.
    *   `GET /api/admin/requests`: An endpoint for admins to retrieve a list of all issues and requests from the database.
*   **CORS:** Middleware is configured to allow requests from the frontend development server.

#### Frontend (React + TypeScript)
*   **UI Framework:** React with TypeScript, built using Vite.
*   **Styling:** A clean, modern look applied via CSS for forms, tables, buttons, and layout.
*   **Routing:** `react-router-dom` (`BrowserRouter`) manages navigation.
*   **Authentication & State Management:**
    *   `AuthContext` provides global state for the current user's role.
    *   Login state is persistent across page reloads using the browser's `localStorage`.
*   **Components:**
    *   `Header`: A persistent header displaying the app title, the logged-in user's role, and a "Logout" button.
    *   `Login`: A form to authenticate users against the backend.
    *   `UserPanel`: A dashboard for the "user" role with a form to submit new issues or requests.
    *   `AdminPanel`: A dashboard for the "admin" role that fetches and displays all submitted issues in a table.
    *   `ProviderPanel`: A placeholder dashboard for the "provider" role.