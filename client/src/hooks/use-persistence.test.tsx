import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceProvider } from '../state/WorkspaceProvider.js';
import { useWorkspace } from '../state/workspace-context.js';
import { InMemoryWorkspaceStorage } from '../test-support/in-memory-storage.js';
import { PAINTING, add, filledWorkspace } from '../test-support/builders.js';
import { SAVE_DELAY_MS } from './use-persistence.js';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function setup(storage: InMemoryWorkspaceStorage) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <WorkspaceProvider storage={storage}>{children}</WorkspaceProvider>
  );
  return renderHook(() => useWorkspace(), { wrapper });
}

describe('persistence', () => {
  it('FRONTEND nothing is written until the user changes something', () => {
    const storage = new InMemoryWorkspaceStorage(filledWorkspace());
    setup(storage);
    act(() => void vi.advanceTimersByTime(SAVE_DELAY_MS * 2));
    expect(storage.saves).toBe(0);
  });

  it('FRONTEND a corrupt value is not overwritten by loading, and a notice is set (T-174)', () => {
    const storage = new InMemoryWorkspaceStorage();
    storage.raw = '{broken';
    const { result } = setup(storage);
    act(() => void vi.advanceTimersByTime(SAVE_DELAY_MS * 2));
    expect(storage.raw).toBe('{broken');
    expect(storage.corruptRaw).toBe('{broken');
    expect(result.current.notice).toBe('corrupt');
  });

  it('FRONTEND saves are debounced into one write after the last change', () => {
    const storage = new InMemoryWorkspaceStorage();
    const { result } = setup(storage);
    act(() => result.current.dispatch(add(PAINTING)));
    act(() => void vi.advanceTimersByTime(SAVE_DELAY_MS - 1));
    act(() => result.current.dispatch({ type: 'draft/set', text: 'Hi' }));
    act(() => void vi.advanceTimersByTime(SAVE_DELAY_MS - 1));
    expect(storage.saves).toBe(0);
    act(() => void vi.advanceTimersByTime(1));
    expect(storage.saves).toBe(1);
  });

  it('FRONTEND a pending save is flushed on pagehide', () => {
    const storage = new InMemoryWorkspaceStorage();
    const { result } = setup(storage);
    act(() => result.current.dispatch(add(PAINTING)));
    act(() => void window.dispatchEvent(new Event('pagehide')));
    expect(storage.saves).toBe(1);
  });

  it('F1-R18 a failing save shows the storage notice and the app keeps working (T-174)', () => {
    const storage = new InMemoryWorkspaceStorage();
    const { result } = setup(storage);
    storage.isBroken = true;
    act(() => result.current.dispatch(add(PAINTING)));
    act(() => void vi.advanceTimersByTime(SAVE_DELAY_MS));
    expect(result.current.notice).toBe('unavailable');
    expect(result.current.workspace.deductions).toHaveLength(1);
  });

  it('F1-R19 clearing storage cancels a pending save', () => {
    const storage = new InMemoryWorkspaceStorage();
    const { result } = setup(storage);
    act(() => result.current.dispatch(add(PAINTING)));
    act(() => void result.current.clearStorage());
    act(() => void vi.advanceTimersByTime(SAVE_DELAY_MS * 2));
    expect(storage.raw).toBeNull();
  });
});
