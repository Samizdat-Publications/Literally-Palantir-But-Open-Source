# Demo script

Voice queries for showing the app to someone, in build order — each lands
harder than the last. Written for a live audience, not for testing.

## Before you start

- Mic session costs money per minute. Watch the cost readout in the **MIC**
  panel. Flip **MINI** on for a cheaper model — fine for camera commands, worse
  at analysis.
- Layer weight is the thing that will make it stutter. See
  [`LAYER-COST.md`](LAYER-COST.md). You can also just say *"this is laggy"* and
  the agent now sheds the three heavy static layers itself.

## The ten

**1.** *"Take me to Tokyo and orbit slowly."*
Opens with the globe flying somewhere gorgeous. Sets the tone.

**2.** *"Turn on the radio layer and play a station near Tokyo."*
The globe fills with broadcasters and audio starts. Reliably gets a reaction.

**3.** *"Switch to night vision."*
Instant, dramatic, zero latency. Follow with *"switch to thermal"* and *"go
back to normal."*

**4.** *"Turn on active fires and take me to Washington state."*
Points at the Okanogan complex — 197 detections, ~2,491 MW at last check.

**5.** *"How many flights are over Texas right now?"*
The moment it stops being a map. Real number, live data, spoken back.

**6.** *"Turn on the CCTV layer and take me to Westminster."*
London. This is the one place you get **actual video** playing inside the 3D
scene — see the note below.

**7.** *"Outline the state of California."*
Draws the real boundary, not a circle. Then *"annotate Golden Gate Park"* for
the close-up version.

**8.** *"Turn on military flights and take me to Fort Rucker, Alabama."*
Army aviation training — helicopters flying visible circuit patterns. Then
*"track that helicopter"* → *"enter cockpit."*

**9.** *"When does the ISS pass over next?"*
Genuine orbital mechanics computed live. Pair with *"turn on satellites"* and
*"zoom out to a globe view."*

**10.** *"Draw the walking route from Zilker Park to the Texas Capitol."* →
*"Now fly it."*
The best closer — a real street route, then a banked drone-style camera flight
along it.

## Recovery lines

If it wanders: *"clear the map"* · *"reset the globe"* · *"what's turned on
right now?"* · *"this is laggy"* (sheds the heavy layers).

## Two things that will otherwise embarrass you

**Only London serves video.** TfL publishes a rolling `.mp4` beside every
still. Austin and Caltrans are hardcoded `feedType: 'image'` — stills only.
If you promise moving pictures, go to London.

**East Canton, Ohio has no cameras.** The networks are Austin, Caltrans
(California), and London. The `ohio-landmarks` tour flies the state's
architecture; it does not have camera coverage to show.

## Tours

Thirteen, all in the scene panel. Run one instead of driving manually if you'd
rather talk over it.

| Tour | What it is |
|---|---|
| `fireline-cascadia` | Active wildfire complexes, Pacific Northwest |
| `orbital-ascent` | Launch pads and the orbital shell |
| `london-eyes` | London street cameras — West End and Westminster (**video**) |
| `london-river-watch` | London street cameras — Thames crossings east (**video**) |
| `london-landmarks` | Parliament, the Eye, Buckingham Palace, St Paul's, the Shard, Tower Bridge |
| `harbor-watch` | New York harbour, shipping and the approaches |
| `new-york-landmarks` | Liberty, One WTC, Brooklyn Bridge, Empire State, Central Park |
| `california-eyes` | Caltrans cameras, Bay Area and LA (stills) |
| `california-landmarks` | Golden Gate, SF skyline, Santa Monica, Hollywood Sign, Griffith, DTLA |
| `ohio-landmarks` | East Canton, Pro Football HOF, Cleveland, Columbus, Cincinnati |
| `approach-and-intercept` | LAX departures out to Nellis |
| `airborne-all-the-way` | Fort Sill, Fort Benning, Fort Bragg — basic, airborne, 82nd |
| `world-service` | Radio: New Orleans → Mexico City → Rio → Istanbul → Tokyo |

Landmark tours run exactly one live layer on purpose — the subject is the
photorealistic mesh, and a second layer costs frames for nothing.
