import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('./section-scroll.js', import.meta.url), 'utf8');

function mount({ reduced = true, touch = false } = {}) {
  const listeners = new Map();
  const scrolls = [];
  const style = new Map();
  const root = { clientWidth: 390, clientHeight: 844, scrollHeight: 3884,
    style: { setProperty: style.set.bind(style) }, setAttribute() {}, removeAttribute() {} };
  let measurements = 0;
  const frames = new Map();
  let clock = 0;
  let frameId = 0;
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
    innerHeight: 844,
    scrollY: 0,
    scrollTo({ top }) { this.scrollY = top; scrolls.push(top); },
    addEventListener(type, listener) { listeners.set(type, listener); }
  };
  const panels = [84, 844, 1604, 2364, 3124].map(top => ({
    getClientRects: () => [{}],
    getBoundingClientRect: () => {
      measurements++;
      return { top: top - window.scrollY };
    }
  }));
  const document = {
    body: { classList: { contains: () => false } },
    documentElement: root,
    querySelector: selector => selector === '.view-controls' ? controls : null,
    querySelectorAll: () => panels
  };
  vm.runInNewContext(source, {
    document, window, Element: class {},
    matchMedia: query => ({ matches: query.includes('pointer: coarse') ? touch : reduced }),
    getComputedStyle: () => ({ scrollPaddingTop: '84px', scrollSnapAlign: 'start' }),
    performance: { now: () => clock },
    requestAnimationFrame(callback) { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); }
  });
  return {
    scrolls, position, frames, style,
    get measurements() { return measurements; },
    load() { listeners.get('load')?.(); },
    resize(width, height) {
      root.clientWidth = width;
      root.clientHeight = window.innerHeight = height;
      listeners.get('resize')();
    },
    frame(now) {
      clock = now;
      const callbacks = [...frames.values()];
      frames.clear();
      for (const callback of callbacks) callback(now);
    },
    wheel(deltaY, timeStamp, deltaMode = 0) {
      clock = timeStamp;
      let prevented = false;
      listeners.get('wheel')({
        target: document.body, deltaY, deltaX: 0, deltaMode, timeStamp,
        preventDefault() { prevented = true; }
      });
      assert(prevented);
    }
  };
}

test('wysokość paska przeglądarki nie zmienia punktów ekranów na dotyku', () => {
  const surface = mount({ touch: true });
  surface.load();
  const measurements = surface.measurements;
  surface.wheel(100, 10);
  surface.resize(390, 924);
  surface.wheel(100, 100);
  assert.equal(surface.style.get('--screen-viewport-height'), '844px');
  assert.equal(surface.measurements, measurements);
  assert.equal(surface.position.textContent, '3 / 5');
  assert.deepEqual(surface.scrolls, [760, 1520]);

  surface.resize(844, 390);
  assert.equal(surface.style.get('--screen-viewport-height'), '390px');
  assert(surface.measurements > measurements);
});

test('ostatni ekran zatrzymuje się na fizycznym końcu dokumentu', () => {
  for (const reduced of [true, false]) {
    const surface = mount({ touch: true, reduced });
    surface.load();
    for (const time of [0, 300, 600]) {
      surface.wheel(100, time);
      surface.frame(time + 240);
    }
    assert.equal(surface.scrolls.at(-1), 2280);

    surface.resize(390, 944);
    surface.wheel(100, 900);
    surface.frame(1070);
    surface.frame(1140);
    assert.equal(surface.scrolls.at(-1), 2940);
    assert(surface.scrolls.every(top => top <= 2940));
    assert.equal(surface.position.textContent, '5 / 5');

    const scrollCount = surface.scrolls.length;
    surface.wheel(100, 1200);
    assert.equal(surface.frames.size, 0);
    assert.equal(surface.scrolls.length, scrollCount);
  }
});

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

test('kilka gestów o ułamkowych wartościach linii dołącza do kolejki podczas animacji', () => {
  const surface = mount({ reduced: false });
  for (const time of [0, 86, 172]) {
    surface.wheel(.15, time, 1);
    surface.wheel(.32, time + 12, 1);
    surface.wheel(.08, time + 24, 1);
  }
  assert.equal(surface.position.textContent, '4 / 5');
  surface.frame(650);
  assert.equal(surface.scrolls.at(-1), 2280);
});

test('ułamkowy ogon w liniach nie przeskakuje, a kolejny lekki gest działa', () => {
  const surface = mount();
  surface.wheel(.42, 10, 1);
  surface.wheel(.28, 28, 1);
  surface.wheel(.12, 100, 1);
  surface.wheel(.04, 190, 1);
  surface.wheel(.02, 350, 1);
  assert.deepEqual(surface.scrolls, [760]);
  surface.wheel(.06, 410, 1);
  assert.deepEqual(surface.scrolls, [760, 1520]);
});

test('lekki ruch w przeciwną stronę odblokowuje pierwszy ekran dla ułamkowego gestu', () => {
  const surface = mount();
  surface.wheel(-.6, 10, 1);
  surface.wheel(-.05, 25, 1);
  surface.wheel(.04, 65, 1);
  assert.deepEqual(surface.scrolls, [760]);
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

test('kolejne pełne impulsy w liniach po krótkich przerwach dołączają do kolejki', () => {
  const surface = mount({ reduced: false });
  for (const time of [0, 90, 180, 270]) {
    surface.wheel(3, time, 1);
    surface.frame(time + 8);
    surface.wheel(3, time + 12, 1);
    surface.frame(time + 16);
  }
  assert.equal(surface.position.textContent, '5 / 5');
  assert.equal(surface.frames.size, 1);
  surface.frame(740);
  assert.equal(surface.scrolls.at(-1), 3040);
  assert(surface.scrolls.every((position, i) => i === 0 || position >= surface.scrolls[i - 1]));
  assert.equal(surface.frames.size, 0);
});

test('zmiana kierunku zostaje osobnym przejściem po scalonym ruchu', () => {
  const surface = mount({ reduced: false });
  surface.wheel(100, 10);
  surface.frame(55);
  surface.wheel(100, 70);
  surface.frame(115);
  surface.wheel(-100, 130);
  assert.equal(surface.position.textContent, '2 / 5');
  surface.frame(500);
  assert.equal(surface.scrolls.at(-1), 1520);
  assert.equal(surface.frames.size, 1);
  surface.frame(750);
  assert.equal(surface.scrolls.at(-1), 760);
  assert.equal(surface.frames.size, 0);
});

test('krańce odrzucają nadmiar i pozwalają na lekki gest z powrotem', () => {
  const surface = mount();
  surface.wheel(-180, 10);
  assert.deepEqual(surface.scrolls, []);
  surface.wheel(2, 40);
  for (let time = 110; time <= 600; time += 70) surface.wheel(150, time);
  assert.deepEqual(surface.scrolls, [760, 1520, 2280, 3040]);
  surface.wheel(-2, 610);
  assert.deepEqual(surface.scrolls, [760, 1520, 2280, 3040, 2280]);
});

test('przewinięcia poza zaplanowany ostatni ekran nie tworzą zaległych ruchów', () => {
  const surface = mount({ reduced: false });
  for (let time = 10; time < 600; time += 60) surface.wheel(90, time);
  assert.equal(surface.position.textContent, '5 / 5');
  surface.frame(1080);
  assert.equal(surface.scrolls.at(-1), 3040);
  assert.equal(surface.frames.size, 0);
  surface.wheel(-2, 1100);
  surface.frame(1350);
  assert.equal(surface.scrolls.at(-1), 2280);
  assert.equal(surface.frames.size, 0);
});
