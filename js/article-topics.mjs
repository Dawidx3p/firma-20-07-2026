import { sendArticleTopic } from './contact-service.mjs?v=article-topic-1';

const form = document.querySelector('#article-topic-form');
const message = form.elements.message;
const button = form.querySelector('button[type="submit"]');
const status = form.querySelector('[role="status"]');
button.disabled = false;

message.addEventListener('input', () => {
  message.setCustomValidity('');
  status.textContent = '';
  status.className = 'article-topic-status';
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (button.disabled) return;

  if (!message.value.trim()) {
    message.setCustomValidity('Wpisz propozycję tematu.');
    message.reportValidity();
    return;
  }

  button.disabled = true;
  message.readOnly = true;
  status.className = 'article-topic-status';
  status.textContent = 'Wysyłamy propozycję…';
  try {
    await sendArticleTopic(message.value);
    form.reset();
    status.textContent = 'Dziękujemy. Temat został wysłany.';
    status.classList.add('is-success');
  } catch {
    status.textContent = 'Nie udało się wysłać tematu. Spróbuj ponownie.';
    status.classList.add('is-error');
  } finally {
    message.readOnly = false;
    button.disabled = false;
  }
});
