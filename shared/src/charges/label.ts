import { MAX_SHORT_TEXT_LENGTH } from '../limits.js';
import type { FoundAmount } from './amount.js';

const NO_LABEL = 'Charge';

const LIST_MARK = /^\s*(?:[0-9]{1,2}[.)]|[-–—*•])\s*/;
const LEAD_IN = /^.*\b(?:deduct(?:ed|ing|ions?)?|cut|charged|charging|less|minus)\b\s*/i;
const FIRST_WORDS = /^(?:(?:for|towards|as|the|also|of)\s+)+/i;
const LAST_WORD = /\s+(?:of|is|was|at|for|only)$/i;
const LAST_SIGNS = /[\s:=@,.\-–—]+$/;

/** What stands after a colon is the label, unless nothing does ("Repainting: 12,000"). */
function afterColon(text: string): string {
  const tail = text.slice(text.lastIndexOf(':') + 1);
  return /[a-z]/i.test(tail) ? tail : text;
}

function tidy(text: string): string {
  return text
    .replace(LIST_MARK, '')
    .replace(LEAD_IN, '')
    .trim()
    .replace(FIRST_WORDS, '')
    .replace(LAST_SIGNS, '')
    .replace(LAST_WORD, '')
    .replace(LAST_SIGNS, '')
    .trim();
}

/** The words that name the amount, before lead-ins are removed (F8-R4). */
export function namingText({ before, after }: FoundAmount): string {
  return /[a-z]/i.test(before) ? afterColon(before) : after;
}

/** F8-R3. */
export function readLabel(amount: FoundAmount): string {
  const label = tidy(afterColon(amount.before)) || tidy(amount.after) || NO_LABEL;
  return (label.charAt(0).toUpperCase() + label.slice(1)).slice(0, MAX_SHORT_TEXT_LENGTH).trim();
}
