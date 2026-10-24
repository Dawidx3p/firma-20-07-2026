import test from 'node:test';
import assert from 'node:assert/strict';
import { initProjectInvite } from './project-invite.mjs';
test('portfolio i opisy realizacji nie inicjują banera ani timerów', () => {
  const original = globalThis.location;
  try {
    for (const pathname of ['/realizacje.html', '/realizacje/galeria-klik.html', '/realizacje/my-trip-world.html']) {
      globalThis.location = { pathname };
      // No browser document/storage is provided: the guard must return before touching either.
      assert.doesNotThrow(initProjectInvite, pathname);
    }
  } finally { if (original === undefined) delete globalThis.location; else globalThis.location = original; }
});
