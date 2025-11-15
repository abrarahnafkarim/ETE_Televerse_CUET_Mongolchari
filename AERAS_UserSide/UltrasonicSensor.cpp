/**
 * AERAS - Ultrasonic Distance Sensor Implementation
 */

#include "UltrasonicSensor.h"

UltrasonicSensor::UltrasonicSensor(uint8_t trig, uint8_t echo) 
    : trigPin(trig), echoPin(echo), bufferIndex(0), bufferFilled(false),
      presenceStartTime(0), presenceDetected(false), lastStableDistance(0),
      lastSampleTime(0) {
    // Initialize buffer
    for (uint8_t i = 0; i < ULTRASONIC_FILTER_SIZE; i++) {
        distanceBuffer[i] = 0;
    }
}

void UltrasonicSensor::begin() {
    pinMode(trigPin, OUTPUT);
    pinMode(echoPin, INPUT);
    digitalWrite(trigPin, LOW);
    
    DEBUG_PRINTLN("[ULTRASONIC] Initialized");
}

float UltrasonicSensor::readRawDistance() {
    // Send trigger pulse
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);
    
    // Read echo pulse (timeout after 30ms = ~5m max)
    unsigned long duration = pulseIn(echoPin, HIGH, 30000);
    
    if (duration == 0) {
        return -1;  // Timeout or no echo
    }
    
    // Calculate distance: duration(us) / 58.0 = cm
    // Speed of sound: 343 m/s = 0.0343 cm/us
    // Distance = (duration * 0.0343) / 2
    float distance = duration / 58.0;
    
    return distance;
}

void UltrasonicSensor::sortArray(float* arr, uint8_t size) {
    // Simple bubble sort for small array
    for (uint8_t i = 0; i < size - 1; i++) {
        for (uint8_t j = 0; j < size - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                float temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

float UltrasonicSensor::getMedianFilteredDistance() {
    if (!bufferFilled) {
        // Not enough samples yet, return last valid reading
        return distanceBuffer[bufferIndex > 0 ? bufferIndex - 1 : 0];
    }
    
    // Copy buffer for sorting (preserve original)
    float sortedBuffer[ULTRASONIC_FILTER_SIZE];
    memcpy(sortedBuffer, distanceBuffer, sizeof(distanceBuffer));
    
    // Sort and return median
    sortArray(sortedBuffer, ULTRASONIC_FILTER_SIZE);
    
    return sortedBuffer[ULTRASONIC_FILTER_SIZE / 2];
}

void UltrasonicSensor::update() {
    unsigned long currentTime = millis();
    
    // Check if it's time to sample
    if (currentTime - lastSampleTime < ULTRASONIC_SAMPLE_INTERVAL) {
        return;
    }
    
    lastSampleTime = currentTime;
    
    // Read raw distance
    float rawDistance = readRawDistance();
    
    if (rawDistance < 0) {
        DEBUG_PRINTLN("[ULTRASONIC] Read timeout");
        return;
    }
    
    // Add to filter buffer
    distanceBuffer[bufferIndex] = rawDistance;
    bufferIndex = (bufferIndex + 1) % ULTRASONIC_FILTER_SIZE;
    
    if (bufferIndex == 0) {
        bufferFilled = true;
    }
    
    // Get filtered distance
    float filteredDistance = getMedianFilteredDistance();
    
    DEBUG_PRINTF("[ULTRASONIC] Raw: %.1f cm, Filtered: %.1f cm\n", 
                 rawDistance, filteredDistance);
    
    // Check if user is in valid detection zone
    if (filteredDistance >= ULTRASONIC_MIN_RANGE_CM && 
        filteredDistance <= ULTRASONIC_MAX_RANGE_CM) {
        
        // Check for stable presence (within tolerance of last reading)
        if (!presenceDetected) {
            // Start tracking presence
            presenceDetected = true;
            presenceStartTime = currentTime;
            lastStableDistance = filteredDistance;
            DEBUG_PRINTF("[ULTRASONIC] User detected at %.1f cm\n", filteredDistance);
        } else {
            // Check if distance is stable (within tolerance)
            float distanceDelta = abs(filteredDistance - lastStableDistance);
            
            if (distanceDelta <= ULTRASONIC_ACCURACY_TOLERANCE) {
                // Still present and stable
                unsigned long presenceTime = currentTime - presenceStartTime;
                DEBUG_PRINTF("[ULTRASONIC] Stable presence: %lu ms\n", presenceTime);
            } else {
                // Movement detected, reset timer
                DEBUG_PRINTF("[ULTRASONIC] Movement detected: delta=%.1f cm, resetting\n", 
                           distanceDelta);
                presenceStartTime = currentTime;
                lastStableDistance = filteredDistance;
            }
        }
    } else {
        // User moved away or out of range
        if (presenceDetected) {
            DEBUG_PRINTLN("[ULTRASONIC] User left zone");
        }
        resetPresence();
    }
}

bool UltrasonicSensor::isPresenceConfirmed() {
    if (!presenceDetected) {
        return false;
    }
    
    unsigned long presenceTime = millis() - presenceStartTime;
    return presenceTime >= ULTRASONIC_PRESENCE_TIME;
}

float UltrasonicSensor::getDistance() {
    return getMedianFilteredDistance();
}

bool UltrasonicSensor::isUserInZone() {
    if (!bufferFilled) {
        return false;
    }
    
    float distance = getMedianFilteredDistance();
    return (distance >= ULTRASONIC_MIN_RANGE_CM && 
            distance <= ULTRASONIC_MAX_RANGE_CM);
}

void UltrasonicSensor::resetPresence() {
    presenceDetected = false;
    presenceStartTime = 0;
    lastStableDistance = 0;
}

unsigned long UltrasonicSensor::getPresenceTime() {
    if (!presenceDetected) {
        return 0;
    }
    return millis() - presenceStartTime;
}

