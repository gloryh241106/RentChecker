import { Notice } from './Notice.js';

/** One problem, with the id of the field it is about. */
export interface Problem {
  readonly fieldId: string;
  readonly label: string;
  readonly message: string;
}

interface ErrorSummaryProps {
  readonly problems: readonly Problem[];
}

export function problemCountText(count: number): string {
  return count === 1 ? '1 problem' : `${count} problems`;
}

function focusField(fieldId: string): void {
  document.getElementById(fieldId)?.focus();
}

/** UI.md: each problem is a link to its field. Nothing is shown when there is none. */
export function ErrorSummary({ problems }: ErrorSummaryProps) {
  if (problems.length === 0) {
    return null;
  }
  return (
    <Notice
      tone="danger"
      title={`There ${problems.length === 1 ? 'is' : 'are'} ${problemCountText(problems.length)}`}
    >
      <ul className="list-disc space-y-1 pl-5">
        {problems.map(({ fieldId, label, message }) => (
          <li key={fieldId}>
            <a
              href={`#${fieldId}`}
              className="inline-block min-h-11 py-2 font-medium text-danger underline"
              onClick={(event) => {
                event.preventDefault();
                focusField(fieldId);
              }}
            >
              {label}: {message}
            </a>
          </li>
        ))}
      </ul>
    </Notice>
  );
}
