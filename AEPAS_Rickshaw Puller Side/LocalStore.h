/*
 * LocalStore.h
 * Persistent storage management using NVS (Non-Volatile Storage)
 */

#ifndef LOCAL_STORE_H
#define LOCAL_STORE_H

#include <Arduino.h>
#include <Preferences.h>
#include "Config.h"

struct PersistentData {
    String driverId;
    String deviceId;
    float totalPoints;
    uint32_t rideCount;
    double lastLatitude;
    double lastLongitude;
    unsigned long lastUpdate;
};

class LocalStore {
public:
    LocalStore();
    void begin();
    
    // Driver data
    void setDriverId(const String& id);
    String getDriverId();
    
    void setDeviceId(const String& id);
    String getDeviceId();
    
    // Points and rides
    void setTotalPoints(float points);
    float getTotalPoints();
    void addPoints(float points);
    
    void setRideCount(uint32_t count);
    uint32_t getRideCount();
    void incrementRideCount();
    
    // Last known location
    void setLastLocation(double lat, double lon);
    bool getLastLocation(double& lat, double& lon);
    
    // Utility
    void clearAll();
    PersistentData getAllData();
    void printStorageInfo();
    
    // Check if data exists
    bool hasDriverId();
    bool hasLastLocation();

private:
    Preferences prefs;
    bool initialized;
};

#endif // LOCAL_STORE_H

