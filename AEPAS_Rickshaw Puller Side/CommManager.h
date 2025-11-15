/*
 * CommManager.h
 * Communication manager for MQTT/HTTP with offline buffering and security
 */

#ifndef COMM_MANAGER_H
#define COMM_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "Config.h"

// Event types for offline buffering
enum EventType {
    EVENT_ACCEPT,
    EVENT_REJECT,
    EVENT_CANCEL,
    EVENT_PICKUP,
    EVENT_DROP,
    EVENT_STATUS,
    EVENT_LOCATION
};

struct BufferedEvent {
    EventType type;
    String payload;
    unsigned long timestamp;
    uint8_t retryCount;
};

// Callback function types
typedef std::function<void(const char* topic, const char* payload)> MessageCallback;

class CommManager {
public:
    CommManager();
    void begin();
    void update();
    
    // Connection management
    bool connectWiFi();
    bool isWiFiConnected() const;
    bool connectMQTT();
    bool isMQTTConnected();  // Non-const: PubSubClient connected() is not const
    void disconnect();
    
    // Publishing
    bool publishAccept(const String& rideId, double lat, double lon);
    bool publishReject(const String& rideId, const String& reason);
    bool publishCancel(const String& rideId, const String& reason);
    bool publishPickupConfirm(const String& rideId, double lat, double lon);
    bool publishDropConfirm(const String& rideId, double lat, double lon, float points, bool needsReview);
    bool publishStatus(const String& state, double lat, double lon);
    bool publishLocation(double lat, double lon);
    
    // Subscribe and message handling
    void setMessageCallback(MessageCallback callback);
    void subscribeToRideNotifications();
    
    // Offline handling
    void bufferEvent(EventType type, const String& payload);
    void processOfflineQueue();
    bool hasBufferedEvents() const;
    
    // Heartbeat
    void sendHeartbeat();
    
    // HTTP fallback
    bool sendHTTP(const String& endpoint, const String& payload);

private:
    WiFiClient wifiClient;
    PubSubClient mqttClient;
    HTTPClient httpClient;
    
    MessageCallback messageCallback;
    unsigned long lastReconnectAttempt;
    unsigned long lastHeartbeat;
    unsigned long retryDelay;
    
    // Offline event queue
    BufferedEvent eventQueue[EVENT_QUEUE_MAX];
    uint8_t queueHead;
    uint8_t queueTail;
    uint8_t queueSize;
    
    // Helper methods
    String generateClientId();
    String signMessage(const String& payload);
    String createJsonPayload(const char* eventType, JsonDocument& doc);
    bool publishMessage(const char* topic, const String& payload);
    void mqttCallback(char* topic, byte* payload, unsigned int length);
    static void staticMqttCallback(char* topic, byte* payload, unsigned int length);
    
    void addToQueue(EventType type, const String& payload);
    bool sendQueuedEvent(BufferedEvent& event);
    
    // Exponential backoff
    void resetRetryDelay();
    void increaseRetryDelay();
    
    static CommManager* instance; // For static callback
};

#endif // COMM_MANAGER_H

