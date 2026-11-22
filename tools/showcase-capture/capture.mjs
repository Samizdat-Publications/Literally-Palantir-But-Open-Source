// Keyhole showcase capture. Drives the real dev build through window.__godsEyeView.
// node capture.mjs <shots.json> <outDir> [width height]
// A shot: { name, style, layers:{id:bool}, from:{lat,lon,alt,heading,pitch}, to:{...}?,
//           frames?:N (1 = still), warmMs?, clock?:{multiplier}, hud?:'off'|'minimal'|... }
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(new URL('../../package.json', import.meta.url));
const puppeteer = require('puppeteer');

const [, , shotsFile, outDir, W = '1280', H = '720'] = process.argv;
const shots = JSON.parse(fs.readFileSync(shotsFile, 'utf8'));
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
fs.mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist',
    '--enable-unsafe-swiftshader', '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    `--window-size=${W},${H}`, '--hide-scrollbars'],
  protocolTimeout: 600000,
});
const page = await browser.newPage();
await page.setViewport({ width: +W, height: +H, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 200)));
await page.evaluateOnNewDocument(() => {
  const RD = Date; const rNow = RD.now.bind(RD);
  let mode = 'real', off = 0, frozen = 0;
  const v = () => (mode === 'step' ? frozen : rNow() + off);
  window.__vt = {
    freeze() { frozen = v(); mode = 'step'; },
    step(ms) { frozen += ms; },
    resume() { off = frozen - rNow(); mode = 'real'; },
    now: v,
  };
  function VDate(...a) {
    if (!new.target) return new RD(v()).toString();
    return a.length === 0 ? new RD(v()) : new RD(...a);
  }
  VDate.prototype = RD.prototype;
  VDate.now = v; VDate.parse = RD.parse; VDate.UTC = RD.UTC;
  Object.setPrototypeOf(VDate, RD);
  window.Date = VDate;
});
let blockPatterns = [];
await page.setRequestInterception(true);
page.on('request', (r) => {
  if (blockPatterns.length && blockPatterns.some((b) => r.url().includes(b))) { r.abort().catch(() => {}); return; }
  r.continue().catch(() => {});
});
await page.goto((process.env.APP_URL || 'http://localhost:4291/'), { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(() => window.__godsEyeView?.viewer, { timeout: 240000 });
console.log('photoreal tiles:', await page.evaluate(() => !!window.__godsEyeView.tileset));
console.log('app up; gpu:', await page.evaluate(() => {
  const gl = document.createElement('canvas').getContext('webgl2');
  const ext = gl?.getExtension('WEBGL_debug_renderer_info');
  return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown';
}));
await sleep(4000);

await page.addStyleTag({ content: `
  body:not(.cap-hud) #intel-hud { display:none !important; }
  body:not(.cap-scope) #scope-mask { display:none !important; }
  #clean-view-exit, .gev-toast, #toast-container, .toast, #first-run, .first-run, #loader, #splash { display:none !important; }
` });

await page.evaluate(() => {
  const g = window.__godsEyeView;
  document.body.classList.add('recording-mode');
  g.styleManager.setCleanView(true);
  try { g.styleManager.setHudVisible('off'); } catch {}
  window.__cap = {
    async settle(maxMs, minMs = 0) {
      const v = g.viewer; const t0 = performance.now();
      let ok = 0;
      while (performance.now() - t0 < maxMs) {
        v.render();
        await new Promise((r) => setTimeout(r, 30));
        const loaded = v.scene.globe.tilesLoaded && (g.tileset ? g.tileset.tilesLoaded : true);
        ok = loaded ? ok + 1 : 0;
        if (ok > 6 && performance.now() - t0 > minMs) return true;
      }
      return false;
    },
    setCam(c) {
      g.viewer.camera.cancelFlight?.();
      const Cart3 = g.viewer.camera.position.constructor;
      const r = Math.PI / 180;
      g.viewer.camera.setView({
        destination: Cart3.fromDegrees(c.lon, c.lat, c.alt),
        orientation: { heading: c.heading * r, pitch: c.pitch * r, roll: 0 },
      });
    },
  };
});

const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
function camAt(s, t) {
  if (!s.to) return { ...s.from, t };
  const e = s.linear ? t : ease(t);
  const k = {};
  for (const key of ['lat', 'lon', 'heading', 'pitch']) k[key] = lerp(s.from[key], s.to[key], e);
  // altitude interpolates geometrically so zooms read evenly
  k.alt = Math.exp(lerp(Math.log(s.from.alt), Math.log(s.to.alt), e));
  k.t = t;
  return k;
}

for (const s of shots) {
  if (only && !only.includes(s.name)) continue;
  const frames = s.frames ?? 1;
  console.log(`shot ${s.name} (${frames} frames)`);
  await page.evaluate(async (s) => {
    const g = window.__godsEyeView;
    g.viewer.useDefaultRenderLoop = true;
    if (s.style) g.styleManager.setStyle(s.style);
    try {
      const hud = s.hud || 'off';
      g.styleManager.setHudVisible(hud === 'off' ? 'off' : 'on');
      if (hud !== 'off' && hud !== 'on') g.styleManager.setHudLayout(hud);
      document.body.classList.toggle('cap-hud', hud !== 'off');
    } catch (e) { console.warn('hud', e); }
    try { g.styleManager.setDetection({ enabled: !!s.detection }); } catch (e) { console.warn('det', e); }
    const sb = document.getElementById('scope-toggle');
    if (sb && sb.classList.contains('active') !== !!s.scope) sb.click();
    // start each shot from a clean slate: only the layers this shot names are on
    const want = s.layers || {};
    for (const id of (g.dataManager.getEnabledLayerIds?.() || [])) {
      if (!want[id]) { try { await g.dataManager.setEnabled(id, false); } catch {} }
    }
    for (const [id, on] of Object.entries(want)) {
      try { await g.dataManager.setEnabled(id, on); } catch (e) { console.warn('layer', id, e); }
    }
    if (s.layerParams) for (const [id, p] of Object.entries(s.layerParams)) { try { g.dataManager.setLayerParams?.(id, p); } catch {} }
    if (s.eval) { try { (0, eval)(s.eval); } catch (e) { console.warn('eval', e); } }
    window.__cap.setCam(s.from);
  }, s);
  await sleep(s.warmMs ?? 8000); // let layers fetch with the live loop running
  if (s.pointScale) {
    // fixed-pixel points (satellites) shrink to dust at 2560 px; scale them to their 1080p look
    console.log('  points scaled:', await page.evaluate((k) => {
      const v = window.__godsEyeView.viewer; let n = 0;
      const walk = (coll) => { for (let i = 0; i < coll.length; i++) { let q; try { q = coll.get(i); } catch { continue; } if (!q) continue;
        if (typeof q.length === 'number' && typeof q.get === 'function') { walk(q); continue; }
        if (q.pixelSize !== undefined && q.position) { if (q.__ps0 === undefined) q.__ps0 = q.pixelSize; q.pixelSize = q.__ps0 * k; n++; } } };
      walk(v.scene.primitives); return n; }, s.pointScale));
  }
  blockPatterns = s.block || [];
  const startJD = await page.evaluate(async (s) => {
    const g = window.__godsEyeView; const v = g.viewer;
    window.__vt.freeze();
    v.useDefaultRenderLoop = false;
    v.scene.requestRenderMode = false;
    await window.__cap.settle(s.settleMs ?? 25000, 1500);
    return null;
  }, s);
  if (s.follow) {
    const picked = await page.evaluate((cfg) => {
      const g = window.__godsEyeView; const v = g.viewer; const C3 = v.camera.position.constructor;
      const ell = v.scene.globe.ellipsoid; const D = 180 / Math.PI;
      const bbs = [];
      const walk = (coll) => { for (let i = 0; i < coll.length; i++) { let q; try { q = coll.get(i); } catch { continue; } if (!q) continue;
        if (typeof q.length === 'number' && typeof q.get === 'function') { walk(q); continue; }
        if (q.image !== undefined && q.position && typeof q.id === 'string' && /^[0-9a-f]{6}$/.test(q.id)) bbs.push(q); } };
      walk(v.scene.primitives);
      const centre = C3.fromDegrees(cfg.lon, cfg.lat, 0);
      const snap = () => new Map(bbs.map((b) => [b, C3.clone(b.position)]));
      for (let i = 0; i < 3; i++) v.render();
      const a = snap(); window.__vt.step(2000); for (let i = 0; i < 3; i++) v.render(); const bpos = snap(); window.__vt.step(-2000); for (let i = 0; i < 3; i++) v.render();
      const cands = [];
      for (const bb of bbs) {
        const p0 = a.get(bb), p1 = bpos.get(bb); const c = ell.cartesianToCartographic(p1); if (!c) continue;
        const h = c.height; const dist = C3.distance(p1, centre); const mv = C3.distance(p0, p1);
        if (h < cfg.minH || h > cfg.maxH || dist > cfg.maxKm * 1000 || dist < (cfg.minKm || 0) * 1000 || mv < 60) continue;
        const vel = C3.subtract(p1, p0, new C3()); const toC = C3.subtract(centre, p1, new C3());
        const toward = C3.dot(C3.normalize(vel, new C3()), C3.normalize(toC, new C3()));
        if (cfg.toward && toward < cfg.toward) continue;
        cands.push({ bb, id: bb.id, h: Math.round(h), km: Math.round(dist / 100) / 10, speed: Math.round(mv / 2), toward: +toward.toFixed(2), score: toward - Math.abs(h - cfg.idealH) / 2000 });
      }
      cands.sort((x, y) => y.score - x.score);
      if (!cands.length) return { ok: false, n: bbs.length };
      const pick = cfg.id ? (cands.find((c) => c.id === cfg.id) || cands[0]) : cands[0];
      const tgt = pick.bb;
      let dir = null; let last = C3.clone(tgt.position);
      { const p0 = a.get(tgt), p1 = bpos.get(tgt); dir = C3.normalize(C3.subtract(p1, p0, new C3()), new C3()); }
      window.__follow = (c) => {
        const p = tgt.position;
        const mv = C3.subtract(p, last, new C3());
        if (C3.magnitude(mv) > 0.5) { const d = C3.normalize(mv, new C3()); dir = C3.normalize(C3.lerp(dir, d, 0.04, new C3()), new C3()); }
        last = C3.clone(p);
        const up = C3.normalize(p, new C3());
        // horizontal forward
        const fwd = C3.normalize(C3.subtract(dir, C3.multiplyByScalar(up, C3.dot(dir, up), new C3()), new C3()), new C3());
        const right = C3.normalize(C3.cross(fwd, up, new C3()), new C3());
        const ang = (cfg.ang0 + (cfg.ang1 - cfg.ang0) * (c.t ?? 0)) / D; // 0 = straight behind, + = swing to the right
        const back = cfg.back, rise = cfg.rise;
        const off = C3.add(C3.multiplyByScalar(fwd, -Math.cos(ang) * back, new C3()), C3.multiplyByScalar(right, Math.sin(ang) * back, new C3()), new C3());
        C3.add(off, C3.multiplyByScalar(up, rise, new C3()), off);
        const cam = C3.add(p, off, new C3());
        const look = C3.add(p, C3.multiplyByScalar(fwd, cfg.ahead, new C3()), new C3());
        C3.add(look, C3.multiplyByScalar(up, cfg.lookUp || 0, new C3()), look);
        const direction = C3.normalize(C3.subtract(look, cam, new C3()), new C3());
        const camRight = C3.normalize(C3.cross(direction, up, new C3()), new C3());
        const camUp = C3.normalize(C3.cross(camRight, direction, new C3()), new C3());
        v.camera.setView({ destination: cam, orientation: { direction, up: camUp } });
      };
      const { bb, ...info } = pick; return { ok: true, info, others: cands.slice(1, 6).map(({ bb, ...r }) => r) };
    }, s.follow);
    console.log('  follow pick:', JSON.stringify(picked));
    if (!picked.ok) { console.log('  no aircraft fits; skipping'); continue; }
    await page.evaluate(async (s) => { window.__follow({ t: 0 }); await window.__cap.settle(s.settleMs ?? 25000, 1500); }, s);
  }
  const dtSec = s.clockSecPerFrame ?? (1 / 30);
  for (let f = 0; f < frames; f++) {
    const t = frames === 1 ? 0 : f / (frames - 1);
    const c = camAt(s, t);
    const switchTo = (s.styleCycle || []).find((x) => x.frame === f)?.style || null;
    const done = await page.evaluate(async (c, dt, perFrameMs, vtStep, minRenders, follow, switchTo) => {
      const g = window.__godsEyeView; const v = g.viewer; const sm = g.styleManager;
      window.__vt.step(vtStep);
      if (switchTo) {
        sm.setStyle(switchTo);
        try { sm.setHudVisible('off'); } catch {}
        const sb = document.getElementById('scope-toggle');
        if (sb && sb.classList.contains('active')) sb.click();
      }
      // crossfades follow the frame clock, not wall time (500 ms, ease-in-out as in ui.js)
      // take every pending crossfade away from the app's rAF loop (it runs on wall time)
      window.__myTr = window.__myTr || new Map();
      for (const [name, tr] of sm.transitions) window.__myTr.set(name, tr);
      sm.transitions.clear();
      for (const [name, tr] of window.__myTr) {
        if (tr.__vt0 === undefined) tr.__vt0 = window.__vt.now() - vtStep;
        const el = window.__vt.now() - tr.__vt0;
        tr.start = performance.now() - el;
        const t = Math.min(el / 500, 1);
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        sm._setStageIntensity(sm.stages[name], tr.from + (tr.to - tr.from) * e);
        if (t >= 1) { sm._setStageIntensity(sm.stages[name], tr.to); window.__myTr.delete(name); }
      }
      if (follow && window.__follow) window.__follow(c); else window.__cap.setCam(c);
      for (let i = 0; i < minRenders; i++) { if (follow && window.__follow) window.__follow(c); v.render(); }
      v.clock.shouldAnimate = false;
      const JD = v.clock.currentTime.constructor;
      v.clock.currentTime = JD.addSeconds(v.clock.currentTime, dt, new JD());
      return window.__cap.settle(perFrameMs, 0);
    }, c, dtSec, frames === 1 ? 20000 : (s.perFrameMs ?? 6000), s.vtStepMs ?? (1000 / 30), s.minRenders ?? 2, !!s.follow, switchTo);
    { const err = await page.evaluate(() => document.querySelector('.cesium-widget-errorPanel')?.innerText); if (err) throw new Error('cesium render error in ' + s.name + ' at frame ' + f + ': ' + err.replace(/\s+/g, ' ').slice(0, 600)); }
    const file = frames === 1 ? path.join(outDir, `${s.name}.png`) : path.join(outDir, s.name, `f${String(f).padStart(4, '0')}.png`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await page.screenshot({ path: file, type: 'png' });
    if (f % 30 === 0) console.log(`  frame ${f}${done ? '' : ' (tiles not settled)'}`);
  }
  blockPatterns = [];
  await page.evaluate(() => { window.__vt.resume(); window.__godsEyeView.viewer.useDefaultRenderLoop = true; });
}
await browser.close();
console.log('done');
