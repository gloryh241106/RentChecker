import type { ReactNode } from 'react';
import { AlertIcon, CheckCircleIcon, InfoIcon, WarningIcon } from './Icon.js';

export type Tone = 'info' | 'warning' | 'danger' | 'success';

/** The icon and the text always come together, so colour is never the only signal. */
const TONES: Readonly<
  Record<Tone, { readonly box: string; readonly Icon: typeof InfoIcon; readonly accent: string }>
> = {
  info: { box: 'border-info bg-info-bg', Icon: InfoIcon, accent: 'text-info' },
  warning: { box: 'border-warning bg-warning-bg', Icon: WarningIcon, accent: 'text-warning' },
  danger: { box: 'border-danger bg-danger-bg', Icon: AlertIcon, accent: 'text-danger' },
  success: { box: 'border-success bg-success-bg', Icon: CheckCircleIcon, accent: 'text-success' },
};

interface NoticeProps {
  readonly tone: Tone;
  readonly title?: string;
  readonly children?: ReactNode;
}

export function Notice({ tone, title, children }: NoticeProps) {
  const { box, Icon, accent } = TONES[tone];
  return (
    <div className={`flex gap-3 rounded-md border-l-4 p-4 text-ink ${box}`}>
      <span className={`mt-0.5 ${accent}`}>
        <Icon />
      </span>
      <div className="min-w-0 space-y-2">
        {title === undefined ? null : <p className="font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  );
}
