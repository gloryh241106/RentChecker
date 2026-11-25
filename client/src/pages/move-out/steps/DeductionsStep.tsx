import { useState } from 'react';
import { useAnnounce } from '../../../app/announce-context.js';
import { PageHeading } from '../../../app/PageHeading.js';
import { Button } from '../../../components/ui/Button.js';
import { ErrorSummary } from '../../../components/ui/ErrorSummary.js';
import { fieldErrorText } from '../../../forms/field-errors.js';
import { MAX_DEDUCTIONS } from '../../../shared.js';
import type { Deduction } from '../../../shared.js';
import { useWorkspace } from '../../../state/workspace-context.js';
import { useMoveOutSession } from '../session-context.js';
import { usePendingFocus } from '../use-pending-focus.js';
import { DeductionForm } from './DeductionForm.js';
import { DeductionList } from './DeductionList.js';
import { ReadMessage } from './ReadMessage.js';

/** What is open under the list. `form` with no deduction adds one. */
type Panel =
  | { readonly name: 'none' }
  | { readonly name: 'form'; readonly id: string | null }
  | { readonly name: 'message' };

const NONE: Panel = { name: 'none' };

const MISSING = [
  {
    fieldId: 'add-deduction',
    label: 'Deductions',
    message: fieldErrorText('NO_DEDUCTIONS', 'deduction'),
  },
];

function focusListHeading(): void {
  document.getElementById('deductions-heading')?.focus();
}

/** F1-R3, F1-R4, F1-R5, F8-R7. The list of charges, and the ways to add one. */
export function DeductionsStep() {
  const { workspace, dispatch } = useWorkspace();
  const { isDeductionMissing } = useMoveOutSession();
  const announce = useAnnounce();
  const [panel, setPanel] = useState<Panel>(NONE);
  usePendingFocus();
  const { deductions, repairs, tenancy } = workspace;

  function close(message?: string): void {
    if (message !== undefined) {
      announce(message);
    }
    setPanel(NONE);
    focusListHeading();
  }

  function save(deduction: Deduction, repairIds: readonly string[], isNew: boolean): void {
    dispatch({ type: isNew ? 'deduction/add' : 'deduction/update', deduction, repairIds });
    close(`Saved ${deduction.label}.`);
  }

  function addAll(added: readonly Deduction[]): void {
    added.forEach((deduction) => dispatch({ type: 'deduction/add', deduction, repairIds: [] }));
    close(added.length === 1 ? 'Added 1 charge.' : `Added ${String(added.length)} charges.`);
  }

  return (
    <section className="space-y-5">
      <PageHeading title="Deductions" />
      {isDeductionMissing ? <ErrorSummary problems={MISSING} /> : null}
      <h2 id="deductions-heading" tabIndex={-1} className="text-xl font-bold">
        Charges from your landlord
      </h2>
      <DeductionList
        deductions={deductions}
        onEdit={({ id }) => setPanel({ name: 'form', id })}
        onRemove={({ id, label }) => {
          dispatch({ type: 'deduction/remove', id });
          announce(`Removed ${label}.`);
          focusListHeading();
        }}
      />
      {panel.name === 'none' ? <AddButtons count={deductions.length} onOpen={setPanel} /> : null}
      {panel.name === 'message' ? (
        <ReadMessage
          handoverDate={tenancy.handoverDate}
          room={MAX_DEDUCTIONS - deductions.length}
          onAdd={addAll}
          onCancel={() => close()}
        />
      ) : null}
      {panel.name === 'form' ? (
        <DeductionForm
          key={panel.id ?? 'new'}
          initial={deductions.find(({ id }) => id === panel.id) ?? null}
          repairs={repairs}
          onSave={(deduction, repairIds) => save(deduction, repairIds, panel.id === null)}
          onCancel={() => close()}
        />
      ) : null}
    </section>
  );
}

interface AddButtonsProps {
  readonly count: number;
  readonly onOpen: (panel: Panel) => void;
}

function AddButtons({ count, onOpen }: AddButtonsProps) {
  const isFull = count >= MAX_DEDUCTIONS;
  const describedBy = isFull ? 'deduction-limit' : undefined;
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          id="add-deduction"
          isFullWidth
          disabled={isFull}
          aria-describedby={describedBy}
          onClick={() => onOpen({ name: 'form', id: null })}
        >
          Add deduction
        </Button>
        <Button
          variant="secondary"
          isFullWidth
          disabled={isFull}
          aria-describedby={describedBy}
          onClick={() => onOpen({ name: 'message' })}
        >
          Read the landlord&apos;s message
        </Button>
      </div>
      {isFull ? <p id="deduction-limit">You can add up to 20 deductions.</p> : null}
    </div>
  );
}
