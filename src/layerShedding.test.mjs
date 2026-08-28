/**
 * The layer-shedding rule is the answer to "turn off the heavy datasets when
 * the current ask doesn't need them". It is deliberately ONE instruction
 * string built out of set_layer_visibility calls that already exist, so the
 * frozen voice tool schema stays untouched and the rollback is deleting the
 * string. These tests guard both halves of that bargain.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../vite.config.js', import.meta.url), 'utf8');

/** Every layer id set_layer_visibility will accept. */
const REGISTERED_LAYER_IDS = new Set([
  'flights', 'military', 'earthquakes', 'satellites', 'rocket-launches',
  'traffic', 'cctv', 'radio', 'bikeshare', 'ais-live-vessels',
  'military-installations', 'military-awareness', 'local-firms', 'local-dams',
  'local-datacenters', 'telegeography-submarine-cables',
]);

const ANCHOR = 'SHEDDING LAYERS FOR SPEED';

test('the shedding rule is a live instruction entry, not a commented-out one', () => {
  // Anchored to a quote at the start of its own line, so commenting the
  // paragraph out reads as the removal it is rather than passing as a
  // substring match somewhere in the file.
  assert.match(
    src,
    new RegExp(`\\n\\s+'${ANCHOR}`),
    'the shedding rule must be an active instruction entry',
  );
});

test('the shedding rule stays OUTSIDE the frozen tool schema', () => {
  // This is the whole point. A schema edit busts the Realtime session cache;
  // an instruction edit does not. If this rule ever migrates into the tool
  // block, the freeze test starts failing for a reason nobody will connect
  // back to here — so fail loudly at the source instead.
  const ruleAt = src.indexOf(ANCHOR);
  const blockAt = src.indexOf('const GEV_REALTIME_TOOLS = [');
  assert.ok(ruleAt > 0, 'shedding rule not found');
  assert.ok(blockAt > 0, 'frozen tool block not found');
  assert.ok(
    ruleAt < blockAt,
    'the shedding rule moved into the frozen tool schema — that busts the Realtime cache',
  );
});

test('every layer the shedding rule names is one the app actually registers', () => {
  // set_layer_visibility throws on an unknown id, so a typo here turns a
  // "focus on fires" request into a spoken error in front of whoever is
  // watching. Cheap to catch, expensive to discover live.
  const rule = src.slice(src.indexOf(ANCHOR), src.indexOf(ANCHOR) + 3000);
  const end = rule.indexOf("',\n");
  const body = rule.slice(0, end > 0 ? end : rule.length);
  const named = body.match(/[a-z]+(?:-[a-z]+)+|\b(?:flights|military|earthquakes|satellites|traffic|cctv|radio|bikeshare)\b/g) || [];
  const layerish = named.filter((word) => word.includes('-') || REGISTERED_LAYER_IDS.has(word));
  assert.ok(layerish.length >= 10, `expected the rule to name layers, found ${layerish.length}`);
  for (const word of layerish) {
    // Hyphenated prose ("frame-rate", "side effect") would false-positive, so
    // only assert on words that look like layer ids the registry could hold.
    if (!word.includes('-')) continue;
    if (!/^(local|ais|rocket|telegeography|military)-/.test(word)) continue;
    assert.ok(
      REGISTERED_LAYER_IDS.has(word),
      `shedding rule names "${word}", which set_layer_visibility would reject`,
    );
  }
});

test('the three shed-first layers are the static reference set', () => {
  // These three are singled out because they are ~7k entities of geometry that
  // never update and show nothing below regional altitude. If the rule ever
  // starts shedding a LIVE layer by default, that is a behaviour change worth
  // failing on: a live layer is usually the thing the user is watching.
  const rule = src.slice(src.indexOf(ANCHOR), src.indexOf(ANCHOR) + 1200);
  for (const id of ['local-datacenters', 'telegeography-submarine-cables', 'local-dams']) {
    assert.ok(rule.includes(id), `${id} must stay in the shed-first set`);
  }
  for (const live of ['cctv', 'ais-live-vessels', 'flights']) {
    const shedFirst = rule.slice(0, rule.indexOf('When the user asks to FOCUS'));
    assert.ok(!shedFirst.includes(live), `${live} is live data — it must not be shed automatically`);
  }
});

test('the rule refuses to shed layers as a side effect of ordinary questions', () => {
  // The failure mode that would actually annoy someone: asking "how many
  // flights over Texas" and having the CCTV feed they were watching vanish.
  const rule = src.slice(src.indexOf(ANCHOR), src.indexOf(ANCHOR) + 3000);
  assert.match(rule, /LEAVE LAYERS ALONE/, 'the do-nothing default must stay explicit');
});
