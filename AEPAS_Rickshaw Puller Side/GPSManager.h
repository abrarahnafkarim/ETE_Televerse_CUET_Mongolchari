/*
 * GPSManager.h
 * GPS module management with NMEA parsing and coordinate averaging
 */

#ifndef GPS_MANAGER_H
#define GPS_MANAGER_H

#include <Arduino.h>
#include <TinyGPS++.h>
#include "Config.h"

struct GPSData {
    double latitude;
    double longitude;
    double altitude;
    double speed;
    double course;
    uint8_t satellites;
    double hdop;
    bool valid;
    unsigned long timestamp;
};

class GPSManager {
public:
    GPSManager();
    void begin();
    void update();
    
    bool isValid() const;
    bool hasFix();  // Non-const: TinyGPSPlus value() is not const
    GPSData getCurrentLocation() const;
    GPSData getAveragedLocation() const;
    
    double getLatitude() const;
    double getLongitude() const;
    double getSpeed() const;
    uint8_t getSatellites() const;
    unsigned long getFixAge() const;
    
    // Calculate distance between two points (Haversine formula)
    static double calculateDistance(double lat1, double lon1, double lat2, double lon2);
    
    // Get ETA based on current speed and distance
    double getETA(double targetLat, double targetLon) const;
    
    // Check if within range of target
    bool isWithinRange(double targetLat, double targetLon, double rangeMeters) const;
    
    void printDebugInfo();  // Non-const: calls hasFix() which is non-const

private:
    TinyGPSPlus gps;
    HardwareSerial* gpsSerial;
    
    // Moving average buffer
    struct CoordSample {
        double lat;
        double lon;
        unsigned long timestamp;
    };
    CoordSample coordBuffer[GPS_MOVING_AVG_SAMPLES];
    uint8_t bufferIndex;
    bool bufferFilled;
    
    GPSData lastValidFix;
    unsigned long lastUpdateTime;
    unsigned long lastFixTime;
    
    void addToBuffer(double lat, double lon);
    void calculateAveragedCoordinates(double& avgLat, double& avgLon) const;
};

#endif // GPS_MANAGER_H

