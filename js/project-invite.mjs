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
    style.href = new URL('../css/project-invite.css?v=5', import.meta.url).href;
    document.head.append(style);
    banner = document.createElement('aside');
    banner.className = 'project-invite';
    banner.setAttribute('aria-label', 'Poznaj projekt KAIROX');
    banner.innerHTML = `<div class="project-invite-inner"><span class="project-invite-art" aria-hidden="true"></span>
      <div class="project-invite-copy"><p class="project-invite-label">Sprawdź nasz projekt</p>
      <p class="project-invite-title">Archiwum Śledcze</p></div>
      <a href="${new URL('../archiwum-sledcze/', import.meta.url).href}">Podejmij śledztwo <span aria-hidden="true">→</span></a>
      <button type="button" class="project-invite-close" aria-label="Zamknij polecenie projektu">×</button></div>`;
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
  setTimeout(showWhenReady, 20000);
}
