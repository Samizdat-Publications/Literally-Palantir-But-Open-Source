/**
 * A CRLF checkout fails ~25 tests on Windows and only on Windows, with
 * messages that every one of them point somewhere other than the real cause
 * ("applyVisualState is missing from ui.js", a busted schema hash). The
 * .gitattributes file is the fix; this is the guard on the fix.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const attributes = readFileSync(new URL('../.gitattributes', import.meta.url), 'utf8');

test('.gitattributes forces LF in the working tree on every platform', () => {
  // `text=auto` alone normalizes the REPOSITORY but still hands Windows CRLF
  // in the working tree, which is where the tests read from. `eol=lf` is the
  // half that actually matters here.
  assert.match(
    attributes,
    /^\*\s+text=auto\s+eol=lf\s*$/m,
    '.gitattributes must carry `* text=auto eol=lf` — text=auto alone still checks out CRLF on Windows',
  );
});

test('binary assets are exempt from conversion', () => {
  // Left to `text=auto`, git guesses. A wrong guess corrupts the file on
  // checkout, and the repo ships .glb models and .gif captures.
  for (const ext of ['png', 'gif', 'glb']) {
    assert.match(
      attributes,
      new RegExp(`^\\*\\.${ext}\\s+binary\\s*$`, 'm'),
      `*.${ext} must be marked binary`,
    );
  }
});

test('the byte-asserting sources are actually LF on disk right now', () => {
  // The direct check: if this run is on a CRLF checkout, say so here — with
  // the real reason — instead of letting it surface as two dozen unrelated
  // failures elsewhere in the suite.
  for (const rel of ['../vite.config.js', '../src/ui.js', '../src/scenes/recipes.js']) {
    const text = readFileSync(new URL(rel, import.meta.url), 'utf8');
    assert.ok(
      !text.includes('\r\n'),
      `${rel} has CRLF line endings — the byte-exact tests will fail. Re-checkout with .gitattributes applied: git rm --cached -r . && git reset --hard`,
    );
  }
});
