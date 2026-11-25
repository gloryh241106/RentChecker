import { normaliseText } from '../quotes.js';

const WORD = /[\p{L}\p{N}]/u;

/** Whether a cut between the two texts is not inside a word or a number, such as `12,|000`. */
function isCleanCut(before: string, after: string): boolean {
  const left = before.slice(-1);
  const right = after.slice(0, 1);
  if (WORD.test(left) && WORD.test(right)) {
    return false;
  }
  return !/[0-9][,.]?$/.test(before) || !/^[,.]?[0-9]/.test(after);
}

/** F9-R3. Whether the words stand in the prompt, whole. */
export function isInPrompt(source: string, prompt: string): boolean {
  const words = normaliseText(source);
  const text = normaliseText(prompt);
  if (words === '') {
    return false;
  }
  for (let at = text.indexOf(words); at !== -1; at = text.indexOf(words, at + 1)) {
    const end = at + words.length;
    if (
      isCleanCut(text.slice(0, at), text.slice(at)) &&
      isCleanCut(text.slice(0, end), text.slice(end))
    ) {
      return true;
    }
  }
  return false;
}
