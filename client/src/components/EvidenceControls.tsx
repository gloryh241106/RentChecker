import { useWorkspace } from '../state/workspace-context.js';
import { OverrideControls } from './OverrideControls.js';

interface EvidenceControlsProps {
  readonly deductionId: string;
  readonly label: string;
  readonly isOverridden: boolean;
}

/** F2-R12 to F2-R14 for a deduction of the workspace. */
export function EvidenceControls({ deductionId, label, isOverridden }: EvidenceControlsProps) {
  const { workspace, dispatch } = useWorkspace();
  return (
    <OverrideControls
      itemId={deductionId}
      label={label}
      isOverridden={isOverridden}
      leaseText={workspace.leaseText}
      onOverride={(override) => dispatch({ type: 'evidence/override', deductionId, override })}
    />
  );
}
