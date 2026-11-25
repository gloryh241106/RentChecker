import { BUCKET_NAMES, BUCKET_ORDER, formatRupees } from '../shared.js';
import type { Totals } from '../shared.js';
import { BUCKET_LOOK } from './bucket-look.js';

/** UI.md Home: names the parts of the split bar, where there is no list of totals. */
export function BucketLegend({ totals }: { readonly totals: Totals }) {
  return (
    <dl className="flex flex-wrap gap-x-5 gap-y-1">
      {BUCKET_ORDER.filter((bucket) => totals[bucket] > 0).map((bucket) => {
        const { Icon, text } = BUCKET_LOOK[bucket];
        return (
          <div key={bucket} className="flex items-center gap-2">
            <dt className="flex items-center gap-1">
              <Icon className={`size-4 shrink-0 ${text}`} />
              {BUCKET_NAMES[bucket]}
            </dt>
            <dd className="font-semibold tabular-nums">{formatRupees(totals[bucket])}</dd>
          </div>
        );
      })}
    </dl>
  );
}
