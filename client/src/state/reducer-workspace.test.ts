import { describe, expect, it } from 'vitest';
import { MAX_LEASE_LENGTH, workspaceSchema } from '../shared.js';
import { EMPTY_WORKSPACE } from './empty-workspace.js';
import { hasData } from './has-data.js';
import { PAINTING, add, filledWorkspace, run } from '../test-support/builders.js';
import type { WorkspaceAction } from './actions.js';

const NONE_FOR_D1: WorkspaceAction = {
  type: 'evidence/override',
  deductionId: 'd1',
  override: { state: 'none' },
};

describe('workspace actions', () => {
  it('F1-R15 a changed lease text clears all evidence (T-166)', () => {
    const before = run([NONE_FOR_D1], filledWorkspace());
    const state = run([{ type: 'lease/set', text: `${before.leaseText}!` }], before);
    expect(state.evidence).toEqual([]);
  });

  it('F1-R15 the same lease text keeps the evidence and the same state object', () => {
    const before = run([NONE_FOR_D1], filledWorkspace());
    expect(run([{ type: 'lease/set', text: before.leaseText }], before)).toBe(before);
  });

  it('F1-R17 loading the sample keeps isSample through later edits until reset', () => {
    const sample = run([{ type: 'sample/load' }]);
    expect(sample.isSample).toBe(true);
    const edited = run([{ type: 'lease/set', text: 'changed' }, add(PAINTING)], sample);
    expect(edited.isSample).toBe(true);
    expect(run([{ type: 'workspace/reset' }], edited).isSample).toBe(false);
  });

  it('F1-R19 reset returns the shared empty workspace', () => {
    expect(run([{ type: 'workspace/reset' }], filledWorkspace())).toBe(EMPTY_WORKSPACE);
  });

  it('F1-R3 a tenancy update replaces the tenancy fields', () => {
    const tenancy = {
      partialMonth: 'per_day',
      handoverDayCounts: false,
      depositPaise: 5000,
    } as const;
    expect(run([{ type: 'tenancy/update', tenancy }]).tenancy).toEqual(tenancy);
  });

  it('D-5 a start date after the handover date is dropped by the invariant', () => {
    const tenancy = {
      partialMonth: 'unsure',
      handoverDayCounts: true,
      startDate: '2026-06-20',
      handoverDate: '2026-06-15',
    } as const;
    expect(run([{ type: 'tenancy/update', tenancy }])).toBe(EMPTY_WORKSPACE);
  });

  it('F1-R18 what is stored always passes the workspace schema after many actions', () => {
    const actions: WorkspaceAction[] = [
      { type: 'sample/load' },
      { type: 'lease/set', text: 'x'.repeat(MAX_LEASE_LENGTH + 1) },
      { type: 'deduction/remove', id: 'nothing' },
      { type: 'deduction/update', deduction: PAINTING, repairIds: ['nope'] },
      { type: 'draft/set', text: 'Hello' },
      add({ ...PAINTING, id: 'bad id!' }),
      add({ ...PAINTING, id: 'sample-painting' }),
      { type: 'deduction/remove', id: 'sample-rent' },
      { type: 'lease/set', text: '' },
      add(PAINTING, ['ghost']),
    ];
    let state = EMPTY_WORKSPACE;
    for (const action of actions) {
      state = run([action], state);
      expect(workspaceSchema.safeParse(state).success).toBe(true);
    }
  });

  it('F1-R17 hasData tells an untouched workspace from one with entries', () => {
    expect(hasData(EMPTY_WORKSPACE)).toBe(false);
    expect(hasData(filledWorkspace())).toBe(true);
    const typed = run([
      {
        type: 'tenancy/update',
        tenancy: { partialMonth: 'unsure', handoverDayCounts: true, depositPaise: 100 },
      },
    ]);
    expect(hasData(typed)).toBe(true);
  });
});
