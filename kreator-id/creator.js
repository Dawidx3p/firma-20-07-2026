const root = './szablony/';
const templates = [
  { label: 'Gaming', path: '', image: 'neon-vex.jpg', split: true },
  { label: 'Osobisty', path: 'ola/', image: 'ola-nowak.jpg' },
  { label: 'Streamer', path: 'mika/', image: 'mika-byte.jpg', split: true },
  { label: 'CV', path: 'adam/', image: 'adam-lis.jpg' },
  { label: 'Skate', path: 'kuba/', image: 'kuba-zine.jpg', split: true },
];
const editor = document.querySelector('#editor');
const picker = document.querySelector('#templates');
const frame = document.querySelector('#preview');
const nameField = document.querySelector('#name');
const bioField = document.querySelector('#bio');
const photoField = document.querySelector('#photo');
const photoError = document.querySelector('#photo-error');
const links = document.querySelector('#links');
const addButton = document.querySelector('#add-link');
const downloadButton = document.querySelector('#download-project');
const downloadStatus = document.querySelector('#download-status');
const views = document.querySelectorAll('[data-view]');
let template = templates[0];
let preview;
let photoUrl = '';
let photoSelection = 0;
let view = 'start';
let exporting = false;
let loadingPhoto = false;

function updateDownloadButton() {
  downloadButton.disabled = !preview || exporting || loadingPhoto;
}

for (const [index, item] of templates.entries()) {
  const label = document.createElement('label');
  label.className = 'template';
  label.innerHTML = '<input type="radio" name="template"><span><img alt=""></span>';
  label.querySelector('img').src = root + 'assets/' + item.image;
  label.querySelector('span').append(item.label);
  const radio = label.querySelector('input');
  radio.checked = index === 0;
  radio.addEventListener('change', () => {
    template = item;
    loadTemplate();
  });
  picker.append(label);
}

function loadTemplate() {
  preview = undefined;
  updateDownloadButton();
  frame.src = root + template.path + 'index.html#' + view;
}

function updateView(next) {
  view = next;
  for (const button of views) {
    button.setAttribute('aria-pressed', String(button.dataset.view === view));
  }
}

for (const button of views) {
  button.addEventListener('click', () => {
    updateView(button.dataset.view);
    if (preview) preview.doc.defaultView.location.hash = view;
  });
}

frame.addEventListener('load', () => {
  const doc = frame.contentDocument;
  const error = document.querySelector('#preview-error');
  error.hidden = Boolean(doc?.querySelector('.hero'));
  if (!error.hidden) return;

  const heading = doc.querySelector('h1');
  const bio = doc.querySelector('.bio');
  const title = doc.querySelector('#directory-title');
  const entries = doc.querySelector('.entries');
  const hero = doc.querySelector('.hero');
  const backdrop = doc.defaultView.getComputedStyle(hero, '::before');
  const photo = doc.createElement('img');
  photo.className = 'creator-photo';
  photo.alt = '';
  photo.hidden = true;
  photo.style.objectPosition = backdrop.backgroundPosition.split(',').at(-1).trim();
  hero.style.setProperty('--creator-shade', backdrop.backgroundImage.replace(/,\s*url\([^)]*\)$/, ''));
  hero.prepend(photo);
  const style = doc.createElement('style');
  style.textContent = `
    #start.hero:has(.creator-photo:not([hidden]))::before { background-image: var(--creator-shade); }
    .creator-photo { position: absolute; inset: 0; z-index: -2; width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
    .hero h1 { font-size: clamp(2.2rem, 17vw, 5.8rem); line-height: .9; overflow-wrap: anywhere; }
    .identity { min-width: 0; }
    .hero .bio { overflow-wrap: anywhere; white-space: pre-line; }
    body .directory .entries { display: block; }
    .creator-links { list-style: none; padding: 0; margin: 12px 0 0; }
    .creator-links a { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 12px; margin-bottom: 8px; border: 1px solid var(--line); border-radius: 6px; color: inherit; text-decoration: none; overflow-wrap: anywhere; }
    .creator-links a:hover { border-color: currentColor; }
    .creator-links a span { flex: 0 0 auto; }
    .creator-empty { font-size: .9rem; }
  `;
  doc.head.append(style);
  doc.querySelectorAll('.eyebrow, .role, .panel-name, .career-role, .career-tabs, .filters, .search, .directory-hint, .empty, .panel-footer, .career-footer, .share-button, #share-dialog').forEach(element => {
    element.hidden = true;
  });
  title.textContent = 'Linki';
  doc.querySelector('.jump').textContent = 'Zobacz linki';
  entries.setAttribute('aria-label', 'Linki wizytówki');
  preview = { doc, heading, bio, entries, photo };
  doc.defaultView.addEventListener('hashchange', () => {
    updateView(doc.defaultView.location.hash === '#profile' ? 'profile' : 'start');
  });
  doc.defaultView.location.hash = view;
  render();
  updateDownloadButton();
});

function parseAddress(value) {
  try {
    const address = new URL(value.trim());
    return ['https:', 'http:'].includes(address.protocol) ? address : null;
  } catch {
    return null;
  }
}

function render() {
  if (!preview) return;
  const { doc, heading, bio, entries, photo } = preview;
  const name = nameField.value.trim() || 'Twoja nazwa';
  const words = name.split(/\s+/);
  if (template.split && words.length > 1) {
    const accent = doc.createElement('em');
    accent.textContent = words.pop();
    heading.replaceChildren(words.join(' '), doc.createElement('br'), accent);
  } else {
    heading.textContent = name;
  }
  bio.textContent = bioField.value.trim();
  bio.hidden = !bio.textContent;
  photo.hidden = !photoUrl;
  if (photoUrl && photo.src !== photoUrl) photo.src = photoUrl;

  const list = doc.createElement('ul');
  list.className = 'creator-links';
  for (const row of links.children) {
    const [label, url] = row.querySelectorAll('input');
    const address = parseAddress(url.value);
    if (!address) continue;

    const item = doc.createElement('li');
    const anchor = doc.createElement('a');
    anchor.href = address.href;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    const arrow = doc.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    anchor.append(label.value.trim() || address.hostname, arrow);
    item.append(anchor);
    list.append(item);
  }
  const empty = doc.createElement('p');
  empty.className = 'creator-empty';
  empty.textContent = 'Po wpisaniu adresu link pojawi się tutaj.';
  if (entries.tagName === 'UL') {
    const emptyItem = doc.createElement('li');
    emptyItem.append(empty);
    entries.replaceChildren(...(list.children.length ? list.children : [emptyItem]));
  } else {
    entries.replaceChildren(list.children.length ? list : empty);
  }
}

function addLink(focus = true) {
  const row = document.createElement('div');
  row.className = 'link-row';
  row.innerHTML = `
    <label>Etykieta<input type="text" maxlength="60" placeholder="Instagram"></label>
    <label>Adres URL<input type="url" placeholder="https://…"></label>
    <button class="remove" type="button" aria-label="Usuń link">×</button>`;
  const url = row.querySelector('[type="url"]');
  url.addEventListener('input', () => {
    url.setCustomValidity(url.value.trim() && !parseAddress(url.value) ? 'Wpisz adres zaczynający się od https:// lub http://.' : '');
  });
  url.addEventListener('blur', () => url.reportValidity());
  row.querySelector('button').addEventListener('click', () => {
    const nextField = (row.nextElementSibling || row.previousElementSibling)?.querySelector('input');
    row.remove();
    (nextField || addButton).focus();
    render();
  });
  links.append(row);
  if (focus) row.querySelector('input').focus();
}

photoField.addEventListener('change', async () => {
  const file = photoField.files[0];
  const selection = ++photoSelection;
  photoError.hidden = true;
  if (!file) {
    loadingPhoto = false;
    photoUrl = '';
    render();
    updateDownloadButton();
    return;
  }

  loadingPhoto = true;
  updateDownloadButton();
  try {
    const reader = new FileReader();
    const url = await new Promise((resolve, reject) => {
      reader.addEventListener('load', () => resolve(reader.result), { once: true });
      reader.addEventListener('error', reject, { once: true });
      reader.readAsDataURL(file);
    });
    const image = new Image();
    image.src = url;
    await image.decode();
    if (selection !== photoSelection) return;
    photoUrl = url;
  } catch {
    if (selection !== photoSelection) return;
    photoError.textContent = 'Nie udało się wyświetlić pliku. Wybierz zdjęcie w formacie JPG, PNG lub WebP.';
    photoError.hidden = false;
    return;
  } finally {
    if (selection === photoSelection) {
      loadingPhoto = false;
      updateDownloadButton();
    }
  }

  updateView('start');
  if (preview) preview.doc.defaultView.location.hash = view;
  render();
});
downloadButton.addEventListener('click', async () => {
  if (!preview || exporting || loadingPhoto) return;
  exporting = true;
  updateDownloadButton();
  downloadStatus.hidden = false;
  downloadStatus.textContent = 'Przygotowuję pliki projektu…';
  try {
    await exportProject(preview.doc, nameField.value.trim() || 'Digital ID');
    downloadStatus.textContent = 'ZIP jest gotowy do pobrania.';
  } catch {
    downloadStatus.textContent = 'Nie udało się przygotować ZIP-a. Spróbuj ponownie.';
  } finally {
    exporting = false;
    updateDownloadButton();
  }
});
editor.addEventListener('input', render);
editor.addEventListener('submit', event => event.preventDefault());
addButton.addEventListener('click', () => addLink());
addLink(false);
loadTemplate();
