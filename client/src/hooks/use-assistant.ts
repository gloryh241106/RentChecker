import { useEffect, useRef, useState } from 'react';
import type { AssistantApi } from '../api/assistant-api.js';
import { startPlan } from './assistant-plan.js';
import type { AssistantPlan } from './assistant-plan.js';
import type { MatchPhase } from './use-match-run.js';

export const READ_TEXT = 'Your message was read.';
export const READ_FAILED_TEXT = 'Your message could not be read.';

const IDLE: MatchPhase = { name: 'idle' };

export interface Assistant {
  readonly phase: MatchPhase;
  readonly plan: AssistantPlan | null;
  /** The next plan, after an answer or a change in the browser. */
  readonly setPlan: (plan: AssistantPlan) => void;
  /** Sends the prompt, or opens the consent notice first (F9-R1). */
  readonly submit: (prompt: string) => void;
  readonly confirm: () => void;
  readonly dismiss: () => void;
  readonly tryAgain: () => void;
}

interface Options {
  readonly api: AssistantApi;
  readonly announce: (message: string) => void;
}

/** F9-R1, F9-R8. One request for each prompt. Everything after it runs in the browser. */
export function useAssistant({ api, announce }: Options): Assistant {
  const [phase, setPhase] = useState<MatchPhase>(IDLE);
  const [plan, setPlan] = useState<AssistantPlan | null>(null);
  const [prompt, setPrompt] = useState('');
  const [hasAgreed, setHasAgreed] = useState(false);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  async function send(sent: string): Promise<void> {
    const mine = new AbortController();
    controller.current = mine;
    setPlan(null);
    setPhase({ name: 'running' });
    const result = await api.readPrompt({ prompt: sent }, mine.signal);
    if (mine.signal.aborted) {
      return;
    }
    if (result.ok) {
      setPlan(startPlan(sent, result.value));
      setPhase({ name: 'done', mode: result.value.mode, warnings: result.value.warnings });
      announce(READ_TEXT);
    } else {
      setPhase({ name: 'failed', error: result.error });
      announce(READ_FAILED_TEXT);
    }
  }

  function submit(text: string): void {
    if (phase.name === 'running') {
      return;
    }
    setPrompt(text);
    if (hasAgreed) {
      void send(text);
    } else {
      setPhase({ name: 'consent' });
    }
  }

  function confirm(): void {
    setHasAgreed(true);
    void send(prompt);
  }

  const dismiss = (): void => setPhase((now) => (now.name === 'consent' ? IDLE : now));
  return { phase, plan, setPlan, submit, confirm, dismiss, tryAgain: () => submit(prompt) };
}
