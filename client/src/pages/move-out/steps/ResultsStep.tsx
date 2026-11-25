import { PageHeading } from '../../../app/PageHeading.js';
import { ResultCard } from '../../../components/ResultCard.js';
import { TotalsPanel } from '../../../components/TotalsPanel.js';
import { Button } from '../../../components/ui/Button.js';
import { Notice } from '../../../components/ui/Notice.js';
import { useWorkspace } from '../../../state/workspace-context.js';
import { useMoveOutSession } from '../session-context.js';

/** F1-R9 to F1-R14. Totals, then one card for each deduction, in the order they were entered. */
export function ResultsStep() {
  const { workspace } = useWorkspace();
  const { check, runCheck } = useMoveOutSession();
  const { result, snapshot, isOutOfDate } = check;

  if (result === null || snapshot === null) {
    return (
      <section className="space-y-5">
        <PageHeading title="Results" />
        <p>You have not run the check yet.</p>
        <Button isFullWidth onClick={runCheck}>
          Run check
        </Button>
      </section>
    );
  }
  return (
    <section className="space-y-5">
      <PageHeading title="Results" />
      {isOutOfDate ? (
        <Notice tone="warning">
          <p>Results are out of date. Run the check again.</p>
          <Button isFullWidth onClick={runCheck}>
            Run check
          </Button>
        </Notice>
      ) : null}
      <TotalsPanel totals={result.totals} isOutOfDate={isOutOfDate} />
      <h2 className="text-xl font-bold">Your deductions</h2>
      <ul className="space-y-3">
        {snapshot.input.deductions.map((deduction, index) => {
          const deductionResult = result.deductions[index];
          return deductionResult === undefined ? null : (
            <li key={deduction.id}>
              <ResultCard
                deduction={deduction}
                result={deductionResult}
                repairs={workspace.repairs}
                isOutOfDate={isOutOfDate}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
