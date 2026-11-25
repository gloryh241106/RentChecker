import type { MatchPhase } from '../hooks/use-clause-match.js';
import { Button } from './ui/Button.js';
import { Notice } from './ui/Notice.js';
import { ERROR_TEXT, KEYWORD_NOTICE, LOADING_TEXT, WARNING_TEXT } from './match-text.js';

interface MatchStatusProps {
  readonly phase: MatchPhase;
  readonly onTryAgain: () => void;
}

/** FR-10, F2-R7, F2-R16. What the last run did. Texts are plain text, never HTML. */
export function MatchStatus({ phase, onTryAgain }: MatchStatusProps) {
  if (phase.name === 'running') {
    return <p>{LOADING_TEXT}</p>;
  }
  if (phase.name === 'failed') {
    return (
      <Notice tone="danger">
        <p>{ERROR_TEXT[phase.error.kind]}</p>
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
      {phase.mode === 'keyword' ? <p>{KEYWORD_NOTICE}</p> : null}
      {phase.warnings.map((warning) => (
        <p key={warning}>{WARNING_TEXT[warning]}</p>
      ))}
    </Notice>
  );
}
