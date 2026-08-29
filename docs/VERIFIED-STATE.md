# Verified state — what was actually observed

**Verified 2026-08-29 on the operator's Windows machine, by the first local
session.**

Every prior session ran in a cloud container and could not boot the app, drive a
browser, read `.env`, or run the test suite on Windows. This file records what
was **seen and measured**, not what was assumed. Where it disagrees with another
doc, this file is the observation and the other doc is the expectation.

Method: Vite dev server + Puppeteer (Chrome for Testing `win64-145.0.7632.77`)
driving `window.__godsEyeView`. Raw output and screenshots in `qa-shots/verify/`
(gitignored). Counts are the app's own `dataManager.getAll()[].stats` — the same
numbers the Data Layers panel shows — not inferred from `viewer.entities`, which
is empty for most layers because they render into their own collections.

---

## Environment

| | |
|---|---|
| Node | **v24.13.1** — below the `engines` floor of 24.14.0. Runs; warns `EBADENGINE` |
| npm | 11.8.0 |
| Git | clean on `main`, local == `origin/HEAD` (`8ad93ed`); all 6 PRs merged |
| Line endings | `.gitattributes` present; `git ls-files --eol` reports `w/lf` — **checkout is correct** |
| `npm test` | **2,624 pass, 0 fail** (~95 s), plus 1 + 13 in the Node-24 benchmark suites |
| GitHub | `gh` authed as `Samizdat-Publications`; scopes `gist, read:org, repo, workflow` |
| `.env` | 21 keys present; only `OPENSKY_CLIENT_SECRET` empty (ROADMAP lists OpenSky as "Skip") |

**The 25-failure CRLF scenario does not apply.** PR #6 landed and the working
tree is LF. `docs/LOCAL-SESSION-BRIEF.md` still describes PR #6 as an open draft;
that is stale.

## The app boots, and the globe renders

First visual confirmation in the project's history.

- Splash → globe, with **0 console errors and 0 page errors**.
- `tilesLoaded: true`, `tilesetReady: true`.
- **793 × HTTP 200 to `tile.googleapis.com`** — Google photorealistic 3D tiles
  are live. Map Tiles API confirmed working.
- `assets.ion.cesium.com` → 200. **The ion 401 is genuinely closed.**
- Cesium ion + Google Maps attribution renders bottom-left, as the licences require.
- The rebrand is visible and correct: `<title>KEYHOLE`, wordmark, "NO PLACE LEFT BEHIND".

Google APIs observed answering 200: **Map Tiles** and **Geocoding** — the HUD
reverse-lookup named "BIG BEN / PARLIAMENT" over London unprompted.

## Layers: 16 registered, all 16 behave correctly

Measured at a continental view (−98°, 39°, 4,000 km) unless noted.

| Layer | Count | Verdict |
|---|---:|---|
| `flights` | 224 | live, adsb.lol |
| `military` | 31 | live, adsb.lol |
| `earthquakes` | 54 | live, USGS |
| `satellites` | 834 | live, CelesTrak |
| `rocket-launches` | 26 | live, Launch Library 2 |
| `cctv` | 800 | live |
| `radio` | 750 | live, Radio Browser |
| `ais-live-vessels` | 12,000 | live, AISStream |
| `local-datacenters` | 4,362 | bundled |
| `local-dams` | 716 | bundled, USACE |
| `telegeography-submarine-cables` | 2,629 | bundled — matches the documented 712 polylines + 1,917 landing points exactly |
| `local-firms` | **251,793** | live NASA FIRMS |
| `traffic` | 0 → **2,213** | viewport-scoped; verified at London, 2.5 km |
| `bikeshare` | 0 → **2,508** | **US-only** registry (BCycle/Lyft, 32 cities); verified at New York |
| `military-installations` | 0 → **6** | zoom-scoped and says so ("Zoom in to load mapped installation context"); verified at San Diego, 25 km |
| `military-awareness` | 0 | **correct** — see below |

**No layer is broken.** The four zeros at continental view are all scoping, and
three were confirmed by re-testing where the data actually lives. Testing
bikeshare at London was an error of method, not a defect: the registry is US-only.

`military-awareness` is not a population layer at all. It declares
`DEPENDENCIES = ['flights','military','ais-live-vessels','military-installations']`
and its `getStats()` returns `count: state.results ? 1 : 0` — a 0/1 flag, not a
population. Results exist only once a contact is **selected**. Measured with all
four dependencies loaded (flights 6,468, military 27, vessels 12,000,
installations 25) and no subject selected, it correctly reported 0. It is the
closest existing thing to the correlation engine `ROADMAP.md` describes.

## The existing QA harness runs on Windows

48 `scripts/qa-*.mjs` Puppeteer scripts ship in the repo and had never been run
on this machine. **50 browser-level checks passed, 0 failed:**

| Script | Result |
|---|---|
| `qa-map-source-tray` | **18 / 18 pass** — including "key-required sources switch normally when the ion token is configured", an independent confirmation of the ion fix |
| `qa-attribution-b12` | **24 / 24 pass** — the licence obligation is verified, not merely asserted |
| `qa-firms` | **8 / 8 pass** |

Two frictions worth knowing before running the rest:

1. **Six scripts pass `--use-angle=metal`, a macOS flag.** Harmless on Windows —
   Chrome ignores an unsupported ANGLE backend. No change needed.
2. **Most scripts hard-code a port and offer no env override**
   (`qa-attribution-b12` → 4300, `qa-traffic` → 4410, `qa-firms` → 4420, many →
   4173). Only `qa-map-source-tray` and `qa-cctv-v2` honour `QA_BASE_URL`. To run
   one, start a dev server on the port that script expects.

### Reproducing this

```
npm run qa:layer-sweep
```

`scripts/qa-layer-sweep.mjs` was added by this session and is the repeatable
form of the table above: it walks the whole registry, re-probes the scoped
layers at a location where their data exists, and exits non-zero if any layer
returns nothing. Verified end to end: **16/16**.

**One trap worth knowing.** Editing `vite.config.js` makes Vite restart itself,
and the restart can leave a stale pre-bundle so the browser gets
`504 (Outdated Optimize Dep)` on `/node_modules/.vite/deps/cesium.js`. The app
then never initializes and `window.__godsEyeView` never appears — which looks
like the app is broken rather than the cache. Restart with `--force`:

```
npm run dev -- --host localhost --port 4173 --force
```

---

## Two defects found

### 1. FIXED — the HUD summary silently returned nothing

`GEMINI_HUD_SUMMARY_MODEL_DEFAULT` was `gemini-3.1-pro-preview`, a **thinking**
model, while the request hard-caps `maxOutputTokens` at 100. The reasoning pass
consumed the entire budget before any text was emitted.

Measured against the real `hudSummaryInstruction()` with a realistic payload
(place + street + nearby + layers):

| Model | maxOutputTokens | thinking tokens | finishReason | Result |
|---|---:|---:|---|---|
| `gemini-3.1-pro-preview` | 100 | 97 | `MAX_TOKENS` | **`summary: null`, 3 of 3 attempts** |
| `gemini-3.1-pro-preview` | 400 | 384 | `STOP` | works |
| `gemini-3.1-pro-preview` | 1000 | 958 | `STOP` | works — thinking expands to fill the cap |
| `gemini-3.1-flash-lite` | 100 | 0 | `STOP` | **correct, ~1.5 s** |

The endpoint returned **HTTP 200 with `{summary: null, error: null}`** — a silent
failure. The HUD showed nothing and nothing logged.

Only a thin payload made it look healthy: fewer input tokens meant fewer thinking
tokens, so a short context squeaked an answer out while a realistic one never did.
That is why this survived until someone could call the real endpoint.

**Fixed** by changing the default to `gemini-3.1-flash-lite` in `vite.config.js`.
Verified on a fresh server with no override: correct five-word summary 3 of 3, at
~1.5 s versus 2.5–6.8 s. This also honours `ROADMAP.md` → Decisions, "the
interactive path should stay on fast models".

`gemini-2.5-flash-lite` returns empty and should not be used.

### 2. OPEN — the tour layer-declaration guard has a hole

`src/main.js` registers **16** layers. `REGISTERED` in
`src/scenes/scenePolicy.test.mjs` has all 16, but **`REGISTERED_LAYER_IDS` in
`src/demoTours.test.mjs` has only 14** — missing `military-awareness` and
`telegeography-submarine-cables`. **No tour declares either.**

That guard exists precisely to stop a tour inheriting a heavy layer from whatever
ran before it — its own comment says "These run back to back on one machine." The
hole sits exactly where it costs most: `telegeography-submarine-cables` is
**2,629 entities**, one of the three static layers `CLAUDE.md` names as the usual
cause of a heavy session. Turn cables on by hand, start any tour, and it stays on
for the whole tour with nothing to catch it.

Not fixed here because closing it means adding a declaration to all 13 tours in
`TOUR_IDS` — the same mechanical edit the weather-radar layer already requires.
Doing both in one pass is much cheaper than doing it twice.

`CLAUDE.md` and `docs/LOCAL-SESSION-BRIEF.md` both document 14 registered ids.
The true list is 16.

---

## Roadmap items this settles

- **Open item #5 — "Verify the Gemini model id."** `gemini-3.1-pro-preview` **is**
  a real id: it appears in the live model list, and the key returns 200 with 53
  models. But the id was never the problem — the token budget was. **Closed**,
  with the underlying bug fixed above.
- **Open item #6 — Node 24.14+.** Confirmed still on 24.13.1.

## Not yet verified

Voice (OpenAI Realtime), the 18 scene tours, CCTV video (London TfL `.mp4`),
Street View Static fallback, Places (New), panel dragging, and the remaining 45
QA scripts. None of these were observed either working or broken — absence of
evidence, recorded as such.
