/*
 * AERAS ESP32 MQTT Client Example
 * 
 * This example demonstrates how to connect an ESP32 device (block) to the
 * AERAS MQTT broker and publish ride requests.
 * 
 * Requirements:
 * - WiFi connection
 * - MQTT broker with TLS support
 * - CA certificate for TLS verification
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <time.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Broker configuration
const char* mqtt_server = "mqtt.aeras.local";
const int mqtt_port = 8883;  // MQTTS port
const char* mqtt_username = "block_BLK-001";
const char* mqtt_password = "your_secure_password";
const char* client_id = "BLK-001";

// Topics
const char* topic_request = "aeras/block/BLK-001/request";
const char* topic_status = "aeras/block/BLK-001/status";
const char* topic_lwt = "aeras/block/BLK-001/status";

// CA Certificate (PEM format)
const char* ca_cert = \
"-----BEGIN CERTIFICATE-----\n" \
"YOUR_CA_CERTIFICATE_HERE\n" \
"-----END CERTIFICATE-----\n";

WiFiClientSecure secureClient;
PubSubClient mqttClient(secureClient);

// Reconnection variables
unsigned long lastReconnectAttempt = 0;
const unsigned long reconnectInterval = 5000;  // 5 seconds
int reconnectAttempts = 0;
const int maxReconnectAttempts = 10;

// Exponential backoff function
unsigned long getBackoffDelay(int attempt) {
    unsigned long baseDelay = 1000;  // 1 second
    unsigned long maxDelay = 60000;  // 60 seconds
    unsigned long delay = baseDelay * (1 << min(attempt, 6));  // 2^attempt
    return min(delay, maxDelay);
}

void setup_wifi() {
    delay(10);
    Serial.println();
    Serial.print("Connecting to WiFi: ");
    Serial.println(ssid);

    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    randomSeed(micros());
    Serial.println("");
    Serial.println("WiFi connected");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
}

void setup_time() {
    configTime(0, 0, "pool.ntp.org");
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo)) {
        Serial.println("Failed to obtain time");
        return;
    }
    Serial.println("Time synchronized");
}

void callback(char* topic, byte* payload, unsigned int length) {
    Serial.print("Message received on topic: ");
    Serial.println(topic);
    Serial.print("Payload: ");
    
    // Parse JSON payload
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, payload, length);
    
    if (error) {
        Serial.print("JSON parsing failed: ");
        Serial.println(error.c_str());
        return;
    }
    
    // Handle different message types
    const char* msgType = doc["type"];
    if (strcmp(msgType, "status") == 0) {
        Serial.println("Status update received");
        // Handle status update
    }
}

boolean reconnect() {
    if (mqttClient.connected()) {
        return true;
    }

    unsigned long currentTime = millis();
    unsigned long backoffDelay = getBackoffDelay(reconnectAttempts);
    
    if (currentTime - lastReconnectAttempt < backoffDelay) {
        return false;
    }
    
    lastReconnectAttempt = currentTime;
    Serial.print("Attempting MQTT connection... (attempt ");
    Serial.print(reconnectAttempts + 1);
    Serial.print("/");
    Serial.print(maxReconnectAttempts);
    Serial.println(")");

    // Set LWT (Last Will and Testament)
    String lwtPayload = "{\"status\":\"offline\",\"timestamp\":\"" + getISOTimestamp() + "\"}";
    
    if (mqttClient.connect(client_id, mqtt_username, mqtt_password,
                          topic_lwt, 1, true, lwtPayload.c_str())) {
        Serial.println("MQTT connected!");
        reconnectAttempts = 0;
        
        // Subscribe to status updates
        mqttClient.subscribe(topic_status);
        Serial.print("Subscribed to: ");
        Serial.println(topic_status);
        
        // Publish online status
        publishStatus("online");
        
        return true;
    } else {
        Serial.print("MQTT connection failed, rc=");
        Serial.print(mqttClient.state());
        Serial.println(" - will retry");
        reconnectAttempts++;
        
        if (reconnectAttempts >= maxReconnectAttempts) {
            Serial.println("Max reconnection attempts reached. Triggering fallback.");
            triggerFallback();
            reconnectAttempts = 0;  // Reset for next cycle
        }
        
        return false;
    }
}

String getISOTimestamp() {
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo)) {
        return "";
    }
    
    char buffer[30];
    strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
    return String(buffer);
}

String generateUUID() {
    // Simple UUID v4 generation (for demo purposes)
    // In production, use a proper UUID library
    char uuid[37];
    sprintf(uuid, "%08x-%04x-%04x-%04x-%012x",
            random(0x10000000, 0xffffffff),
            random(0x1000, 0xffff),
            random(0x1000, 0xffff),
            random(0x1000, 0xffff),
            random(0x100000000000, 0xffffffffffff));
    return String(uuid);
}

void publishRequest(float pickupLat, float pickupLon, float dropoffLat, float dropoffLon) {
    StaticJsonDocument<1024> doc;
    
    // Base message fields
    doc["messageId"] = generateUUID();
    doc["timestamp"] = getISOTimestamp();
    doc["version"] = "1.0";
    doc["senderId"] = "BLK-001";
    doc["type"] = "request";
    
    // Payload
    JsonObject payload = doc.createNestedObject("payload");
    payload["requestId"] = "REQ-" + String(millis());
    payload["passengerCount"] = 2;
    payload["vehicleType"] = "standard";
    payload["priority"] = "normal";
    payload["maxWaitTime"] = 300;
    
    // Pickup location
    JsonObject pickupLoc = payload.createNestedObject("pickupLocation");
    pickupLoc["latitude"] = pickupLat;
    pickupLoc["longitude"] = pickupLon;
    pickupLoc["address"] = "123 Main St";
    
    // Dropoff location
    JsonObject dropoffLoc = payload.createNestedObject("dropoffLocation");
    dropoffLoc["latitude"] = dropoffLat;
    dropoffLoc["longitude"] = dropoffLon;
    dropoffLoc["address"] = "456 Park Ave";
    
    // Serialize to string
    String jsonString;
    serializeJson(doc, jsonString);
    
    // Publish with QoS 1
    boolean result = mqttClient.publish(topic_request, jsonString.c_str(), true);
    
    if (result) {
        Serial.println("Request published successfully");
    } else {
        Serial.println("Failed to publish request");
    }
}

void publishStatus(const char* status) {
    StaticJsonDocument<256> doc;
    doc["status"] = status;
    doc["timestamp"] = getISOTimestamp();
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    mqttClient.publish(topic_lwt, jsonString.c_str(), true);
}

void triggerFallback() {
    Serial.println("Triggering HTTP fallback...");
    // Implement HTTP REST API fallback here
    // See Node.js example for HTTP fallback implementation
}

void setup() {
    Serial.begin(115200);
    delay(1000);
    
    setup_wifi();
    setup_time();
    
    // Configure TLS
    secureClient.setCACert(ca_cert);
    secureClient.setTimeout(10000);
    
    // Configure MQTT client
    mqttClient.setServer(mqtt_server, mqtt_port);
    mqttClient.setCallback(callback);
    mqttClient.setKeepAlive(60);
    mqttClient.setSocketTimeout(30);
    
    // Set buffer sizes
    mqttClient.setBufferSize(2048);
}

void loop() {
    if (!mqttClient.connected()) {
        reconnect();
    } else {
        mqttClient.loop();
        
        // Example: Publish a request every 60 seconds (for testing)
        static unsigned long lastRequest = 0;
        if (millis() - lastRequest > 60000) {
            lastRequest = millis();
            // Example coordinates (New York City)
            publishRequest(40.7128, -74.0060, 40.7589, -73.9851);
        }
    }
    
    delay(100);
}

