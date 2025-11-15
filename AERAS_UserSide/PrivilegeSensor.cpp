/**
 * AERAS - Privilege Verification Sensor Implementation
 */

#include "PrivilegeSensor.h"

PrivilegeSensor::PrivilegeSensor(uint8_t pin) 
    : sensorPin(pin), lastState(false), lastRiseTime(0), 
      intervalIndex(0), pulseCount(0), dcFilteredValue(0), 
      lastRawValue(0), checkStartTime(0), checkInProgress(false),
      verificationResult(false) {
    // Initialize pulse interval buffer
    for (uint8_t i = 0; i < 10; i++) {
        pulseIntervals[i] = 0;
    }
}

void PrivilegeSensor::begin() {
    pinMode(sensorPin, INPUT);
    
    // Configure ADC for better resolution
    analogReadResolution(12);  // 12-bit ADC (0-4095)
    analogSetAttenuation(ADC_11db);  // Full range 0-3.3V
    
    // Initial reading for DC filter
    lastRawValue = analogRead(sensorPin);
    dcFilteredValue = lastRawValue;
    
    DEBUG_PRINTLN("[PRIVILEGE] Initialized");
}

uint16_t PrivilegeSensor::readFilteredValue() {
    uint16_t rawValue = analogRead(sensorPin);
    
    // Apply high-pass DC removal filter: y[n] = alpha * (y[n-1] + x[n] - x[n-1])
    // This removes constant (DC) component like sunlight
    dcFilteredValue = PRIVILEGE_DC_FILTER_ALPHA * (dcFilteredValue + rawValue - lastRawValue);
    lastRawValue = rawValue;
    
    return abs(dcFilteredValue);
}

bool PrivilegeSensor::detectPulse() {
    uint16_t filteredValue = readFilteredValue();
    
    // Detect rising edge
    bool currentState = filteredValue > PRIVILEGE_THRESHOLD;
    
    if (currentState && !lastState) {
        // Rising edge detected
        unsigned long currentTime = micros();
        
        if (lastRiseTime > 0) {
            // Calculate interval since last pulse
            unsigned long interval = currentTime - lastRiseTime;
            
            // Store interval (in microseconds)
            pulseIntervals[intervalIndex] = interval;
            intervalIndex = (intervalIndex + 1) % 10;
            pulseCount++;
            
            DEBUG_PRINTF("[PRIVILEGE] Pulse detected, interval: %lu us\n", interval);
        }
        
        lastRiseTime = currentTime;
        lastState = true;
        return true;
    } else if (!currentState && lastState) {
        // Falling edge
        lastState = false;
    }
    
    return false;
}

float PrivilegeSensor::calculateFrequency() {
    if (pulseCount < 2) {
        return 0.0;
    }
    
    // Calculate average interval from stored pulses
    unsigned long sumIntervals = 0;
    uint8_t validCount = 0;
    uint8_t maxSamples = min((uint8_t)(pulseCount - 1), (uint8_t)10);
    
    for (uint8_t i = 0; i < maxSamples; i++) {
        if (pulseIntervals[i] > 0) {
            sumIntervals += pulseIntervals[i];
            validCount++;
        }
    }
    
    if (validCount == 0) {
        return 0.0;
    }
    
    // Average interval in microseconds
    float avgInterval = (float)sumIntervals / validCount;
    
    // Convert to frequency: f = 1 / T
    // avgInterval is in microseconds, so f = 1,000,000 / avgInterval
    float frequency = 1000000.0 / avgInterval;
    
    return frequency;
}

bool PrivilegeSensor::isFrequencyValid(float freq) {
    // Check if frequency is within tolerance of target
    float minFreq = PRIVILEGE_TARGET_FREQUENCY - PRIVILEGE_FREQ_TOLERANCE;
    float maxFreq = PRIVILEGE_TARGET_FREQUENCY + PRIVILEGE_FREQ_TOLERANCE;
    
    return (freq >= minFreq && freq <= maxFreq);
}

void PrivilegeSensor::startVerification() {
    reset();
    checkInProgress = true;
    checkStartTime = millis();
    
    DEBUG_PRINTLN("[PRIVILEGE] Starting verification...");
}

void PrivilegeSensor::update() {
    if (!checkInProgress) {
        return;
    }
    
    unsigned long currentTime = millis();
    unsigned long elapsedTime = currentTime - checkStartTime;
    
    // Detect pulses
    detectPulse();
    
    // Check if we have enough pulses to verify
    if (pulseCount >= PRIVILEGE_MIN_PULSES) {
        float frequency = calculateFrequency();
        
        DEBUG_PRINTF("[PRIVILEGE] Detected frequency: %.2f Hz (target: %.2f Hz)\n", 
                   frequency, PRIVILEGE_TARGET_FREQUENCY);
        
        if (isFrequencyValid(frequency)) {
            // Privilege verified!
            verificationResult = true;
            checkInProgress = false;
            DEBUG_PRINTLN("[PRIVILEGE] ✓ Verification SUCCESS");
        } else {
            // Wrong frequency detected
            if (elapsedTime >= PRIVILEGE_CHECK_DURATION) {
                verificationResult = false;
                checkInProgress = false;
                DEBUG_PRINTF("[PRIVILEGE] ✗ Wrong frequency: %.2f Hz\n", frequency);
            }
        }
    } else if (elapsedTime >= PRIVILEGE_CHECK_DURATION) {
        // Timeout - no valid pulses detected
        verificationResult = false;
        checkInProgress = false;
        
        if (pulseCount == 0) {
            DEBUG_PRINTLN("[PRIVILEGE] ✗ No laser detected");
        } else {
            DEBUG_PRINTF("[PRIVILEGE] ✗ Insufficient pulses: %d\n", pulseCount);
        }
    }
}

bool PrivilegeSensor::isVerificationComplete() {
    return !checkInProgress && (checkStartTime > 0);
}

bool PrivilegeSensor::isVerified() {
    return verificationResult;
}

void PrivilegeSensor::reset() {
    lastState = false;
    lastRiseTime = 0;
    intervalIndex = 0;
    pulseCount = 0;
    checkStartTime = 0;
    checkInProgress = false;
    verificationResult = false;
    
    for (uint8_t i = 0; i < 10; i++) {
        pulseIntervals[i] = 0;
    }
}

uint16_t PrivilegeSensor::getRawValue() {
    return analogRead(sensorPin);
}

float PrivilegeSensor::getDetectedFrequency() {
    return calculateFrequency();
}

bool PrivilegeSensor::isSunlightDetected() {
    // If raw value is consistently high but no pulses detected, likely sunlight
    uint16_t rawValue = analogRead(sensorPin);
    
    // High DC component with no AC signal indicates constant light (sunlight)
    return (rawValue > PRIVILEGE_THRESHOLD * 2 && pulseCount < 2);
}

