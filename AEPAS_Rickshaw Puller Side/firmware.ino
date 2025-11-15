/*
 * AERAS Rickshaw Onboard Unit Firmware
 * ESP32-based system for ride management in the AERAS competition
 * 
 * Features:
 * - GPS tracking with NEO-6M module
 * - OLED display for driver information
 * - Physical buttons for ride acceptance and confirmation
 * - MQTT/HTTP communication with backend
 * - Offline event buffering
 * - Points calculation and validation
 * - Persistent storage using NVS
 * - Complete FSM for ride workflow
 * 
 * Author: AERAS Team
 * Date: 2025
 * Version: 1.0.0
 */

#include "Config.h"
#include "GPSManager.h"
#include "CommManager.h"
#include "UIManager.h"
#include "FSMController.h"
#include "PointsManager.h"
#include "LocalStore.h"

// ============================================================================
// GLOBAL OBJECTS
// ============================================================================

GPSManager gpsManager;
CommManager commManager;
UIManager uiManager;
PointsManager pointsManager;
LocalStore localStore;
FSMController fsmController(gpsManager, commManager, uiManager, pointsManager, localStore);

// ============================================================================
// FUNCTION DECLARATIONS
// ============================================================================

void printSystemInfo();
void printRuntimeStatus();
void onMqttMessage(const char* topic, const char* payload);

// ============================================================================
// CALLBACK FUNCTIONS
// ============================================================================

/**
 * MQTT message callback
 * Handles incoming MQTT messages from the backend
 */
void onMqttMessage(const char* topic, const char* payload) {
    DEBUG_PRINTF("[MAIN] MQTT Message [%s]: %s\n", topic, payload);
    
    // Check if it's a ride notification
    if (strcmp(topic, MQTT_TOPIC_RIDE_NOTIFY) == 0) {
        fsmController.handleRideNotification(payload);
    }
}

// ============================================================================
// SETUP
// ============================================================================

void setup() {
    // Initialize serial for debugging
    #if DEBUG_SERIAL
    Serial.begin(SERIAL_BAUD_RATE);
    while (!Serial && millis() < 3000); // Wait up to 3 seconds for serial
    DEBUG_PRINTLN(F("\n\n"));
    DEBUG_PRINTLN(F("========================================"));
    DEBUG_PRINTLN(F("  AERAS Rickshaw Onboard Unit"));
    DEBUG_PRINTLN(F("  Firmware v1.0.0"));
    DEBUG_PRINTLN(F("========================================"));
    DEBUG_PRINTLN(F(""));
    #endif
    
    // Initialize random seed
    randomSeed(analogRead(0));
    
    // Initialize all modules
    DEBUG_PRINTLN(F("[MAIN] Initializing modules..."));
    
    // 1. Initialize Local Storage (NVS)
    localStore.begin();
    delay(100);
    
    // 2. Initialize GPS Manager
    gpsManager.begin();
    delay(100);
    
    // 3. Initialize UI Manager (OLED, buttons, LED, buzzer)
    uiManager.begin();
    delay(100);
    
    // Display initialization message
    uiManager.showMessage("Initializing...", 2000);
    
    // 4. Initialize Communication Manager (WiFi, MQTT)
    commManager.begin();
    commManager.setMessageCallback(onMqttMessage);
    
    // Connect to WiFi
    uiManager.showMessage("Connecting WiFi...", 1000);
    if (commManager.connectWiFi()) {
        uiManager.showMessage("WiFi Connected!", 1000);
    } else {
        uiManager.showMessage("WiFi Failed!", 2000);
    }
    
    // Connect to MQTT
    if (commManager.isWiFiConnected()) {
        uiManager.showMessage("Connecting MQTT...", 1000);
        if (commManager.connectMQTT()) {
            uiManager.showMessage("MQTT Connected!", 1000);
        } else {
            uiManager.showMessage("MQTT Failed!", 2000);
        }
    }
    
    // 5. Initialize FSM Controller
    fsmController.begin();
    delay(100);
    
    // Startup complete
    DEBUG_PRINTLN(F("[MAIN] All modules initialized"));
    DEBUG_PRINTLN(F("========================================\n"));
    
    // Print system information
    printSystemInfo();
    
    // Show ready screen
    uiManager.showMessage("System Ready!", 1000);
    uiManager.setLED(LED_SLOW_BLINK);
}

// ============================================================================
// MAIN LOOP
// ============================================================================

void loop() {
    static unsigned long lastGPSUpdate = 0;
    static unsigned long lastCommUpdate = 0;
    static unsigned long lastFSMUpdate = 0;
    static unsigned long lastUIUpdate = 0;
    static unsigned long lastStatusPublish = 0;
    static unsigned long lastStatusPrint = 0;  // For serial status printing
    
    unsigned long currentTime = millis();
    
    // Update GPS (every 3 seconds or as configured)
    if (currentTime - lastGPSUpdate >= GPS_UPDATE_INTERVAL) {
        gpsManager.update();
        lastGPSUpdate = currentTime;
    }
    
    // Update Communication Manager (handles reconnection and message processing)
    if (currentTime - lastCommUpdate >= 100) { // Check every 100ms
        commManager.update();
        lastCommUpdate = currentTime;
    }
    
    // Update FSM Controller (main state machine logic)
    if (currentTime - lastFSMUpdate >= 100) { // Check every 100ms
        fsmController.update();
        lastFSMUpdate = currentTime;
    }
    
    // Update UI Manager (LED patterns, buzzer, etc.)
    if (currentTime - lastUIUpdate >= 50) { // Check every 50ms
        uiManager.update();
        lastUIUpdate = currentTime;
    }
    
    // Handle button presses
    ButtonState button = uiManager.readButtons();
    switch (button) {
        case BTN_ACCEPT:
            DEBUG_PRINTLN(F("🔵 [BUTTON] ACCEPT pressed"));
            fsmController.handleAcceptButton();
            break;
        case BTN_REJECT:
            DEBUG_PRINTLN(F("🔴 [BUTTON] REJECT pressed"));
            fsmController.handleRejectButton();
            break;
        case BTN_PICKUP:
            DEBUG_PRINTLN(F("🟢 [BUTTON] PICKUP pressed"));
            fsmController.handlePickupButton();
            break;
        case BTN_DROP:
            DEBUG_PRINTLN(F("🟡 [BUTTON] DROP pressed"));
            fsmController.handleDropButton();
            break;
        default:
            break;
    }
    
    // Publish status/location periodically (heartbeat)
    if (currentTime - lastStatusPublish >= HEARTBEAT_INTERVAL) {
        if (commManager.isMQTTConnected() && gpsManager.isValid()) {
            GPSData gpsData = gpsManager.getCurrentLocation();
            commManager.publishStatus(
                String(stateToString(fsmController.getCurrentState())),
                gpsData.latitude,
                gpsData.longitude
            );
        }
        lastStatusPublish = currentTime;
    }
    
    // Print runtime status to Serial Monitor every 10 seconds
    if (currentTime - lastStatusPrint >= 10000) {
        printRuntimeStatus();
        lastStatusPrint = currentTime;
    }
    
    // Small delay to prevent watchdog issues
    delay(10);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Print system information to serial
 */
void printSystemInfo() {
    DEBUG_PRINTLN(F("=== System Information ==="));
    DEBUG_PRINTF("Device ID: %s\n", localStore.getDeviceId().c_str());
    DEBUG_PRINTF("Driver ID: %s\n", localStore.getDriverId().c_str());
    DEBUG_PRINTF("Total Points: %.2f\n", localStore.getTotalPoints());
    DEBUG_PRINTF("Ride Count: %u\n", localStore.getRideCount());
    DEBUG_PRINTLN(F(""));
    
    DEBUG_PRINTLN(F("=== Network Information ==="));
    if (commManager.isWiFiConnected()) {
        DEBUG_PRINTF("WiFi SSID: %s\n", WIFI_SSID);
        DEBUG_PRINTF("IP Address: %s\n", WiFi.localIP().toString().c_str());
        DEBUG_PRINTF("RSSI: %d dBm\n", WiFi.RSSI());
    } else {
        DEBUG_PRINTLN(F("WiFi: Not connected"));
    }
    
    if (commManager.isMQTTConnected()) {
        DEBUG_PRINTF("MQTT Broker: %s:%d\n", MQTT_BROKER, MQTT_PORT);
        DEBUG_PRINTLN(F("MQTT: Connected"));
    } else {
        DEBUG_PRINTLN(F("MQTT: Not connected"));
    }
    DEBUG_PRINTLN(F(""));
    
    DEBUG_PRINTLN(F("=== GPS Information ==="));
    if (gpsManager.isValid()) {
        GPSData gps = gpsManager.getCurrentLocation();
        DEBUG_PRINTF("Location: %.6f, %.6f\n", gps.latitude, gps.longitude);
        DEBUG_PRINTF("Satellites: %d\n", gps.satellites);
        DEBUG_PRINTF("HDOP: %.2f\n", gps.hdop);
        DEBUG_PRINTF("Speed: %.2f m/s\n", gps.speed);
    } else {
        DEBUG_PRINTLN(F("GPS: No fix"));
    }
    DEBUG_PRINTLN(F(""));
    
    DEBUG_PRINTLN(F("=== Pin Configuration ==="));
    DEBUG_PRINTF("GPS RX/TX: %d/%d\n", GPS_RX_PIN, GPS_TX_PIN);
    DEBUG_PRINTF("OLED I2C (SDA/SCL): %d/%d (Address: 0x%02X)\n", 
                 OLED_SDA_PIN, OLED_SCL_PIN, OLED_I2C_ADDRESS);
    DEBUG_PRINTF("Accept Button: %d\n", BTN_ACCEPT_PIN);
    DEBUG_PRINTF("Reject Button: %d\n", BTN_REJECT_PIN);
    DEBUG_PRINTF("Pickup Button: %d\n", BTN_PICKUP_PIN);
    DEBUG_PRINTF("Drop Button: %d\n", BTN_DROP_PIN);
    DEBUG_PRINTF("LED: %d\n", LED_STATUS_PIN);
    DEBUG_PRINTF("Buzzer: %d\n", BUZZER_PIN);
    DEBUG_PRINTLN(F(""));
    
    DEBUG_PRINTLN(F("=== MQTT Topics ==="));
    DEBUG_PRINTF("Subscribe: %s\n", MQTT_TOPIC_RIDE_NOTIFY);
    DEBUG_PRINTF("Publish Accept: %s\n", MQTT_TOPIC_RIDE_ACCEPT);
    DEBUG_PRINTF("Publish Reject: %s\n", MQTT_TOPIC_RIDE_REJECT);
    DEBUG_PRINTF("Publish Cancel: %s\n", MQTT_TOPIC_RIDE_CANCEL);
    DEBUG_PRINTF("Publish Pickup: %s\n", MQTT_TOPIC_PICKUP_CONF);
    DEBUG_PRINTF("Publish Drop: %s\n", MQTT_TOPIC_DROP_CONF);
    DEBUG_PRINTF("Publish Status: %s\n", MQTT_TOPIC_STATUS);
    DEBUG_PRINTLN(F(""));
    
    DEBUG_PRINTLN(F("=========================\n"));
}

/**
 * Print runtime status to Serial Monitor (called every 10 seconds)
 */
void printRuntimeStatus() {
    DEBUG_PRINTLN(F("\n╔════════════════════════════════════════════════════════════════╗"));
    DEBUG_PRINTLN(F("║              RUNTIME STATUS REPORT                             ║"));
    DEBUG_PRINTLN(F("╚════════════════════════════════════════════════════════════════╝"));
    
    // Uptime
    unsigned long uptime = millis() / 1000;
    DEBUG_PRINTF("⏱️  Uptime: %luh %02lum %02lus\n", 
                 uptime / 3600, (uptime % 3600) / 60, uptime % 60);
    DEBUG_PRINTLN(F(""));
    
    // FSM State
    SystemState currentState = fsmController.getCurrentState();
    DEBUG_PRINTF("🚦 FSM State: %s\n", stateToString(currentState));
    DEBUG_PRINTLN(F(""));
    
    // Network Status
    DEBUG_PRINTLN(F("🌐 Network Status:"));
    if (commManager.isWiFiConnected()) {
        DEBUG_PRINTF("   WiFi: ✅ Connected | RSSI: %d dBm | IP: %s\n", 
                     WiFi.RSSI(), WiFi.localIP().toString().c_str());
    } else {
        DEBUG_PRINTLN(F("   WiFi: ❌ Disconnected"));
    }
    
    if (commManager.isMQTTConnected()) {
        DEBUG_PRINTLN(F("   MQTT: ✅ Connected"));
    } else {
        DEBUG_PRINTLN(F("   MQTT: ❌ Disconnected"));
    }
    DEBUG_PRINTLN(F(""));
    
    // GPS Status
    DEBUG_PRINTLN(F("📡 GPS Status:"));
    if (gpsManager.isValid()) {
        GPSData gps = gpsManager.getCurrentLocation();
        DEBUG_PRINTF("   Status: ✅ Valid Fix\n");
        DEBUG_PRINTF("   Location: %.6f°N, %.6f°E\n", gps.latitude, gps.longitude);
        DEBUG_PRINTF("   Satellites: %d | HDOP: %.2f | Altitude: %.1fm\n", 
                     gps.satellites, gps.hdop, gps.altitude);
        DEBUG_PRINTF("   Speed: %.2f m/s (%.1f km/h) | Course: %.1f°\n", 
                     gps.speed, gps.speed * 3.6, gps.course);
        DEBUG_PRINTF("   Fix Age: %lu ms\n", gpsManager.getFixAge());
    } else {
        DEBUG_PRINTLN(F("   Status: ❌ No Fix"));
        DEBUG_PRINTF("   Satellites: %d (need %d minimum)\n", 
                     gpsManager.getSatellites(), GPS_MIN_SATELLITES);
    }
    DEBUG_PRINTLN(F(""));
    
    // Driver Stats
    DEBUG_PRINTLN(F("👤 Driver Stats:"));
    DEBUG_PRINTF("   Driver ID: %s\n", localStore.getDriverId().c_str());
    DEBUG_PRINTF("   Total Points: %.2f\n", localStore.getTotalPoints());
    DEBUG_PRINTF("   Completed Rides: %u\n", localStore.getRideCount());
    DEBUG_PRINTLN(F(""));
    
    // Memory Status
    DEBUG_PRINTLN(F("💾 Memory:"));
    DEBUG_PRINTF("   Free Heap: %u bytes (%.1f KB)\n", 
                 ESP.getFreeHeap(), ESP.getFreeHeap() / 1024.0);
    DEBUG_PRINTF("   Min Free Heap: %u bytes\n", ESP.getMinFreeHeap());
    DEBUG_PRINTLN(F(""));
    
    // Button Status (read current state)
    DEBUG_PRINTLN(F("🔘 Button States:"));
    DEBUG_PRINTF("   Accept:%s | Reject:%s | Pickup:%s | Drop:%s\n",
                 digitalRead(BTN_ACCEPT_PIN) ? "⚪" : "🔵",
                 digitalRead(BTN_REJECT_PIN) ? "⚪" : "🔵",
                 digitalRead(BTN_PICKUP_PIN) ? "⚪" : "🔵",
                 digitalRead(BTN_DROP_PIN) ? "⚪" : "🔵");
    DEBUG_PRINTLN(F(""));
    
    // Offline Queue Status
    if (commManager.hasBufferedEvents()) {
        DEBUG_PRINTLN(F("⚠️  WARNING: Offline events buffered (waiting for connection)"));
        DEBUG_PRINTLN(F(""));
    }
    
    DEBUG_PRINTLN(F("────────────────────────────────────────────────────────────────"));
    DEBUG_PRINTLN(F(""));
}

/**
 * Test functions for development (optional)
 * Uncomment and call in setup() for testing individual components
 */

/*
void testGPS() {
    DEBUG_PRINTLN(F("[TEST] Testing GPS module..."));
    
    unsigned long startTime = millis();
    while (millis() - startTime < 30000) { // Test for 30 seconds
        gpsManager.update();
        
        if (gpsManager.isValid()) {
            gpsManager.printDebugInfo();
            break;
        }
        
        delay(1000);
    }
    
    if (!gpsManager.isValid()) {
        DEBUG_PRINTLN(F("[TEST] GPS test failed - no fix obtained"));
    } else {
        DEBUG_PRINTLN(F("[TEST] GPS test passed"));
    }
}

void testUI() {
    DEBUG_PRINTLN(F("[TEST] Testing UI components..."));
    
    // Test LED patterns
    uiManager.setLED(LED_ON);
    delay(1000);
    uiManager.setLED(LED_SLOW_BLINK);
    delay(3000);
    uiManager.setLED(LED_FAST_BLINK);
    delay(3000);
    uiManager.setLED(LED_OFF);
    
    // Test buzzer
    uiManager.beepPattern(3, 200, 200);
    delay(1000);
    
    // Test display
    uiManager.showMessage("Test Message 1", 2000);
    uiManager.showMessage("Test Message 2", 2000);
    
    DEBUG_PRINTLN(F("[TEST] UI test complete"));
}

void testButtons() {
    DEBUG_PRINTLN(F("[TEST] Testing buttons - press each button..."));
    
    unsigned long startTime = millis();
    bool acceptPressed = false, rejectPressed = false, pickupPressed = false, dropPressed = false;
    
    while (millis() - startTime < 30000) { // Test for 30 seconds
        ButtonState btn = uiManager.readButtons();
        
        if (btn == BTN_ACCEPT && !acceptPressed) {
            DEBUG_PRINTLN(F("[TEST] Accept button OK"));
            acceptPressed = true;
        } else if (btn == BTN_REJECT && !rejectPressed) {
            DEBUG_PRINTLN(F("[TEST] Reject button OK"));
            rejectPressed = true;
        } else if (btn == BTN_PICKUP && !pickupPressed) {
            DEBUG_PRINTLN(F("[TEST] Pickup button OK"));
            pickupPressed = true;
        } else if (btn == BTN_DROP && !dropPressed) {
            DEBUG_PRINTLN(F("[TEST] Drop button OK"));
            dropPressed = true;
        }
        
        if (acceptPressed && rejectPressed && pickupPressed && dropPressed) {
            DEBUG_PRINTLN(F("[TEST] All buttons test passed"));
            break;
        }
        
        delay(100);
    }
}

void testDistanceCalculation() {
    DEBUG_PRINTLN(F("[TEST] Testing distance calculation..."));
    
    // Test with demo coordinates
    double dist1 = GPSManager::calculateDistance(
        DEMO_LOCATIONS[0].latitude, DEMO_LOCATIONS[0].longitude,
        DEMO_LOCATIONS[1].latitude, DEMO_LOCATIONS[1].longitude
    );
    
    DEBUG_PRINTF("[TEST] Distance CUET to Pahartoli: %.2f m\n", dist1);
    
    double dist2 = GPSManager::calculateDistance(
        DEMO_LOCATIONS[2].latitude, DEMO_LOCATIONS[2].longitude,
        DEMO_LOCATIONS[3].latitude, DEMO_LOCATIONS[3].longitude
    );
    
    DEBUG_PRINTF("[TEST] Distance Noapara to Raojan: %.2f m\n", dist2);
    
    DEBUG_PRINTLN(F("[TEST] Distance calculation test complete"));
}

void simulateRide() {
    DEBUG_PRINTLN(F("[TEST] Simulating a complete ride..."));
    
    // Create a test ride notification
    const char* testRide = R"({
        "ride_id": "TEST_RIDE_001",
        "pickup_address": "CUET Campus",
        "drop_address": "Pahartoli",
        "pickup_lat": 22.4633,
        "pickup_lon": 91.9714,
        "drop_lat": 22.4725,
        "drop_lon": 91.9845
    })";
    
    fsmController.handleRideNotification(testRide);
    
    DEBUG_PRINTLN(F("[TEST] Ride simulation started - use buttons to proceed"));
}
*/

