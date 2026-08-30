# Saved views

A hand-kept bookmark list, standing in for the saved-places feature until it
exists (spec: [`SAVED-PLACES-SPEC.md`](SAVED-PLACES-SPEC.md)). When that ships,
this file is its **seed data** — every entry here gets imported as a starting
bookmark, so keep the format stable.

## How to use one now

The app already serialises the whole view into the URL hash. To restore a view,
paste the **hash** onto whatever host the dev server is on:

```powershell
cd C:\Users\stewa\Literally-Palantir-But-Open-Source\Literally-Palantir-But-Open-Source
```

Then open `http://localhost:4173/` + the `#...` string from the entry below.
The hash is host-agnostic on purpose — it carries no `localhost`, so the same
string works if the app is ever served from anywhere else.

## How to add one

1. Get the view exactly how you want it in the browser.
2. Copy the whole address bar.
3. Add an entry below: a name, the hash from `#` onward, and a line saying what
   it is. The **name is the only thing the URL does not carry** — everything
   else below is decoded from the hash itself.

---

## 1. SF Market Street — low approach

Saved 2026-08-28. The first one. **Narrowed 2026-08-29** — see the note at the foot.

**Hash:**

```
#v=2&lat=37.7738&lon=-122.4232&alt=100&heading=180&pitch=-22&roll=360&style=normal&bloom=0&sharpen=1&bi=0&bv=2&si=49&hud=tactical&hv=1&dm=DENSE&dd=75&da=elastic&kf=7&ko=1&cr=0&sc=1&scf=11&map=photoreal&l=b.c.i.r.t&lo=f.e.1&ui=c.c.1_c.p.0_l.c.1_l.p.0_d.c.0_v.c.0_r.c.1_s.c.1_g.c.0_p.c.0_m.c.0
```

**What it restores** (decoded against `src/sharelink.js` and
`src/data/layerState.js`, not guessed):

| | |
|---|---|
| **Position** | 37.7738 N, 122.4232 W — San Francisco, the Market Street corridor near Guerrero/Duboce |
| **Camera** | 100 m altitude, heading 180° (due south), pitch −22°, roll 360° (≡ 0) |
| **Basemap** | `photoreal` — Google Photorealistic 3D Tiles |
| **Style** | `normal` — bloom **off**, sharpen on at 49 |
| **HUD** | `tactical`, visible |
| **Detection** | `DENSE`, density 75, elastic allocation, fade 7, outside-opacity 1 |
| **Scope mask** | on, feather 11 |
| **Layers on (5)** | street traffic, CCTV, radio, bikeshare, mapped installations |
| **Layers off** | everything else — AIS vessels, earthquakes, dams, datacenters, FIRMS fires, flights, military aircraft, satellites, rocket launches, submarine cables, military awareness |
| **Panels** | control + location + radio + scene expanded; data, CCTV, global context, post-process toggles, param sliders collapsed; nothing pinned |

**Narrowed to a five-layer working set, 2026-08-29.** As originally captured
this view turned **ten** layers on at once over the most expensive mesh in
North America — almost certainly the main reason the app felt heavy. Three of
them (datacenters 4,362, submarine cables 2,629, dams 716) are ~7,700 entities
of static reference geometry that never update and show **nothing** at 100 m
altitude.

It now carries exactly: **street traffic, CCTV, radio, bikeshare, mapped
installations**, with everything else explicitly off. `style` also relaxed from
`crt` to `normal`: a recall is a state swap the user asked for, but flipping the
whole look to retro green is not what "take me back to this place" should mean.

**On mapped installations.** Measured at this exact view, it returns **0**. It
is viewport-scoped (10° maximum box) and there is nothing tagged military inside
a 100 m frame on Market Street. It yields **1** at city zoom (~6 km) and **12**
across the Bay Area (~40 km). It is kept on because it costs nothing here and
populates when you pull back — but do not expect to see it at this altitude.

**This file is the seed source.** `src/data/savedPlacesSeed.js` imports from it,
and `savedPlaces.test.mjs` asserts the hash decodes to exactly the five layers
named above. Edit here, mirror there, and bump `SAVED_PLACES_SEED_VERSION` so
existing browsers pick the change up — otherwise anyone who already loaded the
app keeps the old copy forever.
