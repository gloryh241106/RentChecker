import { checkResultOf, takeSnapshot } from '../hooks/check-snapshot.js';
import { formatRupees } from '../shared.js';
import { createSampleWorkspace } from '../state/sample.js';
import { AskAboutLine } from './AskAboutLine.js';
import { BucketLegend } from './BucketLegend.js';
import { ResultBadge } from './ResultBadge.js';
import { SplitBar } from './SplitBar.js';

const SAMPLE = createSampleWorkspace();
const RESULT = checkResultOf(takeSnapshot(SAMPLE));

/** UI.md Home: the sample case, checked by shared/ like a real one, so it cannot go out of step. */
export function ExampleResult() {
  return RESULT === null ? null : (
    <section
      aria-labelledby="example-heading"
      className="space-y-4 rounded-xl bg-raised p-5 text-ink"
    >
      <h2 id="example-heading" className="text-base font-semibold text-ink-muted">
        Example result
      </h2>
      <AskAboutLine totals={RESULT.totals} />
      <SplitBar totals={RESULT.totals} />
      <BucketLegend totals={RESULT.totals} />
      <ul className="divide-y divide-line">
        {SAMPLE.deductions.map((deduction, index) => {
          const result = RESULT.deductions[index]?.result;
          return (
            <li
              key={deduction.id}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2"
            >
              <span>
                {deduction.label}{' '}
                <span className="font-semibold tabular-nums">
                  {formatRupees(deduction.amountPaise)}
                </span>
              </span>
              {result === undefined ? null : <ResultBadge result={result} />}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
