import type { Repair } from '../schemas/repair.js';

/** F5-AC7. Oldest first. Entries with the same date keep the order they were added in. */
export function sortRepairs(repairs: readonly Repair[]): Repair[] {
  // D-5: a date is `YYYY-MM-DD`, so text order is date order.
  return [...repairs].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
