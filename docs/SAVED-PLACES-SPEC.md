# Saved places — build spec

Requested and approved. Not built. Everything below was read out of the code on
2026-08-28, so the function names, guards and registries are real.

## The finding that shapes the whole feature

The app already serialises the complete view — camera, style, post-process,
HUD, detection, basemap, all fourteen layers with their options, and panel
open/closed state — into the URL hash. `ShareLinkManager._buildHashParams()`
(`src/sharelink.js:474`) builds that snapshot, and its own docstring says it is
**"a deterministic snapshot without mutating history."**

So saved places is not a serialisation problem. The serialiser exists, is
versioned (`v=2`), is covered by tests, and is already the thing the user has
been copy-pasting by hand. The feature is: **call that function, keep the
string, and be able to replay it mid-session.** Do not write a second encoder.

## What already works vs. what is missing

| Piece | State |
|---|---|
| Encode current view → string | **Done.** `_buildHashParams()` returns a `URLSearchParams`. Private, needs promoting. |
| Decode string → view | **Done.** `parseInitialHash()` (`:154`) plus the per-domain decoders. |
| Apply a decoded view to the running app | **Boot only.** See the guard below — this is the actual work. |
| Persist a list | Missing. |
| UI to save / list / recall / delete | Missing. |
| Seed bookmarks | [`SAVED-VIEWS.md`](SAVED-VIEWS.md) — import these as the starting set. |

## The one real obstacle: restore is boot-scoped

`_updateHash()` and `_scheduleUpdate()` both bail on `this._initialRestorePending`,
and `completeInitialRestore()` (`:344`) flips that flag once, at startup. There
is also `claimRestoreLane(lane, panelId)` (`:351`), which exists so that a user
who touches a panel during the restore flight wins over the incoming link.

That machinery assumes restore happens **once, before the user has done
anything**. Recalling a saved place violates that assumption: the user has been
interacting for ten minutes and now wants a full state swap.

**Do not** just set `location.hash` and hope. The manager writes the hash with
`history.replaceState` on a 500 ms debounce (`DEBOUNCE_MS`), so a naive
round-trip races the debounce and can be overwritten by the live camera before
it applies.

**Approach:** add a public `restoreViewState(paramsOrString, { source })` that
reuses the existing decode + apply path, and around it:

1. Cancel the pending debounce (`clearTimeout(this._debounceTimer)`).
2. Re-arm the restore guard for the duration of the flight, then call
   `completeInitialRestore()` again at the end — it must become idempotent and
   re-entrant, which today it is not.
3. Reset the restore lanes, since lane claims from the previous ten minutes
   must not veto a recall the user explicitly asked for. A recall is an
   *explicit* action and should outrank every lane claim.

Write the test for step 3 first. It is the one that will actually break.

## Storage

`localStorage`, single key, one JSON document. No server, no account.

```jsonc
{
  "v": 1,                          // bump to migrate; refuse to read unknown
  "places": [
    {
      "id": "sf-market-low",       // slug, stable, used for dedupe
      "name": "SF Market Street — low approach",
      "hash": "v=2&lat=37.7738&...",   // no leading '#'
      "savedAt": 1787959223000,
      "note": "",                  // optional, one line
      "scope": "full"              // "full" | "camera" — see below
    }
  ]
}
```

Follow the existing key naming in `src/ui.js` (panel positions already persist
to `localStorage`; match that prefix rather than inventing one).

Guard rails, all of which the share decoder already models and should be
copied rather than reinvented:

- **Refuse an unknown `v`.** Never salvage a partial read. `decodeLayerStateParams`
  fails closed on an unknown token for exactly this reason (`layerState.js:456`)
  — a typo must not become an authoritative empty set.
- **Cap the list** (50 is plenty) and cap `name` length. `localStorage` is a
  shared 5 MB budget with the panel-position store.
- **Wrap every read and write in try/catch.** Private windows and blocked site
  data throw on access, not just on write.

## Scope: full state vs. camera only

The hash carries more than a place. It carries the CRT settings, the HUD
variant, and which panels were collapsed. Recalling a view saved at 3am with
ten layers on will drag those ten layers back on top of whatever the user is
doing now — including the frame cost.

Offer both, defaulting to **full**:

- `"full"` — replay the hash verbatim. What the share link already does.
- `"camera"` — replay only `lat/lon/alt/heading/pitch/roll/map`, leaving
  style, layers and panels exactly as the user currently has them.

`"camera"` is a filter over the decoded params, not a second format. Store the
complete hash either way, so a place saved as `camera` can be upgraded to
`full` later without having lost anything.

## UI

Smallest thing that works: a **Saved** section inside the existing location
bar, next to search. No new panel, no new registry entries, nothing to
re-register. Prefer this.

If it becomes its own panel instead, three registrations are mandatory and each
has a test that fails loudly if you miss it:

1. `DRAGGABLE_PANEL_IDS` in `src/ui.js` **and** a `.panel-drag-handle` element
   in `index.html`. `src/panelDragRegistry.test.mjs` fails in **both**
   directions — a registered panel with no handle, or a handle with no
   registration. This is not theoretical: the entire drag system shipped
   dormant upstream because the handle element never existed.
2. `SHARE_PANEL_STATE_REGISTRY` in `src/sharelink.js:35` with a **unique**
   single-char token, if its collapsed state should travel in share links.
3. `SHARE_PANEL_STATE_SPECS` in `src/ui.js`, which `_buildSharePanelState()`
   (`src/ui.js:7682`) iterates.

Interactions: save current view (prompts for a name), list, recall, rename,
delete, and export/import the whole JSON document — export matters because
`localStorage` dies with the browser profile and there is no server copy.

## Seeding

On first run, if the store is absent, import the entries from
[`SAVED-VIEWS.md`](SAVED-VIEWS.md). Keep them in a plain JS module
(`src/data/savedPlacesSeed.js`) generated from that file, so the markdown stays
the human-editable source and the module stays the thing the app imports.

## Tests to write

Colocated as `src/savedPlaces.test.mjs`, per repo convention.

- Round-trip: capture → store → load → decode yields the same params.
- Unknown `v` is refused whole, never partially read.
- A corrupt or non-JSON blob yields an empty list, not a throw.
- Recall outranks a prior `claimRestoreLane` — the regression that will
  otherwise ship.
- `"camera"` scope leaves layer and panel params untouched.
- The seed file parses and every seeded hash decodes.
- List cap and name-length cap both hold.

## Explicitly out of scope

Sync across devices, sharing a place with another person (the share link
already does that), and folders. One flat list.
