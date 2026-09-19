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
| `edgez.json` | EdgeZ deployment and workspace manifest |
| `appwrite.config.json` | Declarative Appwrite infrastructure and code deployment plan |
| `infra/` | Deterministic Node.js install, uninstall, and drift engine using the pinned Appwrite CLI |
| `README.md` | Setup and validation guide |

## Validation

- Web: `cd site && npm run typecheck && npm run build`
- Mobile: `cd app && npm run typecheck`
- Firmware: `cd firmware && pio run`

`cd app && npm run android` must start Metro and open the project in the remote
EdgeZ Android DevTools client at `127.0.0.1:5555`. Do not run a local Gradle or
Expo native build unless the user explicitly requests one.

Do not translate `appwrite.config.json` into ad-hoc API calls. Use the commands
in `infra/` so humans, CI, and agents run the same deterministic Appwrite CLI
engine. Run `npm run plan`, then `npm run compare`, then
`npm run install:solution` from that directory. Keep stable resource IDs in the
config and commit configuration changes before installing.
`npm run uninstall:solution` is destructive and must only run with explicit
authorization; it removes declared resources but preserves users and unrelated
project resources.
