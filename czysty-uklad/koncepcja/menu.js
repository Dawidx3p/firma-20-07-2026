(() => {
  const trigger = document.querySelector('[data-menu-open]');
  const dialog = document.querySelector('[data-navigation-dialog]');
  if (!trigger || !dialog) return;
  let restoreFocus = true;
  const controls = () => [...dialog.querySelectorAll('a[href],button:not([disabled])')].filter(el => el.getClientRects().length);
  trigger.addEventListener('click', () => {
    restoreFocus = true;
    dialog.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('navigation-open');
    dialog.querySelector('[data-menu-close]')?.focus({preventScroll: true});
  });
  dialog.querySelectorAll('[data-menu-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('close', () => {
    trigger.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('navigation-open');
    if (restoreFocus) trigger.focus({preventScroll: true});
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    }
    const link = event.target.closest('a[href]');
    if (!link) return;
    const url = new URL(link.href);
    restoreFocus = false;
    dialog.close();
    if (url.pathname === location.pathname && url.hash) {
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (target) {
        target.setAttribute('tabindex', '-1');
        requestAnimationFrame(() => target.focus({preventScroll: true}));
        target.addEventListener('blur', () => target.removeAttribute('tabindex'), {once: true});
      }
    }
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const list = controls(), first = list[0], last = list.at(-1);
    if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last?.focus();}
    else if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first?.focus();}
  });
  const desktop = matchMedia('(min-width: 901px)');
  desktop.addEventListener('change', () => {if (desktop.matches && dialog.open) dialog.close();});
})();
