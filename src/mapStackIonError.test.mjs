/**
 * The "Bing" chips are Cesium ion World Imagery, not Bing Maps. Cesium reports
 * an ion rejection as "Request has failed. Status Code: 401", which reads like
 * a network fault and sends people to check a Bing Maps key that does not
 * exist in this app. These tests pin the translation.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('./mapStackController.js', import.meta.url), 'utf8');

/**
 * Exercise the mapper without constructing a Cesium viewer, which needs WebGL.
 * The method is pure — error in, string out — so lifting it is faithful.
 */
function loadMapper() {
  const start = src.indexOf('  _activationErrorMessage(error, stack) {');
  assert.ok(start > 0, '_activationErrorMessage must exist');
  const end = src.indexOf('\n  }', start);
  const body = src.slice(src.indexOf('{', start) + 1, end);
  // eslint-disable-next-line no-new-func
  return new Function('error', 'stack', body);
}

test('an ion 401 names the token and the real product', () => {
  const mapper = loadMapper();
  const msg = mapper(
    new Error('Request has failed. Status Code: 401'),
    { requiresIon: true, label: 'Bing Aerial' },
  );
  assert.match(msg, /CESIUM_ION_TOKEN/, 'must name the variable to fix');
  assert.match(msg, /not a Bing Maps key/i, 'must kill the wrong-key theory');
  assert.doesNotMatch(msg, /^Request has failed/, 'the raw Cesium string must not survive');
});

test('an ion 403 is reported as a scope problem, not a bad token', () => {
  // Different fix entirely: 401 means replace the token, 403 means widen it.
  // Collapsing them would send the operator to rotate a token that is fine.
  const mapper = loadMapper();
  const msg = mapper(
    new Error('Request has failed. Status Code: 403'),
    { requiresIon: true, label: 'Bing Aerial' },
  );
  assert.match(msg, /assets:read|restricted/i, 'must point at scope');
  assert.doesNotMatch(msg, /not a Bing Maps key/i, 'a 403 token is real — do not blame its type');
});

test('non-ion stacks keep their raw error untouched', () => {
  // OSM and photoreal failures have nothing to do with ion; rewriting them
  // would bury the actual cause.
  const mapper = loadMapper();
  const raw = 'Request has failed. Status Code: 401';
  assert.equal(mapper(new Error(raw), { requiresIon: false, label: 'OSM' }), raw);
});

test('an ion failure that is not 401/403 passes through', () => {
  const mapper = loadMapper();
  const raw = 'Request has failed. Status Code: 500';
  assert.equal(mapper(new Error(raw), { requiresIon: true, label: 'Bing Aerial' }), raw);
});

test('the missing-token case still has its own separate message', () => {
  // _unavailableReason short-circuits before the provider is built, so the two
  // paths must not be merged — "no token" and "token refused" are different
  // problems with different fixes.
  assert.match(src, /_unavailableReason\(stack\)\s*\{/);
  assert.match(src, /Cesium ion token required for Bing stacks/);
});
