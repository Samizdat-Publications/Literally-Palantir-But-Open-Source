/**
 * @module brand
 *
 * Single source of truth for the product's name.
 *
 * This fork of God's Eye View (bilawalsidhu/gods-eye-view, MIT) is named
 * KEYHOLE — after the US photographic-reconnaissance satellite program (the KH
 * series, beginning with CORONA), and after Keyhole Inc., whose product became
 * Google Earth and so is the direct ancestor of the photorealistic 3D tiles
 * this app renders. See ROADMAP.md → Decisions.
 *
 * WHY THIS FILE EXISTS: renaming the fork once cost a sweep across nine files.
 * Runtime strings now resolve from here so the next rename is one edit. The
 * module is dependency-free on purpose — `vite.config.js` (Node) imports it for
 * prompt text, and browser modules import it for UI text.
 *
 * ⚠️ TWO SPOTS CANNOT READ FROM HERE. `index.html` is static markup served
 * before any module evaluates, so its `<title>` and the `<h1>` wordmark are
 * literals. Rewriting them from JS would flash the old name on every load.
 * When the name changes, edit those two by hand — they are the only exceptions,
 * and `BRAND_STATIC_MARKUP_SITES` lists them.
 *
 * ⚠️ NOT BRANDING: the `gev-` CSS class and DOM-id prefix (218+ occurrences) is
 * an internal identifier inherited from upstream. Leave it entirely alone.
 */

/** Full product name, as shown in titles and headings. */
export const BRAND_NAME = 'KEYHOLE';

/**
 * Wordmark split for the two-tone header treatment: the second part carries the
 * accent colour. Kept as parts so a two-word name can be dropped in without
 * touching the markup structure.
 */
export const BRAND_WORDMARK = Object.freeze({ lead: 'KEY', accent: 'HOLE' });

/** One-line descriptor used in prose and prompt text. */
export const BRAND_TAGLINE = 'a real-time geospatial intelligence console';

/** Upstream project this is forked from. Attribution — do not remove. */
export const UPSTREAM_NAME = "God's Eye View";

/**
 * The static-markup sites that cannot import this module, listed so a rename
 * has a complete checklist rather than a grep.
 * @type {ReadonlyArray<string>}
 */
export const BRAND_STATIC_MARKUP_SITES = Object.freeze([
  'index.html — <title>',
  'index.html — <h1> wordmark',
  'index.html — first-run card <h2>',
]);
