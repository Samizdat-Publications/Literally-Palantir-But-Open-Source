/**
 * The HUD summary is the one isolated text call in the app, which makes it the
 * seam where a provider can be swapped. These tests pin the selection rules and
 * the two response shapes, because a wrong pick fails as a silent 503 and a
 * wrong extraction fails as a permanently blank HUD line — neither throws.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveHudSummaryProvider,
  extractGeminiResponseText,
  hudSummaryInstruction,
} from '../vite.config.js';

test('Gemini is preferred when both keys are present', () => {
  assert.equal(
    resolveHudSummaryProvider({ GEMINI_API_KEY: 'g', OPENAI_API_KEY: 'o' }),
    'gemini',
  );
});

test('OpenAI still answers for an install that only configured it', () => {
  assert.equal(resolveHudSummaryProvider({ OPENAI_API_KEY: 'o' }), 'openai');
});

test('no keys yields null, so the route can 503 rather than call upstream', () => {
  assert.equal(resolveHudSummaryProvider({}), null);
});

test('an explicit provider wins over the preference order', () => {
  assert.equal(
    resolveHudSummaryProvider({ HUD_SUMMARY_PROVIDER: 'openai', GEMINI_API_KEY: 'g', OPENAI_API_KEY: 'o' }),
    'openai',
  );
  assert.equal(
    resolveHudSummaryProvider({ HUD_SUMMARY_PROVIDER: 'GEMINI', GEMINI_API_KEY: 'g' }),
    'gemini',
  );
});

test('an explicit provider whose key is missing yields null, never a silent fallback', () => {
  // Pinning a provider while comparing them must not quietly answer from the
  // other one — that would make the comparison meaningless.
  assert.equal(
    resolveHudSummaryProvider({ HUD_SUMMARY_PROVIDER: 'gemini', OPENAI_API_KEY: 'o' }),
    null,
  );
});

test('Gemini text is pulled from the candidates/parts shape', () => {
  const data = { candidates: [{ content: { parts: [{ text: 'Austin downtown traffic live' }] } }] };
  assert.equal(extractGeminiResponseText(data), 'Austin downtown traffic live');
});

test('a multi-part Gemini answer is joined, not truncated to the first part', () => {
  const data = { candidates: [{ content: { parts: [{ text: 'Austin' }, { text: 'downtown live' }] } }] };
  assert.equal(extractGeminiResponseText(data), 'Austin downtown live');
});

test('an unexpected or blocked Gemini response returns empty rather than throwing', () => {
  // A safety block returns candidates with no content; the caller must render a
  // missing summary, not crash the proxy.
  for (const data of [{}, { candidates: [] }, { candidates: [{}] }, { promptFeedback: { blockReason: 'SAFETY' } }, null]) {
    assert.equal(extractGeminiResponseText(data), '');
  }
});

test('both providers are held to the identical instruction', () => {
  const text = hudSummaryInstruction();
  assert.match(text, /exactly five words/);
  assert.match(text, /Do not infer from coordinates or invent a place/);
  assert.match(text, /KEYHOLE/, 'the instruction must carry the current brand name');
});
