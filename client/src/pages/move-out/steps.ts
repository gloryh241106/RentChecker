/**
 * The steps of UC-1. The Message step (UC-2, F3) is added here when it is built, and the page
 * picks it up. Until then the list has the four steps that work.
 */
export const STEPS = [
  { id: 'details', name: 'Details' },
  { id: 'deductions', name: 'Deductions' },
  { id: 'lease', name: 'Lease' },
  { id: 'results', name: 'Results' },
] as const;

export type StepId = (typeof STEPS)[number]['id'];

export function stepPath(id: StepId): string {
  return id === 'details' ? '/move-out' : `/move-out?step=${id}`;
}

export function readStep(value: string | null): StepId {
  return STEPS.find((step) => step.id === value)?.id ?? 'details';
}
