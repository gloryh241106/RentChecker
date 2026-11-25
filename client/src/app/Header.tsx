import { Link, useLocation } from 'react-router';
import { CheckCircleIcon } from '../components/ui/Icon.js';
import { StageNav } from './StageNav.js';

/** UI.md: the app name, and the stage links on every screen except Home, which has its own. */
export function Header() {
  const isHome = useLocation().pathname === '/';
  return (
    <header className="on-band bg-band">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-6 px-4 py-2">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-2 font-serif text-xl font-bold text-on-band no-underline"
        >
          <CheckCircleIcon className="size-6 shrink-0 text-accent" />
          RentChecker
        </Link>
        {isHome ? null : <StageNav />}
      </div>
    </header>
  );
}
