import { createContext, useContext } from 'react';
import type { ClauseApi } from './clause-api.js';

export const ClauseApiContext = createContext<ClauseApi | null>(null);

/** Only the React root and tests choose the real or fake API (Dependency Inversion). */
export function useClauseApi(): ClauseApi {
  const api = useContext(ClauseApiContext);
  if (api === null) {
    throw new Error('useClauseApi needs a ClauseApiContext');
  }
  return api;
}
