import { useState } from 'react';
import { PageHeading } from '../../../app/PageHeading.js';
import { NOT_LEGAL_ADVICE } from '../../../components/not-legal-advice.js';
import { Button } from '../../../components/ui/Button.js';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.js';
import { TextField } from '../../../components/ui/Field.js';
import { Notice } from '../../../components/ui/Notice.js';
import { useCopy } from '../../../hooks/use-copy.js';
import { useDraft } from '../../../hooks/use-draft.js';
import type { Draft } from '../../../hooks/use-draft.js';
import { buildMessage } from '../../../shared.js';
import { useMoveOutSession } from '../session-context.js';

const FIELD_ID = 'message-text';
const HELP_ID = 'regenerate-help';

interface EditorProps {
  readonly draft: Draft;
  /** F3-R14. Why Regenerate is disabled, or null when it is not. */
  readonly regenerateBlock: string | null;
  readonly isStale: boolean;
}

/** F3-R10 to R14. The text box and its two buttons. */
function MessageEditor({ draft, regenerateBlock, isStale }: EditorProps) {
  const { copy, isBlocked } = useCopy(FIELD_ID);
  const [isAsking, setIsAsking] = useState(false);

  function regenerate(): void {
    if (draft.isEdited) {
      setIsAsking(true);
    } else {
      draft.regenerate();
    }
  }

  return (
    <>
      {isStale ? <Notice tone="warning">This draft may be out of date.</Notice> : null}
      {draft.isEdited && !isStale ? (
        <p>You edited this message. Regenerate to start again from the current results.</p>
      ) : null}
      <TextField
        id={FIELD_ID}
        label="Message to your landlord"
        hint="Replace the text in square brackets before you send."
        isMultiline
        rows={16}
        value={draft.text}
        onChange={draft.setText}
      />
      {isBlocked ? <Notice tone="info">Press Ctrl+C or long-press to copy.</Notice> : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button isFullWidth onClick={() => void copy(draft.text)}>
          Copy
        </Button>
        <Button
          variant="secondary"
          isFullWidth
          disabled={regenerateBlock !== null}
          aria-describedby={regenerateBlock === null ? undefined : HELP_ID}
          onClick={regenerate}
        >
          Regenerate
        </Button>
      </div>
      {regenerateBlock === null ? null : <p id={HELP_ID}>{regenerateBlock}</p>}
      <ConfirmDialog
        isOpen={isAsking}
        title="Regenerate the message?"
        confirmLabel="Continue"
        onConfirm={() => {
          draft.regenerate();
          return null;
        }}
        onConfirmed={() => document.getElementById(FIELD_ID)?.focus()}
        onClose={() => setIsAsking(false)}
      >
        <p>Regenerating will replace your edits. Continue?</p>
      </ConfirmDialog>
    </>
  );
}

/** F3. The message to the landlord, built from the last check and edited by the tenant. */
export function MessageStep() {
  const { check } = useMoveOutSession();
  const { result, snapshot, isOutOfDate } = check;
  const template =
    result === null || snapshot === null ? null : buildMessage(snapshot.input, result);
  const draft = useDraft(template);
  const hasChecked = result !== null;
  // F3-R14: a stored draft with no check this session cannot be compared with any results.
  const isStale = isOutOfDate || !hasChecked;
  const blocks = hasChecked ? 'Run the check again first.' : 'Run the check first.';

  let body = (
    <MessageEditor draft={draft} regenerateBlock={isStale ? blocks : null} isStale={isStale} />
  );
  if (hasChecked && template === null) {
    body = <p>Nothing to ask about. Every deduction is supported.</p>; // F3-R15
  } else if (!hasChecked && draft.text === '') {
    body = <p>Run the check first.</p>; // F3-R15
  }
  return (
    <section className="space-y-5">
      <PageHeading title="Message" />
      {body}
      <p className="text-ink-muted">{NOT_LEGAL_ADVICE}</p>
    </section>
  );
}
