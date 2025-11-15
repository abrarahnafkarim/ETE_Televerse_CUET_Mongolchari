/**
 * AERAS - Communication Manager Implementation
 */

#include "CommunicationManager.h"

// Static instance pointer for callback
CommunicationManager* CommunicationManager::instance = nullptr;

CommunicationManager::CommunicationManager()
    : mqttClient(nullptr), wifiConnected(false), mqttConnected(false),
      lastWiFiAttempt(0), lastMQTTAttempt(0), 
      mqttReconnectDelay(MQTT_RECONNECT_BASE_MS),
      lastHeartbeat(0), currentStatus(STATUS_NONE), 
      statusUpdated(false), retryCount(0), lastMessage("") {
    
    // Set static instance for callback
    instance = this;
}

bool CommunicationManager::begin() {
    DEBUG_PRINTLN("[COMM] Initializing...");
    
    // Generate unique client ID
    uint64_t chipid = ESP.getEfuseMac();
    clientId = String(MQTT_CLIENT_ID_PREFIX) + String((uint32_t)chipid, HEX);
    statusTopic = String(MQTT_TOPIC_STATUS) + clientId;
    
    DEBUG_PRINTF("[COMM] Client ID: %s\n", clientId.c_str());
    
    // Connect WiFi
    if (!connectWiFi()) {
        DEBUG_PRINTLN("[COMM] ✗ WiFi connection failed");
        return false;
    }
    
    // Initialize MQTT client
    mqttClient = new PubSubClient(wifiClient);
    mqttClient->setServer(MQTT_BROKER, MQTT_PORT);
    mqttClient->setCallback(CommunicationManager::mqttCallback);
    mqttClient->setKeepAlive(60);
    mqttClient->setSocketTimeout(15);
    
    // Connect MQTT
    if (!connectMQTT()) {
        DEBUG_PRINTLN("[COMM] ✗ MQTT connection failed (will retry)");
    }
    
    DEBUG_PRINTLN("[COMM] ✓ Initialized");
    return true;
}

bool CommunicationManager::connectWiFi() {
    if (WiFi.status() == WL_CONNECTED) {
        wifiConnected = true;
        return true;
    }
    
    unsigned long currentTime = millis();
    if (currentTime - lastWiFiAttempt < WIFI_RECONNECT_INTERVAL_MS) {
        return false;
    }
    
    lastWiFiAttempt = currentTime;
    
    DEBUG_PRINTF("[COMM] Connecting to WiFi: %s\n", WIFI_SSID);
    
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    // Wait up to 10 seconds
    uint8_t attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        DEBUG_PRINT(".");
        attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        wifiConnected = true;
        DEBUG_PRINTLN();
        DEBUG_PRINTF("[COMM] ✓ WiFi connected, IP: %s\n", WiFi.localIP().toString().c_str());
        DEBUG_PRINTF("[COMM] Signal strength: %d dBm\n", WiFi.RSSI());
        return true;
    } else {
        wifiConnected = false;
        DEBUG_PRINTLN();
        DEBUG_PRINTLN("[COMM] ✗ WiFi connection failed");
        return false;
    }
}

bool CommunicationManager::connectMQTT() {
    if (!wifiConnected || mqttClient == nullptr) {
        return false;
    }
    
    if (mqttClient->connected()) {
        mqttConnected = true;
        return true;
    }
    
    unsigned long currentTime = millis();
    if (currentTime - lastMQTTAttempt < mqttReconnectDelay) {
        return false;
    }
    
    lastMQTTAttempt = currentTime;
    
    DEBUG_PRINTF("[COMM] Connecting to MQTT broker: %s:%d\n", MQTT_BROKER, MQTT_PORT);
    
    bool connected = false;
    if (strlen(MQTT_USERNAME) > 0) {
        connected = mqttClient->connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD);
    } else {
        connected = mqttClient->connect(clientId.c_str());
    }
    
    if (connected) {
        mqttConnected = true;
        mqttReconnectDelay = MQTT_RECONNECT_BASE_MS;  // Reset backoff
        
        DEBUG_PRINTLN("[COMM] ✓ MQTT connected");
        
        // Subscribe to status topic
        mqttClient->subscribe(statusTopic.c_str());
        DEBUG_PRINTF("[COMM] Subscribed to: %s\n", statusTopic.c_str());
        
        return true;
    } else {
        mqttConnected = false;
        
        // Exponential backoff
        mqttReconnectDelay *= 2;
        if (mqttReconnectDelay > MQTT_RECONNECT_MAX_MS) {
            mqttReconnectDelay = MQTT_RECONNECT_MAX_MS;
        }
        
        DEBUG_PRINTF("[COMM] ✗ MQTT connection failed, state: %d, retry in %lu ms\n",
                   mqttClient->state(), mqttReconnectDelay);
        
        return false;
    }
}

void CommunicationManager::mqttCallback(char* topic, byte* payload, unsigned int length) {
    if (instance != nullptr) {
        instance->handleMessage(topic, payload, length);
    }
}

void CommunicationManager::handleMessage(char* topic, byte* payload, unsigned int length) {
    // Convert payload to string
    char message[256];
    if (length >= sizeof(message)) {
        length = sizeof(message) - 1;
    }
    memcpy(message, payload, length);
    message[length] = '\0';
    
    DEBUG_PRINTF("[COMM] Message received on %s: %s\n", topic, message);
    
    // Parse JSON
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, message);
    
    if (error) {
        DEBUG_PRINTF("[COMM] JSON parse error: %s\n", error.c_str());
        return;
    }
    
    // Extract status
    const char* status = doc["status"];
    
    if (status == nullptr) {
        DEBUG_PRINTLN("[COMM] No status field in message");
        return;
    }
    
    // Update status
    if (strcmp(status, "incoming_offer") == 0 || strcmp(status, "offer") == 0) {
        currentStatus = STATUS_INCOMING_OFFER;
        DEBUG_PRINTLN("[COMM] Status: INCOMING OFFER");
    } else if (strcmp(status, "accepted") == 0) {
        currentStatus = STATUS_ACCEPTED;
        DEBUG_PRINTLN("[COMM] Status: ACCEPTED");
    } else if (strcmp(status, "rejected") == 0) {
        currentStatus = STATUS_REJECTED;
        DEBUG_PRINTLN("[COMM] Status: REJECTED");
    } else if (strcmp(status, "timeout") == 0) {
        currentStatus = STATUS_TIMEOUT;
        DEBUG_PRINTLN("[COMM] Status: TIMEOUT");
    } else if (strcmp(status, "error") == 0) {
        currentStatus = STATUS_ERROR;
        DEBUG_PRINTLN("[COMM] Status: ERROR");
    } else {
        DEBUG_PRINTF("[COMM] Unknown status: %s\n", status);
        return;
    }
    
    statusUpdated = true;
}

void CommunicationManager::update() {
    // Check WiFi connection
    if (!wifiConnected || WiFi.status() != WL_CONNECTED) {
        wifiConnected = false;
        mqttConnected = false;
        connectWiFi();
    }
    
    // Check MQTT connection
    if (wifiConnected && !mqttConnected) {
        connectMQTT();
    }
    
    // Process MQTT messages
    if (mqttConnected && mqttClient != nullptr) {
        mqttClient->loop();
    }
    
    // Send heartbeat
    unsigned long currentTime = millis();
    if (mqttConnected && (currentTime - lastHeartbeat >= HEARTBEAT_INTERVAL_MS)) {
        sendHeartbeat();
    }
}

bool CommunicationManager::isWiFiConnected() {
    return wifiConnected;
}

bool CommunicationManager::isMQTTConnected() {
    return mqttConnected;
}

bool CommunicationManager::sendRideRequest(const char* blockId, const char* destination, bool verified) {
    if (!mqttConnected || mqttClient == nullptr) {
        DEBUG_PRINTLN("[COMM] ✗ Cannot send request - not connected");
        return false;
    }
    
    // Create JSON payload
    StaticJsonDocument<256> doc;
    doc["block_id"] = blockId;
    doc["destination"] = destination;
    doc["verified"] = verified;
    
    // Add timestamp (ISO8601 format)
    char timestamp[32];
    unsigned long now = millis() / 1000;  // Seconds since boot
    snprintf(timestamp, sizeof(timestamp), "2025-11-13T%02lu:%02lu:%02lu",
             (now / 3600) % 24, (now / 60) % 60, now % 60);
    doc["timestamp"] = timestamp;
    
    // Serialize to string
    String payload;
    serializeJson(doc, payload);
    
    DEBUG_PRINTF("[COMM] Sending request: %s\n", payload.c_str());
    
    // Publish message
    bool success = mqttClient->publish(MQTT_TOPIC_REQUEST, payload.c_str(), false);
    
    if (success) {
        DEBUG_PRINTLN("[COMM] ✓ Request sent");
        retryCount = 0;
        lastMessage = "";
        return true;
    } else {
        DEBUG_PRINTLN("[COMM] ✗ Request send failed");
        
        // Store for retry
        lastMessage = payload;
        retryCount++;
        
        if (retryCount < MESSAGE_RETRY_MAX_ATTEMPTS) {
            DEBUG_PRINTF("[COMM] Will retry (%d/%d)\n", retryCount, MESSAGE_RETRY_MAX_ATTEMPTS);
        }
        
        return false;
    }
}

void CommunicationManager::sendHeartbeat() {
    if (!mqttConnected || mqttClient == nullptr) {
        return;
    }
    
    StaticJsonDocument<128> doc;
    doc["client_id"] = clientId;
    doc["uptime"] = millis() / 1000;
    doc["rssi"] = WiFi.RSSI();
    
    String payload;
    serializeJson(doc, payload);
    
    mqttClient->publish(MQTT_TOPIC_HEARTBEAT, payload.c_str(), false);
    lastHeartbeat = millis();
    
    DEBUG_PRINTLN("[COMM] Heartbeat sent");
}

BackendStatus CommunicationManager::getStatus() {
    return currentStatus;
}

bool CommunicationManager::hasStatusUpdate() {
    return statusUpdated;
}

void CommunicationManager::clearStatusUpdate() {
    statusUpdated = false;
}

int CommunicationManager::getSignalStrength() {
    if (wifiConnected) {
        return WiFi.RSSI();
    }
    return -100;  // No signal
}

