# Layer cost reference

What each overlay draws, and what it costs to leave on. Every number below was
read out of the code or measured against the live feed on 2026-08-28 — the
update intervals come from each module's `updateInterval` export, the entity
counts from the bundled datasets themselves.

## The short version

**Three layers account for most of the weight and none of them ever change:**
`local-datacenters` (4,351 points), `telegeography-submarine-cables` (712
polylines + 1,917 landing points), `local-dams` (704 points). About **7,700
static entities**. They are useful at globe scale and tell you nothing at
street level. If the app feels heavy, turn these off first.

**Two more are expensive but earn it because they are live:** `cctv` (image
decode on a 10-second loop) and `satellites` (orbital propagation every frame).

**Everything else is close to free.**

## The table

Impact is scored for a typical session — the cost you actually feel, not the
theoretical worst case.

| Layer | What it puts on the map | Live? | Update | Cost | Impact |
|---|---|---|---|---|---|
| `local-datacenters` | 4,351 datacenter sites worldwide, as points with labels | No | never | 4,351 static entities; label allocator works every one | **Heavy** |
| `telegeography-submarine-cables` | 712 undersea cable routes as polylines, plus 1,917 landing points | No | never | Long polylines are the most expensive primitive here; 2,600+ entities | **Heavy** |
| `cctv` | Traffic/street cameras — London (890, **live video**), Austin, Caltrans — with view cones and projected frames | Yes | 10 s active / 60 s idle | Image **decode** per camera per tick, plus projection texture swaps. GPU + memory, not just CPU | **Heavy** |
| `satellites` | Orbiting satellites — stations, visual, GPS, GLONASS, Galileo, GEO belt; optional dense Starlink shell | Yes | **every frame** (`preRender`) | SGP4 propagation per satellite per frame. Core catalog is fine; `dense` adds the whole Starlink shell and is spread over 300 frames precisely because it would otherwise stall | **Heavy** in `dense`, moderate in `core` |
| `local-dams` | 704 major dams as points | No | never | 704 static entities | **Moderate** |
| `flights` | Civil aircraft with heading, trails, and **3D models** at close range | Yes | 30 s | Model loading and per-frame dead reckoning. Capped at 350 models (`MODEL_MAX_ALL`), 400 trail points | **Moderate** |
| `military` | Military aircraft, same treatment, from adsb.lol | Yes | **15 s** — fastest poll in the app | Same as flights; measured 122 airborne worldwide, so entity count stays low | **Moderate** |
| `traffic` | TomTom flow tiles coloured by congestion | Yes | camera-driven (`updateInterval: 0`) | Refetches tiles on every camera move. Cheap when parked, chatty while flying | **Moderate** |
| `ais-live-vessels` | Ships from AISStream, with course and type | Yes | 60 s | Entity count follows wherever you look; harbours get busy | **Light–moderate** |
| `local-firms` | NASA FIRMS thermal detections, as a heatmap + labels (1,224 in the last live pull) | Yes | on refresh | Heatmap is a single primitive rather than N entities — much cheaper than its point count suggests | **Light** |
| `bikeshare` | Docking stations with live bike/dock counts | Yes | 60 s | Small, city-scoped | **Light** |
| `earthquakes` | USGS `all_day` feed — every quake in 24 h, sized by magnitude | Yes | 60 s | A few hundred small points | **Light** |
| `rocket-launches` | Upcoming and recent launches at their pads | Yes | 5 min | A handful of entities | **Light** |
| `radio` | Radio stations you can tune and listen to | Yes | **45 min** | Markers are cheap; audio is a separate stream and does not touch the render loop | **Light** |
| `military-installations` | Known military bases and installations | No | never | Modest static set | **Light** |
| `military-awareness` | Derived awareness overlay over the military feed | Yes | camera-driven | Rides the military layer; no separate fetch | **Light** |

## Why the saved SF view felt slow

The first entry in [`SAVED-VIEWS.md`](SAVED-VIEWS.md) has **ten layers on** at
100 m altitude over San Francisco — the most expensive mesh in North America.
Among them: datacenters, submarine cables, and dams, all three heavy, all three
static, and none of them visible or meaningful at 100 m. CCTV was on as well,
decoding frames.

Turning off flights was the right instinct but not the biggest win. Dropping
the three reference layers removes roughly 7,700 entities and costs nothing at
that altitude, because there was nothing to see.

## What is now automatic

A single instruction string in `vite.config.js` (search `SHEDDING LAYERS FOR
SPEED`) teaches the voice agent to do this. It fires in exactly three cases:

1. **You say it's slow** — "this is laggy", "it's stuttering" — and the agent
   drops the three static reference layers, then tells you what it dropped.
2. **You ask to focus** — "just the fires", "focus on shipping", "only
   aircraft", "clear the clutter" — and it switches that domain on and
   everything outside it off, in one batch.
3. **Never otherwise.** Asking an ordinary question does not turn anything off.
   The rule says so explicitly, and `src/layerShedding.test.mjs` fails if that
   sentence is removed.

The domain groups:

| Say | On |
|---|---|
| fires / wildfires | `local-firms`, `earthquakes` |
| shipping / maritime | `ais-live-vessels` |
| aircraft / air | `flights`, `military` |
| space | `satellites`, `rocket-launches` |
| streets / urban | `cctv`, `traffic`, `bikeshare` |
| infrastructure | `local-datacenters`, `local-dams`, `telegeography-submarine-cables` |

### Why it is an instruction and not a new tool

`GEV_REALTIME_TOOLS` is frozen by SHA-256 in `src/firstRunExperience.test.mjs`,
because editing the schema busts the Realtime session cache. Shedding is
entirely expressible with `set_layer_visibility`, which already exists — so the
whole feature is one string, and deleting that string is the complete rollback.
This is the same bargain the NAMED VIEWS instruction already made a few lines
above it; the comment there says so in as many words.

## Still worth building

The voice path covers the demo. Two gaps remain, both UI:

1. **Profile buttons in the data panel** — the same six domain groups as
   one-click presets, for when you are not talking to it. The scene recipes
   already prove the mechanism: every tour declares all fourteen layers on or
   off, and `sceneLayerPlan` applies them atomically.
2. **A cost budget in `DataLayerManager`** — warn, or shed automatically, when
   the enabled set crosses a weight threshold. This is the version that stops
   the problem happening rather than fixing it after the fact.
