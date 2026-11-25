import { describe, expect, it } from 'vitest';
import { MAX_REPAIRS } from '../shared.js';
import { PAINTING, REPAIR, add, run } from '../test-support/builders.js';
import type { RepairFields, WorkspaceAction } from './actions.js';
import { EMPTY_WORKSPACE } from './empty-workspace.js';

const FIELDS: RepairFields = {
  id: REPAIR.id,
  date: REPAIR.date,
  description: REPAIR.description,
  reportedTo: REPAIR.reportedTo,
};

function addRepair(id: string): WorkspaceAction {
  return { type: 'repair/add', repair: { ...FIELDS, id } };
}

describe('repair actions', () => {
  it('F5-R5 an entry is added to the log', () => {
    expect(run([addRepair('r1')]).repairs).toEqual([REPAIR]);
  });

  it('F5-R5 an entry with a known id is not added twice', () => {
    expect(run([addRepair('r1'), addRepair('r1')]).repairs).toHaveLength(1);
  });

  it('F5-AC8 a 51st entry is not added', () => {
    const many = Array.from({ length: MAX_REPAIRS + 1 }, (_, index) => addRepair(`id-${index}`));
    expect(run(many).repairs).toHaveLength(MAX_REPAIRS);
  });

  it('F5-R5 an entry is edited in place', () => {
    const edited = { ...FIELDS, date: '2026-04-01', description: 'Leaking tap' };
    const state = run([addRepair('r1'), { type: 'repair/update', repair: edited }]);
    expect(state.repairs).toEqual([{ ...edited, deductionId: undefined }]);
  });

  it('F5-R6 editing an entry keeps its link to the deduction', () => {
    const linked = run([add(PAINTING, ['r1'])], { ...EMPTY_WORKSPACE, repairs: [REPAIR] });
    const state = run(
      [{ type: 'repair/update', repair: { ...FIELDS, description: 'Leaking tap' } }],
      linked,
    );
    expect(state.repairs[0]).toMatchObject({ description: 'Leaking tap', deductionId: 'd1' });
  });

  it('F5-R5 editing an unknown entry changes nothing', () => {
    const before = run([addRepair('r1')]);
    expect(run([{ type: 'repair/update', repair: { ...FIELDS, id: 'nope' } }], before)).toBe(
      before,
    );
  });

  it('F5-R7 F5-AC9 deleting a linked entry removes it and its link', () => {
    const linked = run([add(PAINTING, ['r1'])], { ...EMPTY_WORKSPACE, repairs: [REPAIR] });
    const state = run([{ type: 'repair/remove', id: 'r1' }], linked);
    expect(state.repairs).toEqual([]);
    expect(state.deductions).toHaveLength(1);
  });
});
