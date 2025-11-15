/**
 * AERAS - Button Confirmation Manager
 * 
 * Features:
 * - Debouncing (25ms)
 * - Double-press lockout (2 seconds)
 * - Press-and-hold timeout (5 seconds)
 * - Privilege-required validation
 * - Location change detection
 */

#ifndef BUTTON_MANAGER_H
#define BUTTON_MANAGER_H

#include <Arduino.h>
#include "config.h"

class ButtonManager {
private:
    uint8_t buttonPin;
    bool activeLow;
    
    // Debouncing state
    bool lastStableState;
    bool currentRawState;
    unsigned long lastDebounceTime;
    
    // Press tracking
    unsigned long pressStartTime;
    bool pressInProgress;
    unsigned long lastPressTime;
    
    // Validation flags
    bool privilegeVerified;
    bool userInZone;
    
    /**
     * Read debounced button state
     * @return true if button is pressed (after debounce)
     */
    bool readDebouncedState();

public:
    /**
     * Constructor
     * @param pin Button pin
     * @param activeLow true if button pulls pin LOW when pressed
     */
    ButtonManager(uint8_t pin, bool activeLow = true);
    
    /**
     * Initialize button
     */
    void begin();
    
    /**
     * Update button state (call in loop)
     */
    void update();
    
    /**
     * Set privilege verification status
     * Button only accepts presses when privilege is verified
     * @param verified true if user has privilege
     */
    void setPrivilegeVerified(bool verified);
    
    /**
     * Set user zone status
     * Button resets if user moves out of zone
     * @param inZone true if user is in detection zone
     */
    void setUserInZone(bool inZone);
    
    /**
     * Check if valid button press occurred
     * Returns true only once per valid press
     * @return true if button was validly pressed
     */
    bool wasPressed();
    
    /**
     * Check if button is currently held
     * @return true if button is being held down
     */
    bool isHeld();
    
    /**
     * Check if button hold has timed out (>5 seconds)
     * @return true if held too long
     */
    bool isHoldTimeout();
    
    /**
     * Reset button state
     */
    void reset();
    
    /**
     * Check if button is locked out (double-press protection)
     * @return true if within lockout period
     */
    bool isLockedOut();
};

#endif // BUTTON_MANAGER_H

