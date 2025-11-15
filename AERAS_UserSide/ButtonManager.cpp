/**
 * AERAS - Button Confirmation Manager Implementation
 */

#include "ButtonManager.h"

ButtonManager::ButtonManager(uint8_t pin, bool activeLow) 
    : buttonPin(pin), activeLow(activeLow), lastStableState(false),
      currentRawState(false), lastDebounceTime(0), pressStartTime(0),
      pressInProgress(false), lastPressTime(0), privilegeVerified(false),
      userInZone(false) {
}

void ButtonManager::begin() {
    if (activeLow) {
        pinMode(buttonPin, INPUT_PULLUP);
    } else {
        pinMode(buttonPin, INPUT);
    }
    
    // Read initial state
    currentRawState = digitalRead(buttonPin);
    if (activeLow) {
        currentRawState = !currentRawState;
    }
    lastStableState = currentRawState;
    
    DEBUG_PRINTLN("[BUTTON] Initialized");
}

bool ButtonManager::readDebouncedState() {
    bool rawState = digitalRead(buttonPin);
    
    // Invert if active low
    if (activeLow) {
        rawState = !rawState;
    }
    
    // Check if state changed
    if (rawState != currentRawState) {
        currentRawState = rawState;
        lastDebounceTime = millis();
    }
    
    // Update stable state after debounce period
    if (millis() - lastDebounceTime >= BUTTON_DEBOUNCE_MS) {
        if (currentRawState != lastStableState) {
            lastStableState = currentRawState;
            DEBUG_PRINTF("[BUTTON] State changed: %s\n", 
                       lastStableState ? "PRESSED" : "RELEASED");
        }
    }
    
    return lastStableState;
}

void ButtonManager::update() {
    // Check if user moved away
    if (!userInZone && pressInProgress) {
        DEBUG_PRINTLN("[BUTTON] User left zone - resetting");
        reset();
        return;
    }
    
    bool buttonPressed = readDebouncedState();
    unsigned long currentTime = millis();
    
    if (buttonPressed && !pressInProgress) {
        // Button just pressed
        
        // Check if privilege verified
        if (!privilegeVerified) {
            DEBUG_PRINTLN("[BUTTON] ✗ Press rejected - no privilege");
            return;
        }
        
        // Check double-press lockout
        if (lastPressTime > 0 && 
            (currentTime - lastPressTime < BUTTON_DOUBLE_PRESS_LOCKOUT)) {
            DEBUG_PRINTLN("[BUTTON] ✗ Press rejected - double-press lockout");
            return;
        }
        
        // Valid press started
        pressInProgress = true;
        pressStartTime = currentTime;
        DEBUG_PRINTLN("[BUTTON] Press started");
        
    } else if (!buttonPressed && pressInProgress) {
        // Button released
        unsigned long pressDuration = currentTime - pressStartTime;
        
        if (pressDuration >= BUTTON_HOLD_TIMEOUT) {
            DEBUG_PRINTF("[BUTTON] ✗ Press rejected - hold timeout (%lu ms)\n", 
                       pressDuration);
        } else {
            DEBUG_PRINTF("[BUTTON] ✓ Valid press (%lu ms)\n", pressDuration);
            lastPressTime = currentTime;
        }
        
        pressInProgress = false;
    }
}

void ButtonManager::setPrivilegeVerified(bool verified) {
    privilegeVerified = verified;
    DEBUG_PRINTF("[BUTTON] Privilege status: %s\n", 
               verified ? "VERIFIED" : "NOT VERIFIED");
}

void ButtonManager::setUserInZone(bool inZone) {
    if (userInZone && !inZone) {
        DEBUG_PRINTLN("[BUTTON] User left zone");
        reset();
    }
    userInZone = inZone;
}

bool ButtonManager::wasPressed() {
    // Check if a valid press was just completed
    if (!pressInProgress && lastPressTime > 0) {
        unsigned long currentTime = millis();
        unsigned long timeSincePress = currentTime - lastPressTime;
        
        // Return true only once (within small window after release)
        if (timeSincePress < 50) {  // 50ms window
            return true;
        }
    }
    
    return false;
}

bool ButtonManager::isHeld() {
    return pressInProgress;
}

bool ButtonManager::isHoldTimeout() {
    if (!pressInProgress) {
        return false;
    }
    
    unsigned long currentTime = millis();
    unsigned long pressDuration = currentTime - pressStartTime;
    
    return pressDuration >= BUTTON_HOLD_TIMEOUT;
}

void ButtonManager::reset() {
    pressInProgress = false;
    pressStartTime = 0;
    // Don't reset lastPressTime to maintain double-press lockout
    privilegeVerified = false;
}

bool ButtonManager::isLockedOut() {
    if (lastPressTime == 0) {
        return false;
    }
    
    unsigned long currentTime = millis();
    return (currentTime - lastPressTime < BUTTON_DOUBLE_PRESS_LOCKOUT);
}

