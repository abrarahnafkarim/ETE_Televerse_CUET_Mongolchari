/**
 * AERAS - Ultrasonic Distance Sensor Module
 * 
 * Features:
 * - Median filtering (5 samples) for noise rejection
 * - Continuous presence detection (3 seconds)
 * - Movement and instability handling
 * - Multiple person detection tolerance
 * - ±5cm accuracy validation
 */

#ifndef ULTRASONIC_SENSOR_H
#define ULTRASONIC_SENSOR_H

#include <Arduino.h>
#include "config.h"

class UltrasonicSensor {
private:
    uint8_t trigPin;
    uint8_t echoPin;
    
    // Filter buffer for median calculation
    float distanceBuffer[ULTRASONIC_FILTER_SIZE];
    uint8_t bufferIndex;
    bool bufferFilled;
    
    // Presence detection state
    unsigned long presenceStartTime;
    bool presenceDetected;
    float lastStableDistance;
    
    // Timing
    unsigned long lastSampleTime;
    
    /**
     * Read raw distance from ultrasonic sensor
     * @return Distance in cm, or -1 on error/timeout
     */
    float readRawDistance();
    
    /**
     * Apply median filter to reduce noise
     * @return Filtered distance in cm
     */
    float getMedianFilteredDistance();
    
    /**
     * Sort array for median calculation
     */
    void sortArray(float* arr, uint8_t size);

public:
    /**
     * Constructor
     * @param trig Trigger pin
     * @param echo Echo pin
     */
    UltrasonicSensor(uint8_t trig, uint8_t echo);
    
    /**
     * Initialize sensor
     */
    void begin();
    
    /**
     * Update sensor reading (call in loop)
     * Should be called at least every ULTRASONIC_SAMPLE_INTERVAL ms
     */
    void update();
    
    /**
     * Check if user presence is continuously detected for required duration
     * @return true if user present for >= 3 seconds
     */
    bool isPresenceConfirmed();
    
    /**
     * Get current filtered distance
     * @return Distance in cm
     */
    float getDistance();
    
    /**
     * Check if user is in valid detection zone
     * @return true if distance is within 0.5m to 10m
     */
    bool isUserInZone();
    
    /**
     * Reset presence detection state
     * Call when user moves away or process needs reset
     */
    void resetPresence();
    
    /**
     * Get time user has been present (ms)
     */
    unsigned long getPresenceTime();
};

#endif // ULTRASONIC_SENSOR_H

