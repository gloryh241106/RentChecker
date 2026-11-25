import type { ReactNode } from 'react';

interface IconProps {
  readonly className?: string | undefined;
}

/** An inline SVG, hidden from assistive technology because the text beside it says it all. */
function makeIcon(shapes: ReactNode) {
  return function Icon({ className = 'size-5 shrink-0' }: IconProps) {
    return (
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        {shapes}
      </svg>
    );
  };
}

export const CalculatorIcon = makeIcon(
  <>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
  </>,
);

export const QuestionIcon = makeIcon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" />
  </>,
);

export const SearchCrossIcon = makeIcon(
  <>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m20 20-4.9-4.9M8 8l5 5M13 8l-5 5" />
  </>,
);

export const ReceiptIcon = makeIcon(<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" />);

export const CheckCircleIcon = makeIcon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12.5 2.8 2.8L16 9.5" />
  </>,
);

export const LeaseIcon = makeIcon(
  <>
    <path d="M13 21H6V3h8l4 4v4M14 3v4h4" />
    <circle cx="16" cy="16" r="3" />
    <path d="m20.5 20.5-2.3-2.3" />
  </>,
);

export const MeterIcon = makeIcon(<path d="M4 17a8 8 0 1 1 16 0M12 17l4-5M4 20h16" />);

export const DoorIcon = makeIcon(<path d="M6 21V4h9v17M3 21h18M15 8h3v13M11.5 12.5h.01" />);

export const MessageIcon = makeIcon(<path d="M4 5h16v11H9l-5 4zM8 9h8M8 12h5" />);

export const LockIcon = makeIcon(
  <>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </>,
);

export const QuoteCheckIcon = makeIcon(<path d="M4 5h16M4 10h10M4 15h6m3 1 3 3 5-6" />);

export const InfoIcon = makeIcon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6M12 7.5h.01" />
  </>,
);

export const WarningIcon = makeIcon(<path d="M12 3 2.5 20h19zM12 10v4.5M12 17.5h.01" />);

export const AlertIcon = makeIcon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.5h.01" />
  </>,
);
