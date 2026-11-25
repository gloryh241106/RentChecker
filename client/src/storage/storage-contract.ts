import { describe, expect, it } from 'vitest';
import { filledWorkspace } from '../test-support/builders.js';
import type { WorkspaceStorage } from './workspace-storage.js';

/** What the contract needs besides the interface itself. */
export interface StorageHarness {
  readonly storage: WorkspaceStorage;
  seedRaw(raw: string): void;
  readRaw(): string | null;
  readCorrupt(): string | null;
  breakStorage(): void;
}

function describeReading(create: () => StorageHarness): void {
  it('FRONTEND empty when nothing is stored', () => {
    expect(create().storage.load()).toEqual({ status: 'empty' });
  });

  it('FRONTEND ok after a save, with the same workspace (T-014)', () => {
    const { storage } = create();
    storage.save(filledWorkspace());
    expect(storage.load()).toEqual({ status: 'ok', workspace: filledWorkspace() });
  });

  it('D-1 the stored JSON holds integer paise only (T-014)', () => {
    const harness = create();
    harness.storage.save(filledWorkspace());
    expect(harness.readRaw()).toContain('"amountPaise":1200000');
    expect(harness.readRaw()).not.toMatch(/Paise":\d+\.\d/);
  });

  it('FRONTEND corrupt for text that is not JSON, and the raw text is kept (T-174)', () => {
    const harness = create();
    harness.seedRaw('{not json');
    expect(harness.storage.load()).toEqual({ status: 'corrupt' });
    expect(harness.readCorrupt()).toBe('{not json');
  });

  it('FRONTEND corrupt for JSON of the wrong shape (T-174)', () => {
    const harness = create();
    harness.seedRaw(JSON.stringify({ schemaVersion: 1, tenancy: 5 }));
    expect(harness.storage.load()).toEqual({ status: 'corrupt' });
  });

  it('FRONTEND version_mismatch when schemaVersion is not 1, raw text kept', () => {
    const harness = create();
    harness.seedRaw(JSON.stringify({ schemaVersion: 2 }));
    expect(harness.storage.load()).toEqual({ status: 'version_mismatch' });
    expect(harness.readCorrupt()).toBe('{"schemaVersion":2}');
  });
}

function describeWriting(create: () => StorageHarness): void {
  it('F1-R19 clear removes the workspace and the kept corrupt copy', () => {
    const harness = create();
    harness.seedRaw('broken');
    harness.storage.load();
    harness.storage.save(filledWorkspace());
    expect(harness.storage.clear()).toBe('done');
    expect(harness.readRaw()).toBeNull();
    expect(harness.readCorrupt()).toBeNull();
    expect(harness.storage.load()).toEqual({ status: 'empty' });
  });

  it('F1-R18 unavailable on load, failed on save and clear when storage throws (T-174)', () => {
    const harness = create();
    harness.breakStorage();
    expect(harness.storage.load()).toEqual({ status: 'unavailable' });
    expect(harness.storage.save(filledWorkspace())).toBe('failed');
    expect(harness.storage.clear()).toBe('failed');
  });
}

/** Every WorkspaceStorage must pass these (Liskov). */
export function describeWorkspaceStorageContract(name: string, create: () => StorageHarness): void {
  describe(`${name} as a WorkspaceStorage`, () => {
    describeReading(create);
    describeWriting(create);
  });
}
