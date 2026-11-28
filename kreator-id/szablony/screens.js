const scrollList = document.querySelector('.entries');
const mobile = window.matchMedia('(max-width: 760px)');
const screens = document.querySelector('main');
const nextScreen = document.querySelector('.jump');
const previousScreen = document.querySelector('.back');
let touchStart;
let wheelGesture;

function screenLink(x, y, atListStart) {
  const horizontal = Math.abs(x) > Math.abs(y);
  const direction = horizontal ? x : y;
  if (window.location.hash !== '#profile') {
    return direction > 0 ? nextScreen : null;
  }
  return direction < 0 && (horizontal || atListStart) ? previousScreen : null;
}

screens.addEventListener('touchstart', (event) => {
  touchStart = undefined;
  if (!mobile.matches || event.touches.length !== 1 || event.target.closest('input')) return;
  const { clientX, clientY } = event.touches[0];
  touchStart = { clientX, clientY, atListStart: scrollList.scrollTop <= 1 };
}, { passive: true });

screens.addEventListener('touchmove', (event) => {
  if (!mobile.matches || !touchStart || event.touches.length !== 1 || !event.cancelable) return;
  const { clientX, clientY } = event.touches[0];
  const x = touchStart.clientX - clientX;
  const y = touchStart.clientY - clientY;
  if (Math.max(Math.abs(x), Math.abs(y)) >= 8 && screenLink(x, y, touchStart.atListStart)) {
    event.preventDefault();
  }
}, { passive: false });

screens.addEventListener('touchend', (event) => {
  const start = touchStart;
  touchStart = undefined;
  if (!mobile.matches || !start || event.touches.length) return;
  const { clientX, clientY } = event.changedTouches[0];
  const x = start.clientX - clientX;
  const y = start.clientY - clientY;
  if (Math.max(Math.abs(x), Math.abs(y)) < 55) return;
  screenLink(x, y, start.atListStart)?.click();
}, { passive: true });

screens.addEventListener('touchcancel', () => {
  touchStart = undefined;
}, { passive: true });

// One screen per gesture. Decaying trackpad momentum never extends a timer;
// a reversal or fresh acceleration can start another gesture immediately.
screens.addEventListener('wheel', (event) => {
  if (!mobile.matches || event.ctrlKey || event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
  const x = event.deltaX * scale;
  const y = event.deltaY * scale;
  const horizontal = Math.abs(x) > Math.abs(y);
  const magnitude = Math.max(Math.abs(x), Math.abs(y));
  if (!magnitude) return;
  const direction = Math.sign(horizontal ? x : y);
  const now = performance.now();
  const fresh = !wheelGesture || wheelGesture.horizontal !== horizontal ||
    wheelGesture.direction !== direction || now - wheelGesture.time >= 60 ||
    (magnitude >= 8 && magnitude > wheelGesture.magnitude * 1.5);
  if (fresh) {
    wheelGesture = { direction, horizontal, distance: 0, switched: false,
      atListStart: scrollList.scrollTop <= 1 };
  }
  wheelGesture.time = now;
  wheelGesture.magnitude = magnitude;
  wheelGesture.distance += magnitude;
  if (wheelGesture.switched) {
    if (event.cancelable) event.preventDefault();
    return;
  }
  const link = screenLink(x, y, wheelGesture.atListStart);
  if (!link || !event.cancelable) return;
  event.preventDefault();
  if (wheelGesture.distance < 28) return;
  wheelGesture.switched = true;
  link.click();
}, { passive: false });
