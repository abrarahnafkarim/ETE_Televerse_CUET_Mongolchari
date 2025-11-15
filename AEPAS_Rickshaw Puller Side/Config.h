/*
 * Config.h
 * Configuration file for AERAS Rickshaw Onboard Unit
 * Contains all pin definitions, constants, and user-configurable settings
 */

#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// ============================================================================
// HARDWARE PIN DEFINITIONS (ESP32 WROOM)
// ============================================================================

// GPS Module (UART2) - NEO-8M
#define GPS_RX_PIN              16    // ESP32 RX <- GPS TX
#define GPS_TX_PIN              17    // ESP32 TX -> GPS RX
#define GPS_BAUD_RATE           9600  // NEO-8M default baud rate

// OLED Display (I2C - 0.96" 4-pin module)
#define OLED_SDA_PIN            21    // I2C Data
#define OLED_SCL_PIN            22    // I2C Clock
#define OLED_SCREEN_WIDTH       128
#define OLED_SCREEN_HEIGHT      64
#define OLED_I2C_ADDRESS        0x3C  // Common I2C address (try 0x3D if 0x3C fails)

// Physical Buttons (Active LOW with internal pull-up)
#define BTN_ACCEPT_PIN          25    // Accept ride button
#define BTN_REJECT_PIN          26    // Reject ride button
#define BTN_PICKUP_PIN          27    // Confirm pickup button
#define BTN_DROP_PIN            14    // Confirm drop button

// Status Indicators
#define LED_STATUS_PIN          2     // Built-in LED + external status LED
#define BUZZER_PIN              4     // Piezo buzzer for alerts

// Optional GSM Module (SIM900A) - UART1
#define GSM_RX_PIN              32    // ESP32 RX <- GSM TX
#define GSM_TX_PIN              33    // ESP32 TX -> GSM RX
#define GSM_BAUD_RATE           9600  // SIM900A default baud rate
#define GSM_ENABLED             false // Set to true to enable GSM fallback
#define GSM_PWR_PIN             13    // SIM900A power key pin (hold 1s to power on/off)

// ============================================================================
// NETWORK CONFIGURATION
// ============================================================================

// Wi-Fi Credentials
#define WIFI_SSID               "RM-105"
#define WIFI_PASSWORD           "@2302122@"
#define WIFI_TIMEOUT_MS         20000
#define WIFI_RECONNECT_INTERVAL 30000

// MQTT Configuration
#define MQTT_BROKER             "broker.hivemq.com"  // Replace with your broker
#define MQTT_PORT               1883
#define MQTT_USE_TLS            false
#define MQTT_USERNAME           ""
#define MQTT_PASSWORD           ""
#define MQTT_CLIENT_PREFIX      "AERAS_RU_"
#define MQTT_KEEPALIVE          60

// MQTT Topics
#define MQTT_TOPIC_RIDE_NOTIFY  "aeras/ride/notify"         // Subscribe: Incoming ride requests
#define MQTT_TOPIC_RIDE_ACCEPT  "aeras/ride/accept"         // Publish: Ride acceptance
#define MQTT_TOPIC_RIDE_REJECT  "aeras/ride/reject"         // Publish: Ride rejection
#define MQTT_TOPIC_RIDE_CANCEL  "aeras/ride/cancel"         // Publish: Driver cancellation
#define MQTT_TOPIC_PICKUP_CONF  "aeras/ride/pickup"         // Publish: Pickup confirmation
#define MQTT_TOPIC_DROP_CONF    "aeras/ride/drop"           // Publish: Drop confirmation
#define MQTT_TOPIC_STATUS       "aeras/device/status"       // Publish: Heartbeat/status
#define MQTT_TOPIC_LOCATION     "aeras/device/location"     // Publish: GPS location

// HTTP Fallback (if MQTT fails)
#define HTTP_ENABLED            true
#define HTTP_SERVER             "http://your-backend.com"
#define HTTP_ENDPOINT_ACCEPT    "/api/ride/accept"
#define HTTP_ENDPOINT_REJECT    "/api/ride/reject"
#define HTTP_ENDPOINT_PICKUP    "/api/ride/pickup"
#define HTTP_ENDPOINT_DROP      "/api/ride/drop"
#define HTTP_ENDPOINT_STATUS    "/api/device/status"

// ============================================================================
// DEVICE IDENTIFICATION & SECURITY
// ============================================================================

#define DRIVER_ID               "DRIVER_001"  // Unique driver identifier
#define DEVICE_ID               "RU_001"      // Rickshaw Unit ID
#define HMAC_KEY                "AERAS_SECRET_KEY_2025"  // Pre-shared key for HMAC
#define AUTH_TOKEN              "Bearer YOUR_JWT_TOKEN"  // Optional JWT token

// ============================================================================
// TIMING CONSTANTS (milliseconds)
// ============================================================================

#define HEARTBEAT_INTERVAL      30000   // 30 seconds
#define GPS_UPDATE_INTERVAL     3000    // 3 seconds
#define BUTTON_DEBOUNCE_MS      50      // Button debounce time
#define RIDE_TIMEOUT_MS         300000  // 5 minutes to accept ride
#define ACCEPT_TIMEOUT_MS       30000   // 30 seconds to accept ride
#define OFFLINE_RETRY_INITIAL   1000    // Initial retry delay
#define OFFLINE_RETRY_MAX       60000   // Max retry delay (exponential backoff)
#define EVENT_QUEUE_MAX         50      // Max buffered events

// ============================================================================
// GPS CONFIGURATION
// ============================================================================

#define GPS_FIX_TIMEOUT         60000   // 60 seconds to get first fix
#define GPS_MIN_SATELLITES      4       // Minimum satellites for valid fix
#define GPS_MOVING_AVG_SAMPLES  5       // Number of samples for moving average
#define GPS_ACCURACY_THRESHOLD  100.0   // meters - accuracy threshold for valid fix
#define GPS_UPDATE_MIN_INTERVAL 1000    // Minimum interval between GPS updates

// Distance thresholds (meters)
#define DISTANCE_PICKUP_AUTO    20.0    // Auto-confirm pickup within 20m
#define DISTANCE_PICKUP_MAX     50.0    // Max distance for pickup confirmation
#define DISTANCE_DROP_AUTO      50.0    // Auto-confirm drop within 50m
#define DISTANCE_ADMIN_REVIEW   100.0   // Distance error threshold for admin review

// ============================================================================
// POINTS CALCULATION
// ============================================================================

#define POINTS_BASE             10.0    // Base points for ride
#define POINTS_DIST_DIVISOR     10.0    // Distance penalty divisor (per 10m)
#define POINTS_MIN              0.0     // Minimum points (can't go negative)

// ============================================================================
// DEMO COORDINATES (CUET Area)
// ============================================================================

struct Location {
    double latitude;
    double longitude;
    const char* name;
};

const Location DEMO_LOCATIONS[] = {
    {22.4633, 91.9714, "CUET Campus"},
    {22.4725, 91.9845, "Pahartoli"},
    {22.4580, 91.9920, "Noapara"},
    {22.4520, 91.9650, "Raojan"}
};

const int DEMO_LOCATIONS_COUNT = sizeof(DEMO_LOCATIONS) / sizeof(DEMO_LOCATIONS[0]);

// ============================================================================
// NVS STORAGE KEYS
// ============================================================================

#define NVS_NAMESPACE           "aeras"
#define NVS_KEY_DRIVER_ID       "driver_id"
#define NVS_KEY_TOTAL_POINTS    "total_points"
#define NVS_KEY_RIDE_COUNT      "ride_count"
#define NVS_KEY_LAST_LAT        "last_lat"
#define NVS_KEY_LAST_LON        "last_lon"
#define NVS_KEY_DEVICE_ID       "device_id"

// ============================================================================
// DEBUGGING
// ============================================================================

#define DEBUG_SERIAL            true
#define SERIAL_BAUD_RATE        115200

// Debug macros
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
// SYSTEM STATES (FSM)
// ============================================================================

enum SystemState {
    STATE_IDLE,                 // Waiting for ride notification
    STATE_NOTIFIED,             // Ride notification received, awaiting decision
    STATE_ACCEPTED,             // Ride accepted, preparing to go to pickup
    STATE_ENROUTE_TO_PICKUP,    // Traveling to pickup location
    STATE_ARRIVED_PICKUP,       // Arrived at pickup, awaiting confirmation
    STATE_RIDE_ACTIVE,          // Ride in progress (passenger onboard)
    STATE_ENROUTE_TO_DROP,      // Traveling to drop location
    STATE_COMPLETED,            // Ride completed, processing points
    STATE_OFFLINE_ERROR         // Network error, attempting reconnection
};

// Convert state to string for debugging
inline const char* stateToString(SystemState state) {
    switch(state) {
        case STATE_IDLE: return "IDLE";
        case STATE_NOTIFIED: return "NOTIFIED";
        case STATE_ACCEPTED: return "ACCEPTED";
        case STATE_ENROUTE_TO_PICKUP: return "ENROUTE_TO_PICKUP";
        case STATE_ARRIVED_PICKUP: return "ARRIVED_PICKUP";
        case STATE_RIDE_ACTIVE: return "RIDE_ACTIVE";
        case STATE_ENROUTE_TO_DROP: return "ENROUTE_TO_DROP";
        case STATE_COMPLETED: return "COMPLETED";
        case STATE_OFFLINE_ERROR: return "OFFLINE_ERROR";
        default: return "UNKNOWN";
    }
}

#endif // CONFIG_H

