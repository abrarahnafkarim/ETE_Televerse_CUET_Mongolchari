/**
 * AERAS - LED Indicator Controller
 * 
 * Features:
 * - Yellow LED: Offer incoming
 * - Red LED: Rejected / No puller available
 * - Green LED: Accepted
 * - Blinking patterns for different states
 * - State transition handling
 */

#ifndef LED_CONTROLLER_H
#define LED_CONTROLLER_H

#include <Arduino.h>
#include "config.h"

enum LEDState {
    LED_OFF,
    LED_YELLOW_STEADY,
    LED_YELLOW_BLINK,
    LED_RED_STEADY,
    LED_RED_BLINK,
    LED_GREEN_STEADY,
    LED_GREEN_BLINK,
    LED_ALL_OFF
};

class LEDController {
private:
    uint8_t yellowPin;
    uint8_t redPin;
    uint8_t greenPin;
    
    LEDState currentState;
    unsigned long lastBlinkTime;
    bool blinkState;
    
    /**
     * Set individual LED state
     */
    void setLED(uint8_t pin, bool state);
    
    /**
     * Turn off all LEDs
     */
    void allOff();

public:
    /**
     * Constructor
     */
    LEDController(uint8_t yellow, uint8_t red, uint8_t green);
    
    /**
     * Initialize LEDs
     */
    void begin();
    
    /**
     * Update LED state (call in loop for blinking)
     */
    void update();
    
    /**
     * Show offer incoming (yellow LED)
     * @param blink true for blinking, false for steady
     */
    void showOfferIncoming(bool blink = true);
    
    /**
     * Show ride accepted (green LED)
     */
    void showAccepted();
    
    /**
     * Show ride rejected (red LED)
     */
    void showRejected();
    
    /**
     * Show timeout (red LED blinking)
     */
    void showTimeout();
    
    /**
     * Turn off all LEDs
     */
    void clear();
    
    /**
     * Test sequence (cycles through all LEDs)
     */
    void testSequence();
};

#endif // LED_CONTROLLER_H

