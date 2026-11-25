import { ASK_PAGE } from '../../../app/stages.js';
import { DEDUCTION_WORDING } from '../../../components/match-text.js';
import type { MatchWording } from '../../../components/match-text.js';
import type { AssistantTask, Question, SingleFact } from '../../../shared.js';

const CONSENT_AI_ON =
  'To understand your message, RentChecker sends it to our server. The server passes it to Google Gemini, which handles it under its own terms. Google may use it to improve its products, and people may review it. Our server does not save it or write it to logs. Your answers to the questions that follow stay in this browser. Please remove names, ID numbers and bank details first.';

const CONSENT_AI_OFF =
  'AI is not set up on this server. RentChecker will send your message to our server, which looks for matching words. It goes to no other service, and the server does not save it or write it to logs. Please remove names, ID numbers and bank details first.';

const FAILED = 'Your message could not be read. Try again, or choose a stage below.';

/** UI.md, assistant. */
export const ASSISTANT_WORDING: MatchWording = {
  ...DEDUCTION_WORDING,
  consentTitle: 'Before we send your message',
  consentAiOn: CONSENT_AI_ON,
  consentAiOff: CONSENT_AI_OFF,
  keywordNotice:
    'AI was not used. Your message was read by matching words, which is less reliable. Check every detail.',
  loading: 'Reading your message. This can take up to 30 seconds.',
  warnings: {
    ...DEDUCTION_WORDING.warnings,
    AI_NOT_CONFIGURED: 'AI is not set up on this server.',
    QUOTE_REJECTED: 'Some details from the AI were not found in your message and were ignored.',
  },
  errors: {
    ...DEDUCTION_WORDING.errors,
    validation: 'Check your message, then try again.',
    too_large: 'Your message is too long to send.',
    rate_limited: 'Too many messages. Try again in a few minutes.',
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

/** Ready-made prompts, one for each kind of help. */
export const EXAMPLES = [
  {
    name: 'Deductions',
    prompt:
      'My landlord kept 12,000 for painting and 3,000 service fee. Deposit was 30,000, rent 15,000 a month, I moved out on 15 June 2026.',
  },
  { name: 'A question', prompt: 'Who pays for painting when I move out?' },
  { name: 'A new lease', prompt: 'I am about to sign a lease. What should I look for?' },
] as const;

interface QuestionText {
  readonly label: string;
  readonly hint: string;
  readonly error: string;
}

const AMOUNT_ERROR = 'Write one amount in rupees, for example 30,000 or 30k.';

/** F9-R8. */
export const QUESTION_TEXT: Readonly<Record<Question, QuestionText>> = {
  deposit: {
    label: 'How much deposit did you pay?',
    hint: 'For example 30,000 or 30k.',
    error: AMOUNT_ERROR,
  },
  monthly_rent: {
    label: 'How much is the rent for one month?',
    hint: 'For example 15,000 or 15k.',
    error: AMOUNT_ERROR,
  },
  handover_date: {
    label: 'On which day did you give the place back?',
    hint: 'For example 15 June 2026.',
    error: 'Write one full date with its year, for example 15 June 2026.',
  },
  deduction: {
    label: 'What did the landlord charge, and how much for each?',
    hint: 'For example painting 12,000, cleaning 2,500.',
    error: 'Write each charge with its amount, for example painting 12,000.',
  },
};

/** F9-R9, in the order of the Details step. */
export const FACT_NAMES: Readonly<Record<SingleFact, string>> = {
  deposit: 'Deposit',
  monthly_rent: 'Monthly rent',
  handover_date: 'Handover date',
  start_date: 'Start date',
  stated_refund: 'Refund the landlord stated',
};

export const FACT_ORDER: readonly SingleFact[] = [
  'deposit',
  'monthly_rent',
  'handover_date',
  'start_date',
  'stated_refund',
];

interface TaskText {
  readonly title: string;
  readonly text: string;
  readonly link: string;
  readonly path: string;
}

/** F9-R12. The tasks that open a page. */
export const TASK_TEXT: Readonly<
  Record<Exclude<AssistantTask, 'check_deductions' | 'out_of_scope'>, TaskText>
> = {
  ask_lease: {
    title: 'You have a question about your lease',
    text: 'Paste your lease on the next page. The answer is a sentence of it, checked word for word.',
    link: ASK_PAGE.name,
    path: ASK_PAGE.path,
  },
  review_lease: {
    title: 'You want to check a lease before you sign',
    text: 'Paste the lease on the next page to see which deposit topics it covers, and what to ask.',
    link: 'Review the lease',
    path: '/lease-review',
  },
  check_bill: {
    title: 'You want to check a metered bill',
    text: 'Enter the readings and the rate on the next page. The amount is worked out again.',
    link: 'Check the bill',
    path: '/tenancy',
  },
  log_repair: {
    title: 'You want to record a repair',
    text: 'Add a dated entry on the next page. You can link it to a deduction when you move out.',
    link: 'Open the repair log',
    path: '/tenancy',
  },
};
