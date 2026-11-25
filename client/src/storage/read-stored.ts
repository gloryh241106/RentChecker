import { workspaceSchema } from '../shared.js';
import type { LoadOutcome } from './workspace-storage.js';

function isFromOtherVersion(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'schemaVersion' in value &&
    value.schemaVersion !== 1
  );
}

/** Turns stored text into the outcomes that need a value to be present. */
export function readStoredWorkspace(raw: string): LoadOutcome {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { status: 'corrupt' }; // Not JSON.
  }
  if (isFromOtherVersion(value)) {
    return { status: 'version_mismatch' }; // No migration exists.
  }
  const parsed = workspaceSchema.safeParse(value);
  return parsed.success ? { status: 'ok', workspace: parsed.data } : { status: 'corrupt' };
}
