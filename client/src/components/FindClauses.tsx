import { useAnnounce } from '../app/announce-context.js';
import { useClauseApi } from '../api/clause-api-context.js';
import { useClauseMatch } from '../hooks/use-clause-match.js';
import { useWorkspace } from '../state/workspace-context.js';
import { MatchRunner } from './MatchRunner.js';
import { DEDUCTION_WORDING } from './match-text.js';

/** FR-8, FR-12, F2-R1 to F2-R3. The Find clauses button for the deductions of the workspace. */
export function FindClauses() {
  const { workspace, dispatch } = useWorkspace();
  const matching = useClauseMatch({
    api: useClauseApi(),
    leaseText: workspace.leaseText,
    deductions: workspace.deductions,
    applyMatches: (matches) => dispatch({ type: 'evidence/apply', matches }),
    announce: useAnnounce(),
  });
  return (
    <MatchRunner
      matching={matching}
      wording={DEDUCTION_WORDING}
      label="Find clauses"
      variant="secondary"
    />
  );
}
