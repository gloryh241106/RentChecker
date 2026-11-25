import type { StorageNotice } from '../hooks/use-persistence.js';
import { useWorkspace } from '../state/workspace-context.js';
import { Notice } from './ui/Notice.js';

/** UI.md "Storage unavailable" and "Stored data unreadable". The second is written for a version. */
const NOTICE_TEXT: Readonly<Record<StorageNotice, string>> = {
  unavailable:
    'Your browser is blocking storage. Nothing will be saved, but the app still works until you close this page.',
  corrupt: 'Your saved data could not be read, so you are starting empty.',
  version_mismatch:
    'Your saved data comes from a different version of RentChecker and cannot be opened, so you are starting empty.',
};

export function StorageBanner() {
  const { notice } = useWorkspace();
  return notice === null ? null : <Notice tone="warning">{NOTICE_TEXT[notice]}</Notice>;
}
