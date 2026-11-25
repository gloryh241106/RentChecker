import { Button, ButtonLink } from '../../components/ui/Button.js';
import { useMoveOutSession } from './session-context.js';
import { STEPS, stepPath } from './steps.js';
import type { StepId } from './steps.js';

/** UI.md: Back and Next on every step, full width on a phone. Next checks the step first. */
export function StepButtons({ current }: { readonly current: StepId }) {
  const session = useMoveOutSession();
  const index = STEPS.findIndex((step) => step.id === current);
  const previous = STEPS[index - 1];
  const next = STEPS[index + 1];
  return (
    <div className="flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:justify-between">
      <ButtonLink to={previous === undefined ? '/' : stepPath(previous.id)} isFullWidth>
        Back
      </ButtonLink>
      {next === undefined ? null : (
        <Button
          isFullWidth
          onClick={() => {
            if (session.canLeave(current)) {
              session.goTo(next.id);
            }
          }}
        >
          Next
        </Button>
      )}
    </div>
  );
}
