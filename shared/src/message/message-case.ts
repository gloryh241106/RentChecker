// Builds the message for a case in the style of shared/test-support/cases.ts.
import { buildInput } from '../../test-support/cases.js';
import type { Charge } from '../../test-support/cases.js';
import { evaluate } from '../rules/evaluate.js';
import type { Repair } from '../schemas/repair.js';
import type { CheckableTenancy } from '../schemas/tenancy.js';
import { buildMessage } from './build-message.js';
import type { MessageInput } from './build-message.js';

export interface MessageOptions {
  /** The quote of charge n, by index. Charges without one have none. */
  readonly quotes?: Readonly<Record<number, string>>;
  readonly repair?: Partial<Pick<Repair, 'description' | 'reportedTo'>>;
}

export function messageInput(
  tenancy: Partial<CheckableTenancy>,
  charges: readonly Charge[],
  options: MessageOptions = {},
): MessageInput {
  const base = buildInput(tenancy, charges);
  return {
    ...base,
    evidence: base.evidence.map((item, index) => ({
      ...item,
      quote: options.quotes?.[index] ?? null,
    })),
    repairs: base.repairs.map((repair) => ({
      description: 'Leaking tap',
      reportedTo: 'the caretaker',
      ...options.repair,
      ...repair,
    })),
  };
}

export function messageFor(
  tenancy: Partial<CheckableTenancy>,
  charges: readonly Charge[],
  options: MessageOptions = {},
): string | null {
  const input = messageInput(tenancy, charges, options);
  return buildMessage(input, evaluate(input));
}
