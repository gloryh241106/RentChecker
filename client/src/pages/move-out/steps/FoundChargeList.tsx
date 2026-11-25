import { useEffect, useRef, useState } from 'react';
import { describeCharge } from '../../../components/charge-text.js';
import { Button } from '../../../components/ui/Button.js';
import { CheckboxField } from '../../../components/ui/Field.js';
import { MAX_DEDUCTIONS, toDeduction } from '../../../shared.js';
import type { Deduction, FoundCharge, FoundCharges } from '../../../shared.js';
import { newId } from '../../../state/ids.js';

const NEEDS_MONTH = 'Enter the handover date on Details first, so the month is known.';

interface FoundChargeListProps {
  readonly found: FoundCharges;
  readonly room: number;
  readonly onAdd: (deductions: readonly Deduction[]) => void;
}

/** The charge if it can be added. Made once, so a checkbox keeps its id. */
interface Row {
  readonly charge: FoundCharge;
  readonly deduction: Deduction | null;
}

function toRows({ charges }: FoundCharges): readonly Row[] {
  return charges.map((charge) => ({ charge, deduction: toDeduction(charge, newId()) }));
}

function leftOutText(count: number): string {
  return count === 1
    ? '1 amount was left out, because it looks like a total, a refund or a payment.'
    : `${String(count)} amounts were left out, because they look like totals, refunds or payments.`;
}

/** F8-R4, F8-R6, F8-R7. What was found, to check before anything is added. */
export function FoundChargeList({ found, room, onAdd }: FoundChargeListProps) {
  const [rows] = useState(() => toRows(found));
  const [unchecked, setUnchecked] = useState<ReadonlySet<string>>(new Set());
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);

  const chosen = rows
    .flatMap(({ deduction }) => (deduction === null ? [] : [deduction]))
    .filter(({ id }) => !unchecked.has(id));
  const added = chosen.slice(0, room);

  function toggle(id: string, isChecked: boolean): void {
    const next = new Set(unchecked);
    if (isChecked) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setUnchecked(next);
  }

  return (
    <div className="space-y-3">
      <h3 ref={heading} tabIndex={-1} className="text-lg font-bold">
        {rows.length === 0 ? 'No charge was found' : 'Charges found'}
      </h3>
      {rows.length === 0 ? (
        <p>Write each charge with its amount, for example Painting 12,000.</p>
      ) : (
        <p>Check each one. You can change its kind and details with Edit after it is added.</p>
      )}
      <ul className="space-y-1">
        {rows.map(({ charge, deduction }, index) => (
          <li key={deduction?.id ?? `no-month-${String(index)}`} className="wrap-anywhere">
            {deduction === null ? (
              <p>
                {describeCharge(charge)}. {NEEDS_MONTH}
              </p>
            ) : (
              <CheckboxField
                id={`found-${deduction.id}`}
                label={describeCharge(charge)}
                isChecked={!unchecked.has(deduction.id)}
                onChange={(isChecked) => toggle(deduction.id, isChecked)}
              />
            )}
          </li>
        ))}
      </ul>
      {found.leftOut === 0 ? null : <p>{leftOutText(found.leftOut)}</p>}
      {chosen.length > room ? (
        <p>You can add up to {MAX_DEDUCTIONS} deductions. The last ones will not be added.</p>
      ) : null}
      {rows.length === 0 ? null : (
        <Button isFullWidth disabled={added.length === 0} onClick={() => onAdd(added)}>
          {added.length === 1 ? 'Add 1 charge' : `Add ${String(added.length)} charges`}
        </Button>
      )}
    </div>
  );
}
