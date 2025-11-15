/**
 * AERAS - LED Indicator Controller Implementation
 */

#include "LEDController.h"

LEDController::LEDController(uint8_t yellow, uint8_t red, uint8_t green)
    : yellowPin(yellow), redPin(red), greenPin(green),
      currentState(LED_OFF), lastBlinkTime(0), blinkState(false) {
}

void LEDController::begin() {
    pinMode(yellowPin, OUTPUT);
    pinMode(redPin, OUTPUT);
    pinMode(greenPin, OUTPUT);
    
    allOff();
    
    DEBUG_PRINTLN("[LED] Initialized");
}

void LEDController::setLED(uint8_t pin, bool state) {
    digitalWrite(pin, state ? HIGH : LOW);
}

void LEDController::allOff() {
    setLED(yellowPin, false);
    setLED(redPin, false);
    setLED(greenPin, false);
}

void LEDController::update() {
    unsigned long currentTime = millis();
    
    // Handle blinking states
    if (currentState == LED_YELLOW_BLINK || 
        currentState == LED_RED_BLINK || 
        currentState == LED_GREEN_BLINK) {
        
        if (currentTime - lastBlinkTime >= 500) {  // 500ms blink interval
            blinkState = !blinkState;
            lastBlinkTime = currentTime;
            
            switch (currentState) {
                case LED_YELLOW_BLINK:
                    setLED(yellowPin, blinkState);
                    break;
                case LED_RED_BLINK:
                    setLED(redPin, blinkState);
                    break;
                case LED_GREEN_BLINK:
                    setLED(greenPin, blinkState);
                    break;
                default:
                    break;
            }
        }
    }
}

void LEDController::showOfferIncoming(bool blink) {
    allOff();
    
    if (blink) {
        currentState = LED_YELLOW_BLINK;
        blinkState = true;
        lastBlinkTime = millis();
        setLED(yellowPin, true);
    } else {
        currentState = LED_YELLOW_STEADY;
        setLED(yellowPin, true);
    }
    
    DEBUG_PRINTLN("[LED] Yellow - Offer Incoming");
}

void LEDController::showAccepted() {
    allOff();
    currentState = LED_GREEN_STEADY;
    setLED(greenPin, true);
    
    DEBUG_PRINTLN("[LED] Green - Ride Accepted");
}

void LEDController::showRejected() {
    allOff();
    currentState = LED_RED_STEADY;
    setLED(redPin, true);
    
    DEBUG_PRINTLN("[LED] Red - Ride Rejected");
}

void LEDController::showTimeout() {
    allOff();
    currentState = LED_RED_BLINK;
    blinkState = true;
    lastBlinkTime = millis();
    setLED(redPin, true);
    
    DEBUG_PRINTLN("[LED] Red Blink - Timeout");
}

void LEDController::clear() {
    allOff();
    currentState = LED_ALL_OFF;
    
    DEBUG_PRINTLN("[LED] All Off");
}

void LEDController::testSequence() {
    DEBUG_PRINTLN("[LED] Test sequence starting...");
    
    // Yellow
    allOff();
    setLED(yellowPin, true);
    delay(500);
    
    // Red
    allOff();
    setLED(redPin, true);
    delay(500);
    
    // Green
    allOff();
    setLED(greenPin, true);
    delay(500);
    
    // All on
    setLED(yellowPin, true);
    setLED(redPin, true);
    setLED(greenPin, true);
    delay(500);
    
    // All off
    allOff();
    
    DEBUG_PRINTLN("[LED] Test sequence complete");
}

