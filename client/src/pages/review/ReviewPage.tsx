import { useClauseApi } from '../../api/clause-api-context.js';
import { useAnnounce } from '../../app/announce-context.js';
import { PageHeading } from '../../app/PageHeading.js';
import { LeaseTextBox } from '../../components/LeaseTextBox.js';
import { MatchRunner } from '../../components/MatchRunner.js';
import { NOT_LEGAL_ADVICE } from '../../components/not-legal-advice.js';
import { REVIEW_WORDING } from '../../components/review-text.js';
import { useReviewMatch } from '../../hooks/use-review-match.js';
import { REVIEW_TOPICS } from '../../shared.js';
import { useWorkspace } from '../../state/workspace-context.js';
import { QuestionsBox } from './QuestionsBox.js';
import { TopicPreview } from './TopicPreview.js';
import { TopicRow } from './TopicRow.js';

/** UC-3, F4. Paste a lease before signing, and see which deposit topics it covers. */
export function ReviewPage() {
  const { workspace, dispatch } = useWorkspace();
  const { reviewLeaseText, leaseReview } = workspace;
  const matching = useReviewMatch({
    api: useClauseApi(),
    leaseText: reviewLeaseText,
    applyMatches: (matches) => dispatch({ type: 'review/apply', matches }),
    announce: useAnnounce(),
  });
  const hasRows = leaseReview.length > 0; // F4-R6: rows appear after the first review.

  return (
    <div className="space-y-5">
      <PageHeading title="Review a lease before you sign" />
      <LeaseTextBox
        id="review-lease-text"
        hint="Paste the whole lease. A missing page can cause a wrong Not found."
        value={reviewLeaseText}
        hasResults={hasRows}
        offersSample
        emptyText="Paste the lease to see which deposit topics it covers."
        staleText="The lease text changed. Run the review again."
        onChange={(text) => dispatch({ type: 'review/set', text })}
      />
      <MatchRunner
        matching={matching}
        wording={REVIEW_WORDING}
        label="Run review"
        variant="primary"
      />
      {hasRows ? (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Deposit topics</h2>
          <p>A found clause is not a check that its terms are fair.</p>
          <ul className="grid items-start gap-3 lg:grid-cols-2">
            {REVIEW_TOPICS.map((topic) => (
              <TopicRow
                key={topic.id}
                topic={topic}
                item={leaseReview.find((item) => item.topicId === topic.id)}
                leaseText={reviewLeaseText}
                onOverride={(topicId, override) =>
                  dispatch({ type: 'review/override', topicId, override })
                }
              />
            ))}
          </ul>
          <QuestionsBox items={leaseReview} />
        </section>
      ) : (
        <TopicPreview />
      )}
      <p className="text-ink-muted">{NOT_LEGAL_ADVICE}</p>
    </div>
  );
}
