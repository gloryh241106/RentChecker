import { BUCKET_ORDER } from '../shared.js';
import type { Totals } from '../shared.js';
import { BUCKET_LOOK } from './bucket-look.js';

/**
 * The four buckets as parts of the total. It repeats the list of totals, so it is hidden from
 * assistive technology. Each part has the icon of its bucket, so colour is not the only signal.
 */
export function SplitBar({ totals }: { readonly totals: Totals }) {
  const parts = BUCKET_ORDER.filter((bucket) => totals[bucket] > 0);
  return parts.length === 0 ? null : (
    <div aria-hidden="true" className="flex h-8 gap-1">
      {parts.map((bucket) => {
        const { Icon, fill } = BUCKET_LOOK[bucket];
        return (
          <span
            key={bucket}
            style={{ flexGrow: totals[bucket] }}
            className={`flex min-w-1 basis-0 items-center justify-center overflow-hidden rounded-md text-on-primary ${fill}`}
          >
            <Icon />
          </span>
        );
      })}
    </div>
  );
}
