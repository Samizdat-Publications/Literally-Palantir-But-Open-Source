/**
 * Saved places — durable bookmark store for serialised view state.
 *
 * The app already encodes the COMPLETE view (camera, style, post-process, HUD,
 * detection, basemap, every layer with its options, and panel state) into the
 * URL hash. `ShareLinkManager._buildHashParams()` calls itself "a deterministic
 * snapshot", and that is exactly what a bookmark needs. So this module does not
 * serialise anything: it keeps hash strings that the share encoder produced and
 * the share decoder can read back. There is deliberately no second encoder —
 * a parallel format would drift from the share link the first time a param was
 * added, and every param here has already been through that decoder's
 * validation.
 *
 * Everything below is pure over a plain document plus an injected `storage`,
 * so the rules are unit-testable without a DOM or a real `localStorage`.
 *
 * Failure posture, copied from `decodeLayerStateParams` rather than invented:
 * **fail closed**. An unknown version or a corrupt blob yields an EMPTY list,
 * never a partial read. A half-understood document that got written back would
 * silently destroy the half it did not understand, and a bookmark list has no
 * other copy — there is no server and no account.
 */

/** Storage key. Matches the `godsEyeView.<version>.<thing>` shape in ui.js. */
export const SAVED_PLACES_STORAGE_KEY = 'godsEyeView.v1.savedPlaces';

/** Document version. Bump to migrate; an unknown value is refused whole. */
export const SAVED_PLACES_VERSION = 1;

/**
 * List cap. `localStorage` is a single ~5 MB budget shared with the panel
 * position store, and a hash runs ~300-500 bytes, so 50 is far below any real
 * limit while still bounding a runaway writer.
 */
export const MAX_PLACES = 50;

/** Name cap. Long enough to be descriptive, short enough to render in the tray. */
export const MAX_NAME_LENGTH = 80;

/** Note cap. One line, per the spec. */
export const MAX_NOTE_LENGTH = 200;

/** Recognised scopes. `full` replays everything; `camera` replays position only. */
export const PLACE_SCOPES = Object.freeze(['full', 'camera']);

/**
 * Scope a NEW place gets unless the user says otherwise.
 *
 * `full`: a bookmark normally means "put me back exactly here", and the seeded
 * SF view depends on that to enforce its layer set. `camera` is the narrow
 * opt-out for a place that should move the view and touch nothing else.
 *
 * The `<select>` in index.html marks the matching option `selected`; a test
 * pins the two together so they cannot drift apart.
 *
 * `normalizePlace`'s fallback is the same value but answers a different
 * question — what to assume when READING an entry whose scope field is missing,
 * which only happens with a hand-edited or imported file.
 */
export const DEFAULT_PLACE_SCOPE = 'full';

/**
 * Params a `camera` place replays. Deliberately NOT everything positional —
 * `map` is included because a photoreal view recalled onto a 2D basemap is not
 * the same place, but style, layers and panels are left exactly as the user
 * currently has them. That is the whole point of the narrow scope: recalling a
 * view saved at 3 am with ten layers on should not drag ten layers back.
 */
export const CAMERA_SCOPE_PARAMS = Object.freeze([
  'v', 'lat', 'lon', 'alt', 'heading', 'pitch', 'roll', 'map',
]);

/** An empty, valid document. Returned wherever a read fails. */
export function emptyDocument() {
  return { v: SAVED_PLACES_VERSION, places: [] };
}

/**
 * Turn a display name into a stable id, used for dedupe and for the DOM.
 * Falls back to a time-free token so two unnamed saves cannot collide.
 * @param {string} name
 * @param {number} [ordinal] - Disambiguator when the slug would be empty.
 * @returns {string}
 */
export function slugify(name, ordinal = 0) {
  const slug = String(name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || `place-${ordinal}`;
}

/** Clamp a string to a cap, trimming first. Non-strings become ''. */
function clampText(value, max) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

/**
 * Is this a hash string we are willing to store?
 *
 * Only a shape check: a real validation lives in the share decoder, which runs
 * on recall. Storing a string the decoder later rejects is recoverable (the
 * user deletes it); refusing to store a valid one is not.
 * @param {string} hash
 * @returns {boolean}
 */
export function isStorableHash(hash) {
  if (typeof hash !== 'string') return false;
  const trimmed = hash.trim().replace(/^#/, '');
  if (!trimmed || trimmed.length > 4096) return false;
  const params = new URLSearchParams(trimmed);
  return Number.isFinite(parseFloat(params.get('lat')))
    && Number.isFinite(parseFloat(params.get('lon')));
}

/**
 * Normalise one entry, or null if it cannot be trusted.
 * @param {unknown} raw
 * @param {number} index
 * @returns {{id:string,name:string,hash:string,savedAt:number,note:string,scope:string}|null}
 */
export function normalizePlace(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null;
  const hash = typeof raw.hash === 'string' ? raw.hash.trim().replace(/^#/, '') : '';
  if (!isStorableHash(hash)) return null;
  const name = clampText(raw.name, MAX_NAME_LENGTH) || `Place ${index + 1}`;
  const scope = PLACE_SCOPES.includes(raw.scope) ? raw.scope : 'full';
  const savedAt = Number.isFinite(raw.savedAt) ? raw.savedAt : 0;
  const id = clampText(raw.id, 64) || slugify(name, index);
  return { id, name, hash, savedAt, note: clampText(raw.note, MAX_NOTE_LENGTH), scope };
}

/**
 * Parse a stored JSON string into a document.
 *
 * Refuses an unknown `v` OUTRIGHT rather than salvaging the entries it
 * recognises — same rule as `decodeLayerStateParams`, and for the same reason:
 * a document written by a newer version may mean something different by the
 * same field, and a partial read that got saved back would destroy the rest.
 * @param {string|null|undefined} text
 * @returns {{v:number,places:Array}}
 */
export function parseDocument(text) {
  if (typeof text !== 'string' || !text.trim()) return emptyDocument();
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    return emptyDocument();          // corrupt blob: empty list, never a throw
  }
  if (!raw || typeof raw !== 'object') return emptyDocument();
  if (raw.v !== SAVED_PLACES_VERSION) return emptyDocument();   // fail closed
  if (!Array.isArray(raw.places)) return emptyDocument();
  const places = [];
  raw.places.forEach((entry, i) => {
    const place = normalizePlace(entry, i);
    if (place && !places.some((p) => p.id === place.id)) places.push(place);
  });
  return {
    v: SAVED_PLACES_VERSION,
    seedVersion: Number.isFinite(raw.seedVersion) ? raw.seedVersion : 0,
    places: places.slice(0, MAX_PLACES),
  };
}

/** Serialise a document for storage. */
export function serializeDocument(doc) {
  return JSON.stringify({
    v: SAVED_PLACES_VERSION,
    seedVersion: Number.isFinite(doc?.seedVersion) ? doc.seedVersion : 0,
    places: (doc?.places || []).slice(0, MAX_PLACES),
  });
}

/**
 * Read the store.
 *
 * Wrapped in try/catch because a private window or blocked site data throws on
 * ACCESS, not merely on write — `storage.getItem` itself can raise.
 * @param {Storage} [storage]
 * @returns {{v:number,places:Array}}
 */
export function readStore(storage) {
  try {
    return parseDocument(storage?.getItem?.(SAVED_PLACES_STORAGE_KEY));
  } catch {
    return emptyDocument();
  }
}

/**
 * Write the store. Returns whether it persisted, so callers can warn instead of
 * pretending a save happened.
 * @param {Storage} storage
 * @param {{places:Array}} doc
 * @returns {boolean}
 */
export function writeStore(storage, doc) {
  try {
    storage?.setItem?.(SAVED_PLACES_STORAGE_KEY, serializeDocument(doc));
    return true;
  } catch {
    return false;                    // quota, private mode, blocked site data
  }
}

/**
 * Add a place, newest first. A repeated id REPLACES rather than duplicating, so
 * saving over a name the user already used behaves like an update.
 * @returns {{doc:{v:number,places:Array}, place:object|null, reason:string|null}}
 */
export function addPlace(doc, {
  name, hash, note = '', scope = DEFAULT_PLACE_SCOPE, savedAt = 0,
} = {}) {
  const base = doc?.places ? { ...doc, places: [...doc.places] } : emptyDocument();
  const cleanHash = typeof hash === 'string' ? hash.trim().replace(/^#/, '') : '';
  if (!isStorableHash(cleanHash)) return { doc: base, place: null, reason: 'invalid-hash' };
  const cleanName = clampText(name, MAX_NAME_LENGTH) || `Place ${base.places.length + 1}`;
  const id = slugify(cleanName, base.places.length);
  const place = {
    id,
    name: cleanName,
    hash: cleanHash,
    savedAt: Number.isFinite(savedAt) ? savedAt : 0,
    note: clampText(note, MAX_NOTE_LENGTH),
    scope: PLACE_SCOPES.includes(scope) ? scope : 'full',
  };
  const existing = base.places.findIndex((p) => p.id === id);
  if (existing >= 0) base.places.splice(existing, 1);
  base.places.unshift(place);
  if (base.places.length > MAX_PLACES) {
    base.places.length = MAX_PLACES;   // oldest fall off the end
  }
  return { doc: base, place, reason: null };
}

/** Remove by id. */
export function removePlace(doc, id) {
  const places = (doc?.places || []).filter((p) => p.id !== id);
  return { v: SAVED_PLACES_VERSION, places };
}

/** Rename by id, re-slugging so the id keeps tracking the name. */
export function renamePlace(doc, id, name) {
  const cleanName = clampText(name, MAX_NAME_LENGTH);
  if (!cleanName) return doc?.places ? doc : emptyDocument();
  const places = (doc?.places || []).map((p, i) => (
    p.id === id ? { ...p, name: cleanName, id: slugify(cleanName, i) } : p
  ));
  return { v: SAVED_PLACES_VERSION, places };
}

/** Look up one place. */
export function findPlace(doc, id) {
  return (doc?.places || []).find((p) => p.id === id) || null;
}

/**
 * Reduce a hash to the params a given scope replays.
 *
 * `camera` is a FILTER over the decoded params, not a second format — the full
 * hash is stored either way, so a place saved as `camera` can be promoted to
 * `full` later without having lost anything.
 * @param {string} hash
 * @param {string} scope
 * @returns {string} hash string, no leading '#'
 */
export function applyScopeToHash(hash, scope) {
  const clean = typeof hash === 'string' ? hash.trim().replace(/^#/, '') : '';
  if (scope !== 'camera') return clean;
  const source = new URLSearchParams(clean);
  const out = new URLSearchParams();
  for (const key of CAMERA_SCOPE_PARAMS) {
    if (source.has(key)) out.set(key, source.get(key));
  }
  return out.toString();
}

/**
 * Merge seed entries into a store that has never been written.
 *
 * Only seeds when the key is ABSENT. An empty list the user created by deleting
 * everything must stay empty — re-seeding it would resurrect bookmarks they
 * deliberately removed, every reload.
 * @param {Storage} storage
 * @param {Array} seed
 * @returns {{doc:{v:number,places:Array}, seeded:boolean}}
 */
export function seedStoreIfAbsent(storage, seed, seedVersion = 0) {
  let existing = null;
  try {
    existing = storage?.getItem?.(SAVED_PLACES_STORAGE_KEY) ?? null;
  } catch {
    return { doc: emptyDocument(), seeded: false };
  }
  if (existing !== null) return { doc: parseDocument(existing), seeded: false };
  let doc = emptyDocument();
  for (const entry of [...(seed || [])].reverse()) {   // reversed: first seed ends up first
    doc = addPlace(doc, entry).doc;
  }
  doc.seedVersion = seedVersion;
  writeStore(storage, doc);
  return { doc, seeded: true };
}

/**
 * Seed a fresh store, or refresh seed entries after the seed itself changed.
 *
 * `seedStoreIfAbsent` alone is not enough: it fires only when the key is absent,
 * so a fix to a seed bookmark would never reach anyone who had already loaded
 * the app once. On a `seedVersion` bump this refreshes the hash, scope and note
 * of any seed entry STILL PRESENT, and:
 *
 *   - never resurrects a seed entry the user deleted — deletions stay deleted,
 *     which is the same rule `seedStoreIfAbsent` enforces;
 *   - never touches a place the user created;
 *   - keeps the user's `name`, since renaming is theirs and the id follows it.
 *
 * A renamed seed entry no longer matches by id and is therefore left alone,
 * which is the safe direction: the user has made it their own.
 *
 * @param {Storage} storage
 * @param {Array} seed
 * @param {number} seedVersion
 * @returns {{doc:{v:number,seedVersion:number,places:Array}, seeded:boolean, refreshed:string[]}}
 */
export function syncSeed(storage, seed, seedVersion = 0) {
  const first = seedStoreIfAbsent(storage, seed, seedVersion);
  if (first.seeded) return { ...first, refreshed: [] };

  const doc = first.doc;
  if ((doc.seedVersion || 0) === seedVersion) return { doc, seeded: false, refreshed: [] };

  const refreshed = [];
  const places = doc.places.map((place) => {
    const match = (seed || []).find((entry) => slugify(entry.name) === place.id);
    if (!match) return place;
    const hash = String(match.hash || '').trim().replace(/^#/, '');
    if (!isStorableHash(hash)) return place;
    if (hash === place.hash && match.scope === place.scope) return place;
    refreshed.push(place.id);
    return {
      ...place,
      hash,
      scope: PLACE_SCOPES.includes(match.scope) ? match.scope : place.scope,
      note: clampText(match.note, MAX_NOTE_LENGTH) || place.note,
    };
  });

  const next = { ...doc, seedVersion, places };
  writeStore(storage, next);
  return { doc: next, seeded: false, refreshed };
}

/**
 * Build the export payload. Export matters because `localStorage` dies with the
 * browser profile and there is no server copy.
 */
export function exportDocument(doc) {
  return JSON.stringify({
    v: SAVED_PLACES_VERSION,
    places: (doc?.places || []).slice(0, MAX_PLACES),
  }, null, 2);
}

/**
 * Read an exported payload back. Same fail-closed rule as `parseDocument`, so
 * importing a file from a newer version refuses rather than silently dropping
 * the fields it does not know.
 * @returns {{doc:{v:number,places:Array}, ok:boolean}}
 */
export function importDocument(text) {
  const doc = parseDocument(text);
  const looksEmpty = doc.places.length === 0;
  const sourceHadPlaces = (() => {
    try {
      const raw = JSON.parse(String(text));
      return Array.isArray(raw?.places) && raw.places.length > 0;
    } catch {
      return false;
    }
  })();
  return { doc, ok: !(looksEmpty && sourceHadPlaces) };
}
