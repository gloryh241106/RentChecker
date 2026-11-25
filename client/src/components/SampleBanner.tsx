import { useWorkspace } from '../state/workspace-context.js';
import { Notice } from './ui/Notice.js';

/** FR-7: shown on every step while the sample case is in use. */
export function SampleBanner() {
  const { workspace } = useWorkspace();
  return workspace.isSample ? (
    <Notice tone="info">Sample data. This is an example case, not your tenancy.</Notice>
  ) : null;
}
