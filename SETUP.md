# Setup: what you need to provide

The operator's checklist for running KEYHOLE locally. Since the 11/21/2026
upstream sync, the app starts with **no keys at all**; every key adds a layer
or an upgrade. Upstream's README ([README.upstream.md](README.upstream.md),
section "API keys") and the comments in `.env.example` are the full,
maintained reference; this file is the short version.

## 1. Prerequisites

| | |
|---|---|
| **Node.js** | 24.14 or newer within 24.x, or 26.x. Enforced by `package.json`. |
| **Browser** | Anything with WebGL2 (current Chrome, Edge, Safari, Firefox). |

## 2. Run it

In Windows PowerShell 5.1:

```powershell
cd "C:\Users\stewa\Documents\Claude\Literally-Palantir-But-Open-Source"; npm install; npm run dev -- --host localhost --port 4300
```

Open <http://localhost:4300>. Without keys the globe runs in 2D on Esri
imagery with keyless terrain.

`npm run doctor` reports Node readiness and which providers it found, without
printing key values.

## 3. Keys worth getting

| Key (`.env`) | Adds |
|---|---|
| `GOOGLE_MAPS_API_KEY` | Google Photorealistic 3D Tiles, the city mesh the tours are built around. Needs Map Tiles API; Geocoding, Places (New) and Maps JavaScript (Street View) add search and street level. Restrict it to your referrer: it reaches the browser by design. |
| `AISSTREAM_API_KEY` | Live global ship positions. Free. |
| `FIRMS_MAP_KEY` | Live active-fire hotspots. Free. |
| `TOMTOM_API_KEY` | Live traffic flow on the traffic layer's roads. Free tier. |
| `OPENAI_API_KEY` or `GEMINI_API_KEY` | Voice control and chat. Metered; set a provider-side limit. |
| `CESIUM_ION_TOKEN` | Cesium ion imagery and terrain options. Public `assets:read` token. |
| `OVERPASS_UPSTREAMS` | Overpass-backed features (voice place search, ALPR and similar). Only instances you run or pay for; public instances are not used. |

## 4. If a key in `.env` seems ignored

A shell or Windows User environment variable with the same name wins over
`.env`. Check both, then restart the dev server:

```powershell
cd "C:\Users\stewa\Documents\Claude\Literally-Palantir-But-Open-Source"; $env:GOOGLE_MAPS_API_KEY.Length; [Environment]::GetEnvironmentVariable('GOOGLE_MAPS_API_KEY','User').Length
```

Endpoints for keys you have not set return 503 by design.

## 5. Before you expose it to anyone else

The dev server binds to localhost on purpose: it brokers your keys. Read
[SECURITY.md](SECURITY.md) and set provider-side budgets before binding it to a
network.
