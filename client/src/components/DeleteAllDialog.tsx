import { useNavigate } from 'react-router';
import { useAnnounce } from '../app/announce-context.js';
import { useWorkspace } from '../state/workspace-context.js';
import { ConfirmDialog } from './ui/ConfirmDialog.js';

interface DeleteAllDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

/** F1-R19, UC-6. Storage is cleared first, so a refusal can be reported with the dialog still open. */
export function DeleteAllDialog({ isOpen, onClose }: DeleteAllDialogProps) {
  const { dispatch, clearStorage } = useWorkspace();
  const navigate = useNavigate();
  const announce = useAnnounce();
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Delete everything"
      confirmLabel="Delete everything"
      confirmVariant="danger"
      onClose={onClose}
      onConfirm={() =>
        clearStorage()
          ? null
          : 'Your browser did not let RentChecker delete the data. Clear the site data for this page in your browser settings.'
      }
      onConfirmed={() => {
        dispatch({ type: 'workspace/reset' });
        void navigate('/');
        announce('Everything was deleted.');
      }}
    >
      <p>Delete all data stored by RentChecker in this browser? This cannot be undone.</p>
    </ConfirmDialog>
  );
}
