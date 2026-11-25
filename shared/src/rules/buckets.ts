import { aboveExpectedPaise, hasClauseState } from './assessment.js';
import type { Assessment } from './assessment.js';
import type { PrimaryResult } from './codes.js';

/** D-40. The four always add up to the amount charged. */
export interface Buckets {
  readonly askAboutPaise: number;
  readonly awaitingProofPaise: number;
  readonly unclearPaise: number;
  readonly consistentPaise: number;
}

const EMPTY_BUCKETS: Buckets = {
  askAboutPaise: 0,
  awaitingProofPaise: 0,
  unclearPaise: 0,
  consistentPaise: 0,
};

function splitRecalculated(assessment: Assessment): Buckets {
  const askAboutPaise = aboveExpectedPaise(assessment);
  // What is left equals expected. Without a confirmed clause it is not yet consistent.
  const restPaise = assessment.amountPaise - askAboutPaise;
  return hasClauseState(assessment, 'unconfirmed', 'excludes')
    ? { ...EMPTY_BUCKETS, askAboutPaise, unclearPaise: restPaise }
    : { ...EMPTY_BUCKETS, askAboutPaise, consistentPaise: restPaise };
}

const SPLIT_BY_RESULT: Readonly<Record<PrimaryResult, (assessment: Assessment) => Buckets>> = {
  not_found: ({ amountPaise }) => ({ ...EMPTY_BUCKETS, askAboutPaise: amountPaise }),
  recalculate: splitRecalculated,
  unclear: ({ amountPaise }) => ({ ...EMPTY_BUCKETS, unclearPaise: amountPaise }),
  needs_proof: ({ amountPaise }) => ({ ...EMPTY_BUCKETS, awaitingProofPaise: amountPaise }),
  supported: ({ amountPaise }) => ({ ...EMPTY_BUCKETS, consistentPaise: amountPaise }),
};

export function splitIntoBuckets(assessment: Assessment, result: PrimaryResult): Buckets {
  return SPLIT_BY_RESULT[result](assessment);
}

function addBuckets(left: Buckets, right: Buckets): Buckets {
  return {
    askAboutPaise: left.askAboutPaise + right.askAboutPaise,
    awaitingProofPaise: left.awaitingProofPaise + right.awaitingProofPaise,
    unclearPaise: left.unclearPaise + right.unclearPaise,
    consistentPaise: left.consistentPaise + right.consistentPaise,
  };
}

/** D-41. */
export function sumBuckets(buckets: readonly Buckets[]): Buckets {
  return buckets.reduce(addBuckets, EMPTY_BUCKETS);
}
