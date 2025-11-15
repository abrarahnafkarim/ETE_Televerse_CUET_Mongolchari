/*
 * UIManager.cpp
 * Implementation of user interface management
 */

#include "UIManager.h"

UIManager::UIManager() : 
    display(OLED_SCREEN_WIDTH, OLED_SCREEN_HEIGHT, &Wire, -1),
    currentLEDPattern(LED_OFF),
    lastLEDToggle(0),
    ledState(false),
    blinkCount(0),
    buzzerActive(false),
    buzzerEndTime(0),
    currentPage(PAGE_IDLE),
    lastScreenUpdate(0) {
    
    for (int i = 0; i < 4; i++) {
        lastButtonPress[i] = 0;
        buttonStates[i] = false;
    }
}

void UIManager::begin() {
    DEBUG_PRINTLN(F("[UI] Initializing UI Manager..."));
    
    // Initialize I2C (0.96" 4-pin OLED)
    Wire.begin(OLED_SDA_PIN, OLED_SCL_PIN);
    Wire.setClock(400000);  // 400kHz I2C clock speed
    
    // Initialize OLED (I2C mode)
    if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_I2C_ADDRESS)) {
        DEBUG_PRINTLN(F("[UI] ERROR: SSD1306 I2C allocation failed"));
        DEBUG_PRINTF("[UI] Tried I2C address: 0x%02X\n", OLED_I2C_ADDRESS);
        DEBUG_PRINTLN(F("[UI] If failed, try changing OLED_I2C_ADDRESS to 0x3D in Config.h"));
        // Continue anyway - display might not be connected
    } else {
        DEBUG_PRINTLN(F("[UI] OLED I2C initialized (0.96\" 128x64, address 0x3C)"));
    }
    
    // Clear display buffer
    display.clearDisplay();
    display.display();
    delay(50);
    
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.println(F("AERAS Rickshaw Unit"));
    display.println(F("Initializing..."));
    display.display();
    
    // Initialize buttons
    pinMode(BTN_ACCEPT_PIN, INPUT_PULLUP);
    pinMode(BTN_REJECT_PIN, INPUT_PULLUP);
    pinMode(BTN_PICKUP_PIN, INPUT_PULLUP);
    pinMode(BTN_DROP_PIN, INPUT_PULLUP);
    
    // Initialize LED
    pinMode(LED_STATUS_PIN, OUTPUT);
    digitalWrite(LED_STATUS_PIN, LOW);
    
    // Initialize buzzer
    pinMode(BUZZER_PIN, OUTPUT);
    digitalWrite(BUZZER_PIN, LOW);
    
    DEBUG_PRINTLN(F("[UI] UI Manager initialized"));
    
    beepPattern(2, 100, 100); // Startup beep
}

void UIManager::update() {
    updateLED();
    
    // Handle buzzer
    if (buzzerActive && millis() >= buzzerEndTime) {
        digitalWrite(BUZZER_PIN, LOW);
        buzzerActive = false;
    }
}

ButtonState UIManager::readButtons() {
    unsigned long currentTime = millis();
    
    // Check each button with debouncing
    const uint8_t buttonPins[] = {BTN_ACCEPT_PIN, BTN_REJECT_PIN, BTN_PICKUP_PIN, BTN_DROP_PIN};
    const ButtonState buttonIds[] = {BTN_ACCEPT, BTN_REJECT, BTN_PICKUP, BTN_DROP};
    
    for (int i = 0; i < 4; i++) {
        bool pressed = !digitalRead(buttonPins[i]); // Active LOW
        
        if (pressed && !buttonStates[i] && (currentTime - lastButtonPress[i] > BUTTON_DEBOUNCE_MS)) {
            buttonStates[i] = true;
            lastButtonPress[i] = currentTime;
            DEBUG_PRINTF("[UI] Button pressed: %d\n", buttonIds[i]);
            beep();
            return buttonIds[i];
        } else if (!pressed) {
            buttonStates[i] = false;
        }
    }
    
    return BTN_NONE;
}

bool UIManager::isButtonPressed(uint8_t pin) {
    return !digitalRead(pin); // Active LOW
}

void UIManager::setLED(LEDPattern pattern) {
    currentLEDPattern = pattern;
    blinkCount = 0;
    
    if (pattern == LED_OFF) {
        digitalWrite(LED_STATUS_PIN, LOW);
        ledState = false;
    } else if (pattern == LED_ON) {
        digitalWrite(LED_STATUS_PIN, HIGH);
        ledState = true;
    }
}

void UIManager::updateLED() {
    unsigned long currentTime = millis();
    uint16_t interval = 0;
    
    switch (currentLEDPattern) {
        case LED_SLOW_BLINK:
            interval = 500; // 1 Hz (500ms on, 500ms off)
            break;
        case LED_FAST_BLINK:
            interval = 100; // 5 Hz (100ms on, 100ms off)
            break;
        case LED_DOUBLE_BLINK:
            // Implement double blink pattern
            if (currentTime - lastLEDToggle >= 100) {
                ledState = !ledState;
                digitalWrite(LED_STATUS_PIN, ledState);
                lastLEDToggle = currentTime;
                blinkCount++;
                
                if (blinkCount >= 4) { // 2 blinks (4 toggles)
                    blinkCount = 0;
                    delay(500); // Gap before repeat
                }
            }
            return;
        default:
            return;
    }
    
    if (interval > 0 && (currentTime - lastLEDToggle >= interval)) {
        ledState = !ledState;
        digitalWrite(LED_STATUS_PIN, ledState);
        lastLEDToggle = currentTime;
    }
}

void UIManager::beep(uint16_t duration) {
    digitalWrite(BUZZER_PIN, HIGH);
    buzzerActive = true;
    buzzerEndTime = millis() + duration;
}

void UIManager::beepPattern(uint8_t count, uint16_t duration, uint16_t gap) {
    for (uint8_t i = 0; i < count; i++) {
        digitalWrite(BUZZER_PIN, HIGH);
        delay(duration);
        digitalWrite(BUZZER_PIN, LOW);
        if (i < count - 1) {
            delay(gap);
        }
    }
}

void UIManager::clearDisplay() {
    display.clearDisplay();
}

void UIManager::showIdleScreen(const String& driverName, uint8_t satellites, float points) {
    currentPage = PAGE_IDLE;
    display.clearDisplay();
    
    // Title
    display.setTextSize(1);
    drawCenteredText("AERAS Rickshaw", 0);
    
    // Driver name
    display.setTextSize(1);
    drawCenteredText(driverName, 15);
    
    // Status line
    display.setCursor(0, 30);
    display.print(F("Status: IDLE"));
    
    // GPS info
    display.setCursor(0, 40);
    display.print(F("GPS: "));
    display.print(satellites);
    display.print(F(" sats"));
    
    // Points
    display.setCursor(0, 50);
    display.print(F("Points: "));
    display.print(points, 1);
    
    display.display();
}

void UIManager::showRideNotification(const RideInfo& ride) {
    currentPage = PAGE_RIDE_NOTIFICATION;
    display.clearDisplay();
    
    display.setTextSize(1);
    drawCenteredText("NEW RIDE!", 0);
    
    display.setCursor(0, 15);
    display.print(F("Pickup:"));
    display.setCursor(0, 25);
    display.setTextSize(1);
    display.print(ride.pickupAddress.substring(0, 20));
    
    display.setCursor(0, 35);
    display.print(F("Dist: "));
    display.print(formatDistance(ride.distanceToPickup));
    
    display.setCursor(0, 45);
    display.print(F("Pts: "));
    display.print(ride.estimatedPoints, 1);
    
    if (ride.eta > 0) {
        display.setCursor(0, 55);
        display.print(F("ETA: "));
        display.print(formatETA(ride.eta));
    }
    
    display.display();
    beepPattern(3, 200, 100);
}

void UIManager::showEnrouteToPickup(const RideInfo& ride, double currentDistance) {
    currentPage = PAGE_ENROUTE;
    display.clearDisplay();
    
    display.setTextSize(1);
    drawCenteredText("EN ROUTE TO PICKUP", 0);
    
    display.setCursor(0, 15);
    display.print(F("Pickup:"));
    display.setCursor(0, 25);
    display.print(ride.pickupAddress.substring(0, 20));
    
    display.setCursor(0, 40);
    display.print(F("Distance: "));
    display.print(formatDistance(currentDistance));
    
    // Progress bar
    uint8_t progress = 100 - (uint8_t)((currentDistance / ride.distanceToPickup) * 100);
    progress = constrain(progress, 0, 100);
    drawProgressBar(0, 55, 128, 8, progress);
    
    display.display();
}

void UIManager::showArrivedAtPickup(const RideInfo& ride) {
    currentPage = PAGE_ARRIVED;
    display.clearDisplay();
    
    display.setTextSize(2);
    drawCenteredText("ARRIVED!", 10);
    
    display.setTextSize(1);
    drawCenteredText("Press PICKUP to", 35);
    drawCenteredText("confirm passenger", 45);
    
    display.display();
    beepPattern(2, 300, 200);
}

void UIManager::showRideActive(const RideInfo& ride, double distanceToDrop) {
    currentPage = PAGE_RIDE_ACTIVE;
    display.clearDisplay();
    
    display.setTextSize(1);
    drawCenteredText("RIDE IN PROGRESS", 0);
    
    display.setCursor(0, 15);
    display.print(F("Drop:"));
    display.setCursor(0, 25);
    display.print(ride.dropAddress.substring(0, 20));
    
    display.setCursor(0, 40);
    display.print(F("Distance: "));
    display.print(formatDistance(distanceToDrop));
    
    display.setCursor(0, 50);
    display.print(F("Pts: "));
    display.print(ride.estimatedPoints, 1);
    
    display.display();
}

void UIManager::showCompletedScreen(float pointsAwarded, bool needsReview) {
    currentPage = PAGE_COMPLETED;
    display.clearDisplay();
    
    display.setTextSize(2);
    drawCenteredText("COMPLETE!", 10);
    
    display.setTextSize(1);
    display.setCursor(0, 35);
    display.print(F("Points: "));
    display.setTextSize(2);
    display.print(pointsAwarded, 1);
    
    if (needsReview) {
        display.setTextSize(1);
        drawCenteredText("(Pending Review)", 55);
    }
    
    display.display();
    beepPattern(4, 100, 100);
}

void UIManager::showErrorScreen(const String& errorMsg) {
    currentPage = PAGE_ERROR;
    display.clearDisplay();
    
    display.setTextSize(1);
    drawCenteredText("ERROR", 10);
    
    display.setCursor(0, 30);
    display.print(errorMsg.substring(0, 20));
    
    display.display();
}

void UIManager::showConnectionStatus(bool wifi, bool mqtt, bool gps) {
    display.setCursor(0, 0);
    display.print(F("W:"));
    display.print(wifi ? "Y" : "N");
    display.print(F(" M:"));
    display.print(mqtt ? "Y" : "N");
    display.print(F(" G:"));
    display.print(gps ? "Y" : "N");
}

void UIManager::showMessage(const String& msg, uint16_t duration) {
    display.clearDisplay();
    display.setTextSize(1);
    drawCenteredText(msg, 28);
    display.display();
    delay(duration);
}

void UIManager::drawProgressBar(int16_t x, int16_t y, uint16_t width, uint16_t height, uint8_t percent) {
    percent = constrain(percent, 0, 100);
    
    // Draw border
    display.drawRect(x, y, width, height, SSD1306_WHITE);
    
    // Draw fill
    uint16_t fillWidth = ((width - 4) * percent) / 100;
    if (fillWidth > 0) {
        display.fillRect(x + 2, y + 2, fillWidth, height - 4, SSD1306_WHITE);
    }
}

void UIManager::drawCenteredText(const String& text, int16_t y, uint8_t size) {
    display.setTextSize(size);
    int16_t x1, y1;
    uint16_t w, h;
    display.getTextBounds(text, 0, 0, &x1, &y1, &w, &h);
    int16_t x = (OLED_SCREEN_WIDTH - w) / 2;
    display.setCursor(x, y);
    display.print(text);
}

void UIManager::drawRightAlignedText(const String& text, int16_t y, int16_t x, uint8_t size) {
    display.setTextSize(size);
    int16_t x1, y1;
    uint16_t w, h;
    display.getTextBounds(text, 0, 0, &x1, &y1, &w, &h);
    display.setCursor(x - w, y);
    display.print(text);
}

String UIManager::formatDistance(double meters) {
    if (meters < 1000) {
        return String((int)meters) + "m";
    } else {
        return String(meters / 1000.0, 1) + "km";
    }
}

String UIManager::formatETA(double seconds) {
    if (seconds < 0) return "N/A";
    
    int mins = (int)(seconds / 60);
    if (mins < 60) {
        return String(mins) + "min";
    } else {
        int hrs = mins / 60;
        mins = mins % 60;
        return String(hrs) + "h" + String(mins) + "m";
    }
}

uint8_t UIManager::getPinForButton(ButtonState btn) {
    switch (btn) {
        case BTN_ACCEPT: return BTN_ACCEPT_PIN;
        case BTN_REJECT: return BTN_REJECT_PIN;
        case BTN_PICKUP: return BTN_PICKUP_PIN;
        case BTN_DROP: return BTN_DROP_PIN;
        default: return 0;
    }
}

