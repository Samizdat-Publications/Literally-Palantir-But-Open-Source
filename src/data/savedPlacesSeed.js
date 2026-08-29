/**
 * Seed bookmarks for the saved-places store.
 *
 * Generated from `docs/SAVED-VIEWS.md`, which stays the human-editable source:
 * that file is where a person adds a view by pasting an address bar, and this
 * module is the thing the app imports. Keep them in step — `savedPlaces.test.mjs`
 * asserts every hash here still decodes, so a bad paste fails the suite rather
 * than shipping a bookmark that recalls nothing.
 *
 * Seeding only happens when the store key is ABSENT (see `seedStoreIfAbsent`),
 * so a user who deletes these does not get them back on the next reload.
 */

/**
 * @typedef {object} SeedPlace
 * @property {string} name  Display name — the one thing the hash does not carry.
 * @property {string} hash  Share hash, no leading '#'.
 * @property {string} note  One line on what it is.
 * @property {'full'|'camera'} scope
 */

/** @type {SeedPlace[]} */
export const SAVED_PLACES_SEED = Object.freeze([
  Object.freeze({
    name: 'SF Market Street — low approach',
    // Saved 2026-08-28, the first entry in SAVED-VIEWS.md. 100 m over the
    // Market Street corridor, CRT style, tactical HUD, DENSE detection.
    hash: 'v=2&lat=37.7738&lon=-122.4232&alt=100&heading=180&pitch=-22&roll=360'
      + '&style=crt&bloom=0&sharpen=1&bi=0&bv=2&si=49&hud=tactical&hv=1'
      + '&dm=DENSE&dd=75&da=elastic&kf=7&ko=1&cr=0&sc=1&scf=11&map=photoreal'
      + '&l=a.c.e.q.d.w.i.r.u.t&lo=f.e.1'
      + '&ui=c.c.1_c.p.0_l.c.1_l.p.0_d.c.0_v.c.0_r.c.1_s.c.1_g.c.0_p.c.0_m.c.0'
      + '&sp=p.100_d.0_i.42',
    // Recorded as `camera` deliberately. The captured view turns TEN layers on
    // at once over the most expensive mesh in North America, and SAVED-VIEWS.md
    // names that as "almost certainly the main reason the app felt heavy".
    // Storing the full hash keeps every one of those settings recoverable — a
    // camera place can be promoted to full later — while the default recall
    // does not drag ten live layers back on top of whatever the user is doing.
    scope: 'camera',
    note: 'San Francisco, Market Street near Guerrero/Duboce. 100 m, facing south.',
  }),
]);

export default SAVED_PLACES_SEED;
