import { CHAT_TOPICS } from './chat-topics.mjs?v=connectors-1';
export const OPENING_QUESTIONS = Object.freeze([
  "Potrzebuję strony. Od czego zacząć?",
  "Czy poprawicie moją obecną stronę?",
  "Ile kosztuje Strona Start?",
  "Co obejmuje Strona Start?",
  "Czy potrzebuję strony do kampanii?",
  "Ile kosztuje strona kampanii?",
  "Czym jest strona komunikacyjna?",
  "Ile kosztuje strona komunikacyjna?",
  "Na czym polega audyt?",
  "Ile kosztuje audyt strony?",
  "Jak zgłosić stronę do wizualizacji?",
  "Co obejmuje bezpłatna wizualizacja?",
  "Ile trwa stworzenie strony?",
  "Jak wygląda współpraca krok po kroku?",
  "Co przygotować przed rozpoczęciem prac?",
  "Co obejmuje Partnerstwo?",
  "Ile kosztuje miesięczna opieka?",
  "Gdzie obejrzę Wasze projekty?",
  "Czy Bieg Rzeczy to koncepcja?",
  "Który projekt pasuje do mojej firmy?"
]);
export function getOpeningSuggestions(random = Math.random) {
  const pool = [...OPENING_QUESTIONS];
  for (let i = 0; i < 3; i++) {
    const j = i + Math.floor(random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}
// The model supplies only a validated topic key. Questions stay in this local catalog.
export function getSuggestions(message = '', history = [], connector = '', random = Math.random) {
  if (!message) return getOpeningSuggestions(random);
  const pool = Object.hasOwn(CHAT_TOPICS, connector) ? CHAT_TOPICS[connector].questions : null;
  if (!pool) return getOpeningSuggestions(random).slice(0, 2);
  const asked = new Set([message, ...history.filter(item => item.role === 'user').map(item => item.content)].map(text => text.trim().toLocaleLowerCase('pl')));
  const candidates = [...new Set(pool)].filter(question => !asked.has(question.toLocaleLowerCase('pl')));
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates.slice(0, 2);
}
