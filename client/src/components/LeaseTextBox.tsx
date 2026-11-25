import { useState } from 'react';
import { MAX_LEASE_LENGTH } from '../shared.js';
import { TextField } from './ui/Field.js';
import { Notice } from './ui/Notice.js';

const COUNT_FORMAT = new Intl.NumberFormat('en-IN');
const LEASE_TOO_LONG =
  'This is longer than 40,000 characters, so it is not used or saved. Take out pages that do not mention charges.';

interface LeaseTextBoxProps {
  readonly id: string;
  readonly hint: string;
  /** The stored lease text. */
  readonly value: string;
  /** Whether results exist for this text, so a change can be told from a first edit. */
  readonly hasResults: boolean;
  readonly emptyText: string;
  readonly staleText: string;
  /** Called with the new text, or '' while the text is over the limit (F1-R15). */
  readonly onChange: (text: string) => void;
}

/**
 * F1-R15, F4-R7. The lease text box with its count, its empty and out-of-date notes, for the
 * Lease step and the review page. Text over the limit stays in the box, so nothing pasted is cut
 * or lost without a word, and the lease counts as empty until it is shorter.
 */
export function LeaseTextBox(props: LeaseTextBoxProps) {
  const { id, hint, value, hasResults, emptyText, staleText, onChange } = props;
  const [wasEdited, setWasEdited] = useState(false);
  const [longText, setLongText] = useState<string | null>(null);
  const isTooLong = longText !== null;
  const text = longText ?? value;

  function changeText(next: string): void {
    const isOverLimit = next.length > MAX_LEASE_LENGTH;
    setLongText(isOverLimit ? next : null);
    setWasEdited(hasResults || wasEdited);
    onChange(isOverLimit ? '' : next);
  }

  return (
    <>
      <TextField
        id={id}
        label="Lease text"
        hint={hint}
        isMultiline
        rows={10}
        value={text}
        error={isTooLong ? LEASE_TOO_LONG : undefined}
        onChange={changeText}
      />
      <p className="text-ink-muted">
        {COUNT_FORMAT.format(text.length)} of {COUNT_FORMAT.format(MAX_LEASE_LENGTH)}
      </p>
      {text === '' ? <p>{emptyText}</p> : null}
      {wasEdited && !hasResults ? <Notice tone="warning">{staleText}</Notice> : null}
    </>
  );
}
