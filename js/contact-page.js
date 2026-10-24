"use strict";

const form = document.getElementById("contactForm");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const privacy = document.getElementById("privacy");
const submitButton = document.getElementById("submitButton");
const formStatus = document.getElementById("formStatus");
const website = document.getElementById("website");
const contactMethod = document.getElementById("contactMethod");
const contactServiceUrl = new URL("./contact-service.mjs?v=audit-2", document.currentScript.src).href;

const contactParams = new URLSearchParams(window.location.search);
const websiteFromUrl = contactParams.get("website");
const services = {
  audit: "Audyt komunikacji", start: "Strona Start", campaign: "Strona kampanii",
  communication: "Strona komunikacyjna", partnership: "Partnerstwo",
  visualization: "Bezpłatna wizualizacja pierwszego ekranu"
};
const serviceId = contactParams.get("service");
const selectedService = Object.hasOwn(services, serviceId) ? services[serviceId] : "";
const serviceContext = document.getElementById("contactServiceContext");
const isVisualization = serviceId === "visualization";
const submitLabel = isVisualization ? "Zgłoś stronę do bezpłatnej wizualizacji" : "Wyślij zgłoszenie";
if (isVisualization) {
  document.title = "Bezpłatna wizualizacja pierwszego ekranu — KAIROX";
  document.querySelector(".contact-landing-intro .eyebrow").textContent = "Bezpłatna wizualizacja";
  document.querySelector(".contact-landing-intro h1").textContent = "Zobacz, jak może wyglądać pierwszy ekran Twojej strony";
  document.querySelector(".contact-landing-lead").textContent = "Otrzymasz propozycję wyglądu, głównego komunikatu i przycisku kontaktu. Najpierw sprawdzimy zgłoszenie i potwierdzimy zakres oraz termin. Bez obowiązku zamówienia strony.";
  document.querySelector(".contact-form-card h2").textContent = "Zgłoś stronę do bezpłatnej wizualizacji";
  document.querySelector('label[for="challenge"]').textContent = "Czym zajmuje się Twoja firma i co chcesz pokazać lub poprawić?";
  document.querySelector(".contact-expectations").setAttribute("aria-label", "Jak otrzymać bezpłatną wizualizację");
  const steps = document.querySelectorAll(".contact-expectations p");
  steps[1].textContent = "Sprawdzamy zgłoszenie i potwierdzamy zakres oraz termin.";
  steps[2].textContent = "Otrzymujesz wizualizację pierwszego ekranu i oceniasz kierunek.";
  submitButton.textContent = submitLabel;
}
if (selectedService) {
  serviceContext.textContent = `Temat rozmowy: ${selectedService}`;
  serviceContext.hidden = false;
}
let sourcePage = window.location.pathname;
try {
  const source = contactParams.get("source") || document.referrer;
  if (source) {
    const sourceUrl = new URL(source, window.location.origin);
    if (sourceUrl.origin === window.location.origin && /^\/(?:[a-z0-9-]+\.html)?$/.test(sourceUrl.pathname)) {
      sourcePage = sourceUrl.pathname;
    }
  }
} catch (_) { /* Niepoprawne źródło nie blokuje formularza. */ }
let submitting = false;
let submitted = false;

if (websiteFromUrl) website.value = websiteFromUrl;

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function isValidPhone(value) {
  return /^\+?[0-9]{9,15}$/.test(value.replace(/[\s()-]/g, ""));
}

function validateForm() {
  const hasContact = email.value.trim() !== "" || phone.value.trim() !== "";
  submitButton.disabled = submitting || submitted || !(hasContact && privacy.checked);
  for (const option of contactMethod.options) {
    option.disabled = (option.value === "E-mail" && !email.value.trim()) ||
      (["Telefon", "WhatsApp"].includes(option.value) && !phone.value.trim());
  }
  if (contactMethod.selectedOptions[0]?.disabled) contactMethod.value = "";

  if (privacy.checked) privacy.parentElement.classList.remove("checkbox-error");
}

function setError(field, message) {
  field.setAttribute("aria-invalid", String(Boolean(message)));
  field.classList.toggle("field-error", Boolean(message));
  const note = document.getElementById(`${field.id}Error`);
  if (note) note.textContent = message;
}

const wizardSteps = [...form.querySelectorAll('[data-contact-step]')];
const wizardProgress = form.querySelector('.contact-wizard-progress');
let currentStep = 0;
function showStep(index, focus = true) {
  currentStep = index;
  wizardSteps.forEach((step, i) => { step.hidden = i !== index; });
  [...wizardProgress.children].forEach((item, i) => {
    if (i === index) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  });
  if (index === 2) {
    const summary = document.getElementById('contactSummary');
    summary.replaceChildren();
    const values = [
      ['Temat', selectedService || 'Rozmowa o stronie'],
      ['Strona', website.value.trim() || 'Nie podano'],
      ['Opis', document.getElementById('challenge').value.trim() || 'Do omówienia w rozmowie'],
      ['Kontakt', [email.value.trim(), phone.value.trim()].filter(Boolean).join(' / ')],
      ['Forma kontaktu', contactMethod.value || 'Bez preferencji']
    ];
    for (const [label, value] of values) {
      const dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = label; dd.textContent = value; summary.append(dt, dd);
    }
  }
  formStatus.textContent = '';
  if (focus) wizardSteps[index].querySelector('legend').focus();
}
function checkContactStep() {
  const hasContact = Boolean(email.value.trim() || phone.value.trim());
  const validEmail = !email.value.trim() || isValidEmail(email.value.trim());
  const validPhone = !phone.value.trim() || isValidPhone(phone.value.trim());
  setError(email, !hasContact ? 'Podaj e-mail lub numer telefonu.' : !validEmail ? 'Wpisz poprawny e-mail, np. imie@firma.pl.' : '');
  setError(phone, !hasContact ? 'Podaj e-mail lub numer telefonu.' : !validPhone ? 'Wpisz numer zawierający od 9 do 15 cyfr.' : '');
  if (!hasContact || !validEmail || !validPhone) {
    (!hasContact || !validEmail ? email : phone).focus();
    return false;
  }
  return true;
}
function nextStep() {
  if (submitting || submitted) return;
  if (currentStep === 1 && !checkContactStep()) return;
  showStep(Math.min(2, currentStep + 1));
}
form.querySelectorAll('[data-contact-next]').forEach(button => button.addEventListener('click', nextStep));
form.querySelectorAll('[data-contact-back]').forEach(button => button.addEventListener('click', () => {
  if (!submitting && !submitted) showStep(Math.max(0, currentStep - 1));
}));
wizardProgress.hidden = false;
form.querySelectorAll('[data-contact-navigation]').forEach(nav => { nav.hidden = false; });
showStep(0, false);

[email, phone, privacy].forEach(field => field.addEventListener("input", () => {
  setError(field, "");
  if (field === email && email.value.trim() && !phone.value.trim()) setError(phone, "");
  if (field === phone && phone.value.trim() && !email.value.trim()) setError(email, "");
}));

[email, phone].forEach((field) => field.addEventListener("input", validateForm));
privacy.addEventListener("change", validateForm);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (submitting || submitted) return;
  if (currentStep < 2) { nextStep(); return; }
  formStatus.textContent = "";
  formStatus.className = "form-status";

  const emailValue = email.value.trim();
  const phoneValue = phone.value.trim();
  const hasContact = emailValue !== "" || phoneValue !== "";
  const validEmail = emailValue === "" || isValidEmail(emailValue);
  const validPhone = phoneValue === "" || isValidPhone(phoneValue);

  email.classList.toggle("field-error", !hasContact || !validEmail);
  phone.classList.toggle("field-error", !hasContact || !validPhone);
  privacy.parentElement.classList.toggle("checkbox-error", !privacy.checked);
  setError(email, !hasContact ? "Podaj e-mail lub numer telefonu." : !validEmail ? "Wpisz poprawny e-mail, np. imie@firma.pl." : "");
  setError(phone, !hasContact ? "Podaj e-mail lub numer telefonu." : !validPhone ? "Wpisz numer zawierający od 9 do 15 cyfr." : "");
  setError(privacy, !privacy.checked ? "Potwierdź zapoznanie się z informacją o przetwarzaniu danych." : "");

  if (!hasContact || !validEmail || !validPhone || !privacy.checked) {
    if (!hasContact || !validEmail || !validPhone) showStep(1);
    formStatus.textContent = "Sprawdź zaznaczone pola.";
    formStatus.classList.add("is-error");
    (!hasContact || !validEmail ? email : !validPhone ? phone : privacy).focus();
    return;
  }

  submitting = true;
  submitButton.disabled = true;
  submitButton.textContent = "Wysyłanie...";

  try {
    const { sendContact } = await import(contactServiceUrl);
    await sendContact({
      name: document.getElementById("name").value.trim(),
      website: website.value.trim(), email: emailValue, phone: phoneValue,
      contactMethod: contactMethod.value,
      challenge: document.getElementById("challenge").value.trim(),
      sourcePage, service: selectedService, consent: privacy.checked
    });

    submitted = true;
    form.reset(); form.hidden = true;
    formStatus.textContent = isVisualization
      ? "Dziękujemy! Twoje zgłoszenie dotarło do KAIROX. Skontaktujemy się, żeby potwierdzić zakres i termin bezpłatnej wizualizacji pierwszego ekranu."
      : "Dziękujemy! Twoje zgłoszenie dotarło do KAIROX. Skontaktujemy się, żeby omówić Twoją sytuację i możliwy kolejny krok.";
    formStatus.classList.add("is-success");

    formStatus.focus();
    document.getElementById("contactSuccessActions").hidden = false;
  } catch (error) {
    formStatus.textContent = "Nie udało się wysłać formularza. Spróbuj ponownie.";
    formStatus.classList.add("is-error");
  } finally {
    submitting = false;
    submitButton.textContent = submitLabel;
    validateForm();
  }
});

validateForm();

document.querySelectorAll(".copy-email").forEach((button) => {
  button.addEventListener("click", async () => {
    const emailAddress = button.dataset.email;
    const status = button.parentElement.querySelector(".copy-email-status");

    try {
      await navigator.clipboard.writeText(emailAddress);
    } catch (error) {
      const temporaryField = document.createElement("textarea");
      temporaryField.value = emailAddress;
      temporaryField.setAttribute("readonly", "");
      temporaryField.style.position = "fixed";
      temporaryField.style.opacity = "0";
      document.body.appendChild(temporaryField);
      temporaryField.select();
      document.execCommand("copy");
      temporaryField.remove();
    }

    button.textContent = "Skopiowano";
    status.textContent = `Skopiowano adres ${emailAddress}`;

    window.setTimeout(() => {
      button.textContent = "Kopiuj";
      status.textContent = "";
    }, 2200);
  });
});
