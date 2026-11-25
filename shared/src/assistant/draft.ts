import { findAmounts } from '../charges/amount.js';
import { guessKind, isSummary } from '../charges/kind.js';
import { asLabel, namingText, readLabel } from '../charges/label.js';
import { readRentMonth } from '../charges/months.js';
import type { FoundCharge } from '../charges/read-message.js';
import { isAfter } from '../dates.js';
import { MAX_DEDUCTIONS } from '../limits.js';
import { formatRupees } from '../money.js';
import type { AssistantDoubt, AssistantFact } from '../schemas/assistant.js';
import type { Tenancy } from '../schemas/tenancy.js';
import { formatDateText } from '../wording/date-text.js';
import { checkInput } from './checks.js';
import type { InputCheck } from './checks.js';
import { dayFirst, doubt, notRead, twoValues } from './note-text.js';
import { readOnlyAmount, readOnlyDate, withoutDates } from './values.js';

export const AMOUNT_FACTS = ['deposit', 'monthly_rent', 'stated_refund'] as const;
export const DATE_FACTS = ['handover_date', 'start_date'] as const;

export type AmountFact = (typeof AMOUNT_FACTS)[number];
export type DateFact = (typeof DATE_FACTS)[number];
export type SingleFact = AmountFact | DateFact;

export interface DraftFact {
  /** Paise for an amount. */
  readonly value: number | string;
  /** Null when the tenant answered a question (F9-R9). */
  readonly source: string | null;
}

export interface DraftCharge {
  readonly label: string;
  readonly amountPaise: number;
  readonly source: string;
}

/** A check that came from reading one fact. It goes when that fact is changed or answered. */
export interface DraftNote {
  readonly about: SingleFact | null;
  /** The words it is about. A doubt about words that could not be read says nothing new. */
  readonly words?: string;
  readonly check: InputCheck;
}

type DraftFacts = Readonly<Partial<Record<SingleFact, DraftFact>>>;

/** F9. What is known so far. Nothing here is stored. */
export interface AssistantDraft {
  readonly facts: DraftFacts;
  readonly charges: readonly DraftCharge[];
  readonly notes: readonly DraftNote[];
}

const isAmountFact = (kind: string): kind is AmountFact =>
  AMOUNT_FACTS.some((each) => each === kind);

export const isSingleFact = (kind: string): kind is SingleFact =>
  isAmountFact(kind) || DATE_FACTS.some((each) => each === kind);

export function showValue(value: number | string): string {
  return typeof value === 'number' ? formatRupees(value) : formatDateText(value);
}

interface Read {
  readonly fact: DraftFact;
  readonly note: InputCheck | null;
}

/** F9-R5. Null when the value cannot be read. `source` is null for an answer. */
export function readFact(kind: SingleFact, text: string, source: string | null): Read | null {
  if (isAmountFact(kind)) {
    const paise = readOnlyAmount(text);
    return paise === null ? null : { fact: { value: paise, source }, note: null };
  }
  const found = readOnlyDate(text);
  return found === null
    ? null
    : {
        fact: { value: found.date, source },
        note: found.isDayFirst ? dayFirst(found.words, found.date) : null,
      };
}

export function withoutFact(facts: DraftFacts, kind: SingleFact): DraftFacts {
  return Object.fromEntries(Object.entries(facts).filter(([each]) => each !== kind));
}

/** F9-R5, F9-R6. */
function addSingle(draft: AssistantDraft, kind: SingleFact, source: string): AssistantDraft {
  const read = readFact(kind, source, source);
  const before = draft.facts[kind];
  const isInConflict = draft.notes.some(
    ({ about, check }) => about === kind && check.code === 'TWO_VALUES',
  );
  if (isInConflict || (read !== null && before?.value === read.fact.value)) {
    return draft;
  }
  const note = (check: InputCheck): DraftNote => ({ about: kind, check });
  if (read === null) {
    return { ...draft, notes: [...draft.notes, { ...note(notRead(source)), words: source }] };
  }
  if (before !== undefined) {
    const facts = withoutFact(draft.facts, kind);
    const both = twoValues(kind, showValue(before.value), showValue(read.fact.value));
    const others = draft.notes.filter(({ about }) => about !== kind);
    return { ...draft, facts, notes: [...others, note(both)] };
  }
  const notes = read.note === null ? draft.notes : [...draft.notes, note(read.note)];
  return { ...draft, facts: { ...draft.facts, [kind]: read.fact }, notes };
}

/** F9-R7. */
function readCharge(source: string, label: string | null): DraftCharge | null {
  const [amount, second] = findAmounts(withoutDates(source));
  if (amount === undefined || second !== undefined || isSummary(label ?? namingText(amount))) {
    return null;
  }
  const { amountPaise } = amount;
  return { label: label === null ? readLabel(amount) : asLabel(label), amountPaise, source };
}

function addCharge(draft: AssistantDraft, { source, label }: AssistantFact): AssistantDraft {
  const charge = readCharge(source, label);
  if (charge === null) {
    return {
      ...draft,
      notes: [...draft.notes, { about: null, words: source, check: notRead(source) }],
    };
  }
  return { ...draft, charges: [...draft.charges, charge].slice(0, MAX_DEDUCTIONS) };
}

/** F9-R5 to F9-R7. Pure: the same facts always give the same draft. */
export function buildDraft(
  facts: readonly AssistantFact[],
  doubts: readonly AssistantDoubt[],
): AssistantDraft {
  const draft = facts.reduce<AssistantDraft>(
    (before, fact) => {
      if (isSingleFact(fact.kind)) {
        return addSingle(before, fact.kind, fact.source);
      }
      return fact.kind === 'deduction' ? addCharge(before, fact) : before;
    },
    { facts: {}, charges: [], notes: [] },
  );
  const newDoubts = doubts
    .filter(({ source }) => !draft.notes.some(({ words }) => words === source))
    .map((each): DraftNote => ({ about: null, check: doubt(each) }));
  return { ...draft, notes: [...newDoubts, ...draft.notes] };
}

export function amountOf(draft: AssistantDraft, kind: AmountFact): number | undefined {
  const value = draft.facts[kind]?.value;
  return typeof value === 'number' ? value : undefined;
}

export function dateOf(draft: AssistantDraft, kind: DateFact): string | undefined {
  const value = draft.facts[kind]?.value;
  return typeof value === 'string' ? value : undefined;
}

/** F9-R7. The charges with the rent month that the handover date gives now. */
export function chargesOf(draft: AssistantDraft): readonly FoundCharge[] {
  return draft.charges.map(({ label, amountPaise, source }) => {
    const kind = guessKind(label);
    const rentMonth =
      kind === 'rent' ? readRentMonth(source, dateOf(draft, 'handover_date')) : null;
    return { label, amountPaise, kind, rentMonth };
  });
}

/** F9-R11. What the tenant should look at before the details are used. */
export function checksOf(draft: AssistantDraft, today: string): readonly InputCheck[] {
  const input = {
    depositPaise: amountOf(draft, 'deposit'),
    monthlyRentPaise: amountOf(draft, 'monthly_rent'),
    statedRefundPaise: amountOf(draft, 'stated_refund'),
    handoverDate: dateOf(draft, 'handover_date'),
    startDate: dateOf(draft, 'start_date'),
    deductions: chargesOf(draft),
  };
  return [...draft.notes.map(({ check }) => check), ...checkInput(input, today)];
}

/** F9-R10. The details as Moving out keeps them. A start date after the handover is not used. */
export function tenancyOf(draft: AssistantDraft): Tenancy {
  const handoverDate = dateOf(draft, 'handover_date');
  const startDate = dateOf(draft, 'start_date');
  const isLate =
    startDate !== undefined && handoverDate !== undefined && isAfter(startDate, handoverDate);
  return {
    depositPaise: amountOf(draft, 'deposit'),
    monthlyRentPaise: amountOf(draft, 'monthly_rent'),
    statedRefundPaise: amountOf(draft, 'stated_refund'),
    handoverDate,
    startDate: isLate ? undefined : startDate,
    partialMonth: 'unsure',
    handoverDayCounts: true,
  };
}
