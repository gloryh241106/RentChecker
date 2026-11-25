import { afterEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_WORKSPACE } from '../state/empty-workspace.js';
import { InMemoryWorkspaceStorage } from '../test-support/in-memory-storage.js';
import { createLocalWorkspaceStorage } from './local-storage.js';
import { describeWorkspaceStorageContract } from './storage-contract.js';
import type { StorageHarness } from './storage-contract.js';
import { CORRUPT_KEY, STORAGE_KEY } from './workspace-storage.js';

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

function throwBlocked(): never {
  throw new DOMException('blocked', 'SecurityError');
}

function localHarness(): StorageHarness {
  window.localStorage.clear();
  return {
    storage: createLocalWorkspaceStorage(window.localStorage),
    seedRaw: (raw) => window.localStorage.setItem(STORAGE_KEY, raw),
    readRaw: () => window.localStorage.getItem(STORAGE_KEY),
    readCorrupt: () => window.localStorage.getItem(CORRUPT_KEY),
    breakStorage: () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(throwBlocked);
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(throwBlocked);
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(throwBlocked);
    },
  };
}

function fakeHarness(): StorageHarness {
  const fake = new InMemoryWorkspaceStorage();
  return {
    storage: fake,
    seedRaw: (raw) => {
      fake.raw = raw;
    },
    readRaw: () => fake.raw,
    readCorrupt: () => fake.corruptRaw,
    breakStorage: () => {
      fake.isBroken = true;
    },
  };
}

describeWorkspaceStorageContract('local storage', localHarness);
describeWorkspaceStorageContract('in-memory fake', fakeHarness);

describe('local storage extras', () => {
  it('F1-R18 a full quota on save reports failed and does not throw (T-174)', () => {
    const storage = createLocalWorkspaceStorage(window.localStorage);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(storage.save(EMPTY_WORKSPACE)).toBe('failed');
  });
});
