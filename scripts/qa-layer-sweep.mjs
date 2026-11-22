#!/usr/bin/env node
/**
 * Sweep every registered data layer and report what each one actually loads.
 *
 * Why this exists: the 48 other qa-*.mjs scripts each prove one subsystem in
 * depth, but nothing walked the whole layer registry and asked the simplest
 * question — "does this layer return data?" That gap is how the project reached
 * 2,624 passing unit tests with no evidence any layer had ever rendered.
 *
 * Two things this script gets right that a naive probe does not:
 *
 *   1. It reads the manager's OWN stats (`dataManager.getAll()[].stats.count`),
 *      the same numbers the Data Layers panel shows. Counting
 *      `viewer.entities.values.length` reports ~0 for nearly every layer,
 *      because most render into their own primitive collections or data
 *      sources rather than the viewer's entity collection. Measuring that way
 *      makes a healthy layer look dead.
 *
 *   2. Several layers are VIEWPORT- or REGION-scoped and legitimately return 0
 *      at a continental camera. Reporting those as failures is wrong, so each
 *      is re-tested at a location where its data actually exists (see SCOPED).
 *      Verified 2026-08-29: traffic 0 → 2,213 at London, bikeshare 0 → 2,508 at
 *      New York (its registry is US-only), military-installations 0 → 6 at San
 *      Diego.
 *
 * `military-awareness` is expected to report 0 and that is CORRECT: its
 * getStats() returns `count: state.results ? 1 : 0`, a flag rather than a
 * population, and results exist only once a contact is selected.
 *
 * Usage:
 *   node scripts/qa-layer-sweep.mjs                  # against QA_BASE_URL or :4173
 *   QA_BASE_URL=http://localhost:4174 node scripts/qa-layer-sweep.mjs
 *   node scripts/qa-layer-sweep.mjs --headful
 *
 * Exit code is 0 when every layer either returned data or is a known-correct
 * zero, and 1 otherwise, so this is safe to wire into a pre-release check.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shotsDir = path.join(repoRoot, 'qa-shots', 'layer-sweep');
const appUrl = process.env.QA_BASE_URL || 'http://localhost:4173';
const headful = process.argv.includes('--headful');

/** Continental framing: far enough out that global layers all have something to show. */
const OVERVIEW = { lon: -98.0, lat: 39.0, alt: 4_000_000 };

/**
 * Layers that are viewport- or region-scoped, with a camera where their data
 * genuinely exists. A zero at OVERVIEW is expected for these and is only a
 * failure if it persists here too.
 */
const SCOPED = {
  traffic: { lon: -0.1278, lat: 51.5074, alt: 2500, where: 'London' },
  bikeshare: { lon: -73.98, lat: 40.74, alt: 6000, where: 'New York' },
  'military-installations': { lon: -117.15, lat: 32.68, alt: 25_000, where: 'San Diego' },
};

/** Layers whose count is a flag, not a population, so 0 is the correct reading. */
const EXPECTED_ZERO = new Set(['military-awareness']);

const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
  || (() => { try { return puppeteer.executablePath(); } catch { return null; } })();
if (!executablePath || !fs.existsSync(executablePath)) {
  throw new Error('Puppeteer Chrome for Testing is unavailable');
}
fs.mkdirSync(shotsDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: headful ? false : 'new',
  executablePath,
  args: ['--no-sandbox', '--enable-gpu', '--ignore-gpu-blocklist',
    '--enable-unsafe-swiftshader', '--window-size=1600,1000'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1000 });

let consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + String(e.message).slice(0, 200)));

console.log(`Layer sweep against ${appUrl}`);
await page.goto(appUrl, { waitUntil: 'domcontentloaded', timeout: 90_000 });
await page.waitForFunction(() => window.__godsEyeView?.dataManager, { timeout: 90_000 });
await page.waitForFunction(
  () => document.getElementById('loading-screen')?.classList.contains('hidden'),
  { timeout: 90_000 },
);

// The first-run launcher un-hides on a delay and ESC deliberately does NOT close
// it (qa-firstrun.mjs asserts that). Choosing "explore" is the supported exit.
await page.waitForFunction(
  () => {
    const el = document.getElementById('first-run-launcher');
    return el && !el.hasAttribute('hidden');
  },
  { timeout: 30_000 },
).catch(() => console.log('  (first-run launcher never appeared; continuing)'));
await page.evaluate(() => document.querySelector('[data-first-run-choice="explore"]')?.click());
await new Promise((r) => setTimeout(r, 2000));

const flyTo = async ({ lon, lat, alt }, settleMs = 8000) => {
  await page.evaluate((c) => {
    const v = window.__godsEyeView.viewer;
    // Cesium is an ES module here, not a window global — reach Cartesian3
    // through a live instance so this does not depend on the bundling.
    const Cartesian3 = v.camera.position.constructor;
    v.camera.setView({ destination: Cartesian3.fromDegrees(c.lon, c.lat, c.alt) });
  }, { lon, lat, alt });
  await new Promise((r) => setTimeout(r, settleMs));
};
const setLayer = (id, want) => page.evaluate((args) => {
  const dm = window.__godsEyeView.dataManager;
  if (Boolean(dm.isEnabled?.(args.id)) !== args.want) dm.toggle(args.id, { origin: 'qa' });
}, { id, want });
const readStats = (id) => page.evaluate((layerId) => {
  const layer = window.__godsEyeView.dataManager.getAll()
    .find((x) => (x.id ?? x.layerId) === layerId) || {};
  const st = layer.stats || {};
  return {
    count: st.count ?? 0,
    source: st.source ?? null,
    message: st.error ? String(st.error).slice(0, 120) : null,
    lastUpdate: st.lastUpdate ? 'yes' : 'never',
  };
}, id);

/** Enable one layer, wait for its feed, screenshot, read stats, disable again. */
async function probe(id, waitMs, tag) {
  consoleErrors = [];
  await setLayer(id, true);
  await new Promise((r) => setTimeout(r, waitMs));
  const stats = await readStats(id);
  await page.screenshot({ path: path.join(shotsDir, `${tag}-${id}.png`) });
  await setLayer(id, false);
  await new Promise((r) => setTimeout(r, 2000));
  return { ...stats, errors: [...new Set(consoleErrors)].slice(0, 3) };
}

await flyTo(OVERVIEW, 6000);
const ids = await page.evaluate(() =>
  window.__godsEyeView.dataManager.getAll().map((l) => l.id ?? l.layerId));
console.log(`  ${ids.length} layers registered\n`);

const results = [];
for (const id of ids) {
  let r = await probe(id, 14_000, 'overview');
  let scopedAt = null;
  if (r.count === 0 && SCOPED[id]) {
    // A zero here is expected, not a failure — re-probe where the data lives.
    await flyTo(SCOPED[id], 9000);
    r = await probe(id, 22_000, 'scoped');
    scopedAt = SCOPED[id].where;
    await flyTo(OVERVIEW, 5000);
  }
  const ok = r.count > 0 || EXPECTED_ZERO.has(id);
  results.push({ id, ...r, scopedAt, ok });
  console.log(`  [${ok ? 'OK  ' : 'FAIL'}] ${id.padEnd(32)} count=${String(r.count).padStart(7)}`
    + `${scopedAt ? `  @${scopedAt}` : ''}${r.message ? `  — ${r.message}` : ''}`);
}

fs.writeFileSync(path.join(shotsDir, 'layer-sweep.json'), JSON.stringify(results, null, 2));
const failures = results.filter((r) => !r.ok);
console.log(`\n  ${results.length - failures.length}/${results.length} layers returned data`);
if (failures.length) console.log(`  FAILING: ${failures.map((f) => f.id).join(', ')}`);
console.log(`  Shots: ${shotsDir}`);

await browser.close();
process.exit(failures.length ? 1 : 0);
