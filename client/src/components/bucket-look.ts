import type { BUCKET_ORDER } from '../shared.js';
import { AlertIcon, CheckCircleIcon, QuestionIcon, ReceiptIcon } from './ui/Icon.js';

interface BucketLook {
  readonly Icon: typeof AlertIcon;
  /** The part of the split bar. */
  readonly fill: string;
  /** The icon beside the bucket name. */
  readonly text: string;
}

/** UI.md: each bucket has its own icon, in the split bar and beside its name. */
export const BUCKET_LOOK: Readonly<Record<(typeof BUCKET_ORDER)[number], BucketLook>> = {
  askAboutPaise: { Icon: AlertIcon, fill: 'bg-danger', text: 'text-danger' },
  awaitingProofPaise: { Icon: ReceiptIcon, fill: 'bg-warning', text: 'text-warning' },
  unclearPaise: { Icon: QuestionIcon, fill: 'bg-info', text: 'text-info' },
  consistentPaise: { Icon: CheckCircleIcon, fill: 'bg-success', text: 'text-success' },
};
