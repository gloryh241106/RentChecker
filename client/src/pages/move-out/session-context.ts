import { createContext, useContext } from 'react';
import type { Check } from '../../hooks/use-check.js';
import type { TenancyForm } from '../../forms/use-tenancy-form.js';
import type { StepId } from './steps.js';

/** What the steps of Moving out share while the tenant is on the page. Nothing here is stored. */
export interface MoveOutSession {
  readonly tenancyForm: TenancyForm;
  readonly check: Check;
  /** True after a check was tried with no deduction (F1-R3). */
  readonly isDeductionMissing: boolean;
  readonly goTo: (step: StepId) => void;
  /** F1-R9. Runs the check, or sends the tenant to the first thing that is wrong (F1-R8). */
  readonly runCheck: () => void;
  /** Next on a step. True when the tenant may move on. */
  readonly canLeave: (step: StepId) => boolean;
  /** The id of the field that should get focus when its step opens. Read once. */
  readonly takePendingFocus: () => string | null;
}

export const MoveOutSessionContext = createContext<MoveOutSession | null>(null);

export function useMoveOutSession(): MoveOutSession {
  const session = useContext(MoveOutSessionContext);
  if (session === null) {
    throw new Error('useMoveOutSession needs the Moving out page');
  }
  return session;
}
