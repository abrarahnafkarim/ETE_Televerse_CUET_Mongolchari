/**
 * ============================================================================
 * LASER TRANSMITTER FIRMWARE v1.0
 * ============================================================================
 * 
 * Portable laser transmitter for secure verification at checkpoints.
 * Designed for ATTiny85 with safety features and low power consumption.
 * 
 * Author: Hardware/Firmware Engineering Team
 * Date: November 2025
 * MCU: ATTiny85 @ 8MHz internal
 * License: Proprietary - For authorized use only
 * 
 * SAFETY NOTICE:
 * This device operates a Class 2 laser diode (650nm, <1mW).
 * Automatic shutoff after 10 seconds continuous operation.
 * Do not modify safety parameters without authorization.
 * 
 * ============================================================================
 */

#include <Arduino.h>
#include <avr/sleep.h>
#include <avr/power.h>
#include <avr/wdt.h>

// ============================================================================
// PIN DEFINITIONS (ATTiny85)
// ============================================================================
#define LASER_PIN         PB0  // Physical pin 5 - Laser driver MOSFET gate
#define STATUS_LED_PIN    PB1  // Physical pin 6 - Status LED
#define BUTTON_PIN        PB2  // Physical pin 7 - Activation button (INPUT_PULLUP)
#define BATTERY_SENSE_PIN PB3  // Physical pin 2 - Battery voltage divider (ADC3)
#define CALIBRATE_PIN     PB4  // Physical pin 3 - Calibration jumper/button (INPUT_PULLUP)

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

// Timing parameters
#define DEFAULT_FREQUENCY_HZ      5      // Default modulation frequency
#define DEFAULT_PULSE_WIDTH_MS    100    // Pulse ON duration in milliseconds
#define SAFETY_MAX_TRANSMIT_MS    10000  // Maximum continuous transmit time (10 seconds)
#define BUTTON_DEBOUNCE_MS        50     // Button debounce delay
#define LOW_BATTERY_CHECK_MS      5000   // Check battery every 5 seconds when active
#define AUTO_SLEEP_TIMEOUT_MS     60000  // Sleep after 60 seconds of inactivity

// Safety limits (DO NOT EXCEED)
#define MAX_PWM_DUTY_PERCENT      50     // Maximum PWM duty cycle (50% for safety)
#define ABSOLUTE_MAX_ON_TIME_MS   15000  // Absolute hardware limit

// Battery monitoring
#define BATTERY_LOW_THRESHOLD     650    // ADC reading for low battery (~3.2V)
#define BATTERY_CRITICAL_THRESHOLD 600   // ADC reading for critical battery (~3.0V)

// Identity token (4-bit pattern for secure verification)
// Change this for each device/user
#define IDENTITY_TOKEN            0b1010 // Example: 4-bit pattern (can be 0-15)
#define TOKEN_BIT_DURATION_MS     200    // Duration of each bit transmission

// Calibration mode frequencies (Hz)
const uint16_t CALIBRATION_FREQUENCIES[] = {1, 2, 5, 10, 20};
#define NUM_CAL_FREQUENCIES       5

// ============================================================================
// GLOBAL STATE VARIABLES
// ============================================================================
enum DeviceState {
  STATE_IDLE,
  STATE_TRANSMITTING,
  STATE_IDENTITY_TX,
  STATE_LOCKED,
  STATE_LOW_BATTERY,
  STATE_CALIBRATION
};

volatile DeviceState currentState = STATE_IDLE;
volatile bool buttonPressed = false;
volatile unsigned long lastButtonPress = 0;
volatile unsigned long transmitStartTime = 0;
volatile unsigned long lastActivityTime = 0;

uint8_t calibrationIndex = 2; // Start at 5 Hz (default)
uint16_t currentFrequencyHz = DEFAULT_FREQUENCY_HZ;
uint16_t currentPulseWidthMs = DEFAULT_PULSE_WIDTH_MS;

// ============================================================================
// FUNCTION PROTOTYPES
// ============================================================================
void initializePins();
void enterSleepMode();
void checkBattery();
void blinkStatusLED(uint8_t count, uint16_t duration);
void transmitPulse();
void transmitIdentityToken();
bool isButtonPressed();
void handleButton();
void calibrationMode();
void safetyShutdown();
uint16_t readBatteryVoltage();

// ============================================================================
// SETUP
// ============================================================================
void setup() {
  // Disable watchdog timer
  wdt_disable();
  
  // Initialize pins
  initializePins();
  
  // Power reduction - disable unused peripherals
  power_adc_enable();  // We need ADC for battery monitoring
  power_timer1_enable(); // Timer for PWM
  power_usi_disable();   // Don't need USI
  
  // Startup indication - quick double blink
  blinkStatusLED(2, 100);
  
  // Check battery on startup
  checkBattery();
  
  lastActivityTime = millis();
}

// ============================================================================
// MAIN LOOP
// ============================================================================
void loop() {
  unsigned long currentTime = millis();
  
  // Handle state machine
  switch (currentState) {
    
    case STATE_IDLE:
      // Check for button press
      if (isButtonPressed()) {
        delay(BUTTON_DEBOUNCE_MS);
        if (isButtonPressed()) {
          
          // Check if calibration pin is active (grounded)
          if (digitalRead(CALIBRATE_PIN) == LOW) {
            currentState = STATE_CALIBRATION;
            calibrationMode();
            break;
          }
          
          // Check battery before starting transmission
          if (readBatteryVoltage() < BATTERY_CRITICAL_THRESHOLD) {
            currentState = STATE_LOW_BATTERY;
            break;
          }
          
          // Wait for button release to determine mode
          unsigned long pressStart = millis();
          while (isButtonPressed() && (millis() - pressStart) < 2000) {
            delay(10);
          }
          unsigned long pressDuration = millis() - pressStart;
          
          if (pressDuration >= 2000) {
            // Long press: Send identity token
            currentState = STATE_IDENTITY_TX;
          } else {
            // Short press: Normal transmission
            currentState = STATE_TRANSMITTING;
            transmitStartTime = millis();
          }
          
          lastActivityTime = millis();
        }
      }
      
      // Auto-sleep after inactivity
      if (currentTime - lastActivityTime > AUTO_SLEEP_TIMEOUT_MS) {
        enterSleepMode();
        lastActivityTime = millis(); // Reset after wake
      }
      break;
      
    case STATE_TRANSMITTING:
      // Safety check: maximum transmit time
      if (currentTime - transmitStartTime >= SAFETY_MAX_TRANSMIT_MS) {
        safetyShutdown();
        currentState = STATE_LOCKED;
        break;
      }
      
      // Transmit modulated pulses while button held
      if (isButtonPressed()) {
        transmitPulse();
        lastActivityTime = millis();
      } else {
        // Button released, return to idle
        digitalWrite(LASER_PIN, LOW);
        digitalWrite(STATUS_LED_PIN, LOW);
        currentState = STATE_IDLE;
      }
      
      // Periodic battery check during transmission
      static unsigned long lastBatteryCheck = 0;
      if (currentTime - lastBatteryCheck > LOW_BATTERY_CHECK_MS) {
        if (readBatteryVoltage() < BATTERY_LOW_THRESHOLD) {
          digitalWrite(LASER_PIN, LOW);
          currentState = STATE_LOW_BATTERY;
        }
        lastBatteryCheck = currentTime;
      }
      break;
      
    case STATE_IDENTITY_TX:
      transmitIdentityToken();
      currentState = STATE_IDLE;
      break;
      
    case STATE_LOCKED:
      // Device locked after safety timeout
      // Blink status LED rapidly
      blinkStatusLED(5, 50);
      
      // Wait for button release and re-press to unlock
      while (isButtonPressed()) {
        delay(10);
      }
      delay(500);
      
      // Wait for new button press to unlock
      unsigned long lockStart = millis();
      while (!isButtonPressed() && (millis() - lockStart < 5000)) {
        digitalWrite(STATUS_LED_PIN, !digitalRead(STATUS_LED_PIN));
        delay(200);
      }
      
      if (isButtonPressed()) {
        delay(BUTTON_DEBOUNCE_MS);
        while (isButtonPressed()) delay(10); // Wait for release
        blinkStatusLED(1, 200); // Unlocked indication
      }
      
      digitalWrite(STATUS_LED_PIN, LOW);
      currentState = STATE_IDLE;
      lastActivityTime = millis();
      break;
      
    case STATE_LOW_BATTERY:
      // Indicate low battery
      for (int i = 0; i < 10; i++) {
        digitalWrite(STATUS_LED_PIN, HIGH);
        delay(100);
        digitalWrite(STATUS_LED_PIN, LOW);
        delay(100);
      }
      
      // Re-check battery
      if (readBatteryVoltage() >= BATTERY_LOW_THRESHOLD) {
        currentState = STATE_IDLE;
      } else {
        // Still low, enter deep sleep
        enterSleepMode();
      }
      break;
      
    case STATE_CALIBRATION:
      // Return to idle (calibrationMode() handles the entire process)
      currentState = STATE_IDLE;
      break;
  }
  
  // Small delay to prevent excessive CPU usage
  delay(10);
}

// ============================================================================
// INITIALIZATION FUNCTIONS
// ============================================================================
void initializePins() {
  // Laser output (default OFF)
  pinMode(LASER_PIN, OUTPUT);
  digitalWrite(LASER_PIN, LOW);
  
  // Status LED
  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(STATUS_LED_PIN, LOW);
  
  // Button input with internal pullup
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  
  // Calibration pin with internal pullup
  pinMode(CALIBRATE_PIN, INPUT_PULLUP);
  
  // Battery sense (analog input)
  pinMode(BATTERY_SENSE_PIN, INPUT);
}

// ============================================================================
// POWER MANAGEMENT
// ============================================================================
void enterSleepMode() {
  // Turn off all outputs
  digitalWrite(LASER_PIN, LOW);
  digitalWrite(STATUS_LED_PIN, LOW);
  
  // Set sleep mode to power-down (lowest power consumption)
  set_sleep_mode(SLEEP_MODE_PWR_DOWN);
  sleep_enable();
  
  // Disable ADC before sleep
  power_adc_disable();
  
  // Sleep (will wake on button press via pin change interrupt)
  sleep_mode();
  
  // After wake up
  sleep_disable();
  power_adc_enable();
  
  // Debounce after wake
  delay(BUTTON_DEBOUNCE_MS);
}

// ============================================================================
// BATTERY MONITORING
// ============================================================================
uint16_t readBatteryVoltage() {
  // Use internal 1.1V reference for better accuracy
  analogReference(INTERNAL);
  delay(10); // Allow reference to stabilize
  
  // Read battery voltage through divider
  // Assuming voltage divider: 10kΩ + 10kΩ (Vbat/2 to ADC)
  // ADC reading = (Vbat/2) / 1.1V * 1023
  uint16_t adcValue = analogRead(BATTERY_SENSE_PIN);
  
  return adcValue;
}

void checkBattery() {
  uint16_t batteryReading = readBatteryVoltage();
  
  if (batteryReading < BATTERY_CRITICAL_THRESHOLD) {
    currentState = STATE_LOW_BATTERY;
  }
}

// ============================================================================
// LED FEEDBACK
// ============================================================================
void blinkStatusLED(uint8_t count, uint16_t duration) {
  for (uint8_t i = 0; i < count; i++) {
    digitalWrite(STATUS_LED_PIN, HIGH);
    delay(duration);
    digitalWrite(STATUS_LED_PIN, LOW);
    if (i < count - 1) {
      delay(duration);
    }
  }
}

// ============================================================================
// BUTTON HANDLING
// ============================================================================
bool isButtonPressed() {
  return (digitalRead(BUTTON_PIN) == LOW);
}

// ============================================================================
// LASER TRANSMISSION FUNCTIONS
// ============================================================================

/**
 * Transmit a single modulated pulse
 * Uses the configured frequency and pulse width
 */
void transmitPulse() {
  // Calculate timing
  uint16_t periodMs = 1000 / currentFrequencyHz;
  uint16_t onTimeMs = min(currentPulseWidthMs, periodMs);
  uint16_t offTimeMs = periodMs - onTimeMs;
  
  // Safety limit on duty cycle
  if (onTimeMs > (periodMs * MAX_PWM_DUTY_PERCENT / 100)) {
    onTimeMs = periodMs * MAX_PWM_DUTY_PERCENT / 100;
    offTimeMs = periodMs - onTimeMs;
  }
  
  // Transmit pulse
  digitalWrite(STATUS_LED_PIN, HIGH);
  digitalWrite(LASER_PIN, HIGH);
  delay(onTimeMs);
  
  digitalWrite(LASER_PIN, LOW);
  digitalWrite(STATUS_LED_PIN, LOW);
  delay(offTimeMs);
}

/**
 * Transmit 4-bit identity token as on-off pattern
 * Format: START (long pulse) + 4 data bits + STOP (long pulse)
 */
void transmitIdentityToken() {
  blinkStatusLED(3, 100); // Indicate identity transmission mode
  delay(500);
  
  // START bit (long pulse)
  digitalWrite(LASER_PIN, HIGH);
  digitalWrite(STATUS_LED_PIN, HIGH);
  delay(TOKEN_BIT_DURATION_MS * 2);
  digitalWrite(LASER_PIN, LOW);
  digitalWrite(STATUS_LED_PIN, LOW);
  delay(TOKEN_BIT_DURATION_MS);
  
  // Transmit 4 data bits (MSB first)
  for (int8_t bit = 3; bit >= 0; bit--) {
    bool bitValue = (IDENTITY_TOKEN >> bit) & 0x01;
    
    if (bitValue) {
      // Bit = 1: Laser ON for full duration
      digitalWrite(LASER_PIN, HIGH);
      digitalWrite(STATUS_LED_PIN, HIGH);
      delay(TOKEN_BIT_DURATION_MS);
    } else {
      // Bit = 0: Laser OFF for full duration
      digitalWrite(LASER_PIN, LOW);
      digitalWrite(STATUS_LED_PIN, LOW);
      delay(TOKEN_BIT_DURATION_MS);
    }
    
    // Inter-bit gap
    digitalWrite(LASER_PIN, LOW);
    digitalWrite(STATUS_LED_PIN, LOW);
    delay(TOKEN_BIT_DURATION_MS / 2);
  }
  
  // STOP bit (long pulse)
  digitalWrite(LASER_PIN, HIGH);
  digitalWrite(STATUS_LED_PIN, HIGH);
  delay(TOKEN_BIT_DURATION_MS * 2);
  digitalWrite(LASER_PIN, LOW);
  digitalWrite(STATUS_LED_PIN, LOW);
  
  delay(500);
  blinkStatusLED(1, 200); // Completion indication
}

// ============================================================================
// CALIBRATION MODE
// ============================================================================
void calibrationMode() {
  blinkStatusLED(5, 100); // Enter calibration mode indication
  
  // Cycle through frequencies on each button press
  bool inCalibration = true;
  unsigned long calStartTime = millis();
  
  while (inCalibration) {
    // Show current frequency by number of blinks
    blinkStatusLED(calibrationIndex + 1, 150);
    delay(500);
    
    // Transmit test pattern at current frequency
    currentFrequencyHz = CALIBRATION_FREQUENCIES[calibrationIndex];
    
    for (int i = 0; i < 10; i++) {
      transmitPulse();
      
      // Check for button press to change frequency
      if (isButtonPressed()) {
        delay(BUTTON_DEBOUNCE_MS);
        while (isButtonPressed()) delay(10); // Wait for release
        
        calibrationIndex = (calibrationIndex + 1) % NUM_CAL_FREQUENCIES;
        delay(500);
        break;
      }
    }
    
    // Check calibration pin - if released, exit calibration
    if (digitalRead(CALIBRATE_PIN) == HIGH) {
      inCalibration = false;
    }
    
    // Timeout after 30 seconds
    if (millis() - calStartTime > 30000) {
      inCalibration = false;
    }
  }
  
  // Save selected frequency as default
  currentFrequencyHz = CALIBRATION_FREQUENCIES[calibrationIndex];
  
  // Exit indication
  blinkStatusLED(3, 200);
}

// ============================================================================
// SAFETY FUNCTIONS
// ============================================================================
void safetyShutdown() {
  // Immediate laser shutdown
  digitalWrite(LASER_PIN, LOW);
  
  // Visual warning
  for (int i = 0; i < 10; i++) {
    digitalWrite(STATUS_LED_PIN, HIGH);
    delay(50);
    digitalWrite(STATUS_LED_PIN, LOW);
    delay(50);
  }
}

// ============================================================================
// END OF FIRMWARE
// ============================================================================

