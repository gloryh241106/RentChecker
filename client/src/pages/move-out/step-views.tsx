import { FindClauses } from '../../components/FindClauses.js';
import { DeductionsStep } from './steps/DeductionsStep.js';
import { DetailsStep } from './steps/DetailsStep.js';
import { LeaseStep } from './steps/LeaseStep.js';
import { MessageStep } from './steps/MessageStep.js';
import { ResultsStep } from './steps/ResultsStep.js';
import { useMoveOutSession } from './session-context.js';
import type { StepId } from './steps.js';

/** One entry for each step. The Lease step gets its "Find clauses" controls from here. */
export function StepView({ step }: { readonly step: StepId }) {
  const { refreshCheck } = useMoveOutSession();
  switch (step) {
    case 'details':
      return <DetailsStep />;
    case 'deductions':
      return <DeductionsStep />;
    case 'lease':
      return <LeaseStep matching={<FindClauses onMatched={refreshCheck} />} />;
    case 'results':
      return <ResultsStep />;
    case 'message':
      return <MessageStep />;
  }
}
