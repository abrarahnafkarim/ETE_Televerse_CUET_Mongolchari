/*
 * UIManager.h
 * User interface management: OLED display, buttons, LED, buzzer
 */

#ifndef UI_MANAGER_H
#define UI_MANAGER_H

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "Config.h"

// Button states
enum ButtonState {
    BTN_NONE,
    BTN_ACCEPT,
    BTN_REJECT,
    BTN_PICKUP,
    BTN_DROP
};

// LED patterns
enum LEDPattern {
    LED_OFF,
    LED_ON,
    LED_SLOW_BLINK,    // 1 Hz
    LED_FAST_BLINK,    // 5 Hz
    LED_DOUBLE_BLINK
};

// Screen pages
enum ScreenPage {
    PAGE_IDLE,
    PAGE_RIDE_NOTIFICATION,
    PAGE_ENROUTE,
    PAGE_ARRIVED,
    PAGE_RIDE_ACTIVE,
    PAGE_COMPLETED,
    PAGE_ERROR
};

struct RideInfo {
    String rideId;
    String pickupAddress;
    String dropAddress;
    double pickupLat;
    double pickupLon;
    double dropLat;
    double dropLon;
    double distanceToPickup;
    double estimatedPoints;
    double eta;
};

class UIManager {
public:
    UIManager();
    void begin();
    void update();
    
    // Button handling
    ButtonState readButtons();
    bool isButtonPressed(uint8_t pin);
    
    // LED control
    void setLED(LEDPattern pattern);
    void updateLED();
    
    // Buzzer control
    void beep(uint16_t duration = 100);
    void beepPattern(uint8_t count, uint16_t duration = 100, uint16_t gap = 100);
    
    // Display control
    void clearDisplay();
    void showIdleScreen(const String& driverName, uint8_t satellites, float points);
    void showRideNotification(const RideInfo& ride);
    void showEnrouteToPickup(const RideInfo& ride, double currentDistance);
    void showArrivedAtPickup(const RideInfo& ride);
    void showRideActive(const RideInfo& ride, double distanceToDrop);
    void showCompletedScreen(float pointsAwarded, bool needsReview);
    void showErrorScreen(const String& errorMsg);
    void showConnectionStatus(bool wifi, bool mqtt, bool gps);
    
    // Utility
    void showMessage(const String& msg, uint16_t duration = 2000);
    void drawProgressBar(int16_t x, int16_t y, uint16_t width, uint16_t height, uint8_t percent);

private:
    Adafruit_SSD1306 display;
    
    // Button debouncing
    unsigned long lastButtonPress[4];
    bool buttonStates[4];
    
    // LED state
    LEDPattern currentLEDPattern;
    unsigned long lastLEDToggle;
    bool ledState;
    uint8_t blinkCount;
    
    // Buzzer state
    bool buzzerActive;
    unsigned long buzzerEndTime;
    
    // Screen state
    ScreenPage currentPage;
    unsigned long lastScreenUpdate;
    
    // Helper methods
    void drawCenteredText(const String& text, int16_t y, uint8_t size = 1);
    void drawRightAlignedText(const String& text, int16_t y, int16_t x, uint8_t size = 1);
    String formatDistance(double meters);
    String formatETA(double seconds);
    uint8_t getPinForButton(ButtonState btn);
};

#endif // UI_MANAGER_H

