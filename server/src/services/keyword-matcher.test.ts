import { describe, expect, it } from 'vitest';
import { matchByKeyword } from './keyword-matcher.js';
import { NEGATION_WORDS, STOP_WORDS, TOPIC_GROUPS } from './keyword-tables.js';

function find(leaseText: string, label: string): string | null {
  const [match] = matchByKeyword({ leaseText, items: [{ id: 'd1', label }] });
  return match?.quote ?? null;
}

describe('F2-R8 sentences', () => {
  it.each(['. ', '! ', '? ', '; ', '.\t', '\n', '\r\n', '\r', '\n\n'])(
    'F2-R8 splits at %j (T-132)',
    (separator) => {
      const lease = `Nothing to see in this part${separator}Painting is paid by tenant`;
      expect(find(lease, 'Painting')).toBe('Painting is paid by tenant');
    },
  );

  it.each([0x2028, 0x2029])('F2-R8 splits at the line break with code %d (T-132)', (code) => {
    const lease = `Nothing to see in this${String.fromCharCode(code)}Painting is paid by tenant`;
    expect(find(lease, 'Painting')).toBe('Painting is paid by tenant');
  });

  it('F2-R8 does not split inside a number, at a comma or at the end (T-132)', () => {
    const lease = 'Painting costs Rs.5000.50, paid by the tenant on exit.';
    expect(find(lease, 'Painting')).toBe(lease);
  });

  it('F2-R8 a sentence of 14 or 601 characters is no candidate (T-132)', () => {
    const long = (length: number) => `${'painting '.padEnd(length - 1, 'x')}.`;
    expect(find('Painting is ok', 'Painting')).toBeNull();
    expect(find('Painting is ok!', 'Painting')).toBe('Painting is ok!');
    expect(find(long(600), 'Painting')).toBe(long(600));
    expect(find(long(601), 'Painting')).toBeNull();
  });
});

describe('F2-R8 words and score', () => {
  it('F2-R8 ignores case and needs whole words (T-132)', () => {
    expect(find('THE TENANT PAYS FOR PARKING HERE.', 'parking')).not.toBeNull();
    expect(find('The tenant pays for carparking here.', 'parking')).toBeNull();
  });

  it('F2-R8 counts distinct words, not repeats (T-132)', () => {
    const lease = 'Gate gate gate gate gate key here.\nGate card and lost key and fob.';
    expect(find(lease, 'Gate card key')).toBe('Gate card and lost key and fob.');
  });

  it('F2-R8 the highest score wins wherever it stands (T-132)', () => {
    const best = 'A lost gate card is paid by the tenant.';
    const other = 'The gate is locked at night by a guard.';
    expect(find(`${best}\n${other}`, 'gate card')).toBe(best);
    expect(find(`${other}\n${best}`, 'gate card')).toBe(best);
    expect(find(`${other}\n${other}\n${best}`, 'gate card')).toBe(best);
  });

  it('F2-R8 a word brings in its own groups, and a group brings in no other (T-132)', () => {
    // The electricity and water groups share only "meter".
    expect(find('The supply of gas is by the landlord.', 'Electricity')).toBeNull();
    expect(find('The power used is paid by the tenant.', 'Meter')).not.toBeNull();
    expect(find('The supply used is paid by the tenant.', 'Meter')).not.toBeNull();
  });

  it('F2-R10 a label of stop words only is unconfirmed (T-133)', () => {
    expect(find('All the charges for any of this shall be paid.', 'All the charges')).toBeNull();
  });

  it('F2-R10 a stop word adds no score (T-133)', () => {
    const lease = 'The gate is for all of this and that.\nThe gate key costs money here.';
    expect(find(lease, 'all of this gate key')).toBe('The gate key costs money here.');
  });
});

describe('F2-R9 outcome', () => {
  it.each(NEGATION_WORDS)('F2-R9 "%s" in the best sentence is unconfirmed (T-133)', (word) => {
    expect(find(`The tenant pays ${word} painting on exit.`, 'Repainting')).toBeNull();
    expect(find(`The tenant pays ${word.toUpperCase()} painting.`, 'Repainting')).toBeNull();
  });

  it('F2-R9 a negation in another sentence or inside a word does not count (T-132)', () => {
    const best = 'The tenant pays for painting on notice.';
    expect(find(`Pets are not allowed here.\n${best}`, 'Painting')).toBe(best);
  });

  it('F2-R9 a negated best sentence is not replaced by a lower one (T-133, F2-AC9)', () => {
    const lease = 'The gate card is not charged here.\nThe gate is open in the day.';
    expect(find(lease, 'gate card')).toBeNull();
  });

  it.each([
    'The tenant cannot be charged for painting.',
    "The tenant won't be charged for painting.",
    'The tenant shan’t be charged for painting.',
  ])('F2-R9 "%s" is unconfirmed (T-133)', (sentence) => {
    expect(find(sentence, 'Painting')).toBeNull();
  });

  it.each([2, 3])('F2-R9 a tie of %d sentences is unconfirmed (T-133, F2-AC10)', (count) => {
    const lease = Array.from({ length: count }, (_, n) => `Painting rule ${String(n)} is here.`);
    expect(find(lease.join('\n'), 'Painting')).toBeNull();
  });
});

describe('F2-R10, F2-R11 tables', () => {
  it('F2-R10 the stop words are those of the spec (T-133)', () => {
    const spec =
      'a, an, the, of, to, for, and, or, in, on, at, by, is, are, be, shall, will, may, any, all, from, as, this, that, with, charges, charge';
    expect([...STOP_WORDS]).toEqual(spec.split(', '));
  });

  it('F2-R9 the negation words are those of the spec (T-133)', () => {
    expect(NEGATION_WORDS).toEqual('not, cannot, no, never, without, except, unless'.split(', '));
  });

  it('F2-R11 the topic groups are those of the spec (T-132)', () => {
    const spec =
      'painting (paint, painting, repaint, repainting, whitewash, distemper); cleaning (clean, cleaning, cleaned, sweep, housekeeping); repair (repair, repairs, repairing, fix, fixing, damage, damages, replace, replacement); rent (rent, rental, monthly, month, day, days, daily); electricity (electricity, electric, power, unit, units, meter); water (water, meter, supply); maintenance (maintenance, society, service, upkeep); notice (notice, vacate, vacating, terminate, termination); deposit (deposit, security, refund, refundable, advance)';
    const written = Object.entries(TOPIC_GROUPS).map(
      ([name, group]) => `${name} (${group.join(', ')})`,
    );
    expect(written.join('; ')).toBe(spec);
  });

  it.each(Object.entries(TOPIC_GROUPS))(
    'F2-R11 any word of the %s group in a label finds the others (T-132)',
    (_name, group) => {
      for (const word of group) {
        for (const other of group) {
          const sentence = `Zzz qqq ${other} xxx vvv www.`;
          expect(find(sentence, word)).toBe(sentence);
        }
      }
    },
  );
});
