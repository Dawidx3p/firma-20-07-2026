// Project recommendation: once per tab session, without analytics or API calls.
export function initProjectInvite() {
  if (/\/(?:formularz-kontaktowy|polityka-prywatnosci|polityka-cookies|404)\.html$/.test(location.pathname) || location.pathname.includes('/archiwum-sledcze/')) return;
  const key = 'kairox-project-invite-v2';
  const preview = ['localhost', '127.0.0.1'].includes(location.hostname) &&
    new URLSearchParams(location.search).get('preview') === 'project-banner';
  try { if (!preview && sessionStorage.getItem(key)) return; } catch {}
  let handled = false;
  let banner;
  let headerObserver;
  const remember = () => {
    handled = true;
    try { if (!preview) sessionStorage.setItem(key, 'handled'); } catch {}
  };
  const dismiss = () => {
    remember();
    if (banner) banner.remove();
    headerObserver?.disconnect();
    document.removeEventListener('input', onInput);
    document.removeEventListener('kairox-chat-opened', onChat);
    document.removeEventListener('kairox-chat-opened', dismiss);
  };
  const onInput = event => {
    if (event.target.closest('form')) dismiss();
  };
  const onChat = () => dismiss();
  document.addEventListener('input', onInput);
  document.addEventListener('kairox-chat-opened', onChat, { once: true });
  function showWhenReady() {
    if (handled) return;
    if (document.hidden || document.activeElement?.matches('input, textarea, select, [contenteditable="true"]') ||
        document.querySelector('body.menu-open, .consent-banner.is-visible, dialog[open], .kx-chat-panel:not([hidden])')) {
      setTimeout(showWhenReady, 1000);
      return;
    }
    document.removeEventListener('input', onInput);
    document.removeEventListener('kairox-chat-opened', onChat);
    remember();
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = new URL('../css/project-invite.css?v=portfolio-3', import.meta.url).href;
    document.head.append(style);
    banner = document.createElement('aside');
    banner.className = 'project-invite';
    banner.setAttribute('aria-label', 'Projekty KAIROX');
    banner.innerHTML = `<div class="project-invite-inner">
      <a class="project-invite-content" href="${new URL('../realizacje.html', import.meta.url).href}">
        <picture class="project-invite-art">
          <source media="(max-width:760px)" srcset="${new URL('../img/banners/portfolio-overview-mobile.svg?v=portfolio-3', import.meta.url).href}">
          <img src="${new URL('../img/banners/portfolio-overview.svg?v=portfolio-3', import.meta.url).href}" width="1600" height="180" alt="" decoding="async">
        </picture>
        <div class="project-invite-heading"><p class="project-invite-title">A gdyby Twoja strona wyglądała tak?</p>
        <p class="project-invite-hint">Kliknij w baner i zobacz więcej <span aria-hidden="true">→</span></p></div>
      </a>
      <button type="button" class="project-invite-close" aria-label="Zamknij podgląd projektów">×</button></div>`;
    const header = document.querySelector('.site-header');
    const updateTop = () => banner.style.setProperty('--project-invite-top', `${header?.getBoundingClientRect().height || 0}px`);
    updateTop();
    if (header && 'ResizeObserver' in window) {
      headerObserver = new ResizeObserver(updateTop);
      headerObserver.observe(header);
    }
    banner.querySelector('button').addEventListener('click', dismiss);
    banner.addEventListener('keydown', event => { if (event.key === 'Escape') dismiss(); });
    // Replace the earlier chat invitation, keeping only one recommendation visible.
    document.dispatchEvent(new Event('kairox-project-invite-shown'));
    document.body.append(banner);
    document.addEventListener('kairox-chat-opened', dismiss, { once: true });
    document.addEventListener('input', onInput);
  }
  setTimeout(showWhenReady, preview ? 0 : 20000);
}
