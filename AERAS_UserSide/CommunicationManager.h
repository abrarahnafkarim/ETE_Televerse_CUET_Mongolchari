/**
 * AERAS - Communication Manager (WiFi + MQTT)
 * 
 * Features:
 * - WiFi connection with auto-reconnect
 * - MQTT communication
 * - Exponential backoff retry
 * - Message buffering on failure
 * - Heartbeat every 30 seconds
 * - JSON payload formatting
 */

#ifndef COMMUNICATION_MANAGER_H
#define COMMUNICATION_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "config.h"

enum BackendStatus {
    STATUS_NONE,
    STATUS_INCOMING_OFFER,
    STATUS_ACCEPTED,
    STATUS_REJECTED,
    STATUS_TIMEOUT,
    STATUS_ERROR
};

class CommunicationManager {
private:
    WiFiClient wifiClient;
    PubSubClient* mqttClient;
    
    String clientId;
    String statusTopic;
    
    // Connection state
    bool wifiConnected;
    bool mqttConnected;
    unsigned long lastWiFiAttempt;
    unsigned long lastMQTTAttempt;
    unsigned long mqttReconnectDelay;
    
    // Heartbeat
    unsigned long lastHeartbeat;
    
    // Backend status
    BackendStatus currentStatus;
    bool statusUpdated;
    
    // Message retry
    uint8_t retryCount;
    String lastMessage;
    
    /**
     * Connect to WiFi
     */
    bool connectWiFi();
    
    /**
     * Connect to MQTT broker
     */
    bool connectMQTT();
    
    /**
     * MQTT message callback (static wrapper)
     */
    static void mqttCallback(char* topic, byte* payload, unsigned int length);
    
    /**
     * Handle incoming MQTT message
     */
    void handleMessage(char* topic, byte* payload, unsigned int length);

public:
    /**
     * Constructor
     */
    CommunicationManager();
    
    /**
     * Initialize communication
     * @return true if successful
     */
    bool begin();
    
    /**
     * Update communication (call in loop)
     * Handles reconnection, heartbeat, message processing
     */
    void update();
    
    /**
     * Check if WiFi is connected
     */
    bool isWiFiConnected();
    
    /**
     * Check if MQTT is connected
     */
    bool isMQTTConnected();
    
    /**
     * Send ride request
     * @param blockId Location block ID
     * @param destination Destination block ID
     * @param verified Privilege verification status
     * @return true if sent successfully
     */
    bool sendRideRequest(const char* blockId, const char* destination, bool verified);
    
    /**
     * Send heartbeat message
     */
    void sendHeartbeat();
    
    /**
     * Get backend status
     * @return Current backend status
     */
    BackendStatus getStatus();
    
    /**
     * Check if status was updated
     * @return true if new status received
     */
    bool hasStatusUpdate();
    
    /**
     * Clear status update flag
     */
    void clearStatusUpdate();
    
    /**
     * Get WiFi signal strength
     * @return RSSI in dBm
     */
    int getSignalStrength();
    
    // Static instance pointer for callback
    static CommunicationManager* instance;
};

#endif // COMMUNICATION_MANAGER_H

