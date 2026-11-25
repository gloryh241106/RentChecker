import { Link } from 'react-router';
import { STEPS, stepPath } from './steps.js';
import type { StepId } from './steps.js';

/** UI.md: the step list. Every step can be opened at any time. */
export function StepNav({ current }: { readonly current: StepId }) {
  return (
    <nav aria-label="Steps">
      <ol className="flex flex-wrap gap-1 border-b border-line pb-3 lg:sticky lg:top-6 lg:flex-col lg:border-b-0">
        {STEPS.map((step, index) => (
          <li key={step.id}>
            <Link
              to={stepPath(step.id)}
              aria-current={step.id === current ? 'step' : undefined}
              className={`inline-flex min-h-11 items-center gap-2 rounded-md px-3 no-underline lg:w-full ${
                step.id === current
                  ? 'bg-primary font-semibold text-on-primary'
                  : 'text-primary underline hover:bg-sunken'
              }`}
            >
              <span aria-hidden="true">{index + 1}</span>
              {step.name}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
