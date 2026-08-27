# CLAUDE.md

Working notes for agents. Read this before touching the repo — most of it is
things that cost a cycle to rediscover.

## What this is

A fork of **God's Eye View** by Bilawal Sidhu (`bilawalsidhu/gods-eye-view`,
MIT) — a browser-based real-time geospatial intelligence console: Google
photorealistic 3D globe, 13 live data layers, sensor-style post-processing
shaders, and an OpenAI Realtime voice agent. Vanilla JS + CesiumJS + Vite, no
front-end framework.

The fork is being renamed **KEYHOLE**. See `ROADMAP.md` → Decisions for the
reasoning and for the AI provider split. `FORK-NOTES.md` records provenance.

## Hard requirements

| | |
|---|---|
| **Node** | **24.14.x–24.x or 26.x.** Enforced by `package.json` `engines`. Node 22 and 25 are rejected; 24.13 installs but warns `EBADENGINE`. |
| **Dev server** | `npm run dev -- --host localhost --port 4173` |
| **Tests** | `npm test` — 2,601 unit tests, expect 0 failures. Takes ~90s. |
| **Google key** | `GOOGLE_MAPS_API_KEY` is **required**. `src/main.js:85` throws deliberately without it — the app stops at the splash screen. |

`npm install` prints 9 high-severity audit warnings. These are upstream's
dependency choices, need breaking upgrades to resolve, and are expected — do not
"fix" them incidentally.

## The user's environment

**Windows, PowerShell 5.1.** This matters:

- `&&` is **not** a valid statement separator there. Never hand over bash
  one-liners chained with `&&`; give one command per line, or PowerShell syntax.
- Always bake the `cd` into every command block you hand over — the user has
  asked for this explicitly. Their project root is nested:
  `C:\Users\stewa\Literally-Palantir-But-Open-Source\Literally-Palantir-But-Open-Source`
- `Read-Host` **echoes** typed input unless given `-AsSecureString`. Use the
  secure form for anything secret.
- To edit `.env`: `(Get-Content .env) -replace '^KEY=.*', "KEY=value" | Set-Content .env -Encoding UTF8`.
  That only works if the line already exists — use `Add-Content` for a new one.

## Google Cloud — four APIs, not one

The README names only Map Tiles. The runtime calls three more, and each fails
with `REQUEST_DENIED`, which reads like a bad key rather than a missing
checkbox. All four must be enabled:

| API | Call site | Breaks without it |
|---|---|---|
| **Map Tiles** | client bootstrap | Everything. Required. |
| **Geocoding** | `src/locations.js`, `src/voice/gevActions.js`, `src/annotations/annotationResolver.js` | Search, fly-to-by-name, voice place lookup |
| **Places (New)** | `/api/google/nearby-places`, `/api/google/text-search` | Nearby/text-search panels return empty |
| **Street View Static** | `/api/cctv/frame` | CCTV fallback stills |

"Places API" and "Places API (New)" are different products. The code calls
`places.googleapis.com/v1/...` — the **(New)** one.

`GOOGLE_MAPS_API_KEY` and `CESIUM_ION_TOKEN` reach the browser by design and are
visible in devtools. Restrict them at the provider; do not try to hide them.
Every other key is brokered server-side through `vite.config.js` proxies.

A Maps Platform key will **not** authenticate against the Gemini API — different
product, different key (Google AI Studio), different console.

## Landmines

**`gev-` is not branding.** 218+ CSS classes and DOM ids use the `gev-` prefix.
It is an internal identifier. Renaming work must leave it completely alone.

**Attribution is a licence obligation, not politeness.** Bundled datasets carry
their own licences independent of the MIT code licence — several are ODbL or
CC BY-NC-SA with share-alike terms. Any new data source must be registered in
**both** `DATA_SOURCES.md` and `src/data/dataCredits.js`. Never strip
attribution while rebranding.

**The analyst engine has no LLM in it.** `src/data/analystEngine.js` is pure
local query logic — its header says *"the engine never fetches."* A spoken
question resolves as: Realtime parses intent → **local JS filters** → Realtime
narrates. Making the analyst smarter is not a provider swap; there is no call to
swap. See `ROADMAP.md` → Decisions.

**Panel dragging is live — and was dormant for a subtle reason.** `src/ui.js`
shipped the whole system (z-promotion, viewport clamping, `localStorage`
persistence, resize re-clamping) but `_initPanelDrag` looked up a
`.panel-drag-handle` element that `index.html` never contained. The lookup
returned `null`, the spec was filtered out, and **no panel was draggable at
all**. Handles now exist on seven panels, listed in `DRAGGABLE_PANEL_IDS`.
`src/panelDragRegistry.test.mjs` fails if a registered panel loses its handle
or a handle appears with no registration.

`control-panel` and `location-bar` are deliberately excluded: control-panel's
header is a `<button>`, which the drag handler's interactive-element guard
rejects by design, and location-bar is dock-anchored with no header row.

**Brand strings resolve from `src/brand.js`.** Renaming once cost a sweep across
nine files, so runtime strings import from there. Two spots cannot: `index.html`
is static markup served before any module evaluates, so its `<title>` and `<h1>`
wordmark are literals — `BRAND_STATIC_MARKUP_SITES` lists them.

**The voice tool schema is frozen by SHA-256.** `src/firstRunExperience.test.mjs`
hashes the `GEV_REALTIME_TOOLS` block in `vite.config.js` and asserts an exact
byte length and digest, because a schema edit busts the Realtime session cache.
Tool *descriptions* inside that block still say "God's Eye View" on purpose —
they are routing hints for the model, not user-visible identity, and rebranding
them would have broken the freeze for no functional gain. The agent's identity
string (the system prompt) sits outside the block and *is* rebranded.

**Endpoints for unset keys return 503 by design.** `/api/firms`,
`/api/ais-live`, `/api/realtime/token` all do this. It is the proxy declining to
call upstream, not a fault.

## Layout

```
index.html              # Full UI markup — large; brand strings live here too
style.css               # ~250KB, single stylesheet
vite.config.js          # ~320KB — NOT just build config. All server-side API
                        # proxies, key brokering, rate limits and caches live here.
src/
├── main.js             # Bootstrap: Google 3D tiles, layer registration
├── ui.js               # Runtime UI — panels, HUD, drag system
├── data/               # One module per layer + analystEngine + dataCredits
│   └── local_data/     # Bundled datasets, per-folder provenance README
├── voice/              # OpenAI Realtime session + 31 voice actions
├── overlays/           # Screen-space label allocator
└── scenes/             # Cinematic scene director
docs/CURRENT-STATE.md   # Authoritative runtime reference (~270KB)
```

Tests are colocated as `*.test.mjs` beside the module they cover.

## Conventions

- Match surrounding style. The codebase uses thorough JSDoc headers explaining
  *why*, not just what — follow that.
- Server-side proxies are fixed-destination or allowlisted. Keep it that way.
- Before pushing: run `npm test` and confirm 0 failures.
- Branch work per the session's assigned branch; open PRs as drafts.
