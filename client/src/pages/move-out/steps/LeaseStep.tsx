import { useState } from 'react';
import type { ReactNode } from 'react';
import { PageHeading } from '../../../app/PageHeading.js';
import { EvidencePanel } from '../../../components/EvidencePanel.js';
import { Button } from '../../../components/ui/Button.js';
import { Card } from '../../../components/ui/Card.js';
import { TextField } from '../../../components/ui/Field.js';
import { Notice } from '../../../components/ui/Notice.js';
import { MAX_LEASE_LENGTH } from '../../../shared.js';
import { useWorkspace } from '../../../state/workspace-context.js';
import { useMoveOutSession } from '../session-context.js';

const COUNT_FORMAT = new Intl.NumberFormat('en-IN');
const LEASE_TOO_LONG =
  'This is longer than 40,000 characters, so it is not used or saved. Take out pages that do not mention charges.';

interface LeaseStepProps {
  /** Step 4b puts "Find clauses" and its consent notice here. */
  readonly matching?: ReactNode;
}

/** F1-R15, F2-R12 to F2-R14. The lease text, and what it says about each charge. */
export function LeaseStep({ matching }: LeaseStepProps) {
  const { workspace, dispatch } = useWorkspace();
  const { runCheck } = useMoveOutSession();
  const [wasEdited, setWasEdited] = useState(false);
  /** Text over the limit stays in the box, so nothing pasted is cut or lost without a word. */
  const [longText, setLongText] = useState<string | null>(null);
  const { leaseText, deductions, evidence } = workspace;
  const isTooLong = longText !== null;
  const text = longText ?? leaseText;
  const needsClause = deductions.filter((deduction) => deduction.kind !== 'rent');

  function changeText(next: string): void {
    const isOverLimit = next.length > MAX_LEASE_LENGTH;
    setLongText(isOverLimit ? next : null);
    setWasEdited(evidence.length > 0 || wasEdited);
    dispatch({ type: 'lease/set', text: isOverLimit ? '' : next });
  }

  return (
    <section className="space-y-5">
      <PageHeading title="Lease" />
      <TextField
        id="lease-text"
        label="Lease text"
        hint="Paste the whole lease. A missing page can cause a wrong Not found in the lease."
        isMultiline
        rows={10}
        value={text}
        error={isTooLong ? LEASE_TOO_LONG : undefined}
        onChange={changeText}
      />
      <p className="text-ink-muted">
        {COUNT_FORMAT.format(text.length)} of {COUNT_FORMAT.format(MAX_LEASE_LENGTH)}
      </p>
      {text === '' ? <p>No lease pasted. Charges that need a clause will show Unclear.</p> : null}
      {wasEdited && evidence.length === 0 ? (
        <Notice tone="warning">The lease text changed. Find clauses again.</Notice>
      ) : null}
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
