import { ConfirmDialog } from './ui/ConfirmDialog.js';
import type { MatchWording } from './match-text.js';

interface ConsentDialogProps {
  readonly isOpen: boolean;
  /** From /api/health. Picks the wording (F2-R3). */
  readonly isAiConfigured: boolean;
  readonly wording: MatchWording;
  readonly onContinue: () => void;
  /** Closed by Cancel, Escape or Continue. */
  readonly onClose: () => void;
}

/** FR-12, F2-R3. Says where the lease text goes before every request. */
export function ConsentDialog({
  isOpen,
  isAiConfigured,
  wording,
  onContinue,
  onClose,
}: ConsentDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={wording.consentTitle}
      confirmLabel="Continue"
      onConfirm={() => null}
      onConfirmed={onContinue}
      onClose={onClose}
    >
      <p>{isAiConfigured ? wording.consentAiOn : wording.consentAiOff}</p>
    </ConfirmDialog>
  );
}
