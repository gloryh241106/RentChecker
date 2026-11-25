import { useId, useRef } from 'react';
import { useClauseApi } from '../api/clause-api-context.js';
import { useAiConfigured } from '../hooks/use-ai-configured.js';
import type { ClauseMatching } from '../hooks/use-match-run.js';
import { ConsentDialog } from './ConsentDialog.js';
import { MatchStatus } from './MatchStatus.js';
import type { MatchWording } from './match-text.js';
import { Button } from './ui/Button.js';

interface MatchRunnerProps {
  readonly matching: ClauseMatching;
  readonly wording: MatchWording;
  /** The button: "Find clauses" or "Run review". */
  readonly label: string;
  readonly variant: 'primary' | 'secondary';
}

/** FR-8, FR-12, F2-R1 to F2-R3, F4-R2. The run button, its notice and what the run did. */
export function MatchRunner({ matching, wording, label, variant }: MatchRunnerProps) {
  const hintId = useId();
  const runButton = useRef<HTMLButtonElement>(null);
  const statusBox = useRef<HTMLDivElement>(null);
  const { phase, blockers } = matching;
  const isAiConfigured = useAiConfigured(useClauseApi(), blockers.length === 0);

  return (
    <div className="space-y-3">
      <Button
        ref={runButton}
        variant={variant}
        isFullWidth
        disabled={blockers.length > 0 || phase.name === 'running'}
        aria-describedby={blockers.length > 0 ? hintId : undefined}
        onClick={matching.start}
      >
        {label}
      </Button>
      {blockers.length > 0 ? (
        <p id={hintId} className="text-ink-muted">
          {blockers.join(' ')}
        </p>
      ) : null}
      <div ref={statusBox} tabIndex={-1}>
        <MatchStatus phase={phase} wording={wording} onTryAgain={matching.start} />
      </div>
      <ConsentDialog
        isOpen={phase.name === 'consent'}
        isAiConfigured={isAiConfigured}
        wording={wording}
        onContinue={() => {
          statusBox.current?.focus(); // The run button is disabled during the run.
          matching.confirm();
        }}
        onClose={() => {
          matching.dismiss();
          runButton.current?.focus(); // "Try again" is gone by now.
        }}
      />
    </div>
  );
}
