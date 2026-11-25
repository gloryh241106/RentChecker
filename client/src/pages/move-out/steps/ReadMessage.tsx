import { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/Button.js';
import { Card } from '../../../components/ui/Card.js';
import { TextField } from '../../../components/ui/Field.js';
import { MAX_MESSAGE_LENGTH, readMessage } from '../../../shared.js';
import type { Deduction, FoundCharges } from '../../../shared.js';
import { FoundChargeList } from './FoundChargeList.js';

const FIELD_ID = 'landlord-message';
const TOO_LONG = 'Use at most 4,000 characters.';

/** The worked example of DOMAIN_RULES.md, as a landlord might write it. */
const SAMPLE_MESSAGE =
  'Hi, I have deducted 12,000 for repainting, 15,000 for June rent and Rs 3,000 service fee. Total 30,000.';

interface ReadMessageProps {
  readonly handoverDate: string | undefined;
  /** How many deductions can still be added (F1-R4). */
  readonly room: number;
  readonly onAdd: (deductions: readonly Deduction[]) => void;
  readonly onCancel: () => void;
}

/** UC-9, F8. Reads the charges out of a pasted message, in the browser and by code only. */
export function ReadMessage({ handoverDate, room, onAdd, onCancel }: ReadMessageProps) {
  const [message, setMessage] = useState('');
  const [found, setFound] = useState<FoundCharges | null>(null);
  const isTooLong = message.length > MAX_MESSAGE_LENGTH;
  useEffect(() => {
    document.getElementById(FIELD_ID)?.focus();
  }, []);

  function change(text: string): void {
    setMessage(text);
    setFound(null);
  }

  return (
    <Card>
      <h2 className="text-xl font-bold">Read the landlord&apos;s message</h2>
      <TextField
        id={FIELD_ID}
        label="Message from your landlord"
        hint="It is read in this browser and is not sent or saved."
        isMultiline
        rows={5}
        value={message}
        error={isTooLong ? TOO_LONG : undefined}
        onChange={change}
      />
      {message === '' ? (
        <Button
          variant="quiet"
          onClick={() => {
            change(SAMPLE_MESSAGE);
            document.getElementById(FIELD_ID)?.focus(); // The button is gone by now.
          }}
        >
          Use a sample message
        </Button>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          isFullWidth
          disabled={message.trim() === '' || isTooLong}
          onClick={() => setFound(readMessage(message, handoverDate))}
        >
          Find charges
        </Button>
        <Button variant="secondary" isFullWidth onClick={onCancel}>
          Cancel
        </Button>
      </div>
      {found === null ? null : <FoundChargeList found={found} room={room} onAdd={onAdd} />}
    </Card>
  );
}
