import { inferService } from './chat-interest.mjs';
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
const questions = {
  audit: ['Co obejmuje audyt komunikacji?', 'Ile trwa audyt komunikacji?', 'Jak rozpocząć audyt?', 'Ile kosztuje audyt komunikacji?'],
  start: ['Co obejmuje Strona Start?', 'Dla kogo jest Strona Start?', 'Jak wygląda proces tworzenia Strony Start?', 'Ile kosztuje Strona Start?'],
  campaign: ['Co obejmuje strona kampanii?', 'Jak landing page pomaga pozyskiwać kontakty?', 'Jak przygotować się do strony kampanii?', 'Ile kosztuje strona kampanii?'],
  communication: ['Co obejmuje strona komunikacyjna?', 'Jak projektujecie komunikację marki?', 'Jak wygląda proces tworzenia strony komunikacyjnej?', 'Ile kosztuje strona komunikacyjna?'],
  partnership: ['Co obejmuje partnerstwo?', 'Dla kogo jest stała współpraca?', 'Jak zacząć partnerstwo?', 'Ile kosztuje partnerstwo?'],
  portfolio: ['Czym jest Galeria Klik?', 'Co pokazuje projekt AMO?', 'Jak działa My Trip World?', 'Czym jest Archiwum Śledcze?'],
  articles: ['Dlaczego strony nie sprzedają?', 'Jak klient podejmuje decyzję?', 'Jakie są błędy komunikacyjne firm?', 'Dlaczego zaczynacie od strategii?'],
  process: ['Jak działa Metoda Agent 0?', 'Dlaczego strategia jest pierwsza?', 'Jak przygotować się do współpracy?', 'Co obejmuje audyt komunikacji?'],
};
export function getSuggestions(message = '', history = []) {
  if (!message) return getOpeningSuggestions();
  const text = message.toLowerCase();
  let topic = /realizac|projekt|galeri|trip world|archiwum|\bamo\b|portfolio/.test(text) ? 'portfolio'
    : /artyku|przeczyta|czyta|nie sprzedaj|bledy|błędy/.test(text) ? 'articles'
    : /metod|proces|strateg|design/.test(text) ? 'process' : null;
  const service = inferService(message, history);
  if (service) topic = service.id;
  const pool = questions[topic] || [...OPENING_QUESTIONS.slice(0, 3), "Co obejmuje audyt komunikacji?"];
  return pool.filter(question => question.toLowerCase() !== text).slice(0, 3);
}
