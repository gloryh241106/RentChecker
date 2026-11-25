import type { HandlersFor } from '../actions.js';

export const draftHandlers: HandlersFor<'draft/set'> = {
  'draft/set': (state, { text }) => ({ ...state, draftMessage: text }),
};
