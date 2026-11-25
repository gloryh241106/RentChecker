import { findAmount } from '../charges/amount.js';
import { isSummary } from '../charges/kind.js';
import { namingText } from '../charges/label.js';
import { MONTH_WORD } from '../charges/months.js';
import { splitMessage } from '../charges/split.js';
import { MAX_FACTS } from '../limits.js';
import type {
  AssistantFact,
  AssistantTask,
  FactKind,
  PromptReading,
} from '../schemas/assistant.js';
import { isInPrompt } from './find-source.js';
import { readDates } from './read-dates.js';
import { withoutDates } from './values.js';

const KEPT = /\b(?:kept|keeping|deduct\w*|cut(?:ting)?|charg\w*|withh\w+|took|taken|minus|less)\b/i;
const RETURNED = /\b(?:return\w*|refund\w*|gave back|got back|paid back)\b/i;
const LEFT = /\b(?:hand(?:ed|ing)?|handover|moved? out|moving out|left|leaving|vacat\w*)\b/i;
const ARRIVED = /\b(?:moved? in|start\w*|since|from|began)\b/i;

/** The sentence up to the date, which says what the date is. */
function dateFacts(prompt: string): AssistantFact[] {
  return readDates(prompt).flatMap(({ words, index }) => {
    const context =
      prompt
        .slice(0, index)
        .split(/[.;,\n]\s/)
        .at(-1) ?? '';
    const fact = (kind: FactKind): AssistantFact => ({ kind, source: words, label: null });
    if (LEFT.test(context)) {
      return [fact('handover_date')];
    }
    return ARRIVED.test(context) ? [fact('start_date')] : [];
  });
}

/** Null for an amount that is none of the facts. */
function amountKind(part: string, naming: string): FactKind | null {
  if (KEPT.test(part)) {
    return isSummary(naming) ? null : 'deduction';
  }
  if (RETURNED.test(part)) {
    return 'stated_refund';
  }
  if (/\b(?:deposit|advance)\b/i.test(part)) {
    return 'deposit';
  }
  if (/\b(?:rent|monthly|per month|a month)\b/i.test(part) && !MONTH_WORD.test(part)) {
    return 'monthly_rent';
  }
  return isSummary(naming) ? null : 'deduction';
}

function amountFacts(prompt: string): AssistantFact[] {
  return splitMessage(withoutDates(prompt)).flatMap((part) => {
    const amount = findAmount(part);
    const kind = amount === null ? null : amountKind(part, namingText(amount));
    return kind === null || !isInPrompt(part, prompt) ? [] : [{ kind, source: part, label: null }];
  });
}

/** F9-R4, in the order they are tried after words such as kept and deducted. */
const TASK_WORDS: readonly (readonly [AssistantTask, RegExp])[] = [
  [
    'review_lease',
    /\b(?:before (?:i )?sign\w*|about to sign|sign(?:ing)? (?:a|the|my|this)|new lease|review)\b/i,
  ],
  ['log_repair', /\b(?:leak\w*|broken|repair\w*|not working|damp|reported)\b/i],
  ['check_bill', /\b(?:bill|meter|units|readings?)\b/i],
  ['ask_lease', /\?|^(?:can|who|when|what|how|do|does|is|am|may|must|should)\b/i],
];

function taskOf(prompt: string, facts: readonly AssistantFact[]): AssistantTask {
  const text = prompt.trim();
  if (KEPT.test(text) && !text.endsWith('?')) {
    return 'check_deductions';
  }
  return (
    TASK_WORDS.find(([, words]) => words.test(text))?.[0] ??
    (facts.length > 0 ? 'check_deductions' : 'out_of_scope')
  );
}

/** F9-R4. Pure, and used only when AI cannot read the prompt. */
export function readPromptByCode(prompt: string): PromptReading {
  const found = [...amountFacts(prompt), ...dateFacts(prompt)].slice(0, MAX_FACTS);
  const task = taskOf(prompt, found);
  return { task, facts: task === 'check_deductions' ? found : [], doubts: [] };
}
