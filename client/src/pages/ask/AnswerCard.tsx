import { Card } from '../../components/ui/Card.js';
import type { LeaseAnswer } from '../../hooks/use-lease-questions.js';
import { SOURCE_TAGS } from '../../shared.js';
import { ANSWER_TEXT } from './ask-text.js';

/** F7-R4. The question and the sentence of the lease, word for word and as plain text. */
export function AnswerCard({ question, match }: Pick<LeaseAnswer, 'question' | 'match'>) {
  return (
    <Card>
      <h3 className="text-lg font-bold wrap-anywhere">{question}</h3>
      <p>
        {ANSWER_TEXT[match.state]}
        {match.quote === null ? null : (
          <span className="text-ink-muted"> ({SOURCE_TAGS[match.source]})</span>
        )}
      </p>
      {match.quote === null ? null : (
        <blockquote className="border-l-4 border-line-input pl-3 italic">{match.quote}</blockquote>
      )}
    </Card>
  );
}
