(() => {
  "use strict";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reducedMotion.matches || !("IntersectionObserver" in window)) return;

  const targets = Array.from(document.querySelectorAll("main > section"));
  const pending = new Set();
  let observer;

  function finish(section) {
    pending.delete(section);
    section.classList.remove("section-entering");
    observer?.unobserve(section);
  }

  function hashSection() {
    try {
      return document.getElementById(decodeURIComponent(location.hash.slice(1)))?.closest("main > section");
    } catch {
      return null;
    }
  }

  observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const section = entry.target;
      observer.unobserve(section);
      pending.delete(section);
      if (reducedMotion.matches || section.contains(document.activeElement) || section === hashSection()) continue;
      section.classList.add("section-entering");
      section.addEventListener("animationend", event => {
        if (event.target === section) section.classList.remove("section-entering");
      }, { once: true });
    }
  }, { threshold: 0, rootMargin: "0px" });

  // Everything remains visible without JS. Only sections below the initial
  // viewport receive a one-time entrance; long sections need no % threshold.
  for (const section of targets) {
    if (section.getBoundingClientRect().top < window.innerHeight || section === hashSection()) continue;
    pending.add(section);
    observer.observe(section);
  }

  document.addEventListener("focusin", event => {
    const section = event.target.closest("main > section");
    if (section) finish(section);
  });
  window.addEventListener("hashchange", () => {
    const section = hashSection();
    if (section) finish(section);
  });
  reducedMotion.addEventListener("change", event => {
    if (!event.matches) return;
    observer.disconnect();
    pending.clear();
    targets.forEach(section => section.classList.remove("section-entering"));
  });
})();
