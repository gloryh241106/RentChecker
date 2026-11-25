import { createContext, useContext } from 'react';

/** Says something in the always-present status region (UI.md Accessibility). */
export type Announce = (message: string) => void;

export const AnnounceContext = createContext<Announce | null>(null);

export function useAnnounce(): Announce {
  const announce = useContext(AnnounceContext);
  if (announce === null) {
    throw new Error('useAnnounce needs the Layout');
  }
  return announce;
}
