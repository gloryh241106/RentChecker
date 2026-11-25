import type { ReactNode } from 'react';
import { PageHeading } from '../../../app/PageHeading.js';
import { EvidencePanel } from '../../../components/EvidencePanel.js';
import { LeaseTextBox } from '../../../components/LeaseTextBox.js';
import { Button } from '../../../components/ui/Button.js';
import { Card } from '../../../components/ui/Card.js';
import { useWorkspace } from '../../../state/workspace-context.js';
import { useMoveOutSession } from '../session-context.js';

interface LeaseStepProps {
  /** Step 4b puts "Find clauses" and its consent notice here. */
  readonly matching?: ReactNode;
}

/** F1-R15, F2-R12 to F2-R14. The lease text, and what it says about each charge. */
export function LeaseStep({ matching }: LeaseStepProps) {
  const { workspace, dispatch } = useWorkspace();
  const { runCheck } = useMoveOutSession();
  const { leaseText, deductions, evidence } = workspace;
  const needsClause = deductions.filter((deduction) => deduction.kind !== 'rent');

  return (
    <section className="space-y-5">
      <PageHeading title="Lease" />
      <LeaseTextBox
        id="lease-text"
        hint="Paste the whole lease. A missing page can cause a wrong Not found in the lease."
        value={leaseText}
        hasResults={evidence.length > 0}
        emptyText="No lease pasted. Charges that need a clause will show Unclear."
        staleText="The lease text changed. Find clauses again."
        onChange={(text) => dispatch({ type: 'lease/set', text })}
      />
      {matching}
      <Button isFullWidth onClick={runCheck}>
        Run check
      </Button>
      {needsClause.length === 0 ? null : (
        <div className="space-y-3">
          <h2 className="text-xl font-bold">Clauses for your charges</h2>
          <ul className="space-y-3">
            {needsClause.map((deduction) => (
              <li key={deduction.id}>
                <Card>
                  <h3 className="text-lg font-bold">{deduction.label}</h3>
                  <EvidencePanel deductionId={deduction.id} label={deduction.label} />
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
