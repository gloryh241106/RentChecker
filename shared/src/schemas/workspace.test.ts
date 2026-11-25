import { describe, expect, it } from 'vitest';
import { parsePositiveAmount } from '../money.js';
import { isQuoteInLease } from '../quotes.js';
import { workspaceSchema } from './workspace.js';
import type { Workspace } from './workspace.js';

const LEASE = 'The tenant shall pay for repainting the walls on leaving.';

const PAINTING = { id: 'd1', kind: 'cost' as const, label: 'Repainting', amountPaise: 1_200_000 };
const REPAIR = { id: 'r1', date: '2026-03-10', description: 'Damp wall', reportedTo: 'Landlord' };
const EVIDENCE = {
  deductionId: 'd1',
  state: 'verified' as const,
  quote: 'repainting the walls',
  source: 'ai' as const,
};
const REVIEW = { topicId: 'painting', state: 'verified', quote: 'the walls', source: 'ai' };

const WORKSPACE: Workspace = {
  schemaVersion: 1,
  tenancy: { partialMonth: 'unsure', handoverDayCounts: true },
  leaseText: LEASE,
  deductions: [PAINTING],
  evidence: [EVIDENCE],
  repairs: [{ ...REPAIR, deductionId: 'd1' }],
  bill: { fixedChargePaise: 0 },
  reviewLeaseText: LEASE,
  leaseReview: [{ topicId: 'painting', state: 'none', quote: null, source: 'ai' }],
  draftMessage: 'Hello',
  isSample: false,
};

function issuesOf(change: object): { path: string; message: string }[] {
  const issues = workspaceSchema.safeParse({ ...WORKSPACE, ...change }).error?.issues ?? [];
  return issues.map(({ path, message }) => ({ path: path.join('.'), message }));
}

describe('workspace schema', () => {
  it('D-1 a stored amount is an integer in the JSON (T-014)', () => {
    const typed = parsePositiveAmount('₹15,000.50');
    const depositPaise = typed.ok ? typed.value : undefined;
    const tenancy = { ...WORKSPACE.tenancy, depositPaise };
    const stored = JSON.stringify(workspaceSchema.parse({ ...WORKSPACE, tenancy }));
    expect(stored).toContain('"depositPaise":1500050');
    expect(stored).not.toMatch(/[0-9]\.[0-9]/);
    expect(workspaceSchema.parse(JSON.parse(stored)).tenancy.depositPaise).toBe(1_500_050);
  });

  it('D-1 a fractional amount is rejected (T-014)', () => {
    const tenancy = { ...WORKSPACE.tenancy, depositPaise: 15_000.5 };
    expect(issuesOf({ tenancy })).toMatchObject([{ path: 'tenancy.depositPaise' }]);
  });

  it('DATA_MODEL a full workspace survives a round trip unchanged', () => {
    expect(workspaceSchema.parse(JSON.parse(JSON.stringify(WORKSPACE)))).toEqual(WORKSPACE);
  });

  it('DATA_MODEL an empty workspace gets the A-3 and A-4 defaults', () => {
    const lists = { deductions: [], evidence: [], repairs: [], leaseReview: [] };
    const empty = { ...lists, leaseText: '', reviewLeaseText: '', isSample: false };
    const parsed = workspaceSchema.parse({ ...empty, schemaVersion: 1, tenancy: {} });
    expect(parsed.tenancy).toEqual({ partialMonth: 'unsure', handoverDayCounts: true });
    expect(parsed.bill).toBeUndefined();
  });

  it.each([
    [
      'two deductions with one id',
      { deductions: [PAINTING, PAINTING] },
      { path: 'deductions.1.id', message: 'DUPLICATE_ID' },
    ],
    [
      'two repairs with one id',
      { repairs: [REPAIR, REPAIR] },
      { path: 'repairs.1.id', message: 'DUPLICATE_ID' },
    ],
    [
      'two evidence records for a deduction',
      { evidence: [EVIDENCE, EVIDENCE] },
      { path: 'evidence.1.deductionId', message: 'DUPLICATE_MATCH' },
    ],
    [
      'evidence for an unknown deduction',
      { evidence: [{ ...EVIDENCE, deductionId: 'd9' }] },
      { path: 'evidence.0.deductionId', message: 'UNKNOWN_DEDUCTION' },
    ],
    [
      'a repair linked to an unknown deduction',
      { repairs: [{ ...REPAIR, deductionId: 'd9' }] },
      { path: 'repairs.0.deductionId', message: 'UNKNOWN_DEDUCTION' },
    ],
    [
      'two outcomes for a topic',
      { leaseReview: [REVIEW, REVIEW] },
      { path: 'leaseReview.1.topicId', message: 'DUPLICATE_MATCH' },
    ],
  ])('DATA_MODEL rejects %s', (_name, change, issue) => {
    expect(issuesOf(change)).toEqual([issue]);
  });

  // F2-R4 ignores extra spaces, so a quote that passes it can be longer than the lease.
  it('DATA_MODEL a quote that passes F2-R4 always loads again', () => {
    const quote = LEASE.replaceAll(' ', '   ');
    expect(isQuoteInLease(quote, LEASE)).toBe(true);
    expect(issuesOf({ evidence: [{ ...EVIDENCE, quote }] })).toEqual([]);
  });

  it('DATA_MODEL rejects a blank quote', () => {
    expect(issuesOf({ evidence: [{ ...EVIDENCE, quote: '   ' }] })).toHaveLength(1);
  });

  it.each([
    ['another schema version', { schemaVersion: 2 }],
    ['an unknown field', { total: 1 }],
    ['an unknown field in the tenancy', { tenancy: { ...WORKSPACE.tenancy, city: 'Pune' } }],
    ['a lease of 40,001 characters', { leaseText: 'x'.repeat(40_001) }],
    ['no quote for verified', { evidence: [{ ...EVIDENCE, quote: null }] }],
    ['an empty quote', { evidence: [{ ...EVIDENCE, quote: '' }] }],
    ['a quote for none', { evidence: [{ ...EVIDENCE, state: 'none' }] }],
    ['a quote for unconfirmed', { evidence: [{ ...EVIDENCE, state: 'unconfirmed' }] }],
    ['an unknown source', { evidence: [{ ...EVIDENCE, source: 'landlord' }] }],
    ['a repair on a day that does not exist', { repairs: [{ ...REPAIR, date: '2026-02-30' }] }],
    ['a repair without a description', { repairs: [{ ...REPAIR, description: ' ' }] }],
    ['a bill total of 0', { bill: { billedTotalPaise: 0 } }],
  ])('DATA_MODEL rejects %s', (_name, change) => {
    expect(issuesOf(change)).toHaveLength(1);
  });

  it.each([
    ['deductions', 20, (id: string) => ({ ...PAINTING, id })],
    ['repairs', 50, (id: string) => ({ ...REPAIR, id })],
  ])('FR-2, F5-R5 %s hold at most %i entries', (list, max, build) => {
    const entries = (count: number) => Array.from({ length: count }, (_, n) => build(`d${n + 1}`));
    expect(issuesOf({ [list]: entries(max) })).toEqual([]);
    expect(issuesOf({ [list]: entries(max + 1) })).toMatchObject([{ path: list }]);
  });
});
