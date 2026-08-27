# Roadmap — future direction

Wants recorded for after the base platform is fully stood up. Nothing here is
scheduled or started; this file exists so the intent survives between sessions.

**Decisions already taken** are recorded in "Decisions" at the foot of this
file — the fork's name, the AI provider split, and two corrections to earlier
assumptions. Read that section before planning work.

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


---

# Decisions

Settled calls, with the reasoning, so they are not relitigated later.

## The fork is named KEYHOLE

Chosen for precision at both ends. **KEYHOLE** was the real designation of the
US photographic-reconnaissance satellite program (the KH series, beginning with
CORONA) — the thing this app's aesthetic is quoting. It was also the name of
**Keyhole Inc.**, the In-Q-Tel-backed company Google acquired, whose product
became Google Earth: the direct technical ancestor of the photorealistic 3D
tiles rendered here. The name is accurate about the genre *and* about the
lineage of the rendering stack.

The upstream project is "God's Eye View" by Bilawal Sidhu. Renaming the fork is
correct etiquette — it stops this build being mistaken for theirs — but the
**credit stays**: `LICENSE` travels with the code, `FORK-NOTES.md` records
provenance, and every data attribution in `DATA_SOURCES.md` and
`src/data/dataCredits.js` is untouched by branding work.

**Requirement: the name must stay cheap to change.** Brand strings are to be
centralised rather than scattered, so a future rename is a small edit and not
another sweep. The internal `gev-` CSS class and DOM-id prefix is **not**
branding — it is 218+ internal identifiers and must be left alone.

## AI provider split

Three providers, each doing the thing it is actually good at:

| Concern | Provider | Why |
|---|---|---|
| Voice in / voice out, and intent → tool call | **OpenAI Realtime** | Speech-to-speech in one model. Anthropic has no realtime audio API; a STT → LLM → TTS pipeline would add 1–2s of latency to a drone-operator interface. |
| Counting, filtering, spatial queries | **No model — local JS** | See the correction below. Deterministic and cannot hallucinate. |
| HUD summary, and future deep analysis | **Gemini** | Free-tier credits available, and fast models are well suited to a short text call. |

The interactive path should stay on fast models whatever the vendor; latency is
a feature when the globe is meant to answer instantly. Reserve a frontier model
for the correlation-engine reasoning, which is genuine multi-step analysis over
messy evidence rather than routing.

Build the analysis path **provider-agnostic** so the model is a config value and
comparisons are cheap.

## Correction: the analyst engine does not use an LLM

`src/data/analystEngine.js` is pure local query logic over the record arrays
already held client-side. Its own header states it: *"the engine never
fetches."*

So "how many flights are over Texas?" resolves as: OpenAI Realtime parses the
intent into a tool call → **local JavaScript does the filtering** → Realtime
narrates the result. There is no LLM in the analysis step to redirect.

This matters for planning: making the analyst *smarter* is not a provider swap,
because there is no call to swap. It means either extending the engine, or
**adding** a reasoning layer that consumes the engine's structured output. The
HUD summary (`/api/openai/hud-summary`) is the only isolated text call that a
provider swap actually applies to, which makes it the natural first target.

## Correction: panel dragging already exists

`src/ui.js` already implements drag-to-reposition — z-order promotion on click,
viewport clamping, per-panel position persisted to `localStorage`, and
re-clamping on resize. It is wired to exactly **one** panel (`pp-toggles`),
with a comment recording the upstream intent: *"The right rail and left
accordion remain fixed so their HUD alignment is deterministic."*

Making the other ~13 panels draggable is therefore an extension of a tested
system, not new machinery: add handles, register them in `dragSpecs`, and switch
rail-anchored panels to free positioning on first drag. A "reset layout" control
should land in the same change, because free-floating panels do get lost.
