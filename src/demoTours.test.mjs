/**
 * The demo tours are run in front of people, so the failure that matters is a
 * silent one: a mistyped layer id is dropped by sceneLayerPlan without error,
 * and the tour just quietly leaves that layer however it found it.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCENE_RECIPES, getSceneRecipeById } from './scenes/recipes.js';

const TOUR_IDS = [
  'fireline-cascadia', 'orbital-ascent', 'london-eyes',
  'harbor-watch', 'approach-and-intercept', 'airborne-all-the-way',
  'world-service', 'california-eyes',
];

/** Every layer id main.js registers. A tour may only name one of these. */
const REGISTERED_LAYER_IDS = new Set([
  'flights', 'military', 'earthquakes', 'satellites', 'rocket-launches',
  'traffic', 'cctv', 'radio', 'bikeshare', 'ais-live-vessels',
  'military-installations', 'local-firms', 'local-dams', 'local-datacenters',
]);

const VALID_STYLES = new Set(['retro', 'surveillance', 'thermal', 'anime', 'noir', 'snow']);

test('every demo tour resolves by id', () => {
  for (const id of TOUR_IDS) {
    assert.ok(getSceneRecipeById(id), `${id} must be reachable via getSceneRecipeById`);
  }
});

test('no tour names a layer the data manager does not register', () => {
  // sceneLayerPlan silently skips unknown ids, so a typo here is invisible at
  // runtime — the layer simply never gets set.
  for (const id of TOUR_IDS) {
    for (const layerId of Object.keys(getSceneRecipeById(id).layers)) {
      assert.ok(
        REGISTERED_LAYER_IDS.has(layerId),
        `${id} names unregistered layer "${layerId}" — it would be dropped without error`,
      );
    }
  }
});

test('every tour declares every layer, on or off', () => {
  // An undeclared layer keeps whatever state it had, so a tour that omits one
  // inherits the previous tour's cost. These run back to back on one machine.
  for (const id of TOUR_IDS) {
    const declared = new Set(Object.keys(getSceneRecipeById(id).layers));
    for (const layerId of REGISTERED_LAYER_IDS) {
      assert.ok(declared.has(layerId), `${id} leaves "${layerId}" undeclared`);
    }
  }
});

test('each tour turns at least one layer on and most of them off', () => {
  for (const id of TOUR_IDS) {
    const values = Object.values(getSceneRecipeById(id).layers);
    const on = values.filter(Boolean).length;
    assert.ok(on >= 1, `${id} enables nothing`);
    assert.ok(on <= 4, `${id} enables ${on} layers — too many to stay smooth`);
  }
});

test('camera paths are well formed and on the planet', () => {
  for (const id of TOUR_IDS) {
    const recipe = getSceneRecipeById(id);
    assert.ok(recipe.cameraPath.length >= 4, `${id} needs enough shots to read as a tour`);
    assert.ok(VALID_STYLES.has(recipe.style), `${id} uses unknown style "${recipe.style}"`);
    for (const [i, shot] of recipe.cameraPath.entries()) {
      assert.ok(shot.lat >= -90 && shot.lat <= 90, `${id} shot ${i}: lat out of range`);
      assert.ok(shot.lon >= -180 && shot.lon <= 180, `${id} shot ${i}: lon out of range`);
      assert.ok(shot.alt > 0, `${id} shot ${i}: altitude must be positive`);
      assert.ok(shot.pitch <= 0, `${id} shot ${i}: positive pitch points at the sky`);
      assert.ok(shot.duration > 0, `${id} shot ${i}: needs a duration`);
    }
  }
});

test('recipe ids stay unique across the whole set', () => {
  const ids = SCENE_RECIPES.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate recipe id — getSceneRecipeById returns the first');
});

test('the fire tour points at the Pacific Northwest', () => {
  // Sourced from a live FIRMS query, not guessed. Fires move, but the region
  // is the claim; a shot that drifts off it means the tour was edited blind.
  const shots = getSceneRecipeById('fireline-cascadia').cameraPath;
  for (const shot of shots) {
    assert.ok(shot.lat > 43 && shot.lat < 51, `fire shot at lat ${shot.lat} left the region`);
    assert.ok(shot.lon > -125 && shot.lon < -113, `fire shot at lon ${shot.lon} left the region`);
  }
});
