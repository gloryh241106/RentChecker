import type { HandlersFor } from '../actions.js';

export const tenancyHandlers: HandlersFor<'tenancy/update'> = {
  'tenancy/update': (state, { tenancy }) => ({ ...state, tenancy }),
};
