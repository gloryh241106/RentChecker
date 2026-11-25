import { useEffect, useRef, useState } from 'react';
import { useAnnounce } from '../app/announce-context.js';
import type { EvidenceOverride } from '../state/actions.js';
import { useWorkspace } from '../state/workspace-context.js';
import { QuoteForm } from './QuoteForm.js';
import { Button } from './ui/Button.js';

interface EvidenceControlsProps {
  readonly deductionId: string;
  readonly label: string;
  readonly isOverridden: boolean;
}

/** F2-R12 to F2-R14: the tenant's own say over what the lease contains. */
export function EvidenceControls({ deductionId, label, isOverridden }: EvidenceControlsProps) {
  const { workspace, dispatch } = useWorkspace();
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
    dispatch({ type: 'evidence/override', deductionId, override: change });
    announce(message);
  }

  if (isPasting) {
    return (
      <QuoteForm
        fieldId={`quote-${deductionId}`}
        label={label}
        leaseText={workspace.leaseText}
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
