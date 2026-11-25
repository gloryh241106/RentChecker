import { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/Button.js';
import { TextField } from '../../../components/ui/Field.js';
import type { Question } from '../../../shared.js';
import { QUESTION_TEXT } from './assistant-text.js';

const FIELD_ID = 'assistant-answer';

function focusAnswer(): void {
  document.getElementById(FIELD_ID)?.focus();
}

interface NextQuestionProps {
  readonly question: Question;
  /** False when the answer cannot be read. */
  readonly onAnswer: (text: string) => boolean;
  readonly onSkip: () => void;
  /** True from the second question on, so the first one does not take focus from the plan. */
  readonly takesFocus: boolean;
}

/** F9-R8. One question. The answer is read by code in this browser. */
export function NextQuestion({ question, onAnswer, onSkip, takesFocus }: NextQuestionProps) {
  const [text, setText] = useState('');
  const [isUnread, setIsUnread] = useState(false);
  const { label, hint, error } = QUESTION_TEXT[question];
  // Kept from when the question appeared, so a later change does not move the focus.
  const [tookFocus] = useState(takesFocus);
  useEffect(() => {
    if (tookFocus) {
      focusAnswer();
    }
  }, [tookFocus]);

  return (
    <form
      noValidate
      className="space-y-3 rounded-xl bg-sunken p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!onAnswer(text)) {
          setIsUnread(true);
          focusAnswer();
        }
      }}
    >
      <TextField
        id={FIELD_ID}
        label={label}
        hint={hint}
        value={text}
        error={isUnread ? error : undefined}
        onChange={(next) => {
          setText(next);
          setIsUnread(false);
        }}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" isFullWidth>
          Answer
        </Button>
        <Button variant="quiet" isFullWidth onClick={onSkip}>
          Skip this question
        </Button>
      </div>
    </form>
  );
}
