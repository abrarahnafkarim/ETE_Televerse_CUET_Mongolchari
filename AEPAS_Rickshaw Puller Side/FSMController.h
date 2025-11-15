/*
 * FSMController.h
 * Finite State Machine controller for ride workflow
 */

#ifndef FSM_CONTROLLER_H
#define FSM_CONTROLLER_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include "Config.h"
#include "GPSManager.h"
#include "CommManager.h"
#include "UIManager.h"
#include "PointsManager.h"
#include "LocalStore.h"

class FSMController {
public:
    FSMController(GPSManager& gps, CommManager& comm, UIManager& ui, 
                 PointsManager& points, LocalStore& store);
    
    void begin();
    void update();
    
    // State management
    SystemState getCurrentState() const;
    void setState(SystemState newState);
    
    // Event handlers
    void handleRideNotification(const char* payload);
    void handleAcceptButton();
    void handleRejectButton();
    void handlePickupButton();
    void handleDropButton();
    
    // State checkers
    bool isWithinPickupRange();
    bool isWithinDropRange();
    bool shouldAutoConfirmPickup();
    bool shouldAutoConfirmDrop();
    
    // Timeout management
    bool hasRideTimedOut();
    
private:
    GPSManager& gpsManager;
    CommManager& commManager;
    UIManager& uiManager;
    PointsManager& pointsManager;
    LocalStore& localStore;
    
    SystemState currentState;
    SystemState previousState;
    unsigned long stateStartTime;
    unsigned long lastStateUpdate;
    
    // Current ride information
    RideInfo currentRide;
    bool hasActiveRide;
    unsigned long rideNotificationTime;
    unsigned long rideAcceptTime;
    unsigned long pickupConfirmTime;
    
    // State handlers
    void handleIdleState();
    void handleNotifiedState();
    void handleAcceptedState();
    void handleEnrouteToPickupState();
    void handleArrivedPickupState();
    void handleRideActiveState();
    void handleEnrouteToDropState();
    void handleCompletedState();
    void handleOfflineErrorState();
    
    // Utility
    void transitionToState(SystemState newState);
    void logStateTransition(SystemState from, SystemState to);
    void parseRideNotification(const char* payload);
    void resetRideData();
    double getCurrentDistanceToPickup();
    double getCurrentDistanceToDrop();
    void updateDisplay();
};

#endif // FSM_CONTROLLER_H

