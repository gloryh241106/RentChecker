import { useState } from 'react';
import { Link, Outlet } from 'react-router';
import { DeleteAllDialog } from '../components/DeleteAllDialog.js';
import { NOT_LEGAL_ADVICE } from '../components/not-legal-advice.js';
import { StorageBanner } from '../components/StorageBanner.js';
import { Button } from '../components/ui/Button.js';
import { Announcer } from './Announcer.js';

const SKIP_LINK_CLASS =
  'sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-10 focus:rounded-md focus:bg-primary focus:px-4 focus:py-3 focus:text-on-primary';

/** The frame of every screen: skip link, header, one main, footer. */
export function Layout() {
  const [isDeleting, setIsDeleting] = useState(false);
  return (
    <Announcer>
      <div className="flex min-h-dvh flex-col">
        <a href="#main" className={SKIP_LINK_CLASS}>
          Skip to main content
        </a>
        <header className="border-b border-line bg-raised">
          <div className="mx-auto flex w-full max-w-160 items-center px-4 py-2">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center font-serif text-xl font-bold text-primary no-underline"
            >
              RentChecker
            </Link>
          </div>
        </header>
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-160 flex-1 space-y-6 px-4 py-6"
        >
          <StorageBanner />
          <Outlet />
        </main>
        <footer className="border-t border-line bg-sunken">
          <div className="mx-auto w-full max-w-160 space-y-3 px-4 py-6">
            <p className="text-ink-muted">{NOT_LEGAL_ADVICE}</p>
            <Button variant="secondary" onClick={() => setIsDeleting(true)}>
              Delete everything
            </Button>
          </div>
        </footer>
        <DeleteAllDialog isOpen={isDeleting} onClose={() => setIsDeleting(false)} />
      </div>
    </Announcer>
  );
}
