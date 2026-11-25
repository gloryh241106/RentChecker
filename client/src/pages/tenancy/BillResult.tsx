import { Card } from '../../components/ui/Card.js';
import type { BillCheckResult } from '../../shared.js';
import { billReasonText, billSummary } from './bill-text.js';

/** F5-R3. No primary result, because D-32 to D-36 apply to deductions only. */
export function BillResult({ result }: { readonly result: BillCheckResult }) {
  return (
    <Card>
      <p className="font-semibold">{billSummary(result)}</p>
      <p>{billReasonText(result)}</p>
    </Card>
  );
}
