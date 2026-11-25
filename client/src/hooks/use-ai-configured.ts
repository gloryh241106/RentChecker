import { useEffect, useState } from 'react';
import type { ClauseApi } from '../api/clause-api.js';

/**
 * F2-R3. Reads /api/health once, when a match becomes possible, so a check with no lease makes no
 * call (NFR-6). Until it is known, and if it cannot be read, this is true,
 * because the AI-on notice is the stricter one.
 */
export function useAiConfigured(api: ClauseApi, isNeeded: boolean): boolean {
  const [isAiConfigured, setIsAiConfigured] = useState(true);
  useEffect(() => {
    if (!isNeeded) {
      return;
    }
    const controller = new AbortController();
    void api.readHealth(controller.signal).then((result) => {
      if (result.ok && !controller.signal.aborted) {
        setIsAiConfigured(result.value.aiConfigured);
      }
    });
    return () => controller.abort();
  }, [api, isNeeded]);
  return isAiConfigured;
}
