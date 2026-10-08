const services = [
  { id: 'audit', label: 'Audyt komunikacji', pattern: /\baudyt\w*\b/ },
  { id: 'start', label: 'Strona Start', pattern: /\bstron\w*\s+start\b|\bpakiet\w*\s+start\b/ },
  { id: 'campaign', label: 'Strona kampanii', pattern: /\blanding\w*\b|\bstron\w*\s+kampani\w*\b/ },
  { id: 'communication', label: 'Strona komunikacyjna', pattern: /\bstron\w*\s+komunikacyjn\w*\b/ },
  { id: 'partnership', label: 'Partnerstwo', pattern: /\bpartnerstw\w*\b|\bstal\w*\s+(?:wspolprac\w*|opiek\w*)\b/ },
];
function normalize(text) { return text.toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function mentioned(text) { return services.filter(service => service.pattern.test(text)); }
function declining(text) { return /\bnie\s+(?:chce|potrzebuje|interesuje|jestem zainteresowan)\w*\b|\brezygnuj\w*\b/.test(text); }
// Liczymy pytania użytkownika, nie nazwy usług w odpowiedzi modelu.
export function inferService(message, history = []) {
  const text = normalize(message);
  if (declining(text)) return null;
  const current = mentioned(text);
  if (current.length === 1) return { id: current[0].id, label: current[0].label };
  if (current.length > 1) return null; // Porównanie wielu usług nie jest wyborem jednej.
  if (!/^(?:a\s+)?(?:co\s+(?:obejm\w*|zawier\w*|dostan\w*)|ile\b|jak\s+(?:dlugo|wyglada|dziala|przebiega)|czy\s+(?:w\s+)?(?:cenie|pakiecie)|kiedy\b)|\b(?:zakres\w*|kosztuje|termin\w*|trwa\w*|cena|cenie)\b/.test(text)) return null;
  // Domyślny kontekst musi wynikać z ostatniego pytania, nie z ogólnej oferty.
  const last = history.filter(item => item.role === 'user').at(-1);
  if (!last) return null;
  const previous = normalize(last.content);
  const context = mentioned(previous);
  return !declining(previous) && context.length === 1 ? { id: context[0].id, label: context[0].label } : null;
}
