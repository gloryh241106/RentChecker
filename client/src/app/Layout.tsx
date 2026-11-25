import { useState } from 'react';
import { Outlet } from 'react-router';
import { DeleteAllDialog } from '../components/DeleteAllDialog.js';
import { NOT_LEGAL_ADVICE } from '../components/not-legal-advice.js';
import { StorageBanner } from '../components/StorageBanner.js';
import { Button } from '../components/ui/Button.js';
import { Announcer } from './Announcer.js';
import { Header } from './Header.js';

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
        <Header />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-6 sm:py-8"
        >
          <StorageBanner />
          <Outlet />
        </main>
        <footer className="border-t border-line bg-sunken">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-prose text-ink-muted">{NOT_LEGAL_ADVICE}</p>
            <Button variant="quietDanger" onClick={() => setIsDeleting(true)}>
              Delete everything
            </Button>
          </div>
        </footer>
        <DeleteAllDialog isOpen={isDeleting} onClose={() => setIsDeleting(false)} />
      </div>
    </Announcer>
  );
}
