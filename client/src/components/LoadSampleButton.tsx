import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAnnounce } from '../app/announce-context.js';
import { stepPath } from '../pages/move-out/steps.js';
import { hasData } from '../state/has-data.js';
import { useWorkspace } from '../state/workspace-context.js';
import { Button } from './ui/Button.js';
import { ConfirmDialog } from './ui/ConfirmDialog.js';

/** F1-R17. With data in the browser the tenant confirms first, because it would be replaced. */
export function LoadSampleButton() {
  const { workspace, dispatch } = useWorkspace();
  const navigate = useNavigate();
  const announce = useAnnounce();
  const [isAsking, setIsAsking] = useState(false);

  function load(): void {
    dispatch({ type: 'sample/load' });
    void navigate(stepPath('results'));
    announce('Sample case loaded.');
  }

  return (
    <>
      <Button
        variant="secondary"
        isFullWidth
        onClick={() => (hasData(workspace) ? setIsAsking(true) : load())}
      >
        Load sample case
      </Button>
      <ConfirmDialog
        isOpen={isAsking}
        title="Load the sample case"
        confirmLabel="Load sample case"
        onClose={() => setIsAsking(false)}
        onConfirm={() => null}
        onConfirmed={load}
      >
        <p>Loading the sample case replaces the data in this browser. Continue?</p>
      </ConfirmDialog>
    </>
  );
}
