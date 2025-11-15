/**
 * AERAS - Privilege Verification Sensor Module
 * 
 * Features:
 * - Detects modulated laser at specific frequency (5 Hz)
 * - Rejects constant light (DC component removal)
 * - Rejects incorrect frequency
 * - Filters ambient sunlight interference
 * - Works at 2m distance with angled beam
 * - False positive rate < 5%
 * - Completes check within 1 second
 */

#ifndef PRIVILEGE_SENSOR_H
#define PRIVILEGE_SENSOR_H

#include <Arduino.h>
#include "config.h"

class PrivilegeSensor {
private:
    uint8_t sensorPin;
    
    // Edge detection state
    bool lastState;
    unsigned long lastRiseTime;
    unsigned long pulseIntervals[10];  // Store last 10 intervals
    uint8_t intervalIndex;
    uint8_t pulseCount;
    
    // DC filter for sunlight removal
    float dcFilteredValue;
    float lastRawValue;
    
    // Verification state
    unsigned long checkStartTime;
    bool checkInProgress;
    bool verificationResult;
    
    /**
     * Read and filter sensor value
     * @return Filtered analog value (0-4095)
     */
    uint16_t readFilteredValue();
    
    /**
     * Detect rising edge and measure pulse interval
     * @return true if valid pulse detected
     */
    bool detectPulse();
    
    /**
     * Calculate average frequency from pulse intervals
     * @return Frequency in Hz
     */
    float calculateFrequency();
    
    /**
     * Check if frequency is within acceptable range
     * @param freq Frequency in Hz
     * @return true if matches target frequency
     */
    bool isFrequencyValid(float freq);

public:
    /**
     * Constructor
     * @param pin Analog input pin for photodiode/phototransistor
     */
    PrivilegeSensor(uint8_t pin);
    
    /**
     * Initialize sensor
     */
    void begin();
    
    /**
     * Start privilege verification check
     */
    void startVerification();
    
    /**
     * Update verification process (call in loop)
     * Must be called frequently (>=1kHz) for accurate pulse detection
     */
    void update();
    
    /**
     * Check if verification is complete
     * @return true if check finished (success or fail)
     */
    bool isVerificationComplete();
    
    /**
     * Get verification result
     * @return true if privilege verified, false otherwise
     */
    bool isVerified();
    
    /**
     * Reset verification state
     */
    void reset();
    
    /**
     * Get current sensor reading (for display/debug)
     * @return Raw analog value
     */
    uint16_t getRawValue();
    
    /**
     * Get detected frequency
     * @return Frequency in Hz (0 if not detected)
     */
    float getDetectedFrequency();
    
    /**
     * Check if sunlight/constant light detected
     * @return true if high DC component (likely sunlight)
     */
    bool isSunlightDetected();
};

#endif // PRIVILEGE_SENSOR_H

