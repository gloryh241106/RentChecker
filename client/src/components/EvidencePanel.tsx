import { EVIDENCE_STATE_NAMES, SOURCE_TAGS } from '../shared.js';
import { useWorkspace } from '../state/workspace-context.js';
import { EvidenceControls } from './EvidenceControls.js';

interface EvidencePanelProps {
  readonly deductionId: string;
  readonly label: string;
}

/** D-30 in words, with who set it, the quote when there is one, and the tenant's controls. */
export function EvidencePanel({ deductionId, label }: EvidencePanelProps) {
  const { workspace } = useWorkspace();
  const evidence = workspace.evidence.find((record) => record.deductionId === deductionId);
  const state = evidence?.state ?? 'unconfirmed';
  return (
    <div className="space-y-3 rounded-md bg-sunken p-3">
      <p>
        <span className="font-semibold">Clause: </span>
        {EVIDENCE_STATE_NAMES[state]}
        {evidence === undefined ? null : (
          <span className="text-ink-muted"> ({SOURCE_TAGS[evidence.source]})</span>
        )}
      </p>
      {evidence?.quote == null ? null : (
        <blockquote className="border-l-4 border-line-input pl-3 italic">
          {evidence.quote}
        </blockquote>
      )}
      <EvidenceControls
        deductionId={deductionId}
        label={label}
        isOverridden={evidence?.source === 'user'}
      />
    </div>
  );
}
