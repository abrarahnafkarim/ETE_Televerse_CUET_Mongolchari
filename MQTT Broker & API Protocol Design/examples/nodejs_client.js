/**
 * AERAS Node.js MQTT Client Example
 * 
 * This example demonstrates how to connect a Node.js application to the
 * AERAS MQTT broker and handle various message types.
 * 
 * Requirements:
 * - npm install mqtt axios
 */

const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

// Configuration
const config = {
    mqtt: {
        host: 'mqtt.aeras.local',
        port: 8883,
        protocol: 'mqtts',
        username: 'driver_DRV-0423',
        password: 'your_secure_password',
        clientId: 'DRV-0423',
        ca: fs.readFileSync(path.join(__dirname, '../certs/ca/ca.crt')),
        rejectUnauthorized: true
    },
    http: {
        baseUrl: 'https://api.aeras.local/v1',
        timeout: 10000
    },
    reconnect: {
        maxAttempts: 10,
        baseDelay: 1000,
        maxDelay: 60000
    }
};

// MQTT Client
let mqttClient = null;
let reconnectAttempts = 0;
let reconnectTimer = null;

// Message queue for offline scenarios
const messageQueue = [];

// Exponential backoff function
function getBackoffDelay(attempt) {
    const delay = config.reconnect.baseDelay * Math.pow(2, Math.min(attempt, 6));
    return Math.min(delay, config.reconnect.maxDelay);
}

// Generate UUID v4
function generateUUID() {
    return crypto.randomUUID();
}

// Get ISO timestamp
function getISOTimestamp() {
    return new Date().toISOString();
}

// Create base message structure
function createBaseMessage(type, senderId) {
    return {
        messageId: generateUUID(),
        timestamp: getISOTimestamp(),
        version: '1.0',
        senderId: senderId,
        type: type
    };
}

// Publish location update
function publishLocation(latitude, longitude, additionalData = {}) {
    const message = {
        ...createBaseMessage('location', config.mqtt.clientId),
        payload: {
            latitude,
            longitude,
            timestamp: getISOTimestamp(),
            ...additionalData
        }
    };

    const topic = `aeras/driver/${config.mqtt.clientId}/location`;
    publishMessage(topic, message, { qos: 0, retain: true });
}

// Publish offer
function publishOffer(requestId, driverLocation, fare, vehicleInfo) {
    const message = {
        ...createBaseMessage('offer', config.mqtt.clientId),
        payload: {
            offerId: `OFF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            requestId: requestId,
            driverLocation: driverLocation,
            estimatedArrival: 180, // 3 minutes
            fare: fare,
            vehicleInfo: vehicleInfo,
            driverRating: 4.8,
            expiresAt: new Date(Date.now() + 180000).toISOString() // 3 minutes
        }
    };

    const topic = `aeras/driver/${config.mqtt.clientId}/offer`;
    publishMessage(topic, message, { qos: 1, retain: false });
}

// Publish heartbeat
function publishHeartbeat() {
    const message = {
        ...createBaseMessage('heartbeat', config.mqtt.clientId),
        payload: {
            deviceType: 'driver',
            deviceId: config.mqtt.clientId,
            status: 'online',
            batteryLevel: 85,
            signalStrength: -65,
            uptime: process.uptime()
        }
    };

    const topic = 'aeras/system/heartbeat';
    publishMessage(topic, message, { qos: 0, retain: false });
}

// Publish message with fallback
function publishMessage(topic, message, options = {}) {
    const payload = JSON.stringify(message);
    const defaultOptions = { qos: 0, retain: false };

    if (mqttClient && mqttClient.connected) {
        try {
            mqttClient.publish(topic, payload, { ...defaultOptions, ...options }, (error) => {
                if (error) {
                    console.error(`Failed to publish to ${topic}:`, error);
                    queueMessage(topic, message, options);
                    triggerHTTPFallback(topic, message);
                } else {
                    console.log(`Published to ${topic}`);
                }
            });
        } catch (error) {
            console.error(`Error publishing to ${topic}:`, error);
            queueMessage(topic, message, options);
            triggerHTTPFallback(topic, message);
        }
    } else {
        console.warn(`MQTT not connected. Queuing message for ${topic}`);
        queueMessage(topic, message, options);
        triggerHTTPFallback(topic, message);
    }
}

// Queue message for later
function queueMessage(topic, message, options) {
    messageQueue.push({ topic, message, options, timestamp: Date.now() });
    
    // Limit queue size
    if (messageQueue.length > 1000) {
        messageQueue.shift(); // Remove oldest
    }
}

// Process queued messages
function processMessageQueue() {
    if (!mqttClient || !mqttClient.connected) {
        return;
    }

    while (messageQueue.length > 0) {
        const { topic, message, options } = messageQueue.shift();
        publishMessage(topic, message, options);
    }
}

// HTTP REST fallback
async function triggerHTTPFallback(topic, message) {
    // Only use HTTP fallback for critical messages
    const criticalTypes = ['accept', 'pickup', 'drop', 'points_update'];
    if (!criticalTypes.includes(message.type)) {
        return;
    }

    try {
        const response = await axios.post(
            `${config.http.baseUrl}/messages`,
            {
                topic: topic,
                qos: message.qos || 0,
                payload: message
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getJWTToken()}`
                },
                timeout: config.http.timeout
            }
        );

        console.log(`HTTP fallback successful for ${topic}`);
    } catch (error) {
        console.error(`HTTP fallback failed for ${topic}:`, error.message);
        
        // If HTTP also fails and message is critical, trigger SMS fallback
        if (message.type === 'accept' || message.priority === 'emergency') {
            triggerSMSFallback(message);
        }
    }
}

// SMS fallback (pseudo-code)
function triggerSMSFallback(message) {
    console.log('Triggering SMS fallback for critical message');
    // Implement SMS gateway integration here
    // Example: Twilio, AWS SNS, etc.
}

// Get JWT token (implement your JWT generation logic)
function getJWTToken() {
    // In production, generate JWT with proper secret and expiration
    return 'your_jwt_token_here';
}

// Connect to MQTT broker
function connectMQTT() {
    const options = {
        ...config.mqtt,
        keepalive: 60,
        clean: false, // Persistent session
        reconnectPeriod: 0, // Manual reconnection
        will: {
            topic: `aeras/driver/${config.mqtt.clientId}/status`,
            payload: JSON.stringify({
                status: 'offline',
                timestamp: getISOTimestamp()
            }),
            qos: 1,
            retain: true
        }
    };

    mqttClient = mqtt.connect(config.mqtt.host, options);

    mqttClient.on('connect', () => {
        console.log('MQTT connected');
        reconnectAttempts = 0;
        
        // Subscribe to topics
        mqttClient.subscribe(`aeras/block/+/request`, { qos: 1 }, (err) => {
            if (err) {
                console.error('Subscription error:', err);
            } else {
                console.log('Subscribed to block requests');
            }
        });

        mqttClient.subscribe(`aeras/driver/${config.mqtt.clientId}/+`, { qos: 1 }, (err) => {
            if (err) {
                console.error('Subscription error:', err);
            } else {
                console.log(`Subscribed to driver updates`);
            }
        });

        // Process queued messages
        processMessageQueue();

        // Publish online status
        publishStatus('online');
    });

    mqttClient.on('message', (topic, payload) => {
        try {
            const message = JSON.parse(payload.toString());
            handleMessage(topic, message);
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    mqttClient.on('error', (error) => {
        console.error('MQTT error:', error);
    });

    mqttClient.on('close', () => {
        console.log('MQTT connection closed');
        scheduleReconnect();
    });

    mqttClient.on('offline', () => {
        console.log('MQTT client offline');
        scheduleReconnect();
    });
}

// Handle incoming messages
function handleMessage(topic, message) {
    console.log(`Received message on ${topic}:`, message.type);

    switch (message.type) {
        case 'request':
            handleRequest(message);
            break;
        case 'points_update':
            handlePointsUpdate(message);
            break;
        case 'status':
            handleStatus(message);
            break;
        default:
            console.log(`Unhandled message type: ${message.type}`);
    }
}

// Handle ride request
function handleRequest(message) {
    const request = message.payload;
    console.log(`New ride request: ${request.requestId}`);

    // Example: Publish an offer
    const driverLocation = { latitude: 40.7150, longitude: -74.0080 };
    const fare = { amount: 15.50, currency: 'USD' };
    const vehicleInfo = {
        type: 'standard',
        licensePlate: 'ABC-1234',
        capacity: 4
    };

    publishOffer(request.requestId, driverLocation, fare, vehicleInfo);
}

// Handle points update
function handlePointsUpdate(message) {
    const update = message.payload;
    console.log(`Points update: +${update.pointsEarned} (Total: ${update.pointsTotal})`);
}

// Handle status update
function handleStatus(message) {
    console.log(`Status update:`, message.payload);
}

// Publish status
function publishStatus(status) {
    const message = {
        status: status,
        timestamp: getISOTimestamp()
    };
    const topic = `aeras/driver/${config.mqtt.clientId}/status`;
    publishMessage(topic, message, { qos: 1, retain: true });
}

// Schedule reconnection with exponential backoff
function scheduleReconnect() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
    }

    if (reconnectAttempts >= config.reconnect.maxAttempts) {
        console.error('Max reconnection attempts reached');
        reconnectAttempts = 0;
        return;
    }

    const delay = getBackoffDelay(reconnectAttempts);
    console.log(`Scheduling reconnect in ${delay}ms (attempt ${reconnectAttempts + 1})`);

    reconnectTimer = setTimeout(() => {
        reconnectAttempts++;
        connectMQTT();
    }, delay);
}

// Initialize
console.log('Starting AERAS MQTT Client...');
connectMQTT();

// Publish location every 5 seconds
setInterval(() => {
    // Example: Random location in NYC
    const lat = 40.7128 + (Math.random() - 0.5) * 0.1;
    const lon = -74.0060 + (Math.random() - 0.5) * 0.1;
    publishLocation(lat, lon, {
        accuracy: 5.0,
        speed: Math.random() * 50,
        heading: Math.random() * 360
    });
}, 5000);

// Publish heartbeat every 30 seconds
setInterval(() => {
    publishHeartbeat();
}, 30000);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down...');
    publishStatus('offline');
    if (mqttClient) {
        mqttClient.end();
    }
    process.exit(0);
});

