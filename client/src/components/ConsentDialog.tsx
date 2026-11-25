import { ConfirmDialog } from './ui/ConfirmDialog.js';
import { CONSENT_AI_OFF, CONSENT_AI_ON, CONSENT_TITLE } from './match-text.js';

interface ConsentDialogProps {
  readonly isOpen: boolean;
  /** From /api/health. Picks the wording (F2-R3). */
  readonly isAiConfigured: boolean;
  readonly onContinue: () => void;
  /** Closed by Cancel, Escape or Continue. */
  readonly onClose: () => void;
}

/** FR-12, F2-R3. Says where the lease text goes before every request. */
export function ConsentDialog({ isOpen, isAiConfigured, onContinue, onClose }: ConsentDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={CONSENT_TITLE}
      confirmLabel="Continue"
      onConfirm={() => null}
      onConfirmed={onContinue}
      onClose={onClose}
    >
      <p>{isAiConfigured ? CONSENT_AI_ON : CONSENT_AI_OFF}</p>
    </ConfirmDialog>
  );
}
