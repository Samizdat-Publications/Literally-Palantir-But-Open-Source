# Roadmap — future direction

Wants recorded for after the base platform is fully stood up. Nothing here is
scheduled or started; this file exists so the intent survives between sessions.

The through-line: this platform is meant to become the **single home for
research that currently lives in static HTML dashboards**. Each project below is
a set of layers over the same globe rather than a separate site.

---

## 1. Anomaly correlation engine (primary)

The first and largest fork. A UAP/anomaly tracker that plots sighting records
from every publicly available database and correlates them against physical
infrastructure and terrain.

**Reporting layers**
- UFO/UAP sightings, aggregated across public databases
- Cryptid and Bigfoot sighting reports
- Reported haunted locations
- Missing-persons and disappearance clusters

**Correlation layers** — the things sightings get measured *against*
- Restricted airspace and special-use airspace boundaries
- Military installations (the existing OSM installations layer is a starting point)
- Nuclear sites — power, storage, weapons, decommissioned
- Volcanos and notable geology
- Existing base layers already present: submarine cables, datacenters, dams

**The actual point.** This is not a pin map. It is a correlation engine whose
job is separating signal from noise — surfacing clusters that are
*mathematically* interesting rather than merely dense. A cluster over a city is
population bias; a cluster over empty terrain adjacent to restricted airspace is
a finding. Proximity scoring, spatial statistics, and null-model comparison
against a random baseline are the core of the feature, and the map is the
readout.

Source data for this one is reported to be nearly ready.

## 2. Legacy program dashboard

A dedicated view for legacy-program research. Scope to be defined.

## 3. Vanishing scientists

Timeline and geography of researcher disappearances. Scope to be defined.

## 4. Consolidation

Migrate the existing static HTML dashboards onto this platform so that all
research shares one globe, one entity model, and one set of controls. Retire the
static builds once parity is reached.

---

## Why this codebase fits

Extending it is mostly writing data adapters. The hard parts already exist:
the photorealistic globe, entity selection and tracking, the annotation system,
the voice grounding, and the screen-space label allocator.

| Extension point | Where |
|---|---|
| One self-contained module per layer | `src/data/<layer>.js` |
| Bundled datasets, with per-folder provenance README | `src/data/local_data/<name>/` |
| Voice actions (`set_layer_visibility`, `annotate_map`, …) | `src/voice/gevActions.js` |
| Server-side proxies for keyed or CORS-blocked sources | `vite.config.js` |

**Attribution is mandatory, not optional.** Every third-party dataset carries
its own license independent of the MIT code license — several are ODbL or
CC BY-NC-SA with share-alike terms. A new source must be added to **both**
`DATA_SOURCES.md` and `src/data/dataCredits.js`. See `FORK-NOTES.md` for how the
licence split already applies to the bundled data.

## The one real gap

**This app is live-only.** There is no historical mode and no scrubbing back in
time — deliberately so upstream, where that capability is the commercial
product.

Every project above is inherently historical: sightings have dates, and clusters
are interesting partly because of *when* they happened. A time dimension —
storage, a scrub control, and time-filtered layer queries — is the one piece
that has to be built rather than adapted, and it should be designed before the
first sighting layer is written rather than retrofitted after.

The Space Missions layer is the closest existing precedent: it replays a launch
along a reconstructed timeline at 0.25×–4×, labelled as an estimate. That is a
useful model for both the playback controls and the honesty about data quality.
