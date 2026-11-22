# Destinations — what renders, and what does not

The **Wonders** and **Nature** buckets in `src/locations.js` were built by flying
to every candidate and looking at the result. This file records the rejections
so nobody re-adds them, and the tuning so nobody flattens it back.

Verified 2026-08-29 on Google Photorealistic 3D Tiles. Screenshots were written
to `qa-shots/recon/` (gitignored). Re-runnable via `qa-shots/dest/verify.mjs`,
which drives the real UI rather than a hand-rolled camera.

## The rule that decided everything

**Google's photorealistic coverage is uneven, and a famous name is no guarantee.**
Where real photogrammetry exists, a landmark is a sharp 3D mesh. Where it does
not, the tileset silently degrades to satellite imagery draped over coarse
terrain — it still *renders*, so nothing errors; it just looks like mush. Only a
screenshot separates the two.

A second rule emerged: **the subject has to be legible from the air.** Some
wonders are the wrong shape for an overhead view no matter how good the data.

## Shipped

### Wonders

| Destination | Notes |
|---|---|
| Colosseum | **GSD 0.10 m** — sharpest in the set. The hypogeum floor is legible inside the arena |
| Chichén Itzá | **GSD 0.11 m.** El Castillo centre-frame with the Temple of the Warriors |
| Great Pyramid of Giza | Full photogrammetry — the pyramid mass and the mastaba field, Cairo behind |
| Taj Mahal | GSD 0.17 m. Complex, minarets and charbagh gardens, the Yamuna beyond |
| Christ the Redeemer | See the tuning note below — this one took three attempts |

### Nature

| Destination | Notes |
|---|---|
| Grand Canyon | South Rim at Mather Point. Terrain rather than photogrammetry, but the relief carries it |
| Niagara Falls | GSD 0.22 m. Horseshoe Falls centre-frame with the whole cataract |
| Matterhorn | The peak against sky, glaciers and the Alps behind. Coarse data, unmistakable silhouette |
| Uluru | Layered flanks and the red plain to the horizon |
| Grand Prismatic Spring | Blue centre, orange bacterial mats, the Firehole River |
| Iguazú Falls | GSD 0.29 m. The full cataract system reads clearly |
| Yosemite Valley | Framed from Tunnel View; granite walls and the Sierra crest |

## Rejected, with the reason

| Candidate | Why it was cut |
|---|---|
| **Petra** | No photogrammetry — smeared imagery over coarse terrain, GSD 0.41 m of visual mush. Worse, Al-Khazneh is a facade carved into a slot canyon and is invisible from any aerial angle. Retried at 320 m range; no better. **Structural, not fixable by framing.** |
| **Great Wall of China** | Resolution is adequate (GSD 0.35 m) but the wall is a metre-scale ribbon over forested ridges and simply does not read. Retried low along the restored Mutianyu section; still just trees. |
| **Machu Picchu** | The Andean valley renders, but the citadel would not frame — the flight consistently settled ~1,700 m above the requested standoff, landing on the Urubamba valley instead. GSD 1.73 m. Worth revisiting if the framing is understood. |
| **Halong Bay** | Coordinates pointed at Bãi Cháy on the mainland; the frame was open water with two small islands. The karst field is further southwest. Repositionable, not yet done. |
| **Victoria Falls** | The cataract is a thin white line and the site was deep on the night side (sun −35°). Marginal rather than broken. |
| **Horseshoe Bend** | The bend fell into a frame corner, and the shot showed a visible mismatched-imagery tile seam. |
| **El Capitan (close)** | The camera sits below the summit, so half the frame is empty sky-under-terrain, with streaking artifacts at the edge. Replaced by the wider **Yosemite Valley** entry. |

## Two things that will bite the next person

**1. `alt` is a RANGE, not an altitude.** In a POI entry `alt` is the distance
from the target that `flyToLandmark` passes as `HeadingPitchRange.range`.
Reading it as height puts the camera in the wrong place at every site.

**2. `groundElevation` is the fallback that always gets used.** With Google 3D
Tiles the Cesium globe is hidden, so `globe.getHeight()` returns null and the
sampled terrain height is never available — the fallback is what the first
fly-to actually uses, every time. The city buckets can share one value; the
global buckets cannot, which is why `groundElevation` is now settable per POI
(`poi.groundElevation ?? bucket.groundElevation ?? 0`). Getting it wrong puts
the camera underground or in the stratosphere.

**3. Lighting is real.** The app lights the globe from the true sun position, so
a destination looks different depending on when it is visited, and several
candidates above were judged on the night side. Anything marginal deserves a
second look at local noon before being cut.

## The Corcovado tuning, as an example

Christ the Redeemer needed three attempts and is the clearest illustration that
coordinates alone are not enough:

| Attempt | Result |
|---|---|
| range 700, pitch −15, heading 90 | Beautiful Rio vista — Sugarloaf, Guanabara Bay — but the statue was not in it. The geocoder read back *"Heliponto Morro Urca"*: right city, wrong subject |
| range 260, pitch −5 | Too tight; the flight overshot to 1,549 m |
| **range 420, pitch −12, heading 110** | The statue on the Corcovado summit with Rio and the Atlantic behind. Readout confirms *"Christ the Redeemer, Estrada do Corcovado"* |

`src/destinations.test.mjs` pins `alt <= 500` for this entry specifically, so a
future widening cannot silently put it back on Sugarloaf.
