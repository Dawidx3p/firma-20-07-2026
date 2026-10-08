import test from 'node:test';
import assert from 'node:assert/strict';
import { inferService } from './chat-interest.mjs';
import { sendContact, validateContact } from './contact-service.mjs';

test('rozpoznawanie usługi i dopytania', () => {
  assert.equal(inferService('Ile kosztuje landing page?').id, 'campaign');
  assert.equal(inferService('A co obejmuje cena?', [{ role: 'user', content: 'Chcę stronę kampanii' }, { role: 'assistant', content: 'Audyt, Start, partnerstwo' }]).id, 'campaign');
  assert.equal(inferService('Strona komunikacyjna mnie interesuje').id, 'communication');
  assert.equal(inferService('Myślę o stałej współpracy').id, 'partnership');
  assert.equal(inferService('Porównaj audyt i Stronę Start'), null);
  assert.equal(inferService('Nie chcę audytu'), null);
  assert.equal(inferService('Jaka jest pogoda?', [{ role: 'assistant', content: 'Audyt komunikacji' }]), null);
  assert.equal(inferService('Ile kosztuje strona?'), null);
  assert.equal(inferService('Jaka jest pogoda?', [{ role: 'user', content: 'Ile kosztuje audyt?' }]), null);
});
test('formularz wymaga poprawnego kontaktu i świadomego zaznaczenia informacji', () => {
  assert.equal(validateContact({ email: 'test@example.com', consent: false }).valid, false);
  assert.equal(validateContact({ consent: true }).valid, false);
  assert.equal(validateContact({ email: 'bad', consent: true }).valid, false);
  assert.equal(validateContact({ phone: '+48 123 456 789', consent: true }).valid, true);
  assert.equal(validateContact({ email: 'test@example.com', phone: 'bad', consent: true }).valid, false);
});
test('wysyłka kontaktu idzie do istniejącego Formspree, bez pełnej rozmowy', async (t) => {
  const original = globalThis.fetch; t.after(() => { globalThis.fetch = original; });
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++; assert.equal(url, 'https://formspree.io/f/mojoqowy');
    const body = JSON.parse(options.body);
    assert.equal(body.service, 'Strona kampanii'); assert.equal(body.source, 'chat');
    assert.equal(body._replyto, 'test@example.com'); assert.equal(body.consent, true);
    assert(!('history' in body)); assert(!('transcript' in body));
    return Response.json({ ok: true });
  };
  await assert.rejects(sendContact({ email: 'test@example.com', phone: '', consent: false }));
  assert.equal(calls, 0);
  await sendContact({ email: 'test@example.com', phone: '', consent: true, source: 'chat', service: 'Strona kampanii' });
  assert.equal(calls, 1);
  globalThis.fetch = async () => new Response('', { status: 500 });
  await assert.rejects(sendContact({ email: 'test@example.com', phone: '', consent: true }), /Nie udało/);
});

test('zgłoszenie ze strony zachowuje usługę i źródłową podstronę', async (t) => {
  const original = globalThis.fetch; t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.service, 'Strona Start');
    assert.equal(body.sourcePage, '/modele-wspolpracy.html');
    assert(!('source' in body));
    return Response.json({ ok: true });
  };
  await sendContact({ email: 'test@example.com', phone: '', consent: true,
    service: 'Strona Start', sourcePage: '/modele-wspolpracy.html' });
});

test('zdarzenie zgłoszenia zawiera tylko kategorie i powstaje po udanej wysyłce', async (t) => {
  const originalFetch = globalThis.fetch, originalDocument = globalThis.document;
  t.after(() => { globalThis.fetch = originalFetch;
    if (originalDocument === undefined) delete globalThis.document; else globalThis.document = originalDocument;
  });
  const events = [];
  globalThis.document = { dispatchEvent: event => events.push(event) };
  globalThis.fetch = async () => new Response('', { status: 500 });
  const fields = { email: 'private@example.com', phone: '', consent: true, source: 'chat',
    service: 'Strona kampanii', challenge: 'Private text', sourcePage: '/?private=value' };
  await assert.rejects(sendContact(fields)); assert.equal(events.length, 0);
  globalThis.fetch = async () => Response.json({ ok: true });
  await sendContact(fields);
  assert.equal(events.length, 1); assert.equal(events[0].type, 'kairox:lead-sent');
  assert.deepEqual(events[0].detail, { source: 'chat', service: 'campaign' });
});
