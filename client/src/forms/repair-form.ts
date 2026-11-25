import { repairSchema } from '../shared.js';
import type { Repair } from '../shared.js';
import type { RepairFields } from '../state/actions.js';
import type { FieldErrorCode } from './field-errors.js';
import { errorOf, readDate, readLabel, required, valueOf } from './read-fields.js';

export type RepairField = 'date' | 'description' | 'reportedTo';

export type RepairErrors = Partial<Record<RepairField, FieldErrorCode>>;

/** The text boxes of the repair form, as typed. */
export type RepairDrafts = Readonly<Record<RepairField, string>>;

/** What the form shows for each text box. UI.md During the tenancy. */
export const REPAIR_FIELDS: Readonly<
  Record<RepairField, { readonly label: string; readonly noun: string; readonly hint: string }>
> = {
  date: {
    label: 'Date',
    noun: 'date',
    hint: 'Write the date as YYYY-MM-DD, for example 2026-03-10',
  },
  description: {
    label: 'What was wrong',
    noun: 'description of what was wrong',
    hint: 'For example Damp patch on the bedroom wall',
  },
  reportedTo: {
    label: 'Reported to',
    noun: 'contact you reported it to',
    hint: 'For example Landlord, by WhatsApp',
  },
};

export const REPAIR_FIELD_ORDER: readonly RepairField[] = ['date', 'description', 'reportedTo'];

export function blankRepairDrafts(): RepairDrafts {
  return { date: '', description: '', reportedTo: '' };
}

export function draftsFromRepair({ date, description, reportedTo }: Repair): RepairDrafts {
  return { date, description, reportedTo };
}

function withoutLink({ id, date, description, reportedTo }: Repair): RepairFields {
  return { id, date, description, reportedTo };
}

/** F5-R5. `repair` is set only when every box is fine. A date in the future is accepted. */
export function readRepair(
  drafts: RepairDrafts,
  id: string,
): { repair: RepairFields | null; errors: RepairErrors } {
  const date = required(readDate(drafts.date));
  const description = required(readLabel(drafts.description));
  const reportedTo = required(readLabel(drafts.reportedTo));
  const errors: RepairErrors = {
    date: errorOf(date),
    description: errorOf(description),
    reportedTo: errorOf(reportedTo),
  };
  const parsed = repairSchema.safeParse({
    id,
    date: valueOf(date),
    description: valueOf(description),
    reportedTo: valueOf(reportedTo),
  });
  return { repair: parsed.success ? withoutLink(parsed.data) : null, errors };
}
