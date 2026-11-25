import { DEDUCTION_WORDING } from './match-text.js';
import type { MatchWording } from './match-text.js';

/** UI.md, Before signing: "each topic" and "the ten topic names" replace the F2 phrases. */
const CONSENT_AI_ON =
  'To find the clause for each topic, RentChecker sends your lease text and the ten topic names to our server. The server passes them to Google Gemini, which handles them under its own terms. Google may use them to improve its products, and people may review them. Our server does not save them or write them to logs. The amounts and dates you typed stay in this browser. Please remove names, ID numbers and bank details from the lease text first.';

const CONSENT_AI_OFF =
  'AI matching is not set up on this server. RentChecker will send your lease text and the ten topic names to our server, which looks for matching words. They go to no other service, and the server does not save them or write them to logs. Please remove names, ID numbers and bank details from the lease text first.';

const MATCHING_FAILED = 'Matching failed. The rows did not change. Try again.';

/** FR-14, F4-R2. The F2 sentences, with the words that name charges changed to topics. */
export const REVIEW_WORDING: MatchWording = {
  ...DEDUCTION_WORDING,
  consentAiOn: CONSENT_AI_ON,
  consentAiOff: CONSENT_AI_OFF,
  warnings: {
    ...DEDUCTION_WORDING.warnings,
    QUOTE_REJECTED:
      'Some quotes from the AI were not found in your lease and were ignored. Those topics show Could not confirm.',
  },
  errors: {
    ...DEDUCTION_WORDING.errors,
    server: MATCHING_FAILED,
    network: MATCHING_FAILED,
    bad_response: MATCHING_FAILED,
    unauthorized: MATCHING_FAILED,
    case_not_found: MATCHING_FAILED,
    conflict: MATCHING_FAILED,
    storage_unavailable: MATCHING_FAILED,
    aborted: MATCHING_FAILED,
  },
};
