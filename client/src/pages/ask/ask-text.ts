import { DEDUCTION_WORDING } from '../../components/match-text.js';
import type { MatchWording } from '../../components/match-text.js';
import type { EvidenceState } from '../../shared.js';

const CONSENT_AI_ON =
  'To answer your questions, RentChecker sends your lease text and each question you ask to our server. The server passes them to Google Gemini, which handles them under its own terms. Google may use them to improve its products, and people may review them. Our server does not save them or write them to logs. The amounts and dates you typed stay in this browser. Please remove names, ID numbers and bank details from the lease text first.';

const CONSENT_AI_OFF =
  'AI matching is not set up on this server. RentChecker will send your lease text and each question you ask to our server, which looks for matching words. They go to no other service, and the server does not save them or write them to logs. Please remove names, ID numbers and bank details from the lease text first.';

const FAILED = 'The question could not be answered. Try again.';

/** UI.md, Ask your lease. The F2 sentences, with the words that name charges changed. */
export const ASK_WORDING: MatchWording = {
  ...DEDUCTION_WORDING,
  consentAiOn: CONSENT_AI_ON,
  consentAiOff: CONSENT_AI_OFF,
  keywordNotice:
    'AI matching was not used. The sentence was found by matching words, which is less reliable. Read the quote before you rely on it.',
  loading: 'Reading your lease. This can take up to 30 seconds.',
  warnings: {
    ...DEDUCTION_WORDING.warnings,
    QUOTE_REJECTED: 'The quote from the AI was not found in your lease and was ignored.',
  },
  errors: {
    ...DEDUCTION_WORDING.errors,
    validation: 'Check the lease text and the question, then try again.',
    rate_limited: 'Too many questions. Try again in a few minutes.',
    server: FAILED,
    network: FAILED,
    bad_response: FAILED,
    unauthorized: FAILED,
    case_not_found: FAILED,
    conflict: FAILED,
    storage_unavailable: FAILED,
    aborted: FAILED,
  },
};

const LEASE_SAYS = 'The lease says:';

/** F7-R4. */
export const ANSWER_TEXT: Readonly<Record<EvidenceState, string>> = {
  verified: LEASE_SAYS,
  excludes: LEASE_SAYS,
  none: 'No clause about this was found in the lease you pasted.',
  unconfirmed: 'An answer could not be confirmed.',
};
