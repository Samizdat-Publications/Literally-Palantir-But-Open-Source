# Session handoff

Written 2026-08-28. Read `CLAUDE.md` first — it has the landmines. This file is
state: what is done, what is next, and what will bite.

## Where things stand

Branch `claude/repo-setup-api-keys-b5jc6x`, open **draft** PR #5 against `main`.
PRs #1–#4 are merged. **2,616 tests pass, 0 failures.**

> The suite prints `Failed to load local-dams: SyntaxError` and skips 2
> allocation microbenchmarks. Both are expected. The first is a runtime
> `console.error` from a test deliberately feeding malformed JSON; the second
> only runs on Node 24+.

**PR #5 has not been merged.** That is the one decision waiting on the operator.
It carries everything below.

## Done this session

- **Rebrand to KEYHOLE**, with runtime strings resolving from `src/brand.js` so
  renaming again is a one-file edit. `index.html` is the exception — static
  markup, listed in `BRAND_STATIC_MARKUP_SITES`.
- **Panel dragging**, which shipped complete upstream but dormant: the handler
  looked up a `.panel-drag-handle` that no markup contained. Seven panels now
  have handles; `src/panelDragRegistry.test.mjs` guards both directions.
- **Gemini HUD summaries** with OpenAI as fallback. Voice stays OpenAI Realtime.
- **London CCTV video.** TfL publishes an `.mp4` beside every still; upstream
  left it unused. On by default, opt out with `CCTV_TFL_VIDEO=0`.
- **Thirteen scene tours**, including landmark tours for London, California,
  Ohio and New York. See [`DEMO-QUERIES.md`](DEMO-QUERIES.md).
- **Voice layer shedding** — the fix for "turn off the heavy layers when the
  question doesn't need them". See [`LAYER-COST.md`](LAYER-COST.md).

## Next, in order

1. **Weather radar layer.** Approved, not built.
   [`WEATHER-RADAR-SPEC.md`](WEATHER-RADAR-SPEC.md) — RainViewer, free, keyless,
   every shape verified against the live API. Copy `tomtomProxy` in
   `vite.config.js` as the model.
2. **Saved places.** [`SAVED-PLACES-SPEC.md`](SAVED-PLACES-SPEC.md). The
   serialiser already exists; the work is making restore re-entrant. Seed data
   in [`SAVED-VIEWS.md`](SAVED-VIEWS.md).
3. **Layer profile buttons + a cost budget in `DataLayerManager`.** The voice
   path is done; the UI path is not.
4. Then the rest of `ROADMAP.md` → Open items.

## Bing/ion 401 — open, diagnosed but not resolved

The operator reports the Bing basemap chips failing with
`REQUEST HAS FAILED. STATUS CODE: 401`, "despite having the API key".

**The chip labels are misleading and that is the whole confusion.** There is no
Bing Maps key anywhere in this app. `src/mapStackController.js` defines
`bing-aerial` and `bing-labels` as `Cesium.IonWorldImageryStyle.AERIAL` /
`AERIAL_WITH_LABELS` — **Cesium ion World Imagery**, authenticated with
`CESIUM_ION_TOKEN`. They say "Bing" only because ion's imagery was historically
Bing-sourced.

A 401 therefore means the token reached the browser and **ion refused it** — not
that a Bing key is missing. If no token were configured at all, the app
short-circuits earlier with "Cesium ion token required for Bing stacks", which
is not what the operator saw.

The toast now translates this instead of surfacing Cesium's raw string; see
`_activationErrorMessage` and `src/mapStackIonError.test.mjs`.

**Measured on the operator's machine, 2026-08-28:** token length **293**,
prefix **`eyJhbG`**, `/v1/me` → **401**, `/v1/assets/2/endpoint` →
`{"code":"INVALID_TOKEN"}` **401**.

That rules out the two easy explanations. `eyJhbG` is a JWT header, so it is
**not** a Google or Bing key (those are `AIza`-style opaque strings), and 293
characters is full length for an ion token rather than a truncated paste. It is
a well-formed token that ion does not recognise.

**Remaining causes, most likely first:**

1. The token was **revoked or deleted** in the ion account.
2. It belongs to a **different or closed ion account** than the one now in use.
3. It carries an `exp` that has **passed** — ion default tokens usually have
   none, but a hand-made one can.
4. A **trailing character** rode along in `.env` (a quote, a stray space).
   Vite strips surrounding quotes when it loads `.env`, so this would break the
   `curl` probe above while leaving the app working — but the app is failing
   too, so this is unlikely on its own.

**Decoded on the operator's machine, 2026-08-28: the value is not a JWT.**
`$t.Split('.').Count` returned **1** — there are **no dots in it at all**,
where a real token has exactly two. The last four characters rendered as
`••••`, which is the PowerShell console drawing characters it cannot print.

So the stored value is corrupt, not merely wrong: 293 characters that begin
`eyJhbG` but carry no segment separators and end in unprintable bytes. Cesium
ion could never have accepted it, and no amount of scope or account fixing
would have helped. Something mangled it on the way into `.env` — a truncated
or re-encoded paste, or a write that did not round-trip the value.

**Resolved by rewriting the line.** A freshly minted token was verified
against ion directly on 2026-08-28 — `/v1/me` returned **200**, and every
asset the app touches returned **200**:

| ion asset | Used by | Result |
|---|---|---|
| 1 — Cesium World Terrain | terrain on keyed globe stacks | `200` |
| 2 — World Imagery | `bing-aerial` chip | `200` |
| 3 — World Imagery with Labels | `bing-labels` chip | `200` |

Asset 2's response is also the proof of the architecture note above: it carries
`"externalType":"BING"` and ion's **own** Bing key in `options.key`. Ion brokers
Bing on the account's behalf, which is exactly why no Bing Maps key exists in
this app or ever needs to.

The account is on ion's **free tier** — the asset response carries an "Upgrade
for commercial use" attribution, which must stay visible.

Write the token in a way that cannot mangle it (below) and **restart the dev
server** — Vite bakes `import.meta.env` at build time, so editing `.env` under
a running server changes nothing.

To confirm what the corruption actually is, if it recurs:

```powershell
cd C:\Users\stewa\Literally-Palantir-But-Open-Source\Literally-Palantir-But-Open-Source
$t = (Get-Content .env | Select-String '^CESIUM_ION_TOKEN=').ToString().Split('=',2)[1].Trim()
"length: $($t.Length)  dots: $(([char[]]$t | Where-Object {$_ -eq '.'}).Count)"
"unprintable: $(([char[]]$t | Where-Object {[int]$_ -lt 33 -or [int]$_ -gt 126}).Count)"
([char[]]$t)[-8..-1] | ForEach-Object { "  '{0}' = U+{1:X4}" -f $_, [int]$_ }
```

A healthy ion token reports **2 dots and 0 unprintable characters**.

**Writing a key into `.env` without mangling it.** `Read-Host` echoes input in
PowerShell unless given `-AsSecureString`, and a plain `-replace` silently
does nothing when the line is absent. This round-trips correctly:

```powershell
cd C:\Users\stewa\Literally-Palantir-But-Open-Source\Literally-Palantir-But-Open-Source
$sec = Read-Host "Paste the Cesium ion token" -AsSecureString
$val = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
$val = $val.Trim()
"captured length: $($val.Length)  dots: $(([char[]]$val | Where-Object {$_ -eq '.'}).Count)"
if ((Get-Content .env) -match '^CESIUM_ION_TOKEN=') {
  (Get-Content .env) -replace '^CESIUM_ION_TOKEN=.*', "CESIUM_ION_TOKEN=$val" |
    Set-Content .env -Encoding UTF8
} else {
  Add-Content .env "CESIUM_ION_TOKEN=$val" -Encoding UTF8
}
```

Check the echoed `dots: 2` before moving on. That one line is the whole
verification — if it says 0, the paste was mangled again and nothing
downstream will work.

**Superseded reasoning, kept so it is not re-derived.** A JWT payload is base64url, not
encrypted, and this reveals scopes, expiry and issuer without sending the token
anywhere:

```powershell
cd C:\Users\stewa\Literally-Palantir-But-Open-Source\Literally-Palantir-But-Open-Source
$t = (Get-Content .env | Select-String '^CESIUM_ION_TOKEN=').ToString().Split('=',2)[1].Trim()
"segments: $($t.Split('.').Count)   last4: $($t.Substring($t.Length-4))"
$p = $t.Split('.')[1].Replace('-','+').Replace('_','/')
while ($p.Length % 4) { $p += '=' }
[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($p))
```

A genuine ion token decodes to `"iss":"ad"` with a `scopes` array. If `iss` is
anything else it is not an ion token at all. If `exp` is in the past it is
expired. Either way the fix is the same and takes two minutes: mint a fresh
token at cesium.com/ion/tokens with `assets:read`, put it in `.env`, and
**restart the dev server** — Vite bakes `import.meta.env` at build time, so
editing `.env` under a running server changes nothing.

**Diagnostic — run this on the operator's machine.** Both endpoints were
verified live on 2026-08-28: a bogus token returns `401` from `/v1/me`, and
`{"code":"INVALID_TOKEN","message":"Invalid access token"}` from the asset
endpoint.

```powershell
cd C:\Users\stewa\Literally-Palantir-But-Open-Source\Literally-Palantir-But-Open-Source
$t = (Get-Content .env | Select-String '^CESIUM_ION_TOKEN=').ToString().Split('=',2)[1].Trim()
"token length: $($t.Length)"
$t.Substring(0,6)
curl.exe -s -o NUL -w "me: %{http_code}`n" "https://api.cesium.com/v1/me?access_token=$t"
curl.exe -s -w "`nassets: %{http_code}`n" "https://api.cesium.com/v1/assets/2/endpoint?access_token=$t"
```

Reading the result:

- **`me: 200`, `assets: 200`** — the token is fine and the fault is client-side.
  Look at `import.meta.env.CESIUM_ION_TOKEN` (defined in `vite.config.js`) and
  whether the dev server was restarted after `.env` changed. Vite bakes it at
  build time; editing `.env` with the server running changes nothing.
- **`me: 401`** — the token itself is rejected. Cause 1, 2 or 4. Mint a fresh
  one at cesium.com/ion/tokens.
- **`me: 200`, `assets: 401/403`** — cause 3. Fix the scope, do not rotate.
- **A short token, or one starting `AIza`** — that is a Google key, not an ion
  token. Cause 1, confirmed.

Ion tokens begin `eyJ` (they are JWTs). Do not paste the token into chat; the
length and first six characters are enough to tell.

## Windows checkouts must be LF — this cost 25 test failures

The operator ran `npm test` on Windows and got **25 failures out of 2,621**,
on a commit that is green on Linux. None of the failure messages pointed at the
real cause; they said things like `applyVisualState is missing from ui.js` and
reported the frozen voice schema as drifted.

**Cause: a CRLF checkout.** Several tests read source files as text and assert
on exact bytes. Reproduced by converting the files and re-running the
assertions:

| Assertion | LF | CRLF |
|---|---|---|
| `applyVisualState` probe in `src/scenes/director.test.mjs` | matches | **no match** |
| `GEV_REALTIME_TOOLS` block size | baseline | **+622 bytes**, different SHA |

The probe's regex ends in `\n {2}\}\n`; CRLF puts `\r` before that newline
and the match returns `null`, which the test reports as the method being
missing. The schema freeze fails for the same reason — one extra byte per line.

**Fixed** by adding `.gitattributes` with `* text=auto eol=lf`, guarded by
`src/lineEndings.test.mjs`, which also fails loudly *with the real reason* if a
future checkout is CRLF anyway.

**An existing Windows checkout does not fix itself** — `.gitattributes` only
applies on checkout. To re-normalize a clean tree:

```powershell
cd C:\Users\stewa\Literally-Palantir-But-Open-Source\Literally-Palantir-But-Open-Source
git pull origin main
git rm --cached -r . -q
git reset --hard
npm test
```

`git reset --hard` discards uncommitted changes, so check `git status` first if
there is anything local worth keeping.

## Things that will cost you a cycle

**The voice tool schema is byte-frozen.** `src/firstRunExperience.test.mjs`
SHA-256s the `GEV_REALTIME_TOOLS` array literal — 31,104 bytes, digest
`3ace1997…` — because a schema edit busts the Realtime session cache. Before
adding a tool, check whether an **instruction string** can express it with
existing tools. Twice now the answer was yes (NAMED VIEWS, SHEDDING LAYERS FOR
SPEED), and each cost one string with a one-line rollback.

**Tool descriptions inside that block still say "God's Eye View" on purpose.**
They are routing hints for the model, not user-visible identity. Rebranding them
breaks the freeze for no functional gain. This already happened once.

**`gev-` is not branding.** 218+ CSS classes and DOM ids. Leave them alone.

**`sceneLayerPlan` drops unregistered layer ids silently.** A typo in a recipe
is invisible at runtime — the layer just keeps whatever state it had.
`src/demoTours.test.mjs` is the guard.

**Attribution is a licence obligation.** New data sources go in **both**
`DATA_SOURCES.md` and `src/data/dataCredits.js`.

**The analyst engine has no LLM in it.** `src/data/analystEngine.js` is local
query logic. Making it smarter is not a provider swap.

## Environment

- **Operator is on Windows, PowerShell 5.1.** No `&&` chaining. Bake `cd` into
  every command block — they asked for this explicitly. Project root is nested:
  `C:\Users\stewa\Literally-Palantir-But-Open-Source\Literally-Palantir-But-Open-Source`
- `Read-Host` **echoes** input unless given `-AsSecureString`.
- **Node floor is 24.14.** The operator is on 24.13.1 — runs, warns `EBADENGINE`.
- `npm install` prints 9 high-severity audit warnings. Upstream's dependency
  choices, need breaking upgrades. Expected. Do not "fix" them incidentally.

## Keys

All keys currently in `.env` are **temporary test keys**. The operator has said
they will be revoked before going live and wants to be told which to replace:
Google Maps, OpenAI, Gemini, AISStream, FIRMS, TomTom, Cesium ion. Several were
shared in chat during setup and are known-exposed.

`GOOGLE_MAPS_API_KEY` is required and needs **four** APIs enabled — Map Tiles,
Geocoding, Places (New), Street View Static. Each missing one fails with
`REQUEST_DENIED`, which reads like a bad key rather than a missing checkbox.

Unverified: the Gemini model id `gemini-3.1-pro-preview`. Google validates auth
before the model, so a bad key cannot test it. The first real HUD summary will
say. `GEMINI_HUD_SUMMARY_MODEL` overrides without a code change.

## The long-term goal

A UAP/anomaly correlation engine. The single most useful lead so far is OpenSky's
**historical** ADS-B database via `pyopensky` / `traffic` (both Python) — a
concrete route to the time dimension that "what was airborne over this spot at
this time?" needs. The app's live REST feed cannot answer that. See
`ROADMAP.md` → Open items.
