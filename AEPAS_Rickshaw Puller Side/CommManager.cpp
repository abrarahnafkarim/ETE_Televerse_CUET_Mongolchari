/*
 * CommManager.cpp
 * Implementation of communication management with offline buffering
 */

#include "CommManager.h"
#include "mbedtls/md.h"

CommManager* CommManager::instance = nullptr;

CommManager::CommManager() : 
    mqttClient(wifiClient),
    lastReconnectAttempt(0),
    lastHeartbeat(0),
    retryDelay(OFFLINE_RETRY_INITIAL),
    queueHead(0),
    queueTail(0),
    queueSize(0) {
    
    instance = this;
}

void CommManager::begin() {
    DEBUG_PRINTLN(F("[COMM] Initializing Communication Manager..."));
    
    // Initialize WiFi
    WiFi.mode(WIFI_STA);
    WiFi.setAutoReconnect(true);
    
    // Initialize MQTT
    mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
    mqttClient.setCallback(staticMqttCallback);
    mqttClient.setKeepAlive(MQTT_KEEPALIVE);
    
    DEBUG_PRINTLN(F("[COMM] Communication Manager initialized"));
}

bool CommManager::connectWiFi() {
    if (WiFi.status() == WL_CONNECTED) {
        return true;
    }
    
    DEBUG_PRINT(F("[COMM] Connecting to WiFi: "));
    DEBUG_PRINTLN(WIFI_SSID);
    
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    unsigned long startTime = millis();
    while (WiFi.status() != WL_CONNECTED && (millis() - startTime < WIFI_TIMEOUT_MS)) {
        delay(500);
        DEBUG_PRINT(F("."));
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        DEBUG_PRINTLN(F("\n[COMM] WiFi connected"));
        DEBUG_PRINT(F("[COMM] IP: "));
        DEBUG_PRINTLN(WiFi.localIP());
        resetRetryDelay();
        return true;
    } else {
        DEBUG_PRINTLN(F("\n[COMM] WiFi connection failed"));
        return false;
    }
}

bool CommManager::isWiFiConnected() const {
    return WiFi.status() == WL_CONNECTED;
}

bool CommManager::connectMQTT() {
    if (mqttClient.connected()) {
        return true;
    }
    
    if (!isWiFiConnected()) {
        return false;
    }
    
    DEBUG_PRINTLN(F("[COMM] Connecting to MQTT broker..."));
    
    String clientId = generateClientId();
    bool connected = false;
    
    if (strlen(MQTT_USERNAME) > 0) {
        connected = mqttClient.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD);
    } else {
        connected = mqttClient.connect(clientId.c_str());
    }
    
    if (connected) {
        DEBUG_PRINTLN(F("[COMM] MQTT connected"));
        subscribeToRideNotifications();
        resetRetryDelay();
        return true;
    } else {
        DEBUG_PRINT(F("[COMM] MQTT connection failed, rc="));
        DEBUG_PRINTLN(mqttClient.state());
        return false;
    }
}

bool CommManager::isMQTTConnected() {
    return mqttClient.connected();
}

void CommManager::disconnect() {
    mqttClient.disconnect();
    WiFi.disconnect();
    DEBUG_PRINTLN(F("[COMM] Disconnected"));
}

void CommManager::update() {
    unsigned long currentTime = millis();
    
    // Handle WiFi reconnection
    if (!isWiFiConnected()) {
        if (currentTime - lastReconnectAttempt >= retryDelay) {
            DEBUG_PRINTLN(F("[COMM] Attempting WiFi reconnection..."));
            if (connectWiFi()) {
                connectMQTT();
            } else {
                increaseRetryDelay();
            }
            lastReconnectAttempt = currentTime;
        }
        return;
    }
    
    // Handle MQTT reconnection
    if (!isMQTTConnected()) {
        if (currentTime - lastReconnectAttempt >= retryDelay) {
            DEBUG_PRINTLN(F("[COMM] Attempting MQTT reconnection..."));
            if (connectMQTT()) {
                // Process any buffered events
                processOfflineQueue();
            } else {
                increaseRetryDelay();
            }
            lastReconnectAttempt = currentTime;
        }
    } else {
        // Process MQTT messages
        mqttClient.loop();
        
        // Send heartbeat
        if (currentTime - lastHeartbeat >= HEARTBEAT_INTERVAL) {
            sendHeartbeat();
            lastHeartbeat = currentTime;
        }
        
        // Process offline queue
        if (hasBufferedEvents()) {
            processOfflineQueue();
        }
    }
}

String CommManager::generateClientId() {
    String clientId = MQTT_CLIENT_PREFIX;
    clientId += DEVICE_ID;
    clientId += "_";
    clientId += String(random(0xffff), HEX);
    return clientId;
}

String CommManager::signMessage(const String& payload) {
    // HMAC-SHA256 signature
    byte hmacResult[32];
    
    mbedtls_md_context_t ctx;
    mbedtls_md_type_t md_type = MBEDTLS_MD_SHA256;
    
    mbedtls_md_init(&ctx);
    mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(md_type), 1);
    mbedtls_md_hmac_starts(&ctx, (const unsigned char*)HMAC_KEY, strlen(HMAC_KEY));
    mbedtls_md_hmac_update(&ctx, (const unsigned char*)payload.c_str(), payload.length());
    mbedtls_md_hmac_finish(&ctx, hmacResult);
    mbedtls_md_free(&ctx);
    
    // Convert to hex string
    String signature = "";
    for (int i = 0; i < 32; i++) {
        char hex[3];
        sprintf(hex, "%02x", hmacResult[i]);
        signature += hex;
    }
    
    return signature;
}

String CommManager::createJsonPayload(const char* eventType, JsonDocument& doc) {
    doc["event"] = eventType;
    doc["device_id"] = DEVICE_ID;
    doc["driver_id"] = DRIVER_ID;
    doc["timestamp"] = millis();
    
    String payload;
    serializeJson(doc, payload);
    
    // Add signature
    StaticJsonDocument<1024> signedDoc;
    signedDoc["data"] = payload;
    signedDoc["signature"] = signMessage(payload);
    
    String signedPayload;
    serializeJson(signedDoc, signedPayload);
    
    return signedPayload;
}

bool CommManager::publishMessage(const char* topic, const String& payload) {
    if (!isMQTTConnected()) {
        DEBUG_PRINTLN(F("[COMM] MQTT not connected, buffering message"));
        return false;
    }
    
    bool success = mqttClient.publish(topic, payload.c_str(), false);
    
    if (success) {
        DEBUG_PRINTF("[COMM] Published to %s: %s\n", topic, payload.c_str());
    } else {
        DEBUG_PRINTF("[COMM] Failed to publish to %s\n", topic);
    }
    
    return success;
}

bool CommManager::publishAccept(const String& rideId, double lat, double lon) {
    StaticJsonDocument<512> doc;
    doc["ride_id"] = rideId;
    doc["latitude"] = lat;
    doc["longitude"] = lon;
    doc["status"] = "accepted";
    
    String payload = createJsonPayload("ride_accept", doc);
    
    if (!publishMessage(MQTT_TOPIC_RIDE_ACCEPT, payload)) {
        bufferEvent(EVENT_ACCEPT, payload);
        return false;
    }
    
    return true;
}

bool CommManager::publishReject(const String& rideId, const String& reason) {
    StaticJsonDocument<512> doc;
    doc["ride_id"] = rideId;
    doc["reason"] = reason;
    doc["status"] = "rejected";
    
    String payload = createJsonPayload("ride_reject", doc);
    
    if (!publishMessage(MQTT_TOPIC_RIDE_REJECT, payload)) {
        bufferEvent(EVENT_REJECT, payload);
        return false;
    }
    
    return true;
}

bool CommManager::publishCancel(const String& rideId, const String& reason) {
    StaticJsonDocument<512> doc;
    doc["ride_id"] = rideId;
    doc["reason"] = reason;
    doc["status"] = "cancelled";
    
    String payload = createJsonPayload("ride_cancel", doc);
    
    if (!publishMessage(MQTT_TOPIC_RIDE_CANCEL, payload)) {
        bufferEvent(EVENT_CANCEL, payload);
        return false;
    }
    
    return true;
}

bool CommManager::publishPickupConfirm(const String& rideId, double lat, double lon) {
    StaticJsonDocument<512> doc;
    doc["ride_id"] = rideId;
    doc["latitude"] = lat;
    doc["longitude"] = lon;
    doc["status"] = "pickup_confirmed";
    
    String payload = createJsonPayload("pickup_confirm", doc);
    
    if (!publishMessage(MQTT_TOPIC_PICKUP_CONF, payload)) {
        bufferEvent(EVENT_PICKUP, payload);
        return false;
    }
    
    return true;
}

bool CommManager::publishDropConfirm(const String& rideId, double lat, double lon, float points, bool needsReview) {
    StaticJsonDocument<512> doc;
    doc["ride_id"] = rideId;
    doc["latitude"] = lat;
    doc["longitude"] = lon;
    doc["points_awarded"] = points;
    doc["needs_review"] = needsReview;
    doc["status"] = needsReview ? "pending_review" : "completed";
    
    String payload = createJsonPayload("drop_confirm", doc);
    
    if (!publishMessage(MQTT_TOPIC_DROP_CONF, payload)) {
        bufferEvent(EVENT_DROP, payload);
        return false;
    }
    
    return true;
}

bool CommManager::publishStatus(const String& state, double lat, double lon) {
    StaticJsonDocument<512> doc;
    doc["state"] = state;
    doc["latitude"] = lat;
    doc["longitude"] = lon;
    doc["wifi_rssi"] = WiFi.RSSI();
    
    String payload = createJsonPayload("status", doc);
    
    return publishMessage(MQTT_TOPIC_STATUS, payload);
}

bool CommManager::publishLocation(double lat, double lon) {
    StaticJsonDocument<256> doc;
    doc["latitude"] = lat;
    doc["longitude"] = lon;
    
    String payload = createJsonPayload("location", doc);
    
    return publishMessage(MQTT_TOPIC_LOCATION, payload);
}

void CommManager::setMessageCallback(MessageCallback callback) {
    messageCallback = callback;
}

void CommManager::subscribeToRideNotifications() {
    if (mqttClient.subscribe(MQTT_TOPIC_RIDE_NOTIFY)) {
        DEBUG_PRINTF("[COMM] Subscribed to: %s\n", MQTT_TOPIC_RIDE_NOTIFY);
    } else {
        DEBUG_PRINTF("[COMM] Failed to subscribe to: %s\n", MQTT_TOPIC_RIDE_NOTIFY);
    }
}

void CommManager::staticMqttCallback(char* topic, byte* payload, unsigned int length) {
    if (instance) {
        instance->mqttCallback(topic, payload, length);
    }
}

void CommManager::mqttCallback(char* topic, byte* payload, unsigned int length) {
    // Null-terminate payload
    char message[length + 1];
    memcpy(message, payload, length);
    message[length] = '\0';
    
    DEBUG_PRINTF("[COMM] Message received [%s]: %s\n", topic, message);
    
    if (messageCallback) {
        messageCallback(topic, message);
    }
}

void CommManager::bufferEvent(EventType type, const String& payload) {
    if (queueSize >= EVENT_QUEUE_MAX) {
        DEBUG_PRINTLN(F("[COMM] Event queue full, dropping oldest event"));
        // Drop oldest event
        queueHead = (queueHead + 1) % EVENT_QUEUE_MAX;
        queueSize--;
    }
    
    addToQueue(type, payload);
    DEBUG_PRINTF("[COMM] Event buffered (queue size: %d)\n", queueSize);
}

void CommManager::addToQueue(EventType type, const String& payload) {
    eventQueue[queueTail].type = type;
    eventQueue[queueTail].payload = payload;
    eventQueue[queueTail].timestamp = millis();
    eventQueue[queueTail].retryCount = 0;
    
    queueTail = (queueTail + 1) % EVENT_QUEUE_MAX;
    queueSize++;
}

void CommManager::processOfflineQueue() {
    if (queueSize == 0 || !isMQTTConnected()) {
        return;
    }
    
    DEBUG_PRINTF("[COMM] Processing offline queue (%d events)\n", queueSize);
    
    // Process one event per call to avoid blocking
    BufferedEvent& event = eventQueue[queueHead];
    
    if (sendQueuedEvent(event)) {
        // Success - remove from queue
        queueHead = (queueHead + 1) % EVENT_QUEUE_MAX;
        queueSize--;
        DEBUG_PRINTLN(F("[COMM] Queued event sent successfully"));
    } else {
        // Failed - increment retry count
        event.retryCount++;
        if (event.retryCount > 5) {
            // Give up after 5 retries
            DEBUG_PRINTLN(F("[COMM] Max retries reached, dropping event"));
            queueHead = (queueHead + 1) % EVENT_QUEUE_MAX;
            queueSize--;
        }
    }
}

bool CommManager::sendQueuedEvent(BufferedEvent& event) {
    const char* topic = nullptr;
    
    switch (event.type) {
        case EVENT_ACCEPT:
            topic = MQTT_TOPIC_RIDE_ACCEPT;
            break;
        case EVENT_REJECT:
            topic = MQTT_TOPIC_RIDE_REJECT;
            break;
        case EVENT_CANCEL:
            topic = MQTT_TOPIC_RIDE_CANCEL;
            break;
        case EVENT_PICKUP:
            topic = MQTT_TOPIC_PICKUP_CONF;
            break;
        case EVENT_DROP:
            topic = MQTT_TOPIC_DROP_CONF;
            break;
        case EVENT_STATUS:
            topic = MQTT_TOPIC_STATUS;
            break;
        case EVENT_LOCATION:
            topic = MQTT_TOPIC_LOCATION;
            break;
    }
    
    if (topic) {
        return publishMessage(topic, event.payload);
    }
    
    return false;
}

bool CommManager::hasBufferedEvents() const {
    return queueSize > 0;
}

void CommManager::sendHeartbeat() {
    DEBUG_PRINTLN(F("[COMM] Sending heartbeat"));
    // Heartbeat will be sent with GPS location in main loop
}

bool CommManager::sendHTTP(const String& endpoint, const String& payload) {
    if (!isWiFiConnected()) {
        return false;
    }
    
    String url = String(HTTP_SERVER) + endpoint;
    
    httpClient.begin(url);
    httpClient.addHeader("Content-Type", "application/json");
    httpClient.addHeader("Authorization", AUTH_TOKEN);
    
    int httpCode = httpClient.POST(payload);
    
    bool success = (httpCode == 200 || httpCode == 201);
    
    if (success) {
        DEBUG_PRINTF("[COMM] HTTP POST success: %d\n", httpCode);
    } else {
        DEBUG_PRINTF("[COMM] HTTP POST failed: %d\n", httpCode);
    }
    
    httpClient.end();
    return success;
}

void CommManager::resetRetryDelay() {
    retryDelay = OFFLINE_RETRY_INITIAL;
}

void CommManager::increaseRetryDelay() {
    retryDelay = min(retryDelay * 2, (unsigned long)OFFLINE_RETRY_MAX);
    DEBUG_PRINTF("[COMM] Retry delay increased to %lu ms\n", retryDelay);
}

