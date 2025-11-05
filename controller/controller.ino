
#include <Wire.h>
#include <BH1750.h>

// Initialize the BH1750 light sensor
BH1750 lightMeter;

// Define the pins for the PIR sensors and LEDs
const int pirPin1 = 2;
const int pirPin2 = 3;
const int ledPin1 = 9; // Corresponds to PIR1
const int ledPin2 = 10; // Corresponds to PIR2

volatile int pir1Triggered = 0;
volatile int pir2Triggered = 0;
unsigned long lastLuxRead = 0;
const unsigned long luxInterval = 50;
unsigned long lastMotionTime = 0;
const unsigned long motionTimeout = 3000;

void pir1ISR() {
  pir1Triggered = 1;
  lastMotionTime = millis();
}

void pir2ISR() {
  pir2Triggered = 1;
  lastMotionTime = millis();
}

void setup() {
  // Start serial communication at a 115200 baud rate
  Serial.begin(115200);

  // Initialize sensors and outputs
  Wire.begin();
  lightMeter.begin(BH1750::CONTINUOUS_LOW_RES_MODE);
  pinMode(pirPin1, INPUT);
  pinMode(pirPin2, INPUT);
  pinMode(ledPin1, OUTPUT);
  pinMode(ledPin2, OUTPUT);

  attachInterrupt(digitalPinToInterrupt(pirPin1), pir1ISR, RISING);
  attachInterrupt(digitalPinToInterrupt(pirPin2), pir2ISR, RISING);
}

void loop() {
  // === Read all sensor data ===
  if (millis() - lastLuxRead >= luxInterval) {
    float lux = lightMeter.readLightLevel();
    int pirState1 = pir1Triggered;
    int pirState2 = pir2Triggered;

    // === Send sensor data to Raspberry Pi ===
    // Format: lux,pir1,pir2
    Serial.print(lux);
    Serial.print(",");
    Serial.print(pirState1);
    Serial.print(",");
    Serial.println(pirState2);

    // reset
    pir1Triggered = 0;
    pir2Triggered = 0;

    lastLuxRead = millis();
  }

  // === Listen for a command from the Raspberry Pi ===
  if (Serial.available() > 0) {
    char command = Serial.read();
    controlLights(command);
  }

  // Wait for half a second before sending the next reading
  delay(250);
}

// Function to control the lights based on the received command
void controlLights(char cmd) {
  if (cmd == '0') { // OFF
    digitalWrite(ledPin1, LOW);
    digitalWrite(ledPin2, LOW);
  }
  else if (cmd == '1') { // DIM
    // Check if motion timeout is active before dimming
    if (millis() - lastMotionTime < motionTimeout) {
      // Motion was recent, stay BRIGHT
      digitalWrite(ledPin1, HIGH);
      digitalWrite(ledPin2, HIGH);
    }
    else {
      // No recent motion, go to DIM
      analogWrite(ledPin1, 10);
      analogWrite(ledPin2, 10);
    }
  }
  else if (cmd == '2') { // BRIGHT
    digitalWrite(ledPin1, HIGH);
    digitalWrite(ledPin2, HIGH);
  }
}
