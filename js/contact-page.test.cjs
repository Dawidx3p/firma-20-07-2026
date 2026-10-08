const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function mount(sendContact, search = '?service=start&source=%2Fmodele-wspolpracy.html', referrer = '') {
  const fields = new Map();
  const getField = id => {
    if (!fields.has(id)) fields.set(id, {
      id, value: '', checked: false, hidden: true, disabled: false, textContent: '', options: [], selectedOptions: [],
      attributes: {}, setAttribute(name, value) { this.attributes[name] = value; }, focus() {},
      classList: { add() {}, remove() {}, toggle() {} },
      parentElement: { classList: { add() {}, remove() {}, toggle() {} } },
      handlers: {}, addEventListener(name, handler) {
        const previous = this.handlers[name];
        this.handlers[name] = (...args) => { previous?.(...args); return handler(...args); };
      },
      reset() { for (const field of fields.values()) { field.value = ''; field.checked = false; } }
    });
    return fields.get(id);
  };
  const context = vm.createContext({
    URL, URLSearchParams, __sendContact: sendContact,
    document: {
      getElementById: getField, querySelectorAll: () => [], referrer,
      currentScript: { src: 'https://kairox.pl/js/contact-page.js' }
    },
    window: { location: { origin: 'https://kairox.pl', pathname: '/formularz-kontaktowy.html', search }, setTimeout() {} }
  });
  // Isolate the module dependency; execute the actual controller and its event handlers.
  const source = fs.readFileSync(`${__dirname}/contact-page.js`, 'utf8')
    .replace('await import(contactServiceUrl)', 'await Promise.resolve({ sendContact: __sendContact })');
  vm.runInContext(source, context);
  getField('email').value = 'test@example.com';
  getField('privacy').checked = true;
  getField('email').handlers.input();
  return { getField, submit: () => getField('contactForm').handlers.submit({ preventDefault() {} }) };
}

test('editing contact fields cannot unlock a pending request or send it twice', async () => {
  let release, calls = 0, payload;
  const pending = new Promise(resolve => { release = resolve; });
  const { getField, submit } = mount(async fields => { calls++; payload = fields; await pending; });
  assert.equal(getField('contactServiceContext').textContent, 'Temat rozmowy: Strona Start');
  assert.equal(getField('contactServiceContext').hidden, false);
  const request = submit();
  await Promise.resolve();
  getField('email').value = 'other@example.com';
  getField('email').handlers.input();
  getField('privacy').handlers.change();
  assert.equal(getField('submitButton').disabled, true);
  await submit();
  assert.equal(calls, 1);
  assert.equal(payload.service, 'Strona Start');
  assert.equal(payload.sourcePage, '/modele-wspolpracy.html');
  release(); await request;
  assert.equal(getField('contactForm').hidden, true);
  assert.equal(getField('contactSuccessActions').hidden, false);
  await submit(); assert.equal(calls, 1);
});

test('invalid contact gives a specific accessible error without submitting', async () => {
  let calls = 0;
  const { getField, submit } = mount(async () => { calls++; });
  getField('email').value = 'bad-address';
  await submit();
  assert.equal(calls, 0);
  assert.equal(getField('email').attributes['aria-invalid'], 'true');
  assert.match(getField('emailError').textContent, /poprawny e-mail/);
  getField('email').handlers.input();
  assert.equal(getField('email').attributes['aria-invalid'], 'false');
});

test('a failed request preserves the fields and permits retry', async () => {
  let calls = 0;
  const { getField, submit } = mount(async () => { if (++calls === 1) throw new Error('offline'); });
  await submit();
  assert.equal(getField('email').value, 'test@example.com');
  assert.equal(getField('submitButton').disabled, false);
  await submit();
  assert.equal(calls, 2);
});

test('unknown service and external source are ignored; same-origin referrer supplies the page', async () => {
  let payload;
  const unknown = mount(async fields => { payload = fields; }, '?service=__proto__&source=https%3A%2F%2Fexample.com%2F');
  assert.equal(unknown.getField('contactServiceContext').hidden, true);
  await unknown.submit();
  assert.equal(payload.service, '');
  assert.equal(payload.sourcePage, '/formularz-kontaktowy.html');
  // Inspect the actual submission to ensure only the pathname is included.
  const form = mount(async fields => { payload = fields; }, '', 'https://kairox.pl/metoda.html?secret=excluded');
  await form.submit();
  assert.equal(payload.sourcePage, '/metoda.html');
});
