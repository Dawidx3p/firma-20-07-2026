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
    return nativeTouchScroll.matches || blockedScroll(event.target);
  }

  function blockedScroll(target) {
    if (reducedMotion.matches || document.querySelector(
      'body.menu-open, .kx-chat-panel:not([hidden]), .consent-banner.is-visible, ' +
      'input:focus, textarea:focus, select:focus, [contenteditable="true"]:focus'
    )) return true;
    for (let node = target; node instanceof Element && node !== document.body; node = node.parentElement) {
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

  // Touch keeps the browser's own movement and momentum. Only after crossing
  // the next section do we clamp its position; no velocity or inertia model.
  // This is a best-effort brake: asynchronous mobile scrolling can paint an
  // overshoot before JS runs, and some browsers keep delivering momentum.
  let touch = null;
  function resetTouch() { touch = null; }
  function updateTouchMode() {
    resetTouch();
    document.documentElement.classList.toggle("touch-boundary-control",
      nativeTouchScroll.matches && !reducedMotion.matches);
  }
  function startTouch(event) {
    resetTouch();
    if (!nativeTouchScroll.matches || event.touches.length !== 1 || blockedScroll(event.target)) return;
    const y = window.scrollY;
    const target = nextBoundary(y, 1);
    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    if (target === null || target > maxY || target <= y + 1) return;
    const finger = event.touches[0];
    touch = { target, startY: y, fingerX: finger.clientX, fingerY: finger.clientY, stopped: false };
  }
  function moveTouch(event) {
    if (!touch) return;
    if (event.touches.length !== 1) { resetTouch(); return; }
    const finger = event.touches[0];
    const dx = finger.clientX - touch.fingerX;
    const dy = touch.fingerY - finger.clientY;
    if (!touch.stopped && (dy < -4 || Math.abs(dx) > Math.abs(dy) + 4)) {
      resetTouch();
      return;
    }
    // Before the boundary we never cancel a touchmove. A new touchstart
    // releases this brake immediately, including during residual momentum.
    if (touch.stopped && event.cancelable) event.preventDefault();
  }
  function brakeTouch() {
    if (!touch) return;
    if (blockedScroll(document.body) || window.scrollY < touch.startY - 2) {
      resetTouch();
      return;
    }
    if (window.scrollY >= touch.target) touch.stopped = true;
    if (touch.stopped && Math.abs(window.scrollY - touch.target) > 0.5) {
      window.scrollTo({ top: touch.target, behavior: "instant" });
    }
  }

  updateTouchMode();
  window.addEventListener("touchstart", startTouch, { passive: true });
  window.addEventListener("touchmove", moveTouch, { passive: false });
  window.addEventListener("touchcancel", resetTouch, { passive: true });
  window.addEventListener("scroll", brakeTouch, { passive: true });
  // Links, navigation, typing and layout changes must never inherit a brake.
  window.addEventListener("click", resetTouch, { capture: true });
  window.addEventListener("hashchange", resetTouch);
  let touchViewportWidth = window.innerWidth;
  window.addEventListener("resize", () => {
    // Mobile browser bars change height during a swipe. Only a width change
    // invalidates this gesture's layout, e.g. device rotation.
    if (window.innerWidth !== touchViewportWidth) resetTouch();
    touchViewportWidth = window.innerWidth;
  });
  window.addEventListener("keydown", resetTouch);
  document.addEventListener("visibilitychange", resetTouch);
  nativeTouchScroll.addEventListener("change", updateTouchMode);
  reducedMotion.addEventListener("change", updateTouchMode);

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
