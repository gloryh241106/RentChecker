import { useEffect } from 'react';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { ErrorSummary } from '../../components/ui/ErrorSummary.js';
import { TextField } from '../../components/ui/Field.js';
import { REPAIR_FIELDS, REPAIR_FIELD_ORDER } from '../../forms/repair-form.js';
import { repairFieldId, useRepairForm } from '../../forms/use-repair-form.js';
import type { Repair } from '../../shared.js';
import type { RepairFields } from '../../state/actions.js';

interface RepairFormProps {
  /** Null when adding. */
  readonly initial: Repair | null;
  readonly onSave: (repair: RepairFields) => void;
  readonly onCancel: () => void;
}

/** F5-R5. Add or edit one entry. Nothing is stored until Save. */
export function RepairForm({ initial, onSave, onCancel }: RepairFormProps) {
  const form = useRepairForm(initial);
  useEffect(() => {
    document.getElementById(repairFieldId('date'))?.focus();
  }, []);

  return (
    <form
      noValidate
      aria-labelledby="repair-form-heading"
      onSubmit={(event) => {
        event.preventDefault();
        const repair = form.submit();
        if (repair !== null) {
          onSave(repair);
        } else {
          document.getElementById(form.problems[0]?.fieldId ?? '')?.focus();
        }
      }}
    >
      <Card>
        <h3 id="repair-form-heading" className="text-lg font-bold">
          {initial === null ? 'Add repair' : 'Edit repair'}
        </h3>
        {form.isSubmitted ? <ErrorSummary problems={form.problems} /> : null}
        {REPAIR_FIELD_ORDER.map((field) => (
          <TextField
            key={field}
            id={repairFieldId(field)}
            label={REPAIR_FIELDS[field].label}
            hint={REPAIR_FIELDS[field].hint}
            isRequired
            value={form.drafts[field]}
            error={form.messageOf(field)}
            onChange={(text) => form.setText(field, text)}
            onBlur={() => form.blur(field)}
          />
        ))}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" isFullWidth>
            Save repair
          </Button>
          <Button variant="secondary" isFullWidth onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </Card>
    </form>
  );
}
