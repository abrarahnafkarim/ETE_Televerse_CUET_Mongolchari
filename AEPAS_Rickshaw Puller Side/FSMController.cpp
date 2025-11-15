/*
 * FSMController.cpp
 * Implementation of Finite State Machine controller
 */

#include "FSMController.h"

FSMController::FSMController(GPSManager& gps, CommManager& comm, UIManager& ui, 
                           PointsManager& points, LocalStore& store)
    : gpsManager(gps), commManager(comm), uiManager(ui), 
      pointsManager(points), localStore(store),
      currentState(STATE_IDLE), previousState(STATE_IDLE),
      stateStartTime(0), lastStateUpdate(0),
      hasActiveRide(false), rideNotificationTime(0),
      rideAcceptTime(0), pickupConfirmTime(0) {
}

void FSMController::begin() {
    DEBUG_PRINTLN(F("[FSM] Initializing FSM Controller..."));
    
    currentState = STATE_IDLE;
    stateStartTime = millis();
    lastStateUpdate = millis();
    
    DEBUG_PRINTLN(F("[FSM] FSM Controller initialized"));
    logStateTransition(STATE_IDLE, STATE_IDLE);
}

void FSMController::update() {
    unsigned long currentTime = millis();
    
    // Update display and check for state-specific actions
    switch (currentState) {
        case STATE_IDLE:
            handleIdleState();
            break;
        case STATE_NOTIFIED:
            handleNotifiedState();
            break;
        case STATE_ACCEPTED:
            handleAcceptedState();
            break;
        case STATE_ENROUTE_TO_PICKUP:
            handleEnrouteToPickupState();
            break;
        case STATE_ARRIVED_PICKUP:
            handleArrivedPickupState();
            break;
        case STATE_RIDE_ACTIVE:
            handleRideActiveState();
            break;
        case STATE_ENROUTE_TO_DROP:
            handleEnrouteToDropState();
            break;
        case STATE_COMPLETED:
            handleCompletedState();
            break;
        case STATE_OFFLINE_ERROR:
            handleOfflineErrorState();
            break;
    }
    
    // Check for connectivity issues
    if (!commManager.isWiFiConnected() && currentState != STATE_OFFLINE_ERROR) {
        transitionToState(STATE_OFFLINE_ERROR);
    }
    
    lastStateUpdate = currentTime;
}

SystemState FSMController::getCurrentState() const {
    return currentState;
}

void FSMController::setState(SystemState newState) {
    transitionToState(newState);
}

void FSMController::handleRideNotification(const char* payload) {
    DEBUG_PRINTF("[FSM] Ride notification received: %s\n", payload);
    
    // Only accept new rides when idle
    if (currentState != STATE_IDLE) {
        DEBUG_PRINTLN(F("[FSM] Ignoring ride notification - not idle"));
        return;
    }
    
    parseRideNotification(payload);
    
    if (hasActiveRide) {
        rideNotificationTime = millis();
        transitionToState(STATE_NOTIFIED);
        uiManager.beepPattern(3, 200, 100);
    }
}

void FSMController::handleAcceptButton() {
    DEBUG_PRINTLN(F("[FSM] Accept button pressed"));
    
    if (currentState == STATE_NOTIFIED) {
        // Send acceptance to backend
        GPSData gpsData = gpsManager.getCurrentLocation();
        
        if (commManager.publishAccept(currentRide.rideId, gpsData.latitude, gpsData.longitude)) {
            rideAcceptTime = millis();
            transitionToState(STATE_ACCEPTED);
            uiManager.setLED(LED_FAST_BLINK); // Yellow LED blinking
        } else {
            uiManager.showMessage("Accept failed!", 2000);
        }
    }
}

void FSMController::handleRejectButton() {
    DEBUG_PRINTLN(F("[FSM] Reject button pressed"));
    
    if (currentState == STATE_NOTIFIED) {
        // Send rejection to backend
        if (commManager.publishReject(currentRide.rideId, "Driver rejected")) {
            uiManager.showMessage("Ride rejected", 1000);
            resetRideData();
            transitionToState(STATE_IDLE);
        } else {
            uiManager.showMessage("Reject failed!", 2000);
        }
    } else if (currentState == STATE_ACCEPTED || currentState == STATE_ENROUTE_TO_PICKUP) {
        // Cancel after accepting
        if (commManager.publishCancel(currentRide.rideId, "Driver cancelled")) {
            uiManager.showMessage("Ride cancelled", 1000);
            resetRideData();
            transitionToState(STATE_IDLE);
        } else {
            uiManager.showMessage("Cancel failed!", 2000);
        }
    }
}

void FSMController::handlePickupButton() {
    DEBUG_PRINTLN(F("[FSM] Pickup confirm button pressed"));
    
    if (currentState == STATE_ARRIVED_PICKUP || currentState == STATE_ENROUTE_TO_PICKUP) {
        GPSData gpsData = gpsManager.getCurrentLocation();
        
        // Check if within acceptable pickup range
        if (isWithinPickupRange() || !gpsManager.isValid()) {
            if (commManager.publishPickupConfirm(currentRide.rideId, gpsData.latitude, gpsData.longitude)) {
                pickupConfirmTime = millis();
                transitionToState(STATE_RIDE_ACTIVE);
                uiManager.setLED(LED_ON); // Solid LED
            } else {
                uiManager.showMessage("Pickup confirm failed!", 2000);
            }
        } else {
            double distance = getCurrentDistanceToPickup();
            uiManager.showMessage("Too far from pickup: " + String((int)distance) + "m", 2000);
        }
    }
}

void FSMController::handleDropButton() {
    DEBUG_PRINTLN(F("[FSM] Drop confirm button pressed"));
    
    if (currentState == STATE_RIDE_ACTIVE || currentState == STATE_ENROUTE_TO_DROP) {
        GPSData gpsData = gpsManager.getAveragedLocation();
        
        // Calculate final points
        PointsResult result = pointsManager.calculateFinalPoints(
            currentRide.dropLat, currentRide.dropLon,
            gpsData.latitude, gpsData.longitude,
            gpsData.hdop
        );
        
        if (commManager.publishDropConfirm(currentRide.rideId, gpsData.latitude, gpsData.longitude, 
                                          result.points, result.needsReview)) {
            // Update local points if not pending review
            if (!result.needsReview) {
                localStore.addPoints(result.points);
            }
            localStore.incrementRideCount();
            
            // Show completion screen
            uiManager.showCompletedScreen(result.points, result.needsReview);
            
            transitionToState(STATE_COMPLETED);
        } else {
            uiManager.showMessage("Drop confirm failed!", 2000);
        }
    }
}

bool FSMController::isWithinPickupRange() {
    if (!gpsManager.isValid()) return false;
    return gpsManager.isWithinRange(currentRide.pickupLat, currentRide.pickupLon, DISTANCE_PICKUP_MAX);
}

bool FSMController::isWithinDropRange() {
    if (!gpsManager.isValid()) return false;
    return gpsManager.isWithinRange(currentRide.dropLat, currentRide.dropLon, DISTANCE_DROP_AUTO);
}

bool FSMController::shouldAutoConfirmPickup() {
    if (!gpsManager.isValid()) return false;
    return gpsManager.isWithinRange(currentRide.pickupLat, currentRide.pickupLon, DISTANCE_PICKUP_AUTO);
}

bool FSMController::shouldAutoConfirmDrop() {
    if (!gpsManager.isValid()) return false;
    return gpsManager.isWithinRange(currentRide.dropLat, currentRide.dropLon, DISTANCE_DROP_AUTO);
}

bool FSMController::hasRideTimedOut() {
    if (currentState == STATE_NOTIFIED) {
        return (millis() - rideNotificationTime) > ACCEPT_TIMEOUT_MS;
    }
    return false;
}

void FSMController::handleIdleState() {
    static unsigned long lastUpdate = 0;
    
    if (millis() - lastUpdate > 5000) { // Update every 5 seconds
        GPSData gpsData = gpsManager.getCurrentLocation();
        float points = localStore.getTotalPoints();
        
        uiManager.showIdleScreen(localStore.getDriverId(), gpsData.satellites, points);
        uiManager.setLED(LED_SLOW_BLINK);
        
        // Save current location
        if (gpsManager.isValid()) {
            localStore.setLastLocation(gpsData.latitude, gpsData.longitude);
        }
        
        lastUpdate = millis();
    }
}

void FSMController::handleNotifiedState() {
    // Check for timeout
    if (hasRideTimedOut()) {
        DEBUG_PRINTLN(F("[FSM] Ride notification timed out"));
        uiManager.showMessage("Ride expired!", 2000);
        resetRideData();
        transitionToState(STATE_IDLE);
        return;
    }
    
    static unsigned long lastUpdate = 0;
    if (millis() - lastUpdate > 1000) { // Update every second
        uiManager.showRideNotification(currentRide);
        uiManager.setLED(LED_FAST_BLINK);
        lastUpdate = millis();
    }
}

void FSMController::handleAcceptedState() {
    // Immediately transition to enroute
    transitionToState(STATE_ENROUTE_TO_PICKUP);
}

void FSMController::handleEnrouteToPickupState() {
    static unsigned long lastUpdate = 0;
    
    if (millis() - lastUpdate > 2000) { // Update every 2 seconds
        double distance = getCurrentDistanceToPickup();
        uiManager.showEnrouteToPickup(currentRide, distance);
        
        // Check if arrived at pickup
        if (shouldAutoConfirmPickup()) {
            DEBUG_PRINTLN(F("[FSM] Auto-arrived at pickup location"));
            transitionToState(STATE_ARRIVED_PICKUP);
        } else if (isWithinPickupRange()) {
            DEBUG_PRINTLN(F("[FSM] Within pickup range"));
            transitionToState(STATE_ARRIVED_PICKUP);
        }
        
        lastUpdate = millis();
    }
}

void FSMController::handleArrivedPickupState() {
    static unsigned long lastUpdate = 0;
    
    if (millis() - lastUpdate > 3000) { // Update every 3 seconds
        uiManager.showArrivedAtPickup(currentRide);
        uiManager.setLED(LED_DOUBLE_BLINK);
        
        // Auto-confirm if GPS says we're very close
        if (shouldAutoConfirmPickup()) {
            DEBUG_PRINTLN(F("[FSM] Auto-confirming pickup"));
            handlePickupButton(); // Trigger pickup confirmation
        }
        
        lastUpdate = millis();
    }
}

void FSMController::handleRideActiveState() {
    static unsigned long lastUpdate = 0;
    
    if (millis() - lastUpdate > 2000) { // Update every 2 seconds
        double distance = getCurrentDistanceToDrop();
        uiManager.showRideActive(currentRide, distance);
        uiManager.setLED(LED_ON);
        
        // Transition to enroute_to_drop (basically same state, but semantically different)
        transitionToState(STATE_ENROUTE_TO_DROP);
        
        lastUpdate = millis();
    }
}

void FSMController::handleEnrouteToDropState() {
    static unsigned long lastUpdate = 0;
    
    if (millis() - lastUpdate > 2000) { // Update every 2 seconds
        double distance = getCurrentDistanceToDrop();
        uiManager.showRideActive(currentRide, distance);
        
        // Check if arrived at drop (auto-confirm if within range)
        if (shouldAutoConfirmDrop()) {
            DEBUG_PRINTLN(F("[FSM] Auto-confirming drop"));
            handleDropButton(); // Trigger drop confirmation
        }
        
        lastUpdate = millis();
    }
}

void FSMController::handleCompletedState() {
    // Stay on completion screen for 5 seconds
    if (millis() - stateStartTime > 5000) {
        resetRideData();
        transitionToState(STATE_IDLE);
    }
}

void FSMController::handleOfflineErrorState() {
    static unsigned long lastUpdate = 0;
    
    if (millis() - lastUpdate > 3000) {
        uiManager.showErrorScreen("Network Error\nReconnecting...");
        uiManager.setLED(LED_FAST_BLINK);
        
        // Check if back online
        if (commManager.isWiFiConnected() && commManager.isMQTTConnected()) {
            DEBUG_PRINTLN(F("[FSM] Back online"));
            transitionToState(STATE_IDLE);
        }
        
        lastUpdate = millis();
    }
}

void FSMController::transitionToState(SystemState newState) {
    if (currentState == newState) return;
    
    logStateTransition(currentState, newState);
    
    previousState = currentState;
    currentState = newState;
    stateStartTime = millis();
    
    // Perform state entry actions
    switch (newState) {
        case STATE_IDLE:
            uiManager.setLED(LED_SLOW_BLINK);
            break;
        case STATE_NOTIFIED:
            uiManager.setLED(LED_FAST_BLINK);
            uiManager.beepPattern(3, 200, 100);
            break;
        case STATE_ACCEPTED:
            uiManager.setLED(LED_FAST_BLINK);
            uiManager.beep(200);
            break;
        case STATE_ARRIVED_PICKUP:
            uiManager.beepPattern(2, 300, 200);
            break;
        case STATE_RIDE_ACTIVE:
            uiManager.setLED(LED_ON);
            uiManager.beep(500);
            break;
        case STATE_COMPLETED:
            uiManager.setLED(LED_SLOW_BLINK);
            break;
        case STATE_OFFLINE_ERROR:
            uiManager.setLED(LED_FAST_BLINK);
            break;
        default:
            break;
    }
}

void FSMController::logStateTransition(SystemState from, SystemState to) {
    DEBUG_PRINTF("[FSM] State transition: %s -> %s\n", 
                stateToString(from), stateToString(to));
}

void FSMController::parseRideNotification(const char* payload) {
    StaticJsonDocument<1024> doc;
    DeserializationError error = deserializeJson(doc, payload);
    
    if (error) {
        DEBUG_PRINTF("[FSM] JSON parse error: %s\n", error.c_str());
        return;
    }
    
    // Extract ride information
    currentRide.rideId = doc["ride_id"].as<String>();
    currentRide.pickupAddress = doc["pickup_address"].as<String>();
    currentRide.dropAddress = doc["drop_address"].as<String>();
    currentRide.pickupLat = doc["pickup_lat"];
    currentRide.pickupLon = doc["pickup_lon"];
    currentRide.dropLat = doc["drop_lat"];
    currentRide.dropLon = doc["drop_lon"];
    
    // Calculate distance to pickup
    GPSData gpsData = gpsManager.getCurrentLocation();
    currentRide.distanceToPickup = gpsManager.calculateDistance(
        gpsData.latitude, gpsData.longitude,
        currentRide.pickupLat, currentRide.pickupLon
    );
    
    // Calculate estimated points
    currentRide.estimatedPoints = pointsManager.calculateEstimatedPoints(
        currentRide.pickupLat, currentRide.pickupLon,
        gpsData.latitude, gpsData.longitude
    );
    
    // Calculate ETA
    currentRide.eta = gpsManager.getETA(currentRide.pickupLat, currentRide.pickupLon);
    
    hasActiveRide = true;
    
    DEBUG_PRINTF("[FSM] Parsed ride: %s\n", currentRide.rideId.c_str());
    DEBUG_PRINTF("[FSM] Pickup: %.6f, %.6f\n", currentRide.pickupLat, currentRide.pickupLon);
    DEBUG_PRINTF("[FSM] Drop: %.6f, %.6f\n", currentRide.dropLat, currentRide.dropLon);
    DEBUG_PRINTF("[FSM] Distance: %.2f m\n", currentRide.distanceToPickup);
    DEBUG_PRINTF("[FSM] Est. Points: %.2f\n", currentRide.estimatedPoints);
}

void FSMController::resetRideData() {
    hasActiveRide = false;
    currentRide = RideInfo();
    rideNotificationTime = 0;
    rideAcceptTime = 0;
    pickupConfirmTime = 0;
}

double FSMController::getCurrentDistanceToPickup() {
    if (!gpsManager.isValid()) return -1.0;
    
    GPSData gpsData = gpsManager.getAveragedLocation();
    return gpsManager.calculateDistance(
        gpsData.latitude, gpsData.longitude,
        currentRide.pickupLat, currentRide.pickupLon
    );
}

double FSMController::getCurrentDistanceToDrop() {
    if (!gpsManager.isValid()) return -1.0;
    
    GPSData gpsData = gpsManager.getAveragedLocation();
    return gpsManager.calculateDistance(
        gpsData.latitude, gpsData.longitude,
        currentRide.dropLat, currentRide.dropLon
    );
}

void FSMController::updateDisplay() {
    // Display update is handled in individual state handlers
}

