import { DeductionsStep } from './steps/DeductionsStep.js';
import { DetailsStep } from './steps/DetailsStep.js';
import { LeaseStep } from './steps/LeaseStep.js';
import { ResultsStep } from './steps/ResultsStep.js';
import type { StepId } from './steps.js';

/**
 * One entry for each step. Step 4b passes its "Find clauses" controls to LeaseStep from here, and
 * the Message step adds an entry (with its id in steps.ts).
 */
export function StepView({ step }: { readonly step: StepId }) {
  switch (step) {
    case 'details':
      return <DetailsStep />;
    case 'deductions':
      return <DeductionsStep />;
    case 'lease':
      return <LeaseStep />;
    case 'results':
      return <ResultsStep />;
  }
}
