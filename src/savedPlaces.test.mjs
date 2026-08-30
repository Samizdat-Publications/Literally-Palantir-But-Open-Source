/**
 * Saved places: the store's fail-closed rules, and the restore re-entrancy that
 * the feature actually turns on.
 *
 * The restore tests are the point. Everything else here is a bounded pure
 * function; `restoreViewState` is the part that reaches into machinery written
 * on the assumption that a restore happens exactly once, before the user has
 * touched anything.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ShareLinkManager } from './sharelink.js';
import {
  MAX_NAME_LENGTH,
  MAX_PLACES,
  SAVED_PLACES_STORAGE_KEY,
  SAVED_PLACES_VERSION,
  addPlace,
  applyScopeToHash,
  emptyDocument,
  exportDocument,
  findPlace,
  importDocument,
  isStorableHash,
  parseDocument,
  readStore,
  removePlace,
  renamePlace,
  seedStoreIfAbsent,
  serializeDocument,
  slugify,
  syncSeed,
  writeStore,
} from './savedPlaces.js';
import {
  SAVED_PLACES_SEED,
  SAVED_PLACES_SEED_VERSION,
  SF_WORKING_SET_LAYERS,
} from './data/savedPlacesSeed.js';
import { REGISTERED_LAYER_IDS } from './data/layerState.js';

const FULL_HASH = 'v=2&lat=37.7738&lon=-122.4232&alt=100&heading=180&pitch=-22&roll=360'
  + '&style=crt&bloom=0&sharpen=1&bi=0&bv=2&si=49&hud=tactical&hv=1'
  + '&dm=DENSE&dd=75&da=elastic&kf=7&ko=1&cr=0&sc=1&scf=11&map=photoreal'
  + '&l=a.c.e.q.d.w.i.r.u.t&lo=f.e.1&ui=c.c.1_l.c.1&sp=p.100_d.0_i.42';

/** A localStorage stand-in. `throwOn` models a private window, which raises on ACCESS. */
function fakeStorage({ throwOn = null, seed = null } = {}) {
  const map = new Map(seed ? Object.entries(seed) : []);
  return {
    getItem(k) {
      if (throwOn === 'get' || throwOn === 'both') throw new Error('blocked');
      return map.has(k) ? map.get(k) : null;
    },
    setItem(k, v) {
      if (throwOn === 'set' || throwOn === 'both') throw new Error('quota');
      map.set(k, String(v));
    },
    _map: map,
  };
}

function makeManager(hash = '', { onRestore } = {}) {
  globalThis.window = { location: { hash, href: `http://localhost/${hash}` } };
  globalThis.history = {
    replaceState(_s, _t, next) { globalThis.window.location.hash = next; },
  };
  const viewer = {
    camera: {
      changed: { addEventListener() { return () => {}; } },
      positionCartographic: { latitude: 0.5, longitude: -1.2, height: 1000 },
      heading: 0,
      pitch: -Math.PI / 4,
      roll: 0,
      // Settle synchronously so applyState resolves without timers.
      flyTo(opts) { opts?.complete?.(); },
      setView() {},
    },
    scene: { requestRender() {} },
  };
  return new ShareLinkManager(viewer, { onRestore });
}

// ── Store: fail-closed rules ────────────────────────────────────────────────

test('a corrupt or non-JSON blob yields an empty list rather than throwing', () => {
  for (const blob of ['not json', '{', '[]', 'null', '{"places":[]}', '']) {
    const doc = parseDocument(blob);
    assert.deepEqual(doc.places, [], `${JSON.stringify(blob)} must read as empty`);
    assert.equal(doc.v, SAVED_PLACES_VERSION);
  }
});

test('an unknown version is refused WHOLE, never partially read', () => {
  // The danger is not the read, it is the write-back: salvaging the entries we
  // recognise and saving would destroy the fields a newer version added.
  const future = JSON.stringify({
    v: SAVED_PLACES_VERSION + 1,
    places: [{ id: 'a', name: 'A', hash: FULL_HASH, savedAt: 1, scope: 'full' }],
  });
  assert.deepEqual(parseDocument(future).places, []);

  const past = JSON.stringify({ v: 0, places: [{ id: 'a', name: 'A', hash: FULL_HASH }] });
  assert.deepEqual(parseDocument(past).places, []);
});

test('reads and writes survive storage that throws on access', () => {
  assert.deepEqual(readStore(fakeStorage({ throwOn: 'get' })).places, []);
  assert.equal(writeStore(fakeStorage({ throwOn: 'set' }), emptyDocument()), false);
  assert.equal(writeStore(fakeStorage(), emptyDocument()), true);
  assert.deepEqual(readStore(undefined).places, []);
});

test('entries without a usable hash are dropped, not stored', () => {
  assert.equal(isStorableHash('v=2&lat=1&lon=2'), true);
  assert.equal(isStorableHash('#v=2&lat=1&lon=2'), true);
  assert.equal(isStorableHash('v=2&lon=2'), false);          // no lat
  assert.equal(isStorableHash('v=2&lat=abc&lon=2'), false);  // non-finite
  assert.equal(isStorableHash(''), false);
  assert.equal(isStorableHash(null), false);

  const { place, reason } = addPlace(emptyDocument(), { name: 'bad', hash: 'lat=1' });
  assert.equal(place, null);
  assert.equal(reason, 'invalid-hash');
});

test('the list cap and the name cap both hold', () => {
  let doc = emptyDocument();
  for (let i = 0; i < MAX_PLACES + 12; i += 1) {
    doc = addPlace(doc, { name: `Place ${i}`, hash: FULL_HASH }).doc;
  }
  assert.equal(doc.places.length, MAX_PLACES);
  // Newest first, so the most recent survives and the oldest fell off.
  assert.equal(doc.places[0].name, `Place ${MAX_PLACES + 11}`);

  const long = addPlace(emptyDocument(), { name: 'x'.repeat(500), hash: FULL_HASH });
  assert.equal(long.place.name.length, MAX_NAME_LENGTH);

  // A cap must survive a round trip through storage too.
  const storage = fakeStorage();
  writeStore(storage, doc);
  assert.equal(readStore(storage).places.length, MAX_PLACES);
});

test('saving over an existing name updates in place instead of duplicating', () => {
  let doc = addPlace(emptyDocument(), { name: 'Harbor', hash: FULL_HASH, note: 'first' }).doc;
  doc = addPlace(doc, { name: 'Other', hash: FULL_HASH }).doc;
  doc = addPlace(doc, { name: 'Harbor', hash: FULL_HASH, note: 'second' }).doc;
  assert.equal(doc.places.length, 2);
  assert.equal(doc.places.filter((p) => p.id === slugify('Harbor')).length, 1);
  assert.equal(findPlace(doc, slugify('Harbor')).note, 'second');
});

test('rename re-slugs, and remove is by id', () => {
  const doc = addPlace(emptyDocument(), { name: 'Old Name', hash: FULL_HASH }).doc;
  const renamed = renamePlace(doc, slugify('Old Name'), 'New Name');
  assert.equal(renamed.places[0].name, 'New Name');
  assert.equal(renamed.places[0].id, slugify('New Name'));
  assert.equal(renamePlace(doc, slugify('Old Name'), '   ').places[0].name, 'Old Name');
  assert.deepEqual(removePlace(renamed, slugify('New Name')).places, []);
});

test('round trip: capture, store, reload, decode yields the same params', () => {
  const manager = makeManager('');
  const captured = manager.captureViewState();
  assert.ok(captured, 'captureViewState must produce a hash');

  const storage = fakeStorage();
  const { doc } = addPlace(emptyDocument(), { name: 'Round trip', hash: captured });
  writeStore(storage, doc);

  const reloaded = readStore(storage);
  assert.equal(reloaded.places[0].hash, captured);

  const before = new URLSearchParams(captured);
  const after = new URLSearchParams(reloaded.places[0].hash);
  for (const [k, v] of before) assert.equal(after.get(k), v, `param ${k} must survive`);
  assert.ok(manager.parseHashState(reloaded.places[0].hash), 'stored hash must decode');
});

test('export and import round-trip, and import fails closed on a future version', () => {
  const doc = addPlace(emptyDocument(), { name: 'Exported', hash: FULL_HASH }).doc;
  const round = importDocument(exportDocument(doc));
  assert.equal(round.ok, true);
  assert.equal(round.places === undefined ? round.doc.places[0].name : null, 'Exported');

  const future = JSON.stringify({ v: 99, places: [{ name: 'x', hash: FULL_HASH }] });
  const refused = importDocument(future);
  assert.equal(refused.ok, false, 'a newer document must report failure, not import empty');
  assert.deepEqual(refused.doc.places, []);
});

// ── Scope ───────────────────────────────────────────────────────────────────

test('camera scope keeps position and basemap and drops everything else', () => {
  const camera = new URLSearchParams(applyScopeToHash(FULL_HASH, 'camera'));
  for (const key of ['v', 'lat', 'lon', 'alt', 'heading', 'pitch', 'roll', 'map']) {
    assert.ok(camera.has(key), `camera scope must keep ${key}`);
  }
  // The whole point: recalling a place must not drag ten layers, a CRT preset
  // and a panel layout back on top of what the user is doing now.
  for (const key of ['l', 'lo', 'ui', 'style', 'sp', 'dm', 'hud', 'bloom']) {
    assert.equal(camera.has(key), false, `camera scope must drop ${key}`);
  }
  // Full scope is the hash verbatim.
  assert.equal(applyScopeToHash(FULL_HASH, 'full'), FULL_HASH);
  assert.equal(applyScopeToHash(`#${FULL_HASH}`, 'full'), FULL_HASH);
});

test('camera scope suppresses the visual restore callback but still sets the basemap', async () => {
  const seen = [];
  const manager = makeManager('', { onRestore: (payload) => { seen.push(payload); } });
  await manager.restoreViewState(FULL_HASH, { scope: 'camera' });
  assert.equal(seen.length, 1);
  const payload = seen[0];
  assert.equal(payload.mapStack, 'photoreal', 'basemap still travels with a camera place');
  for (const key of ['style', 'bloom', 'hudVariant', 'detectionMode', 'styleParams']) {
    assert.equal(payload[key], undefined, `camera scope must not restore ${key}`);
  }
  assert.equal(payload.panelState, null, 'camera scope must not restore panel state');
});

test('full scope restores the visual state', async () => {
  const seen = [];
  const manager = makeManager('', { onRestore: (payload) => { seen.push(payload); } });
  await manager.restoreViewState(FULL_HASH, { scope: 'full' });
  assert.equal(seen[0].style, 'retro', 'crt decodes to the retro style');
  assert.equal(seen[0].hudVariant, 'tactical');
  assert.equal(seen[0].mapStack, 'photoreal');
});

// ── Restore re-entrancy: the regression this feature would otherwise ship ────

test('recall outranks a lane claimed before it', async () => {
  // This is the one the spec says will actually break. A user who collapsed a
  // panel or changed a style during BOOT leaves a lane claim behind. Ten
  // minutes later they explicitly recall a saved place: that is an explicit
  // request and must not be vetoed by the earlier claim.
  const seen = [];
  const manager = makeManager('#v=2&lat=1&lon=2', { onRestore: (p) => { seen.push(p); } });
  manager.parseInitialHash();          // opens a flight, so claims are recorded
  manager.claimRestoreLane('visual');
  manager.claimRestoreLane('map');
  manager.claimRestoreLane('panel', 'data-panel');
  manager.completeInitialRestore();

  await manager.restoreViewState(FULL_HASH, { scope: 'full' });

  assert.equal(seen.length, 1, 'recall must reach the restore callback');
  assert.equal(seen[0].style, 'retro', 'a prior visual claim must not veto an explicit recall');
  assert.equal(seen[0].mapStack, 'photoreal', 'a prior map claim must not veto an explicit recall');
});

test('a claim made DURING the recall still wins, because the user is acting now', async () => {
  let claimDuringFlight;
  const manager = makeManager('', {
    onRestore: (p) => { claimDuringFlight = p; },
  });
  const state = manager.parseHashState(FULL_HASH);
  state.restoreAuthority = manager._snapshotRestoreAuthority();
  manager._beginRestoreSession();
  manager.claimRestoreLane('visual');            // user acts mid-flight
  await manager.applyState(state, { applyCamera: false });
  assert.equal(claimDuringFlight.style, undefined,
    'an in-flight claim must still supersede the incoming visual state');
});

test('a stale flight settling late cannot release a newer recall\'s hash guard', async () => {
  const manager = makeManager('#v=2&lat=1&lon=2');
  const boot = manager.parseInitialHash();
  assert.ok(Number.isInteger(boot.restoreSessionId));

  const newer = manager._beginRestoreSession();       // a recall starts
  assert.notEqual(boot.restoreSessionId, newer);

  manager.completeInitialRestore(boot.restoreSessionId);   // the slow boot lands
  assert.equal(manager._initialRestorePending, true,
    'the newer flight must keep the guard');

  manager.completeInitialRestore(newer);
  assert.equal(manager._initialRestorePending, false);
});

test('recall cancels a queued hash write so it cannot overwrite the new view', () => {
  const manager = makeManager('');
  manager._scheduleUpdate();
  assert.ok(manager._debounceTimer, 'a debounced write should be pending');
  manager._beginRestoreSession();
  assert.equal(manager._debounceTimer, null, 'the queued write must be cancelled');
  clearTimeout(manager._debounceTimer);
});

test('an undecodable hash is refused and leaves the guard released', async () => {
  const manager = makeManager('');
  const result = await manager.restoreViewState('lat=nope&lon=nope');
  assert.equal(result.succeeded, false);
  assert.equal(result.reason, 'undecodable');
  assert.equal(manager._initialRestorePending, false,
    'a refused recall must not freeze the address bar');
});

// ── Seed ────────────────────────────────────────────────────────────────────

test('every seeded place parses and decodes against the real share decoder', () => {
  assert.ok(SAVED_PLACES_SEED.length > 0, 'the seed must not be empty');
  const manager = makeManager('');
  for (const entry of SAVED_PLACES_SEED) {
    assert.ok(entry.name, 'a seed entry needs a name — the hash does not carry one');
    assert.equal(isStorableHash(entry.hash), true, `${entry.name} has an unusable hash`);
    const state = manager.parseHashState(entry.hash);
    assert.ok(state, `${entry.name} must decode`);
    assert.ok(Number.isFinite(state.lat) && Number.isFinite(state.lon), `${entry.name} needs coords`);
    assert.ok(['full', 'camera'].includes(entry.scope), `${entry.name} has an unknown scope`);
  }
});

test('the SF seed enables exactly its working set and turns everything else off', () => {
  // The `l=` token is opaque (`b.c.i.r.t`) and trivial to get wrong by hand, so
  // this asserts against the named list rather than the encoding. It also pins
  // the OFF half: the view as originally captured had ten layers on, including
  // ~7,700 entities of static reference geometry that show nothing at 100 m.
  const manager = makeManager('');
  const sf = SAVED_PLACES_SEED.find((entry) => /SF Market Street/.test(entry.name));
  assert.ok(sf, 'the SF seed must exist');
  assert.equal(sf.scope, 'full',
    'the layer set only applies on a full-scope recall; camera scope leaves layers alone');

  const enabled = manager.parseHashState(sf.hash).layerState?.enabledLayerIds || [];
  assert.deepEqual([...enabled].sort(), [...SF_WORKING_SET_LAYERS].sort());

  for (const id of REGISTERED_LAYER_IDS) {
    if (SF_WORKING_SET_LAYERS.includes(id)) continue;
    assert.equal(enabled.includes(id), false, `${id} must be off in the SF seed`);
  }
});

test('the SF seed does not force a visual style change on recall', () => {
  // A recall is a state swap the user asked for, but flipping the whole look to
  // retro green is not what "take me back to this place" should mean.
  const manager = makeManager('');
  const sf = SAVED_PLACES_SEED.find((entry) => /SF Market Street/.test(entry.name));
  assert.equal(manager.parseHashState(sf.hash).style, 'normal');
});

test('seeding happens only when the key is absent, so deletions stay deleted', () => {
  const fresh = fakeStorage();
  const first = seedStoreIfAbsent(fresh, SAVED_PLACES_SEED);
  assert.equal(first.seeded, true);
  assert.equal(first.doc.places.length, SAVED_PLACES_SEED.length);
  assert.equal(first.doc.places[0].name, SAVED_PLACES_SEED[0].name, 'seed order is preserved');

  const again = seedStoreIfAbsent(fresh, SAVED_PLACES_SEED);
  assert.equal(again.seeded, false, 'a present key must not be re-seeded');

  // A user who deleted everything has an EMPTY document, not an absent key.
  const emptied = fakeStorage({ seed: { [SAVED_PLACES_STORAGE_KEY]: serializeDocument(emptyDocument()) } });
  const third = seedStoreIfAbsent(emptied, SAVED_PLACES_SEED);
  assert.equal(third.seeded, false, 'deleted bookmarks must not come back');
  assert.deepEqual(third.doc.places, []);
});

test('a seed fix reaches a store that was already written', () => {
  // Without this, seeding-only-when-absent means anyone who loaded the app once
  // keeps the old bookmark forever and never sees a correction.
  const stale = { ...SAVED_PLACES_SEED[0], hash: 'v=2&lat=1&lon=2&l=a.c.e.q.d.w.i.r.u.t', scope: 'camera' };
  const storage = fakeStorage();
  const seeded = seedStoreIfAbsent(storage, [stale], 1);
  assert.equal(seeded.doc.places[0].hash, stale.hash);

  const synced = syncSeed(storage, SAVED_PLACES_SEED, SAVED_PLACES_SEED_VERSION);
  assert.deepEqual(synced.refreshed, [slugify(SAVED_PLACES_SEED[0].name)]);
  assert.equal(synced.doc.places[0].hash, SAVED_PLACES_SEED[0].hash, 'hash must be refreshed');
  assert.equal(synced.doc.places[0].scope, 'full', 'scope must be refreshed');
  assert.equal(synced.doc.seedVersion, SAVED_PLACES_SEED_VERSION);

  // Idempotent: a second run at the same version changes nothing.
  assert.deepEqual(syncSeed(storage, SAVED_PLACES_SEED, SAVED_PLACES_SEED_VERSION).refreshed, []);
});

test('a seed refresh never resurrects a deleted place or touches the user\'s own', () => {
  const storage = fakeStorage();
  seedStoreIfAbsent(storage, SAVED_PLACES_SEED, 1);

  // The user deletes the seed entry and saves one of their own.
  let doc = removePlace(readStore(storage), slugify(SAVED_PLACES_SEED[0].name));
  doc = addPlace(doc, { name: 'Mine', hash: FULL_HASH, scope: 'camera' }).doc;
  doc.seedVersion = 1;
  writeStore(storage, doc);

  const synced = syncSeed(storage, SAVED_PLACES_SEED, SAVED_PLACES_SEED_VERSION);
  assert.deepEqual(synced.refreshed, [], 'nothing to refresh — the seed entry is gone');
  assert.equal(synced.doc.places.length, 1, 'the deleted seed must not come back');
  assert.equal(synced.doc.places[0].name, 'Mine');
  assert.equal(synced.doc.places[0].hash, FULL_HASH, 'a user place must be left alone');
  assert.equal(synced.doc.places[0].scope, 'camera');
});

test('seeding degrades quietly when storage is unavailable', () => {
  const result = seedStoreIfAbsent(fakeStorage({ throwOn: 'both' }), SAVED_PLACES_SEED);
  assert.equal(result.seeded, false);
  assert.deepEqual(result.doc.places, []);
});
