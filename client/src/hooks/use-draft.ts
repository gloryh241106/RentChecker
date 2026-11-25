import { useState } from 'react';
import { useWorkspace } from '../state/workspace-context.js';

export interface Draft {
  /** What the text box shows: the tenant's edits, or the template. */
  readonly text: string;
  /** F3-R12. True when the text differs from the template, so a regenerate would lose it. */
  readonly isEdited: boolean;
  readonly setText: (text: string) => void;
  /** Drops the edits, so the template shows again. */
  readonly regenerate: () => void;
}

/**
 * F3-R11. The stored draft holds the tenant's edits and nothing else: text equal to the template,
 * or an empty box, is stored as '' (which has-data.ts also reads as "no draft"). Whether the text
 * is edited is therefore found by comparing it with the template, with no extra flag.
 * `template` is null when there is nothing to ask, or no check was run.
 */
export function useDraft(template: string | null): Draft {
  const { workspace, dispatch } = useWorkspace();
  /** A box the tenant emptied stays empty, though '' is stored. Lost on reload. */
  const [isCleared, setIsCleared] = useState(false);
  const stored = workspace.draftMessage ?? '';
  const text = isCleared ? '' : stored !== '' ? stored : (template ?? '');

  function save(next: string): void {
    dispatch({ type: 'draft/set', text: next === template ? '' : next });
  }

  return {
    text,
    isEdited: template !== null && text !== template,
    setText: (next) => {
      setIsCleared(next === '');
      save(next);
    },
    regenerate: () => {
      setIsCleared(false);
      save('');
    },
  };
}
