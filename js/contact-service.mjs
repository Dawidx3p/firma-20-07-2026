// Wspólna wysyłka formularza strony i formularza kontaktu w czacie.
const ENDPOINT = 'https://formspree.io/f/mojoqowy';
export function validateContact({ email = '', phone = '', consent = false }) {
  email = email.trim(); phone = phone.trim();
  const hasContact = Boolean(email || phone);
  const validEmail = !email || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  const validPhone = !phone || /^\+?[0-9]{9,15}$/.test(phone.replace(/[\s()-]/g, ''));
  return { hasContact, validEmail, validPhone, valid: hasContact && validEmail && validPhone && consent === true };
}
export async function sendContact(fields) {
  if (!validateContact(fields).valid) throw new Error('Podaj poprawny e-mail lub telefon i zaakceptuj informację o przetwarzaniu danych.');
  const payload = {
    name: String(fields.name || '').trim(), website: String(fields.website || '').trim(),
    email: fields.email.trim(), _replyto: fields.email.trim(), phone: fields.phone.trim(),
    contactMethod: String(fields.contactMethod || (fields.email.trim() ? 'E-mail' : 'Telefon')), challenge: String(fields.challenge || '').trim(),
    sourcePage: String(fields.sourcePage || ''), consent: true,
  };
  if (fields.service) payload.service = String(fields.service);
  if (fields.source === 'chat') { payload.source = 'chat'; payload.service = String(fields.service || ''); }
  const response = await fetch(ENDPOINT, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload), signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error('Nie udało się wysłać formularza. Spróbuj ponownie.');
  if (typeof document !== 'undefined') {
    const services = { 'Audyt komunikacji': 'audit', 'Strona Start': 'start', 'Strona kampanii': 'campaign',
      'Strona komunikacyjna': 'communication', 'Partnerstwo': 'partnership' };
    document.dispatchEvent(new CustomEvent('kairox:lead-sent', { detail: {
      source: fields.source === 'chat' ? 'chat' : 'website',
      service: Object.hasOwn(services, fields.service) ? services[fields.service] : 'unspecified'
    } }));
  }
}
