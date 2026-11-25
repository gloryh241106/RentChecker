import { describe, expect, it } from 'vitest';
import type { ClauseMatch } from '../shared.js';
import { QUOTE, filledWorkspace, run } from '../test-support/builders.js';
import type { EvidenceOverride, WorkspaceAction } from './actions.js';

function override(deductionId: string, value: EvidenceOverride): WorkspaceAction {
  return { type: 'evidence/override', deductionId, override: value };
}

function apply(matches: readonly ClauseMatch[]): WorkspaceAction {
  return { type: 'evidence/apply', matches };
}

const NONE_BY_USER = { deductionId: 'd2', state: 'none', quote: null, source: 'user' };

describe('evidence actions', () => {
  it('F2-R12 a quote found in the lease is stored as verified, set by the user (T-165)', () => {
    const state = run(
      [override('d1', { state: 'verified', quote: ` ${QUOTE} ` })],
      filledWorkspace(),
    );
    expect(state.evidence).toEqual([
      { deductionId: 'd1', state: 'verified', quote: QUOTE, source: 'user' },
    ]);
  });

  it('F2-R12 a quote missing from the lease leaves the state unchanged (T-165)', () => {
    const before = filledWorkspace();
    const missing = override('d1', { state: 'verified', quote: 'text that is not in it' });
    expect(run([missing], before)).toBe(before);
  });

  it('F2-R13 confirming no clause stores none with no quote (T-165)', () => {
    const state = run([override('d2', { state: 'none' })], filledWorkspace());
    expect(state.evidence).toEqual([NONE_BY_USER]);
  });

  it('F2-R14 a later match run does not change an override (T-165)', () => {
    const match: ClauseMatch = {
      itemId: 'd2',
      source: 'ai',
      state: 'verified',
      quote: 'x'.repeat(20),
    };
    const state = run([override('d2', { state: 'none' }), apply([match])], filledWorkspace());
    expect(state.evidence).toEqual([NONE_BY_USER]);
  });

  it('F2-R14 Remove override returns the item to unconfirmed (T-165)', () => {
    const state = run(
      [override('d2', { state: 'none' }), override('d2', { state: 'unconfirmed' })],
      filledWorkspace(),
    );
    expect(state.evidence).toEqual([]);
  });

  it('F2-R6 a match for an unknown or rent item is ignored, others are stored', () => {
    const none = (itemId: string): ClauseMatch => ({
      itemId,
      source: 'ai',
      state: 'none',
      quote: null,
    });
    const state = run([apply([none('nope'), none('d3'), none('d1')])], filledWorkspace());
    expect(state.evidence.map((record) => record.deductionId)).toEqual(['d1']);
  });

  it('D-30 an override for an unknown deduction changes nothing', () => {
    const before = filledWorkspace();
    expect(run([override('zzz', { state: 'none' })], before)).toBe(before);
  });
});
