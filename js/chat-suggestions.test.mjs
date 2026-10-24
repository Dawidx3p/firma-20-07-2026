import test from 'node:test';
import assert from 'node:assert/strict';
import { OPENING_QUESTIONS, getOpeningSuggestions, getSuggestions } from './chat-suggestions.mjs';

test('pula zawiera 20 krótkich, różnych pytań', () => {
  assert.equal(OPENING_QUESTIONS.length, 20);
  assert.equal(new Set(OPENING_QUESTIONS).size, 20);
  assert(OPENING_QUESTIONS.every(q => q.endsWith('?') && q.length <= 42));
});
test('losowanie daje 3 różne pytania i nie zmienia puli', () => {
  const original = [...OPENING_QUESTIONS];
  const firstChoices = new Set();
  for (let i = 0; i < 20; i++) {
    const sample = getOpeningSuggestions(() => i / 20);
    assert.equal(sample.length, 3);
    assert.equal(new Set(sample).size, 3);
    assert(sample.every(q => OPENING_QUESTIONS.includes(q)));
    firstChoices.add(sample[0]);
  }
  assert.equal(firstChoices.size, 20);
  assert.deepEqual(OPENING_QUESTIONS, original);
});
test('podpowiedzi powstają lokalnie bez dostawcy AI', () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = () => { calls++; throw new Error('Podpowiedzi nie mogą wywoływać API'); };
  try {
    assert.equal(getSuggestions().length, 3);
    assert.equal(getSuggestions('Co obejmuje audyt komunikacji?').length, 3);
    assert.equal(calls, 0);
  } finally { globalThis.fetch = originalFetch; }
});
