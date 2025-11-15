/**
 * AERAS - Buzzer Controller
 * 
 * Features:
 * - Short beep: Confirmation
 * - Long beep: Error
 * - Pattern sequences for different events
 * - Non-blocking tone generation
 */

#ifndef BUZZER_CONTROLLER_H
#define BUZZER_CONTROLLER_H

#include <Arduino.h>
#include "config.h"

class BuzzerController {
private:
    uint8_t buzzerPin;
    unsigned long toneStartTime;
    unsigned long toneDuration;
    bool toneActive;
    
    /**
     * Start tone
     */
    void startTone(uint16_t frequency, unsigned long duration);
    
    /**
     * Stop tone
     */
    void stopTone();

public:
    /**
     * Constructor
     */
    BuzzerController(uint8_t pin);
    
    /**
     * Initialize buzzer
     */
    void begin();
    
    /**
     * Update buzzer state (call in loop)
     */
    void update();
    
    /**
     * Short confirmation beep
     */
    void beepConfirm();
    
    /**
     * Long error beep
     */
    void beepError();
    
    /**
     * Offer incoming pattern (3 short beeps)
     */
    void beepOfferIncoming();
    
    /**
     * Ride accepted pattern (2 rising tones)
     */
    void beepAccepted();
    
    /**
     * Ride rejected pattern (descending tone)
     */
    void beepRejected();
    
    /**
     * Test buzzer
     */
    void test();
};

#endif // BUZZER_CONTROLLER_H

