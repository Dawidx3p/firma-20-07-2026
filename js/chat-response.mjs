import { CHAT_TOPICS } from './chat-topics.mjs';
import { withReference } from './chat-reference.mjs';
import { formatTokens } from './chat-format.mjs';

export function buildChatResponse(raw, message, history = []) {
  // Prefix arrives before the answer, so a token limit cannot cut off the topic key.
  const marker = raw.match(/^\s*\[connector:\s*([a-z0-9_]+)\s*\]/i);
  const candidate = marker?.[1]?.toLowerCase();
  const exactTopic = Object.keys(CHAT_TOPICS).find(key => CHAT_TOPICS[key].questions.some(question => question.toLocaleLowerCase('pl') === message.trim().toLocaleLowerCase('pl')));
  const known = exactTopic || (Object.hasOwn(CHAT_TOPICS, candidate || '') ? candidate : null);
  // Never expose protocol markers, including unknown or repeated keys.
  const text = raw.replace(/\[connector:[^\]\n]*(?:\]|$)/gi, '').trim();
  if (!text) return { error: 'Model nie zwrócił odpowiedzi tekstowej.' };
  const reply = withReference(text, message, history, known && CHAT_TOPICS[known].path);
  const path = formatTokens(reply).find(token => token.type === 'link')?.href;
  const project = path?.startsWith('/realizacje.html#') ? path.split('#')[1].replaceAll('-', '_') : null;
  const connector = known || Object.keys(CHAT_TOPICS).find(key => CHAT_TOPICS[key].path === path) || (Object.hasOwn(CHAT_TOPICS, project || '') ? project : 'home');
  return { reply, connector };
}
