import { describe, expect, it } from 'vitest';
import type { Repair } from '../schemas/repair.js';
import { sortRepairs } from './repair-log.js';

function entry(id: string, date: string): Repair {
  return { id, date, description: 'Damp wall', reportedTo: 'Landlord' };
}

describe('sortRepairs', () => {
  it('F5-AC7 T-172 lists three entries oldest first', () => {
    const log = [entry('a', '2026-05-01'), entry('b', '2026-03-10'), entry('c', '2026-04-02')];
    expect(sortRepairs(log).map(({ date }) => date)).toEqual([
      '2026-03-10',
      '2026-04-02',
      '2026-05-01',
    ]);
  });

  it('F5-AC7 entries with the same date keep the order they were added in', () => {
    const log = [entry('a', '2026-03-10'), entry('b', '2026-03-10'), entry('c', '2026-01-01')];
    expect(sortRepairs(log).map(({ id }) => id)).toEqual(['c', 'a', 'b']);
  });

  it('F5-AC7 the log itself is not reordered', () => {
    const log = [entry('a', '2026-05-01'), entry('b', '2026-03-10')];
    sortRepairs(log);
    expect(log.map(({ id }) => id)).toEqual(['a', 'b']);
  });
});
