import { describeCharge } from '../../../components/charge-text.js';
import { Button } from '../../../components/ui/Button.js';
import { chargesOf, showValue } from '../../../shared.js';
import type { AssistantDraft, SingleFact } from '../../../shared.js';
import { FACT_NAMES, FACT_ORDER } from './assistant-text.js';

const ROW = 'flex items-center justify-between gap-3 border-b border-line py-1 wrap-anywhere';

interface FactListProps {
  readonly draft: AssistantDraft;
  readonly onChange: (kind: SingleFact) => void;
  readonly onRemove: (index: number) => void;
}

function Source({ words }: { readonly words: string | null }) {
  return (
    <span className="block text-ink-muted">
      {words === null ? 'Your answer' : `From your words: “${words}”`}
    </span>
  );
}

/** F9-R9. Each value stands next to the words it was read from. */
export function FactList({ draft, onChange, onRemove }: FactListProps) {
  const charges = chargesOf(draft);
  const known = FACT_ORDER.flatMap((kind) => {
    const fact = draft.facts[kind];
    return fact === undefined ? [] : [{ kind, fact }];
  });
  if (known.length === 0 && charges.length === 0) {
    return <p>No amount or date was found in your message yet.</p>;
  }
  return (
    <ul>
      {known.map(({ kind, fact }) => (
        <li key={kind} className={ROW}>
          <span className="min-w-0">
            <span className="font-semibold">
              {FACT_NAMES[kind]}: {showValue(fact.value)}
            </span>
            <Source words={fact.source} />
          </span>
          <Button
            variant="quiet"
            aria-label={`Change ${FACT_NAMES[kind].toLowerCase()}`}
            onClick={() => onChange(kind)}
          >
            Change
          </Button>
        </li>
      ))}
      {charges.map((charge, index) => (
        <li key={`${String(index)}-${charge.label}`} className={ROW}>
          <span className="min-w-0">
            <span className="font-semibold">{describeCharge(charge)}</span>
            <Source words={draft.charges[index]?.source ?? null} />
          </span>
          <Button
            variant="quiet"
            aria-label={`Remove ${charge.label}`}
            onClick={() => onRemove(index)}
          >
            Remove
          </Button>
        </li>
      ))}
    </ul>
  );
}
