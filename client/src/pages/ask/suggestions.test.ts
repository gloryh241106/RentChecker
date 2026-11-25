import { describe, expect, it } from 'vitest';
import type { Deduction } from '../../shared.js';
import { REPAIR } from '../../test-support/builders.js';
import { suggestQuestions } from './suggestions.js';

function cost(label: string): Deduction {
  return { id: label.slice(0, 20), kind: 'cost', label, amountPaise: 100 };
}

const RENT: Deduction = {
  id: 'rent',
  kind: 'rent',
  label: 'June rent',
  amountPaise: 100,
  rentMonth: '2026-06',
  alreadyPaidPaise: 0,
};

describe('suggested questions (F7-R5, T-226)', () => {
  it('are the fixed ones when nothing was entered', () => {
    expect(suggestQuestions({ deductions: [], repairs: [] }, [])).toEqual([
      'When is the deposit refunded?',
      'How much notice must I give?',
      'Can the rent increase?',
      'Who pays for repairs?',
      'Is there a lock-in period?',
    ]);
  });

  it('start with at most three deductions, without rent, then the latest repair', () => {
    const later = { ...REPAIR, id: 'r2', date: '2026-04-01', description: 'Broken fan' };
    const deductions = [RENT, cost('Painting'), cost('Cleaning'), cost('Lock'), cost('Bulb')];
    expect(suggestQuestions({ deductions, repairs: [later, REPAIR] }, [])).toEqual([
      'Can the landlord charge me for Painting?',
      'Can the landlord charge me for Cleaning?',
      'Can the landlord charge me for Lock?',
      'Who pays for this repair: Broken fan?',
      'When is the deposit refunded?',
    ]);
  });

  it('leave out answered questions and questions over 120 characters', () => {
    const questions = suggestQuestions({ deductions: [cost('x'.repeat(100))], repairs: [] }, [
      'When is the deposit refunded?',
    ]);
    expect(questions[0]).toBe('How much notice must I give?');
    expect(questions).toHaveLength(4);
  });
});
