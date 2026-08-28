/**
 * Guards the drag-registration contract.
 *
 * The drag machinery in ui.js (z-promotion, viewport clamping, localStorage
 * persistence) shipped complete but dormant: `_initPanelDrag` looked up a
 * `.panel-drag-handle` element that index.html never contained, so the spec was
 * filtered out and NO panel was draggable. These tests fail if that pairing
 * breaks again in either direction.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ui = fs.readFileSync(new URL('./ui.js', import.meta.url), 'utf8');

/** The registry ui.js binds against, read from source so the test cannot drift. */
function registeredPanelIds() {
  const start = ui.indexOf('const DRAGGABLE_PANEL_IDS = Object.freeze([');
  assert.ok(start > 0, 'DRAGGABLE_PANEL_IDS must remain a single frozen literal array');
  const end = ui.indexOf(']);', start);
  return [...ui.slice(start, end).matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]);
}

/** The element carrying id="<panelId>", far enough to include its header row. */
function panelMarkup(panelId) {
  const at = html.indexOf(`id="${panelId}"`);
  assert.ok(at > 0, `#${panelId} must exist in index.html`);
  return html.slice(at, at + 900);
}

test('every registered panel has a drag handle in the markup', () => {
  const ids = registeredPanelIds();
  assert.ok(ids.length >= 7, `expected the full panel set, got ${ids.length}`);
  for (const id of ids) {
    assert.match(
      panelMarkup(id),
      /class="[^"]*panel-drag-handle[^"]*"/,
      `#${id} is registered as draggable but its markup has no .panel-drag-handle — `
        + 'this is the exact pairing that shipped broken upstream',
    );
  }
});

test('no panel carries a drag handle without being registered', () => {
  const ids = new Set(registeredPanelIds());
  const handleCount = [...html.matchAll(/class="[^"]*panel-drag-handle[^"]*"/g)].length;
  assert.equal(
    handleCount,
    ids.size,
    'a .panel-drag-handle with no matching DRAGGABLE_PANEL_IDS entry is inert markup',
  );
});

test('dock-anchored panels stay out of the registry', () => {
  const ids = registeredPanelIds();
  // control-panel's header is a <button>, which _makePanelDraggable's guard
  // rejects; location-bar has no header row. Registering either yields a panel
  // that silently refuses to drag.
  assert.ok(!ids.includes('control-panel'), 'control-panel header is a <button> — undraggable by design');
  assert.ok(!ids.includes('location-bar'), 'location-bar is dock-anchored with no header row');
});

test('the reset control exists and is wired', () => {
  assert.match(html, /id="panel-layout-reset"/, 'reset control must exist in the markup');
  assert.match(ui, /resetPanelLayout\(\)\s*\{/, 'resetPanelLayout must be defined');
  assert.match(ui, /getElementById\('panel-layout-reset'\)/, 'reset control must be wired in ui.js');
});

test('reset clears the same storage keys the drag path writes', () => {
  const start = ui.indexOf('resetPanelLayout()');
  const body = ui.slice(start, start + 900);
  assert.match(
    body,
    /removeItem\(this\._panelStorageKey\(id\)\)/,
    'reset must clear positions through the same key helper _savePanelPosition uses, '
      + 'or a "reset" layout reappears on reload',
  );
});
