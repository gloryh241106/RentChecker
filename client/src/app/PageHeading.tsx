import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

interface PageHeadingProps {
  readonly title: string;
  /** The document title, when it differs from the heading. */
  readonly documentTitle?: string;
}

/**
 * The one h1 of a screen. When the screen changes, focus moves here and the document title
 * follows (UI.md). The first page of a visit has the key `default`, and the browser keeps focus.
 */
export function PageHeading({ title, documentTitle = title }: PageHeadingProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  const isFirstPage = useLocation().key === 'default';
  useEffect(() => {
    document.title = `${documentTitle} - RentChecker`;
    if (!isFirstPage) {
      heading.current?.focus();
    }
  }, [documentTitle, isFirstPage]);
  return (
    <h1 ref={heading} tabIndex={-1} className="text-3xl font-bold text-ink">
      {title}
    </h1>
  );
}
