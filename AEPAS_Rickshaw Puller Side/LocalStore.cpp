/*
 * LocalStore.cpp
 * Implementation of persistent storage using NVS
 */

#include "LocalStore.h"

LocalStore::LocalStore() : initialized(false) {
}

void LocalStore::begin() {
    DEBUG_PRINTLN(F("[STORE] Initializing Local Store..."));
    
    // Initialize NVS
    if (!prefs.begin(NVS_NAMESPACE, false)) {
        DEBUG_PRINTLN(F("[STORE] ERROR: Failed to initialize NVS"));
        initialized = false;
        return;
    }
    
    initialized = true;
    DEBUG_PRINTLN(F("[STORE] Local Store initialized"));
    
    // Initialize default values if not set
    if (!hasDriverId()) {
        setDriverId(DRIVER_ID);
        DEBUG_PRINTLN(F("[STORE] Set default driver ID"));
    }
    
    if (!prefs.isKey(NVS_KEY_DEVICE_ID)) {
        setDeviceId(DEVICE_ID);
        DEBUG_PRINTLN(F("[STORE] Set default device ID"));
    }
    
    if (!prefs.isKey(NVS_KEY_TOTAL_POINTS)) {
        setTotalPoints(0.0);
        DEBUG_PRINTLN(F("[STORE] Initialized points to 0"));
    }
    
    if (!prefs.isKey(NVS_KEY_RIDE_COUNT)) {
        setRideCount(0);
        DEBUG_PRINTLN(F("[STORE] Initialized ride count to 0"));
    }
    
    printStorageInfo();
}

void LocalStore::setDriverId(const String& id) {
    if (!initialized) return;
    prefs.putString(NVS_KEY_DRIVER_ID, id);
    DEBUG_PRINTF("[STORE] Driver ID set: %s\n", id.c_str());
}

String LocalStore::getDriverId() {
    if (!initialized) return String(DRIVER_ID);
    return prefs.getString(NVS_KEY_DRIVER_ID, DRIVER_ID);
}

void LocalStore::setDeviceId(const String& id) {
    if (!initialized) return;
    prefs.putString(NVS_KEY_DEVICE_ID, id);
    DEBUG_PRINTF("[STORE] Device ID set: %s\n", id.c_str());
}

String LocalStore::getDeviceId() {
    if (!initialized) return String(DEVICE_ID);
    return prefs.getString(NVS_KEY_DEVICE_ID, DEVICE_ID);
}

void LocalStore::setTotalPoints(float points) {
    if (!initialized) return;
    prefs.putFloat(NVS_KEY_TOTAL_POINTS, points);
    DEBUG_PRINTF("[STORE] Total points set: %.2f\n", points);
}

float LocalStore::getTotalPoints() {
    if (!initialized) return 0.0;
    return prefs.getFloat(NVS_KEY_TOTAL_POINTS, 0.0);
}

void LocalStore::addPoints(float points) {
    if (!initialized) return;
    float current = getTotalPoints();
    float newTotal = current + points;
    setTotalPoints(newTotal);
    DEBUG_PRINTF("[STORE] Added %.2f points, new total: %.2f\n", points, newTotal);
}

void LocalStore::setRideCount(uint32_t count) {
    if (!initialized) return;
    prefs.putUInt(NVS_KEY_RIDE_COUNT, count);
    DEBUG_PRINTF("[STORE] Ride count set: %u\n", count);
}

uint32_t LocalStore::getRideCount() {
    if (!initialized) return 0;
    return prefs.getUInt(NVS_KEY_RIDE_COUNT, 0);
}

void LocalStore::incrementRideCount() {
    if (!initialized) return;
    uint32_t current = getRideCount();
    setRideCount(current + 1);
    DEBUG_PRINTF("[STORE] Ride count incremented to: %u\n", current + 1);
}

void LocalStore::setLastLocation(double lat, double lon) {
    if (!initialized) return;
    prefs.putDouble(NVS_KEY_LAST_LAT, lat);
    prefs.putDouble(NVS_KEY_LAST_LON, lon);
    DEBUG_PRINTF("[STORE] Last location set: %.6f, %.6f\n", lat, lon);
}

bool LocalStore::getLastLocation(double& lat, double& lon) {
    if (!initialized) return false;
    
    if (!hasLastLocation()) {
        return false;
    }
    
    lat = prefs.getDouble(NVS_KEY_LAST_LAT, 0.0);
    lon = prefs.getDouble(NVS_KEY_LAST_LON, 0.0);
    
    return (lat != 0.0 || lon != 0.0);
}

void LocalStore::clearAll() {
    if (!initialized) return;
    
    DEBUG_PRINTLN(F("[STORE] Clearing all stored data..."));
    prefs.clear();
    
    // Reinitialize defaults
    setDriverId(DRIVER_ID);
    setDeviceId(DEVICE_ID);
    setTotalPoints(0.0);
    setRideCount(0);
    
    DEBUG_PRINTLN(F("[STORE] All data cleared and reset"));
}

PersistentData LocalStore::getAllData() {
    PersistentData data;
    
    data.driverId = getDriverId();
    data.deviceId = getDeviceId();
    data.totalPoints = getTotalPoints();
    data.rideCount = getRideCount();
    
    if (!getLastLocation(data.lastLatitude, data.lastLongitude)) {
        data.lastLatitude = 0.0;
        data.lastLongitude = 0.0;
    }
    
    data.lastUpdate = millis();
    
    return data;
}

void LocalStore::printStorageInfo() {
    if (!initialized) {
        DEBUG_PRINTLN(F("[STORE] Storage not initialized"));
        return;
    }
    
    DEBUG_PRINTLN(F("\n=== Local Storage Info ==="));
    DEBUG_PRINTF("Driver ID: %s\n", getDriverId().c_str());
    DEBUG_PRINTF("Device ID: %s\n", getDeviceId().c_str());
    DEBUG_PRINTF("Total Points: %.2f\n", getTotalPoints());
    DEBUG_PRINTF("Ride Count: %u\n", getRideCount());
    
    double lat, lon;
    if (getLastLocation(lat, lon)) {
        DEBUG_PRINTF("Last Location: %.6f, %.6f\n", lat, lon);
    } else {
        DEBUG_PRINTLN(F("Last Location: Not set"));
    }
    
    DEBUG_PRINTLN(F("=========================\n"));
}

bool LocalStore::hasDriverId() {
    if (!initialized) return false;
    return prefs.isKey(NVS_KEY_DRIVER_ID);
}

bool LocalStore::hasLastLocation() {
    if (!initialized) return false;
    return prefs.isKey(NVS_KEY_LAST_LAT) && prefs.isKey(NVS_KEY_LAST_LON);
}

