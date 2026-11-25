import { describe, expect, it } from 'vitest';
import { parseConfig } from './config.js';

describe('API config', () => {
  it('API config works with everything missing (T-116)', () => {
    expect(parseConfig({})).toEqual({
      port: 3001,
      aiConfigured: false,
      cloudSaveConfigured: false,
    });
  });

  it('API config needs both key and model for AI (T-115)', () => {
    expect(parseConfig({ GEMINI_API_KEY: 'k' }).aiConfigured).toBe(false);
    expect(parseConfig({ GEMINI_MODEL: 'm' }).aiConfigured).toBe(false);
    expect(parseConfig({ GEMINI_API_KEY: 'k', GEMINI_MODEL: '' }).aiConfigured).toBe(false);
    expect(parseConfig({ GEMINI_API_KEY: ' ', GEMINI_MODEL: 'm' }).aiConfigured).toBe(false);
    expect(parseConfig({ GEMINI_API_KEY: 'k', GEMINI_MODEL: 'm' }).aiConfigured).toBe(true);
  });

  it('API config treats a non-empty DATABASE_URL as cloud save configured (T-115)', () => {
    expect(parseConfig({ DATABASE_URL: '' }).cloudSaveConfigured).toBe(false);
    expect(parseConfig({ DATABASE_URL: 'postgres://x' }).cloudSaveConfigured).toBe(true);
  });

  it('API config reads PORT, ignores an empty one and rejects a bad one (T-115)', () => {
    expect(parseConfig({ PORT: '8080' }).port).toBe(8080);
    expect(parseConfig({ PORT: '' }).port).toBe(3001);
    expect(() => parseConfig({ PORT: 'abc' })).toThrow();
    expect(() => parseConfig({ PORT: '70000' })).toThrow();
  });
});
