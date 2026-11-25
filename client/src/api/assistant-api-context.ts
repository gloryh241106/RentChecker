import { createContext, useContext } from 'react';
import type { AssistantApi } from './assistant-api.js';

export const AssistantApiContext = createContext<AssistantApi | null>(null);

/** Only the React root and tests choose the real or fake API (Dependency Inversion). */
export function useAssistantApi(): AssistantApi {
  const api = useContext(AssistantApiContext);
  if (api === null) {
    throw new Error('useAssistantApi needs an AssistantApiContext');
  }
  return api;
}
