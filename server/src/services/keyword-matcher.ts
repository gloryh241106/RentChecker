import { hasQuoteLength, normaliseText } from '../../../shared/src/index.js';
import type { ClauseMatch, MatchRequest } from '../../../shared/src/index.js';
import { NEGATION_WORDS, STOP_WORDS, TOPIC_GROUPS } from './keyword-tables.js';

export type KeywordMatcher = (request: MatchRequest) => ClauseMatch[];

interface Sentence {
  text: string;
  words: ReadonlySet<string>;
}

// F2-R8: after . ! ? ; followed by whitespace, and at line breaks.
const SENTENCE_BREAK = /(?<=[.!?;])\s+|[\n\r\p{Zl}\p{Zp}]+/u;

const wordsOf = (text: string): Set<string> =>
  new Set(text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []);

// F2-R8: sentences outside the quote length are not candidates.
function candidateSentences(leaseText: string): Sentence[] {
  return leaseText
    .split(SENTENCE_BREAK)
    .map((part) => part.trim())
    .filter((text) => hasQuoteLength(normaliseText(text)))
    .map((text) => ({ text, words: wordsOf(text) }));
}

// F2-R8: only words of the label itself bring in a group, so groups do not chain.
function itemWords(label: string): string[] {
  const own = [...wordsOf(label)].filter((word) => !STOP_WORDS.has(word));
  const groups = Object.values(TOPIC_GROUPS).filter((group) =>
    group.some((word) => own.includes(word)),
  );
  return [...new Set([...own, ...groups.flat()])];
}

// F2-R9: undefined when no sentence scores or the best score is shared.
function bestSentence(label: string, sentences: readonly Sentence[]): Sentence | undefined {
  const wanted = itemWords(label);
  let best: Sentence | undefined;
  let bestScore = 0;
  for (const sentence of sentences) {
    const score = wanted.filter((word) => sentence.words.has(word)).length;
    if (score > bestScore) {
      best = sentence;
      bestScore = score;
    } else if (score === bestScore) {
      best = undefined;
    }
  }
  return best;
}

// F2-R9. Normalising makes a curly apostrophe straight, so won’t and won't are the same.
const isNegated = ({ text, words }: Sentence): boolean =>
  NEGATION_WORDS.some((word) => words.has(word)) || /n't\b/.test(normaliseText(text));

/** F2-R7 to F2-R11. Returns only `verified` or `unconfirmed`. */
export const matchByKeyword: KeywordMatcher = ({ leaseText, items }) => {
  const sentences = candidateSentences(leaseText);
  return items.map(({ id, label }) => {
    const best = bestSentence(label, sentences);
    return best === undefined || isNegated(best)
      ? { itemId: id, state: 'unconfirmed', quote: null, source: 'keyword' }
      : { itemId: id, state: 'verified', quote: best.text, source: 'keyword' };
  });
};
