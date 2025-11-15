/**
 * AERAS - Finite State Machine Controller Implementation
 */

#include "FSMController.h"

FSMController::FSMController(UltrasonicSensor* us, PrivilegeSensor* ps, ButtonManager* btn,
                           OLEDDisplay* disp, LEDController* led, BuzzerController* buzz,
                           CommunicationManager* cm)
    : ultrasonic(us), privilegeSensor(ps), button(btn), display(disp),
      leds(led), buzzer(buzz), comm(cm),
      currentState(STATE_IDLE), previousState(STATE_IDLE),
      currentDestinationIndex(0), stateEntryTime(0), offerStartTime(0),
      privilegeVerified(false), errorOccurred(false), errorMessage("") {
}

void FSMController::begin() {
    DEBUG_PRINTLN("[FSM] Initializing...");
    
    // Initialize NVS
    preferences.begin(NVS_NAMESPACE, false);
    
    // Load configuration
    loadConfig();
    
    // Start in IDLE state
    changeState(STATE_IDLE);
    
    DEBUG_PRINTLN("[FSM] ✓ Initialized");
}

void FSMController::loadConfig() {
    // Load block ID
    blockId = preferences.getString(NVS_KEY_BLOCK_ID, DEFAULT_BLOCK_ID);
    
    // Load last destination
    destination = preferences.getString(NVS_KEY_DESTINATION, AVAILABLE_DESTINATIONS[0]);
    
    // Find destination index
    for (uint8_t i = 0; i < NUM_DESTINATIONS; i++) {
        if (destination == AVAILABLE_DESTINATIONS[i]) {
            currentDestinationIndex = i;
            break;
        }
    }
    
    DEBUG_PRINTF("[FSM] Block ID: %s\n", blockId.c_str());
    DEBUG_PRINTF("[FSM] Destination: %s\n", destination.c_str());
}

void FSMController::saveState() {
    preferences.putInt(NVS_KEY_STATE, (int)currentState);
    preferences.putString(NVS_KEY_DESTINATION, destination.c_str());
}

void FSMController::changeState(SystemState newState) {
    if (newState == currentState) {
        return;
    }
    
    DEBUG_PRINTF("[FSM] State transition: %d -> %d\n", currentState, newState);
    
    previousState = currentState;
    currentState = newState;
    stateEntryTime = millis();
    
    // Save state for power failure recovery
    saveState();
}

unsigned long FSMController::getStateTime() {
    return millis() - stateEntryTime;
}

void FSMController::selectNextDestination() {
    currentDestinationIndex = (currentDestinationIndex + 1) % NUM_DESTINATIONS;
    destination = AVAILABLE_DESTINATIONS[currentDestinationIndex];
    
    DEBUG_PRINTF("[FSM] Destination changed to: %s\n", destination.c_str());
}

void FSMController::resetToIdle() {
    // Reset all modules
    ultrasonic->resetPresence();
    privilegeSensor->reset();
    button->reset();
    leds->clear();
    
    privilegeVerified = false;
    errorOccurred = false;
    errorMessage = "";
    
    changeState(STATE_IDLE);
}

void FSMController::handleIdle() {
    // Show idle screen
    display->showIdle();
    leds->clear();
    
    // Check for user detection
    if (ultrasonic->isUserInZone()) {
        changeState(STATE_USER_DETECTED);
        buzzer->beepConfirm();
    }
}

void FSMController::handleUserDetected() {
    // Update display with distance
    float distance = ultrasonic->getDistance();
    display->showUserDetected(distance);
    
    // Check if user moved away
    if (!ultrasonic->isUserInZone()) {
        DEBUG_PRINTLN("[FSM] User moved away during detection");
        resetToIdle();
        return;
    }
    
    // Check if presence confirmed (3 seconds stable)
    if (ultrasonic->isPresenceConfirmed()) {
        DEBUG_PRINTLN("[FSM] ✓ User presence confirmed");
        changeState(STATE_PRIVILEGE_CHECK);
        privilegeSensor->startVerification();
    }
}

void FSMController::handlePrivilegeCheck() {
    // Show privilege check screen
    display->showPrivilegeCheck();
    
    // Check if user moved away
    if (!ultrasonic->isUserInZone()) {
        DEBUG_PRINTLN("[FSM] User moved away during privilege check");
        resetToIdle();
        return;
    }
    
    // Check for timeout
    if (getStateTime() > PRIVILEGE_CHECK_DURATION + 500) {
        // Timeout - no privilege detected
        DEBUG_PRINTLN("[FSM] ✗ Privilege check timeout");
        display->showPrivilegeResult(false, "No laser detected");
        buzzer->beepError();
        delay(2000);
        resetToIdle();
        return;
    }
    
    // Check if verification complete
    if (privilegeSensor->isVerificationComplete()) {
        bool verified = privilegeSensor->isVerified();
        privilegeVerified = verified;
        
        if (verified) {
            DEBUG_PRINTLN("[FSM] ✓ Privilege VERIFIED");
            display->showPrivilegeResult(true);
            buzzer->beepConfirm();
            button->setPrivilegeVerified(true);
            delay(1000);
            changeState(STATE_WAITING_FOR_CONFIRM);
        } else {
            DEBUG_PRINTLN("[FSM] ✗ Privilege DENIED");
            
            // Check reason for denial
            if (privilegeSensor->isSunlightDetected()) {
                display->showPrivilegeResult(false, "Sunlight detected");
            } else {
                float freq = privilegeSensor->getDetectedFrequency();
                if (freq > 0) {
                    char msg[32];
                    snprintf(msg, sizeof(msg), "Wrong freq: %.1f Hz", freq);
                    display->showPrivilegeResult(false, msg);
                } else {
                    display->showPrivilegeResult(false, "No valid laser");
                }
            }
            
            buzzer->beepError();
            delay(3000);
            resetToIdle();
        }
    }
}

void FSMController::handleWaitingForConfirm() {
    // Show confirmation screen
    display->showWaitingForConfirm(destination.c_str());
    
    // Update button with user zone status
    button->setUserInZone(ultrasonic->isUserInZone());
    
    // Check if user moved away
    if (!ultrasonic->isUserInZone()) {
        DEBUG_PRINTLN("[FSM] User moved away before confirmation");
        resetToIdle();
        return;
    }
    
    // Check for button press
    if (button->wasPressed()) {
        DEBUG_PRINTLN("[FSM] ✓ Button pressed - sending request");
        buzzer->beepConfirm();
        changeState(STATE_SENDING_REQUEST);
    }
    
    // Check for button hold timeout
    if (button->isHoldTimeout()) {
        DEBUG_PRINTLN("[FSM] ✗ Button hold timeout");
        buzzer->beepError();
        resetToIdle();
    }
    
    // Timeout after 30 seconds of no action
    if (getStateTime() > 30000) {
        DEBUG_PRINTLN("[FSM] ✗ Confirmation timeout");
        display->showError("Timeout - Please retry");
        buzzer->beepError();
        delay(2000);
        resetToIdle();
    }
}

void FSMController::handleSendingRequest() {
    display->showRequestSent();
    
    // Check network connection
    if (!comm->isMQTTConnected()) {
        DEBUG_PRINTLN("[FSM] ✗ No network connection");
        display->showError("Network error");
        buzzer->beepError();
        delay(2000);
        resetToIdle();
        return;
    }
    
    // Send ride request
    bool success = comm->sendRideRequest(blockId.c_str(), destination.c_str(), 
                                        privilegeVerified);
    
    if (success) {
        DEBUG_PRINTLN("[FSM] ✓ Request sent to backend");
        changeState(STATE_WAITING_FOR_BACKEND);
    } else {
        DEBUG_PRINTLN("[FSM] ✗ Failed to send request");
        
        // Retry a few times
        if (getStateTime() < 5000) {
            delay(1000);
            return;  // Stay in this state and try again
        } else {
            display->showError("Send failed");
            buzzer->beepError();
            delay(2000);
            resetToIdle();
        }
    }
}

void FSMController::handleWaitingForBackend() {
    display->showRequestSent();
    
    // Check for backend status update
    if (comm->hasStatusUpdate()) {
        BackendStatus status = comm->getStatus();
        comm->clearStatusUpdate();
        
        switch (status) {
            case STATUS_INCOMING_OFFER:
                DEBUG_PRINTLN("[FSM] Offer incoming from backend");
                changeState(STATE_OFFER_INCOMING);
                offerStartTime = millis();
                break;
                
            case STATUS_ACCEPTED:
                DEBUG_PRINTLN("[FSM] Ride accepted by backend");
                changeState(STATE_RIDE_ACCEPTED);
                break;
                
            case STATUS_REJECTED:
                DEBUG_PRINTLN("[FSM] Ride rejected by backend");
                changeState(STATE_RIDE_REJECTED);
                break;
                
            case STATUS_TIMEOUT:
                DEBUG_PRINTLN("[FSM] Backend timeout");
                changeState(STATE_RIDE_REJECTED);
                break;
                
            case STATUS_ERROR:
                DEBUG_PRINTLN("[FSM] Backend error");
                triggerError("Backend error");
                break;
                
            default:
                break;
        }
    }
    
    // Check for offer timeout (60 seconds)
    if (getStateTime() > OFFER_TIMEOUT_MS) {
        DEBUG_PRINTLN("[FSM] ✗ Offer timeout - no response from backend");
        changeState(STATE_RIDE_REJECTED);
    }
}

void FSMController::handleOfferIncoming() {
    display->showOfferIncoming();
    leds->showOfferIncoming(true);  // Blink yellow LED
    
    // Play offer sound (once when entering state)
    if (previousState != STATE_OFFER_INCOMING) {
        buzzer->beepOfferIncoming();
    }
    
    // Check for status update
    if (comm->hasStatusUpdate()) {
        BackendStatus status = comm->getStatus();
        comm->clearStatusUpdate();
        
        if (status == STATUS_ACCEPTED) {
            DEBUG_PRINTLN("[FSM] Offer accepted");
            changeState(STATE_RIDE_ACCEPTED);
        } else if (status == STATUS_REJECTED || status == STATUS_TIMEOUT) {
            DEBUG_PRINTLN("[FSM] Offer rejected/timeout");
            changeState(STATE_RIDE_REJECTED);
        }
    }
    
    // Timeout check
    unsigned long offerTime = millis() - offerStartTime;
    if (offerTime > OFFER_TIMEOUT_MS) {
        DEBUG_PRINTLN("[FSM] ✗ Offer timeout");
        changeState(STATE_RIDE_REJECTED);
    }
}

void FSMController::handleRideAccepted() {
    display->showRideAccepted();
    leds->showAccepted();
    
    // Play acceptance sound (once)
    if (previousState != STATE_RIDE_ACCEPTED) {
        buzzer->beepAccepted();
    }
    
    // Stay in this state for 5 seconds, then reset
    if (getStateTime() > 5000) {
        DEBUG_PRINTLN("[FSM] Ride accepted - returning to idle");
        resetToIdle();
    }
}

void FSMController::handleRideRejected() {
    const char* reason = "No rickshaw available";
    
    if (comm->getStatus() == STATUS_TIMEOUT) {
        reason = "Request timeout";
    }
    
    display->showRideRejected(reason);
    leds->showTimeout();  // Blink red LED
    
    // Play rejection sound (once)
    if (previousState != STATE_RIDE_REJECTED) {
        buzzer->beepRejected();
    }
    
    // Stay in this state for 5 seconds, then reset
    if (getStateTime() > 5000) {
        DEBUG_PRINTLN("[FSM] Ride rejected - returning to idle");
        resetToIdle();
    }
}

void FSMController::handleError() {
    display->showError(errorMessage.c_str());
    leds->showRejected();
    
    // Play error sound (once)
    if (previousState != STATE_ERROR_STATE) {
        buzzer->beepError();
    }
    
    // Stay in error state for 3 seconds, then reset
    if (getStateTime() > 3000) {
        DEBUG_PRINTLN("[FSM] Error state timeout - returning to idle");
        resetToIdle();
    }
}

void FSMController::update() {
    // Handle current state
    switch (currentState) {
        case STATE_IDLE:
            handleIdle();
            break;
            
        case STATE_USER_DETECTED:
            handleUserDetected();
            break;
            
        case STATE_PRIVILEGE_CHECK:
            handlePrivilegeCheck();
            break;
            
        case STATE_WAITING_FOR_CONFIRM:
            handleWaitingForConfirm();
            break;
            
        case STATE_SENDING_REQUEST:
            handleSendingRequest();
            break;
            
        case STATE_WAITING_FOR_BACKEND:
            handleWaitingForBackend();
            break;
            
        case STATE_OFFER_INCOMING:
            handleOfferIncoming();
            break;
            
        case STATE_RIDE_ACCEPTED:
            handleRideAccepted();
            break;
            
        case STATE_RIDE_REJECTED:
            handleRideRejected();
            break;
            
        case STATE_ERROR_STATE:
            handleError();
            break;
    }
}

SystemState FSMController::getState() {
    return currentState;
}

void FSMController::triggerError(const char* message) {
    errorOccurred = true;
    errorMessage = message;
    changeState(STATE_ERROR_STATE);
}

String FSMController::getBlockId() {
    return blockId;
}

String FSMController::getDestination() {
    return destination;
}

