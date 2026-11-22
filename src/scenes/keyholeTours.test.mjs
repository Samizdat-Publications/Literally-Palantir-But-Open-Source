/**
 * KEYHOLE's demo tours are run in front of people, so the failure that matters
 * is a silent one: a mistyped or retired layer id is dropped by sceneLayerPlan
 * without error, and the tour just quietly leaves that layer however it found
 * it.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KEYHOLE_TOUR_RECIPES } from './keyholeTours.js';
import { SCENE_RECIPES } from './recipes.js';
import { LAYER_STATE_REGISTRY } from '../data/layerState.js';

const TOUR_IDS = [
  'fireline-cascadia',
  'orbital-ascent',
  'london-eyes',
  'harbor-watch',
  'approach-and-intercept',
  'airborne-all-the-way',
  'world-service',
  'california-eyes',
  'london-river-watch',
  'london-landmarks',
  'california-landmarks',
  'ohio-landmarks',
  'new-york-landmarks',
];

/**
 * Sightseeing tours, as opposed to sensor tours. Their whole subject is the
 * photorealistic mesh, so an extra live layer costs frames for nothing.
 */
const LANDMARK_TOUR_IDS = [
  'london-landmarks',
  'california-landmarks',
  'ohio-landmarks',
  'new-york-landmarks',
];

/**
 * The fourteen layers that existed when the tours were written. Every tour
 * declares all of them, on or off. Layers upstream added later are left
 * undeclared, as upstream's own recipes leave them.
 */
const TOUR_BASELINE_LAYER_IDS = [
  'flights',
  'military',
  'earthquakes',
  'satellites',
  'rocket-launches',
  'traffic',
  'cctv',
  'radio',
  'bikeshare',
  'ais-live-vessels',
  'military-installations',
  'local-firms',
  'local-dams',
  'local-datacenters',
];

const REGISTERED_LAYER_IDS = new Set(
  LAYER_STATE_REGISTRY.map((entry) => entry.id),
);

const VALID_STYLES = new Set([
  'retro',
  'surveillance',
  'thermal',
  'anime',
  'noir',
  'snow',
]);

const byId = (id) => SCENE_RECIPES.find((recipe) => recipe.id === id);

test('every KEYHOLE tour is in the built-in scene list', () => {
  assert.deepEqual(
    KEYHOLE_TOUR_RECIPES.map((r) => r.id),
    TOUR_IDS,
  );
  for (const id of TOUR_IDS) {
    assert.ok(byId(id), `${id} must be part of SCENE_RECIPES`);
  }
});

test('no tour names a layer the layer registry does not know', () => {
  // sceneLayerPlan silently skips unknown ids, so a typo or an upstream layer
  // rename is invisible at runtime: the layer simply never gets set.
  for (const id of TOUR_IDS) {
    for (const layerId of Object.keys(byId(id).layers)) {
      assert.ok(
        REGISTERED_LAYER_IDS.has(layerId),
        `${id} names unregistered layer "${layerId}"; it would be dropped without error`,
      );
    }
  }
});

test('every tour declares every baseline layer, on or off', () => {
  // An undeclared layer keeps whatever state it had, so a tour that omits one
  // inherits the previous tour's cost. These run back to back on one machine.
  for (const id of TOUR_IDS) {
    const declared = new Set(Object.keys(byId(id).layers));
    for (const layerId of TOUR_BASELINE_LAYER_IDS) {
      assert.ok(declared.has(layerId), `${id} leaves "${layerId}" undeclared`);
    }
  }
});

test('each tour turns at least one layer on and most of them off', () => {
  for (const id of TOUR_IDS) {
    const on = Object.values(byId(id).layers).filter(Boolean).length;
    assert.ok(on >= 1, `${id} enables nothing`);
    assert.ok(on <= 4, `${id} enables ${on} layers, too many to stay smooth`);
  }
});

test('camera paths are well formed and on the planet', () => {
  for (const id of TOUR_IDS) {
    const recipe = byId(id);
    assert.ok(
      recipe.cameraPath.length >= 4,
      `${id} needs enough shots to read as a tour`,
    );
    assert.ok(
      VALID_STYLES.has(recipe.style),
      `${id} uses unknown style "${recipe.style}"`,
    );
    for (const [i, shot] of recipe.cameraPath.entries()) {
      assert.ok(shot.lat >= -90 && shot.lat <= 90, `${id} shot ${i}: lat`);
      assert.ok(shot.lon >= -180 && shot.lon <= 180, `${id} shot ${i}: lon`);
      assert.ok(shot.alt > 0, `${id} shot ${i}: altitude must be positive`);
      assert.ok(shot.pitch <= 0, `${id} shot ${i}: positive pitch is sky`);
      assert.ok(shot.duration > 0, `${id} shot ${i}: needs a duration`);
    }
  }
});

test('recipe ids stay unique across upstream and KEYHOLE recipes', () => {
  const ids = SCENE_RECIPES.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate recipe id');
});

test('tour titles carry no em dash', () => {
  // House style for reader-facing text in this fork.
  for (const id of TOUR_IDS) {
    assert.ok(!byId(id).title.includes('—'), `${id} title has an em dash`);
  }
});

test('the fire tour points at the Pacific Northwest', () => {
  for (const shot of byId('fireline-cascadia').cameraPath) {
    assert.ok(shot.lat > 43 && shot.lat < 51, `fire shot lat ${shot.lat}`);
    assert.ok(shot.lon > -125 && shot.lon < -113, `fire shot lon ${shot.lon}`);
  }
});

test('landmark tours keep exactly one live layer on', () => {
  for (const id of LANDMARK_TOUR_IDS) {
    const on = Object.values(byId(id).layers).filter(Boolean).length;
    assert.equal(on, 1, `${id} enables ${on} layers; landmark tours get one`);
  }
});

test('landmark tours stay over the region they are named for', () => {
  const REGIONS = {
    'london-landmarks': { lat: [51.3, 51.7], lon: [-0.6, 0.3] },
    'london-river-watch': { lat: [51.3, 51.7], lon: [-0.6, 0.3] },
    'california-landmarks': { lat: [32.4, 42.1], lon: [-124.5, -114.0] },
    'ohio-landmarks': { lat: [38.3, 42.4], lon: [-85.0, -80.4] },
    'new-york-landmarks': { lat: [40.4, 41.0], lon: [-74.3, -73.6] },
  };
  for (const [id, box] of Object.entries(REGIONS)) {
    for (const [i, shot] of byId(id).cameraPath.entries()) {
      assert.ok(
        shot.lat >= box.lat[0] && shot.lat <= box.lat[1],
        `${id} shot ${i}: lat ${shot.lat} left the region`,
      );
      assert.ok(
        shot.lon >= box.lon[0] && shot.lon <= box.lon[1],
        `${id} shot ${i}: lon ${shot.lon} left the region`,
      );
    }
  }
});
