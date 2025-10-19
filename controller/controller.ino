
#include <Wire.h>
#include <BH1750.h>

// Initialize the BH1750 light sensor
BH1750 lightMeter;

// Define the pins for the PIR sensors and LEDs
const int pirPin1 = 2;
const int pirPin2 = 3;
const int ledPin1 = 9; // Corresponds to PIR1
const int ledPin2 = 10; // Corresponds to PIR2

void setup() {
  // Start serial communication at a 9600 baud rate
  Serial.begin(9600);

  // Initialize sensors and outputs
  Wire.begin();
  lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE_2, 0x5C);
  pinMode(pirPin1, INPUT);
  pinMode(pirPin2, INPUT);
  pinMode(ledPin1, OUTPUT);
  pinMode(ledPin2, OUTPUT);
}

void loop() {
  // === Read all sensor data ===
  float lux = lightMeter.readLightLevel();
  int pirState1 = digitalRead(pirPin1);
  int pirState2 = digitalRead(pirPin2);

  // === Send sensor data to Raspberry Pi ===
  // Format: timestamp,lux,pir1,pir2
  Serial.print(millis());
  Serial.print(",");
  Serial.print(lux);
  Serial.print(",");
  Serial.print(pirState1);
  Serial.print(",");
  Serial.println(0);//pirState2);

  // === Listen for a command from the Raspberry Pi ===
  if (Serial.available() > 0) {
    char command = Serial.read();
    controlLights(command);
  }

  // Wait for half a second before sending the next reading
  delay(500);
}

// Function to control the lights based on the received command
void controlLights(char cmd) {
  if (cmd == '0') { // OFF
    digitalWrite(ledPin1, LOW);
    digitalWrite(ledPin2, LOW);
  } else if (cmd == '1') { // DIM
    // Use analogWrite for a dim effect (e.g., 30% brightness)
    analogWrite(ledPin1, 75); 
    analogWrite(ledPin2, 75);
  } else if (cmd == '2') { // BRIGHT
    digitalWrite(ledPin1, HIGH);
    digitalWrite(ledPin2, HIGH);
  }
}
