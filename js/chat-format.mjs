const PAGES = new Set(["", "index.html", "audyt-komunikacji.html", "strony-dla-firm/", "modele-wspolpracy.html", "partnerstwo.html", "metoda.html", "realizacje.html", "formularz-kontaktowy.html", "artykuly.html", "dlaczego-strony-nie-sprzedaja.html", "jak-klient-podejmuje-decyzje.html", "bledy-komunikacyjne-firm-uslugowych.html", "dlaczego-nie-zaczynamy-od-designu.html", "strona-jako-narzedzie-komunikacji.html", "bieg-rzeczy/", "bieg-rzeczy/o-warsztacie/", "bieg-rzeczy/z-czym-przyjechac/", "czysty-uklad/", "czysty-uklad/sprzatanie/", "czysty-uklad/pranie/", "czysty-uklad/jak-zamowic/", "sloj-i-forma/", "sloj-i-forma/meble-na-wymiar/", "sloj-i-forma/renowacja/", "sloj-i-forma/proces-i-zapytanie/", "galeria-klik/", "my-trip-world/", "archiwum-sledcze/", "amo/", "kraktax/", "ul-car/", "realizacje/galeria-klik.html", "realizacje/my-trip-world.html", "polityka-prywatnosci.html", "polityka-cookies.html"]);
function safeLink(value) {
  try {
    const url = new URL(value, 'https://kairox.pl');
    if (url.protocol !== 'https:' || !['kairox.pl', 'www.kairox.pl'].includes(url.hostname) || url.username || url.password || url.port) return null;
    if (!PAGES.has(url.pathname.slice(1))) return null;
    return url.pathname + url.search + url.hash;
  } catch { return null; }
}
export function formatTokens(text) {
  const tokens = [], pattern = /\[([^\]\n]+)\]\(([^\s)]+)\)|\*\*([^*]+)\*\*|https:\/\/(?:www\.)?kairox\.pl\/[^\s<>]+/g;
  let offset = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > offset) tokens.push({ type: 'text', text: text.slice(offset, match.index) });
    if (match[3]) tokens.push({ type: 'strong', text: match[3] });
    else {
      const raw = match[2] || match[0].replace(/[.,;!?)]+$/, '');
      const href = safeLink(raw);
      tokens.push(href ? { type: 'link', text: (match[1] || raw).replace(/\*\*/g, ''), href } : { type: 'text', text: match[1] || match[0] });
      if (!match[2] && raw.length < match[0].length) tokens.push({ type: 'text', text: match[0].slice(raw.length) });
    }
    offset = match.index + match[0].length;
  }
  if (offset < text.length) tokens.push({ type: 'text', text: text.slice(offset) });
  return tokens;
}
export function renderMessage(element, text) {
  for (const token of formatTokens(text)) {
    if (token.type === 'text') { element.append(document.createTextNode(token.text)); continue; }
    const node = document.createElement(token.type === 'strong' ? 'strong' : 'a');
    node.textContent = token.text;
    if (token.type === 'link') node.setAttribute('href', token.href);
    element.append(node);
  }
}
