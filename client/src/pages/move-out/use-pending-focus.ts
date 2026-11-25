import { useEffect } from 'react';
import { useMoveOutSession } from './session-context.js';

/** A step that was opened because of a mistake puts focus on the field that is wrong (F1-R8). */
export function usePendingFocus(): void {
  const { takePendingFocus } = useMoveOutSession();
  useEffect(() => {
    const fieldId = takePendingFocus();
    if (fieldId !== null) {
      document.getElementById(fieldId)?.focus();
    }
  }, [takePendingFocus]);
}
