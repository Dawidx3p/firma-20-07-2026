(() => {
  "use strict";

  const panelSelector = ".home-screen-scroll main > .view, .home-screen-scroll .view-footer-grid > .view, .subpage-screen > footer.view, .subpage-configurator .pricing-mobile-view, .lp-offer-and-process .lp-stage";
  let panels = [...document.querySelectorAll(panelSelector)];
  const root = document.documentElement;
  const controls = document.querySelector(".view-controls");
  const previousButton = controls.querySelector('[data-view-step="-1"]');
  const nextButton = controls.querySelector('[data-view-step="1"]');
  const positionLabel = controls.querySelector(".view-position");
  const subpage = document.body.classList.contains("subpage-screen");
  const pageHeader = subpage && document.querySelector("body > header");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const touchViewport = matchMedia("(hover: none) and (pointer: coarse)").matches;
  // The screen styles share these height breakpoints with the initial mobile viewport.
  const heightBreakpoints = [510, 520, 530, 540, 550, 560, 580, 600, 620, 640, 660, 690, 700, 710, 720, 760, 800];
  const transitionTime = 230;
  const extraStepTime = 70;
  const maxTransitionTime = 460;
  const editable = 'input, textarea, select, [contenteditable="true"]';
  const overlays = 'html[data-site-keyboard], body.menu-open, .kx-chat-panel:not([hidden]), .consent-banner.is-visible, dialog[open]';
  const wheelControls = 'textarea, select, input[type="number"], [contenteditable="true"]';
  const swipeSurfaces = '.home-screen-scroll :is(main, .site-footer, footer.view)';
  const wheelPause = 48;
  const swipeThreshold = 14;
  let wheelGesture = null;
  let swipe = null;
  let animationFrame = 0;
  let animation = null;
  let viewportWidth;
  let viewportHeight;
  let cachedStops;
  const queue = [];

  function measureViewport() {
    viewportWidth = root.clientWidth;
    viewportHeight = touchViewport ? root.clientHeight : window.innerHeight;
    root.setAttribute("data-screen-height", heightBreakpoints.filter(height => viewportHeight <= height).join(" "));
    if (touchViewport) root.style.setProperty("--screen-viewport-height", `${viewportHeight}px`);
  }

  measureViewport();

  function blocked(target, controls = editable) {
    return document.querySelector(overlays) ||
      (target instanceof Element && target.closest(controls));
  }

  function getMaxScroll() {
    return Math.max(0, root.scrollHeight - root.clientHeight);
  }

  function cancelTransition() {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    animation = null;
    queue.length = 0;
    root.removeAttribute("data-view-transition");
  }

  function jumpTo(top) {
    cancelTransition();
    window.scrollTo({ top: Math.min(top, getMaxScroll()), behavior: "instant" });
  }

  function animateTo(top, extend = false) {
    const now = performance.now();
    const remaining = animation ? animation.startedAt + animation.duration - now : 0;
    animation = {
      // A saved stop can lie beyond the bottom after the viewport grows.
      top: Math.min(top, getMaxScroll()),
      from: window.scrollY,
      startedAt: now,
      duration: extend ? Math.min(maxTransitionTime, Math.max(transitionTime, remaining + extraStepTime)) : transitionTime
    };
    root.setAttribute("data-view-transition", "");
    if (!animationFrame) animationFrame = requestAnimationFrame(draw);
  }

  function draw(now) {
    animationFrame = 0;
    const { top, from, startedAt, duration } = animation;
    const progress = Math.min(1, Math.max(0, (now - startedAt) / duration));
    const eased = 1 - (1 - progress) ** 3;
    window.scrollTo({ top: from + (top - from) * eased, behavior: "instant" });
    if (progress < 1) {
      animationFrame = requestAnimationFrame(draw);
      return;
    }

    queue.shift();
    const stops = getStops();
    const next = stops[queue[0]?.index];
    if (next === undefined) {
      cancelTransition();
    } else {
      animateTo(next);
    }
    updateControls(stops);
  }

  function getContinuationStops(panel, box, start, y, max, headerHeight) {
    const clearance = parseFloat(getComputedStyle(panel).paddingBottom) || 0;
    const height = touchViewport ? viewportHeight : root.clientHeight;
    const pageDistance = Math.max(120, height - headerHeight - clearance - 12);
    const bottom = Math.min(max, Math.round(box.bottom + y - height));
    if (bottom <= start + 6) return [];

    const landmarks = [...panel.querySelectorAll("h2, h3, h4, article, p, li, details, figure, .pricing-service")]
      .filter(element => element.getClientRects().length)
      .map(element => Math.round(element.getBoundingClientRect().top + y - headerHeight - 6))
      .sort((a, b) => a - b);
    const stops = [];
    let current = start;

    // Prefer a natural boundary near the bottom edge. Long single blocks
    // advance by the available height so text and controls stay reachable.
    while (bottom - current > pageDistance) {
      const closest = landmarks.findLast(point => point <= current + pageDistance);
      current = closest >= current + pageDistance * .6 ? closest : current + pageDistance;
      stops.push(current);
    }
    if (bottom > current + 6) stops.push(bottom);
    return stops;
  }

  function getStops() {
    if (cachedStops) return cachedStops;
    const y = window.scrollY;
    const padding = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    const max = touchViewport ? Math.max(0, root.scrollHeight - viewportHeight) : getMaxScroll();
    const visiblePanels = panels.filter(panel =>
      panel.getClientRects().length && getComputedStyle(panel).scrollSnapAlign !== "none"
    );
    const stops = visiblePanels.flatMap(panel => {
      const box = panel.getBoundingClientRect();
      const start = Math.round(Math.max(0, Math.min(max, box.top + y - padding)));
      const continuations = subpage ? getContinuationStops(panel, box, start, y, max, padding) : [];
      return [start, ...continuations];
    });
    cachedStops = [...new Set(stops)].sort((a, b) => a - b);
    return cachedStops;
  }

  function updateControls(stops = getStops()) {
    const y = window.scrollY;
    const atEnd = touchViewport && y > 0 && y >= getMaxScroll() - 2;
    const index = queue.at(-1)?.index ?? Math.max(0, atEnd ? stops.length - 1 : stops.findLastIndex(stop => stop <= y + 2));
    const text = `${index + 1} / ${stops.length}`;
    if (positionLabel.textContent !== text) positionLabel.textContent = text;
    previousButton.setAttribute("aria-disabled", String(index === 0));
    nextButton.setAttribute("aria-disabled", String(index >= stops.length - 1));
  }

  // Report when the planned destination is at the edge in this direction.
  function move(direction, interruptReverse = false) {
    const stops = getStops();
    const reversing = interruptReverse && animation && queue[0]?.direction !== direction;
    if (reversing) cancelTransition();
    const last = queue.at(-1);
    if (!last && touchViewport && direction > 0 && window.scrollY >= getMaxScroll() - 2) return true;
    const index = last
      ? last.index + direction
      : direction > 0
        ? stops.findIndex(stop => stop > window.scrollY + 2)
        : stops.findLastIndex(stop => stop < window.scrollY - 2);
    if (stops[index] === undefined) {
      if (reversing) updateControls(stops);
      return true;
    }

    if (reducedMotion.matches) {
      jumpTo(stops[index]);
    } else if (last?.direction === direction) {
      last.index = index;
      if (last === queue[0]) animateTo(stops[index], true);
    } else {
      queue.push({ direction, index });
      if (queue.length === 1) animateTo(stops[index]);
    }
    updateControls(stops);
    return index === (direction > 0 ? stops.length - 1 : 0);
  }

  function syncLayout() {
    cachedStops = undefined;
    const stops = getStops();
    if (animation) {
      if (!stops.length) {
        cancelTransition();
      } else {
        for (const run of queue) run.index = Math.min(run.index, stops.length - 1);
        const target = stops[queue[0].index];
        if (animation.top !== Math.min(target, getMaxScroll())) animateTo(target);
      }
    }
    updateControls(stops);
  }

  if (pageHeader) {
    const syncHeaderHeight = () => {
      root.style.setProperty("--screen-header", `${Math.round(pageHeader.getBoundingClientRect().height)}px`);
      syncLayout();
    };
    syncHeaderHeight();
    new ResizeObserver(syncHeaderHeight).observe(pageHeader);
  }
  if (subpage || !touchViewport) {
    const panelObserver = new ResizeObserver(syncLayout);
    const syncPanels = () => {
      panelObserver.disconnect();
      panels = [...document.querySelectorAll(panelSelector)];
      const header = !subpage && document.querySelector("body > header");
      if (header) panelObserver.observe(header);
      for (const panel of panels) {
        if (getComputedStyle(panel).display !== "contents") panelObserver.observe(panel);
      }
      syncLayout();
    };
    document.addEventListener("kairox:views-changed", syncPanels);
    syncPanels();
  }

  controls.hidden = false;
  for (const button of [previousButton, nextButton]) {
    button.addEventListener("click", () => {
      if (button.getAttribute("aria-disabled") !== "true") move(Number(button.dataset.viewStep));
    });
  }
  updateControls();

  function startsWheelGesture(previous, direction, magnitude, time, mode, fractionalLine, precisionWheel) {
    if (!previous) return true;

    const gap = time - previous.time;
    // A late, very small impulse can still belong to the original stroke.
    if (gap >= 440 && !fractionalLine) return mode !== 0 || magnitude >= 2 || gap >= 700;
    if (gap >= 700) return true;
    if (direction !== previous.direction) {
      if (previous.atBoundary) return magnitude >= (fractionalLine ? .5 : 1.2);
      if (fractionalLine) return magnitude >= Math.max(.5, Math.min(2, previous.magnitude));
      if (precisionWheel) return magnitude >= Math.max(1.5, Math.min(4, previous.magnitude * .25));
      return magnitude >= Math.max(1.5, Math.min(8, previous.peak * .08));
    }

    if (mode === 2) return gap >= wheelPause;
    if (mode === 1 && !fractionalLine) {
      // Whole-line steps can repeat at the same value throughout a momentum tail.
      // Full-strength line steps after a pause can start another deliberate stroke.
      if (previous.samples === 1) return gap >= 64;
      if (gap >= 72 && magnitude >= Math.max(16, previous.magnitude, previous.peak * .65)) return true;
      return previous.falling && gap >= 28 &&
        magnitude >= Math.max(32, previous.magnitude * 1.6, previous.peak * .4);
    }

    // Some touchpads report fractions of a line even when the browser uses line mode.
    const pauseThreshold = fractionalLine
      ? Math.max(.5, previous.magnitude, Math.min(3, previous.peak * .2))
      : Math.max(1.6, previous.magnitude * .9, Math.min(8, previous.peak * .32));
    const restartedAfterPause = gap >= wheelPause &&
      magnitude >= pauseThreshold;
    if (precisionWheel) {
      const low = previous.reboundFrom;
      return restartedAfterPause || (low !== undefined &&
        magnitude >= Math.max(fractionalLine ? .5 : 1.2, low * 1.8, low + (fractionalLine ? .25 : .75)));
    }
    const accelerated = previous.falling && gap >= 12 && gap <= 96 &&
      magnitude >= Math.max(fractionalLine ? .5 : 1.2, previous.magnitude * 1.8, previous.peak * .085);
    return restartedAfterPause || accelerated;
  }

  window.addEventListener("wheel", event => {
    const mode = event.deltaMode;
    if (event.defaultPrevented || event.ctrlKey || event.shiftKey || !event.deltaY ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY) || blocked(event.target, wheelControls)) return;
    event.preventDefault();

    const time = event.timeStamp;
    const direction = Math.sign(event.deltaY);
    const delta = Math.abs(event.deltaY);
    const magnitude = delta * (mode === 1 ? 16 : mode === 2 ? root.clientHeight : 1);
    const previous = wheelGesture;
    const fractionalLine = mode === 1 && (!Number.isInteger(delta) ||
        (!touchViewport && previous?.fractionalLine && time - previous.time < 100));
    const precisionWheel = !touchViewport && (mode === 0 || fractionalLine);
    if (startsWheelGesture(previous, direction, magnitude, time, mode, fractionalLine, precisionWheel)) {
      const atBoundary = move(direction, precisionWheel);
      wheelGesture = { time, direction, magnitude, peak: magnitude, falling: false,
        samples: 1, atBoundary, fractionalLine };
      return;
    }

    previous.time = time;
    if (direction !== previous.direction) return;
    // Keep the lowest impulse after a clear slowdown, including while a rebound builds.
    if (precisionWheel && magnitude <= previous.peak * .75) {
      previous.reboundFrom = Math.min(previous.reboundFrom ?? magnitude, magnitude);
    }
    previous.samples++;
    previous.peak = Math.max(previous.peak, magnitude);
    if (magnitude !== previous.magnitude) previous.falling = magnitude < previous.magnitude;
    previous.magnitude = magnitude;
  }, { passive: false, capture: true });

  window.addEventListener("touchstart", event => {
    swipe = null;
    if (event.touches.length !== 1 || blocked(event.target) ||
        !(event.target instanceof Element && event.target.closest(swipeSurfaces))) return;
    const finger = event.touches[0];
    swipe = { id: finger.identifier, x: finger.clientX, y: finger.clientY, moved: false };
  }, { passive: true, capture: true });

  function acceptSwipe(finger, event) {
    if (!swipe || !finger || finger.identifier !== swipe.id) return;
    if (swipe.moved) {
      if (event.cancelable) event.preventDefault();
      return;
    }
    const x = finger.clientX - swipe.x;
    const y = swipe.y - finger.clientY;
    if (Math.abs(y) < swipeThreshold || Math.abs(y) <= Math.abs(x) || blocked(event.target)) return;
    if (event.cancelable) event.preventDefault();
    swipe.moved = true;
    move(Math.sign(y));
  }

  window.addEventListener("touchmove", event => {
    if (event.touches.length === 1) acceptSwipe(event.touches[0], event);
  }, { passive: false, capture: true });
  window.addEventListener("touchend", event => {
    if (!swipe || event.touches.length) return;
    const finger = Array.from(event.changedTouches).find(touch => touch.identifier === swipe.id);
    acceptSwipe(finger, event);
    swipe = null;
  }, { passive: false, capture: true });
  window.addEventListener("touchcancel", () => { swipe = null; }, { passive: true, capture: true });

  window.addEventListener("keydown", event => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || blocked(event.target)) return;
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      wheelGesture = null;
      jumpTo(event.key === "Home" ? 0 : getMaxScroll());
      updateControls();
      return;
    }
    const space = event.key === " " && !(event.target instanceof Element && event.target.closest("button, a, summary"));
    const forward = ["ArrowDown", "PageDown"].includes(event.key) || space && !event.shiftKey;
    const backward = ["ArrowUp", "PageUp"].includes(event.key) || space && event.shiftKey;
    if (!forward && !backward) return;
    event.preventDefault();
    move(forward ? 1 : -1);
  });

  window.addEventListener("resize", () => {
    // A toolbar or keyboard can change only the height during a touch gesture.
    if (touchViewport && root.clientWidth === viewportWidth) return;
    measureViewport();
    syncLayout();
  });
  window.addEventListener("load", syncLayout, { once: true });
  window.addEventListener("hashchange", () => {
    wheelGesture = null;
    cancelTransition();
    updateControls();
  });
  window.addEventListener("scrollend", () => {
    if (!animationFrame) updateControls();
  });
  window.addEventListener("pageshow", () => { updateControls(); });
  window.addEventListener("pointerdown", () => { wheelGesture = null; });
})();
