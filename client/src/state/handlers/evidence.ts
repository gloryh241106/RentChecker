import { isQuoteInLease } from '../../shared.js';
import type { ClauseEvidence, ClauseMatch, Workspace } from '../../shared.js';
import type { EvidenceOverride, HandlersFor } from '../actions.js';

function toEvidence({ itemId, ...match }: ClauseMatch): ClauseEvidence {
  return { deductionId: itemId, ...match };
}

function withRecord(evidence: readonly ClauseEvidence[], record: ClauseEvidence): ClauseEvidence[] {
  return [...evidence.filter(({ deductionId }) => deductionId !== record.deductionId), record];
}

/** F2-R6, F2-R14, D-31. A match for an unknown or rent item, or over an override, is ignored. */
function applyMatches(
  state: Workspace,
  { matches }: { readonly matches: readonly ClauseMatch[] },
): Workspace {
  const evidence = matches.reduce((records, match) => {
    const deduction = state.deductions.find(({ id }) => id === match.itemId);
    const isOverridden = records.some(
      ({ deductionId, source }) => deductionId === match.itemId && source === 'user',
    );
    return deduction === undefined || deduction.kind === 'rent' || isOverridden
      ? records
      : withRecord(records, toEvidence(match));
  }, state.evidence);
  return { ...state, evidence: [...evidence] };
}

function overrideRecord(
  deductionId: string,
  override: EvidenceOverride,
  leaseText: string,
): ClauseEvidence | null {
  if (override.state === 'none') {
    return { deductionId, state: 'none', quote: null, source: 'user' };
  }
  if (override.state === 'verified' && isQuoteInLease(override.quote, leaseText)) {
    return { deductionId, state: 'verified', quote: override.quote.trim(), source: 'user' };
  }
  return null;
}

function overrideEvidence(
  state: Workspace,
  { deductionId, override }: { readonly deductionId: string; readonly override: EvidenceOverride },
): Workspace {
  if (!state.deductions.some(({ id }) => id === deductionId)) {
    return state;
  }
  if (override.state === 'unconfirmed') {
    return {
      ...state,
      evidence: state.evidence.filter((record) => record.deductionId !== deductionId),
    };
  }
  const record = overrideRecord(deductionId, override, state.leaseText); // F2-R12
  return record === null ? state : { ...state, evidence: withRecord(state.evidence, record) };
}

export const evidenceHandlers: HandlersFor<'evidence/apply' | 'evidence/override'> = {
  'evidence/apply': applyMatches,
  'evidence/override': overrideEvidence,
};
