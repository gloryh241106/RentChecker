import { PageHeading } from '../../../app/PageHeading.js';
import { ErrorSummary } from '../../../components/ui/ErrorSummary.js';
import { CheckboxField, SelectField, TextField } from '../../../components/ui/Field.js';
import { TENANCY_FIELDS } from '../../../forms/tenancy-form.js';
import { TENANCY_FIELD_ORDER, tenancyFieldId } from '../../../forms/use-tenancy-form.js';
import { PARTIAL_MONTH_NAMES } from '../../../shared.js';
import type { Tenancy } from '../../../shared.js';
import { useMoveOutSession } from '../session-context.js';
import { usePendingFocus } from '../use-pending-focus.js';

const PARTIAL_MONTH_OPTIONS = (['unsure', 'per_day', 'full_month'] as const).map((value) => ({
  value,
  label: PARTIAL_MONTH_NAMES[value],
}));

function toPartialMonth(value: string): Tenancy['partialMonth'] | undefined {
  return PARTIAL_MONTH_OPTIONS.find((option) => option.value === value)?.value;
}

/** F1-R1 to F1-R3, F1-R8. The facts of the tenancy. */
export function DetailsStep() {
  const { tenancyForm: form } = useMoveOutSession();
  usePendingFocus();
  return (
    <section className="space-y-5">
      <PageHeading title="Details" />
      <p>Enter the facts of your tenancy. Amounts are in rupees.</p>
      {form.isSubmitted ? <ErrorSummary problems={form.problems} /> : null}
      {TENANCY_FIELD_ORDER.map((field) => {
        const spec = TENANCY_FIELDS[field];
        return (
          <TextField
            key={field}
            id={tenancyFieldId(field)}
            label={spec.label}
            hint={spec.hint}
            isRequired={spec.isRequired}
            inputMode={spec.inputMode}
            value={form.drafts[field]}
            error={form.messageOf(field)}
            onChange={(text) => form.setText(field, text)}
            onBlur={() => form.blur(field)}
          />
        );
      })}
      <SelectField
        id="tenancy-partial-month"
        label="How does the lease charge a partial month?"
        hint="Not sure is calculated per day."
        value={form.drafts.partialMonth}
        options={PARTIAL_MONTH_OPTIONS}
        onChange={(value) => {
          const partialMonth = toPartialMonth(value);
          if (partialMonth !== undefined) {
            form.setPartialMonth(partialMonth);
          }
        }}
      />
      <CheckboxField
        id="tenancy-handover-day"
        label="The handover day does not count as a day of use"
        isChecked={!form.drafts.handoverDayCounts}
        onChange={(isChecked) => form.setHandoverDayCounts(!isChecked)}
      />
    </section>
  );
}
