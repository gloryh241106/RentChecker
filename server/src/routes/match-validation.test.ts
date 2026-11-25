import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { errorResponseSchema } from '../../../shared/src/index.js';
import {
  LEASE,
  MARKER,
  body,
  item,
  makeMatchApp,
  postMatch,
} from '../../test-support/match-harness.js';

const post = (payload: object) => postMatch(makeMatchApp().app, payload);
const leaseOf = (length: number) => MARKER.padEnd(length, 'x');
const itemsOf = (count: number) =>
  Array.from({ length: count }, (_, index) => item(`d${String(index)}`));

async function expectInvalid(payload: object, fields: string[], message?: string) {
  const res = await post(payload);
  expect(res.status).toBe(400);
  const { error } = errorResponseSchema.parse(res.body);
  expect(error.code).toBe('VALIDATION_ERROR');
  expect(error.fields).toEqual(fields);
  if (message) expect(error.message).toBe(message);
  expect(JSON.stringify(res.body)).not.toContain(MARKER);
}

describe('VALIDATION_ERROR body', () => {
  it('VALIDATION_ERROR a body that is not JSON has no fields (T-135)', async () => {
    const res = await request(makeMatchApp().app)
      .post('/api/clauses/match')
      .set('Content-Type', 'application/json')
      .send('{not json');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The request is malformed or is not valid JSON',
      },
    });
  });

  it('VALIDATION_ERROR a body that is missing or a list (T-141)', async () => {
    const message = 'The request body is missing or has the wrong type';
    await expectInvalid([], [], message);
    const res = await request(makeMatchApp().app).post('/api/clauses/match');
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe(message);
  });

  it('VALIDATION_ERROR an unknown field is named by its place, never echoed (T-141)', async () => {
    const extra = { [MARKER]: 1 };
    const top = { ...body(), ...extra };
    await expectInvalid(top, [], 'The request body has an unknown field');
    const inItem = { ...body(), items: [item('d1'), { ...item('d2'), ...extra }] };
    await expectInvalid(inItem, ['items.1'], 'items.1 has an unknown field');
  });

  it('VALIDATION_ERROR a missing or numeric leaseText, and other wrong types (T-141)', async () => {
    const message = 'leaseText is missing or has the wrong type';
    await expectInvalid({ items: [item('d1')] }, ['leaseText'], message);
    await expectInvalid({ ...body(), leaseText: 5 }, ['leaseText'], message);
    await expectInvalid({ leaseText: LEASE }, ['items']);
    await expectInvalid({}, ['leaseText', 'items']);
    await expectInvalid({ ...body(), items: [{ id: 'd1', label: MARKER, kind: 1 }, 5] }, [
      ...['items.0', 'items.1'],
    ]);
  });
});

describe('VALIDATION_ERROR lease text', () => {
  it('VALIDATION_ERROR 49 characters, also when padded, and 50 (T-136, F2-AC14)', async () => {
    const message = 'leaseText must have at least 50 characters';
    const payload = (leaseText: string) => ({ ...body(), leaseText });
    await expectInvalid(payload(leaseOf(49)), ['leaseText'], message);
    await expectInvalid(payload(`${leaseOf(49)}${' '.repeat(10)}`), ['leaseText'], message);
    expect((await post(payload(leaseOf(50)))).status).toBe(200);
  });

  it('VALIDATION_ERROR 40,000 characters pass and 40,001 fail (T-137)', async () => {
    expect((await post({ ...body(), leaseText: leaseOf(40_000) })).status).toBe(200);
    const message = 'leaseText must have at most 40000 characters';
    await expectInvalid({ ...body(), leaseText: leaseOf(40_001) }, ['leaseText'], message);
  });
});

describe('VALIDATION_ERROR items', () => {
  it('VALIDATION_ERROR 0 and 21 items fail, 20 pass (T-138)', async () => {
    const payload = (count: number) => ({ leaseText: LEASE, items: itemsOf(count) });
    await expectInvalid(payload(0), ['items'], 'items must have at least 1 entries');
    expect((await post(payload(20))).status).toBe(200);
    await expectInvalid(payload(21), ['items'], 'items must have at most 20 entries');
  });

  it.each(['', 'a'.repeat(41), 'a b', 'a.b'])(
    'VALIDATION_ERROR item ID %j is rejected (T-139)',
    async (id) => {
      await expectInvalid(body(item('d1'), item(id)), ['items.1.id']);
    },
  );

  it('VALIDATION_ERROR an ID of 40 characters passes, a repeated ID fails (T-139)', async () => {
    const id = `${'aB3-_'.repeat(8)}`;
    expect(id).toHaveLength(40);
    expect((await post(body(item(id)))).status).toBe(200);
    await expectInvalid(body(item('d1'), item('d1')), ['items.1.id'], 'items.1.id is not valid');
  });

  it('VALIDATION_ERROR label empty, spaces, 121 characters, then 120 (T-140)', async () => {
    const long = MARKER.padEnd(121, 'x');
    const atLeast = 'items.0.label must have at least 1 characters';
    await expectInvalid(body(item('d1', '')), ['items.0.label'], atLeast);
    await expectInvalid(body(item('d1', '   ')), ['items.0.label'], atLeast);
    await expectInvalid(body(item('d1', long)), ['items.0.label']);
    expect((await post(body(item('d1', long.slice(0, 120))))).status).toBe(200);
  });
});
