import { CopyBox } from '../../components/CopyBox.js';
import type { LeaseAnswer } from '../../hooks/use-lease-questions.js';
import { AnswerCard } from './AnswerCard.js';

/** F7-R6, F7-R7. The answers, newest first, then the questions that have none. */
export function AnswerList({ answers }: { readonly answers: readonly LeaseAnswer[] }) {
  if (answers.length === 0) {
    return null;
  }
  const open = answers
    .filter(({ match }) => match.quote === null)
    .map(({ question }) => question)
    .reverse();
  return (
    <section aria-labelledby="answers-heading" className="space-y-3">
      <h2 id="answers-heading" className="text-xl font-bold">
        Answers
      </h2>
      <ul className="space-y-3">
        {answers.map(({ id, question, match }) => (
          <li key={id}>
            <AnswerCard question={question} match={match} />
          </li>
        ))}
      </ul>
      {open.length === 0 ? null : (
        <CopyBox
          id="open-questions"
          label="Questions to ask your landlord"
          lines={open}
          buttonLabel="Copy questions"
        />
      )}
    </section>
  );
}
