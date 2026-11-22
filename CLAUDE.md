# CLAUDE.md

Working notes for agents. Read this before touching the repo.

## What this is

A fork of **God's Eye View** by Bilawal Sidhu and contributors
(`bilawalsidhu/gods-eye-view`, MIT), renamed **KEYHOLE**. A browser-based
real-time geospatial console: CesiumJS globe (Google photorealistic 3D tiles
with a key, keyless Esri imagery without), about 40 live data layers, sensor
shaders, a director/stories system, and OpenAI or Gemini voice agents.

On 11/21/2026 the fork was synced to upstream `d9d79eb` (5,332 upstream commits
since our 08/24/2026 import). Upstream's tree was taken wholesale; our earlier
code changes were dropped. What we carry on top is small on purpose, so the
next `git merge upstream/main` stays easy. `FORK-NOTES.md` has the list.

Upstream is now JavaScript with **Vue 3** views (`src/ui/views/*.vue`), a
Node provider layer in `server/` (the old 320 KB `vite.config.js` is now a
three-line re-export of `server/standalone/vite.config.js`), i18n through
`msg()`/`t()` with locale catalogs in `src/i18n/locales/`.

## Hard requirements

| | |
|---|---|
| **Node** | `>=24.14.0 <25 \|\| >=26 <27` (package.json `engines`). |
| **Dev server** | `npm run dev -- --host localhost --port 4300` (upstream default is 4173; in the in-app browser 4173 has a stale service worker from another project). |
| **Tests** | `npm test` crashes on Windows with `ENAMETOOLONG`: `scripts/run-unit-tests.mjs` passes all ~1,300 test paths in one spawn, over the 32 KB command-line limit. Run the same plan in chunks (see the PR that did the 11/21/2026 sync for the script), or fix it upstream. Expect 17 Windows-only failures in upstream's architecture tests (render contract, unbound factories, input ownership, heights, Cesium internals): they compare `src\...` paths against forward-slash lists. Do not run the suite while a dev server compiles; load causes dozens of spurious timeouts. Three upstream tests that check README facts were pointed at `README.upstream.md`. |
| **Keys** | None required. Without `GOOGLE_MAPS_API_KEY` the globe starts in 2D on Esri imagery. |

## The user's environment

**Windows, PowerShell 5.1.** Never hand over bash chains with `&&`; bake the
`cd` into every command block. Repo root:
`C:\Users\stewa\Documents\Claude\Literally-Palantir-But-Open-Source`
(a nested duplicate checkout of the same name inside it is gitignored; ignore
it). Use `Read-Host -AsSecureString` for anything secret.

## What KEYHOLE adds on top of upstream

- **Brand**: `index.html` (title, iOS app title, loader), the wordmark in
  `src/ui/views/SceneChromeView.vue` and `src/ui/views/stories/StoriesHeader.vue`,
  `public/manifest.webmanifest`, `public/logo.svg` (must keep `#globe` and
  `#globe_cage` groups: `src/logoGaze.js` animates them). `src/ui/frameRateView.test.mjs`
  asserts the wordmark reads `KEYHOLE`. `src/brand.js` holds the name constants
  but upstream code does not import it. Many upstream strings (MCP panel, voice
  prompts, error text) still say "God's Eye View"; leave them unless asked, and
  never touch the trademark notice or attribution.
- **Tours**: `src/scenes/keyholeTours.js`, appended in `createSceneRecipes()` in
  upstream's `src/scenes/recipes.js` (two-line hook). Test:
  `src/scenes/keyholeTours.test.mjs`. Titles are plain strings, not `msg()`, so
  they do not enrol in the locale catalogs.
- **Docs and site**: `README.md` (fork-first), `README.upstream.md` (upstream's
  README at sync time), `FORK-NOTES.md`, `ROADMAP.md`, `SETUP.md`, `showcase.json`,
  `showcase/`, `site/`, `functions/`, and our older docs in `docs/` (HANDOFF,
  LAYER-COST, DEMO-QUERIES, SAVED-PLACES-SPEC, SAVED-VIEWS, WEATHER-RADAR-SPEC,
  LOCAL-SESSION-BRIEF). Those older docs describe the pre-sync code; treat
  them as history.

## Landmines

**`gev-` is not branding.** About 390 CSS classes, ids and view names use it.
Leave it alone.

**Attribution is a licence obligation.** Upstream's `DATA_SOURCES.md`,
`THIRD_PARTY_NOTICES.md` and `src/data/dataCredits.js` win. A new data source
must be registered in `DATA_SOURCES.md` and `src/data/dataCredits.js`
(`src/creditAttribution.test.mjs` checks credits). God's Eye View is a
trademark of Metaversity LLC; keep upstream's notice.

**`sceneLayerPlan` drops unregistered layer ids silently**, and only touches
layers a shot names. The registry is `LAYER_STATE_REGISTRY` in
`src/data/layerState.js`; display names are in `src/ui/layerNames.js`.

**Voice tool schemas are frozen by hash.** `src/firstRunExperience.test.mjs`
and `src/voice/actionSchemas.test.mjs` hash `GEV_REALTIME_TOOLS`
(`server/providers/openai/tools.js`). A schema edit busts the Realtime session
cache; prefer an instruction string.

**`.env` only fills gaps; the shell wins.** `server/standalone/vite.config.js`
copies `loadEnv()` values into `process.env` only where the key is undefined,
so a shell or Windows User environment variable silently overrides `.env`.
Check `$env:KEY` and `[Environment]::GetEnvironmentVariable('KEY','User')`
first when a key looks ignored, then restart the dev server and hard-refresh.

**LF line endings are load-bearing.** Upstream's `.gitattributes` pins
`* text=auto eol=lf`; dozens of tests regex-match source text anchored on `\n`.

**Overpass is off by default.** Public Overpass instances are no longer used.
`OVERPASS_UPSTREAMS` (comma-separated URLs you run or pay for) enables Overpass
for voice place search, ALPR, installations and similar. The **traffic layer
does not use Overpass**: roads come from OpenFreeMap vector tiles, live flow
from TomTom (`TOMTOM_API_KEY`).

**CCTV video.** London TfL is stills only upstream ("owner decision" in
`server/providers/cctv/sources.js`). Norway (Vegvesen, HLS) and Quebec (mp4)
serve video.

**Endpoints for unset keys return 503 by design.** It is the proxy declining
to call upstream, not a fault.

## Conventions

- Match surrounding style; JSDoc headers explain why, not just what.
- Keep fork code in separate files where possible; edits inside upstream files
  become merge conflicts on the next sync.
- Server-side proxies are fixed-destination or allowlisted. Keep it that way.
- Before pushing: run the test suite and confirm 0 failures.
- Open PRs as drafts.
