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
  const transitionTime = 230;
  const editable = 'input, textarea, select, [contenteditable="true"]';
  const overlays = 'html[data-site-keyboard], body.menu-open, .kx-chat-panel:not([hidden]), .consent-banner.is-visible, dialog[open]';
  const wheelControls = 'textarea, select, input[type="number"], [contenteditable="true"]';
  const swipeSurfaces = '.home-screen-scroll :is(main, .site-footer, footer.view)';
  const wheelPause = 48;
  const swipeThreshold = 14;
  let wheelGesture = null;
  let swipe = null;
  let animationFrame = 0;
  let destination = null;
  let destinationIndex = null;

  function blocked(target, controls = editable) {
    return document.querySelector(overlays) ||
      (target instanceof Element && target.closest(controls));
  }

  function getMaxScroll() {
    return root.scrollHeight - root.clientHeight;
  }

  function cancelTransition() {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    destination = null;
    destinationIndex = null;
    root.removeAttribute("data-view-transition");
  }

  function jumpTo(top) {
    cancelTransition();
    window.scrollTo({ top, behavior: "instant" });
  }

  function animateTo(top, index) {
    if (reducedMotion.matches) {
      jumpTo(top);
      return;
    }

    cancelTransition();
    destination = top;
    destinationIndex = index;
    root.setAttribute("data-view-transition", "");
    const start = window.scrollY;
    const startedAt = performance.now();

    function draw(now) {
      const progress = Math.min(1, (now - startedAt) / transitionTime);
      const eased = 1 - (1 - progress) ** 3;
      window.scrollTo({ top: start + (top - start) * eased, behavior: "instant" });

      if (progress < 1) {
        animationFrame = requestAnimationFrame(draw);
      } else {
        cancelTransition();
      }
    }

    animationFrame = requestAnimationFrame(draw);
  }

  function getContinuationStops(panel, box, start, y, max, headerHeight) {
    const clearance = parseFloat(getComputedStyle(panel).paddingBottom) || 0;
    const pageDistance = Math.max(120, root.clientHeight - headerHeight - clearance - 12);
    const bottom = Math.min(max, Math.round(box.bottom + y - root.clientHeight));
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
    const y = window.scrollY;
    const padding = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    const max = getMaxScroll();
    const visiblePanels = panels.filter(panel =>
      panel.getClientRects().length && getComputedStyle(panel).scrollSnapAlign !== "none"
    );
    const stops = visiblePanels.flatMap(panel => {
      const box = panel.getBoundingClientRect();
      const start = Math.round(Math.max(0, Math.min(max, box.top + y - padding)));
      const continuations = subpage ? getContinuationStops(panel, box, start, y, max, padding) : [];
      return [start, ...continuations];
    });
    return [...new Set(stops)];
  }

  function updateControls(stops = getStops()) {
    const from = destination ?? window.scrollY;
    const index = Math.max(0, stops.findLastIndex(stop => stop <= from + 2));
    const text = `${index + 1} / ${stops.length}`;
    if (positionLabel.textContent !== text) positionLabel.textContent = text;
    previousButton.setAttribute("aria-disabled", String(index === 0));
    nextButton.setAttribute("aria-disabled", String(index >= stops.length - 1));
  }

  function move(direction) {
    const stops = getStops();
    const index = destinationIndex !== null
      ? destinationIndex + direction
      : direction > 0
        ? stops.findIndex(stop => stop > window.scrollY + 2)
        : stops.findLastIndex(stop => stop < window.scrollY - 2);
    if (stops[index] !== undefined) {
      animateTo(stops[index], index);
      updateControls(stops);
    }
  }

  function syncLayout() {
    const stops = getStops();
    if (destinationIndex !== null && stops.length) {
      const index = Math.min(destinationIndex, stops.length - 1);
      if (destination !== stops[index]) animateTo(stops[index], index);
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
  if (subpage) {
    const panelObserver = new ResizeObserver(syncLayout);
    const syncPanels = () => {
      panelObserver.disconnect();
      panels = [...document.querySelectorAll(panelSelector)];
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

  function startsWheelGesture(previous, direction, magnitude, time, mode) {
    if (!previous) return true;

    const gap = time - previous.time;
    // A late, very small impulse can still belong to the original stroke.
    if (gap >= 440) return mode !== 0 || magnitude >= 2 || gap >= 700;
    if (direction !== previous.direction) {
      return magnitude >= Math.max(1.5, Math.min(8, previous.peak * .08));
    }

    if (mode === 2) return gap >= wheelPause;
    if (mode === 1) {
      // Whole-line steps can repeat at the same value throughout a momentum tail.
      // Keep discrete wheel notches responsive and require acceleration after a burst.
      if (previous.samples === 1) return gap >= 64;
      return previous.falling && gap >= 28 &&
        magnitude >= Math.max(32, previous.magnitude * 1.6, previous.peak * .4);
    }

    const restartedAfterPause = gap >= wheelPause &&
      magnitude >= Math.max(1.6, previous.magnitude * .9, previous.peak * .32);
    const accelerated = previous.falling && gap >= 12 && gap <= 96 &&
      magnitude >= Math.max(1.2, previous.magnitude * 1.8, previous.peak * .085);
    return restartedAfterPause || accelerated;
  }

  window.addEventListener("wheel", event => {
    const mode = event.deltaMode;
    if (event.defaultPrevented || event.ctrlKey || event.shiftKey || !event.deltaY ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY) || blocked(event.target, wheelControls)) return;
    event.preventDefault();

    const time = event.timeStamp;
    const direction = Math.sign(event.deltaY);
    const magnitude = Math.abs(event.deltaY) * (mode === 1 ? 16 : mode === 2 ? root.clientHeight : 1);
    const previous = wheelGesture;
    if (startsWheelGesture(previous, direction, magnitude, time, mode)) {
      wheelGesture = { time, direction, magnitude, peak: magnitude, falling: false, samples: 1 };
      move(direction);
      return;
    }

    previous.time = time;
    if (direction !== previous.direction) return;
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
    if (!swipe || !finger || finger.identifier !== swipe.id || blocked(event.target)) return;
    if (swipe.moved) {
      if (event.cancelable) event.preventDefault();
      return;
    }
    const x = finger.clientX - swipe.x;
    const y = swipe.y - finger.clientY;
    if (Math.abs(y) < swipeThreshold || Math.abs(y) <= Math.abs(x)) return;
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

  window.addEventListener("resize", syncLayout);
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
