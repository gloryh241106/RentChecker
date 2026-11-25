import { useState } from 'react';
import { useAnnounce } from '../app/announce-context.js';

/** Reads `navigator.clipboard` when called, so a test can replace it. False when refused. */
export async function writeToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // No clipboard, or permission denied: the caller selects the text instead (F3-R13).
    return false;
  }
}

export interface Copy {
  /** True after the clipboard refused, until a copy works. */
  readonly isBlocked: boolean;
  readonly copy: (text: string) => Promise<void>;
}

/**
 * F3-R13. Puts the text on the clipboard and says "Copied". When that fails, selects the text in
 * the field with this id, so the tenant can copy it by hand.
 */
export function useCopy(fieldId: string, write = writeToClipboard): Copy {
  const announce = useAnnounce();
  const [isBlocked, setIsBlocked] = useState(false);

  async function copy(text: string): Promise<void> {
    const isWritten = await write(text);
    setIsBlocked(!isWritten);
    if (isWritten) {
      announce('Copied');
      return;
    }
    const field = document.getElementById(fieldId);
    if (field instanceof HTMLTextAreaElement) {
      field.focus();
      field.select();
    }
  }
  return { isBlocked, copy };
}
