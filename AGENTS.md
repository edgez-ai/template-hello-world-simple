# Hello World Simple project guide

Read this file before changing this repository.

## Product

This repository is intentionally minimal. Its only visible output is
`Hello World` on web, in the React Native app, and on the Heltec WiFi LoRa 32
V3 OLED. Do not add authentication, networking, provisioning, telemetry, or
other product behavior unless explicitly requested.

## Repository layout

| Path | Responsibility |
| --- | --- |
| `site/` | Next.js web page |
| `app/` | Expo + React Native app |
| `firmware/` | PlatformIO + ESP-IDF Heltec OLED firmware |
| `README.md` | Setup and validation guide |

## Validation

- Web: `cd site && npm run typecheck && npm run build`
- Mobile: `cd app && npm run typecheck`
- Firmware: `cd firmware && pio run`

`cd app && npm run android` must start Metro and open the project in the remote
EdgeZ Android DevTools client at `127.0.0.1:5555`. Do not run a local Gradle or
Expo native build unless the user explicitly requests one.
