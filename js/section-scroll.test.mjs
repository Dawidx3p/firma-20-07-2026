import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('./section-scroll.js', import.meta.url), 'utf8');

function mount() {
  const listeners = new Map();
  const scrolls = [];
  const root = { clientHeight: 844, scrollHeight: 3792, removeAttribute() {} };
  const position = {};
  const previous = { addEventListener() {}, setAttribute() {} };
  const next = { addEventListener() {}, setAttribute() {} };
  const controls = {
    querySelector(selector) {
      if (selector === '.view-position') return position;
      return selector.includes('-1') ? previous : next;
    }
  };
  const window = {
    scrollY: 0,
    scrollTo({ top }) { this.scrollY = top; scrolls.push(top); },
    addEventListener(type, listener) { listeners.set(type, listener); }
  };
  const panels = [84, 844, 1604, 2364, 3124].map(top => ({
    getClientRects: () => [{}],
    getBoundingClientRect: () => ({ top: top - window.scrollY })
  }));
  const document = {
    body: { classList: { contains: () => false } },
    documentElement: root,
    querySelector: selector => selector === '.view-controls' ? controls : null,
    querySelectorAll: () => panels
  };
  vm.runInNewContext(source, {
    document, window, Element: class {}, matchMedia: () => ({ matches: true }),
    getComputedStyle: () => ({ scrollPaddingTop: '84px', scrollSnapAlign: 'start' }),
    cancelAnimationFrame() {}
  });
  return {
    scrolls, position,
    wheel(deltaY, timeStamp, deltaMode = 0) {
      let prevented = false;
      listeners.get('wheel')({
        target: document.body, deltaY, deltaX: 0, deltaMode, timeStamp,
        preventDefault() { prevented = true; }
      });
      assert(prevented);
    }
  };
}

test('zanikające impulsy jednego gestu przesuwają widok tylko o jeden ekran', () => {
  const surface = mount();
  surface.wheel(100, 10);
  surface.wheel(50, 20);
  surface.wheel(14, 35);
  surface.wheel(1, 55);
  assert.deepEqual(surface.scrolls, [760]);
  assert.equal(surface.position.textContent, '2 / 5');
});

test('kolejne gesty przechodzą o kolejne ekrany i pozwalają wrócić', () => {
  const surface = mount();
  surface.wheel(100, 10);
  surface.wheel(100, 70);
  surface.wheel(100, 130);
  surface.wheel(-100, 180);
  assert.deepEqual(surface.scrolls, [760, 1520, 2280, 1520]);
  assert.equal(surface.position.textContent, '3 / 5');
});

test('opóźniony i słabszy impuls pikselowy nie rozpoczyna następnego gestu', () => {
  const surface = mount();
  surface.wheel(64, 10);
  surface.wheel(48, 26);
  surface.wheel(34, 42);
  surface.wheel(20, 115);
  surface.wheel(8, 170);
  surface.wheel(2, 352);
  assert.deepEqual(surface.scrolls, [760]);
  surface.wheel(8, 425);
  assert.deepEqual(surface.scrolls, [760, 1520]);
});

test('końcowy impuls w liniach nie rozpoczyna nowego przewinięcia', () => {
  const surface = mount();
  surface.wheel(3, 10, 1);
  surface.wheel(3, 26, 1);
  surface.wheel(1, 44, 1);
  surface.wheel(1, 119, 1);
  surface.wheel(1, 285, 1);
  assert.deepEqual(surface.scrolls, [760]);
  surface.wheel(3, 341, 1);
  assert.deepEqual(surface.scrolls, [760, 1520]);
});

test('oddzielne skoki kółka liczone w liniach nadal przewijają po ekranie', () => {
  const surface = mount();
  surface.wheel(3, 10, 1);
  surface.wheel(3, 82, 1);
  surface.wheel(3, 154, 1);
  assert.deepEqual(surface.scrolls, [760, 1520, 2280]);
});

test('lekki szybszy gest rozpoznajemy także przed końcem animacji', () => {
  const surface = mount();
  surface.wheel(6, 10);
  surface.wheel(14, 26);
  surface.wheel(4, 42);
  surface.wheel(.5, 58);
  surface.wheel(1.3, 71);
  assert.deepEqual(surface.scrolls, [760, 1520]);
});
