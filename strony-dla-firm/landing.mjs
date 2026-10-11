import { sendContact, validateContact } from '../js/contact-service.mjs?v=audit-2';

const form = document.getElementById('visualizationForm');
const status = document.getElementById('visualizationStatus');
const button = form.querySelector('button[type="submit"]');
let submitting = false;

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting || !form.reportValidity()) return;
  const data = new FormData(form);
  const fields = {
    email: data.get('email').trim(), phone: data.get('phone').trim(),
    consent: data.get('privacy') === 'on',
  };
  if (!validateContact(fields).valid) {
    status.textContent = 'Sprawdź adres e-mail i numer telefonu. Numer powinien zawierać od 9 do 15 cyfr.';
    status.className = 'form-status is-error';
    status.focus();
    return;
  }
  submitting = true;
  button.disabled = true;
  button.textContent = 'Wysyłanie…';
  status.textContent = '';
  status.className = 'form-status';
  try {
    await sendContact({
      ...fields, name: data.get('name'), website: data.get('website'),
      contactMethod: 'E-mail', sourcePage: '/strony-dla-firm/',
      service: 'Bezpłatna wizualizacja — Strona Start',
      challenge: `Firma i branża: ${data.get('company')}\nCel: ${data.get('goal')}\nBudżet na wdrożenie: ${data.get('budget')}`,
    });
    form.hidden = true;
    status.className = 'form-status is-success';
    status.textContent = 'Dziękuję! Zgłoszenie dotarło do KAIROX. Skontaktuję się z Tobą, żeby potwierdzić zakres i możliwy termin bezpłatnej wizualizacji.';
    status.focus();
  } catch {
    status.className = 'form-status is-error';
    status.textContent = 'Nie udało się wysłać zgłoszenia. Spróbuj ponownie lub napisz na kontakt@kairox.pl.';
    status.focus();
  } finally {
    submitting = false;
    button.disabled = false;
    button.textContent = 'Zamów bezpłatną wizualizację';
  }
});
