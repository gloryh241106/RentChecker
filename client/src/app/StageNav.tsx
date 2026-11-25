import { NavLink } from 'react-router';
import { ASK_PAGE, STAGES } from './stages.js';

function classOf({ isActive }: { readonly isActive: boolean }): string {
  const state = isActive
    ? 'border-accent font-semibold text-on-band'
    : 'border-transparent text-on-band-muted hover:text-on-band';
  return `inline-flex min-h-11 items-center border-b-2 no-underline ${state}`;
}

/** UI.md: the stage links and Ask your lease in the header. NavLink marks the current one with `aria-current`. */
export function StageNav() {
  return (
    <nav aria-label="Stages">
      <ul className="flex flex-wrap gap-x-4 text-sm sm:gap-x-6 sm:text-base">
        {[...STAGES, ASK_PAGE].map(({ path, name }) => (
          <li key={path}>
            <NavLink to={path} className={classOf}>
              {name}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
