import { formatTokens } from './chat-format.mjs';
const normalize = value => value.toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const rules = [
  [/wizualiz|pierwsz\w* ekran/, '/strony-dla-firm/#wizualizacja'],
  [/przyklad\w* audyt|audyt\w* przyklad/, '/audyt-komunikacji.html#przykladowy-audyt'],
  [/audyt/, '/audyt-komunikacji.html'],
  [/partnerstw|miesieczn\w* opiek|stal\w* opiek|abonament/, '/partnerstwo.html'],
  [/stron\w* start|stron\w* dla firm/, '/strony-dla-firm/'],
  [/stron\w* kampani|landing|stron\w* komunikacyjn|model\w* wspolprac/, '/modele-wspolpracy.html'],
  [/o warsztacie/, '/bieg-rzeczy/o-warsztacie/'],
  [/z czym przyjechac/, '/bieg-rzeczy/z-czym-przyjechac/'],
  [/bieg rzeczy/, '/realizacje.html#bieg-rzeczy'],
  [/czysty uklad/, '/realizacje.html#czysty-uklad'],
  [/sloj i forma/, '/realizacje.html#sloj-i-forma'],
  [/galeria klik/, '/realizacje.html#galeria-klik'],
  [/my trip world/, '/realizacje.html#my-trip-world'],
  [/archiwum sledcze/, '/realizacje.html#archiwum-sledcze'],
  [/\bamo\b/, '/realizacje.html#amo'],
  [/kraktax/, '/kraktax/'], [/ul car/, '/ul-car/'],
  [/dlaczego (?:wiekszosc )?stron\w* nie sprzedaj/, '/dlaczego-strony-nie-sprzedaja.html'],
  [/jak klient podejmuje decyzj/, '/jak-klient-podejmuje-decyzje.html'],
  [/bled\w* komunikacyjn/, '/bledy-komunikacyjne-firm-uslugowych.html'],
  [/dlaczego nie zaczyn|dlaczego zaczyn.*strateg/, '/dlaczego-nie-zaczynamy-od-designu.html'],
  [/stron\w* (?:internetowa )?(?:to nie wizytowka|jako narzedzie)/, '/strona-jako-narzedzie-komunikacji.html'],
  [/artykul|przeczyta/, '/artykuly.html'],
  [/realizac|portfolio|wasz\w* projekt|obejrz.*projekt/, '/realizacje.html'],
  [/metod|proces|strateg|jak.*wspolprac|przygotowac.*prac/, '/metoda.html'],
  [/dawid|zalozyciel/, '/#zalozyciel'],
  [/prywatn|dane osobow/, '/polityka-prywatnosci.html'],
  [/cookie/, '/polityka-cookies.html'],
  [/kontakt|porozmawiac|napisac/, '/formularz-kontaktowy.html'],
  [/ofert|cen[ayie]|koszt.*stron|now\w* stron|potrzebuj.*stron/, '/modele-wspolpracy.html'],
];
function topic(text, includeGeneric = true) {
  const matches = rules.slice(0, -1).filter(([pattern]) => pattern.test(normalize(text)));
  // Several services in a comparison should lead to their common overview.
  const servicePaths = new Set(matches.map(([, path]) => path).filter(path => ['/partnerstwo.html', '/strony-dla-firm/', '/audyt-komunikacji.html', '/modele-wspolpracy.html'].includes(path)));
  return servicePaths.size > 1 ? '/modele-wspolpracy.html' : matches[0]?.[1] || (includeGeneric && rules.at(-1)[0].test(normalize(text)) ? rules.at(-1)[1] : undefined);
}
export function withReference(reply, message, history = [], referencePath = null) {
  if (/^(?:czesc|hej|witam|dzien dobry|dziekuje|dzieki|ok|dobrze|super)[!.,\s]*$/.test(normalize(message.trim()))) return reply;
  const current = topic(message, false);
  const lastUser = history.filter(item => item.role === 'user').at(-1)?.content;
  const followUp = /^(?:a\s+)?(?:ile|co|jak|czy|kiedy)|\b(?:cen[ayie]|koszt|termin|zakres)\b/.test(normalize(message));
  const existing = formatTokens(reply).find(token => token.type === 'link')?.href;
  const path = referencePath || current || (followUp && lastUser && topic(lastUser)) || existing || topic(message) || topic(reply);
  if (!path) return reply;
  // Discard an unfinished/generated footer: the URL is appended outside the model's token budget.
  const body = reply.replace(/\s*(?:wiecej informacji|więcej informacji)(?: znajdziesz tu)?\s*:[\s\S]*$/i, '').trim();
  const clean = formatTokens(body).map(token => token.type === 'link'
    ? (/^https:\/\//.test(token.text) ? '' : token.text)
    : token.type === 'strong' ? `**${token.text}**` : token.text).join('').trim();
  return [clean, `Więcej informacji znajdziesz tu: https://kairox.pl${path}`].filter(Boolean).join('\n\n');
}
