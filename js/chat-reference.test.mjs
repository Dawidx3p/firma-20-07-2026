import test from 'node:test';
import assert from 'node:assert/strict';
import { withReference } from './chat-reference.mjs';
import { formatTokens } from './chat-format.mjs';

test('ucięta odpowiedź o miesięcznej opiece dostaje pełny link do Partnerstwa', () => {
 const reply = 'Miesięczna opieka kosztuje 1990 zł. Więcej informacji:';
 const result = withReference(reply, 'Ile kosztuje miesięczna opieka?');
 assert.equal(result, 'Miesięczna opieka kosztuje 1990 zł.\n\nWięcej informacji znajdziesz tu: https://kairox.pl/partnerstwo.html');
 assert.equal(formatTokens(result).filter(t => t.type === 'link').length, 1);
});
test('dopytanie o cenę zachowuje usługę, a porównanie prowadzi do modeli', () => {
 assert(withReference('1990 zł brutto.', 'A co obejmuje cena?', [{role:'user',content:'Co obejmuje Partnerstwo?'}]).endsWith('/partnerstwo.html'));
 assert(withReference('Od 4900 zł.', 'Ile kosztuje Strona Start?').endsWith('/strony-dla-firm/'));
 assert(withReference('Porównaj zakresy.', 'Audyt czy Strona Start?').endsWith('/modele-wspolpracy.html'));
});
test('projekty i wizualizacja prowadzą do właściwych sekcji', () => {
 for (const [question, path] of [['Co pokazuje Bieg Rzeczy?', '/realizacje.html#bieg-rzeczy'], ['Co obejmuje bezpłatna wizualizacja?', '/strony-dla-firm/#wizualizacja']]) assert(withReference('Opis.', question).endsWith(path));
});
test('powitania nie dostają przypadkowego linku, istniejący link nie jest dublowany', () => {
 assert.equal(withReference('Cześć! Poznaj ofertę.', 'Cześć!'), 'Cześć! Poznaj ofertę.');
 const result = withReference('Opis. Więcej informacji znajdziesz tu: https://kairox.pl/partnerstwo.html', 'Co obejmuje Partnerstwo?');
 assert.equal(formatTokens(result).filter(t => t.type === 'link').length, 1);
 assert.equal((result.match(/Więcej informacji/g) || []).length, 1);
});
test('aplikacja nie dopisuje obcego ani wymyślonego adresu', () => {
 const result = withReference('Sprawdź https://evil.example/ i https://kairox.pl/admin.', 'Co to jest?');
 assert.equal(formatTokens(result).filter(t => t.type === 'link').length, 0);
});
