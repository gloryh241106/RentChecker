import type { InputCheck } from '../shared.js';
import { Notice } from './ui/Notice.js';

/** F9-R11. Likely mistakes in the input. They never block. */
export function InputChecks({ checks }: { readonly checks: readonly InputCheck[] }) {
  if (checks.length === 0) {
    return null;
  }
  return (
    <Notice tone="warning" title="Please check">
      <ul className="list-disc space-y-1 pl-5 wrap-anywhere">
        {checks.map(({ code, text }) => (
          <li key={`${code}-${text}`}>{text}</li>
        ))}
      </ul>
    </Notice>
  );
}
