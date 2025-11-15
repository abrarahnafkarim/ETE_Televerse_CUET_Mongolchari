/**
 * AERAS - Buzzer Controller Implementation
 */

#include "BuzzerController.h"

BuzzerController::BuzzerController(uint8_t pin)
    : buzzerPin(pin), toneStartTime(0), toneDuration(0), toneActive(false) {
}

void BuzzerController::begin() {
    pinMode(buzzerPin, OUTPUT);
    digitalWrite(buzzerPin, LOW);
    
    DEBUG_PRINTLN("[BUZZER] Initialized");
}

void BuzzerController::startTone(uint16_t frequency, unsigned long duration) {
    tone(buzzerPin, frequency);
    toneStartTime = millis();
    toneDuration = duration;
    toneActive = true;
}

void BuzzerController::stopTone() {
    noTone(buzzerPin);
    digitalWrite(buzzerPin, LOW);
    toneActive = false;
}

void BuzzerController::update() {
    if (toneActive) {
        unsigned long currentTime = millis();
        if (currentTime - toneStartTime >= toneDuration) {
            stopTone();
        }
    }
}

void BuzzerController::beepConfirm() {
    startTone(BUZZER_FREQ_CONFIRM, BUZZER_DURATION_SHORT);
    DEBUG_PRINTLN("[BUZZER] Confirm beep");
}

void BuzzerController::beepError() {
    startTone(BUZZER_FREQ_ERROR, BUZZER_DURATION_LONG);
    DEBUG_PRINTLN("[BUZZER] Error beep");
}

void BuzzerController::beepOfferIncoming() {
    DEBUG_PRINTLN("[BUZZER] Offer incoming pattern");
    
    // Three short beeps
    for (int i = 0; i < 3; i++) {
        tone(buzzerPin, BUZZER_FREQ_OFFER);
        delay(100);
        noTone(buzzerPin);
        delay(100);
    }
}

void BuzzerController::beepAccepted() {
    DEBUG_PRINTLN("[BUZZER] Accepted pattern");
    
    // Two rising tones
    tone(buzzerPin, 1000);
    delay(150);
    tone(buzzerPin, 1500);
    delay(150);
    noTone(buzzerPin);
}

void BuzzerController::beepRejected() {
    DEBUG_PRINTLN("[BUZZER] Rejected pattern");
    
    // Descending tone
    tone(buzzerPin, 1000);
    delay(200);
    tone(buzzerPin, 500);
    delay(200);
    noTone(buzzerPin);
}

void BuzzerController::test() {
    DEBUG_PRINTLN("[BUZZER] Test sequence");
    
    // Test different frequencies
    tone(buzzerPin, 500);
    delay(200);
    tone(buzzerPin, 1000);
    delay(200);
    tone(buzzerPin, 1500);
    delay(200);
    noTone(buzzerPin);
}

