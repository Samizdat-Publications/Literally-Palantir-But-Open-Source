# Conflict view — what these feeds can and cannot show

The **Conflict** destination bucket and the **Conflict watch** saved place turn
the app toward active theatres. This file records what was measured, because
the honest answer is narrower than the idea suggests, and the failure modes are
the misleading kind — they look convincing and mean nothing.

Measured 2026-08-30 against the live feeds.

## What this is

Open-source signals only: crowd-sourced ADS-B, crowd-sourced AIS, NASA thermal
satellite detections, and OpenStreetMap-mapped installations. It is the same
material open-source researchers work from. It is **not** intelligence, not
verified reporting, and not evidence of what happened anywhere.

## The layer set

`l=a.f.m.i` — live vessels, civil flights, military flights, mapped
installations. Deliberately four layers, and deliberately **not** FIRMS.

| Layer | Why it is in, or out |
|---|---|
| `ais-live-vessels` | The strongest signal, where coverage exists. Named vessels with speed and heading |
| `flights` | Civil ADS-B. Over a closed airspace the VOID is the signal |
| `military` | Military ADS-B from adsb.lol. Sparse — about 25–33 aircraft worldwide at any moment |
| `military-installations` | OSM-mapped context. Viewport-scoped to a 10° box, so it needs a regional zoom |
| `local-firms` | **Out. See below.** |

## Three measured limits

### 1. FIRMS is not a war layer

The obvious idea is that NASA's thermal anomalies show strikes and burning.
Flown over Ukraine at continental altitude, FIRMS painted the entire country in
hundreds of detections between 15 MW and 191 MW. Late August is stubble-burning
season across Ukraine, southern Russia and Kazakhstan — those are **agricultural
fires**. The screen reads as a nation ablaze and carries almost no conflict
information.

It is left available, off by default. Turned on knowingly at close range over a
specific location it can be useful. Shipped on by default it is a machine for
producing confident, wrong conclusions.

### 2. AIS coverage has holes exactly where you want it

AISStream is crowd-sourced from volunteer shore receivers, so coverage follows
where hobbyists live, not where news happens. Vessels inside each box, from one
live capture of 34,110 rows:

| Region | Vessels |
|---|---:|
| US East Coast | 2,095 |
| English Channel | 641 |
| **Eastern Mediterranean** | **296** |
| Singapore Strait | 100 |
| **Black Sea** | **62** |
| **Strait of Hormuz / Persian Gulf** | **0** |
| **Red Sea / Bab el-Mandeb** | **0** |

The two chokepoints most associated with current conflict have **no coverage at
all**. Hormuz, Bab el-Mandeb and Suez are kept in the bucket as terrain views
and labelled as such — the geography is worth seeing and coverage may change —
but do not expect vessels there. An empty strait is the data source's silence,
not a quiet strait.

### 3. Altitude decides whether anything draws

The vessel layer stops rendering above roughly **200 km**. The instinct for a
war map is a continental framing, and at 520–900 km the theatre views showed
bare terrain and read as a broken app. Every entry in the bucket sits at
130–190 km for that reason.

The one deliberate exception is **Ukraine — closed airspace** at 620 km, where
the point is the *absence* of civil traffic. That needs a frame wide enough to
hold the ring of European traffic around the void, or the emptiness just looks
like a layer that failed to load.

## What it genuinely shows

- **Eastern Mediterranean and Black Sea shipping** — real, live, named.
- **Ukraine's closed airspace** — a true and visible void in civil ADS-B.
- **Military aircraft**, when any of the ~25–33 tracked worldwide are in frame.
- **Mapped installations**, once zoomed inside a 10° box.

## What it cannot show

Strikes, casualties, ground movement, front lines, or anything a military
chooses not to broadcast. Transponders are off in contested airspace, and
warships do not run AIS in a conflict zone. Absence of contacts is not evidence
of absence — it is the normal condition for exactly the activity people most
want to see.

## Adding theatres

1. Check AIS coverage first with a box count against `/api/ais-live`; a theatre
   with zero vessels can only be a terrain view.
2. Keep the altitude under ~200 km unless the point is an absence.
3. Do not add FIRMS to a preset.
4. Verify by flying there and looking, then record what you saw here.
