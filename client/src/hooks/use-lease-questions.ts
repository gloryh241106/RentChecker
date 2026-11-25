import { useEffect, useRef, useState } from 'react';
import type { ClauseApi } from '../api/clause-api.js';
import type { ClauseMatch } from '../shared.js';
import type { MatchPhase } from './use-match-run.js';

/** F7-R6. */
export const MAX_ANSWERS = 20;
export const ANSWERED_TEXT = 'Answer added.';
export const QUESTION_FAILED_TEXT = 'The question failed.';

const ITEM_ID = 'question';
const IDLE: MatchPhase = { name: 'idle' };

export interface LeaseAnswer {
  readonly id: number;
  readonly question: string;
  readonly match: ClauseMatch;
}

export interface LeaseQuestions {
  readonly phase: MatchPhase;
  /** The newest answer first. */
  readonly answers: readonly LeaseAnswer[];
  /** Asks, or opens the consent notice first (F7-R3). Does nothing while a question is running. */
  readonly ask: (question: string) => void;
  /** The tenant chose Continue. */
  readonly confirm: () => void;
  /** The notice closed without Continue. Nothing is sent. */
  readonly dismiss: () => void;
  readonly tryAgain: () => void;
}

interface Options {
  readonly api: ClauseApi;
  readonly leaseText: string;
  readonly announce: (message: string) => void;
}

function withAnswer(
  answers: readonly LeaseAnswer[],
  question: string,
  match: ClauseMatch,
): readonly LeaseAnswer[] {
  const id = (answers[0]?.id ?? 0) + 1;
  return [{ id, question, match }, ...answers].slice(0, MAX_ANSWERS);
}

/**
 * F7-R2, F7-R3, F7-R6, F7-R9. One request for each question about one lease text. The caller mounts
 * it anew when the text changes, which drops the answers, the consent and a running request.
 */
export function useLeaseQuestions({ api, leaseText, announce }: Options): LeaseQuestions {
  const [phase, setPhase] = useState<MatchPhase>(IDLE);
  const [answers, setAnswers] = useState<readonly LeaseAnswer[]>([]);
  const [question, setQuestion] = useState('');
  const [hasAgreed, setHasAgreed] = useState(false);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  async function send(asked: string): Promise<void> {
    const mine = new AbortController();
    controller.current = mine;
    setPhase({ name: 'running' });
    const items = [{ id: ITEM_ID, label: asked }];
    const result = await api.matchClauses({ leaseText, items }, mine.signal);
    if (mine.signal.aborted) {
      return;
    }
    const match = result.ok ? result.value.matches[0] : undefined;
    if (result.ok && match !== undefined) {
      setAnswers((now) => withAnswer(now, asked, match));
      setPhase({ name: 'done', mode: result.value.mode, warnings: result.value.warnings });
      announce(ANSWERED_TEXT);
    } else {
      setPhase({ name: 'failed', error: result.ok ? { kind: 'bad_response' } : result.error });
      announce(QUESTION_FAILED_TEXT);
    }
  }

  function ask(asked: string): void {
    if (phase.name === 'running') {
      return;
    }
    setQuestion(asked);
    if (hasAgreed) {
      void send(asked);
    } else {
      setPhase({ name: 'consent' });
    }
  }

  return {
    phase,
    answers,
    ask,
    confirm: () => {
      setHasAgreed(true);
      void send(question);
    },
    dismiss: () => setPhase((now) => (now.name === 'consent' ? IDLE : now)),
    tryAgain: () => ask(question),
  };
}
