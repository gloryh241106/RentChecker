# F4 Before signing

## Goal

The tenant pastes a lease before signing and sees, for ten fixed deposit topics, whether the lease has a clause and what to ask when it does not.

## Covers

FR-14, UC-3. Matching, the consent notice and the quote check are those of [F2](F2-clause-matching.md).

## Inputs and outputs

Input: lease text, kept in its own field and not shared with the F1 lease text.

Output: one row for each of the ten topics below, and a list of questions to copy.

| Topic | Question to ask when no clause is confirmed |
|---|---|
| Deposit amount | How much is the deposit and when is it paid? |
| Refund deadline | By what date will the deposit be refunded after I hand over? |
| Partial-month rent | How is rent charged if I leave part way through a month? |
| Painting | Who pays for painting, and is it a fixed amount or the actual cost? |
| Cleaning | Is cleaning charged when I leave, and how much? |
| Repairs and wear | Which repairs can be deducted, and is normal wear and tear excluded? |
| Notice period | How much notice must I give, and what happens if I give less? |
| Receipts or itemised statement | Will you give an itemised statement and receipts for any deduction? |
| Handover inspection | Will we inspect the home together at handover and record its condition? |
| Meter charges | How are electricity and water charged, and at what rate? |

## Rules

- F4-R1 The topics and questions are fixed, in the order above. Each topic is one match item with a fixed ID and the topic name as its label.
- F4-R2 "Run review" is enabled under the same conditions as F2-R1 and uses the same request, consent notice, mode notice and warnings (F2-R2, F2-R3, F2-R7, F2-R16).
- F4-R3 Each topic shows one of four outcomes from the evidence state (D-30). `verified` is "Found" with the quote. `none` is "Not found" with the question. `unconfirmed` is "Could not confirm" with the question. `excludes` is "Lease may rule this out" with the quote and the question.
- F4-R4 "Found" means only that the words are in the lease. The page says "A found clause is not a check that its terms are fair."
- F4-R5 "Copy questions" copies the questions for every topic that is not "Found", one per line, in topic order. If every topic is "Found", the button is replaced by "Every topic has a clause. Read each quote to check the terms."
- F4-R6 Manual overrides work as in F2-R12 and F2-R13, for each topic.
- F4-R7 Editing the lease text clears all topic outcomes (as F1-R15). Results and the lease text are kept in local storage and removed by "Delete everything" (F1-R19).
- F4-R8 No amount, result or total is computed in F4.

## Acceptance criteria

- F4-AC1 Given a lease with a sentence about a ₹30,000 deposit and AI answers `covers` with a passing quote for "Deposit amount", then that row shows "Found" and the quote.
- F4-AC2 Given AI answers `none` for "Painting", then the row shows "Not found" and the painting question.
- F4-AC3 Given a failed quote for "Cleaning", then the row shows "Could not confirm" and QUOTE_REJECTED is shown.
- F4-AC4 Given keyword mode, then every row is "Found" or "Could not confirm" and the mode notice says keyword matching was used.
- F4-AC5 Given six topics are not "Found", then "Copy questions" copies six lines in topic order.
- F4-AC6 Given the tenant cancels the consent notice, then nothing is sent and the rows do not change.
- F4-AC7 Given a lease of 49 characters, then "Run review" is disabled.

## Errors and edge cases

- Request errors and timeouts are handled as in the F2 errors list. Rows do not change.
- Keyword mode has no word group for receipts or handover inspection, so those rows match on the words of the topic name only and are often "Could not confirm".

## Out of scope

Scoring or grading a lease, advice on whether to sign, comparing leases, topics chosen by the user.
