/**
 * Seed bookmarks for the saved-places store.
 *
 * Generated from `docs/SAVED-VIEWS.md`, which stays the human-editable source:
 * that file is where a person adds a view by pasting an address bar, and this
 * module is the thing the app imports. Keep them in step — `savedPlaces.test.mjs`
 * asserts every hash here still decodes AND that the intended layer set is what
 * comes back, so a bad paste fails the suite rather than shipping a bookmark
 * that recalls the wrong thing.
 *
 * Seeding only happens when the store key is ABSENT (see `seedStoreIfAbsent`),
 * so a user who deletes these does not get them back on the next reload.
 */

/**
 * Bump whenever a seed entry's hash, scope or note changes.
 *
 * Without this a fix to a seed bookmark would never reach anyone who had already
 * loaded the app: seeding runs only when the store key is ABSENT, so an existing
 * store keeps the old copy forever. On a version change, `syncSeed()` refreshes
 * seed entries that are still present and leaves everything else alone.
 *
 * 2 — 2026-08-29: SF view narrowed from ten layers to the five-layer working
 *     set, and `style=crt` relaxed to `normal`.
 */
export const SAVED_PLACES_SEED_VERSION = 2;

/**
 * @typedef {object} SeedPlace
 * @property {string} name  Display name — the one thing the hash does not carry.
 * @property {string} hash  Share hash, no leading '#'.
 * @property {string} note  One line on what it is.
 * @property {'full'|'camera'} scope
 */

/**
 * The five layers the SF working view is meant to show. Kept as a named export
 * so the test asserts against this list rather than re-typing the `l=` token,
 * which is opaque (`b.c.i.r.t`) and easy to get wrong by hand.
 *
 * Everything else is deliberately OFF. The view as originally captured turned
 * ten layers on at once over the most expensive mesh in North America, which
 * `SAVED-VIEWS.md` names as "almost certainly the main reason the app felt
 * heavy" — the three static reference layers in that set (datacenters 4,362,
 * submarine cables 2,629, dams 716) are ~7,700 entities that never update and
 * show nothing at 100 m altitude.
 */
export const SF_WORKING_SET_LAYERS = Object.freeze([
  'bikeshare',
  'cctv',
  'military-installations',
  'radio',
  'traffic',
]);

/** @type {SeedPlace[]} */
export const SAVED_PLACES_SEED = Object.freeze([
  Object.freeze({
    name: 'SF Market Street — low approach',
    // Camera as captured 2026-08-28: 100 m over the Market Street corridor,
    // facing south. Two deliberate changes from that capture:
    //   * `l=b.c.i.r.t` — the five-layer working set above, replacing the ten
    //     layers the original had on.
    //   * `style=normal` (was `crt`, and its `sp=` params dropped). A recall is
    //     a state swap the user asked for, but flipping the entire look to
    //     retro green is not what "take me back to this place" should mean.
    hash: 'v=2&lat=37.7738&lon=-122.4232&alt=100&heading=180&pitch=-22&roll=360'
      + '&style=normal&bloom=0&sharpen=1&bi=0&bv=2&si=49&hud=tactical&hv=1'
      + '&dm=DENSE&dd=75&da=elastic&kf=7&ko=1&cr=0&sc=1&scf=11&map=photoreal'
      + '&l=b.c.i.r.t&lo=f.e.1'
      + '&ui=c.c.1_c.p.0_l.c.1_l.p.0_d.c.0_v.c.0_r.c.1_s.c.1_g.c.0_p.c.0_m.c.0',
    // `full`, not `camera`: enforcing the layer set IS the point of this
    // bookmark, and a camera-scoped place deliberately leaves layers alone.
    scope: 'full',
    note: 'San Francisco, Market Street near Guerrero/Duboce. Traffic, CCTV, radio, bikeshare.',
  }),
]);

export default SAVED_PLACES_SEED;
