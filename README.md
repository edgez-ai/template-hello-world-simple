# Hello World Simple

A minimal multi-platform starter that displays **Hello World** in three places:

- `site/` — a Next.js web page
- `app/` — an Expo + React Native app
- `firmware/` — Heltec WiFi LoRa 32 V3 firmware for the onboard OLED

Open `hello-world-simple.code-workspace` in VS Code to work with all three
projects together.

## Run locally

Install the JavaScript dependencies once:

```sh
(cd site && npm install)
(cd app && npm install)
```

Start the web app:

```sh
cd site
npm run web
```

Start the React Native app in the EdgeZ Android DevTools client connected at
`127.0.0.1:5555`:

```sh
cd app
npm run android
```

Build or upload the Heltec firmware with PlatformIO:

```sh
cd firmware
pio run
pio run --target upload
pio device monitor
```

The firmware prints `Hello World` to the serial console and displays it on the
board's 128x64 OLED. The Heltec V3 display uses SDA 17, SCL 18, reset 21, and
active-low Vext power on GPIO 36.

## Validate

```sh
(cd site && npm run typecheck && npm run build)
(cd app && npm run typecheck)
(cd firmware && pio run)
```
