import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

interface PageHeadingProps {
  readonly title: string;
  /** The document title, when it differs from the heading. */
  readonly documentTitle?: string;
  /** The heading of Home, which introduces the app. */
  readonly isLarge?: boolean;
}

/**
 * The one h1 of a screen. When the screen changes, focus moves here and the document title
 * follows (UI.md). The first page of a visit has the key `default`, and the browser keeps focus.
 */
export function PageHeading({ title, documentTitle = title, isLarge = false }: PageHeadingProps) {
  const size = isLarge ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl';
  const heading = useRef<HTMLHeadingElement>(null);
  const isFirstPage = useLocation().key === 'default';
  useEffect(() => {
    document.title = `${documentTitle} - RentChecker`;
    if (!isFirstPage) {
      heading.current?.focus();
    }
  }, [documentTitle, isFirstPage]);
  return (
    <h1 ref={heading} tabIndex={-1} className={`font-bold text-balance ${size}`}>
      {title}
    </h1>
  );
}
