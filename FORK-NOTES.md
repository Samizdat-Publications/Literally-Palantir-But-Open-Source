# Fork notes

This repository is a copy of an upstream open-source project, imported as its own
repository rather than a GitHub fork. Everything is upstream's work except the KEYHOLE files listed under
"Sync of 11/21/2026" below.

## Provenance

| | |
|---|---|
| upstream | https://github.com/bilawalsidhu/gods-eye-view |
| upstream commit at import | `880a672b5e16ad3e41d318801d3a5203f9201923` |
| upstream commit date | 24 August 2026 |
| upstream history | 4 commits, imported in full |
| imported | 26 August 2026 |
| last upstream sync | `d9d79ebc4` on 11/21/2026 (5,332 upstream commits) |
| author | Bilawal Sidhu |

The import kept upstream's full commit history rather than squashing it, so `git log`
and `git blame` still attribute upstream's code to upstream.

## Sync of 11/21/2026

Upstream had grown by 5,332 commits (about 5,000 files changed, a move to Vue 3
views and a `server/` provider layer). The sync is one merge commit with
upstream as the second parent, its tree taken from upstream wholesale, then the
fork's keepers laid back on top. No history was rewritten.

Kept from the fork: KEYHOLE branding (index.html, two Vue wordmarks, the PWA
manifest, `public/logo.svg`, `src/brand.js`), the 13 demo tours (now
`src/scenes/keyholeTours.js` plus a two-line hook in `recipes.js`), README.md,
this file, ROADMAP.md, SETUP.md, CLAUDE.md, showcase.json, `showcase/`, `site/`,
`functions/`, our older docs in `docs/`, and two `.gitignore` lines.
README.upstream.md was refreshed to upstream's current README.

Dropped in favour of upstream, which reworked the same areas:

| Fork change | Status after the sync |
|---|---|
| Draggable panels | Dropped. Upstream's UI is now Vue with its own panel layout system. |
| Gemini HUD summary provider | Dropped. Upstream's HUD summary is OpenAI; upstream added Gemini for voice and chat (`GEMINI_API_KEY`). `HUD_SUMMARY_PROVIDER`, `GEMINI_HUD_SUMMARY_MODEL`, `GEMINI_API_BASE` no longer do anything. |
| London TfL video | Dropped. Upstream serves TfL as stills by owner decision. A candidate to re-add as a small, separate change. |
| Voice layer shedding instruction | Dropped. Could be re-added as an instruction string. |
| Cesium ion 401/403 error text | Dropped with the old map stack code. |
| `.gitattributes` LF rule | Upstream now ships the same rule. |
| Tour, drag, ion, shedding, line-ending tests | Dropped with their code; the tour test was ported. |

Env vars in our old `.env.example` that upstream no longer reads:
`AISSTREAM_URL`, `CCTV_AUTO_CALIBRATE`, `CCTV_DRAPE_MESH`, `GEMINI_API_BASE`,
`GEMINI_HUD_SUMMARY_MODEL`, `HUD_SUMMARY_PROVIDER`, `OPENSKY_USERNAME`,
`OPENSKY_PASSWORD`, `TFL_APP_KEY`. New optional ones worth knowing:
`GOOGLE_MAPS_SERVER_API_KEY`, `GEMINI_LIVE_MODEL`, `GEMINI_CHAT_MODEL`,
`OPENAI_CHAT_MODEL`, `OVERPASS_UPSTREAMS`, `MAPILLARY_CLIENT_TOKEN`,
`WORLDNEWSAPI_KEY`, `LIVEUAMAP_API_KEY`, `NOMINATIM_URL`, `PHOTON_URL`, and
about 50 `CCTV_*` switches for new camera networks. `.env.example` is upstream's.

## Licensing, and the part that is not MIT

The **source code** is MIT. That permits private use, modification and redistribution,
on one condition: the copyright notice and the licence text must travel with any copy.
Keep `LICENSE` intact.

The **bundled data and 3D models are not MIT** and carry their own terms. This matters
the moment anything here is used commercially or published:

| asset | licence | practical constraint |
|---|---|---|
| `src/data/local_data/telegeography_submarine_cables/` | CC BY-NC-SA 3.0 | non-commercial only, and share-alike |
| datacenters and dams (OSM / Open Infrastructure Map) | ODbL 1.0 | attribution and share-alike on the data |
| NASA FIRMS fire snapshot | CC0 / US public domain | citation requested |
| `public/models/` | individual licences, per model | see `public/models/README.md` |

Private use inside this repository triggers none of the share-alike obligations,
because share-alike attaches to distribution. Publishing this repository, or using it
commercially, does. `DATA_SOURCES.md` carries the full per-source breakdown.

Live feeds pulled at runtime are governed by each provider's own terms, and some of
them (Google Maps, OpenSky) restrict commercial use.

## Contributing back upstream

A copied repository cannot open a pull request against upstream. GitHub only allows that
from a real fork. To send work back:

1. Fork `bilawalsidhu/gods-eye-view` on GitHub through the normal Fork button.
2. Add that fork as a remote here, push the topic branch to it, and open the pull
   request from there.

Work that is meant to stay private can just stay on a branch in this repository.

## Staying current with upstream

```
git remote add upstream https://github.com/bilawalsidhu/gods-eye-view
git fetch upstream
git merge upstream/main
```

The import used an unrelated-histories merge, so upstream's tree and this repository's
original initial commit are both ancestors of the branch. Later merges from upstream
are ordinary merges and need no special flag.

## Local environment notes

| | |
|---|---|
| Node required | 24.14.x or 26.x, enforced by `package.json` `engines` |
| secrets file | `.env`, already covered by `.gitignore` |
| dev server binding | localhost by default, which is the safe setting |

The dev server brokers real API keys, so anything that widens its binding beyond
localhost hands those keys to whoever can reach the port. `SECURITY.md` has the
threat model.
