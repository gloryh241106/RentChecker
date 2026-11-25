import { useSearchParams } from 'react-router';
import { SampleBanner } from '../../components/SampleBanner.js';
import { MoveOutSession } from './MoveOutSession.js';
import { StepButtons } from './StepButtons.js';
import { StepNav } from './StepNav.js';
import { StepView } from './step-views.js';
import { readStep } from './steps.js';

/** UC-1. The step is in the address, so Back and a reload keep the place. */
export function MoveOutPage() {
  const [params] = useSearchParams();
  const step = readStep(params.get('step'));
  return (
    <MoveOutSession>
      <SampleBanner />
      <div className="grid gap-6 lg:grid-cols-[12rem_minmax(0,48rem)] lg:gap-10">
        <StepNav current={step} />
        <div className="min-w-0 space-y-6">
          <StepView step={step} />
          <StepButtons current={step} />
        </div>
      </div>
    </MoveOutSession>
  );
}
