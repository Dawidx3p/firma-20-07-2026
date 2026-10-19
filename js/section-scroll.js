(() => {
  "use strict";

  // Trackpad control can be toggled independently of native touch scrolling.
  const TRACKPAD_CONTROL_ENABLED = true;
  if (!TRACKPAD_CONTROL_ENABLED) return;

  const sections = Array.from(document.querySelectorAll("main > section"));
  if (sections.length < 2) return;

  // Trackpad input stays free inside a section. A deliberate gesture can cover
  // at most one boundary; the remaining inertial events belong to that gesture.
  const SNAP_DISTANCE = 80;
  const SCROLL_SPEED = 1;
  const STRONG_DELTA = 48;
  const STRONG_DISTANCE = 140;
  const SAMPLE_WINDOW = 120;
  const GESTURE_PAUSE = 120;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const nativeTouchScroll = window.matchMedia("(hover: none) and (pointer: coarse)");
  let gesture = null;
  let timer;

  function reset() {
    clearTimeout(timer);
    gesture = null;
  }

  function leaveNative(event) {
    if (nativeTouchScroll.matches || reducedMotion.matches || document.querySelector(
      'body.menu-open, .kx-chat-panel:not([hidden]), .consent-banner.is-visible, ' +
      'input:focus, textarea:focus, select:focus, [contenteditable="true"]:focus'
    )) return true;
    for (let node = event.target; node instanceof Element && node !== document.body; node = node.parentElement) {
      if (node.matches('input, textarea, select, [contenteditable="true"]') ||
          (node.scrollHeight > node.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(node).overflowY))) return true;
    }
    return false;
  }

  function nextBoundary(y, direction) {
    const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const boxes = sections.map(section => {
      const box = section.getBoundingClientRect();
      return { top: Math.max(0, box.top + y - padding), bottom: box.bottom + y };
    });
    let index = boxes.findLastIndex(box => box.top <= y + 1);
    if (y + padding >= boxes[boxes.length - 1].bottom) index = boxes.length;
    if (direction > 0) return boxes[index + 1]?.top ?? null;
    // Enter the END of a long previous section when moving upward.
    const previous = boxes[index - 1];
    return previous ? Math.max(previous.top, previous.bottom - window.innerHeight) : null;
  }

  function onWheel(event) {
    // Preserve pinch zoom, horizontal gestures, nested scrolling and controls.
    if (event.defaultPrevented || !event.cancelable || event.ctrlKey ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY) || leaveNative(event)) {
      reset();
      return;
    }
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
    if (!delta) return;
    const movement = delta * SCROLL_SPEED;

    // Cancel from the FIRST event, not after native momentum has already begun.
    event.preventDefault();
    const direction = Math.sign(delta);
    const now = performance.now();
    const magnitude = Math.abs(delta);
    if (gesture?.snapped) {
      const landed = Math.abs(window.scrollY - gesture.target) <= 1;
      // Momentum decays. A fresh acceleration or a brief break after landing
      // is new input, and must work immediately instead of extending a lock.
      const freshInput = now - gesture.lastTime >= 60 ||
        (magnitude >= 8 && magnitude > gesture.lastDelta * 1.5);
      if (landed && freshInput) gesture = null;
    }
    if (!gesture || gesture.direction !== direction) {
      gesture = { direction, samples: [], snapped: false };
    }
    gesture.lastTime = now;
    gesture.lastDelta = magnitude;
    clearTimeout(timer);
    timer = setTimeout(reset, GESTURE_PAUSE);

    if (gesture.snapped) return;
    gesture.samples = gesture.samples.filter(sample => now - sample.time <= SAMPLE_WINDOW);
    gesture.samples.push({ time: now, distance: Math.abs(delta) });
    const travel = gesture.samples.reduce((sum, sample) => sum + sample.distance, 0);
    const duration = Math.max(16, now - gesture.samples[0].time);
    const strong = Math.abs(delta) >= STRONG_DELTA || travel >= STRONG_DISTANCE ||
      (travel >= 64 && travel / duration >= 1);

    const y = window.scrollY;
    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const boundary = nextBoundary(y, direction);
    if (strong && boundary !== null) {
      const target = Math.min(boundary, maxY);
      const distance = (target - y) * direction;
      if (distance > 1 && distance <= Math.abs(movement) + SNAP_DISTANCE) {
        gesture.snapped = true;
        gesture.target = target;
        window.scrollTo({ top: target, behavior: "smooth" });
        return;
      }
    }

    // Small movements stay exactly where the reader leaves them, including
    // just below a section heading. There is no scrollend correction/back-snap.
    window.scrollTo({ top: Math.max(0, Math.min(maxY, y + movement)), behavior: "instant" });
  }

  window.addEventListener("wheel", onWheel, { passive: false, capture: true });
  window.addEventListener("hashchange", reset);
  window.addEventListener("resize", reset);
  window.addEventListener("pointerdown", reset, { passive: true });
  window.addEventListener("touchstart", reset, { passive: true });
  window.addEventListener("keydown", reset);
  document.addEventListener("visibilitychange", reset);
  reducedMotion.addEventListener("change", reset);
})();
