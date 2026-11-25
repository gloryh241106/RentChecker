import { CopyBox } from '../../components/CopyBox.js';
import { questionsToAsk } from '../../shared.js';
import type { LeaseReviewItem } from '../../shared.js';

/** F4-R5. The questions of every topic that is not Found, to read and to copy. */
export function QuestionsBox({ items }: { readonly items: readonly LeaseReviewItem[] }) {
  const lines = questionsToAsk(items);
  return lines.length === 0 ? (
    <p>Every topic has a clause. Read each quote to check the terms.</p>
  ) : (
    <CopyBox
      id="questions-text"
      label="Questions to ask"
      lines={lines}
      buttonLabel="Copy questions"
    />
  );
}
