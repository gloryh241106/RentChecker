import { useEffect, useRef, useState } from 'react';
import { useAnnounce } from '../app/announce-context.js';
import type { EvidenceOverride } from '../state/actions.js';
import { QuoteForm } from './QuoteForm.js';
import { Button } from './ui/Button.js';

interface OverrideControlsProps {
  /** Makes the quote field's id. Unique on the page. */
  readonly itemId: string;
  readonly label: string;
  readonly isOverridden: boolean;
  /** The text a pasted quote is checked against (F2-R12). */
  readonly leaseText: string;
  readonly onOverride: (change: EvidenceOverride) => void;
}

/** F2-R12 to F2-R14, F4-R6: the tenant's own say over what the lease contains. */
export function OverrideControls(props: OverrideControlsProps) {
  const { itemId, label, isOverridden, leaseText, onOverride } = props;
  const announce = useAnnounce();
  const [isPasting, setIsPasting] = useState(false);
  const pasteButton = useRef<HTMLButtonElement>(null);
  const wasPasting = useRef(false);

  // The form replaces the buttons, so when it closes focus goes back to the one that opened it.
  useEffect(() => {
    if (wasPasting.current && !isPasting) {
      pasteButton.current?.focus();
    }
    wasPasting.current = isPasting;
  }, [isPasting]);

  function override(change: EvidenceOverride, message: string): void {
    onOverride(change);
    announce(message);
  }

  if (isPasting) {
    return (
      <QuoteForm
        fieldId={`quote-${itemId}`}
        label={label}
        leaseText={leaseText}
        onSave={(quote) => {
          override({ state: 'verified', quote }, `Quote saved for ${label}.`);
          setIsPasting(false);
        }}
        onCancel={() => setIsPasting(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <Button
        ref={pasteButton}
        variant="secondary"
        isFullWidth
        aria-label={`Paste a quote for ${label}`}
        onClick={() => setIsPasting(true)}
      >
        Paste a quote
      </Button>
      <Button
        variant="secondary"
        isFullWidth
        aria-label={`No clause here for ${label}`}
        onClick={() => override({ state: 'none' }, `No clause confirmed for ${label}.`)}
      >
        No clause here
      </Button>
      {isOverridden ? (
        <Button
          variant="quiet"
          isFullWidth
          aria-label={`Remove override for ${label}`}
          onClick={() => {
            override({ state: 'unconfirmed' }, `Override removed for ${label}.`);
            pasteButton.current?.focus(); // This button goes away with the override.
          }}
        >
          Remove override
        </Button>
      ) : null}
    </div>
  );
}
