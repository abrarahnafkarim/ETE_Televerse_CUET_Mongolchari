/**
 * AERAS - OLED Display Manager
 * 
 * Features:
 * - SSD1306 128x64 display support
 * - Multiple screen layouts for different states
 * - Auto-refresh with configurable interval
 * - High contrast for sunlight readability
 * - Status messages, distance, privilege status
 * - Backend updates display
 */

#ifndef OLED_DISPLAY_H
#define OLED_DISPLAY_H

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "config.h"

class OLEDDisplay {
private:
    Adafruit_SSD1306* display;
    unsigned long lastRefreshTime;
    
    // Display content cache
    String currentScreen;
    float cachedDistance;
    String cachedStatus;
    String cachedDestination;
    bool cachedPrivilege;
    
    /**
     * Clear display and prepare for new content
     */
    void clearDisplay();
    
    /**
     * Draw centered text
     */
    void drawCenteredText(const char* text, uint8_t y, uint8_t textSize = 1);
    
    /**
     * Draw title bar
     */
    void drawTitleBar(const char* title);

public:
    /**
     * Constructor
     */
    OLEDDisplay();
    
    /**
     * Initialize display
     * @return true if successful
     */
    bool begin();
    
    /**
     * Update display (call in loop)
     * Automatically refreshes based on OLED_REFRESH_INTERVAL_MS
     */
    void update();
    
    /**
     * Force immediate display refresh
     */
    void forceRefresh();
    
    /**
     * Show idle/waiting screen
     */
    void showIdle();
    
    /**
     * Show user detection screen with distance
     * @param distance Distance in cm
     */
    void showUserDetected(float distance);
    
    /**
     * Show privilege verification in progress
     */
    void showPrivilegeCheck();
    
    /**
     * Show privilege verification result
     * @param verified true if verified, false if denied
     * @param reason Reason for denial (if any)
     */
    void showPrivilegeResult(bool verified, const char* reason = "");
    
    /**
     * Show waiting for button confirmation
     * @param destination Destination block name
     */
    void showWaitingForConfirm(const char* destination);
    
    /**
     * Show request sent, waiting for backend
     */
    void showRequestSent();
    
    /**
     * Show incoming offer
     */
    void showOfferIncoming();
    
    /**
     * Show ride accepted
     */
    void showRideAccepted();
    
    /**
     * Show ride rejected/timeout
     * @param reason Reason for rejection
     */
    void showRideRejected(const char* reason);
    
    /**
     * Show error message
     * @param error Error description
     */
    void showError(const char* error);
    
    /**
     * Show custom message
     * @param line1 First line
     * @param line2 Second line
     * @param line3 Third line
     */
    void showMessage(const char* line1, const char* line2 = "", const char* line3 = "");
};

#endif // OLED_DISPLAY_H

