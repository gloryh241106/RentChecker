import type { AssistantDoubt, DoubtReason } from '../schemas/assistant.js';
import { formatDateText } from '../wording/date-text.js';
import type { InputCheck } from './checks.js';

const FACT_NAMES: Readonly<Record<string, string>> = {
  deposit: 'the deposit',
  monthly_rent: 'the monthly rent',
  stated_refund: 'the refund',
  handover_date: 'the handover date',
  start_date: 'the start date',
};

/** F9-R2. The sentence is fixed. The AI only chooses the words and the reason. */
const DOUBT_TEXT: Readonly<Record<DoubtReason, string>> = {
  amount: 'this amount may be mistyped',
  date: 'this date may be wrong',
  meaning: 'this can be read in more than one way',
};

const quoted = (words: string): string => `“${words}”`;

export function notRead(source: string): InputCheck {
  return {
    code: 'NOT_READ',
    text: `${quoted(source)} could not be read as one amount or one full date, so it was left out.`,
  };
}

export function twoValues(kind: string, first: string, second: string): InputCheck {
  return {
    code: 'TWO_VALUES',
    text: `Your message gives ${FACT_NAMES[kind] ?? 'this'} as ${first} and as ${second}. Neither was filled in.`,
  };
}

export function dayFirst(words: string, date: string): InputCheck {
  return {
    code: 'DAY_FIRST',
    text: `${quoted(words)} was read day first, as ${formatDateText(date)}. Change it if that is wrong.`,
  };
}

export function doubt({ source, reason }: AssistantDoubt): InputCheck {
  return { code: 'DOUBT', text: `Check ${quoted(source)}: ${DOUBT_TEXT[reason]}.` };
}
