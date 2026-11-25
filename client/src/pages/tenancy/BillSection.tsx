import { useAnnounce } from '../../app/announce-context.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { ErrorSummary, problemCountText } from '../../components/ui/ErrorSummary.js';
import { TextField } from '../../components/ui/Field.js';
import { BILL_FIELDS } from '../../forms/bill-form.js';
import { BILL_FIELD_ORDER, billFieldId, useBillForm } from '../../forms/use-bill-form.js';
import { useWorkspace } from '../../state/workspace-context.js';
import { BillResult } from './BillResult.js';
import { billSummary } from './bill-text.js';

/** UC-4, F5-R1 to F5-R4. Nothing here calls the network. */
export function BillSection() {
  const { workspace, dispatch } = useWorkspace();
  const announce = useAnnounce();
  const form = useBillForm(workspace, dispatch);

  function checkBill(): void {
    const result = form.check();
    if (result !== null) {
      announce(`Bill checked. ${billSummary(result)}`);
      return;
    }
    announce(problemCountText(form.problems.length));
    document.getElementById(form.problems[0]?.fieldId ?? '')?.focus();
  }

  return (
    <section aria-labelledby="bill-heading" className="space-y-4">
      <h2 id="bill-heading" className="text-xl font-bold">
        Check a bill
      </h2>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          checkBill();
        }}
      >
        <Card>
          {form.isSubmitted ? <ErrorSummary problems={form.problems} /> : null}
          {BILL_FIELD_ORDER.map((field) => {
            const spec = BILL_FIELDS[field];
            return (
              <TextField
                key={field}
                id={billFieldId(field)}
                label={spec.label}
                hint={spec.hint}
                isRequired={spec.isRequired}
                inputMode="decimal"
                value={form.drafts[field]}
                error={form.messageOf(field)}
                onChange={(text) => form.setText(field, text)}
                onBlur={() => form.blur(field)}
              />
            );
          })}
          <Button type="submit" isFullWidth>
            Check bill
          </Button>
        </Card>
      </form>
      {form.result === null ? null : <BillResult result={form.result} />}
    </section>
  );
}
