import { Button } from '../../components/ui/Button.js';

interface SuggestedQuestionsProps {
  readonly questions: readonly string[];
  readonly isDisabled: boolean;
  readonly onAsk: (question: string) => void;
}

/** F7-R5. Pressing a question asks it. */
export function SuggestedQuestions({ questions, isDisabled, onAsk }: SuggestedQuestionsProps) {
  if (questions.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby="suggested-heading" className="space-y-3">
      <h2 id="suggested-heading" className="text-xl font-bold">
        Suggested for your case
      </h2>
      <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {questions.map((question) => (
          <li key={question} className="min-w-0">
            <Button
              variant="secondary"
              isFullWidth
              disabled={isDisabled}
              onClick={() => onAsk(question)}
            >
              <span className="min-w-0 wrap-anywhere">{question}</span>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
