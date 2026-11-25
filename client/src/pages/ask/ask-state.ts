interface AskState {
  readonly question: string;
}

/** Sent with a link that opens Ask your lease with a question filled in (F9-R12). */
export function askState(question: string): AskState {
  return { question };
}

/** The question of askState, or an empty one. */
export function readAskState(state: unknown): string {
  return typeof state === 'object' &&
    state !== null &&
    'question' in state &&
    typeof state.question === 'string'
    ? state.question
    : '';
}
