import { PageHeading } from '../../app/PageHeading.js';
import { LeaseTextBox } from '../../components/LeaseTextBox.js';
import { NOT_LEGAL_ADVICE } from '../../components/not-legal-advice.js';
import { SampleBanner } from '../../components/SampleBanner.js';
import { useWorkspace } from '../../state/workspace-context.js';
import { AskPanel } from './AskPanel.js';

/** UC-8, F7. Questions about the lease of Moving out, answered with its own words. */
export function AskPage() {
  const { workspace, dispatch } = useWorkspace();
  return (
    <div className="space-y-5">
      <SampleBanner />
      <PageHeading title="Ask your lease" />
      <p className="max-w-3xl text-lg">
        Ask in your own words. You get the sentence of your lease that answers, or a plain no.
      </p>
      <div className="grid items-start gap-8 lg:grid-cols-2">
        <section aria-label="Your lease" className="space-y-3">
          <LeaseTextBox
            id="ask-lease-text"
            hint="This is the lease of Moving out. A change here changes it there."
            value={workspace.leaseText}
            hasResults={workspace.evidence.length > 0}
            emptyText="Paste your lease, or try the sample."
            staleText="The lease text changed. On Moving out, find clauses again."
            offersSample
            onChange={(text) => dispatch({ type: 'lease/set', text })}
          />
        </section>
        <AskPanel key={workspace.leaseText} workspace={workspace} />
      </div>
      <p className="text-ink-muted">{NOT_LEGAL_ADVICE}</p>
    </div>
  );
}
