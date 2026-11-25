import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { contrastRatio, readColourTokens } from './contrast.js';

const TOKENS = readColourTokens(readFileSync('client/src/index.css', 'utf8'));
const SURFACES = ['surface', 'raised', 'sunken'];
const NOTICES = ['danger', 'warning', 'success', 'info'];

function ratio(foreground: string, background: string): number {
  const first = TOKENS[foreground];
  const second = TOKENS[background];
  if (first === undefined || second === undefined) {
    throw new Error(`Unknown token ${foreground} or ${background}`);
  }
  return contrastRatio(first, second);
}

describe('design tokens', () => {
  it.each(
    SURFACES.flatMap((surface) => ['ink', 'ink-muted', 'primary'].map((text) => [text, surface])),
  )('UI text %s on %s is at least 4.5:1 (NFR-5)', (text, surface) => {
    expect(ratio(text ?? '', surface ?? '')).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ['on-primary', 'primary'],
    ['on-primary', 'primary-hover'],
    ['on-primary', 'danger'],
    ['ink', 'danger-bg'],
    ['ink', 'warning-bg'],
    ['ink', 'success-bg'],
    ['ink', 'info-bg'],
    ...NOTICES.map((tone) => [tone, `${tone}-bg`]),
    ['on-band', 'band'],
    ['on-band-muted', 'band'],
    ['accent', 'band'],
    ['on-accent', 'accent'],
    ['on-accent', 'accent-hover'],
    ...NOTICES.map((tone) => ['on-primary', tone]),
    ['danger', 'raised'],
    ['danger', 'sunken'],
  ])('UI text %s on %s is at least 4.5:1 (NFR-5)', (text, background) => {
    expect(ratio(text ?? '', background ?? '')).toBeGreaterThanOrEqual(4.5);
  });

  it.each(SURFACES)('UI input edge on %s is at least 3:1 (NFR-5)', (surface) => {
    expect(ratio('line-input', surface)).toBeGreaterThanOrEqual(3);
  });

  it.each(SURFACES)('UI focus ring on %s is at least 3:1 (NFR-5)', (surface) => {
    expect(ratio('focus', surface)).toBeGreaterThanOrEqual(3);
  });

  it('UI focus ring in a band is at least 3:1 (NFR-5)', () => {
    expect(ratio('focus-on-band', 'band')).toBeGreaterThanOrEqual(3);
  });

  it.each(NOTICES)('UI %s icon and edge on its notice background are at least 3:1', (tone) => {
    expect(ratio(tone, `${tone}-bg`)).toBeGreaterThanOrEqual(3);
  });
});
