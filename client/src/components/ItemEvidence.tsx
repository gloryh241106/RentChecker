import type { ReactNode } from 'react';
import type { ClauseEvidence } from '../shared.js';
import { SOURCE_TAGS } from '../shared.js';

interface ItemEvidenceProps {
  /** "Clause" on the Lease step, "Outcome" on the review page. */
  readonly caption: string;
  /** The state in words. */
  readonly stateText: string;
  /** Absent while nothing was matched or set. */
  readonly evidence: Pick<ClauseEvidence, 'quote' | 'source'> | undefined;
  /** What the page adds under the quote, such as a question. */
  readonly children?: ReactNode;
}

/** D-30 in words, with who set it and the quote when there is one. */
export function ItemEvidence({ caption, stateText, evidence, children }: ItemEvidenceProps) {
  return (
    <>
      <p>
        <span className="font-semibold">{caption}: </span>
        {stateText}
        {evidence === undefined ? null : (
          <span className="text-ink-muted"> ({SOURCE_TAGS[evidence.source]})</span>
        )}
      </p>
      {evidence?.quote == null ? null : (
        <blockquote className="border-l-4 border-line-input pl-3 italic">
          {evidence.quote}
        </blockquote>
      )}
      {children}
    </>
  );
}
