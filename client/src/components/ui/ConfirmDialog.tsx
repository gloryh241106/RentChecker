import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from './Button.js';
import { Dialog } from './Dialog.js';
import { Notice } from './Notice.js';

interface ConfirmDialogProps {
  readonly isOpen: boolean;
  readonly title: string;
  readonly children: ReactNode;
  readonly confirmLabel: string;
  readonly confirmVariant?: 'primary' | 'danger';
  /** Does the work. Returns an error text to keep the dialog open, or null when it worked. */
  readonly onConfirm: () => string | null;
  /** Runs once the dialog has closed and focus is back, only after a confirm. */
  readonly onConfirmed: () => void;
  /** The dialog is closed, however it happened. The owner sets `isOpen` to false. */
  readonly onClose: () => void;
}

/** A question with Cancel and one action. Cancel is where focus starts, because nothing is lost. */
export function ConfirmDialog(props: ConfirmDialogProps) {
  const { isOpen, title, children, confirmLabel, confirmVariant = 'primary' } = props;
  const cancel = useRef<HTMLButtonElement>(null);
  const isConfirmed = useRef(false);
  const [problem, setProblem] = useState<string | null>(null);

  function confirm(): void {
    const error = props.onConfirm();
    setProblem(error);
    if (error === null) {
      isConfirmed.current = true;
      props.onClose();
    }
  }

  function handleClose(): void {
    const wasConfirmed = isConfirmed.current;
    isConfirmed.current = false;
    setProblem(null);
    props.onClose();
    if (wasConfirmed) {
      props.onConfirmed();
    }
  }

  return (
    <Dialog isOpen={isOpen} title={title} onClose={handleClose} initialFocus={cancel}>
      {children}
      {problem === null ? null : <Notice tone="danger">{problem}</Notice>}
      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button variant={confirmVariant} isFullWidth onClick={confirm}>
          {confirmLabel}
        </Button>
        <Button ref={cancel} variant="secondary" isFullWidth onClick={props.onClose}>
          Cancel
        </Button>
      </div>
    </Dialog>
  );
}
