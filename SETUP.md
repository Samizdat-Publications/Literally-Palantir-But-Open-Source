# Setup: what you need to provide

This is the operator's checklist for standing up God's Eye View. The
[README](README.md) explains *what the app does*; this file covers *what you have to
go get* before it does it.

Everything below was verified against this repository on Node 24.20.0.

---

## 1. Prerequisites

| | |
|---|---|
| **Node.js** | **24.14.x–24.x or 26.x.** Enforced by `package.json`. Node 22 and Node 25 are rejected. |
| **Browser** | Anything with WebGL2 (current Chrome, Edge, Safari, Firefox). |
| **Disk** | ~500 MB for `node_modules`, plus a small `.gev-cache/` for proxy caches. |

If your system Node is a different major version, install 24 alongside it:

```bash
nvm install 24 && nvm use 24
node --version    # expect v24.x
```

---

## 2. The short version

**One key gets you in the door.** Copy the env file, paste a Google Maps key, run:

```bash
cp .env.example .env
# edit .env, set GOOGLE_MAPS_API_KEY=...
npm install
npm run dev -- --host localhost --port 4173
```

Open <http://localhost:4173>.

Without `GOOGLE_MAPS_API_KEY` the app **stops at the splash screen**: `src/main.js`
throws deliberately rather than booting a globe with no planet on it. Every other key
is optional and only lights up one more layer.

---

## 3. Google Maps: the one required key

Get it at **<https://console.cloud.google.com/>** → *APIs & Services → Credentials →
Create credentials → API key*. You need a project with **billing enabled**; Maps
Platform is metered.

### Enable four APIs, not one

The README mentions Map Tiles. That is the one that blocks startup, but the code calls
three more, and each fails with a `REQUEST_DENIED` / 403 that is easy to misread as a
bad key. Enable all four under *APIs & Services → Library*:

| API | What breaks without it |
|---|---|
| **Map Tiles API** | Nothing loads: the photorealistic 3D planet itself. **Required.** |
| **Geocoding API** | Search box, "fly me to X" by name, and voice place lookups all fail (`src/locations.js`, `src/voice/gevActions.js`, `src/annotations/annotationResolver.js`). |
| **Places API (New)** | The nearby-places and text-search panels return empty (`/api/google/nearby-places`, `/api/google/text-search`). |
| **Street View Static API** | CCTV cameras lose their fallback still frames when a municipal feed is down (`/api/cctv/frame`). |

### Restrict the key

This key is **injected into the browser bundle by design** and is visible in devtools.
Hiding it is not the control; scoping it is:

- *Application restrictions* → **HTTP referrers**, add `http://localhost:4173/*`.
- *API restrictions* → **Restrict key**, select only the four APIs above.
- *Billing → Budgets & alerts* → set a budget. The in-app throttles are not billing caps.

---

## 4. Optional keys, in the order they are worth getting

Every one of these is genuinely optional: the app runs without all of them.

| Key | Unlocks | Cost | Where |
|---|---|---|---|
| **AISStream** | 🚢 Live global ship positions | Free | <https://aisstream.io> |
| **NASA FIRMS** | 🔥 Live active-fire thermal hotspots | Free | <https://firms.modaps.eosdis.nasa.gov/api/map_key/> |
| **TomTom** | 🚦 Real traffic instead of the built-in simulation | Free developer tier | <https://developer.tomtom.com> |
| **OpenAI** | 🎙️ Voice control + AI HUD summaries | Metered | <https://platform.openai.com> |
| **Cesium ion** | 🗺️ Bing imagery basemap stacks | Free tier | <https://cesium.com/ion> |
| **OpenSky** | ✈️ Higher aircraft polling limits | Free account | <https://opensky-network.org> |
| **Launch Library 2** | 🚀 Higher space-mission request allowance | Free | <https://thespacedevs.com> |
| **TfL** | 📹 Higher London JamCam list rate limit | Free | <https://api-portal.tfl.gov.uk> |

Notes worth knowing before you sign up for any of them:

- **OpenAI** is the only optional key that costs real money in normal use. Realtime
  audio is billed per minute of conversation. The app shows a live session estimate,
  warns at $2, and hard-caps a session at $5, but set a provider-side usage limit
  under *Settings → Limits* as the actual backstop.
- **TomTom, OpenSky, Launch Library 2, and TfL** all degrade gracefully. Traffic falls
  back to a simulation, aircraft fall back to anonymous polling, launches and London
  cameras just use the lower anonymous rate limit. Skip them until a layer feels slow.
- **OpenSky** defaults to `OPENSKY_AUTH_MODE=oauth`, but with no credentials set it
  still serves anonymous aircraft. Verified: a keyless `/api/opensky` request returned
  1.8 MB of live traffic. Set `OPENSKY_AUTH_MODE=anon` to skip the auth attempt.
- **Cesium ion** should be a public `assets:read` token; it reaches the browser too.

---

## 5. What already works with zero keys

Beyond the Google key, most of the globe needs no signup at all:

| Layer | Source |
|---|---|
| ✈️ Civilian aircraft | OpenSky, anonymous |
| 🎖️ Military aircraft | adsb.lol |
| 🛰️ Satellites & orbits | CelesTrak TLEs, propagated locally with SGP4 |
| 🌍 Earthquakes | USGS |
| 📹 CCTV | Austin, Caltrans, and London TfL open-data feeds |
| 📻 Radio | Radio Browser |
| 🚲 Bikeshare | GBFS |
| 🚀 Space missions | Launch Library 2, anonymous |
| 🌐 Cables, dams, datacenters, installations | Bundled datasets + OSM/Overpass |

---

## 6. Verify the install

```bash
npm test                 # 2,601 unit tests, expect 0 failures
npm run dev -- --host localhost --port 4173
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4173/   # expect 200
```

Endpoints for keys you have not set return **503** by design; that is the proxy
declining to call upstream, not a failure. `/api/firms`, `/api/ais-live`, and
`/api/realtime/token` all behave this way until their key is present.

---

## 7. Before you expose it to anyone else

The dev server binds to **localhost** on purpose: it brokers your keys, so anyone who
can reach it can spend your quota. If you set `HOST=0.0.0.0`, first:

1. Set provider-side budgets (Google Cloud budgets, OpenAI usage limits). These are the
   only real spend protection.
2. Set the in-app per-IP throttles `GEV_RATELIMIT_GOOGLE_PER_MIN` and
   `GEV_RATELIMIT_OPENAI_PER_MIN`. They are process-local guards, not billing caps.

Full threat model in [SECURITY.md](SECURITY.md).
