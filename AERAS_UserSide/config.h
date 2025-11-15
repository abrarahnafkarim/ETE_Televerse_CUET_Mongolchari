/**
 * AERAS - Accessible E-Rickshaw Automation System
 * Configuration Header
 * ESP32 User-Side Location Block Unit
 * 
 * IOTrix Competition - Section A Implementation
 */

#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// ============================================================================
// HARDWARE PIN MAPPING
// ============================================================================

// Ultrasonic Sensor (HC-SR04 / URM06 compatible)
#define ULTRASONIC_TRIG_PIN     25
#define ULTRASONIC_ECHO_PIN     26

// Privilege Verification Sensor (Photodiode/Phototransistor)
#define PRIVILEGE_SENSOR_PIN    34  // Analog input (ADC1_CH6)

// Button Input
#define BUTTON_PIN              27
#define BUTTON_ACTIVE_LOW       true

// LED Indicators
#define LED_YELLOW_PIN          32  // Offer incoming
#define LED_RED_PIN             33  // Rejected/Timeout
#define LED_GREEN_PIN           14  // Accepted

// Buzzer Output
#define BUZZER_PIN              15

// OLED Display (I2C SSD1306)
#define OLED_SDA_PIN            21
#define OLED_SCL_PIN            22
#define OLED_WIDTH              128
#define OLED_HEIGHT             64
#define OLED_ADDRESS            0x3C

// ============================================================================
// TIMING CONSTANTS (milliseconds)
// ============================================================================

// Ultrasonic Detection
#define ULTRASONIC_SAMPLE_INTERVAL      100   // Sample every 100ms
#define ULTRASONIC_PRESENCE_TIME        3000  // 3 seconds continuous presence
#define ULTRASONIC_MAX_RANGE_CM         1000  // 10 meters
#define ULTRASONIC_MIN_RANGE_CM         50    // 0.5 meters
#define ULTRASONIC_ACCURACY_TOLERANCE   5     // ±5 cm

// Privilege Verification
#define PRIVILEGE_CHECK_DURATION        1000  // Max 1 second to verify
#define PRIVILEGE_TARGET_FREQUENCY      5.0   // 5 Hz target
#define PRIVILEGE_FREQ_TOLERANCE        0.5   // ±0.5 Hz
#define PRIVILEGE_MIN_PULSES            3     // Minimum pulses to verify
#define PRIVILEGE_SAMPLE_RATE           1000  // 1kHz sampling for edge detection
#define PRIVILEGE_THRESHOLD             2000  // ADC threshold for light detection
#define PRIVILEGE_DC_FILTER_ALPHA       0.9   // DC removal filter coefficient
#define PRIVILEGE_MAX_DISTANCE_CM       200   // 2 meters max

// Button Control
#define BUTTON_DEBOUNCE_MS              25    // 25ms debounce
#define BUTTON_DOUBLE_PRESS_LOCKOUT     2000  // 2 seconds
#define BUTTON_HOLD_TIMEOUT             5000  // 5 seconds max hold

// Backend Communication
#define OFFER_TIMEOUT_MS                60000 // 60 seconds
#define HEARTBEAT_INTERVAL_MS           30000 // 30 seconds
#define WIFI_RECONNECT_INTERVAL_MS      5000  // 5 seconds
#define MQTT_RECONNECT_BASE_MS          1000  // Exponential backoff base
#define MQTT_RECONNECT_MAX_MS           32000 // Max backoff
#define MESSAGE_RETRY_MAX_ATTEMPTS      5     // Max retry attempts

// Display Refresh
#define OLED_REFRESH_INTERVAL_MS        500   // Max 2 seconds, use 500ms for responsiveness

// ============================================================================
// LOCATION BLOCK CONFIGURATION
// ============================================================================

// Default Block ID (can be changed via serial config or NVS)
#define DEFAULT_BLOCK_ID        "CUET_CAMPUS"

// Available destination blocks (declaration only - defined in .ino file)
extern const char* AVAILABLE_DESTINATIONS[];
#define NUM_DESTINATIONS 4

// ============================================================================
// WIFI & MQTT CONFIGURATION
// ============================================================================

// WiFi Credentials (use your actual credentials)
#define WIFI_SSID               "RM-105"
#define WIFI_PASSWORD           "@2302122@"

// MQTT Broker Settings
#define MQTT_BROKER             "broker.hivemq.com"  // Or your broker
#define MQTT_PORT               1883
#define MQTT_CLIENT_ID_PREFIX   "aeras_user_"
#define MQTT_USERNAME           ""  // If required
#define MQTT_PASSWORD           ""  // If required

// MQTT Topics
#define MQTT_TOPIC_REQUEST      "aeras/ride/request"
#define MQTT_TOPIC_STATUS       "aeras/ride/status/"  // Append client_id
#define MQTT_TOPIC_HEARTBEAT    "aeras/heartbeat"

// ============================================================================
// NVS STORAGE KEYS
// ============================================================================

#define NVS_NAMESPACE           "aeras"
#define NVS_KEY_BLOCK_ID        "block_id"
#define NVS_KEY_DESTINATION     "destination"
#define NVS_KEY_STATE           "fsm_state"

// ============================================================================
// DEBUG CONFIGURATION
// ============================================================================

#define DEBUG_SERIAL            true   // Enabled for debugging
#define SERIAL_BAUD_RATE        115200

// Debug logging macro
#if DEBUG_SERIAL
  #define DEBUG_PRINT(x)        Serial.print(x)
  #define DEBUG_PRINTLN(x)      Serial.println(x)
  #define DEBUG_PRINTF(...)     Serial.printf(__VA_ARGS__)
#else
  #define DEBUG_PRINT(x)
  #define DEBUG_PRINTLN(x)
  #define DEBUG_PRINTF(...)
#endif

// ============================================================================
// ULTRASONIC FILTERING
// ============================================================================

#define ULTRASONIC_FILTER_SIZE  5  // Median of 5 samples

// ============================================================================
// BUZZER TONES
// ============================================================================

#define BUZZER_FREQ_CONFIRM     1000  // 1kHz
#define BUZZER_FREQ_ERROR       500   // 500Hz
#define BUZZER_FREQ_OFFER       1500  // 1.5kHz

#define BUZZER_DURATION_SHORT   100   // 100ms
#define BUZZER_DURATION_LONG    500   // 500ms

#endif // CONFIG_H

