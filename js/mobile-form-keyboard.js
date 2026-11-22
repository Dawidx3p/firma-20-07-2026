(() => {
  "use strict";

  const root = document.documentElement;
  const mobile = matchMedia("(max-width: 980px)");
  const viewport = window.visualViewport;
  const nativeKeyboard = navigator.virtualKeyboard;
  const textField = 'textarea, input:is(:not([type]), [type="text"], [type="email"], [type="tel"], [type="url"], [type="search"], [type="password"], [type="number"])';
  const openThreshold = 112;
  const closeThreshold = 64;
  let frame = 0;
  let baseline = readViewport();
  let activeForm;
  let lastField;
  let scrollBeforeFocus;

  function readViewport() {
    const top = viewport?.offsetTop ?? 0;
    const height = viewport?.height ?? window.innerHeight;
    const keyboard = nativeKeyboard?.boundingRect;
    const docked = keyboard?.height > 0 && keyboard.width >= root.clientWidth * .65;
    return {
      top,
      height: docked ? Math.min(height, Math.max(0, keyboard.top - top)) : height,
      width: root.clientWidth,
      scale: viewport?.scale ?? 1,
      docked
    };
  }

  function reset() {
    if (!activeForm) return;
    activeForm.removeAttribute("data-keyboard-active");
    activeForm.scrollTop = 0;
    activeForm = null;
    root.removeAttribute("data-site-keyboard");
    root.style.removeProperty("--keyboard-top");
    root.style.removeProperty("--keyboard-height");
  }

  function sync() {
    const current = readViewport();
    const field = document.activeElement;
    const editing = mobile.matches && field instanceof HTMLElement &&
      field.matches(textField) && !field.readOnly && !field.disabled && field.closest("form[data-keyboard-form]");
    // Keep the form in place while a tap moves focus from a field to a form button.
    const finishing = mobile.matches && activeForm?.isConnected && !activeForm.hidden &&
      (activeForm.contains(field) || field === document.body);
    const form = editing || (finishing && activeForm);
    const sameViewport = Math.abs(current.width - baseline.width) <= 2 &&
      Math.abs(current.scale - baseline.scale) <= .05;

    if (!form || !sameViewport) {
      reset();
      if (!current.docked && (!sameViewport || current.height >= baseline.height - closeThreshold)) baseline = current;
      if (!form) lastField = null;
      return;
    }

    const loss = baseline.height - current.height;
    if (!current.docked && loss < (activeForm ? closeThreshold : openThreshold)) {
      if (activeForm) {
        const restore = scrollBeforeFocus;
        reset();
        if (editing) field.blur();
        lastField = null;
        if (restore) window.scrollTo({ left: restore.x, top: restore.y, behavior: "instant" });
      }
      return;
    }

    if (current.height <= 0) return;
    root.style.setProperty("--keyboard-top", `${Math.max(0, current.top)}px`);
    root.style.setProperty("--keyboard-height", `${current.height}px`);
    if (activeForm !== form) {
      activeForm?.removeAttribute("data-keyboard-active");
      activeForm = form;
      activeForm.setAttribute("data-keyboard-active", "");
      root.setAttribute("data-site-keyboard", "");
    }

    if (!editing) return;
    const formBox = form.getBoundingClientRect();
    const fieldBox = field.getBoundingClientRect();
    if (fieldBox.bottom > formBox.bottom - 12) {
      form.scrollTop += fieldBox.bottom - formBox.bottom + 12;
    } else if (fieldBox.top < formBox.top + 12) {
      form.scrollTop -= formBox.top - fieldBox.top + 12;
    }
  }

  function schedule() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(sync);
  }

  document.addEventListener("focusin", event => {
    if (mobile.matches && event.target instanceof HTMLElement &&
        event.target.matches(textField) && event.target.closest("form[data-keyboard-form]")) {
      if (!lastField) scrollBeforeFocus = { x: window.scrollX, y: window.scrollY };
      lastField = event.target;
    }
    schedule();
  });
  document.addEventListener("focusout", schedule);
  viewport?.addEventListener("resize", schedule);
  viewport?.addEventListener("scroll", schedule);
  nativeKeyboard?.addEventListener("geometrychange", schedule);
  window.addEventListener("resize", schedule);
  mobile.addEventListener("change", schedule);
  window.addEventListener("pageshow", schedule);
})();
