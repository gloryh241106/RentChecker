import type { ApiErrorKind } from '../api/api-error.js';
import type { MatchWarning } from '../shared.js';

/** UI.md Fixed wording. */
export const CONSENT_TITLE = 'Before we send your lease';

export const CONSENT_AI_ON =
  'To find the clause for each charge, RentChecker sends your lease text and the names of your deductions to our server. The server passes them to Google Gemini, which handles them under its own terms. Google may use them to improve its products, and people may review them. Our server does not save them or write them to logs. The amounts and dates you typed stay in this browser. Please remove names, ID numbers and bank details from the lease text first.';

export const CONSENT_AI_OFF =
  'AI matching is not set up on this server. RentChecker will send your lease text and the names of your deductions to our server, which looks for matching words. They go to no other service, and the server does not save them or write them to logs. Please remove names, ID numbers and bank details from the lease text first.';

export const KEYWORD_NOTICE =
  'AI matching was not used. Clauses were found by matching words, which is less reliable. Read each quote. If it is wrong, paste the right quote or say there is no clause.';

export const LOADING_TEXT = 'Finding clauses. This can take up to 30 seconds.';

/** F2-R16. A record over every warning, so a new warning must get a sentence. */
export const WARNING_TEXT: Readonly<Record<MatchWarning, string>> = {
  AI_NOT_CONFIGURED: 'AI matching is not set up on this server.',
  AI_UNAVAILABLE: 'The AI service did not answer.',
  AI_TIMEOUT: 'The AI service took too long.',
  QUOTE_REJECTED:
    'Some quotes from the AI were not found in your lease and were ignored. Those charges show Unclear.',
};

const FAILED =
  'Matching failed. Your calculations still work. Run the check without clauses, or try again.';

/** F2 Errors. Every kind has a sentence. `aborted` is never shown, because the tenant left. */
export const ERROR_TEXT: Readonly<Record<ApiErrorKind, string>> = {
  validation: 'Check the lease text and labels, then try again.',
  too_large: 'The lease text is too long to send.',
  rate_limited: 'Too many checks. Try again in a few minutes.',
  server: FAILED,
  network: FAILED,
  bad_response: FAILED,
  unauthorized: FAILED,
  case_not_found: FAILED,
  conflict: FAILED,
  storage_unavailable: FAILED,
  aborted: FAILED,
};

/** What a caller says around a match run. The review page has its own (Open/Closed). */
export interface MatchWording {
  readonly consentTitle: string;
  readonly consentAiOn: string;
  readonly consentAiOff: string;
  readonly keywordNotice: string;
  readonly loading: string;
  readonly warnings: Readonly<Record<MatchWarning, string>>;
  readonly errors: Readonly<Record<ApiErrorKind, string>>;
}

/** FR-8: deductions. */
export const DEDUCTION_WORDING: MatchWording = {
  consentTitle: CONSENT_TITLE,
  consentAiOn: CONSENT_AI_ON,
  consentAiOff: CONSENT_AI_OFF,
  keywordNotice: KEYWORD_NOTICE,
  loading: LOADING_TEXT,
  warnings: WARNING_TEXT,
  errors: ERROR_TEXT,
};
