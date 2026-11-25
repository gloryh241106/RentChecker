import { Button } from '../../components/ui/Button.js';
import { controlClass, controlLinks, FieldFrame } from '../../components/ui/Field.js';
import { Notice } from '../../components/ui/Notice.js';
import { useCopy } from '../../hooks/use-copy.js';
import { questionsToAsk } from '../../shared.js';
import type { LeaseReviewItem } from '../../shared.js';

const FIELD_ID = 'questions-text';
const FIELD = { id: FIELD_ID, label: 'Questions to ask' };

/** F4-R5. The questions of every topic that is not Found, to read and to copy. */
export function QuestionsBox({ items }: { readonly items: readonly LeaseReviewItem[] }) {
  const { copy, isBlocked } = useCopy(FIELD_ID);
  const lines = questionsToAsk(items);
  if (lines.length === 0) {
    return <p>Every topic has a clause. Read each quote to check the terms.</p>;
  }
  const text = lines.join('\n');
  return (
    <div className="space-y-3">
      <FieldFrame {...FIELD}>
        <textarea
          {...controlLinks(FIELD)}
          className={controlClass(undefined)}
          rows={Math.min(lines.length + 1, 12)}
          value={text}
          readOnly
        />
      </FieldFrame>
      {isBlocked ? <Notice tone="info">Press Ctrl+C or long-press to copy.</Notice> : null}
      <Button isFullWidth onClick={() => void copy(text)}>
        Copy questions
      </Button>
    </div>
  );
}
