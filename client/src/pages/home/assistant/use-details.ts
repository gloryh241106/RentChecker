import { useNavigate } from 'react-router';
import { useAnnounce } from '../../../app/announce-context.js';
import { chargesOf, isCheckableTenancy, tenancyOf, toDeduction } from '../../../shared.js';
import type { AssistantDraft, Deduction, Tenancy } from '../../../shared.js';
import { hasData } from '../../../state/has-data.js';
import { EMPTY_WORKSPACE } from '../../../state/empty-workspace.js';
import { newId } from '../../../state/ids.js';
import { useWorkspace } from '../../../state/workspace-context.js';
import { stepPath } from '../../move-out/steps.js';
import type { StepId } from '../../move-out/steps.js';

export const FILLED_TEXT = 'Details filled in. Check them before you run the check.';

export interface Details {
  readonly isEmpty: boolean;
  /** Whether using them would replace something (F9-R10). */
  readonly replaces: boolean;
  /** How many rent charges have no month. */
  readonly leftOut: number;
  readonly use: () => void;
}

/** F9-R10. */
function firstOpenStep(tenancy: Tenancy, deductions: readonly Deduction[]): StepId {
  if (!isCheckableTenancy(tenancy)) {
    return 'details';
  }
  return deductions.length === 0 ? 'deductions' : 'lease';
}

/** F9-R10. Puts the confirmed details into Moving out. */
export function useDetails(draft: AssistantDraft): Details {
  const { workspace, dispatch } = useWorkspace();
  const navigate = useNavigate();
  const announce = useAnnounce();
  const charges = chargesOf(draft);
  const tenancy = tenancyOf(draft);
  const addable = charges.filter(({ kind, rentMonth }) => kind !== 'rent' || rentMonth !== null);

  function use(): void {
    const deductions = addable
      .map((charge) => toDeduction(charge, newId()))
      .filter((each) => each !== null);
    dispatch({ type: 'details/apply', tenancy, deductions });
    void navigate(stepPath(firstOpenStep(tenancy, deductions)));
    announce(FILLED_TEXT);
  }

  return {
    isEmpty: addable.length === 0 && Object.keys(draft.facts).length === 0,
    replaces: hasData({
      ...EMPTY_WORKSPACE,
      tenancy: workspace.tenancy,
      deductions: workspace.deductions,
    }),
    leftOut: charges.length - addable.length,
    use,
  };
}
