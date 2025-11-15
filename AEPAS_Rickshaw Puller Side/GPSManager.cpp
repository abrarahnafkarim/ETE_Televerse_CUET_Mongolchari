/*
 * GPSManager.cpp
 * Implementation of GPS module management
 */

#include "GPSManager.h"
#include <math.h>

GPSManager::GPSManager() : bufferIndex(0), bufferFilled(false), lastUpdateTime(0), lastFixTime(0) {
    gpsSerial = &Serial2;
    
    // Initialize buffer
    for (int i = 0; i < GPS_MOVING_AVG_SAMPLES; i++) {
        coordBuffer[i] = {0, 0, 0};
    }
    
    // Initialize last valid fix
    lastValidFix = {0, 0, 0, 0, 0, 0, 0, false, 0};
}

void GPSManager::begin() {
    DEBUG_PRINTLN(F("[GPS] Initializing GPS module..."));
    gpsSerial->begin(GPS_BAUD_RATE, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
    delay(100);
    DEBUG_PRINTLN(F("[GPS] GPS module initialized"));
}

void GPSManager::update() {
    unsigned long currentTime = millis();
    
    // Read GPS data
    while (gpsSerial->available() > 0) {
        char c = gpsSerial->read();
        gps.encode(c);
    }
    
    // Check if we have a valid location update
    if (gps.location.isValid() && gps.location.isUpdated()) {
        if (currentTime - lastUpdateTime >= GPS_UPDATE_MIN_INTERVAL) {
            double lat = gps.location.lat();
            double lon = gps.location.lng();
            
            // Add to moving average buffer
            addToBuffer(lat, lon);
            
            // Update last valid fix
            lastValidFix.latitude = lat;
            lastValidFix.longitude = lon;
            lastValidFix.altitude = gps.altitude.meters();
            lastValidFix.speed = gps.speed.mps();
            lastValidFix.course = gps.course.deg();
            lastValidFix.satellites = gps.satellites.value();
            lastValidFix.hdop = gps.hdop.hdop();
            lastValidFix.valid = true;
            lastValidFix.timestamp = currentTime;
            
            lastUpdateTime = currentTime;
            lastFixTime = currentTime;
            
            DEBUG_PRINTF("[GPS] Fix: %.6f, %.6f | Sats: %d | HDOP: %.2f\n", 
                        lat, lon, lastValidFix.satellites, lastValidFix.hdop);
        }
    }
    
    // Check for fix timeout
    if (hasFix() && (currentTime - lastFixTime > GPS_FIX_TIMEOUT)) {
        DEBUG_PRINTLN(F("[GPS] WARNING: GPS fix lost"));
    }
}

bool GPSManager::isValid() const {
    return lastValidFix.valid && (millis() - lastValidFix.timestamp < GPS_FIX_TIMEOUT);
}

bool GPSManager::hasFix() {
    return gps.location.isValid() && (gps.satellites.value() >= GPS_MIN_SATELLITES);
}

GPSData GPSManager::getCurrentLocation() const {
    return lastValidFix;
}

GPSData GPSManager::getAveragedLocation() const {
    if (!bufferFilled && bufferIndex == 0) {
        return lastValidFix; // No averaged data yet
    }
    
    double avgLat, avgLon;
    calculateAveragedCoordinates(avgLat, avgLon);
    
    GPSData averaged = lastValidFix;
    averaged.latitude = avgLat;
    averaged.longitude = avgLon;
    
    return averaged;
}

double GPSManager::getLatitude() const {
    return lastValidFix.latitude;
}

double GPSManager::getLongitude() const {
    return lastValidFix.longitude;
}

double GPSManager::getSpeed() const {
    return lastValidFix.speed;
}

uint8_t GPSManager::getSatellites() const {
    return lastValidFix.satellites;
}

unsigned long GPSManager::getFixAge() const {
    if (!lastValidFix.valid) return 0xFFFFFFFF;
    return millis() - lastValidFix.timestamp;
}

void GPSManager::addToBuffer(double lat, double lon) {
    coordBuffer[bufferIndex].lat = lat;
    coordBuffer[bufferIndex].lon = lon;
    coordBuffer[bufferIndex].timestamp = millis();
    
    bufferIndex++;
    if (bufferIndex >= GPS_MOVING_AVG_SAMPLES) {
        bufferIndex = 0;
        bufferFilled = true;
    }
}

void GPSManager::calculateAveragedCoordinates(double& avgLat, double& avgLon) const {
    int count = bufferFilled ? GPS_MOVING_AVG_SAMPLES : bufferIndex;
    if (count == 0) {
        avgLat = lastValidFix.latitude;
        avgLon = lastValidFix.longitude;
        return;
    }
    
    double sumLat = 0, sumLon = 0;
    for (int i = 0; i < count; i++) {
        sumLat += coordBuffer[i].lat;
        sumLon += coordBuffer[i].lon;
    }
    
    avgLat = sumLat / count;
    avgLon = sumLon / count;
}

// Haversine formula for distance calculation
double GPSManager::calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    const double R = 6371000.0; // Earth radius in meters
    
    double dLat = (lat2 - lat1) * PI / 180.0;
    double dLon = (lon2 - lon1) * PI / 180.0;
    
    double a = sin(dLat / 2.0) * sin(dLat / 2.0) +
               cos(lat1 * PI / 180.0) * cos(lat2 * PI / 180.0) *
               sin(dLon / 2.0) * sin(dLon / 2.0);
    
    double c = 2.0 * atan2(sqrt(a), sqrt(1.0 - a));
    
    return R * c;
}

double GPSManager::getETA(double targetLat, double targetLon) const {
    if (!isValid() || lastValidFix.speed < 0.1) {
        return -1.0; // Invalid or stationary
    }
    
    double distance = calculateDistance(
        lastValidFix.latitude, lastValidFix.longitude,
        targetLat, targetLon
    );
    
    // ETA in seconds
    return distance / lastValidFix.speed;
}

bool GPSManager::isWithinRange(double targetLat, double targetLon, double rangeMeters) const {
    if (!isValid()) return false;
    
    GPSData avgLocation = getAveragedLocation();
    double distance = calculateDistance(
        avgLocation.latitude, avgLocation.longitude,
        targetLat, targetLon
    );
    
    return distance <= rangeMeters;
}

void GPSManager::printDebugInfo() {
    DEBUG_PRINTLN(F("\n=== GPS Debug Info ==="));
    DEBUG_PRINTF("Valid: %s\n", isValid() ? "YES" : "NO");
    DEBUG_PRINTF("Has Fix: %s\n", hasFix() ? "YES" : "NO");
    DEBUG_PRINTF("Satellites: %d\n", lastValidFix.satellites);
    DEBUG_PRINTF("HDOP: %.2f\n", lastValidFix.hdop);
    DEBUG_PRINTF("Location: %.6f, %.6f\n", lastValidFix.latitude, lastValidFix.longitude);
    DEBUG_PRINTF("Speed: %.2f m/s\n", lastValidFix.speed);
    DEBUG_PRINTF("Fix Age: %lu ms\n", getFixAge());
    
    if (bufferFilled || bufferIndex > 0) {
        double avgLat, avgLon;
        calculateAveragedCoordinates(avgLat, avgLon);
        DEBUG_PRINTF("Averaged: %.6f, %.6f\n", avgLat, avgLon);
    }
    DEBUG_PRINTLN(F("=====================\n"));
}

