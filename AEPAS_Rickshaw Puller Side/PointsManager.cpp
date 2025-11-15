/*
 * PointsManager.cpp
 * Implementation of points calculation logic
 */

#include "PointsManager.h"

PointsManager::PointsManager() {
}

float PointsManager::calculateEstimatedPoints(double pickupLat, double pickupLon, 
                                              double currentLat, double currentLon) {
    // Calculate distance to pickup
    double distance = GPSManager::calculateDistance(currentLat, currentLon, pickupLat, pickupLon);
    
    // Apply points formula
    return applyPointsFormula(distance);
}

PointsResult PointsManager::calculateFinalPoints(double expectedDropLat, double expectedDropLon,
                                                 double actualDropLat, double actualDropLon,
                                                 double gpsAccuracy) {
    PointsResult result;
    result.gpsAccuracy = gpsAccuracy;
    result.needsReview = false;
    result.reason = "OK";
    
    // Calculate actual distance error from expected drop location
    result.actualDistance = GPSManager::calculateDistance(
        expectedDropLat, expectedDropLon,
        actualDropLat, actualDropLon
    );
    
    DEBUG_PRINTF("[POINTS] Drop distance error: %.2f m\n", result.actualDistance);
    DEBUG_PRINTF("[POINTS] GPS accuracy: %.2f m\n", gpsAccuracy);
    
    // Check GPS accuracy
    if (!isGPSAccuracyAcceptable(gpsAccuracy)) {
        result.needsReview = true;
        result.reason = "GPS accuracy poor";
        result.points = 0.0;
        DEBUG_PRINTLN(F("[POINTS] GPS accuracy unacceptable, needs review"));
        return result;
    }
    
    // Check if drop location is within acceptable range
    if (result.actualDistance > DISTANCE_ADMIN_REVIEW) {
        result.needsReview = true;
        result.reason = "Drop location far from expected";
        result.points = 0.0;
        DEBUG_PRINTLN(F("[POINTS] Distance error too large, needs review"));
        return result;
    }
    
    // Calculate points based on distance error
    // Points Formula: BasePoints - (ActualDistance / 10m)
    result.points = applyPointsFormula(result.actualDistance);
    
    DEBUG_PRINTF("[POINTS] Final points: %.2f\n", result.points);
    
    return result;
}

bool PointsManager::validateDropLocation(double expectedLat, double expectedLon,
                                        double actualLat, double actualLon,
                                        double& distanceError) {
    distanceError = GPSManager::calculateDistance(
        expectedLat, expectedLon,
        actualLat, actualLon
    );
    
    // Check if within auto-confirm range
    if (distanceError <= DISTANCE_DROP_AUTO) {
        DEBUG_PRINTF("[POINTS] Drop validated: %.2f m within auto-confirm range\n", distanceError);
        return true;
    }
    
    // Check if within acceptable range (but may need review)
    if (distanceError <= DISTANCE_ADMIN_REVIEW) {
        DEBUG_PRINTF("[POINTS] Drop within acceptable range: %.2f m\n", distanceError);
        return true;
    }
    
    DEBUG_PRINTF("[POINTS] Drop location invalid: %.2f m too far\n", distanceError);
    return false;
}

bool PointsManager::isGPSAccuracyAcceptable(double accuracy) {
    return accuracy <= GPS_ACCURACY_THRESHOLD;
}

String PointsManager::getPointsBreakdown(const PointsResult& result) {
    String breakdown = "Points: ";
    breakdown += String(result.points, 2);
    breakdown += "\nDistance error: ";
    breakdown += String(result.actualDistance, 1);
    breakdown += " m";
    breakdown += "\nGPS accuracy: ";
    breakdown += String(result.gpsAccuracy, 1);
    breakdown += " m";
    
    if (result.needsReview) {
        breakdown += "\nStatus: PENDING REVIEW";
        breakdown += "\nReason: ";
        breakdown += result.reason;
    } else {
        breakdown += "\nStatus: APPROVED";
    }
    
    return breakdown;
}

float PointsManager::applyPointsFormula(double distanceMeters) {
    // Formula: FinalPoints = max(0, BasePoints - (ActualDistance / 10m))
    float penalty = distanceMeters / POINTS_DIST_DIVISOR;
    float points = POINTS_BASE - penalty;
    
    // Ensure points don't go negative
    points = max(points, (float)POINTS_MIN);
    
    DEBUG_PRINTF("[POINTS] Distance: %.2f m, Penalty: %.2f, Points: %.2f\n", 
                distanceMeters, penalty, points);
    
    return points;
}

