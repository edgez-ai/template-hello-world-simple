# Hello World Simple

A minimal multi-platform starter that displays **Hello World** in three places:

- `site/` — a Next.js web page
- `app/` — an Expo + React Native app
- `firmware/` — Heltec WiFi LoRa 32 V3 firmware for the onboard OLED

[![Deploy on EdgeZ](https://img.shields.io/badge/Deploy%20on-EdgeZ-6c5ce7?style=for-the-badge)](https://appwrite.edgez.ai/console/deploy?repo=https%3A%2F%2Fgithub.com%2Fedgez-ai%2Ftemplate-hello-world-simple)

Open `hello-world-simple.code-workspace` in VS Code to work with all three
projects together.

The root [`edgez.json`](edgez.json) is the shared EdgeZ project manifest. It points to the
declarative [`appwrite.config.json`](appwrite.config.json), which the deploy button applies after
project selection, and records the mobile and firmware workspace locations.

The deploy button, CI, and Codex should all execute the same deterministic
Appwrite CLI engine; AI does not interpret the manifest into API calls:

```sh
export APPWRITE_PROJECT_ID="<PROJECT_ID>"
export APPWRITE_API_KEY="<API_KEY>"
scripts/deploy-appwrite.sh plan
scripts/deploy-appwrite.sh compare
scripts/deploy-appwrite.sh apply
```

`apply` refuses a dirty worktree and records the Git commit, config digest,
target project, timestamp, and CLI version in an ignored local deployment
receipt. The checked-in config is the version-controlled desired state;
`compare` reports drift against Appwrite.

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
