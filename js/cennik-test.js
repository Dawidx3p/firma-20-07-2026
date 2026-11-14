const models = {
  start: ['Strona Start', 'od 2 449 zł brutto / projekt', 'Strona firmowa z 1–3 podstronami i uruchomieniem.'],
  campaign: ['Strona kampanii', 'od 1 949 zł brutto / projekt', 'Jedna oferta, treść, formularz i uruchomienie strony.'],
  communication: ['Strona komunikacyjna', 'od 4 449 zł brutto / projekt', 'Komunikat i struktura oferty, treści, projekt i wdrożenie.'],
  audit: ['Audyt komunikacji', '499 zł brutto / audyt', 'Analiza komunikacji strony głównej, zalecenia i konsultacja.'],
  partnership: ['Partnerstwo', '999 zł brutto / miesiąc', 'Do 8 godzin miesięcznie na treść, projekt i wdrażanie zmian.'],
};

const categories = [
  {
    key: 'identyfikacja',
    name: 'Identyfikacja wizualna',
    filter: 'Identyfikacja',
    services: [
      ['Logo Start', 599, 'Jedna koncepcja, wersja kolorowa i monochromatyczna, pliki SVG i PNG.'],
      ['Logo Pro', 999, 'Dwie koncepcje, warianty wybranego znaku, pliki SVG, PDF i PNG.'],
      ['Mini brandbook', 899, 'Zasady użycia istniejącego logo, paleta i typografia w PDF.'],
      ['Identyfikacja wizualna', 2199, 'Logo Pro, mini brandbook, projekt wizytówki i papieru firmowego.', 'from'],
      ['Projekt wizytówki', 199, 'Projekt dwustronny dla jednej osoby, PDF do druku.'],
      ['Papier firmowy', 199, 'Projekt A4, PDF do druku.'],
    ],
  },
  {
    key: 'strony',
    name: 'Strony internetowe',
    filter: 'Strony WWW',
    services: [
      ['Strona firmowa 4–5 podstron', 2999, 'Projekt i wdrożenie na podstawie dostarczonych tekstów. Jeden formularz i wersja mobilna.', 'from'],
      ['Strona z indywidualnym projektem, 6–8 podstron', 4999, 'Indywidualny projekt i wdrożenie na podstawie dostarczonych tekstów. Wersja mobilna.', 'from'],
      ['Audyt UX/UI', 999, 'Sprawdzenie nawigacji, formularzy i obsługi do 5 podstron na telefonie i komputerze. Raport z zaleceniami.', 'from'],
      ['Opieka techniczna nad stroną', 199, 'Miesięczna kontrola działania jednej strony i formularza oraz raport o wykrytych problemach. Naprawy wyceniamy osobno.', 'monthly'],
    ],
  },
  {
    key: 'komunikacja',
    name: 'Komunikacja i copywriting',
    filter: 'Komunikacja',
    services: [
      ['Hasło reklamowe', 399, 'Trzy propozycje dla jednej marki lub kampanii.'],
      ['Tekst na podstronę', 349, 'Jeden tekst do 500 słów.'],
      ['Komunikacja marki', 1499, 'Pozycjonowanie, główne komunikaty i ton marki w jednym dokumencie.', 'from'],
      ['Oferta sprzedażowa', 499, 'Tekst jednej oferty, do dwóch stron A4.'],
      ['5 postów z grafikami', 599, 'Pięć tekstów i pięć grafik na jeden kanał.'],
    ],
  },
  {
    key: 'reklama',
    name: 'Reklama i kreacja',
    filter: 'Reklama',
    services: [
      ['Grafika do reklamy w social media', 149, 'Jeden statyczny projekt do reklamy w aktualnościach wybranej platformy.'],
      ['Baner na stronę internetową', 149, 'Jeden baner statyczny dopasowany do wskazanego miejsca na stronie.'],
      ['Spot reklamowy AI 15–30 s', 749, 'Jeden spot, jeden format, plik MP4.', 'from'],
      ['Konfiguracja kampanii Ads', 599, 'Jedna kampania na jednej platformie, bez bieżącej obsługi.', 'from'],
      ['Konsultacja 60 min', 199, 'Jedno spotkanie online na ustalony temat.'],
    ],
  },
];

const currency = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  maximumFractionDigits: 0,
});
const filters = document.querySelector('#pricing-filters');
const catalog = document.querySelector('#pricing-catalog');
const modelOptions = document.querySelector('#pricing-models');
const modelDescription = document.querySelector('#pricing-model-description');
const modelNote = document.querySelector('#pricing-model-note');
const bundleModel = document.querySelector('#bundle-model');
const empty = document.querySelector('#bundle-empty');
const costLabel = document.querySelector('#bundle-cost-label');
const servicesTitle = document.querySelector('#pricing-services-title');
const summary = document.querySelector('#twoj-zestaw');
const total = document.querySelector('#bundle-total');
const monthly = document.querySelector('#bundle-monthly');
const items = document.querySelector('#bundle-items');
const open = document.querySelector('#bundle-open');
const form = document.querySelector('#bundle-form');
const contactInput = document.querySelector('#bundle-contact');
const privacy = document.querySelector('#bundle-privacy');
const send = document.querySelector('#bundle-send');
const feedback = document.querySelector('#bundle-feedback');
const contactServiceUrl = new URL('./contact-service.mjs?v=pricing-1', document.currentScript.src).href;
let sending = false;
const jump = document.querySelector('#bundle-jump');
const jumpLabel = document.querySelector('#bundle-jump-label');
const selected = new Set();
const serviceControls = new Map();
const services = categories.flatMap((category) => category.services);

function formatPrice(amount, kind) {
  return (kind === 'from' ? 'od ' : '') + currency.format(amount) + ' brutto' + (kind === 'monthly' ? ' / mies.' : '');
}

function serviceRow(service) {
  const [name, amount, scope, kind] = service;
  const row = document.createElement('label');
  row.className = 'pricing-service';
  row.innerHTML = '<input type="checkbox"><span><strong></strong><small></small></span><strong class="pricing-price"></strong>';
  row.querySelector('span strong').textContent = name;
  row.querySelector('small').textContent = scope;
  row.querySelector('.pricing-price').textContent = formatPrice(amount, kind);
  const checkbox = row.querySelector('input');
  serviceControls.set(service, checkbox);
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      selected.add(service);
    } else {
      selected.delete(service);
    }
    updateBundle();
  });
  return row;
}

const groups = categories.map(({ name, services: groupServices }) => {
  const section = document.createElement('section');
  section.className = 'pricing-group';
  const heading = document.createElement('h4');
  heading.textContent = name;
  section.append(heading, ...groupServices.map(serviceRow));
  catalog.append(section);
  return section;
});

const params = new URLSearchParams(location.search);
const filterOptions = [{ name: 'Wszystkie usługi', filter: 'Wszystkie' }, ...categories];

const requestedCategory = params.get('kategoria');
const initialFilter = Math.max(0, filterOptions.findIndex(({ key }) => key === requestedCategory));

filterOptions.forEach(({ name, filter }, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = filter;
  button.setAttribute('aria-label', name);
  button.addEventListener('click', () => {
    for (const option of filters.children) {
      option.setAttribute('aria-pressed', String(option === button));
    }
    groups.forEach((group, groupIndex) => {
      group.hidden = index !== 0 && index !== groupIndex + 1;
    });
  });
  filters.append(button);
});
filters.children[initialFilter].click();

const requestedModel = params.get('model');
let selectedModel = Object.hasOwn(models, requestedModel) ? requestedModel : '';

for (const [key, [name, price]] of [...Object.entries(models), ['', ['Same usługi', 'Bez modelu współpracy']]]) {
  const button = document.createElement('button');
  const title = document.createElement('strong');
  const subtitle = document.createElement('span');
  button.type = 'button';
  button.value = key;
  title.textContent = name;
  subtitle.textContent = price;
  button.append(title, subtitle);
  button.addEventListener('click', () => {
    selectedModel = key;
    updateModel();
  });
  modelOptions.append(button);
}

function updateModel() {
  for (const button of modelOptions.children) {
    button.setAttribute('aria-pressed', String(button.value === selectedModel));
  }
  const model = models[selectedModel];
  modelDescription.hidden = !model;
  modelDescription.textContent = model ? model[2] : '';
  const buildsWebsite = ['start', 'campaign', 'communication'].includes(selectedModel);
  modelNote.hidden = !buildsWebsite;
  modelNote.textContent = buildsWebsite
    ? 'Jeśli wybierasz inną stronę dla tego samego projektu, zmień model lub wybierz „Same usługi z cennika”.'
    : '';
  servicesTitle.textContent = model ? 'Dobierz usługi do modelu' : 'Usługi z cennika';
  updateBundle();
}

for (const link of document.querySelectorAll('[data-pricing-model]')) {
  link.addEventListener('click', (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    selectedModel = link.dataset.pricingModel;
    updateModel();
    document.querySelector('#pricing-title').focus({ preventScroll: true });
    document.querySelector('#cennik').scrollIntoView();
  });
}

updateModel();

function updateBundle() {
  const model = models[selectedModel];
  bundleModel.hidden = !model;
  bundleModel.textContent = model ? model[0] + ' · ' + model[1] : '';

  const chosen = services.filter((service) => selected.has(service));
  const oneTime = chosen.filter(([, , , kind]) => kind !== 'monthly');
  const recurring = chosen.filter(([, , , kind]) => kind === 'monthly');
  const oneTimePrice = oneTime.reduce((sum, [, amount]) => sum + amount, 0);
  const monthlyPrice = recurring.reduce((sum, [, amount]) => sum + amount, 0);
  const oneTimeKind = oneTime.some(([, , , kind]) => kind === 'from') ? 'from' : '';

  empty.hidden = Boolean(model) || chosen.length > 0;
  costLabel.hidden = chosen.length === 0;
  total.hidden = oneTime.length === 0;
  total.textContent = formatPrice(oneTimePrice, oneTimeKind) + (monthlyPrice ? ' jednorazowo' : '');
  monthly.hidden = monthlyPrice === 0;
  monthly.textContent = formatPrice(monthlyPrice, 'monthly');
  items.hidden = chosen.length === 0;
  items.replaceChildren(...chosen.map((service, index) => {
    const [name, amount, , kind] = service;
    const item = document.createElement('li');
    const detail = document.createElement('span');
    const remove = document.createElement('button');
    detail.textContent = name + ' — ' + formatPrice(amount, kind);
    remove.type = 'button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', 'Usuń z zestawu: ' + name);
    remove.addEventListener('click', () => {
      selected.delete(service);
      serviceControls.get(service).checked = false;
      updateBundle();
      const nextItem = items.children[Math.min(index, items.children.length - 1)];
      (nextItem?.querySelector('button') || summary).focus();
    });
    item.append(detail, remove);
    return item;
  }));
  open.disabled = !model && chosen.length === 0;
  if (open.disabled) closeForm();
  jump.classList.toggle('has-selection', !open.disabled);
  jumpLabel.textContent = 'Twój zestaw (' + (chosen.length + Number(Boolean(model))) + ')';
  if (!sending) feedback.textContent = '';
}

const summaryObserver = new IntersectionObserver(([entry]) => {
  jump.hidden = entry.isIntersecting;
}, { rootMargin: '-77px 0px -48px 0px' });
summaryObserver.observe(summary);

jump.addEventListener('click', () => summary.focus({ preventScroll: true }));

function closeForm() {
  form.hidden = true;
  open.hidden = false;
  open.setAttribute('aria-expanded', 'false');
}

const contactViewport = window.visualViewport;
if (contactViewport) {
  let fullHeight = 0;
  let keyboardWasOpen = false;

  contactInput.addEventListener('focus', () => {
    fullHeight = contactViewport.height * contactViewport.scale;
    keyboardWasOpen = false;
  });

  contactViewport.addEventListener('resize', () => {
    if (document.activeElement !== contactInput) return;
    const height = contactViewport.height * contactViewport.scale;
    // Ignore small changes from the browser toolbar and wait for the keyboard to retract.
    if (fullHeight - height > 120) keyboardWasOpen = true;
    if (keyboardWasOpen && height >= fullHeight - 60) contactInput.blur();
  });
}

open.addEventListener('click', () => {
  open.setAttribute('aria-expanded', 'true');
  open.hidden = true;
  form.hidden = false;
  feedback.textContent = '';
  contactInput.focus();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (sending || open.disabled) return;
  const lines = Array.from(items.children, (item) => '- ' + item.firstElementChild.textContent);
  const totals = [total, monthly].filter((price) => !price.hidden).map((price) => price.textContent);
  const modelLine = bundleModel.hidden ? [] : [bundleModel.textContent, ''];
  const extras = lines.length ? [...lines, '', 'Orientacyjnie za usługi z cennika: ' + totals.join(' + ') + '.'] : [];
  const request = [
    'Dzień dobry, proszę o wycenę zestawu usług KAIROX:',
    '',
    ...modelLine,
    ...extras,
    'Proszę również o potwierdzenie zakresu i końcowej ceny brutto.',
  ].join('\n');

  const contactValue = contactInput.value.trim();
  const isEmail = contactValue.includes('@');
  const fields = {
    email: isEmail ? contactValue : '',
    phone: isEmail ? '' : contactValue,
    consent: privacy.checked,
    challenge: request,
    sourcePage: location.pathname + '#cennik',
    service: models[selectedModel]?.[0],
  };
  let contact;
  try {
    contact = await import(contactServiceUrl);
  } catch {
    feedback.textContent = 'Nie udało się załadować formularza. Odśwież stronę i spróbuj ponownie.';
    return;
  }
  if (sending || open.disabled) return;
  const validation = contact.validateContact(fields);
  if (!validation.valid) {
    if (!validation.hasContact) {
      feedback.textContent = 'Podaj adres e-mail lub numer telefonu.';
      contactInput.focus();
    } else if (!validation.validEmail) {
      feedback.textContent = 'Sprawdź adres e-mail.';
      contactInput.focus();
    } else if (!validation.validPhone) {
      feedback.textContent = 'Sprawdź numer telefonu.';
      contactInput.focus();
    } else {
      feedback.textContent = 'Potwierdź zapoznanie się z polityką prywatności.';
      privacy.focus();
    }
    return;
  }
  sending = true;
  send.disabled = true;
  contactInput.readOnly = true;
  privacy.disabled = true;
  feedback.textContent = 'Wysyłanie zapytania…';
  try {
    await contact.sendContact(fields);
    form.reset();
    closeForm();
    (open.disabled ? summary : open).focus({ preventScroll: true });
    feedback.textContent = 'Zapytanie zostało wysłane. Skontaktujemy się z Tobą.';
  } catch (error) {
    feedback.textContent = error.status
      ? 'Formspree odrzuciło zapytanie (HTTP ' + error.status + ').'
      : 'Nie otrzymaliśmy potwierdzenia wysyłki z Formspree. Zgłoszenie mogło dotrzeć.';
  } finally {
    sending = false;
    send.disabled = false;
    contactInput.readOnly = false;
    privacy.disabled = false;
  }
});
