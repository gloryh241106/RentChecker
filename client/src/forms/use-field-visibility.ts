import { useCallback, useState } from 'react';

interface Visibility {
  readonly edited: ReadonlySet<string>;
  readonly shown: ReadonlySet<string>;
  readonly isSubmitted: boolean;
}

export interface FieldVisibility {
  /** Whether the user has tried to move on. */
  readonly isSubmitted: boolean;
  /** Whether the error of this field may be shown yet. */
  readonly isShown: (field: string) => boolean;
  readonly markEdited: (field: string) => void;
  /** Leaving a field that was edited makes its error visible. */
  readonly markBlurred: (field: string) => void;
  /** Next and Run check: every error becomes visible. */
  readonly showAll: () => void;
}

/**
 * UI.md: do not shout while the user types. An error shows after the field was edited and left, and
 * for every field once the user tries to move on.
 */
export function useFieldVisibility(): FieldVisibility {
  const [state, setState] = useState<Visibility>({
    edited: new Set(),
    shown: new Set(),
    isSubmitted: false,
  });
  const markEdited = useCallback(
    (field: string) =>
      setState((before) => ({ ...before, edited: new Set(before.edited).add(field) })),
    [],
  );
  const markBlurred = useCallback(
    (field: string) =>
      setState((before) =>
        before.edited.has(field) ? { ...before, shown: new Set(before.shown).add(field) } : before,
      ),
    [],
  );
  const showAll = useCallback(() => setState((before) => ({ ...before, isSubmitted: true })), []);
  const isShown = useCallback(
    (field: string) => state.isSubmitted || state.shown.has(field),
    [state],
  );
  return { isSubmitted: state.isSubmitted, isShown, markEdited, markBlurred, showAll };
}
