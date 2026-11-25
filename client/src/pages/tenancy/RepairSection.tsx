import { useState } from 'react';
import { useAnnounce } from '../../app/announce-context.js';
import { Button } from '../../components/ui/Button.js';
import { MAX_REPAIRS, formatDateText, sortRepairs } from '../../shared.js';
import type { Repair } from '../../shared.js';
import type { RepairFields } from '../../state/actions.js';
import { useWorkspace } from '../../state/workspace-context.js';
import { RepairEntry } from './RepairEntry.js';
import { RepairForm } from './RepairForm.js';

/** `null` is closed, `'new'` adds, an id edits. */
type Editing = string | 'new' | null;

function focusListHeading(): void {
  document.getElementById('repairs-heading')?.focus();
}

/** What the status region says when an entry is deleted (F5-R7). */
function removedText(repair: Repair, linkedLabel: string | undefined): string {
  const removed = `Removed the repair of ${formatDateText(repair.date)}.`;
  return linkedLabel === undefined ? removed : `${removed} Its link to ${linkedLabel} was removed.`;
}

/** UC-5, F5-R5. The log, oldest first. */
export function RepairSection() {
  const { workspace, dispatch } = useWorkspace();
  const announce = useAnnounce();
  const [editing, setEditing] = useState<Editing>(null);
  const isFull = workspace.repairs.length >= MAX_REPAIRS;
  const edited = workspace.repairs.find((repair) => repair.id === editing);
  const labelOf = (repair: Repair) =>
    workspace.deductions.find(({ id }) => id === repair.deductionId)?.label;

  function save(repair: RepairFields): void {
    dispatch({ type: edited === undefined ? 'repair/add' : 'repair/update', repair });
    announce(`Saved the repair of ${formatDateText(repair.date)}.`);
    setEditing(null);
    focusListHeading();
  }

  function remove(repair: Repair): void {
    dispatch({ type: 'repair/remove', id: repair.id });
    announce(removedText(repair, labelOf(repair)));
    focusListHeading();
  }

  return (
    <section aria-labelledby="repairs-heading" className="space-y-4">
      <h2 id="repairs-heading" tabIndex={-1} className="text-xl font-bold">
        Repair log
      </h2>
      {workspace.repairs.length === 0 ? (
        <p>No repairs recorded. Add one when you report a problem.</p>
      ) : (
        <ul className="space-y-3">
          {sortRepairs(workspace.repairs).map((repair) => (
            <li key={repair.id}>
              <RepairEntry
                repair={repair}
                linkedLabel={labelOf(repair)}
                onEdit={() => setEditing(repair.id)}
                onDelete={() => remove(repair)}
              />
            </li>
          ))}
        </ul>
      )}
      {editing === null ? (
        <div className="space-y-2">
          <Button
            id="add-repair"
            isFullWidth
            disabled={isFull}
            aria-describedby={isFull ? 'repair-limit' : undefined}
            onClick={() => setEditing('new')}
          >
            Add repair
          </Button>
          {isFull ? <p id="repair-limit">The log holds up to 50 entries.</p> : null}
        </div>
      ) : (
        <RepairForm
          key={editing}
          initial={edited ?? null}
          onSave={save}
          onCancel={() => {
            setEditing(null);
            focusListHeading();
          }}
        />
      )}
    </section>
  );
}
