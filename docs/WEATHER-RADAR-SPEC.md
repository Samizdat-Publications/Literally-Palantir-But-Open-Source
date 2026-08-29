# Weather radar layer — build spec

> ## ⚠️ Correction 2026-08-29 — read before building
>
> Two claims below were tested against the running app and did not survive.
>
> **1. The rendering approach in §2 does not work on the default basemap.**
> "Render as a Cesium `ImageryLayer` over the globe" draws **nothing** in
> photoreal mode: Google's 3D tileset replaces the globe
> (`_activatePhotoreal()` sets `scene.globe.show = false`), and an
> `ImageryLayer` has no surface to draw on. Measured: **0** radar tile requests
> on `photoreal`, **61 × HTTP 200** on the `osm` globe stack. Making radar
> visible in photoreal mode needs **geometry, not imagery**. This is probably
> why upstream pulled its radar overlay for "unreliable visible value"
> (`docs/KNOWN-ISSUES.md`). §1 (the proxy) is unaffected.
>
> **2. RainViewer never returns 404.** A bogus frame path returns **HTTP 200**
> with a valid 1085-byte PNG, and out-of-range `z/x/y` also returns **200**. So
> the "expired/404" error model does not exist, and a stale path renders a
> plausible-but-wrong image instead of failing. Our proxy must therefore reject
> bad coordinates itself, and the UI should surface the frame timestamp.
> Relatedly, paths expire far more slowly than warned: a path captured
> 2026-08-28 still resolved a day later.
>
> Evidence: [`VERIFIED-STATE.md`](VERIFIED-STATE.md).

Requested and approved. Not built. Everything below was verified live against
the real API on 2026-08-28, so the shapes and URLs are observed, not guessed.

## Source: RainViewer

Free, **no API key**, global composite radar with a rolling animation window.
No account, so nothing to add to `.env`.

### Index endpoint

```
GET https://api.rainviewer.com/public/weather-maps.json
```

Verified: `HTTP 200`, ~818 bytes. Shape:

```jsonc
{
  "version": "2.0",
  "generated": 1787959223,          // unix seconds
  "host": "https://tilecache.rainviewer.com",
  "radar": {
    "past":     [ { "time": 1787958600, "path": "/v2/radar/fd6049ae854e" }, ... ],
    "nowcast":  [ ... ]             // forecast frames; was empty at capture
  },
  "satellite": { "infrared": [ ... ] }
}
```

At capture: **13 past frames**, one every ~10 minutes — roughly two hours of
loop. `nowcast` was empty, so treat it as optional and never assume it exists.

### Tile URL

```
{host}{path}/{size}/{z}/{x}/{y}/{color}/{options}.png
```

Verified working:

```
https://tilecache.rainviewer.com/v2/radar/fd6049ae854e/256/4/5/6/2/1_1.png
→ HTTP 200, image/png, 1421 bytes
```

| Segment | Value | Meaning |
|---|---|---|
| `size` | `256` or `512` | Tile pixel size |
| `z/x/y` | standard | Web-Mercator slippy tile coords — same scheme as the TomTom proxy already uses |
| `color` | `0`–`8` | Palette. `2` is the familiar green→red scheme |
| `options` | `1_1` | `smooth_snow`; `1_1` = smoothed, snow shown |

⚠️ **`path` values expire.** They are content-hashed per frame. Re-fetch the
index rather than caching a tile URL beyond the index TTL.

## What to build

### 1. Proxy — `vite.config.js`

Follow **`tomtomProxy`** as the model. It is the closest existing thing: same
slippy-tile shape, same caching problem, and it already solves coordinate
validation (`isValidTileCoord`) and a disk cache.

- `GET /api/weather/frames` → the index, cached ~5 min (frames update ~10 min).
- `GET /api/weather/tile/:frame/:z/:x/:y` → proxy the PNG.
- **Validate `z/x/y` with the existing `isValidTileCoord`** before building any
  upstream URL. Reuse it; do not write a second one.
- Pin the upstream host to `tilecache.rainviewer.com` — the proxies in this
  file are fixed-destination or allowlisted and that must not regress.
- Return **503** when upstream is unreachable, matching `/api/firms` and
  friends. That is the house convention for "declined to call upstream".

### 2. Layer module — `src/data/weatherRadar.js`

One module per layer, same interface as the others (see `src/data/traffic.js`,
which is also tile-based).

- Register in `src/main.js` beside `trafficLayer`.
- Layer id: **`weather-radar`** (kebab-case; `scenePolicy.test.mjs` enforces
  that convention).
- Add it to `REGISTERED_LAYER_IDS` in **`src/demoTours.test.mjs`** and to
  `REGISTERED` in **`src/scenes/scenePolicy.test.mjs`**, or every existing tour
  fails the "declares every layer" assertion.
- Render as a Cesium `ImageryLayer` over the globe, alpha ~0.6 so terrain reads
  through.
- Animation: step the frame index on a timer across `radar.past`. Ship it
  paused-on-latest by default; a 13-frame loop pulling tiles is not free.

### 3. Attribution — **mandatory, both places**

This is a licence obligation, not politeness:

- `DATA_SOURCES.md` — new row.
- `src/data/dataCredits.js` — Cesium credit entry.

`creditAttribution.test.mjs` already guards this pairing. Check RainViewer's
current terms for the exact required wording before writing the string.

### 4. UI

Add the toggle to the Data Layers panel like any other layer. No new panel.

## Tests to write

- Tile-coord validation rejects out-of-range `z/x/y` (mirror the TomTom tests).
- Frame-index parsing tolerates an **empty `nowcast`** — it was empty at capture
  and code that assumes it exists will throw.
- An expired/404 frame path degrades to no imagery rather than throwing.
- The layer id appears in both test registries (above).
- Attribution present in `DATA_SOURCES.md` **and** `dataCredits.js`.

## Why it is worth doing

It composes with what is already there. Radar over the FIRMS fire layer shows
weather driving fire behaviour — the `fireline-cascadia` tour is the obvious
place to demonstrate it. It is also the first layer with a real **time
dimension**, which is the gap `ROADMAP.md` flags for the correlation engine, so
the frame-stepping control built here is a rehearsal for that problem.

## Gotchas

1. **Frame paths expire** — always resolve through the index.
2. **`nowcast` can be empty** — never index into it blindly.
3. **Do not cache tiles past the index TTL** — you will show stale weather with
   no indication it is stale.
4. **256 vs 512** — 512 is sharper and four times the bytes. Start at 256.
5. Coverage is **not global-uniform**. Radar is dense over the US and Europe,
   sparse elsewhere. Empty tiles over the ocean are correct, not a bug.
