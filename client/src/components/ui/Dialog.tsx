import { useEffect, useId, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';

interface DialogProps {
  readonly isOpen: boolean;
  readonly title: string;
  /** The dialog closed itself (Escape) or after `isOpen` became false. */
  readonly onClose: () => void;
  /** Focus goes here when the dialog opens. Defaults to the first control. */
  readonly initialFocus?: RefObject<HTMLElement | null>;
  readonly children: ReactNode;
}

/**
 * A native `dialog`. The browser traps focus and closes on Escape. Focus goes back to the control
 * that opened it, which is stored here because not every environment does it.
 */
export function Dialog({ isOpen, title, onClose, initialFocus, children }: DialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  const titleId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (element === null) {
      return;
    }
    if (isOpen && !element.open) {
      opener.current = document.activeElement;
      element.showModal();
      initialFocus?.current?.focus();
    } else if (!isOpen && element.open) {
      element.close();
    }
  }, [isOpen, initialFocus]);

  function handleClose(): void {
    if (opener.current instanceof HTMLElement) {
      opener.current.focus();
    }
    opener.current = null;
    onClose();
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onClose={handleClose}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-lg border-2 border-line-input bg-raised p-6 text-ink"
    >
      <div className="space-y-4">
        <h2 id={titleId} className="text-xl font-bold">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
