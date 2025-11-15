/*
 * PointsManager.h
 * Points calculation and validation based on distance and accuracy
 */

#ifndef POINTS_MANAGER_H
#define POINTS_MANAGER_H

#include <Arduino.h>
#include "Config.h"
#include "GPSManager.h"

struct PointsResult {
    float points;
    bool needsReview;
    String reason;
    double actualDistance;
    double gpsAccuracy;
};

class PointsManager {
public:
    PointsManager();
    
    // Calculate estimated points for a ride (before acceptance)
    float calculateEstimatedPoints(double pickupLat, double pickupLon, 
                                   double currentLat, double currentLon);
    
    // Calculate final points after ride completion
    PointsResult calculateFinalPoints(double expectedDropLat, double expectedDropLon,
                                     double actualDropLat, double actualDropLon,
                                     double gpsAccuracy);
    
    // Validate drop location
    bool validateDropLocation(double expectedLat, double expectedLon,
                            double actualLat, double actualLon,
                            double& distanceError);
    
    // Check if GPS accuracy is acceptable
    bool isGPSAccuracyAcceptable(double accuracy);
    
    // Get points breakdown for display
    String getPointsBreakdown(const PointsResult& result);

private:
    float applyPointsFormula(double distanceMeters);
};

#endif // POINTS_MANAGER_H

