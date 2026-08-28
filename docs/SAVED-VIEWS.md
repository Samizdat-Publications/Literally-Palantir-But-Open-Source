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

Saved 2026-08-28. The first one.

**Hash:**

```
#v=2&lat=37.7738&lon=-122.4232&alt=100&heading=180&pitch=-22&roll=360&style=crt&bloom=0&sharpen=1&bi=0&bv=2&si=49&hud=tactical&hv=1&dm=DENSE&dd=75&da=elastic&kf=7&ko=1&cr=0&sc=1&scf=11&map=photoreal&l=a.c.e.q.d.w.i.r.u.t&lo=f.e.1&ui=c.c.1_c.p.0_l.c.1_l.p.0_d.c.0_v.c.0_r.c.1_s.c.1_g.c.0_p.c.0_m.c.0&sp=p.100_d.0_i.42
```

**What it restores** (decoded against `src/sharelink.js` and
`src/data/layerState.js`, not guessed):

| | |
|---|---|
| **Position** | 37.7738 N, 122.4232 W — San Francisco, the Market Street corridor near Guerrero/Duboce |
| **Camera** | 100 m altitude, heading 180° (due south), pitch −22°, roll 360° (≡ 0) |
| **Basemap** | `photoreal` — Google Photorealistic 3D Tiles |
| **Style** | `crt` (retro) — bloom **off**, sharpen on at 49; CRT params pixelation 100, distortion 0, instability 42 |
| **HUD** | `tactical`, visible |
| **Detection** | `DENSE`, density 75, elastic allocation, fade 7, outside-opacity 1 |
| **Scope mask** | on, feather 11 |
| **Layers on (10)** | AIS vessels, CCTV, earthquakes, dams, datacenters, FIRMS fires, military installations, radio, submarine cables, traffic |
| **Layers off** | flights, military aircraft, satellites, rocket launches, bikeshare, military awareness |
| **Panels** | control + location + radio + scene expanded; data, CCTV, global context, post-process toggles, param sliders collapsed; nothing pinned |

**Note on the ten layers.** That is nearly everything the app has, all live at
once, over the most expensive mesh in North America. It is almost certainly the
main reason the app felt heavy. Killing flights was the right first move — the
next cheapest wins are submarine cables and dams, which are static reference
geometry and are not telling you anything at 100 m altitude. The hash above is
preserved exactly as captured; tune in the browser and save a second entry
rather than editing this one.
