import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTokens } from './chat-format.mjs';
test('pogrubienie i link do właściwej podstrony', () => {
  const tokens = formatTokens('Koszt: **990 zł**. [Zobacz audyt](https://kairox.pl/audyt-komunikacji.html)');
  assert(tokens.some(t => t.type === 'strong' && t.text === '990 zł'));
  assert(tokens.some(t => t.type === 'link' && t.href === '/audyt-komunikacji.html'));
  assert.equal(formatTokens('https://kairox.pl/metoda.html.').at(-1).text, '.');
});
test('model nie może wstawić obcej domeny, skryptu ani nieznanej podstrony', () => {
  for (const url of ['javascript:alert', 'https://evil.test/metoda.html', 'https://kairox.pl.evil.test/metoda.html', 'https://kairox.pl/admin', 'https://user:pass@kairox.pl/metoda.html']) {
    assert(!formatTokens(`[Kliknij](${url})`).some(t => t.type === 'link'));
  }
  const html = '<img src=x onerror=alert(1)>';
  assert.deepEqual(formatTokens(html), [{ type: 'text', text: html }]);
});
