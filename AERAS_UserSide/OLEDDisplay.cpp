/**
 * AERAS - OLED Display Manager Implementation
 */

#include "OLEDDisplay.h"

OLEDDisplay::OLEDDisplay() 
    : display(nullptr), lastRefreshTime(0), currentScreen(""),
      cachedDistance(0), cachedStatus(""), cachedDestination(""),
      cachedPrivilege(false) {
}

bool OLEDDisplay::begin() {
    // Create display object
    display = new Adafruit_SSD1306(OLED_WIDTH, OLED_HEIGHT, &Wire, -1);
    
    // Initialize I2C
    Wire.begin(OLED_SDA_PIN, OLED_SCL_PIN);
    
    // Initialize display
    if (!display->begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {
        DEBUG_PRINTLN("[OLED] ✗ Initialization failed");
        return false;
    }
    
    // Configure display
    display->setTextColor(SSD1306_WHITE);
    display->setTextWrap(false);
    
    // Show startup screen
    display->clearDisplay();
    display->setTextSize(2);
    drawCenteredText("AERAS", 10, 2);
    display->setTextSize(1);
    drawCenteredText("E-Rickshaw System", 35, 1);
    drawCenteredText("Initializing...", 50, 1);
    display->display();
    
    DEBUG_PRINTLN("[OLED] ✓ Initialized");
    
    delay(2000);  // Show startup screen
    
    return true;
}

void OLEDDisplay::clearDisplay() {
    display->clearDisplay();
}

void OLEDDisplay::drawCenteredText(const char* text, uint8_t y, uint8_t textSize) {
    display->setTextSize(textSize);
    int16_t x1, y1;
    uint16_t w, h;
    display->getTextBounds(text, 0, 0, &x1, &y1, &w, &h);
    display->setCursor((OLED_WIDTH - w) / 2, y);
    display->print(text);
}

void OLEDDisplay::drawTitleBar(const char* title) {
    display->fillRect(0, 0, OLED_WIDTH, 12, SSD1306_WHITE);
    display->setTextColor(SSD1306_BLACK);
    display->setTextSize(1);
    display->setCursor(2, 2);
    display->print(title);
    display->setTextColor(SSD1306_WHITE);
}

void OLEDDisplay::update() {
    unsigned long currentTime = millis();
    
    if (currentTime - lastRefreshTime >= OLED_REFRESH_INTERVAL_MS) {
        forceRefresh();
    }
}

void OLEDDisplay::forceRefresh() {
    display->display();
    lastRefreshTime = millis();
}

void OLEDDisplay::showIdle() {
    if (currentScreen == "IDLE") {
        return;  // No change needed
    }
    
    clearDisplay();
    drawTitleBar("AERAS - Ready");
    
    display->setTextSize(1);
    display->setCursor(5, 20);
    display->println("Stand in zone to");
    display->setCursor(5, 30);
    display->println("request a ride");
    
    display->setCursor(5, 50);
    display->print("Block: ");
    display->println(DEFAULT_BLOCK_ID);
    
    forceRefresh();
    currentScreen = "IDLE";
    
    DEBUG_PRINTLN("[OLED] Screen: IDLE");
}

void OLEDDisplay::showUserDetected(float distance) {
    clearDisplay();
    drawTitleBar("User Detected");
    
    display->setTextSize(1);
    display->setCursor(5, 20);
    display->println("Please remain");
    display->setCursor(5, 30);
    display->println("in position...");
    
    display->setTextSize(2);
    char distStr[16];
    snprintf(distStr, sizeof(distStr), "%.1f cm", distance);
    drawCenteredText(distStr, 45, 2);
    
    forceRefresh();
    currentScreen = "USER_DETECTED";
    cachedDistance = distance;
}

void OLEDDisplay::showPrivilegeCheck() {
    clearDisplay();
    drawTitleBar("Verifying...");
    
    display->setTextSize(1);
    drawCenteredText("Show privilege", 25, 1);
    drawCenteredText("laser token", 35, 1);
    
    display->setTextSize(2);
    drawCenteredText("...", 50, 2);
    
    forceRefresh();
    currentScreen = "PRIVILEGE_CHECK";
    
    DEBUG_PRINTLN("[OLED] Screen: PRIVILEGE_CHECK");
}

void OLEDDisplay::showPrivilegeResult(bool verified, const char* reason) {
    clearDisplay();
    
    if (verified) {
        drawTitleBar("Privilege OK");
        display->setTextSize(2);
        drawCenteredText("GRANTED", 25, 2);
        display->setTextSize(1);
        drawCenteredText("Please proceed", 50, 1);
    } else {
        drawTitleBar("Access Denied");
        display->setTextSize(2);
        drawCenteredText("DENIED", 25, 2);
        display->setTextSize(1);
        display->setCursor(5, 50);
        display->println(reason);
    }
    
    forceRefresh();
    currentScreen = verified ? "PRIVILEGE_OK" : "PRIVILEGE_DENIED";
    cachedPrivilege = verified;
    
    DEBUG_PRINTF("[OLED] Screen: PRIVILEGE_%s\n", verified ? "OK" : "DENIED");
}

void OLEDDisplay::showWaitingForConfirm(const char* destination) {
    clearDisplay();
    drawTitleBar("Confirm Ride");
    
    display->setTextSize(1);
    display->setCursor(5, 20);
    display->println("Press button to");
    display->setCursor(5, 30);
    display->println("request ride to:");
    
    display->setTextSize(2);
    drawCenteredText(destination, 45, 1);
    
    forceRefresh();
    currentScreen = "WAITING_CONFIRM";
    cachedDestination = destination;
    
    DEBUG_PRINTF("[OLED] Screen: WAITING_CONFIRM to %s\n", destination);
}

void OLEDDisplay::showRequestSent() {
    clearDisplay();
    drawTitleBar("Request Sent");
    
    display->setTextSize(1);
    drawCenteredText("Waiting for", 25, 1);
    drawCenteredText("available", 35, 1);
    drawCenteredText("rickshaw...", 45, 1);
    
    forceRefresh();
    currentScreen = "REQUEST_SENT";
    
    DEBUG_PRINTLN("[OLED] Screen: REQUEST_SENT");
}

void OLEDDisplay::showOfferIncoming() {
    clearDisplay();
    drawTitleBar("Offer Received!");
    
    display->setTextSize(2);
    drawCenteredText("INCOMING", 25, 1);
    drawCenteredText("OFFER", 40, 1);
    
    display->setTextSize(1);
    display->setCursor(5, 55);
    display->println("Please wait...");
    
    forceRefresh();
    currentScreen = "OFFER_INCOMING";
    
    DEBUG_PRINTLN("[OLED] Screen: OFFER_INCOMING");
}

void OLEDDisplay::showRideAccepted() {
    clearDisplay();
    drawTitleBar("Ride Accepted!");
    
    display->setTextSize(2);
    drawCenteredText("SUCCESS", 20, 1);
    
    display->setTextSize(1);
    drawCenteredText("Rickshaw is", 40, 1);
    drawCenteredText("on the way!", 50, 1);
    
    forceRefresh();
    currentScreen = "RIDE_ACCEPTED";
    
    DEBUG_PRINTLN("[OLED] Screen: RIDE_ACCEPTED");
}

void OLEDDisplay::showRideRejected(const char* reason) {
    clearDisplay();
    drawTitleBar("Request Failed");
    
    display->setTextSize(2);
    drawCenteredText("REJECTED", 20, 1);
    
    display->setTextSize(1);
    display->setCursor(5, 40);
    display->println(reason);
    
    display->setCursor(5, 55);
    display->println("Please try again");
    
    forceRefresh();
    currentScreen = "RIDE_REJECTED";
    
    DEBUG_PRINTF("[OLED] Screen: RIDE_REJECTED - %s\n", reason);
}

void OLEDDisplay::showError(const char* error) {
    clearDisplay();
    drawTitleBar("ERROR");
    
    display->setTextSize(1);
    display->setCursor(5, 20);
    display->println(error);
    
    display->setCursor(5, 55);
    display->println("Please retry");
    
    forceRefresh();
    currentScreen = "ERROR";
    
    DEBUG_PRINTF("[OLED] Screen: ERROR - %s\n", error);
}

void OLEDDisplay::showMessage(const char* line1, const char* line2, const char* line3) {
    clearDisplay();
    
    display->setTextSize(1);
    
    if (strlen(line1) > 0) {
        drawCenteredText(line1, 15, 1);
    }
    
    if (strlen(line2) > 0) {
        drawCenteredText(line2, 30, 1);
    }
    
    if (strlen(line3) > 0) {
        drawCenteredText(line3, 45, 1);
    }
    
    forceRefresh();
    currentScreen = "MESSAGE";
}

