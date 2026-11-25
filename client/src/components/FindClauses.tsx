import { useId, useRef } from 'react';
import { useAnnounce } from '../app/announce-context.js';
import { useClauseApi } from '../api/clause-api-context.js';
import { useAiConfigured } from '../hooks/use-ai-configured.js';
import { useClauseMatch } from '../hooks/use-clause-match.js';
import { useWorkspace } from '../state/workspace-context.js';
import { ConsentDialog } from './ConsentDialog.js';
import { MatchStatus } from './MatchStatus.js';
import { Button } from './ui/Button.js';

/** FR-8, FR-12, F2-R1 to F2-R3. The Find clauses button, its notice and what the run did. */
export function FindClauses() {
  const { workspace, dispatch } = useWorkspace();
  const api = useClauseApi();
  const announce = useAnnounce();
  const hintId = useId();
  const findButton = useRef<HTMLButtonElement>(null);
  const statusBox = useRef<HTMLDivElement>(null);
  const matching = useClauseMatch({
    api,
    leaseText: workspace.leaseText,
    deductions: workspace.deductions,
    applyMatches: (matches) => dispatch({ type: 'evidence/apply', matches }),
    announce,
  });
  const { phase, blockers } = matching;
  const isAiConfigured = useAiConfigured(api, blockers.length === 0);

  return (
    <div className="space-y-3">
      <Button
        ref={findButton}
        variant="secondary"
        isFullWidth
        disabled={blockers.length > 0 || phase.name === 'running'}
        aria-describedby={blockers.length > 0 ? hintId : undefined}
        onClick={matching.start}
      >
        Find clauses
      </Button>
      {blockers.length > 0 ? (
        <p id={hintId} className="text-ink-muted">
          {blockers.join(' ')}
        </p>
      ) : null}
      <div ref={statusBox} tabIndex={-1}>
        <MatchStatus phase={phase} onTryAgain={matching.start} />
      </div>
      <ConsentDialog
        isOpen={phase.name === 'consent'}
        isAiConfigured={isAiConfigured}
        onContinue={() => {
          statusBox.current?.focus(); // Find clauses is disabled during the run.
          matching.confirm();
        }}
        onClose={() => {
          matching.dismiss();
          findButton.current?.focus(); // "Try again" is gone by now.
        }}
      />
    </div>
  );
}
