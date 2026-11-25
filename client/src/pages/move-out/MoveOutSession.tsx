import { useCallback, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useAnnounce } from '../../app/announce-context.js';
import { problemCountText } from '../../components/ui/ErrorSummary.js';
import { useTenancyForm } from '../../forms/use-tenancy-form.js';
import { describeCheck } from '../../hooks/check-snapshot.js';
import { useCheck } from '../../hooks/use-check.js';
import { useWorkspace } from '../../state/workspace-context.js';
import { MoveOutSessionContext } from './session-context.js';
import { stepPath } from './steps.js';
import type { StepId } from './steps.js';

/** Holds the Moving out state that is not saved: typed text, the last check, a focus request. */
export function MoveOutSession({ children }: { readonly children: ReactNode }) {
  const { workspace, dispatch } = useWorkspace();
  const announce = useAnnounce();
  const navigate = useNavigate();
  const tenancyForm = useTenancyForm(workspace, dispatch);
  const check = useCheck(workspace);
  const [wasDeductionMissing, setWasDeductionMissing] = useState(false);
  const pendingFocus = useRef<string | null>(null);

  const takePendingFocus = useCallback(() => {
    const target = pendingFocus.current;
    pendingFocus.current = null;
    return target;
  }, []);
  const goTo = useCallback((step: StepId) => void navigate(stepPath(step)), [navigate]);

  /** Focus the field now, or open its step and focus it there (F1-R8). */
  function focusOrGo(fieldId: string, step: StepId): void {
    const field = document.getElementById(fieldId);
    if (field === null) {
      pendingFocus.current = fieldId;
      goTo(step);
    } else {
      field.focus();
    }
  }

  function canLeaveDetails(): boolean {
    tenancyForm.showAll();
    const first = tenancyForm.problems[0];
    if (first === undefined) {
      return true;
    }
    announce(problemCountText(tenancyForm.problems.length));
    focusOrGo(first.fieldId, 'details');
    return false;
  }

  function canLeaveDeductions(): boolean {
    if (workspace.deductions.length > 0) {
      return true;
    }
    setWasDeductionMissing(true);
    announce(problemCountText(1));
    focusOrGo('add-deduction', 'deductions');
    return false;
  }

  const guards: Readonly<Record<StepId, () => boolean>> = {
    details: canLeaveDetails,
    deductions: canLeaveDeductions,
    lease: () => true,
    results: () => true,
    message: () => true,
  };

  function runCheck(): void {
    if (!canLeaveDetails() || !canLeaveDeductions()) {
      return;
    }
    const result = check.run();
    if (result !== null) {
      announce(describeCheck(result));
    }
    goTo('results');
  }

  const value = {
    tenancyForm,
    check,
    isDeductionMissing: wasDeductionMissing && workspace.deductions.length === 0,
    goTo,
    runCheck,
    canLeave: (step: StepId) => guards[step](),
    takePendingFocus,
  };
  return <MoveOutSessionContext value={value}>{children}</MoveOutSessionContext>;
}
