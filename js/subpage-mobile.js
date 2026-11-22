(() => {
  "use strict";

  const mobile = matchMedia("(max-width: 980px)");
  const root = document.documentElement;
  const touchViewport = matchMedia("(hover: none) and (pointer: coarse)").matches;
  let viewportWidth = root.clientWidth;
  const screens = [...document.querySelectorAll("main > .subpage-text-screen, main > .audit-mobile-screen")];
  const faqSelector = ".models-faq-item > summary, .partner-rules details > summary, .lp-faq details > summary";
  const desktopDetail = "[data-screen-all], " + faqSelector;
  const indivisible = "a, button, summary, details, form, figure, h1, h2, h3, h4, h5, p, table, dl, .audit-mobile-previews, .audit-finding, .pricing-card, .models-faq-list, .lp-form-card";
  const headings = "h1, h2, h3, h4, h5";
  const undoSplits = [];
  const brands = document.querySelectorAll("[data-model-summary]");
  let resizeFrame = 0;
  let trigger;
  let restoreContent;

  const dialog = document.createElement("dialog");
  dialog.className = "screen-detail-dialog";
  dialog.setAttribute("aria-labelledby", "screen-detail-title");
  dialog.innerHTML = `
    <div class="screen-detail-header">
      <h2 id="screen-detail-title"></h2>
      <button type="button" aria-label="Zamknij" autofocus>×</button>
    </div>
    <div class="screen-detail-body"></div>
  `;
  const title = dialog.querySelector("h2");
  const body = dialog.querySelector(".screen-detail-body");
  dialog.querySelector("button").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    restoreContent?.();
    restoreContent = null;
    body.replaceChildren();
    if (trigger?.getClientRects().length && !document.activeElement?.closest("#cennik")) {
      trigger.focus({ preventScroll: true });
    }
  });
  document.body.append(dialog);

  for (const card of brands) {
    const label = card.querySelector("h3").textContent.trim();
    const summary = document.createElement("p");
    summary.className = "model-mobile-summary";
    summary.textContent = card.dataset.modelSummary;
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "screen-detail-button model-mobile-detail";
    toggle.setAttribute("aria-haspopup", "dialog");
    toggle.setAttribute("aria-label", "Szczegóły: " + label);
    toggle.textContent = "Zakres";
    card.append(summary, toggle);
  }

  document.addEventListener("click", event => {
    if (dialog.open || !(event.target instanceof Element)) return;
    const button = event.target.closest("[data-screen-detail], .model-mobile-detail, " + faqSelector);
    if (!button || (!mobile.matches && !button.matches(desktopDetail))) return;
    const card = button.closest("[data-model-summary]");
    const details = button.closest("details");
    trigger = button;
    event.preventDefault();

    if (card) {
      title.textContent = card.querySelector("h3").textContent;
      const contents = card.querySelectorAll(".pricing-description, .pricing-list, a");
      body.append(...[...contents].map(node => node.cloneNode(true)));
    } else if (details) {
      title.textContent = button.textContent;
      body.append(...[...details.children].filter(node => node !== button).map(node => node.cloneNode(true)));
    } else {
      const source = document.getElementById(button.dataset.screenDetail);
      if (!source) return;
      title.textContent = button.dataset.screenTitle;
      if (button.hasAttribute("data-screen-move")) {
        const placeholder = document.createComment("");
        source.before(placeholder);
        body.append(source);
        restoreContent = () => placeholder.replaceWith(source);
      } else {
        const copy = source.cloneNode(true);
        copy.removeAttribute("hidden");
        for (const node of [copy, ...copy.querySelectorAll("[id], [aria-labelledby]")]) {
          node.removeAttribute("id");
          node.removeAttribute("aria-labelledby");
        }
        body.append(copy);
      }
    }
    dialog.showModal();
  });

  function shell(source) {
    const copy = source.cloneNode(false);
    copy.removeAttribute("id");
    return copy;
  }

  function moveTail(source, boundary, target, undo) {
    if (boundary.parentElement !== source) {
      let branch = boundary.parentElement;
      while (branch.parentElement !== source) branch = branch.parentElement;
      const remainder = shell(branch);
      if (branch instanceof HTMLOListElement) {
        const listItems = [...branch.children];
        const index = listItems.findIndex(item => item.contains(boundary));
        if (index > 0) remainder.start = branch.start + index;
      }
      target.append(remainder);
      moveTail(branch, boundary, remainder, undo);
      boundary = branch.nextSibling;
    }
    const moved = [];
    while (boundary) {
      const next = boundary.nextSibling;
      moved.push(boundary);
      target.append(boundary);
      boundary = next;
    }
    undo.push(() => source.append(...moved));
  }

  function findBoundaries(container, candidates, fallback) {
    for (const child of container.children) {
      if (!child.getClientRects().length) continue;
      const prior = child.previousElementSibling;
      const startsWithHeading = child.matches(headings) && prior?.matches(".eyebrow, span");
      if (prior && !prior.matches(headings) && !child.matches(".screen-detail-button, .model-mobile-summary")) {
        (startsWithHeading ? fallback : candidates).push(child);
      }
      if (!child.matches(indivisible)) findBoundaries(child, candidates, fallback);
    }
  }

  function paginate(screen, available) {
    const titleText = screen.querySelector("h1, h2, h3")?.textContent.trim();
    let current = screen;
    while (current.getBoundingClientRect().height > available + 1) {
      current.classList.add("screen-measuring");
      const top = current.getBoundingClientRect().top;
      const limit = top + available - parseFloat(getComputedStyle(current).paddingBottom);
      const boundaries = [];
      const fallback = [];
      findBoundaries(current, boundaries, fallback);
      const candidates = [...boundaries.reverse(), ...fallback.reverse()]
        .filter(node => node.getBoundingClientRect().top <= limit);
      let next;
      for (const boundary of candidates) {
        const continuation = shell(screen);
        continuation.classList.remove("screen-measuring");
        continuation.classList.add("screen-continuation");
        continuation.removeAttribute("aria-labelledby");
        if (titleText) continuation.setAttribute("aria-label", titleText + " — ciąg dalszy");
        const undo = [];
        moveTail(current, boundary, continuation, undo);
        if (current.getBoundingClientRect().height <= available + 1) {
          current.after(continuation);
          undoSplits.push(() => {
            undo.reverse().forEach(restore => restore());
            continuation.remove();
          });
          next = continuation;
          break;
        }
        undo.reverse().forEach(restore => restore());
      }
      current.classList.remove("screen-measuring");
      if (!next) break;
      current = next;
    }
  }

  function update() {
    const header = document.querySelector("body > header");
    const headerHeight = Math.round(header.getBoundingClientRect().height);
    const active = [...document.querySelectorAll("main .view, .subpage-configurator .pricing-mobile-view")].find(screen => {
      const rect = screen.getBoundingClientRect();
      return getComputedStyle(screen).scrollSnapAlign !== "none" && rect.height && rect.top <= headerHeight + 2 && rect.bottom > headerHeight + 2;
    });
    const anchor = active?.querySelector("h2, h3, h4, p, li") || active;
    undoSplits.reverse().forEach(restore => restore());
    undoSplits.length = 0;
    root.classList.toggle("mobile-subpages", mobile.matches);
    for (const summary of document.querySelectorAll(faqSelector)) {
      summary.parentElement.open = false;
      summary.setAttribute("aria-haspopup", "dialog");
    }
    const viewportHeight = parseFloat(root.style.getPropertyValue("--screen-viewport-height")) || root.clientHeight;
    const available = viewportHeight - headerHeight;
    for (const screen of screens) {
      if (mobile.matches || screen.querySelector(".legal-section")) paginate(screen, available);
    }
    if (!mobile.matches && dialog.open && !trigger?.matches(desktopDetail)) {
      dialog.close();
    }
    if (!root.hasAttribute("data-view-transition") && anchor?.getClientRects().length) {
      const viewSelector = ".subpage-configurator .pricing-mobile-view, .view";
      let screen = anchor.closest(viewSelector);
      while (screen && (!screen.getClientRects().length || getComputedStyle(screen).scrollSnapAlign === "none")) {
        screen = screen.parentElement.closest(viewSelector);
      }
      screen?.scrollIntoView({ block: "start" });
    }
    document.dispatchEvent(new Event("kairox:views-changed"));
  }

  function schedule() {
    if (mobile.matches && (dialog.open || document.activeElement?.matches("input, textarea, select"))) return;
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(update);
  }

  update();
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  document.fonts.ready.then(schedule);
  window.addEventListener("resize", () => {
    if (touchViewport && root.clientWidth === viewportWidth) return;
    viewportWidth = root.clientWidth;
    schedule();
  });
  mobile.addEventListener("change", schedule);
})();
