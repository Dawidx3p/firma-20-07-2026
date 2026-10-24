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
    assert.equal(getSuggestions('Co obejmuje audyt komunikacji?').length, 2);
    assert.equal(calls, 0);
  } finally { globalThis.fetch = originalFetch; }
});

test('connector losuje wyłącznie pytania wskazanego projektu, bez powtórzenia z rozmowy', async () => {
  const { CHAT_TOPICS } = await import('./chat-topics.mjs');
  for (const [connector, topic] of Object.entries(CHAT_TOPICS)) {
    assert(topic.questions.length >= 3, connector);
    assert.equal(new Set(topic.questions).size, topic.questions.length);
    const asked = topic.questions[0];
    const sample = getSuggestions(asked, [], connector, () => 0.5);
    assert(sample.length === 2, connector);
    assert(!sample.includes(asked));
    assert(sample.every(q => topic.questions.includes(q)));
    const histories = [{ role: 'user', content: topic.questions[1] }];
    assert(!getSuggestions(asked, histories, connector).includes(topic.questions[1]));
  }
});
test('kolejność i dobór podpowiedzi zmieniają się przy losowaniu', async () => {
  const { CHAT_TOPICS } = await import('./chat-topics.mjs');
  const connector = Object.keys(CHAT_TOPICS)[0];
  assert.notDeepEqual(getSuggestions('pytanie', [], connector, () => 0), getSuggestions('pytanie', [], connector, () => 0.999));
  assert.equal(getSuggestions('pytanie', [], '__proto__').length, 2);
});
