import type { MatchPhase } from '../hooks/use-match-run.js';
import { Button } from './ui/Button.js';
import { Notice } from './ui/Notice.js';
import type { MatchWording } from './match-text.js';

interface MatchStatusProps {
  readonly phase: MatchPhase;
  readonly wording: MatchWording;
  readonly onTryAgain: () => void;
}

/** FR-10, F2-R7, F2-R16. What the last run did. Texts are plain text, never HTML. */
export function MatchStatus({ phase, wording, onTryAgain }: MatchStatusProps) {
  if (phase.name === 'running') {
    return <p>{wording.loading}</p>;
  }
  if (phase.name === 'failed') {
    return (
      <Notice tone="danger">
        <p>{wording.errors[phase.error.kind]}</p>
        <Button variant="secondary" onClick={onTryAgain}>
          Try again
        </Button>
      </Notice>
    );
  }
  if (phase.name !== 'done' || (phase.mode === 'ai' && phase.warnings.length === 0)) {
    return null;
  }
  return (
    <Notice tone="warning">
      {phase.mode === 'keyword' ? <p>{wording.keywordNotice}</p> : null}
      {phase.warnings.map((warning) => (
        <p key={warning}>{wording.warnings[warning]}</p>
      ))}
    </Notice>
  );
}
