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
test('linki do założyciela, wizualizacji i przykładowego audytu zachowują kotwice', () => {
  for (const path of ['/#zalozyciel', '/index.html#zalozyciel', '/strony-dla-firm/', '/strony-dla-firm/#wizualizacja', '/audyt-komunikacji.html#przykladowy-audyt', '/formularz-kontaktowy.html?service=audit#kontakt']) {
    for (const text of [`https://kairox.pl${path}.`, `[Zobacz szczegóły](https://kairox.pl${path})`]) {
      assert.equal(formatTokens(text).find(t => t.type === 'link')?.href, path);
    }
  }
  assert.equal(formatTokens('(https://kairox.pl/#zalozyciel).').find(t => t.type === 'link')?.href, '/#zalozyciel');
});

test('dopisek z pełnym linkiem do podstrony lub sekcji jest klikalny', () => {
  for (const path of ['/realizacje.html#bieg-rzeczy', '/czysty-uklad/jak-zamowic/', '/sloj-i-forma/renowacja/', '/bieg-rzeczy/o-warsztacie/', '/dlaczego-strony-nie-sprzedaja.html', '/polityka-prywatnosci.html']) {
    const url = `https://kairox.pl${path}`;
    assert.deepEqual(formatTokens(`Więcej informacji znajdziesz tu: ${url}`), [
      { type: 'text', text: 'Więcej informacji znajdziesz tu: ' },
      { type: 'link', text: url, href: path },
    ]);
  }
  for (const path of ['/printer/', '/bieg-rzeczy/koncepcja/', '/nieznana-podstrona.html']) assert(!formatTokens(`https://kairox.pl${path}`).some(t => t.type === 'link'));
});
