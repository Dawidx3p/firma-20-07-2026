import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('./section-scroll.js', import.meta.url), 'utf8');
function previousSectionStop(bottomPadding) {
  const listeners = new Map(), scrolls = [];
  const y = 916, height = 844;
  const body = {};
  const sections = [{ top: 0, bottom: 1000 }, { top: 1000, bottom: 2000 }].map(box => ({ getBoundingClientRect: () => ({ top: box.top - y, bottom: box.bottom - y }) }));
  const document = { body, documentElement: { scrollHeight: 2000 }, querySelectorAll: () => sections, querySelector: () => null, addEventListener() {} };
  const window = { innerHeight: height, scrollY: y, matchMedia: () => ({ matches: false, addEventListener() {} }), addEventListener: (type, fn) => listeners.set(type, fn), scrollTo: value => scrolls.push(value) };
  vm.runInNewContext(source, { document, window, Element: class {}, getComputedStyle: () => ({ scrollPaddingTop: '84px', scrollPaddingBottom: `${bottomPadding}px` }), performance: { now: () => 1000 }, setTimeout: () => 1, clearTimeout() {} });
  let prevented = false;
  listeners.get('wheel')({ target: body, cancelable: true, deltaY: -800, deltaX: 0, deltaMode: 0, preventDefault() { prevented = true; } });
  assert(prevented);
  return scrolls.at(-1).top;
}
test('powrót do długiej sekcji uwzględnia dolny pasek i odstęp', () => {
  const stop = previousSectionStop(72);
  assert.equal(stop, 228);
  // Section bottom lands 12px above the 48px button positioned 12px from the viewport bottom.
  assert.equal(1000 - stop, 844 - 72);
});
test('bez dolnego paska dotychczasowy punkt zatrzymania nie zmienia się', () => {
  assert.equal(previousSectionStop(0), 156);
});
