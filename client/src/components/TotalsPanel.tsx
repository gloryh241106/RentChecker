import type { ReactNode } from 'react';
import { BUCKET_NAMES, BUCKET_ORDER, formatRupees } from '../shared.js';
import type { Totals } from '../shared.js';
import { AskAboutLine } from './AskAboutLine.js';
import { BUCKET_LOOK } from './bucket-look.js';
import { NOT_LEGAL_ADVICE } from './not-legal-advice.js';
import { SplitBar } from './SplitBar.js';
import { Card } from './ui/Card.js';
import { Notice } from './ui/Notice.js';

interface RowProps {
  readonly term: string;
  readonly value: string;
  readonly icon?: ReactNode;
}

function Row({ term, value, icon }: RowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 border-b border-line py-2 last:border-b-0">
      <dt className="flex items-center gap-2">
        {icon}
        {term}
      </dt>
      <dd className="text-xl font-bold tabular-nums">{value}</dd>
    </div>
  );
}

/** F1-R11 to F1-R13. D-40 to D-43 are worked out in shared/, this only shows them. */
export function TotalsPanel({
  totals,
  isOutOfDate,
}: {
  readonly totals: Totals;
  readonly isOutOfDate: boolean;
}) {
  return (
    <section className="space-y-4" aria-labelledby="totals-heading">
      <h2 id="totals-heading" className="text-xl font-bold">
        Totals
      </h2>
      <Card isSunken={isOutOfDate}>
        <AskAboutLine totals={totals} />
        <SplitBar totals={totals} />
        <dl>
          <Row term="Total deducted" value={formatRupees(totals.totalDeductedPaise)} />
          {BUCKET_ORDER.map((bucket) => {
            const { Icon, text } = BUCKET_LOOK[bucket];
            return (
              <Row
                key={bucket}
                term={BUCKET_NAMES[bucket]}
                value={formatRupees(totals[bucket])}
                icon={<Icon className={`size-5 shrink-0 ${text}`} />}
              />
            );
          })}
          {totals.isRefundGapShown && totals.refundGapPaise !== null ? (
            <Row term="Refund gap" value={formatRupees(totals.refundGapPaise)} />
          ) : null}
        </dl>
        {totals.isRefundGapShown ? (
          <p className="text-ink-muted">
            The refund gap is the part of your deposit that neither the deductions nor the refund
            the landlord stated account for. It is not part of Ask about.
          </p>
        ) : null}
      </Card>
      {totals.excessOverDepositPaise > 0 ? (
        <Notice tone="warning">
          The deductions are {formatRupees(totals.excessOverDepositPaise)} more than the deposit.
        </Notice>
      ) : null}
      <p className="text-ink-muted">{NOT_LEGAL_ADVICE}</p>
    </section>
  );
}
