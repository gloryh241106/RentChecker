import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ApiResult } from '../api/api-error.js';
import type { Deduction, MatchResponse } from '../shared.js';
import { FEE, PAINTING, RENT } from '../test-support/builders.js';
import { FakeClauseApi } from '../test-support/fake-clause-api.js';
import { useClauseMatch } from './use-clause-match.js';

const LEASE = 'The tenant shall pay for painting on exit. The tenant shall pay a service fee.';

const ANSWER: ApiResult<MatchResponse> = {
  ok: true,
  value: {
    mode: 'ai',
    warnings: [],
    matches: [{ itemId: 'd1', state: 'verified', quote: 'pay for painting', source: 'ai' }],
  },
};

interface Props {
  readonly leaseText: string;
  readonly deductions: readonly Deduction[];
}

type Answer = (result: ApiResult<MatchResponse>) => void;

function setup(api: FakeClauseApi, initial: Props = { leaseText: LEASE, deductions: [PAINTING] }) {
  const applyMatches = vi.fn();
  const announce = vi.fn();
  const view = renderHook(
    (props: Props) => useClauseMatch({ api, applyMatches, announce, ...props }),
    { initialProps: initial },
  );
  return { ...view, applyMatches, announce };
}

/** An API whose answer is held until the test calls `release`. */
function heldApi() {
  const api = new FakeClauseApi();
  const held: { release: Answer } = { release: () => undefined };
  api.answer = () => new Promise((resolve) => (held.release = resolve));
  return { api, held };
}

function start(result: { current: ReturnType<typeof useClauseMatch> }): void {
  act(() => result.current.start());
  act(() => result.current.confirm());
}

describe('useClauseMatch', () => {
  it('T-162 one request holds only the non-rent deductions', async () => {
    const api = new FakeClauseApi();
    const { result } = setup(api, { leaseText: LEASE, deductions: [PAINTING, RENT, FEE] });
    start(result);
    await waitFor(() => expect(result.current.phase.name).toBe('done'));
    expect(api.requests).toHaveLength(1);
    expect(api.requests[0]?.items).toEqual([
      { id: 'd1', label: 'Repainting' },
      { id: 'd2', label: 'Service fee' },
    ]);
  });

  it('F2-AC12 dismissing the notice sends nothing', () => {
    const api = new FakeClauseApi();
    const { result } = setup(api);
    act(() => result.current.start());
    expect(result.current.phase.name).toBe('consent');
    act(() => result.current.dismiss());
    expect(result.current.phase.name).toBe('idle');
    expect(api.requests).toHaveLength(0);
  });

  it('F2-R1 a short lease and no non-rent deduction block the start', () => {
    const { result } = setup(new FakeClauseApi(), { leaseText: 'short', deductions: [RENT] });
    expect(result.current.blockers).toHaveLength(2);
    act(() => result.current.start());
    expect(result.current.phase.name).toBe('idle');
  });

  it('F2-R9 an answer that arrives after the lease changed is not applied', async () => {
    const { api, held } = heldApi();
    const { result, rerender, applyMatches, announce } = setup(api);
    start(result);
    expect(result.current.phase.name).toBe('running');
    rerender({ leaseText: `${LEASE} Changed.`, deductions: [PAINTING] });
    expect(api.signals[0]?.aborted).toBe(true);
    expect(result.current.phase.name).toBe('idle');
    await act(async () => held.release(ANSWER));
    expect(applyMatches).not.toHaveBeenCalled();
    expect(announce).not.toHaveBeenCalled();
    expect(result.current.phase.name).toBe('idle');
  });

  it('F2-R9 an answer that arrives after a label changed is not applied', async () => {
    const { api, held } = heldApi();
    const { result, rerender, applyMatches } = setup(api);
    start(result);
    rerender({ leaseText: LEASE, deductions: [{ ...PAINTING, label: 'Cleaning' }] });
    await act(async () => held.release(ANSWER));
    expect(applyMatches).not.toHaveBeenCalled();
  });

  it('F2-R9 a change to an amount does not drop the run', async () => {
    const { api, held } = heldApi();
    const { result, rerender, applyMatches } = setup(api);
    start(result);
    rerender({ leaseText: LEASE, deductions: [{ ...PAINTING, amountPaise: 5 }] });
    await act(async () => held.release(ANSWER));
    expect(applyMatches).toHaveBeenCalledOnce();
  });

  it('FRONTEND leaving the step aborts the run and applies nothing', async () => {
    const { api, held } = heldApi();
    const { result, unmount, applyMatches, announce } = setup(api);
    start(result);
    unmount();
    expect(api.signals[0]?.aborted).toBe(true);
    await act(async () => held.release(ANSWER));
    expect(applyMatches).not.toHaveBeenCalled();
    expect(announce).not.toHaveBeenCalled();
  });

  it('T-167 a failure leaves evidence alone and keeps the error kind', async () => {
    const api = new FakeClauseApi();
    api.answer = () => ({ ok: false, error: { kind: 'rate_limited' } });
    const { result, applyMatches } = setup(api);
    start(result);
    await waitFor(() => expect(result.current.phase.name).toBe('failed'));
    expect(result.current.phase).toEqual({ name: 'failed', error: { kind: 'rate_limited' } });
    expect(applyMatches).not.toHaveBeenCalled();
    expect(api.requests).toHaveLength(1);
  });
});
