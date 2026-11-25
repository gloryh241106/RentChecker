import { ItemEvidence } from '../../components/ItemEvidence.js';
import { OverrideControls } from '../../components/OverrideControls.js';
import { Card } from '../../components/ui/Card.js';
import { showsQuestion, TOPIC_OUTCOME_NAMES, topicOutcome } from '../../shared.js';
import type { LeaseReviewItem, ReviewTopic } from '../../shared.js';
import type { EvidenceOverride } from '../../state/actions.js';

interface TopicRowProps {
  readonly topic: ReviewTopic;
  readonly item: LeaseReviewItem | undefined;
  readonly leaseText: string;
  readonly onOverride: (topicId: string, override: EvidenceOverride) => void;
}

/** F4-R3, F4-R6. One topic: its outcome, the quote, the question, and the tenant's controls. */
export function TopicRow({ topic, item, leaseText, onOverride }: TopicRowProps) {
  const outcome = topicOutcome(item);
  return (
    <li>
      <Card>
        <h3 className="text-lg font-bold">{topic.name}</h3>
        <div className="space-y-3 rounded-md bg-sunken p-3">
          <ItemEvidence caption="Outcome" stateText={TOPIC_OUTCOME_NAMES[outcome]} evidence={item}>
            {showsQuestion(outcome) ? (
              <p>
                <span className="font-semibold">Question to ask: </span>
                {topic.question}
              </p>
            ) : null}
          </ItemEvidence>
          <OverrideControls
            itemId={`review-${topic.id}`}
            label={topic.name}
            isOverridden={item?.source === 'user'}
            leaseText={leaseText}
            onOverride={(override) => onOverride(topic.id, override)}
          />
        </div>
      </Card>
    </li>
  );
}
