# Session handoff

Written 2026-08-28. Read `CLAUDE.md` first — it has the landmines. This file is
state: what is done, what is next, and what will bite.

## Where things stand

Branch `claude/repo-setup-api-keys-b5jc6x`, open **draft** PR #5 against `main`.
PRs #1–#4 are merged. **2,616 tests pass, 0 failures.**

> The suite prints `Failed to load local-dams: SyntaxError` and skips 2
> allocation microbenchmarks. Both are expected. The first is a runtime
> `console.error` from a test deliberately feeding malformed JSON; the second
> only runs on Node 24+.

**PR #5 has not been merged.** That is the one decision waiting on the operator.
It carries everything below.

## Done this session

- **Rebrand to KEYHOLE**, with runtime strings resolving from `src/brand.js` so
  renaming again is a one-file edit. `index.html` is the exception — static
  markup, listed in `BRAND_STATIC_MARKUP_SITES`.
- **Panel dragging**, which shipped complete upstream but dormant: the handler
  looked up a `.panel-drag-handle` that no markup contained. Seven panels now
  have handles; `src/panelDragRegistry.test.mjs` guards both directions.
- **Gemini HUD summaries** with OpenAI as fallback. Voice stays OpenAI Realtime.
- **London CCTV video.** TfL publishes an `.mp4` beside every still; upstream
  left it unused. On by default, opt out with `CCTV_TFL_VIDEO=0`.
- **Thirteen scene tours**, including landmark tours for London, California,
  Ohio and New York. See [`DEMO-QUERIES.md`](DEMO-QUERIES.md).
- **Voice layer shedding** — the fix for "turn off the heavy layers when the
  question doesn't need them". See [`LAYER-COST.md`](LAYER-COST.md).

## Next, in order

1. **Weather radar layer.** Approved, not built.
   [`WEATHER-RADAR-SPEC.md`](WEATHER-RADAR-SPEC.md) — RainViewer, free, keyless,
   every shape verified against the live API. Copy `tomtomProxy` in
   `vite.config.js` as the model.
2. **Saved places.** [`SAVED-PLACES-SPEC.md`](SAVED-PLACES-SPEC.md). The
   serialiser already exists; the work is making restore re-entrant. Seed data
   in [`SAVED-VIEWS.md`](SAVED-VIEWS.md).
3. **Layer profile buttons + a cost budget in `DataLayerManager`.** The voice
   path is done; the UI path is not.
4. Then the rest of `ROADMAP.md` → Open items.

## Bing/ion 401 — open, diagnosed but not resolved

The operator reports the Bing basemap chips failing with
`REQUEST HAS FAILED. STATUS CODE: 401`, "despite having the API key".

**The chip labels are misleading and that is the whole confusion.** There is no
Bing Maps key anywhere in this app. `src/mapStackController.js` defines
`bing-aerial` and `bing-labels` as `Cesium.IonWorldImageryStyle.AERIAL` /
`AERIAL_WITH_LABELS` — **Cesium ion World Imagery**, authenticated with
`CESIUM_ION_TOKEN`. They say "Bing" only because ion's imagery was historically
Bing-sourced.

A 401 therefore means the token reached the browser and **ion refused it** — not
that a Bing key is missing. If no token were configured at all, the app
short-circuits earlier with "Cesium ion token required for Bing stacks", which
is not what the operator saw.

The toast now translates this instead of surfacing Cesium's raw string; see
`_activationErrorMessage` and `src/mapStackIonError.test.mjs`.

**Ranked causes.** Most likely first, and the first one fits the operator's own
words exactly:

1. A **Bing Maps or Google Maps key** was pasted into `CESIUM_ION_TOKEN`. Same
   class of mistake as a Maps Platform key not working against Gemini.
2. The token was **truncated** on the way into `.env` — ion tokens are long JWTs.
3. The token lacks **`assets:read`**, or is restricted to an asset allowlist
   that excludes World Imagery. Note this usually returns **403**, not 401.
4. The token was revoked, or belongs to a deleted ion account.

**Diagnostic — run this on the operator's machine.** Both endpoints were
verified live on 2026-08-28: a bogus token returns `401` from `/v1/me`, and
`{"code":"INVALID_TOKEN","message":"Invalid access token"}` from the asset
endpoint.

```powershell
cd C:\Users\stewa\Literally-Palantir-But-Open-Source\Literally-Palantir-But-Open-Source
$t = (Get-Content .env | Select-String '^CESIUM_ION_TOKEN=').ToString().Split('=',2)[1].Trim()
"token length: $($t.Length)"
$t.Substring(0,6)
curl.exe -s -o NUL -w "me: %{http_code}`n" "https://api.cesium.com/v1/me?access_token=$t"
curl.exe -s -w "`nassets: %{http_code}`n" "https://api.cesium.com/v1/assets/2/endpoint?access_token=$t"
```

Reading the result:

- **`me: 200`, `assets: 200`** — the token is fine and the fault is client-side.
  Look at `import.meta.env.CESIUM_ION_TOKEN` (defined in `vite.config.js`) and
  whether the dev server was restarted after `.env` changed. Vite bakes it at
  build time; editing `.env` with the server running changes nothing.
- **`me: 401`** — the token itself is rejected. Cause 1, 2 or 4. Mint a fresh
  one at cesium.com/ion/tokens.
- **`me: 200`, `assets: 401/403`** — cause 3. Fix the scope, do not rotate.
- **A short token, or one starting `AIza`** — that is a Google key, not an ion
  token. Cause 1, confirmed.

Ion tokens begin `eyJ` (they are JWTs). Do not paste the token into chat; the
length and first six characters are enough to tell.

## Things that will cost you a cycle

**The voice tool schema is byte-frozen.** `src/firstRunExperience.test.mjs`
SHA-256s the `GEV_REALTIME_TOOLS` array literal — 31,104 bytes, digest
`3ace1997…` — because a schema edit busts the Realtime session cache. Before
adding a tool, check whether an **instruction string** can express it with
existing tools. Twice now the answer was yes (NAMED VIEWS, SHEDDING LAYERS FOR
SPEED), and each cost one string with a one-line rollback.

**Tool descriptions inside that block still say "God's Eye View" on purpose.**
They are routing hints for the model, not user-visible identity. Rebranding them
breaks the freeze for no functional gain. This already happened once.

**`gev-` is not branding.** 218+ CSS classes and DOM ids. Leave them alone.

**`sceneLayerPlan` drops unregistered layer ids silently.** A typo in a recipe
is invisible at runtime — the layer just keeps whatever state it had.
`src/demoTours.test.mjs` is the guard.

**Attribution is a licence obligation.** New data sources go in **both**
`DATA_SOURCES.md` and `src/data/dataCredits.js`.

**The analyst engine has no LLM in it.** `src/data/analystEngine.js` is local
query logic. Making it smarter is not a provider swap.

## Environment

- **Operator is on Windows, PowerShell 5.1.** No `&&` chaining. Bake `cd` into
  every command block — they asked for this explicitly. Project root is nested:
  `C:\Users\stewa\Literally-Palantir-But-Open-Source\Literally-Palantir-But-Open-Source`
- `Read-Host` **echoes** input unless given `-AsSecureString`.
- **Node floor is 24.14.** The operator is on 24.13.1 — runs, warns `EBADENGINE`.
- `npm install` prints 9 high-severity audit warnings. Upstream's dependency
  choices, need breaking upgrades. Expected. Do not "fix" them incidentally.

## Keys

All keys currently in `.env` are **temporary test keys**. The operator has said
they will be revoked before going live and wants to be told which to replace:
Google Maps, OpenAI, Gemini, AISStream, FIRMS, TomTom, Cesium ion. Several were
shared in chat during setup and are known-exposed.

`GOOGLE_MAPS_API_KEY` is required and needs **four** APIs enabled — Map Tiles,
Geocoding, Places (New), Street View Static. Each missing one fails with
`REQUEST_DENIED`, which reads like a bad key rather than a missing checkbox.

Unverified: the Gemini model id `gemini-3.1-pro-preview`. Google validates auth
before the model, so a bad key cannot test it. The first real HUD summary will
say. `GEMINI_HUD_SUMMARY_MODEL` overrides without a code change.

## The long-term goal

A UAP/anomaly correlation engine. The single most useful lead so far is OpenSky's
**historical** ADS-B database via `pyopensky` / `traffic` (both Python) — a
concrete route to the time dimension that "what was airborne over this spot at
this time?" needs. The app's live REST feed cannot answer that. See
`ROADMAP.md` → Open items.
