import { useState } from 'react';
import { useAnnounce } from '../../../app/announce-context.js';
import { PageHeading } from '../../../app/PageHeading.js';
import { Button } from '../../../components/ui/Button.js';
import { Card } from '../../../components/ui/Card.js';
import { ErrorSummary } from '../../../components/ui/ErrorSummary.js';
import { fieldErrorText } from '../../../forms/field-errors.js';
import { KIND_NAMES, MAX_DEDUCTIONS, formatRupees } from '../../../shared.js';
import type { Deduction } from '../../../shared.js';
import { useWorkspace } from '../../../state/workspace-context.js';
import { useMoveOutSession } from '../session-context.js';
import { usePendingFocus } from '../use-pending-focus.js';
import { DeductionForm } from './DeductionForm.js';

/** `null` is closed, `'new'` adds, an id edits. */
type Editing = string | 'new' | null;

function focusListHeading(): void {
  document.getElementById('deductions-heading')?.focus();
}

/** F1-R3, F1-R4, F1-R5. The list of charges, each with Edit and Remove. */
export function DeductionsStep() {
  const { workspace, dispatch } = useWorkspace();
  const { isDeductionMissing } = useMoveOutSession();
  const announce = useAnnounce();
  const [editing, setEditing] = useState<Editing>(null);
  usePendingFocus();
  const isFull = workspace.deductions.length >= MAX_DEDUCTIONS;
  const editedDeduction = workspace.deductions.find((deduction) => deduction.id === editing);

  function save(deduction: Deduction, repairIds: readonly string[]): void {
    const type = editedDeduction === undefined ? 'deduction/add' : 'deduction/update';
    dispatch({ type, deduction, repairIds });
    announce(`Saved ${deduction.label}.`);
    setEditing(null);
    focusListHeading();
  }

  return (
    <section className="space-y-5">
      <PageHeading title="Deductions" />
      {isDeductionMissing ? (
        <ErrorSummary
          problems={[
            {
              fieldId: 'add-deduction',
              label: 'Deductions',
              message: fieldErrorText('NO_DEDUCTIONS', 'deduction'),
            },
          ]}
        />
      ) : null}
      <h2 id="deductions-heading" tabIndex={-1} className="text-xl font-bold">
        Charges from your landlord
      </h2>
      {workspace.deductions.length === 0 ? (
        <p>No deductions yet. Add the first charge from your landlord&apos;s list.</p>
      ) : (
        <ul className="space-y-3">
          {workspace.deductions.map((deduction) => (
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
                    onClick={() => setEditing(deduction.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    isFullWidth
                    aria-label={`Remove ${deduction.label}`}
                    onClick={() => {
                      dispatch({ type: 'deduction/remove', id: deduction.id });
                      announce(`Removed ${deduction.label}.`);
                      focusListHeading();
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
      {editing === null ? (
        <div className="space-y-2">
          <Button
            id="add-deduction"
            isFullWidth
            disabled={isFull}
            aria-describedby={isFull ? 'deduction-limit' : undefined}
            onClick={() => setEditing('new')}
          >
            Add deduction
          </Button>
          {isFull ? <p id="deduction-limit">You can add up to 20 deductions.</p> : null}
        </div>
      ) : (
        <DeductionForm
          key={editing}
          initial={editedDeduction ?? null}
          repairs={workspace.repairs}
          onSave={save}
          onCancel={() => {
            setEditing(null);
            focusListHeading();
          }}
        />
      )}
    </section>
  );
}
