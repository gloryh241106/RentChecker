import { isAfter, monthOf } from '../dates.js';
import { formatRupees } from '../money.js';
import { formatDateText, formatMonthText } from '../wording/date-text.js';

export const CHECK_CODES = [
  'TWO_VALUES',
  'NOT_READ',
  'DOUBT',
  'DAY_FIRST',
  'START_AFTER_HANDOVER',
  'DATE_FAR',
  'DEPOSIT_SMALL',
  'DEPOSIT_LARGE',
  'REFUND_LARGE',
  'CHARGE_LARGE',
  'TOTAL_LARGE',
  'RENT_LARGE',
  'RENT_LATE',
  'TWICE',
] as const;

export interface InputCheck {
  readonly code: (typeof CHECK_CODES)[number];
  readonly text: string;
}

interface CheckedCharge {
  readonly label: string;
  readonly amountPaise: number;
  /** Only for rent. */
  readonly rentMonth?: string | null;
  readonly kind: string;
}

export interface CheckedInput {
  readonly depositPaise?: number | undefined;
  readonly monthlyRentPaise?: number | undefined;
  readonly statedRefundPaise?: number | undefined;
  readonly handoverDate?: string | undefined;
  readonly startDate?: string | undefined;
  readonly deductions: readonly CheckedCharge[];
}

const MAX_MONTHS_OF_RENT = 12;
const MAX_YEARS_BACK = 10;

type Rule = (input: CheckedInput, today: string) => readonly InputCheck[];

function moveYears(date: string, years: number): string {
  return `${String(Number(date.slice(0, 4)) + years).padStart(4, '0')}${date.slice(4)}`;
}

const dates: Rule = ({ startDate, handoverDate }, today) => {
  const checks: InputCheck[] = [];
  if (handoverDate === undefined) {
    return checks;
  }
  if (startDate !== undefined && isAfter(startDate, handoverDate)) {
    checks.push({
      code: 'START_AFTER_HANDOVER',
      text: `The start date, ${formatDateText(startDate)}, is after the handover date, ${formatDateText(handoverDate)}. The start date is not used.`,
    });
  }
  const isFar =
    isAfter(handoverDate, moveYears(today, 1)) ||
    isAfter(moveYears(today, -MAX_YEARS_BACK), handoverDate);
  if (isFar) {
    checks.push({
      code: 'DATE_FAR',
      text: `The handover date, ${formatDateText(handoverDate)}, is far from today. Check the year.`,
    });
  }
  return checks;
};

const deposit: Rule = ({ depositPaise, monthlyRentPaise, statedRefundPaise }) => {
  if (depositPaise === undefined) {
    return [];
  }
  const checks: InputCheck[] = [];
  const pair = (rent: number): string =>
    `The deposit is ${formatRupees(depositPaise)} and the monthly rent is ${formatRupees(rent)}.`;
  if (monthlyRentPaise !== undefined && depositPaise < monthlyRentPaise) {
    checks.push({
      code: 'DEPOSIT_SMALL',
      text: `${pair(monthlyRentPaise)} Check for a missing zero in the deposit.`,
    });
  }
  if (monthlyRentPaise !== undefined && depositPaise > monthlyRentPaise * MAX_MONTHS_OF_RENT) {
    checks.push({
      code: 'DEPOSIT_LARGE',
      text: `${pair(monthlyRentPaise)} Check for an extra zero in the deposit, or a missing one in the rent.`,
    });
  }
  if (statedRefundPaise !== undefined && statedRefundPaise > depositPaise) {
    checks.push({
      code: 'REFUND_LARGE',
      text: `The refund of ${formatRupees(statedRefundPaise)} is more than the deposit of ${formatRupees(depositPaise)}. Check both.`,
    });
  }
  return checks;
};

const amounts: Rule = ({ depositPaise, deductions }) => {
  if (depositPaise === undefined) {
    return [];
  }
  const large = deductions.filter(({ amountPaise }) => amountPaise > depositPaise);
  if (large.length > 0) {
    return large.map(({ label, amountPaise }) => ({
      code: 'CHARGE_LARGE',
      text: `${label} is ${formatRupees(amountPaise)}, more than the whole deposit of ${formatRupees(depositPaise)}. Check for an extra zero.`,
    }));
  }
  const total = deductions.reduce((sum, { amountPaise }) => sum + amountPaise, 0);
  return total <= depositPaise
    ? []
    : [
        {
          code: 'TOTAL_LARGE',
          text: `The deductions add up to ${formatRupees(total)}, more than the deposit of ${formatRupees(depositPaise)}. Check that each one is a charge against the deposit.`,
        },
      ];
};

const rent: Rule = ({ monthlyRentPaise, handoverDate, deductions }) =>
  deductions
    .filter(({ kind }) => kind === 'rent')
    .flatMap(({ label, amountPaise, rentMonth }) => {
      const checks: InputCheck[] = [];
      if (monthlyRentPaise !== undefined && amountPaise > monthlyRentPaise) {
        checks.push({
          code: 'RENT_LARGE',
          text: `${label} is ${formatRupees(amountPaise)}, more than one month of rent, ${formatRupees(monthlyRentPaise)}. Enter each month of rent as its own deduction.`,
        });
      }
      if (rentMonth && handoverDate !== undefined && isAfter(rentMonth, monthOf(handoverDate))) {
        checks.push({
          code: 'RENT_LATE',
          text: `${label} is for ${formatMonthText(rentMonth)}, after the handover on ${formatDateText(handoverDate)}. Check the month and the date.`,
        });
      }
      return checks;
    });

const twice: Rule = ({ deductions }) =>
  deductions
    .filter(
      ({ label, amountPaise }, index) =>
        deductions.findIndex(
          (each) =>
            each.label.toLowerCase() === label.toLowerCase() && each.amountPaise === amountPaise,
        ) !== index,
    )
    .map(({ label, amountPaise }) => ({
      code: 'TWICE',
      text: `${label}, ${formatRupees(amountPaise)}, is listed more than once. Remove one if it is a repeat.`,
    }));

const RULES: readonly Rule[] = [dates, deposit, amounts, rent, twice];

/** F9-R11. Likely mistakes in the input. They never change a value or a result. */
export function checkInput(input: CheckedInput, today: string): readonly InputCheck[] {
  return RULES.flatMap((rule) => rule(input, today));
}
