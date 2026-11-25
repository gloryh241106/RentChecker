import { describe, expect, it } from 'vitest';
import { MAX_DEDUCTIONS } from '../shared.js';
import type { Deduction } from '../shared.js';
import { EMPTY_WORKSPACE } from './empty-workspace.js';
import { FEE, PAINTING, REPAIR, add, filledWorkspace, run } from '../test-support/builders.js';
import type { WorkspaceAction } from './actions.js';

const NONE_FOR = (deductionId: string): WorkspaceAction => ({
  type: 'evidence/override',
  deductionId,
  override: { state: 'none' },
});

function update(deduction: Deduction, repairIds: readonly string[] = []): WorkspaceAction {
  return { type: 'deduction/update', deduction, repairIds };
}

describe('deduction actions', () => {
  it('F1-R4 a 21st deduction is not added', () => {
    const many = Array.from({ length: MAX_DEDUCTIONS + 1 }, (_, index) =>
      add({ ...PAINTING, id: `id-${index}` }),
    );
    expect(run(many).deductions).toHaveLength(MAX_DEDUCTIONS);
  });

  it('F1-R15 a label change resets only that deduction evidence (T-166)', () => {
    const before = run([NONE_FOR('d1'), NONE_FOR('d2')], filledWorkspace());
    const state = run([update({ ...PAINTING, label: 'Wall painting' })], before);
    expect(state.evidence.map((record) => record.deductionId)).toEqual(['d2']);
  });

  it('F1-R15 an unchanged label keeps the evidence', () => {
    const before = run([NONE_FOR('d1')], filledWorkspace());
    const state = run([update({ ...PAINTING, amountPaise: 1_300_000 })], before);
    expect(state.evidence).toHaveLength(1);
  });

  it('F1-R5 a kind change replaces the old facts and the evidence', () => {
    const before = run([NONE_FOR('d2')], filledWorkspace());
    const asCost: Deduction = {
      id: FEE.id,
      kind: 'cost',
      label: FEE.label,
      amountPaise: FEE.amountPaise,
      receiptAmountPaise: 5000,
    };
    const state = run([update(asCost)], before);
    expect(state.evidence).toEqual([]);
  });

  it('F1-R16 an entry is linked to one deduction at most, and moves when linked again', () => {
    const state = run([add(PAINTING, ['r1']), add(FEE, ['r1'])], {
      ...EMPTY_WORKSPACE,
      repairs: [REPAIR],
    });
    expect(state.repairs[0]?.deductionId).toBe('d2');
  });

  it('F1-R16 removing a deduction removes its evidence and links, and keeps the entry', () => {
    const before = run([add(PAINTING, ['r1']), NONE_FOR('d1')], {
      ...EMPTY_WORKSPACE,
      repairs: [REPAIR],
    });
    const state = run([{ type: 'deduction/remove', id: 'd1' }], before);
    expect(state.deductions).toEqual([]);
    expect(state.evidence).toEqual([]);
    expect(state.repairs).toEqual([REPAIR]);
  });
});
