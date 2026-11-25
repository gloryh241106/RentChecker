import { useState } from 'react';
import { Button } from '../../components/ui/Button.js';
import { TextField } from '../../components/ui/Field.js';
import { fieldErrorText } from '../../forms/field-errors.js';
import { MAX_SHORT_TEXT_LENGTH } from '../../shared.js';

const QUESTION_FIELD_ID = 'lease-question';
const REASON_ID = 'ask-reason';

/** Focus for the next question. Also called when a pressed button goes away. */
export function selectQuestion(): void {
  const field = document.getElementById(QUESTION_FIELD_ID);
  if (field instanceof HTMLInputElement) {
    field.focus();
    field.select();
  }
}

interface QuestionFormProps {
  readonly firstQuestion: string;
  /** Why asking is not possible yet (F7-R1). */
  readonly blockers: readonly string[];
  readonly isRunning: boolean;
  readonly onAsk: (question: string) => void;
}

function problemOf(question: string): string | undefined {
  if (question === '') {
    return fieldErrorText('REQUIRED', 'question');
  }
  return question.length > MAX_SHORT_TEXT_LENGTH
    ? fieldErrorText('TEXT_TOO_LONG', 'question')
    : undefined;
}

/** F7-R1. The text stays selected after a question, so the next one can be typed over it. */
export function QuestionForm({ firstQuestion, blockers, isRunning, onAsk }: QuestionFormProps) {
  const [text, setText] = useState(firstQuestion);
  const [error, setError] = useState<string | undefined>(undefined);

  function submit(): void {
    const question = text.trim();
    const problem = problemOf(question);
    setError(problem);
    selectQuestion();
    if (problem === undefined) {
      onAsk(question);
    }
  }

  return (
    <form
      noValidate
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <TextField
        id={QUESTION_FIELD_ID}
        label="Your question"
        hint="For example: When do I get my deposit back?"
        value={text}
        error={error}
        onChange={(next) => {
          setText(next);
          setError(undefined);
        }}
      />
      <Button
        type="submit"
        isFullWidth
        disabled={blockers.length > 0 || isRunning}
        aria-describedby={blockers.length > 0 ? REASON_ID : undefined}
      >
        Ask
      </Button>
      {blockers.length > 0 ? (
        <p id={REASON_ID} className="text-ink-muted">
          {blockers.join(' ')}
        </p>
      ) : null}
    </form>
  );
}
