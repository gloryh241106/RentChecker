import { MAX_DEDUCTIONS } from '../limits.js';
import { readMessage } from '../charges/read-message.js';
import { dateOf, readFact, withoutFact } from './draft.js';
import type { AssistantDraft, DraftNote, SingleFact } from './draft.js';

/** F9-R8, in the order they are asked. */
export const QUESTIONS = ['deposit', 'monthly_rent', 'handover_date', 'deduction'] as const;

export type Question = (typeof QUESTIONS)[number];

function isKnown(draft: AssistantDraft, question: Question): boolean {
  return question === 'deduction' ? draft.charges.length > 0 : draft.facts[question] !== undefined;
}

/** F9-R8. Null when nothing is left to ask. */
export function nextQuestion(draft: AssistantDraft, skipped: readonly Question[]): Question | null {
  return QUESTIONS.find((each) => !skipped.includes(each) && !isKnown(draft, each)) ?? null;
}

function notesWithout(draft: AssistantDraft, kind: SingleFact): readonly DraftNote[] {
  return draft.notes.filter(({ about }) => about !== kind);
}

/** F9-R8. Null when the answer cannot be read. */
export function answerQuestion(
  draft: AssistantDraft,
  question: Question,
  answer: string,
): AssistantDraft | null {
  if (question === 'deduction') {
    const { charges } = readMessage(answer, dateOf(draft, 'handover_date'));
    const added = charges.map(({ label, amountPaise }) => ({ label, amountPaise, source: answer }));
    return added.length === 0
      ? null
      : { ...draft, charges: [...draft.charges, ...added].slice(0, MAX_DEDUCTIONS) };
  }
  const read = readFact(question, answer, null);
  if (read === null) {
    return null;
  }
  const notes = notesWithout(draft, question);
  return {
    ...draft,
    facts: { ...draft.facts, [question]: read.fact },
    notes: read.note === null ? notes : [...notes, { about: question, check: read.note }],
  };
}

/** F9-R9. */
export function removeFact(draft: AssistantDraft, kind: SingleFact): AssistantDraft {
  return { ...draft, facts: withoutFact(draft.facts, kind), notes: notesWithout(draft, kind) };
}

/** F9-R9. */
export function removeCharge(draft: AssistantDraft, index: number): AssistantDraft {
  return { ...draft, charges: draft.charges.filter((_charge, at) => at !== index) };
}
