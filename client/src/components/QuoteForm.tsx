import { useEffect, useState } from 'react';
import { fieldErrorText } from '../forms/field-errors.js';
import { isQuoteInLease } from '../shared.js';
import { Button } from './ui/Button.js';
import { TextField } from './ui/Field.js';

interface QuoteFormProps {
  readonly fieldId: string;
  readonly label: string;
  readonly leaseText: string;
  readonly onSave: (quote: string) => void;
  readonly onCancel: () => void;
}

/** F2-R12: the same check as the server's, run in the browser against the current lease. */
export function QuoteForm({ fieldId, label, leaseText, onSave, onCancel }: QuoteFormProps) {
  const [quote, setQuote] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  useEffect(() => {
    document.getElementById(fieldId)?.focus();
  }, [fieldId]);

  function save(): void {
    if (isQuoteInLease(quote, leaseText)) {
      onSave(quote);
    } else {
      setError(fieldErrorText('QUOTE_NOT_FOUND', 'quote'));
      document.getElementById(fieldId)?.focus();
    }
  }

  return (
    <div className="space-y-3">
      <TextField
        id={fieldId}
        label={`Quote from the lease for ${label}`}
        hint="Paste the sentence exactly as it is written in the lease."
        isMultiline
        rows={4}
        value={quote}
        error={error}
        onChange={(text) => {
          setQuote(text);
          setError(undefined);
        }}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button isFullWidth onClick={save}>
          Use this quote
        </Button>
        <Button variant="secondary" isFullWidth onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
