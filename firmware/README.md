# Heltec WiFi LoRa 32 V3 firmware

This ESP-IDF program powers the onboard 128x64 SSD1306 OLED and displays
`HELLO WORLD`. It also prints `Hello World` at 115200 baud.

The display connections are SDA 17, SCL 18, reset 21, and active-low Vext on
GPIO 36. No Wi-Fi, Bluetooth, LoRa, or external component is required.

```sh
pio run
pio run --target upload
pio device monitor
```
