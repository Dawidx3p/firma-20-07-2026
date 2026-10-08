const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function mount() {
  const elements = new Map(), listeners = new Map(), storage = new Map();
  const inserted = [];
  const get = id => {
    if (!elements.has(id)) elements.set(id, {
      id, hidden: true, inert: false, isConnected: true,
      classList: { add() {}, remove() {}, contains() { return false; } },
      addEventListener() {}, focus() {}
    });
    return elements.get(id);
  };
  const document = {
    cookie: '', activeElement: null,
    body: { style: { overflow: '' }, children: [] },
    head: { appendChild(script) { inserted.push(script); } },
    createElement: () => ({}), getElementsByTagName: () => [],
    getElementById: id => id.startsWith('kairox-') ? inserted.find(script => script.id === id) : get(id),
    addEventListener: (event, handler) => listeners.set(event, handler)
  };
  const window = { location: { hostname: 'kairox.pl', pathname: '/', href: 'https://kairox.pl/' }, setTimeout() {} };
  const context = vm.createContext({ document, window, URL, console,
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    requestAnimationFrame: callback => callback()
  });
  vm.runInContext(fs.readFileSync(`${__dirname}/consent.js`, 'utf8'), context);
  return { window, inserted, context, listeners, storage };
}

test('analytics scripts and events wait for consent, and reacceptance restores grants', () => {
  const state = mount();
  state.listeners.get('DOMContentLoaded')();
  state.window.kairoxTrack('generate_lead', { source: 'website' });
  assert.equal(state.inserted.length, 0);
  vm.runInContext('acceptAnalytics()', state.context);
  assert.equal(state.inserted.length, 2);
  vm.runInContext('rejectAnalytics()', state.context);
  const before = state.window.dataLayer.length;
  state.window.kairoxTrack('generate_lead', { source: 'website' });
  assert.equal(state.window.dataLayer.length, before);
  vm.runInContext('acceptAnalytics()', state.context);
  assert.equal(state.inserted.length, 2);
  const updates = state.window.dataLayer.filter(args => args[0] === 'consent' && args[1] === 'update');
  assert.equal(updates.at(-1)[2].analytics_storage, 'granted');
  assert.equal(state.window.clarity.q.at(-1)[1].analytics_Storage, 'granted');
  state.window.kairoxTrack('generate_lead', {
    source: 'chat', service: 'campaign', email: 'private@example.com', message: 'private', sourcePage: '/?private=value'
  });
  const event = state.window.dataLayer.at(-1);
  assert.equal(event[0], 'event'); assert.equal(event[1], 'generate_lead');
  assert.deepEqual(JSON.parse(JSON.stringify(event[2])), { source: 'chat', service: 'campaign' });
});

test('blocked localStorage does not prevent accepting or rejecting the current choice', () => {
  const state = mount();
  vm.runInContext('localStorage.setItem = () => { throw new Error("blocked"); }; acceptAnalytics(); rejectAnalytics();', state.context);
  assert.equal(state.window['ga-disable-G-W0EJ50MX8K'], true);
});
