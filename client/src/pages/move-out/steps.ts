/** UI.md Moving out: the steps of UC-1 and UC-2, in order. */
export const STEPS = [
  { id: 'details', name: 'Details' },
  { id: 'deductions', name: 'Deductions' },
  { id: 'lease', name: 'Lease' },
  { id: 'results', name: 'Results' },
  { id: 'message', name: 'Message' },
] as const;

export type StepId = (typeof STEPS)[number]['id'];

export function stepPath(id: StepId): string {
  return id === 'details' ? '/move-out' : `/move-out?step=${id}`;
}

export function readStep(value: string | null): StepId {
  return STEPS.find((step) => step.id === value)?.id ?? 'details';
}
