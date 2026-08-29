# Brief for a local Claude Code session

You are the first **local** session on this project. Every session before you
ran in a cloud container: it could read the repo and push to GitHub, but it
could not see the operator's machine, their `.env`, their browser, or their
test run. That gap is why this file exists, and it is most of what you should
fix first.

Read this, then `CLAUDE.md`, then `docs/HANDOFF.md`. `CLAUDE.md` has the
landmines and is not optional — several of them cost a full cycle to
rediscover.

## What you can do that no previous session could

Lead with these. They are not conveniences; they close real gaps in what the
project actually knows about itself.

| Capability | Why it matters here |
|---|---|
| **Read `.env`** | No cloud session ever saw it. Every key check was PowerShell handed to the operator to paste back, one round trip at a time. |
| **Run `npm test` on Windows** | The CRLF bug below existed *only* on the operator's machine. Cloud runs were green while theirs had 25 failures. |
| **Run the dev server and drive a browser** | Nothing has ever been visually verified. Every "does it render" question so far was answered by the operator describing a screenshot. Playwright is a reasonable route. |
| **Read the browser console and network tab** | The Cesium ion 401 took four rounds of guessing that one devtools glance would have settled. |

**Bias hard toward verifying things yourself.** The recurring failure mode in
this project's history is a plausible theory that survived because nobody could
check it cheaply. You can check them.

## Preflight — confirm before doing any work

Run these and report what you find. Do not start the work queue until you know
where you stand.

```powershell
cd C:\Users\stewa\Literally-Palantir-But-Open-Source\Literally-Palantir-But-Open-Source
git status
git log --oneline -3
git branch --show-current
node --version
npm --version
```

Then check GitHub reachability — the operator has a PAT configured, but confirm
rather than assume, and confirm push works before you need it:

```powershell
cd C:\Users\stewa\Literally-Palantir-But-Open-Source\Literally-Palantir-But-Open-Source
git remote -v
git ls-remote origin HEAD
gh auth status
```

If `gh` is absent, plain `git` over HTTPS with the stored PAT is enough for
everything here; you do not need `gh`.

**Expected:** Node **24.14+** (see the gotcha below), remote pointing at
`Samizdat-Publications/Literally-Palantir-But-Open-Source`, and `git ls-remote`
succeeding.

## Repo state — one thing is unmerged and it matters

> **Superseded 2026-08-29.** PR #6 is **merged**; `main` carries the
> `.gitattributes` fix and the operator's checkout was confirmed LF
> (`git ls-files --eol` → `w/lf`, `npm test` → 2,624 pass / 0 fail). No
> re-normalization is needed. The rest of this section is kept as history.

**[PR #6](https://github.com/Samizdat-Publications/Literally-Palantir-But-Open-Source/pull/6) was an open draft on branch `claude/repo-setup-api-keys-b5jc6x`.** It carries the
`.gitattributes` LF fix. Until it lands, a Windows checkout of `main` still
produces CRLF and `npm test` still fails 25 tests for reasons that look like
anything but line endings.

Everything before it is merged into `main` (PR #5, merge commit `b1625fa`).

**Your first substantive act should probably be to get PR #6 merged and the
operator's working tree re-normalized**, because until then you cannot trust
any test result on their machine:

```powershell
cd C:\Users\stewa\Literally-Palantir-But-Open-Source\Literally-Palantir-But-Open-Source
git checkout main
git pull origin main
git rm --cached -r . -q
git reset --hard
npm test
```

`git reset --hard` discards uncommitted work — check `git status` first.
Expect **~2,624 tests, 0 failures**. If you see 25 failures naming
`applyVisualState` or a drifted voice schema, the checkout is still CRLF.

## Things you cannot see, and what to do about them

| Not in the repo | Where it is | What to do |
|---|---|---|
| `.env` (all API keys) | Operator's machine, gitignored | You *can* read it locally. `.env.example` documents every key. Never commit it, never paste key values into chat. |
| Cloud session history | Gone | `docs/HANDOFF.md` and `CLAUDE.md` are the durable record. Everything worth keeping was written down. |
| GitHub MCP tools | Cloud only | Use `git` and, if present, `gh`. |

## Open work

`ROADMAP.md` → **Open items** is the live queue and outranks this summary if
they disagree.

1. **Weather radar layer.** Approved, spec'd, not built.
   `docs/WEATHER-RADAR-SPEC.md` — RainViewer, free and keyless, every API shape
   verified against the live service. Copy `tomtomProxy` in `vite.config.js` as
   the model. **This is the intended next build.**
2. **Saved places.** `docs/SAVED-PLACES-SPEC.md`. The view serialiser already
   exists (`ShareLinkManager._buildHashParams()`); the real work is that restore
   is boot-scoped and must be made re-entrant. Seed data in
   `docs/SAVED-VIEWS.md`.
3. **Layer profile buttons + a cost budget in `DataLayerManager`.** The voice
   path is done; the UI path is not. Costs measured in `docs/LAYER-COST.md`.
4. **Docs brand pass.** 13 `.md` files still say "God's Eye View". Some **must**
   keep it — `FORK-NOTES.md`, `DATA_SOURCES.md`, `public/models/README.md`, and
   the media-attribution line in `README.md` are provenance, not staleness.
5. **Verify the Gemini model id.** `gemini-3.1-pro-preview` is unconfirmed.
   Google validates auth before the model, so only a real call settles it.
   **You can actually test this now** — run the app, trigger a HUD summary,
   read the network response. No cloud session could.
6. **Node 24.14+.** The operator was on 24.13.1, below the `engines` floor.
   Runs, warns `EBADENGINE`. Check and tell them.
7. **Rotate keys before going live.** Google Maps, OpenAI, Gemini, AISStream,
   FIRMS, TomTom, Cesium ion. Several were shared in chat during setup and are
   known-exposed.

## Recently closed, so you do not re-open it

- **The "Bing" basemap 401.** Those chips are **Cesium ion World Imagery**, not
  Bing Maps — ion brokers its own Bing key, confirmed in the asset-2 response.
  There is no Bing Maps key in this app. The stored `CESIUM_ION_TOKEN` had been
  corrupt (293 chars, zero dots where a JWT has two). A fresh token verified
  `200` against ion assets 1, 2 and 3, and the operator has **confirmed every
  basemap now renders**. Closed — no action needed.

  Four wrong theories died on the way there (wrong key type, truncated paste,
  missing scope, a shell variable overriding `.env`), each surviving a round
  because checking it meant another PowerShell paste. `docs/HANDOFF.md` keeps
  the full trail. This is the clearest argument for verifying locally.
- **The CRLF test failures.** Root-caused and fixed in PR #6. See above.

## The operator

Stewart. **Not a programmer** — be concrete and skip the jargon. When you need
something done on the machine, say exactly which window, which key, what they
will see. He has said so directly.

- **Windows, PowerShell 5.1.** `&&` is not a valid separator. One command per
  line, or PowerShell syntax.
- **Always bake the `cd` into every command block.** He asked for this
  explicitly; his project root is nested and easy to get wrong.
- `Read-Host` **echoes** typed input unless given `-AsSecureString`.
- The long-term goal is a **UAP/anomaly correlation engine**. The best lead so
  far is OpenSky's *historical* ADS-B database via `pyopensky` / `traffic`
  (both Python) — a real route to the time dimension that "what was airborne
  over this spot at this time?" needs. The live REST feed this app uses cannot
  answer that.

## Working agreements

- **Node 24.14+**, dev server `npm run dev -- --host localhost --port 4173`.
- **`npm test` must be 0 failures before pushing.** Takes ~90s.
- `npm install` prints 9 high-severity audit warnings. Upstream's dependency
  choices, need breaking upgrades. Expected — do not "fix" them incidentally.
- Branch per the session's assignment; open PRs as drafts.
- The codebase uses thorough JSDoc headers explaining **why**. Match that.
