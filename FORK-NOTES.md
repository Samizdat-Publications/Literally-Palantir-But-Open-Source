# Fork notes

This repository is a copy of an upstream open-source project, brought in so it can be
worked on privately. Everything outside this file is upstream's work unless a later
commit says otherwise.

## Provenance

| | |
|---|---|
| upstream | https://github.com/bilawalsidhu/gods-eye-view |
| upstream commit at import | `880a672b5e16ad3e41d318801d3a5203f9201923` |
| upstream commit date | 24 August 2026 |
| upstream history | 4 commits, imported in full |
| imported | 26 August 2026 |
| author | Bilawal Sidhu |

The import kept upstream's full commit history rather than squashing it, so `git log`
and `git blame` still attribute upstream's code to upstream.

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

A private mirror cannot open a pull request against upstream. GitHub only allows that
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
