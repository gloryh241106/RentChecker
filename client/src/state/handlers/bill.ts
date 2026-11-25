import type { BillCheck } from '../../shared.js';
import type { HandlersFor } from '../actions.js';

/** A form with nothing in it is not data, so it is not kept (hasData, F1-R19). */
function isBlank(bill: BillCheck): boolean {
  return (
    bill.previousReading === undefined &&
    bill.currentReading === undefined &&
    bill.ratePaisePerUnit === undefined &&
    bill.fixedChargePaise === 0 &&
    bill.billedTotalPaise === undefined
  );
}

export const billHandlers: HandlersFor<'bill/set'> = {
  'bill/set': (state, { bill }) => {
    if (isBlank(bill)) {
      return state.bill === undefined ? state : { ...state, bill: undefined };
    }
    return { ...state, bill };
  },
};
