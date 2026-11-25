import { useEffect, useRef } from 'react';
import { ButtonLink } from '../../../components/ui/Button.js';
import type { AssistantPlan } from '../../../hooks/assistant-plan.js';
import { MAX_SHORT_TEXT_LENGTH } from '../../../shared.js';
import { askState } from '../../ask/ask-state.js';
import { TASK_TEXT } from './assistant-text.js';
import { DetailsPlan } from './DetailsPlan.js';

interface PlanViewProps {
  readonly plan: AssistantPlan;
  readonly onChange: (plan: AssistantPlan) => void;
}

/** F9-R12. The question source, else the prompt, if the field of Ask your lease can hold it. */
function questionFor({ leaseQuestion, prompt }: AssistantPlan): string {
  const question = leaseQuestion ?? prompt;
  return question.length > MAX_SHORT_TEXT_LENGTH ? '' : question;
}

function titleOf({ task }: AssistantPlan): string {
  if (task === 'check_deductions') {
    return 'You want to check deductions from your deposit';
  }
  return task === 'out_of_scope' ? 'The assistant cannot help with this' : TASK_TEXT[task].title;
}

/** F9. What the assistant understood, and the way on. */
export function PlanView({ plan, onChange }: PlanViewProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  const { task } = plan;
  return (
    <div className="space-y-4">
      <h3 ref={heading} tabIndex={-1} className="text-xl font-bold">
        {titleOf(plan)}
      </h3>
      {task === 'check_deductions' ? <DetailsPlan plan={plan} onChange={onChange} /> : null}
      {task === 'out_of_scope' ? <WhatItCanDo /> : null}
      {task === 'check_deductions' || task === 'out_of_scope' ? null : (
        <>
          <p>{TASK_TEXT[task].text}</p>
          <ButtonLink
            to={TASK_TEXT[task].path}
            state={task === 'ask_lease' ? askState(questionFor(plan)) : undefined}
            variant="primary"
            isFullWidth
          >
            {TASK_TEXT[task].link}
          </ButtonLink>
        </>
      )}
    </div>
  );
}

function WhatItCanDo() {
  return (
    <>
      <p>It can help you to:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>check what a landlord took from your deposit</li>
        <li>find the sentence of your lease that answers a question</li>
        <li>see what to ask before you sign a lease</li>
        <li>check a metered bill, or record a repair</li>
      </ul>
    </>
  );
}
