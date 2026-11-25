import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { AnnounceContext } from './announce-context.js';

const NUDGE = String.fromCodePoint(0x200b);

/** Renders the status region once, in the page from the start, and lets any screen speak in it. */
export function Announcer({ children }: { readonly children: ReactNode }) {
  const [state, setState] = useState({ text: '', isNudged: false });
  const announce = useCallback(
    (message: string) =>
      setState((before) => ({
        text: message,
        isNudged: before.text === message && !before.isNudged,
      })),
    [],
  );
  // A repeated message is changed by an invisible character, so it is read again.
  const text = state.isNudged ? `${state.text}${NUDGE}` : state.text;
  return (
    <AnnounceContext value={announce}>
      {children}
      <div role="status" className="sr-only">
        {text}
      </div>
    </AnnounceContext>
  );
}
