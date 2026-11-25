import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { formatDateText } from '../../shared.js';
import type { Repair } from '../../shared.js';

interface RepairEntryProps {
  readonly repair: Repair;
  /** The label of the deduction the entry is linked to, if any. */
  readonly linkedLabel: string | undefined;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}

/** One entry of the log, with Edit and Delete. */
export function RepairEntry({ repair, linkedLabel, onEdit, onDelete }: RepairEntryProps) {
  return (
    <Card>
      <h3 className="text-lg font-bold">{formatDateText(repair.date)}</h3>
      <p>{repair.description}</p>
      <p>Reported to: {repair.reportedTo}</p>
      {linkedLabel === undefined ? null : <p>Linked to: {linkedLabel}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant="secondary"
          isFullWidth
          aria-label={`Edit repair ${repair.description}`}
          onClick={onEdit}
        >
          Edit
        </Button>
        <Button
          variant="secondary"
          isFullWidth
          aria-label={`Delete repair ${repair.description}`}
          onClick={onDelete}
        >
          Delete
        </Button>
      </div>
    </Card>
  );
}
