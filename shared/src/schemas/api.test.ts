// Route behaviour is tested in server/. These are the shapes of API.md.
import { describe, expect, it } from 'vitest';
import { ERROR_CODES, errorResponseSchema, healthResponseSchema } from './api.js';
import { MATCH_WARNINGS, matchRequestSchema, matchResponseSchema } from './match.js';

const REQUEST = { leaseText: 'x'.repeat(50), items: [{ id: 'd1', label: 'Repainting' }] };
const MATCH = { itemId: 'd1', state: 'verified', quote: 'pay for painting', source: 'ai' };
const RESPONSE = { mode: 'ai', warnings: [], matches: [MATCH] };
const KEYWORD_MATCH = { ...MATCH, source: 'keyword' };

const itemsOf = (count: number) =>
  Array.from({ length: count }, (_, n) => ({ id: `d${n}`, label: 'Fee' }));

describe('match request', () => {
  it.each([
    ['the smallest lease', {}],
    ['the largest lease', { leaseText: 'x'.repeat(40_000) }],
    ['20 items', { items: itemsOf(20) }],
    ['an id of 40 characters', { items: [{ id: 'a-_'.padEnd(40, 'x'), label: 'Fee' }] }],
    ['a label of 120 characters', { items: [{ id: 'd1', label: 'x'.repeat(120) }] }],
  ])('API match accepts %s', (_name, change) => {
    expect(matchRequestSchema.safeParse({ ...REQUEST, ...change }).success).toBe(true);
  });

  it.each([
    ['49 characters and 10 spaces', { leaseText: 'x'.repeat(49).padEnd(59) }, 'leaseText'],
    ['40,001 characters', { leaseText: 'x'.repeat(40_001) }, 'leaseText'],
    ['a lease that is a number', { leaseText: 1 }, 'leaseText'],
    ['no items', { items: [] }, 'items'],
    ['21 items', { items: itemsOf(21) }, 'items'],
    ['an id with a dot', { items: [{ id: 'a.b', label: 'Fee' }] }, 'items.0.id'],
    ['a label of spaces', { items: [{ id: 'd1', label: '  ' }] }, 'items.0.label'],
    ['a repeated id', { items: [...itemsOf(1), ...itemsOf(1)] }, 'items.1.id'],
    ['an unknown field', { extra: 1 }, ''],
    ['an unknown item field', { items: [{ id: 'd1', label: 'Fee', amount: 1 }] }, 'items.0'],
  ])('API match rejects %s', (_name, change, path) => {
    const { error } = matchRequestSchema.safeParse({ ...REQUEST, ...change });
    expect(error?.issues.map((issue) => issue.path.join('.'))).toEqual([path]);
  });
});

describe('match response', () => {
  it.each([
    ['a verified match', {}],
    ['every warning', { warnings: MATCH_WARNINGS }],
    ['none without a quote', { matches: [{ ...MATCH, state: 'none', quote: null }] }],
    ['a keyword match', { mode: 'keyword', matches: [KEYWORD_MATCH] }],
  ])('API match accepts %s', (_name, change) => {
    expect(matchResponseSchema.safeParse({ ...RESPONSE, ...change }).success).toBe(true);
  });

  it.each([
    ['a source other than the mode', { matches: [KEYWORD_MATCH] }, 'matches.0.source'],
    ['source user', { matches: [{ ...MATCH, source: 'user' }] }, 'matches.0.source'],
    ['a quote for none', { matches: [{ ...MATCH, state: 'none' }] }, 'matches.0.quote'],
    ['verified without a quote', { matches: [{ ...MATCH, quote: null }] }, 'matches.0.quote'],
    ['a repeated item', { matches: [MATCH, MATCH] }, 'matches.1.itemId'],
    ['an unknown warning', { warnings: ['OTHER'] }, 'warnings.0'],
    ['a result field', { result: 'supported' }, ''],
    [
      'excludes in keyword mode',
      { mode: 'keyword', matches: [{ ...KEYWORD_MATCH, state: 'excludes' }] },
      'matches.0.state',
    ],
  ])('API match rejects %s', (_name, change, path) => {
    const { error } = matchResponseSchema.safeParse({ ...RESPONSE, ...change });
    expect(error?.issues.map((issue) => issue.path.join('.'))).toEqual([path]);
  });
});

describe('health and errors', () => {
  it('API health accepts the documented body only', () => {
    const body = { status: 'ok', aiConfigured: true, cloudSaveConfigured: false };
    expect(healthResponseSchema.parse(body)).toEqual(body);
    expect(healthResponseSchema.safeParse({ ...body, key: 'x' }).success).toBe(false);
  });

  it.each(ERROR_CODES)('API errors accepts %s', (code) => {
    expect(errorResponseSchema.safeParse({ error: { code, message: 'Text' } }).success).toBe(true);
  });

  it('API errors accepts fields and a revision, and no unknown code', () => {
    const fields = { code: 'VALIDATION_ERROR', message: 'Text', fields: ['items.0.label'] };
    const conflict = { code: 'REVISION_CONFLICT', message: 'Text', currentRevision: 2 };
    expect(errorResponseSchema.parse({ error: fields }).error.fields).toEqual(['items.0.label']);
    expect(errorResponseSchema.parse({ error: conflict }).error.currentRevision).toBe(2);
    const unknown = { error: { code: 'TEAPOT', message: 'Text' } };
    expect(errorResponseSchema.safeParse(unknown).success).toBe(false);
  });
});
