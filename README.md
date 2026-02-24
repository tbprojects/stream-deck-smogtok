# Stream Deck Smogtok

An Elgato Stream Deck plugin that displays air quality and temperature data from [smogtok.com](https://smogtok.com/) sensors.

## Features

- **AQI view** (default) — colored background based on the IJP air quality index with current temperature:
  - 🔵 blue — very good
  - 🟢 green — good
  - 🟡 yellow — satisfactory
  - 🟠 orange — bad
  - 🔴 red — very bad
  - 🟣 purple — hazardous
- **Details view** — temperature, humidity and pressure
- **Short press** — toggles between AQI and details views
- **Long press** (≥ 500 ms) — opens the probe page (`smogtok.com/onedevice?probeId=…`) in the default browser
- Data refreshed automatically every 60 s

## Requirements

- [Node.js](https://nodejs.org/) 20+
- [Stream Deck](https://www.elgato.com/stream-deck) application 6.9+
- A sensor probe ID from [smogtok.com](https://smogtok.com/)

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Build the plugin

```bash
npm run build
```

The compiled bundle is written to `com.tbprojects.smogtok.sdPlugin/bin/plugin.js`.

### 3. Install the plugin in Stream Deck

Create a symbolic link from the `.sdPlugin` directory to the Stream Deck plugins folder:

```bash
# macOS
ln -sf "$(pwd)/com.tbprojects.smogtok.sdPlugin" \
  "$HOME/Library/Application Support/com.elgato.StreamDeck/Plugins/com.tbprojects.smogtok.sdPlugin"

# Windows (PowerShell — run as Administrator)
New-Item -ItemType SymbolicLink `
  -Path "$env:APPDATA\Elgato\StreamDeck\Plugins\com.tbprojects.smogtok.sdPlugin" `
  -Target "$PWD\com.tbprojects.smogtok.sdPlugin"
```

### 4. Restart Stream Deck

```bash
npm run restart
```

Or close and reopen the Stream Deck application manually. The plugin will appear in the action list under **Smogtok**.

### 5. Watch mode (auto-rebuild)

```bash
npm run watch
```

The plugin is rebuilt automatically on every source change. Restart Stream Deck after each rebuild to reload the plugin.

## Configuration

After dragging the **Air Quality** action onto a key, fill in the Property Inspector:

| Field | Description |
|-------|-------------|
| **Probe ID** | The numeric ID of your sensor — see below |

### How to find the Probe ID

1. Open [smogtok.com](https://smogtok.com/) and navigate to your sensor.
2. The URL will look like:
   ```
   smogtok.com/onedevice?probeId=9999
   ```
3. The number after `probeId=` is your **Probe ID**.

## Distribution

### Prerequisites

Install the [Stream Deck CLI](https://docs.elgato.com/streamdeck/cli/intro) globally:

```bash
npm install -g @elgato/cli@latest
```

Verify the installed version:

```bash
streamdeck -v
```

### Package for distribution

```bash
npm run pack
```

This command:
1. Runs `npm run build` — compiles TypeScript to `bin/plugin.js`
2. Runs `streamdeck pack` — validates and bundles the `.sdPlugin` directory into a `.streamDeckPlugin` installer file

The resulting `com.tbprojects.smogtok.streamDeckPlugin` file can be distributed directly (double-click to install).

> Source maps and runtime logs are excluded from the package via `.sdignore`.

## Project structure

```
stream-deck-smogtok/
├── src/
│   ├── plugin.ts                    # entry point — action registration
│   ├── types.ts                     # types (SmogtokSettings, SmogtokData)
│   ├── canvas.ts                    # SVG image builder
│   └── actions/
│       └── air-quality.ts           # main action logic
├── com.tbprojects.smogtok.sdPlugin/
│   ├── manifest.json                # plugin metadata
│   ├── package.json                 # required for ESM support
│   ├── bin/                         # compiled output (git-ignored)
│   ├── imgs/                        # plugin and action icons
│   └── ui/
│       └── property-inspector.html  # settings panel
├── rollup.config.mjs                # bundler configuration
├── tsconfig.json
└── package.json
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | One-time build |
| `npm run watch` | Build with auto-rebuild on changes |
| `npm run pack` | Build + package into `.streamDeckPlugin` |
| `npm run restart` | Restart the Stream Deck application (macOS) |

eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiIwX2luZm8udGJwcm9qZWN0c0BnbWFpbC5jb21fMiIsIm1vZGlmeV9wYXNzd29yZCI6MSwic2NvcGUiOlsiYWxsIl0sImRldGFpbCI6eyJvcmdhbml6YXRpb25JZCI6MCwidG9wR3JvdXBJZCI6bnVsbCwiZ3JvdXBJZCI6bnVsbCwicm9sZUlkIjotMSwidXNlcklkIjoxMzEzMzM3NiwidmVyc2lvbiI6MTAwMSwiaWRlbnRpZmllciI6ImluZm8udGJwcm9qZWN0c0BnbWFpbC5jb20iLCJpZGVudGl0eVR5cGUiOjIsIm1kYyI6IkZPUkVJR05fMSIsImFwcElkIjpudWxsLCJuYW1lIjpudWxsLCJyb2xlSWRzIjpudWxsLCJ0ZW5hbnRPcmdJZCI6bnVsbCwic2lnblJlbElkIjpudWxsLCJ0ZW5hbnRMb2dpbkVudW0iOiJPVEhFUiJ9LCJleHAiOjE3NzU0Mjg0NzAsIm1kYyI6IkZPUkVJR05fMSIsImF1dGhvcml0aWVzIjpbImFsbCJdLCJqdGkiOiI0NTg1M2E2ZC1hYWNjLTQ5ZTQtYTM1Ny0yMzljY2E5NDk0NzgiLCJjbGllbnRfaWQiOiJ0ZXN0In0.cBchDKsaMAg2AHdZOxr69rf_SfPQ1Dw7HMj4VpM5LGn8ESKuDl-U4iap5U4eFwBZU7APT517LWZcEzv6oo3Xe5Iuq23-4_SisEmhGLEkmRT47m0NeQE1-_eTm13lpuFA2jibDCYI6jm23o-9OTehHW2NtlG3sqOuWdvCftZNEfk4NdWx1AeQ6Us0mnAO2a0Y519ZWlclEbZ8vUDAlACvRc8Q9G-Xm0F53A6mzikfi-AFqmkDTsU9TBSCdsVUaBiyAhdwDvgzeWrjgJxhTCkegiLIa3vGPAX6_OtH2RmFxFzSzhfKkOW9U0oAaNN8US4SXRijp13uMCPD57pUYJLAKw
61179206
