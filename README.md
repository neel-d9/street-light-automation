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
```bash
python3 -m venv .venv
```

**c. Install all dependencies:**
*   **On Linux/macOS:**
    ```bash
    # Activate the virtual environment
    source .venv/bin/activate

    # Install Python packages
    pip install -r requirements.txt

    # Install Node.js packages
    cd dashboard/frontend
    npm install
    ```
*   **On Windows (CMD/PowerShell):**
    ```bash
    # Activate the virtual environment
    .venv\Scripts\activate

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

**For Windows Powershell 7:**

```cmd
# Admin User
Invoke-RestMethod -Uri http://localhost:8000/create_user -Method Post -ContentType "application/json" -Body '{"username":"admin","password":"password","role":"admin"}'

# Standard User
Invoke-RestMethod -Uri http://localhost:8000/create_user -Method Post -ContentType "application/json" -Body '{"username":"user","password":"password","role":"user"}'

# Provider
Invoke-RestMethod -Uri http://localhost:8000/create_user -Method Post -ContentType "application/json" -Body '{"username":"provider","password":"password","role":"provider"}'
```

---

### Implemented Features

#### Backend (FastAPI)
*   **User Authentication:** Secure login for different roles (User, Admin).
*   **Database Management:** SQLite with SQLAlchemy ORM.
*   **Data Models:**
    *   `Users`: Manages user credentials and roles.
    *   `Streetlights`: Tracks the current status (`ON`/`OFF`) of each light.
    *   `Issues`: Manages user-submitted issues and requests, including status (`pending`, `seen`, `approved`, `rejected`) and override times.
    *   `Logs`: Records a timestamped history of every `ON`/`OFF` status change for each light.
*   **API Endpoints:**
    *   `POST /login`, `POST /create_user`: User management.
    *   `GET`, `POST /api/streetlights`: Register and view streetlights.
    *   `PATCH /api/streetlights/{id}`: Update a streetlight's current status.
    *   `POST /api/requests`: Allows users to submit issues or requests.
    *   `GET /api/admin/requests`: Allows admins to view all submissions.
    *   `PATCH /api/requests/{id}`: Allows admins to approve, reject, or mark issues as seen.
    *   `GET /api/users/{username}/requests`: Allows users to view the status of their own submissions.
    *   `POST`, `GET /api/logs`: Records and retrieves historical status logs.
    *   `GET /api/overrides/schedule`: Provides the automation script with a schedule of active, approved overrides.

#### Frontend (React + TypeScript)
*   **Role-Based Access:** The UI adapts based on whether a User or Admin is logged in.
*   **User Panel:**
    *   Form to submit new issues or requests for specific streetlights.
    *   A dedicated view to track the live status (`Pending`, `Approved`, `Rejected`) of their submissions.
*   **Admin Panel:**
    *   A comprehensive table displaying all user submissions.
    *   **Interactive Actions:**
        *   "Mark as Seen" button for general issues.
        *   "Approve" and "Reject" buttons for override requests.
    *   **Override Time Modal:** A pop-up modal allows the admin to set a start and end time for approved requests.
*   **Real-Time Updates:** Panels automatically refresh data after an action is performed.

---