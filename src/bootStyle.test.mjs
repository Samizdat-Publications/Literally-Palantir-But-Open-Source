/**
 * The style the app opens in.
 *
 * Two invariants that are easy to break and silent when broken:
 *
 *   1. The static label in `index.html` must describe the style manager's
 *      PRE-INIT state, not the default we boot into. `setStyle()` early-returns
 *      when the requested style already matches, so it is the transition out of
 *      the pre-init style that repaints the label. Setting the markup to the
 *      boot default instead leaves a share link that restores the pre-init
 *      style showing a label for a style it is not rendering.
 *   2. The default must never be applied over an incoming share/saved view,
 *      which carries its own style.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const uiSource = fs.readFileSync(new URL('./ui.js', import.meta.url), 'utf8');
const markup = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

/** Style ids the hotkey map binds, which is the full supported set. */
function hotkeyStyles() {
  const block = uiSource.slice(uiSource.indexOf("const keyMap = {"));
  return [...block.slice(0, block.indexOf('};')).matchAll(/'\d':\s*'([a-z-]+)'/g)].map((m) => m[1]);
}

test('DEFAULT_STYLE is a real style bound to a hotkey', () => {
  const match = uiSource.match(/const DEFAULT_STYLE = '([a-z-]+)';/);
  assert.ok(match, 'ui.js must declare DEFAULT_STYLE');
  assert.ok(hotkeyStyles().includes(match[1]),
    `DEFAULT_STYLE '${match[1]}' is not one of the hotkey styles`);
});

test('the boot default is skipped when a share or saved view is restoring', () => {
  // Without the guard an incoming link's style is silently discarded.
  const call = uiSource.slice(uiSource.indexOf('this._applyGlobalPostDefaults();'));
  const guarded = call.slice(0, call.indexOf('this._initOrbit();'));
  assert.match(guarded, /if\s*\(!this\._initialShareState\)/,
    'applying DEFAULT_STYLE must be gated on there being no incoming state');
  assert.match(guarded, /setStyle\(DEFAULT_STYLE/);
});

test('the static style label describes the PRE-INIT style, not the default', () => {
  const preInit = uiSource.match(/this\.activeStyle = '([a-z-]+)';/);
  assert.ok(preInit, 'ui.js must set an initial activeStyle');
  const label = markup.match(/id="active-style-name">([^<]+)</);
  assert.ok(label, 'index.html must carry the style readout');
  assert.equal(label[1].trim().toLowerCase(), preInit[1],
    'the markup label must match the pre-init activeStyle, or a restored share '
    + 'to that style shows a stale label');
});

test('sharelink mirrors the boot default, so a generated link is honest', () => {
  // ShareLinkManager reports _currentStyle in every link it builds; if it
  // disagrees with what the session renders, copied links carry the wrong style.
  const shareSource = fs.readFileSync(new URL('./sharelink.js', import.meta.url), 'utf8');
  const shareDefault = shareSource.match(/this\._currentStyle = '([a-z-]+)';/);
  const uiDefault = uiSource.match(/const DEFAULT_STYLE = '([a-z-]+)';/);
  assert.ok(shareDefault && uiDefault);
  assert.equal(shareDefault[1], uiDefault[1],
    'ShareLinkManager._currentStyle must match ui.js DEFAULT_STYLE');
});
