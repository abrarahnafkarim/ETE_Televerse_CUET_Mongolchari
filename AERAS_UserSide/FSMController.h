/**
 * AERAS - Finite State Machine Controller
 * 
 * Manages all system states and transitions:
 * - IDLE
 * - USER_DETECTED
 * - PRIVILEGE_CHECK
 * - WAITING_FOR_CONFIRM
 * - SENDING_REQUEST
 * - WAITING_FOR_BACKEND
 * - OFFER_INCOMING
 * - RIDE_ACCEPTED
 * - RIDE_REJECTED
 * - ERROR_STATE
 * 
 * Coordinates all hardware modules and handles timing constraints
 */

#ifndef FSM_CONTROLLER_H
#define FSM_CONTROLLER_H

#include <Arduino.h>
#include <Preferences.h>
#include "config.h"
#include "UltrasonicSensor.h"
#include "PrivilegeSensor.h"
#include "ButtonManager.h"
#include "OLEDDisplay.h"
#include "LEDController.h"
#include "BuzzerController.h"
#include "CommunicationManager.h"

enum SystemState {
    STATE_IDLE,
    STATE_USER_DETECTED,
    STATE_PRIVILEGE_CHECK,
    STATE_WAITING_FOR_CONFIRM,
    STATE_SENDING_REQUEST,
    STATE_WAITING_FOR_BACKEND,
    STATE_OFFER_INCOMING,
    STATE_RIDE_ACCEPTED,
    STATE_RIDE_REJECTED,
    STATE_ERROR_STATE
};

class FSMController {
private:
    // Hardware modules
    UltrasonicSensor* ultrasonic;
    PrivilegeSensor* privilegeSensor;
    ButtonManager* button;
    OLEDDisplay* display;
    LEDController* leds;
    BuzzerController* buzzer;
    CommunicationManager* comm;
    
    // NVS storage for state persistence
    Preferences preferences;
    
    // Current state
    SystemState currentState;
    SystemState previousState;
    
    // Configuration
    String blockId;
    String destination;
    uint8_t currentDestinationIndex;
    
    // Timing
    unsigned long stateEntryTime;
    unsigned long offerStartTime;
    
    // Flags
    bool privilegeVerified;
    bool errorOccurred;
    String errorMessage;
    
    /**
     * State transition with logging and NVS save
     */
    void changeState(SystemState newState);
    
    /**
     * Get time in current state (ms)
     */
    unsigned long getStateTime();
    
    /**
     * Load configuration from NVS
     */
    void loadConfig();
    
    /**
     * Save current state to NVS (for power failure recovery)
     */
    void saveState();
    
    /**
     * Cycle to next destination
     */
    void selectNextDestination();
    
    // State handler functions
    void handleIdle();
    void handleUserDetected();
    void handlePrivilegeCheck();
    void handleWaitingForConfirm();
    void handleSendingRequest();
    void handleWaitingForBackend();
    void handleOfferIncoming();
    void handleRideAccepted();
    void handleRideRejected();
    void handleError();
    
    /**
     * Reset to idle state
     */
    void resetToIdle();

public:
    /**
     * Constructor
     */
    FSMController(UltrasonicSensor* us, PrivilegeSensor* ps, ButtonManager* btn,
                  OLEDDisplay* disp, LEDController* led, BuzzerController* buzz,
                  CommunicationManager* cm);
    
    /**
     * Initialize FSM
     */
    void begin();
    
    /**
     * Update FSM (call in loop)
     */
    void update();
    
    /**
     * Get current state
     */
    SystemState getState();
    
    /**
     * Trigger error state
     */
    void triggerError(const char* message);
    
    /**
     * Get block ID
     */
    String getBlockId();
    
    /**
     * Get destination
     */
    String getDestination();
};

#endif // FSM_CONTROLLER_H

