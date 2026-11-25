import { KIND_NAMES, formatDateText, formatRupees, reasonSentence } from '../shared.js';
import type { Deduction, DeductionResult, Repair } from '../shared.js';
import { EvidencePanel } from './EvidencePanel.js';
import { ResultBadge } from './ResultBadge.js';
import { Card } from './ui/Card.js';

interface ResultCardProps {
  readonly deduction: Deduction;
  readonly result: DeductionResult;
  /** The repair log, to look up the entries a deduction links. */
  readonly repairs: readonly Repair[];
  readonly isOutOfDate: boolean;
}

function datesOf(ids: readonly string[], repairs: readonly Repair[]): string[] {
  return repairs.filter((repair) => ids.includes(repair.id)).map((repair) => repair.date);
}

/** F1-R9, F1-R10, F1-R16. One deduction: result, every reason, the clause, the linked repairs. */
export function ResultCard({ deduction, result, repairs, isOutOfDate }: ResultCardProps) {
  const facts = {
    amountPaise: result.amountPaise,
    expectedPaise: result.expectedPaise,
    rentDays: result.rentDays,
    repairDates: datesOf(result.reportedRepairIds, repairs),
  };
  const linked = repairs.filter((repair) => result.repairIds.includes(repair.id));
  return (
    <Card isSunken={isOutOfDate}>
      <h3 className="text-lg font-bold">{deduction.label}</h3>
      <p>
        {KIND_NAMES[deduction.kind]}, charged <strong>{formatRupees(result.amountPaise)}</strong>
        {result.expectedPaise === null ? null : (
          <>
            . Worked out: <strong>{formatRupees(result.expectedPaise)}</strong>
          </>
        )}
      </p>
      <ResultBadge result={result.result} />
      <ul className="list-disc space-y-1 pl-5">
        {result.reasons.map((code) => (
          <li key={code}>{reasonSentence(code, facts)}</li>
        ))}
      </ul>
      {deduction.kind === 'rent' ? null : (
        <EvidencePanel deductionId={deduction.id} label={deduction.label} />
      )}
      {linked.length === 0 ? null : (
        <div>
          <p className="font-semibold">Linked repairs</p>
          <ul className="list-disc space-y-1 pl-5">
            {linked.map((repair) => (
              <li key={repair.id}>
                {formatDateText(repair.date)}: {repair.description}, reported to {repair.reportedTo}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
