import { EVIDENCE_STATE_NAMES } from '../shared.js';
import { useWorkspace } from '../state/workspace-context.js';
import { EvidenceControls } from './EvidenceControls.js';
import { ItemEvidence } from './ItemEvidence.js';

interface EvidencePanelProps {
  readonly deductionId: string;
  readonly label: string;
}

/** D-30 in words for a deduction, and the tenant's controls. */
export function EvidencePanel({ deductionId, label }: EvidencePanelProps) {
  const { workspace } = useWorkspace();
  const evidence = workspace.evidence.find((record) => record.deductionId === deductionId);
  return (
    <div className="space-y-3 rounded-md bg-sunken p-3">
      <ItemEvidence
        caption="Clause"
        stateText={EVIDENCE_STATE_NAMES[evidence?.state ?? 'unconfirmed']}
        evidence={evidence}
      />
      <EvidenceControls
        deductionId={deductionId}
        label={label}
        isOverridden={evidence?.source === 'user'}
      />
    </div>
  );
}
