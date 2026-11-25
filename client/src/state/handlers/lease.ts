import type { HandlersFor } from '../actions.js';

export const leaseHandlers: HandlersFor<'lease/set'> = {
  // F1-R15: only a changed text resets the evidence, overrides included (F2-R14).
  'lease/set': (state, { text }) =>
    text === state.leaseText ? state : { ...state, leaseText: text, evidence: [] },
};
