# Showcase capture

Makes `showcase/film.mp4` and `showcase/poster.png` for samizdatpublications.com from the real running
app. `capture.mjs` drives the dev build through `window.__godsEyeView` in headless Chrome (real GPU) and
renders every frame on purpose instead of recording the screen, so camera moves are perfectly smooth at
any resolution.

How it stays honest and smooth:

- **Recording mode.** It uses the app's own `recording-mode` and clean view, turns the HUD, scope mask
  and detection boxes off, and keeps the Google and Cesium credit line on screen (required attribution).
- **A virtual clock.** `Date` is replaced in the page before the app loads. During a take it stands still
  and moves forward one step per captured frame, so live aircraft (dead-reckoned on `Date`) and satellites
  (SGP4 on `new Date()`) move exactly one frame's worth per frame. `performance.now` stays real so Cesium's
  tile loading budgets keep working. A satellites shot uses a bigger step (60x) so the shells visibly stream.
- **Live polling paused during a take.** Requests matching a shot's `block` list are aborted while frames
  are captured, so fresh positions from the live feeds can't jump the aircraft mid-take.
- **Style crossfades on the frame clock.** `styleCycle` switches the visual mode at given frames and runs
  the app's 500 ms ease-in-out crossfade against the virtual clock instead of wall time.
- Each frame waits until Google's 3D tiles report loaded before it is saved.

## Run it

Start the dev server on port 4291 (any free port; set `APP_URL` to match), then from the repo root:

```powershell
cd "C:\Users\stewa\Documents\Claude\Literally-Palantir-But-Open-Source"; $env:ONLY = "A-midtown"; node tools\showcase-capture\capture.mjs tools\showcase-capture\shots.json "C:\Temp\keyhole-frames" 2560 1440
```

Run one shot per process (`ONLY`), because Cesium occasionally loses a worker module mid-session and
stops rendering; the script then stops with the error instead of saving black frames. Frames land in
`<out>\<shot>\f0000.png` and onward. `encode.sh` (Git Bash, run it from the folder that holds `final\`)
joins the three shots with hard cuts at 30 fps, encodes two-pass H.264 at a 30 Mbps average (CRF 18 came
out at 112 MB, over GitHub's 50 MB file limit; two-pass lands near 42 MB), copies the first frame as the
poster, and writes a contact sheet plus 1.2:1 and 2:1 centre-crop strips to review.

Live aircraft make every take different. Shoot city scenes when that city's sky is busy: a New York take
at 3:30 AM Eastern shows only a handful of aircraft.

## Shot file

Each entry: `name`, `style`, `layers` (only the layers named are on), optional `layerParams`, `from` and
`to` camera (`lat`, `lon`, `alt` in metres, `heading`, `pitch` in degrees; altitude interpolates
geometrically), `frames`, `vtStepMs` (virtual time per frame), `minRenders` (renders per frame; the
dense satellite catalogue refreshes over about 300), `warmMs` (live loading time before the take),
`block`, `styleCycle`, and `follow` (a chase camera locked to a live aircraft picked near a point).

Never commit a frame that shows a key, the browser UI or a debug readout.
