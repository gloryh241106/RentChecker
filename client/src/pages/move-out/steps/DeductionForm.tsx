import { useEffect } from 'react';
import { Button } from '../../../components/ui/Button.js';
import { Card } from '../../../components/ui/Card.js';
import { ErrorSummary } from '../../../components/ui/ErrorSummary.js';
import { SelectField, TextField } from '../../../components/ui/Field.js';
import { DEDUCTION_FIELDS, KIND_FIELDS } from '../../../forms/deduction-fields.js';
import type { DeductionField } from '../../../forms/deduction-form.js';
import { deductionFieldId, useDeductionForm } from '../../../forms/use-deduction-form.js';
import { KIND_NAMES, KIND_ORDER, formatDateText } from '../../../shared.js';
import type { Deduction, DeductionKind, Repair } from '../../../shared.js';

const KIND_OPTIONS = KIND_ORDER.map((value) => ({ value, label: KIND_NAMES[value] }));

function toKind(value: string): DeductionKind | undefined {
  return KIND_OPTIONS.find((option) => option.value === value)?.value;
}

interface DeductionFormProps {
  /** Null when adding. */
  readonly initial: Deduction | null;
  readonly repairs: readonly Repair[];
  readonly onSave: (deduction: Deduction, repairIds: readonly string[]) => void;
  readonly onCancel: () => void;
}

/** F1-R4 to F1-R7, F1-R16. Add or edit one deduction. Nothing is stored until Save. */
export function DeductionForm({ initial, repairs, onSave, onCancel }: DeductionFormProps) {
  const linked = repairs.filter((repair) => repair.deductionId === initial?.id);
  const form = useDeductionForm(
    initial,
    linked.map((repair) => repair.id),
  );
  useEffect(() => {
    document.getElementById(deductionFieldId('label'))?.focus();
  }, []);

  function field(name: DeductionField) {
    const spec = DEDUCTION_FIELDS[name];
    return (
      <TextField
        key={name}
        id={deductionFieldId(name)}
        label={spec.label}
        hint={spec.hint}
        isRequired={name === 'label' || name === 'amount' || name === 'rentMonth'}
        inputMode={spec.inputMode}
        value={form.drafts[name]}
        error={form.messageOf(name)}
        onChange={(text) => form.setText(name, text)}
        onBlur={() => form.blur(name)}
      />
    );
  }

  return (
    <form
      noValidate
      aria-labelledby="deduction-form-heading"
      onSubmit={(event) => {
        event.preventDefault();
        const result = form.submit();
        if (result !== null) {
          onSave(result.deduction, result.repairIds);
        } else {
          document.getElementById(form.problems[0]?.fieldId ?? '')?.focus();
        }
      }}
    >
      <Card>
        <h2 id="deduction-form-heading" className="text-xl font-bold">
          {initial === null ? 'Add deduction' : 'Edit deduction'}
        </h2>
        {form.isSubmitted ? <ErrorSummary problems={form.problems} /> : null}
        {field('label')}
        <SelectField
          id="deduction-kind"
          label="Kind"
          value={form.drafts.kind}
          options={KIND_OPTIONS}
          onChange={(value) => {
            const kind = toKind(value);
            if (kind !== undefined) {
              form.setKind(kind);
            }
          }}
        />
        {field('amount')}
        {KIND_FIELDS[form.drafts.kind].map(field)}
        {repairs.length === 0 ? null : (
          <fieldset className="space-y-1">
            <legend className="font-semibold">Linked repairs</legend>
            {repairs.map((repair) => (
              <label key={repair.id} className="flex min-h-11 items-start gap-3 py-2">
                <input
                  type="checkbox"
                  className="mt-0.5 size-6 shrink-0 accent-primary"
                  checked={form.drafts.repairIds.includes(repair.id)}
                  onChange={(event) => form.toggleRepair(repair.id, event.target.checked)}
                />
                <span>
                  {formatDateText(repair.date)}: {repair.description}
                </span>
              </label>
            ))}
          </fieldset>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" isFullWidth>
            Save deduction
          </Button>
          <Button variant="secondary" isFullWidth onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </Card>
    </form>
  );
}
