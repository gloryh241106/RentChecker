import type { ReactNode } from 'react';

interface CardProps {
  readonly children: ReactNode;
  /** A sunken card is used for results that are out of date. */
  readonly isSunken?: boolean;
}

/** A raised sheet, like a page of a form. Used as a list item or a block of one screen. */
export function Card({ children, isSunken = false }: CardProps) {
  const surface = isSunken ? 'bg-sunken' : 'bg-raised';
  return (
    <div className={`space-y-3 rounded-xl border border-line p-4 shadow-xs sm:p-5 ${surface}`}>
      {children}
    </div>
  );
}
