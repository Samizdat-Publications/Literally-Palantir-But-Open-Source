/**
 * Scene recipes optimized for short social clips.
 * Each recipe is deterministic so repeated runs produce similar footage.
 */

export const SCENE_RECIPES = [
  {
    id: 'flights-radar',
    title: 'Global Flights Radar',
    durationSec: 30,
    style: 'retro',
    ui: { hidePanels: true, hudMode: 'minimal', safeFrame: '16:9' },
    layers: {
      flights: true,
      satellites: false,
      earthquakes: false,
      traffic: false,
    },
    post: {
      bloom: 62,
      sharpen: true,
      detectionMode: 'OFF',
    },
    cameraPath: [
      { lat: 20.0, lon: -30.0, alt: 19000000, heading: 25, pitch: -65, roll: 0, duration: 6, hold: 1 },
      { lat: 46.0, lon: 2.0, alt: 8000000, heading: 40, pitch: -52, roll: 0, duration: 5, hold: 1 },
      { lat: 35.0, lon: 139.0, alt: 4200000, heading: 22, pitch: -46, roll: 0, duration: 5, hold: 1 },
      { lat: 37.6, lon: -122.4, alt: 1700000, heading: 8, pitch: -40, roll: 0, duration: 5, hold: 1 },
      { lat: 0.0, lon: -20.0, alt: 12000000, heading: -10, pitch: -70, roll: 0, duration: 4, hold: 0 },
    ],
  },
  {
    id: 'orbital-watch',
    title: 'Orbital Watch',
    durationSec: 32,
    style: 'surveillance',
    ui: { hidePanels: true, hudMode: 'full', safeFrame: '16:9' },
    layers: {
      flights: false,
      satellites: true,
      earthquakes: false,
      traffic: false,
    },
    post: {
      bloom: 58,
      sharpen: false,
      detectionMode: 'SPARSE',
      styleParams: {
        surveillance: {
          gain: 0.62,
          bloom: 0.38,
          scanlineStr: 0.9,
          pixelation: 2.1,
        },
      },
    },
    cameraPath: [
      { lat: 28.0, lon: -82.0, alt: 22000000, heading: 0, pitch: -82, roll: 0, duration: 7, hold: 1 },
      { lat: 10.0, lon: 20.0, alt: 12000000, heading: 18, pitch: -74, roll: 0, duration: 5, hold: 1 },
      { lat: 35.7, lon: 139.7, alt: 6500000, heading: 24, pitch: -64, roll: 0, duration: 5, hold: 1 },
      { lat: 48.8, lon: 2.3, alt: 3000000, heading: 32, pitch: -58, roll: 0, duration: 5, hold: 1 },
      { lat: 30.0, lon: -25.0, alt: 15000000, heading: -20, pitch: -78, roll: 0, duration: 4, hold: 0 },
    ],
  },
  {
    id: 'thermal-threats',
    title: 'Thermal Threat Board',
    durationSec: 26,
    style: 'thermal',
    ui: { hidePanels: true, hudMode: 'full', safeFrame: '16:9' },
    layers: {
      flights: false,
      satellites: false,
      earthquakes: true,
      traffic: false,
    },
    post: {
      bloom: 72,
      sharpen: true,
      detectionMode: 'OFF',
      styleParams: {
        thermal: {
          sensitivity: 0.84,
          bloom: 0.78,
          mode: 0.0,
          pixelation: 1.9,
        },
      },
    },
    cameraPath: [
      { lat: 37.0, lon: -121.0, alt: 5200000, heading: 20, pitch: -62, roll: 0, duration: 5, hold: 1 },
      { lat: 35.7, lon: 140.0, alt: 3100000, heading: 5, pitch: -55, roll: 0, duration: 5, hold: 1 },
      { lat: -36.8, lon: 174.7, alt: 2600000, heading: -12, pitch: -50, roll: 0, duration: 5, hold: 1 },
      { lat: 38.0, lon: -10.0, alt: 9000000, heading: 12, pitch: -70, roll: 0, duration: 4, hold: 0 },
    ],
  },
  {
    id: 'city-overload',
    title: 'City Overload',
    durationSec: 30,
    style: 'surveillance',
    ui: { hidePanels: true, hudMode: 'minimal', safeFrame: '9:16' },
    layers: {
      flights: true,
      satellites: true,
      earthquakes: false,
      traffic: true,
    },
    post: {
      bloom: 65,
      sharpen: true,
      detectionMode: 'PANOPTIC',
      styleParams: {
        surveillance: {
          gain: 0.68,
          bloom: 0.42,
          scanlineStr: 1.0,
          pixelation: 2.4,
        },
      },
    },
    cameraPath: [
      { lat: 40.73, lon: -74.0, alt: 1500000, heading: 25, pitch: -44, roll: 0, duration: 5, hold: 1 },
      { lat: 40.73, lon: -74.0, alt: 550000, heading: 58, pitch: -36, roll: 0, duration: 4, hold: 1 },
      { lat: 40.73, lon: -74.0, alt: 260000, heading: 102, pitch: -33, roll: 0, duration: 4, hold: 1 },
      { lat: 34.05, lon: -118.24, alt: 1200000, heading: 45, pitch: -42, roll: 0, duration: 5, hold: 1 },
      { lat: 51.5, lon: -0.12, alt: 1200000, heading: 22, pitch: -44, roll: 0, duration: 5, hold: 0 },
    ],
  },
  {
    id: 'omniscience-pullback',
    title: 'Omniscience Pullback',
    durationSec: 36,
    style: 'retro',
    ui: { hidePanels: true, hudMode: 'full', safeFrame: '16:9' },
    layers: {
      flights: true,
      satellites: true,
      earthquakes: true,
      traffic: true,
    },
    post: {
      bloom: 68,
      sharpen: true,
      detectionMode: 'SPARSE',
      styleParams: {
        retro: {
          pixelation: 4.4,
          distortion: 0.42,
          instability: 0.58,
        },
      },
    },
    cameraPath: [
      { lat: 35.68, lon: 139.76, alt: 280000, heading: 30, pitch: -26, roll: 0, duration: 5, hold: 1 },
      { lat: 35.68, lon: 139.76, alt: 900000, heading: 26, pitch: -38, roll: 0, duration: 4, hold: 1 },
      { lat: 35.68, lon: 139.76, alt: 3800000, heading: 18, pitch: -52, roll: 0, duration: 5, hold: 1 },
      { lat: 20.0, lon: 110.0, alt: 9500000, heading: 8, pitch: -66, roll: 0, duration: 5, hold: 1 },
      { lat: 5.0, lon: 30.0, alt: 18000000, heading: -8, pitch: -78, roll: 0, duration: 6, hold: 0 },
    ],
  },

  // ---------------------------------------------------------------------
  // Demo tours. Each declares EVERY layer it does not want, because
  // sceneLayerPlan only touches layers a shot names — an undeclared layer
  // keeps whatever state it had, which on a loaded globe means a tour
  // inherits someone else's performance problem.
  //
  // Fire coordinates were taken from a live NASA FIRMS query rather than
  // guessed; see the tour comments for the detection counts at capture time.
  // Fires move, so these are "the region that burns", not a promise.
  // ---------------------------------------------------------------------
  {
    id: 'fireline-cascadia',
    title: 'Fire Line — Pacific Northwest',
    durationSec: 34,
    style: 'thermal',
    ui: { hidePanels: true, hudMode: 'full', safeFrame: '16:9' },
    // Fires only. Everything else off — this is the cheapest tour to run and
    // the thermal palette reads best against an otherwise empty globe.
    layers: {
      'local-firms': true,
      flights: false,
      military: false,
      satellites: false,
      earthquakes: false,
      traffic: false,
      cctv: false,
      radio: false,
      bikeshare: false,
      'ais-live-vessels': false,
      'rocket-launches': false,
      'military-installations': false,
      'local-dams': false,
      'local-datacenters': false,
    },
    post: { bloom: 70, sharpen: true, detectionMode: 'SPARSE' },
    cameraPath: [
      // Regional establishing shot over the Cascades and Columbia basin.
      { lat: 46.5, lon: -119.5, alt: 1400000, heading: 12, pitch: -62, roll: 0, duration: 6, hold: 1 },
      // Okanogan / Colville, north-central Washington. The dominant complex in
      // the capture: 197 detections, ~2,491 MW total radiative power in 24h.
      { lat: 48.913, lon: -119.807, alt: 210000, heading: 24, pitch: -45, roll: 0, duration: 6, hold: 2 },
      { lat: 48.913, lon: -119.807, alt: 42000, heading: 40, pitch: -32, roll: 0, duration: 5, hold: 2 },
      // Clearwater country, Idaho — fewer detections but far hotter per pixel
      // (~1,754 MW from 20), so the thermal ramp separates them visibly.
      { lat: 46.028, lon: -116.066, alt: 90000, heading: -18, pitch: -38, roll: 0, duration: 5, hold: 2 },
      // Pull back out to show the whole burning arc at once.
      { lat: 46.8, lon: -118.0, alt: 1900000, heading: 0, pitch: -70, roll: 0, duration: 5, hold: 0 },
    ],
  },
  {
    id: 'orbital-ascent',
    title: 'Orbital — Satellites and Launch Sites',
    durationSec: 36,
    style: 'surveillance',
    ui: { hidePanels: true, hudMode: 'full', safeFrame: '16:9' },
    layers: {
      satellites: true,
      'rocket-launches': true,
      flights: false,
      military: false,
      earthquakes: false,
      traffic: false,
      cctv: false,
      radio: false,
      bikeshare: false,
      'ais-live-vessels': false,
      'military-installations': false,
      'local-firms': false,
      'local-dams': false,
      'local-datacenters': false,
    },
    post: { bloom: 60, sharpen: false, detectionMode: 'SPARSE' },
    cameraPath: [
      // Start high enough that the whole constellation shell is visible.
      { lat: 12.0, lon: -60.0, alt: 24000000, heading: 0, pitch: -84, roll: 0, duration: 7, hold: 2 },
      // Cape Canaveral / Kennedy — the densest launch cadence on the planet.
      { lat: 28.489, lon: -80.578, alt: 320000, heading: 18, pitch: -48, roll: 0, duration: 6, hold: 2 },
      { lat: 28.585, lon: -80.650, alt: 26000, heading: 70, pitch: -28, roll: 0, duration: 5, hold: 2 },
      // Vandenberg — the polar-orbit pad, and a completely different coastline.
      { lat: 34.742, lon: -120.572, alt: 120000, heading: -30, pitch: -40, roll: 0, duration: 5, hold: 1 },
      // Back to orbit height to close on the shell.
      { lat: 20.0, lon: -100.0, alt: 20000000, heading: 10, pitch: -80, roll: 0, duration: 6, hold: 0 },
    ],
  },
  {
    id: 'london-eyes',
    title: 'London — Live Street Cameras',
    durationSec: 34,
    style: 'retro',
    ui: { hidePanels: false, hudMode: 'full', safeFrame: '16:9' },
    // London is the one camera network that serves real video rather than
    // stills, and Google's photorealistic coverage of the centre is dense.
    layers: {
      cctv: true,
      traffic: true,
      flights: false,
      military: false,
      satellites: false,
      earthquakes: false,
      radio: false,
      bikeshare: false,
      'ais-live-vessels': false,
      'rocket-launches': false,
      'military-installations': false,
      'local-firms': false,
      'local-dams': false,
      'local-datacenters': false,
    },
    post: { bloom: 46, sharpen: true, detectionMode: 'SPARSE' },
    cameraPath: [
      { lat: 51.505, lon: -0.120, alt: 14000, heading: 20, pitch: -50, roll: 0, duration: 6, hold: 1 },
      // Westminster / Parliament Square — heavy JamCam density, strong 3D.
      { lat: 51.5010, lon: -0.1246, alt: 1200, heading: 45, pitch: -26, roll: 0, duration: 6, hold: 2 },
      // Piccadilly and the West End.
      { lat: 51.5100, lon: -0.1340, alt: 900, heading: 110, pitch: -22, roll: 0, duration: 5, hold: 2 },
      // Tower Bridge — the most recognisable frame in the set.
      { lat: 51.5055, lon: -0.0754, alt: 800, heading: 300, pitch: -20, roll: 0, duration: 6, hold: 2 },
      { lat: 51.508, lon: -0.100, alt: 9000, heading: 15, pitch: -45, roll: 0, duration: 5, hold: 0 },
    ],
  },
  {
    id: 'harbor-watch',
    title: 'Harbor Watch — New York and the Approaches',
    durationSec: 32,
    style: 'noir',
    ui: { hidePanels: false, hudMode: 'full', safeFrame: '16:9' },
    layers: {
      'ais-live-vessels': true,
      cctv: true,
      flights: false,
      military: false,
      satellites: false,
      earthquakes: false,
      traffic: false,
      radio: false,
      bikeshare: false,
      'rocket-launches': false,
      'military-installations': false,
      'local-firms': false,
      'local-dams': false,
      'local-datacenters': false,
    },
    post: { bloom: 52, sharpen: true, detectionMode: 'SPARSE' },
    cameraPath: [
      // The Narrows, looking up-harbour into Manhattan.
      { lat: 40.606, lon: -74.045, alt: 26000, heading: 20, pitch: -52, roll: 0, duration: 6, hold: 1 },
      // Lower Manhattan at building height — the strongest 3D in the app.
      { lat: 40.7040, lon: -74.0135, alt: 1100, heading: 35, pitch: -20, roll: 0, duration: 6, hold: 2 },
      // Container terminals at Bayonne / Newark Bay, where the AIS density is.
      { lat: 40.670, lon: -74.145, alt: 6500, heading: 300, pitch: -34, roll: 0, duration: 5, hold: 2 },
      // Ambrose Channel approach — the inbound queue, out to sea.
      { lat: 40.480, lon: -73.900, alt: 60000, heading: 200, pitch: -48, roll: 0, duration: 5, hold: 1 },
      { lat: 40.65, lon: -74.05, alt: 180000, heading: 10, pitch: -62, roll: 0, duration: 5, hold: 0 },
    ],
  },
  {
    id: 'approach-and-intercept',
    title: 'Approach and Intercept — LAX to Nellis',
    durationSec: 36,
    style: 'retro',
    ui: { hidePanels: false, hudMode: 'full', safeFrame: '16:9' },
    layers: {
      flights: true,
      military: true,
      traffic: true,
      cctv: false,
      satellites: false,
      earthquakes: false,
      radio: false,
      bikeshare: false,
      'ais-live-vessels': false,
      'rocket-launches': false,
      'military-installations': true,
      'local-firms': false,
      'local-dams': false,
      'local-datacenters': false,
    },
    post: { bloom: 54, sharpen: true, detectionMode: 'DENSE' },
    cameraPath: [
      // LAX finals — four parallel runways, constant traffic, excellent 3D.
      { lat: 33.9416, lon: -118.4085, alt: 4200, heading: 90, pitch: -28, roll: 0, duration: 6, hold: 2 },
      // Down the approach corridor over the terminals.
      { lat: 33.9440, lon: -118.3830, alt: 1400, heading: 265, pitch: -14, roll: 0, duration: 5, hold: 2 },
      // Pull east across the basin.
      { lat: 34.20, lon: -117.30, alt: 320000, heading: 55, pitch: -50, roll: 0, duration: 5, hold: 1 },
      // Nellis AFB and the Las Vegas basin — military traffic against dense 3D.
      { lat: 36.2360, lon: -115.0343, alt: 26000, heading: 30, pitch: -38, roll: 0, duration: 6, hold: 2 },
      // The Strip, because it renders absurdly well.
      { lat: 36.1147, lon: -115.1728, alt: 1300, heading: 20, pitch: -22, roll: 0, duration: 6, hold: 2 },
    ],
  },
  {
    id: 'airborne-all-the-way',
    title: 'Airborne All The Way — Sill, Benning, Bragg',
    durationSec: 40,
    style: 'retro',
    ui: { hidePanels: false, hudMode: 'full', safeFrame: '16:9' },
    layers: {
      military: true,
      'military-installations': true,
      flights: true,
      cctv: false,
      traffic: false,
      satellites: false,
      earthquakes: false,
      radio: false,
      bikeshare: false,
      'ais-live-vessels': false,
      'rocket-launches': false,
      'local-firms': false,
      'local-dams': false,
      'local-datacenters': false,
    },
    post: { bloom: 50, sharpen: true, detectionMode: 'SPARSE' },
    cameraPath: [
      // Fort Sill, Lawton OK — Basic and AIT. The artillery post, opening wide
      // enough to read the ranges north of the cantonment.
      { lat: 34.6592, lon: -98.4023, alt: 34000, heading: 15, pitch: -46, roll: 0, duration: 6, hold: 2 },
      { lat: 34.6490, lon: -98.3870, alt: 3200, heading: 60, pitch: -22, roll: 0, duration: 5, hold: 2 },
      // Fort Benning, Columbus GA — Airborne School. Framed on Lawson Army
      // Airfield and the jump towers rather than main post.
      { lat: 32.3370, lon: -84.9880, alt: 12000, heading: 300, pitch: -34, roll: 0, duration: 6, hold: 2 },
      { lat: 32.3526, lon: -84.9691, alt: 2600, heading: 20, pitch: -20, roll: 0, duration: 5, hold: 2 },
      // Fort Bragg, Fayetteville NC — 82nd Airborne, 3rd BCT, 1-505 PIR.
      { lat: 35.1410, lon: -79.0060, alt: 30000, heading: 340, pitch: -44, roll: 0, duration: 6, hold: 2 },
      // Sicily and Normandy drop zones, west of main post.
      { lat: 35.1700, lon: -79.1000, alt: 9000, heading: 280, pitch: -28, roll: 0, duration: 5, hold: 2 },
      { lat: 34.5, lon: -87.0, alt: 2400000, heading: 20, pitch: -66, roll: 0, duration: 5, hold: 0 },
    ],
  },

  {
    id: 'world-service',
    title: 'World Service — Spin the Dial',
    durationSec: 42,
    style: 'noir',
    ui: { hidePanels: false, hudMode: 'full', safeFrame: '16:9' },
    // Radio and nothing else. The point of this one is audio, so every other
    // layer is off — both for frame rate and so the globe stays legible while
    // the tuner is doing the talking.
    layers: {
      radio: true,
      flights: false,
      military: false,
      satellites: false,
      earthquakes: false,
      traffic: false,
      cctv: false,
      bikeshare: false,
      'ais-live-vessels': false,
      'rocket-launches': false,
      'military-installations': false,
      'local-firms': false,
      'local-dams': false,
      'local-datacenters': false,
    },
    post: { bloom: 48, sharpen: true, detectionMode: 'OFF' },
    // Five broadcasters that sound nothing like each other, chosen where the
    // photorealistic tiles are also strong — the tour has to be worth watching
    // while you listen. Roughly west-to-east so the daylight terminator moves
    // consistently across the run.
    cameraPath: [
      // New Orleans, French Quarter. Jazz and blues where they were invented,
      // and a street grid that reads instantly from the air.
      { lat: 29.9580, lon: -90.0650, alt: 2200, heading: 35, pitch: -30, roll: 0, duration: 6, hold: 2 },
      // Mexico City, Centro Histórico. One of the densest radio markets on
      // earth, over the Zócalo.
      { lat: 19.4326, lon: -99.1332, alt: 3400, heading: 10, pitch: -34, roll: 0, duration: 6, hold: 2 },
      // Rio de Janeiro. Samba, and the most dramatic terrain of the five —
      // framed from over the bay toward Sugarloaf and Copacabana.
      { lat: -22.9490, lon: -43.1560, alt: 4200, heading: 250, pitch: -26, roll: 0, duration: 6, hold: 2 },
      // Istanbul, over the Bosphorus. Europe on one bank, Asia on the other,
      // and a broadcast mix that sounds like neither of the stops before it.
      { lat: 41.0220, lon: 29.0080, alt: 5200, heading: 200, pitch: -30, roll: 0, duration: 6, hold: 2 },
      // Tokyo, Shibuya. City pop, and the densest 3D in the app.
      { lat: 35.6595, lon: 139.7005, alt: 1400, heading: 20, pitch: -24, roll: 0, duration: 6, hold: 2 },
      // Pull out over the Pacific to close on the whole dial at once.
      { lat: 20.0, lon: 170.0, alt: 16000000, heading: 0, pitch: -76, roll: 0, duration: 6, hold: 0 },
    ],
  },

  {
    id: 'california-eyes',
    title: 'California Eyes — Bay Area and LA Cameras',
    durationSec: 36,
    style: 'retro',
    ui: { hidePanels: false, hudMode: 'full', safeFrame: '16:9' },
    // Caltrans districts 4 (Bay Area) and 7 (LA) are both in the default
    // district set, so these cameras are present without extra config.
    // NOTE: Caltrans publishes stills, not video — only London serves clips.
    layers: {
      cctv: true,
      traffic: true,
      flights: false,
      military: false,
      satellites: false,
      earthquakes: false,
      radio: false,
      bikeshare: false,
      'ais-live-vessels': false,
      'rocket-launches': false,
      'military-installations': false,
      'local-firms': false,
      'local-dams': false,
      'local-datacenters': false,
    },
    post: { bloom: 48, sharpen: true, detectionMode: 'SPARSE' },
    cameraPath: [
      // Bay Bridge western approach into downtown SF — the densest camera
      // cluster in District 4 and strong photorealistic coverage.
      { lat: 37.7920, lon: -122.3950, alt: 3200, heading: 250, pitch: -28, roll: 0, duration: 6, hold: 2 },
      // Financial District at building height.
      { lat: 37.7930, lon: -122.4010, alt: 900, heading: 40, pitch: -20, roll: 0, duration: 6, hold: 2 },
      // The 101/280 split south of downtown — freeway cameras, heavy flow.
      { lat: 37.7500, lon: -122.4050, alt: 5200, heading: 180, pitch: -34, roll: 0, duration: 5, hold: 2 },
      // Down the state to LA.
      { lat: 35.50, lon: -120.00, alt: 900000, heading: 150, pitch: -58, roll: 0, duration: 5, hold: 1 },
      // Downtown LA and the four-level interchange — District 7's core.
      { lat: 34.0522, lon: -118.2437, alt: 3000, heading: 25, pitch: -26, roll: 0, duration: 6, hold: 2 },
      { lat: 34.0700, lon: -118.2350, alt: 1600, heading: 200, pitch: -22, roll: 0, duration: 6, hold: 2 },
    ],
  },
  {
    id: 'london-river-watch',
    title: 'London River Watch — Thames Crossings',
    durationSec: 45,
    style: 'surveillance',
    // Second London camera tour, deliberately disjoint from `london-eyes`:
    // that one works the West End, this one runs the river east. TfL is the
    // only network in the app that serves motion video, so both London tours
    // are the ones where clicking a camera gives a moving picture.
    layers: {
      cctv: true,
      traffic: true,
      flights: false,
      military: false,
      satellites: false,
      earthquakes: false,
      radio: false,
      bikeshare: false,
      'ais-live-vessels': false,
      'rocket-launches': false,
      'military-installations': false,
      'local-firms': false,
      'local-dams': false,
      'local-datacenters': false,
    },
    post: { bloom: 44, sharpen: true, detectionMode: 'SPARSE' },
    cameraPath: [
      // Establishing shot looking back up the river from the east.
      { lat: 51.500, lon: -0.055, alt: 20000, heading: 265, pitch: -50, roll: 0, duration: 5, hold: 1 },
      // Vauxhall Cross — the SIS building sits right on the camera cluster.
      { lat: 51.4875, lon: -0.1247, alt: 700, heading: 40, pitch: -20, roll: 0, duration: 5, hold: 2 },
      // Blackfriars and the Embankment, looking downstream.
      { lat: 51.5095, lon: -0.1030, alt: 900, heading: 95, pitch: -22, roll: 0, duration: 5, hold: 2 },
      // Tower Bridge from downstream — the frame everyone recognises.
      { lat: 51.5033, lon: -0.0740, alt: 750, heading: 285, pitch: -18, roll: 0, duration: 5, hold: 2 },
      // Canary Wharf. Dense towers, dense JamCams on the approach roads.
      { lat: 51.5054, lon: -0.0235, alt: 1100, heading: 200, pitch: -24, roll: 0, duration: 5, hold: 2 },
      // Blackwall Tunnel approach and the O2 — the busiest crossing east.
      { lat: 51.5030, lon: 0.0032, alt: 1400, heading: 340, pitch: -28, roll: 0, duration: 5, hold: 1 },
      { lat: 51.4830, lon: -0.0050, alt: 12000, heading: 300, pitch: -45, roll: 0, duration: 5, hold: 0 },
    ],
  },
  {
    id: 'london-landmarks',
    title: 'London Landmarks — The Skyline in 3D',
    durationSec: 48,
    style: 'noir',
    // A sightseeing tour, not a sensor tour: the subject is Google's
    // photorealistic mesh, so everything that costs frames stays off. CCTV is
    // the one layer left on because the JamCams sit on these same streets and
    // give the shot something live to click.
    layers: {
      cctv: true,
      traffic: false,
      flights: false,
      military: false,
      satellites: false,
      earthquakes: false,
      radio: false,
      bikeshare: false,
      'ais-live-vessels': false,
      'rocket-launches': false,
      'military-installations': false,
      'local-firms': false,
      'local-dams': false,
      'local-datacenters': false,
    },
    post: { bloom: 40, sharpen: true, detectionMode: 'SPARSE' },
    cameraPath: [
      { lat: 51.5050, lon: -0.1100, alt: 16000, heading: 30, pitch: -48, roll: 0, duration: 5, hold: 1 },
      // Palace of Westminster and the Elizabeth Tower.
      { lat: 51.5007, lon: -0.1246, alt: 550, heading: 340, pitch: -16, roll: 0, duration: 4, hold: 2 },
      // The London Eye, across the river from the last shot.
      { lat: 51.5033, lon: -0.1196, alt: 500, heading: 250, pitch: -14, roll: 0, duration: 4, hold: 2 },
      // Buckingham Palace, looking back down the Mall.
      { lat: 51.5014, lon: -0.1419, alt: 700, heading: 95, pitch: -22, roll: 0, duration: 4, hold: 2 },
      // St Paul's — the dome reads well from the south-west.
      { lat: 51.5138, lon: -0.0984, alt: 600, heading: 200, pitch: -18, roll: 0, duration: 4, hold: 2 },
      // The Shard, tallest thing in the mesh for miles.
      { lat: 51.5045, lon: -0.0865, alt: 700, heading: 300, pitch: -12, roll: 0, duration: 4, hold: 2 },
      // Tower Bridge and the Tower of London together.
      { lat: 51.5081, lon: -0.0759, alt: 650, heading: 160, pitch: -18, roll: 0, duration: 5, hold: 2 },
      { lat: 51.5070, lon: -0.1000, alt: 14000, heading: 20, pitch: -46, roll: 0, duration: 5, hold: 0 },
    ],
  },
  {
    id: 'california-landmarks',
    title: 'California Landmarks — Golden Gate to the Hollywood Hills',
    durationSec: 50,
    style: 'retro',
    // Earthquakes is the one layer on: the route runs the length of the San
    // Andreas system, so the markers are actually about what is underneath
    // the shot rather than decoration. Everything else is off for frames.
    layers: {
      earthquakes: true,
      cctv: false,
      traffic: false,
      flights: false,
      military: false,
      satellites: false,
      radio: false,
      bikeshare: false,
      'ais-live-vessels': false,
      'rocket-launches': false,
      'military-installations': false,
      'local-firms': false,
      'local-dams': false,
      'local-datacenters': false,
    },
    post: { bloom: 46, sharpen: true, detectionMode: 'SPARSE' },
    cameraPath: [
      { lat: 37.800, lon: -122.520, alt: 30000, heading: 90, pitch: -50, roll: 0, duration: 5, hold: 1 },
      // Golden Gate Bridge from the Marin side, shooting back into the city.
      { lat: 37.8199, lon: -122.4830, alt: 700, heading: 110, pitch: -14, roll: 0, duration: 5, hold: 2 },
      // Transamerica Pyramid and the Financial District.
      { lat: 37.7952, lon: -122.4028, alt: 800, heading: 220, pitch: -18, roll: 0, duration: 5, hold: 2 },
      // Down the coast. High enough that the thin rural mesh never shows.
      { lat: 35.60, lon: -121.20, alt: 800000, heading: 150, pitch: -60, roll: 0, duration: 4, hold: 1 },
      // Santa Monica Pier.
      { lat: 34.0089, lon: -118.4973, alt: 600, heading: 60, pitch: -20, roll: 0, duration: 5, hold: 2 },
      // The Hollywood Sign on Mount Lee.
      { lat: 34.1341, lon: -118.3215, alt: 900, heading: 200, pitch: -16, roll: 0, duration: 5, hold: 2 },
      // Griffith Observatory, with the basin behind it.
      { lat: 34.1184, lon: -118.3004, alt: 700, heading: 240, pitch: -18, roll: 0, duration: 4, hold: 2 },
      // Downtown LA to close.
      { lat: 34.0522, lon: -118.2437, alt: 1200, heading: 300, pitch: -20, roll: 0, duration: 5, hold: 0 },
    ],
  },
  {
    id: 'ohio-landmarks',
    title: 'Ohio Landmarks — Canton, Cleveland, Columbus, Cincinnati',
    durationSec: 52,
    style: 'anime',
    // Brighter palette than the other landmark tours on purpose — this is the
    // hometown leg, not a sensor sweep.
    //
    // COVERAGE CAVEAT: Google's photorealistic mesh is city-shaped. Cleveland,
    // Columbus and Cincinnati are dense; East Canton is a village and will
    // render as coarse aerial mesh rather than modelled buildings, so that
    // shot deliberately sits higher and wider than the downtown ones.
    layers: {
      traffic: true,
      cctv: false,
      flights: false,
      military: false,
      satellites: false,
      earthquakes: false,
      radio: false,
      bikeshare: false,
      'ais-live-vessels': false,
      'rocket-launches': false,
      'military-installations': false,
      'local-firms': false,
      'local-dams': false,
      'local-datacenters': false,
    },
    post: { bloom: 42, sharpen: true, detectionMode: 'SPARSE' },
    cameraPath: [
      { lat: 40.30, lon: -82.80, alt: 400000, heading: 0, pitch: -60, roll: 0, duration: 5, hold: 1 },
      // East Canton. Wide and high — see the coverage caveat above.
      { lat: 40.7898, lon: -81.2843, alt: 2400, heading: 300, pitch: -34, roll: 0, duration: 5, hold: 2 },
      // Pro Football Hall of Fame and Tom Benson Stadium, Canton.
      { lat: 40.8206, lon: -81.4020, alt: 900, heading: 180, pitch: -24, roll: 0, duration: 5, hold: 2 },
      // Cleveland lakefront — Rock & Roll Hall of Fame, Science Center, stadium.
      { lat: 41.5086, lon: -81.6954, alt: 700, heading: 200, pitch: -18, roll: 0, duration: 5, hold: 2 },
      // Terminal Tower and downtown Cleveland.
      { lat: 41.4977, lon: -81.6937, alt: 900, heading: 340, pitch: -16, roll: 0, duration: 5, hold: 2 },
      // Ohio Statehouse and the Columbus core.
      { lat: 39.9612, lon: -82.9988, alt: 800, heading: 40, pitch: -20, roll: 0, duration: 5, hold: 2 },
      // Cincinnati riverfront — Roebling Suspension Bridge and the ballparks.
      { lat: 39.0928, lon: -84.5100, alt: 700, heading: 20, pitch: -18, roll: 0, duration: 5, hold: 2 },
      { lat: 39.60, lon: -83.60, alt: 350000, heading: 20, pitch: -58, roll: 0, duration: 5, hold: 0 },
    ],
  },
  {
    id: 'new-york-landmarks',
    title: 'New York Landmarks — Liberty to Midtown',
    durationSec: 52,
    style: 'noir',
    // AIS stays on because the harbour half of this route is genuinely busy —
    // the Staten Island ferry and the Liberty boats cross the frame live
    // behind the statue. Everything else off; Manhattan's mesh is expensive.
    layers: {
      'ais-live-vessels': true,
      cctv: false,
      traffic: false,
      flights: false,
      military: false,
      satellites: false,
      earthquakes: false,
      radio: false,
      bikeshare: false,
      'rocket-launches': false,
      'military-installations': false,
      'local-firms': false,
      'local-dams': false,
      'local-datacenters': false,
    },
    post: { bloom: 50, sharpen: true, detectionMode: 'SPARSE' },
    cameraPath: [
      { lat: 40.680, lon: -74.055, alt: 22000, heading: 30, pitch: -52, roll: 0, duration: 5, hold: 1 },
      // Statue of Liberty, low and close.
      { lat: 40.6892, lon: -74.0480, alt: 400, heading: 80, pitch: -12, roll: 0, duration: 5, hold: 2 },
      // Ellis Island, with Lower Manhattan filling the background.
      { lat: 40.6995, lon: -74.0420, alt: 900, heading: 55, pitch: -20, roll: 0, duration: 4, hold: 2 },
      // One World Trade Center.
      { lat: 40.7127, lon: -74.0160, alt: 900, heading: 60, pitch: -12, roll: 0, duration: 5, hold: 2 },
      // Brooklyn Bridge across the East River.
      { lat: 40.7061, lon: -73.9950, alt: 600, heading: 300, pitch: -18, roll: 0, duration: 5, hold: 2 },
      // Empire State Building.
      { lat: 40.7484, lon: -73.9880, alt: 900, heading: 80, pitch: -10, roll: 0, duration: 5, hold: 2 },
      // Central Park's south edge, looking up the park.
      { lat: 40.7660, lon: -73.9770, alt: 1400, heading: 350, pitch: -26, roll: 0, duration: 5, hold: 2 },
      { lat: 40.7500, lon: -73.9800, alt: 18000, heading: 200, pitch: -50, roll: 0, duration: 5, hold: 0 },
    ],
  },
];

export function getSceneRecipeById(id) {
  return SCENE_RECIPES.find((recipe) => recipe.id === id) || null;
}
