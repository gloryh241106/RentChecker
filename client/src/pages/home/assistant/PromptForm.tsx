import { useState } from 'react';
import { Button } from '../../../components/ui/Button.js';
import { TextField } from '../../../components/ui/Field.js';
import { MAX_PROMPT_LENGTH, MIN_PROMPT_LENGTH } from '../../../shared.js';
import { EXAMPLES } from './assistant-text.js';

const FIELD_ID = 'assistant-prompt';

export function focusPrompt(): void {
  document.getElementById(FIELD_ID)?.focus();
}

interface PromptFormProps {
  readonly isRunning: boolean;
  readonly onSubmit: (prompt: string) => void;
}

function problemOf(prompt: string): string | undefined {
  if (prompt.length < MIN_PROMPT_LENGTH) {
    return 'Write what you need.';
  }
  return prompt.length > MAX_PROMPT_LENGTH ? 'Use at most 2,000 characters.' : undefined;
}

/** F9-R1. The examples fill the box and send nothing. */
export function PromptForm({ isRunning, onSubmit }: PromptFormProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);

  function change(next: string): void {
    setText(next);
    setError(undefined);
  }

  function submit(): void {
    const problem = problemOf(text.trim());
    setError(problem);
    if (problem === undefined) {
      onSubmit(text.trim());
    } else {
      focusPrompt();
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
        id={FIELD_ID}
        label="Your message"
        hint="Use your own words, in English. Leave out names, ID numbers and bank details."
        isMultiline
        rows={5}
        value={text}
        error={error}
        onChange={change}
      />
      <Button type="submit" isFullWidth disabled={isRunning}>
        Read my message
      </Button>
      <p className="text-ink-muted">Or try an example:</p>
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map(({ name, prompt }) => (
          <Button
            key={name}
            variant="secondary"
            onClick={() => {
              change(prompt);
              focusPrompt();
            }}
          >
            {name}
          </Button>
        ))}
      </div>
    </form>
  );
}
