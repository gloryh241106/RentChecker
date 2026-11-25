import { PageHeading } from '../app/PageHeading.js';
import { ExampleResult } from '../components/ExampleResult.js';
import { LoadSampleButton } from '../components/LoadSampleButton.js';
import { Button, ButtonLink } from '../components/ui/Button.js';
import { hasData } from '../state/has-data.js';
import { useWorkspace } from '../state/workspace-context.js';
import { AssistantPanel } from './home/assistant/AssistantPanel.js';
import { focusPrompt } from './home/assistant/PromptForm.js';
import { AskTeaser } from './home/AskTeaser.js';
import { HowItWorks } from './home/HowItWorks.js';
import { StageCards } from './home/StageCards.js';
import { stepPath } from './move-out/steps.js';

/** UC-6 ends here. Stage cards follow UI.md: Moving out, Before signing, During the tenancy. */
export function Home() {
  const { workspace } = useWorkspace();
  return (
    <div className="space-y-12">
      <div className="on-band grid items-center gap-8 rounded-2xl bg-band p-5 text-on-band sm:p-8 lg:grid-cols-2">
        <div className="space-y-5">
          <PageHeading title="Check your rent and deposit charges" isLarge />
          <p className="text-lg text-on-band-muted">
            Compare what your landlord took from your deposit with your lease and your own facts.
            You get a clear result for each charge, and the reasons behind it.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button variant="accent" isFullWidth onClick={focusPrompt}>
              Start with a message
            </Button>
            <ButtonLink to={stepPath('details')} isFullWidth>
              Check my deductions
            </ButtonLink>
            <LoadSampleButton />
          </div>
        </div>
        <ExampleResult />
      </div>
      <AssistantPanel />
      <StageCards isSaved={hasData(workspace)} />
      <AskTeaser />
      <HowItWorks />
    </div>
  );
}
