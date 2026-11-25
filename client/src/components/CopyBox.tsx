import { useCopy } from '../hooks/use-copy.js';
import { Button } from './ui/Button.js';
import { controlClass, controlLinks, FieldFrame } from './ui/Field.js';
import { Notice } from './ui/Notice.js';

interface CopyBoxProps {
  readonly id: string;
  readonly label: string;
  readonly lines: readonly string[];
  readonly buttonLabel: string;
}

/** F4-R5, F7-R7. Lines to read and to copy. A blocked clipboard works as on Message (F3-R13). */
export function CopyBox({ id, label, lines, buttonLabel }: CopyBoxProps) {
  const { copy, isBlocked } = useCopy(id);
  const text = lines.join('\n');
  return (
    <div className="space-y-3">
      <FieldFrame id={id} label={label}>
        <textarea
          {...controlLinks({ id, label })}
          className={controlClass(undefined)}
          rows={Math.min(lines.length + 1, 12)}
          value={text}
          readOnly
        />
      </FieldFrame>
      {isBlocked ? <Notice tone="info">Press Ctrl+C or long-press to copy.</Notice> : null}
      <Button isFullWidth onClick={() => void copy(text)}>
        {buttonLabel}
      </Button>
    </div>
  );
}
