import { answerQuestion, buildDraft, removeCharge, removeFact } from '../shared.js';
import type {
  AssistantDraft,
  AssistantResponse,
  AssistantTask,
  Question,
  SingleFact,
} from '../shared.js';

export interface AssistantPlan {
  readonly prompt: string;
  readonly task: AssistantTask;
  /** The question to ask in the lease (F9-R12). */
  readonly leaseQuestion: string | null;
  readonly draft: AssistantDraft;
  readonly skipped: readonly Question[];
}

export function startPlan(
  prompt: string,
  { task, facts, doubts }: AssistantResponse,
): AssistantPlan {
  const leaseQuestion = facts.find(({ kind }) => kind === 'question')?.source ?? null;
  return { prompt, task, leaseQuestion, draft: buildDraft(facts, doubts), skipped: [] };
}

/** F9-R8. Null when the answer cannot be read. */
export function withAnswer(
  plan: AssistantPlan,
  question: Question,
  text: string,
): AssistantPlan | null {
  const draft = answerQuestion(plan.draft, question, text);
  return draft === null ? null : { ...plan, draft };
}

export function withSkipped(plan: AssistantPlan, question: Question): AssistantPlan {
  return { ...plan, skipped: [...plan.skipped, question] };
}

/** F9-R9. The fact is asked again, even if its question was skipped before. */
export function withoutFact(plan: AssistantPlan, kind: SingleFact): AssistantPlan {
  return {
    ...plan,
    draft: removeFact(plan.draft, kind),
    skipped: plan.skipped.filter((each) => each !== kind),
  };
}

export function withoutCharge(plan: AssistantPlan, index: number): AssistantPlan {
  return { ...plan, draft: removeCharge(plan.draft, index) };
}
