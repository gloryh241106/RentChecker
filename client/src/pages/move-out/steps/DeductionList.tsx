import { Button } from '../../../components/ui/Button.js';
import { Card } from '../../../components/ui/Card.js';
import { KIND_NAMES, formatRupees } from '../../../shared.js';
import type { Deduction } from '../../../shared.js';

interface DeductionListProps {
  readonly deductions: readonly Deduction[];
  readonly onEdit: (deduction: Deduction) => void;
  readonly onRemove: (deduction: Deduction) => void;
}

/** The charges entered so far, each with Edit and Remove. */
export function DeductionList({ deductions, onEdit, onRemove }: DeductionListProps) {
  if (deductions.length === 0) {
    return <p>No deductions yet. Add the first charge from your landlord&apos;s list.</p>;
  }
  return (
    <ul className="space-y-3">
      {deductions.map((deduction) => (
        <li key={deduction.id}>
          <Card>
            <h3 className="text-lg font-bold">{deduction.label}</h3>
            <p>
              {KIND_NAMES[deduction.kind]}, charged{' '}
              <strong>{formatRupees(deduction.amountPaise)}</strong>
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="secondary"
                isFullWidth
                aria-label={`Edit ${deduction.label}`}
                onClick={() => onEdit(deduction)}
              >
                Edit
              </Button>
              <Button
                variant="secondary"
                isFullWidth
                aria-label={`Remove ${deduction.label}`}
                onClick={() => onRemove(deduction)}
              >
                Remove
              </Button>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
