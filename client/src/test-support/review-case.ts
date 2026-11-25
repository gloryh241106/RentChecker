import { screen } from '@testing-library/react';
import type { ApiResult } from '../api/api-error.js';
import { REVIEW_TOPICS, workspaceSchema } from '../shared.js';
import type { MatchMode, MatchResponse, MatchWarning, ReviewTopicId } from '../shared.js';
import { EMPTY_WORKSPACE } from '../state/empty-workspace.js';
import { FakeClauseApi } from './fake-clause-api.js';
import type { InMemoryWorkspaceStorage } from './in-memory-storage.js';
import { renderApp } from './render-app.js';

export const REVIEW_LEASE =
  'The security deposit is Rs 30,000 and is paid before moving in. The tenant shall pay for painting on exit. Cleaning is charged at a fixed fee on leaving.';
export const DEPOSIT_QUOTE = 'security deposit is Rs 30,000';
export const REVIEW_ROUTE = '/lease-review';

/** What the AI says about one topic. A topic that is not named is unconfirmed. */
export type TopicAnswer =
  'none' | 'unconfirmed' | { state: 'verified' | 'excludes'; quote: string };

export function reviewAnswer(
  answers: Partial<Record<ReviewTopicId, TopicAnswer>>,
  mode: MatchMode = 'ai',
  warnings: readonly MatchWarning[] = [],
): ApiResult<MatchResponse> {
  const matches = REVIEW_TOPICS.map(({ id }) => {
    const said = answers[id] ?? 'unconfirmed';
    return typeof said === 'string'
      ? { itemId: id, state: said, quote: null, source: mode }
      : { itemId: id, ...said, source: mode };
  });
  return { ok: true, value: { mode, warnings: [...warnings], matches } };
}

export function renderReview(leaseText = REVIEW_LEASE, clauseApi = new FakeClauseApi()) {
  const setup = renderApp({
    route: REVIEW_ROUTE,
    stored: { ...EMPTY_WORKSPACE, reviewLeaseText: leaseText },
    clauseApi,
  });
  return { ...setup, clauseApi };
}

export type ReviewSetup = ReturnType<typeof renderReview>;

/** Run review, then Continue on the notice. */
export async function runReview({ user }: ReviewSetup): Promise<void> {
  await user.click(screen.getByRole('button', { name: 'Run review' }));
  await user.click(await screen.findByRole('button', { name: 'Continue' }));
}

/** The row of a topic. */
export function rowOf(name: string): HTMLElement {
  const row = screen.getByRole('heading', { level: 3, name }).closest('li');
  if (row === null) {
    throw new Error(`No row for ${name}`);
  }
  return row;
}

/** What the storage holds now, read back through the schema. Saves are debounced. */
export function storedWorkspace(storage: InMemoryWorkspaceStorage) {
  return workspaceSchema.parse(JSON.parse(storage.raw ?? 'null'));
}

export function apiAnswering(result: ApiResult<MatchResponse>): FakeClauseApi {
  const api = new FakeClauseApi();
  api.answer = () => result;
  return api;
}

/** A page after one review, with its rows shown. */
export async function reviewed(result = reviewAnswer({})): Promise<ReviewSetup> {
  const setup = renderReview(undefined, apiAnswering(result));
  await runReview(setup);
  await screen.findByRole('heading', { level: 3, name: 'Painting' });
  return setup;
}
