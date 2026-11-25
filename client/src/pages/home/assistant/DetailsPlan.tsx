import { useEffect, useState } from 'react';
import { InputChecks } from '../../../components/InputChecks.js';
import { Button } from '../../../components/ui/Button.js';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.js';
import {
  withAnswer,
  withSkipped,
  withoutCharge,
  withoutFact,
} from '../../../hooks/assistant-plan.js';
import type { AssistantPlan } from '../../../hooks/assistant-plan.js';
import { checksOf, nextQuestion } from '../../../shared.js';
import type { Question } from '../../../shared.js';
import { todayText } from '../../../state/today.js';
import { FactList } from './FactList.js';
import { NextQuestion } from './NextQuestion.js';
import { useDetails } from './use-details.js';

const USE_ID = 'use-details';

interface DetailsPlanProps {
  readonly plan: AssistantPlan;
  readonly onChange: (plan: AssistantPlan) => void;
}

/** F9-R8 to F9-R11. What was found, what is missing and what looks wrong. */
export function DetailsPlan({ plan, onChange }: DetailsPlanProps) {
  const { draft } = plan;
  const question = nextQuestion(draft, plan.skipped);
  const details = useDetails(draft);
  const [isAsking, setIsAsking] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  useEffect(() => {
    if (hasAnswered && question === null) {
      document.getElementById(USE_ID)?.focus();
    }
  }, [hasAnswered, question]);

  function answer(asked: Question, text: string): boolean {
    const next = withAnswer(plan, asked, text);
    if (next !== null) {
      setHasAnswered(true);
      onChange(next);
    }
    return next !== null;
  }

  return (
    <div className="space-y-4">
      <FactList
        draft={draft}
        onChange={(kind) => {
          setHasAnswered(true);
          onChange(withoutFact(plan, kind));
        }}
        onRemove={(index) => onChange(withoutCharge(plan, index))}
      />
      <InputChecks checks={checksOf(draft, todayText())} />
      {question === null ? null : (
        <NextQuestion
          key={question}
          question={question}
          onAnswer={(text) => answer(question, text)}
          onSkip={() => {
            setHasAnswered(true);
            onChange(withSkipped(plan, question));
          }}
          takesFocus={hasAnswered}
        />
      )}
      {details.leftOut === 0 ? null : (
        <p>Rent without a known month is left out. Add the handover date to include it.</p>
      )}
      <Button
        id={USE_ID}
        variant={question === null ? 'primary' : 'secondary'}
        isFullWidth
        disabled={details.isEmpty}
        onClick={() => (details.replaces ? setIsAsking(true) : details.use())}
      >
        Use these details
      </Button>
      <ConfirmDialog
        isOpen={isAsking}
        title="Use these details"
        confirmLabel="Use these details"
        onClose={() => setIsAsking(false)}
        onConfirm={() => null}
        onConfirmed={details.use}
      >
        <p>
          This replaces the tenancy details and deductions in this browser. Your own lease text and
          repair log stay. Continue?
        </p>
      </ConfirmDialog>
    </div>
  );
}
