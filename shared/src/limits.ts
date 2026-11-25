/** D-4: ₹1,00,00,000. */
export const MAX_AMOUNT_PAISE = 1_000_000_000;

/** D-22: 10,000,000 units, in hundredths. */
export const MAX_READING_HUNDREDTHS = 1_000_000_000;

/** D-22: ₹1,000 per unit. */
export const MAX_RATE_PAISE_PER_UNIT = 100_000;

/** FR-2. */
export const MAX_DEDUCTIONS = 20;

/** F5-R5. */
export const MAX_REPAIRS = 50;

/** DATA_MODEL.md: labels, repair descriptions and reported-to texts. */
export const MAX_SHORT_TEXT_LENGTH = 120;

/** API.md. The minimum is for matching only, because an empty lease is stored as ''. */
export const MIN_MATCH_LEASE_LENGTH = 50;
export const MAX_LEASE_LENGTH = 40_000;
export const MAX_MATCH_ITEMS = 20;

/** F9, API.md. */
export const MIN_PROMPT_LENGTH = 3;
export const MAX_PROMPT_LENGTH = 2_000;
export const MAX_FACTS = 30;
export const MAX_DOUBTS = 5;

/** F2-R4. */
export const MIN_QUOTE_LENGTH = 15;
export const MAX_QUOTE_LENGTH = 600;
