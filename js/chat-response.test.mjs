import test from 'node:test';
import assert from 'node:assert/strict';
import { buildChatResponse } from './chat-response.mjs';
import { CHAT_TOPICS } from './chat-topics.mjs';
import { getSuggestions } from './chat-suggestions.mjs';
import { formatTokens } from './chat-format.mjs';
import { existsSync, readFileSync } from 'node:fs';

test('pełny przepływ tematu: metadane, klikalny link i lokalne pytania właściwego projektu', () => {
  for (const [connector, topic] of Object.entries(CHAT_TOPICS)) {
    assert(/^[a-z][a-z0-9_]*$/.test(connector));
    const result = buildChatResponse(`[connector:${connector}]\nPrzykładowa odpowiedź.`, 'Powiedz więcej');
    assert.equal(result.connector, connector);
    assert(!result.reply.includes('[connector:'));
    assert.equal(formatTokens(result.reply).find(t => t.type === 'link')?.href, topic.path);
    assert(getSuggestions('Powiedz więcej', [], result.connector).every(q => topic.questions.includes(q)));
    const [path, anchor] = topic.path.split('#');
    const file = '.' + path + (path.endsWith('/') ? 'index.html' : '');
    assert(existsSync(file), file);
    if (anchor) assert(readFileSync(file, 'utf8').includes(`id="${anchor}"`), topic.path);
  }
});
test('brak lub błędny connector nie ujawnia protokołu ani nie blokuje odpowiedzi', () => {
  for (const marker of ['', '[connector:fake]\n', '[connector:__proto__]\n']) {
    const result = buildChatResponse(marker + 'Koszt to 1990 zł. Więcej informacji:', 'Ile kosztuje miesięczna opieka?');
    assert.equal(result.connector, 'partnership');
    assert(result.reply.endsWith('https://kairox.pl/partnerstwo.html'));
    assert(!result.reply.includes('[connector:'));
  }
  assert(buildChatResponse('[connector:bieg_rzeczy]', 'Hej').error);
});
test('kliknięte pytanie zachowuje temat również przy braku markera lub błędzie klasyfikacji', () => {
  const question = CHAT_TOPICS.sloj_renovation.questions[0];
  for (const marker of ['', '[connector:home]\n']) {
    const result = buildChatResponse(marker + 'To koncepcja podstrony o renowacji.', question);
    assert.equal(result.connector, 'sloj_renovation');
    assert(result.reply.endsWith('https://kairox.pl/sloj-i-forma/renowacja/'));
  }
});
