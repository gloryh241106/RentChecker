import { useClauseApi } from '../../api/clause-api-context.js';
import { useAnnounce } from '../../app/announce-context.js';
import { ConsentDialog } from '../../components/ConsentDialog.js';
import { MatchStatus } from '../../components/MatchStatus.js';
import { leaseBlockers } from '../../hooks/match-request.js';
import { useAiConfigured } from '../../hooks/use-ai-configured.js';
import { useLeaseQuestions } from '../../hooks/use-lease-questions.js';
import type { Workspace } from '../../shared.js';
import { AnswerList } from './AnswerList.js';
import { ASK_WORDING } from './ask-text.js';
import { QuestionForm, selectQuestion } from './QuestionForm.js';
import { SuggestedQuestions } from './SuggestedQuestions.js';
import { suggestQuestions } from './suggestions.js';

interface AskPanelProps {
  readonly workspace: Workspace;
  /** Filled in by the assistant (F9-R12). */
  readonly firstQuestion: string;
}

/** F7. Mounted anew for each lease text, so answers never belong to another text (F7-R6). */
export function AskPanel({ workspace, firstQuestion }: AskPanelProps) {
  const { leaseText } = workspace;
  const api = useClauseApi();
  const questions = useLeaseQuestions({ api, leaseText, announce: useAnnounce() });
  const { phase, answers } = questions;
  const blockers = leaseBlockers(leaseText);
  const isAiConfigured = useAiConfigured(api, blockers.length === 0);
  const isRunning = phase.name === 'running';
  const answered = answers.map(({ question }) => question);

  return (
    <div className="space-y-5">
      <QuestionForm
        firstQuestion={firstQuestion}
        blockers={blockers}
        isRunning={isRunning}
        onAsk={questions.ask}
      />
      <SuggestedQuestions
        questions={suggestQuestions(workspace, answered)}
        isDisabled={blockers.length > 0 || isRunning}
        onAsk={(question) => {
          selectQuestion(); // The pressed button goes away or is disabled.
          questions.ask(question);
        }}
      />
      <MatchStatus phase={phase} wording={ASK_WORDING} onTryAgain={questions.tryAgain} />
      <AnswerList answers={answers} />
      <ConsentDialog
        isOpen={phase.name === 'consent'}
        isAiConfigured={isAiConfigured}
        wording={ASK_WORDING}
        onContinue={questions.confirm}
        onClose={() => {
          questions.dismiss();
          selectQuestion();
        }}
      />
    </div>
  );
}
