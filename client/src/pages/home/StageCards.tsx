import { Link } from 'react-router';
import { STAGES } from '../../app/stages.js';
import type { StagePath } from '../../app/stages.js';
import { DoorIcon, LeaseIcon, MeterIcon } from '../../components/ui/Icon.js';

const STAGE_LOOK: Readonly<
  Record<StagePath, { readonly Icon: typeof DoorIcon; readonly help: string }>
> = {
  '/move-out': {
    Icon: DoorIcon,
    help: 'Check the deductions your landlord listed against your tenancy and your lease.',
  },
  '/lease-review': {
    Icon: LeaseIcon,
    help: 'Paste a lease to see which deposit topics it covers and what to ask.',
  },
  '/tenancy': {
    Icon: MeterIcon,
    help: 'Check a metered bill against your readings, and keep a dated log of repairs.',
  },
};

// The link covers its card, so the whole card can be pressed and the link keeps its short name.
const LINK_CLASS =
  'text-primary no-underline after:absolute after:inset-0 after:rounded-xl hover:underline focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-focus';

/** UI.md Home: the three stages. Moving out is the main one. */
export function StageCards({ isSaved }: { readonly isSaved: boolean }) {
  return (
    <section aria-labelledby="stages-heading" className="space-y-4">
      <h2 id="stages-heading" className="text-2xl font-bold">
        Where are you in your tenancy?
      </h2>
      <ul className="grid gap-4 md:grid-cols-3">
        {STAGES.map(({ path, name }) => {
          const { Icon, help } = STAGE_LOOK[path];
          const isMain = path === '/move-out';
          return (
            <li
              key={path}
              className={`relative space-y-3 rounded-xl border-2 bg-raised p-5 shadow-xs transition-colors hover:border-primary ${isMain ? 'border-primary' : 'border-line'}`}
            >
              <span className="flex size-12 items-center justify-center rounded-lg bg-band text-accent">
                <Icon className="size-7 shrink-0" />
              </span>
              <h3 className="text-xl font-bold">
                <Link to={path} className={LINK_CLASS}>
                  {name}
                </Link>
              </h3>
              <p>{help}</p>
              {isMain && isSaved ? (
                <p className="font-semibold text-success">Saved in this browser</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
