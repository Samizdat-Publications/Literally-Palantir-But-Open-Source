/**
 * Destination buckets: the fields a fly-to actually depends on.
 *
 * These entries are DATA, and the failure mode is silent — a POI with a typo'd
 * longitude or a missing `groundElevation` still renders a pill, still flies,
 * and just puts the camera somewhere wrong. Nothing else in the suite would
 * notice, because the app has no way to know what the view was supposed to show.
 *
 * The global Wonders and Nature buckets carry the extra risk: they span sea
 * level to alpine summits, so the per-POI ground elevation is load-bearing
 * rather than cosmetic.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CITY_POIS, LOCATIONS } from './locations.js';

/** Buckets with no `viewBounds` — global sets, where an overview is meaningless. */
const GLOBAL_BUCKETS = ['wonders', 'nature', 'bases'];

/** How many POIs can keep a keyboard shortcut. Mirrors POI_HOTKEYS in ui.js. */
const HOTKEY_COUNT = 8;

test('every POI carries the fields flyToLandmark reads', () => {
  for (const [bucketId, bucket] of Object.entries(CITY_POIS)) {
    assert.ok(bucket.name, `${bucketId} needs a display name`);
    assert.ok(Array.isArray(bucket.pois) && bucket.pois.length > 0, `${bucketId} needs POIs`);
    for (const poi of bucket.pois) {
      const where = `${bucketId}/${poi.name}`;
      assert.ok(poi.name, `${where} needs a name`);
      assert.ok(Number.isFinite(poi.lat) && poi.lat >= -90 && poi.lat <= 90, `${where} lat off-planet`);
      assert.ok(Number.isFinite(poi.lon) && poi.lon >= -180 && poi.lon <= 180, `${where} lon off-planet`);
      // `alt` is a RANGE from the target, not an altitude — a zero would put the
      // camera inside the subject.
      assert.ok(Number.isFinite(poi.alt) && poi.alt > 0, `${where} needs a positive range`);
      assert.ok(poi.pitch < 0 && poi.pitch >= -90, `${where} pitch must look down`);
      assert.ok(poi.heading >= 0 && poi.heading <= 360, `${where} heading out of range`);
    }
  }
});

test('POI names are unique inside a bucket, so a pill is unambiguous', () => {
  for (const [bucketId, bucket] of Object.entries(CITY_POIS)) {
    const names = bucket.pois.map((p) => p.name);
    assert.equal(new Set(names).size, names.length, `${bucketId} has a duplicate POI name`);
  }
});

test('no bucket outgrows the hotkey row', () => {
  // Past this a POI still renders, but with a numeric badge and no shortcut.
  for (const [bucketId, bucket] of Object.entries(CITY_POIS)) {
    assert.ok(bucket.pois.length <= HOTKEY_COUNT,
      `${bucketId} has ${bucket.pois.length} POIs; only ${HOTKEY_COUNT} get hotkeys`);
  }
});

test('ui.js binds exactly the hotkeys this file assumes', () => {
  // The count lives in two files and nothing links them at runtime.
  const uiSource = fs.readFileSync(new URL('./ui.js', import.meta.url), 'utf8');
  const match = uiSource.match(/const POI_HOTKEYS = Object\.freeze\(\[([^\]]*)\]\)/);
  assert.ok(match, 'POI_HOTKEYS must exist in ui.js');
  const keys = [...match[1].matchAll(/'([A-Z])'/g)].map((m) => m[1]);
  assert.equal(keys.length, HOTKEY_COUNT);
  assert.equal(new Set(keys).size, keys.length, 'a hotkey is bound twice');
  // `c` is the cockpit shortcut — the only other single-key binding in the app.
  assert.equal(keys.includes('C'), false, 'C collides with the cockpit shortcut');
});

test('global buckets set ground elevation per POI, not per bucket', () => {
  // With Google 3D Tiles the globe has no terrain, so `globe.getHeight` returns
  // null and this fallback is what EVERY first fly-to uses. One bucket-wide
  // number cannot serve both a sea-level cataract and a 3,000 m summit.
  for (const bucketId of GLOBAL_BUCKETS) {
    const bucket = CITY_POIS[bucketId];
    assert.ok(bucket, `${bucketId} must exist`);
    assert.equal(bucket.viewBounds, undefined,
      `${bucketId} spans the planet, so an overview bounds box is meaningless`);
    for (const poi of bucket.pois) {
      assert.ok(Number.isFinite(poi.groundElevation),
        `${bucketId}/${poi.name} needs its own groundElevation`);
      assert.ok(poi.groundElevation >= 0 && poi.groundElevation < 9000,
        `${bucketId}/${poi.name} groundElevation is not a real terrain height`);
    }
  }
});

test('the verified destinations are present with their tuned framing', () => {
  // Each of these was confirmed by flying to it and looking at the result, and
  // the framings are the tuned values, not the first guesses. Re-tuning is fine
  // — updating this list alongside is the point, so a silent revert cannot pass.
  const expected = {
    wonders: ['Colosseum', 'Chichén Itzá', 'Great Pyramid of Giza', 'Taj Mahal', 'Christ the Redeemer'],
    nature: ['Grand Canyon', 'Niagara Falls', 'Matterhorn', 'Uluru',
      'Grand Prismatic Spring', 'Iguazú Falls', 'Yosemite Valley'],
    bases: ['Fort Bragg — Pope Field', 'Fort Bragg — Main Post',
      'Fort Benning — Airborne School', 'Fort Benning — Main Post',
      'Fort Sill — Old Post', 'Fort Sill — Main Post'],
  };
  for (const [bucketId, names] of Object.entries(expected)) {
    assert.deepEqual(CITY_POIS[bucketId].pois.map((p) => p.name), names,
      `${bucketId} destinations changed`);
  }

  const redeemer = CITY_POIS.wonders.pois.find((p) => p.name === 'Christ the Redeemer');
  // At range 700 the flight settled on Sugarloaf and the geocoder read back
  // "Heliponto Morro Urca" — the right vista, the wrong subject.
  assert.ok(redeemer.alt <= 500, 'Corcovado needs a tight range or it frames Sugarloaf instead');
});

test('every bucket reaches LOCATIONS, which drives the pill row', () => {
  assert.equal(LOCATIONS.length, Object.keys(CITY_POIS).length);
  for (const entry of LOCATIONS) {
    const bucket = CITY_POIS[entry.id];
    assert.ok(bucket, `${entry.id} must resolve back to a bucket`);
    assert.equal(entry.lat, bucket.pois[0].lat, `${entry.id} must anchor on its first POI`);
    assert.equal(entry.lon, bucket.pois[0].lon);
  }
});


test('base coordinates are in the right state, not a same-named town', () => {
  // "Sicily Drop Zone, Fort Bragg" geocodes to Fort Bragg, CALIFORNIA. A base
  // POI that silently lands 3,500 km away still renders terrain and still looks
  // plausible, so pin each to a bounding box around its actual post.
  const boxes = {
    'Fort Bragg': { lat: [35.0, 35.3], lon: [-79.3, -78.8] },      // North Carolina
    'Fort Benning': { lat: [32.2, 32.5], lon: [-85.1, -84.8] },    // Georgia
    'Fort Sill': { lat: [34.5, 34.8], lon: [-98.6, -98.3] },       // Oklahoma
  };
  for (const poi of CITY_POIS.bases.pois) {
    const post = Object.keys(boxes).find((name) => poi.name.startsWith(name));
    assert.ok(post, `${poi.name} does not name a known post`);
    const box = boxes[post];
    assert.ok(poi.lat >= box.lat[0] && poi.lat <= box.lat[1], `${poi.name} latitude is outside ${post}`);
    assert.ok(poi.lon >= box.lon[0] && poi.lon <= box.lon[1], `${poi.name} longitude is outside ${post}`);
  }
});
