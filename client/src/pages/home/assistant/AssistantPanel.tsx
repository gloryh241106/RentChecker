import { useAssistantApi } from '../../../api/assistant-api-context.js';
import { useClauseApi } from '../../../api/clause-api-context.js';
import { useAnnounce } from '../../../app/announce-context.js';
import { ConsentDialog } from '../../../components/ConsentDialog.js';
import { MatchStatus } from '../../../components/MatchStatus.js';
import { useAiConfigured } from '../../../hooks/use-ai-configured.js';
import { useAssistant } from '../../../hooks/use-assistant.js';
import { ASSISTANT_WORDING } from './assistant-text.js';
import { PlanView } from './PlanView.js';
import { PromptForm, focusPrompt } from './PromptForm.js';
import { WhatItDoes } from './WhatItDoes.js';

/** UC-10, F9. The tenant starts with a prompt. */
export function AssistantPanel() {
  const assistant = useAssistant({ api: useAssistantApi(), announce: useAnnounce() });
  const { phase, plan } = assistant;
  const isAiConfigured = useAiConfigured(useClauseApi(), phase.name === 'consent');
  return (
    <section
      aria-labelledby="assistant-heading"
      className="grid items-start gap-6 rounded-2xl border-2 border-primary bg-raised p-5 shadow-xs sm:p-8 lg:grid-cols-2"
    >
      <div className="min-w-0 space-y-4">
        <h2 id="assistant-heading" className="text-2xl font-bold">
          Tell the assistant what you need
        </h2>
        <PromptForm isRunning={phase.name === 'running'} onSubmit={assistant.submit} />
        <MatchStatus phase={phase} wording={ASSISTANT_WORDING} onTryAgain={assistant.tryAgain} />
      </div>
      <div className="min-w-0">
        {plan === null ? <WhatItDoes /> : <PlanView plan={plan} onChange={assistant.setPlan} />}
      </div>
      <ConsentDialog
        isOpen={phase.name === 'consent'}
        isAiConfigured={isAiConfigured}
        wording={ASSISTANT_WORDING}
        onContinue={assistant.confirm}
        onClose={() => {
          assistant.dismiss();
          focusPrompt();
        }}
      />
    </section>
  );
}
