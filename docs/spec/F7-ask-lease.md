# F7 Ask your lease

## Goal

The tenant asks a question in their own words and sees the sentence of the lease that answers it, or that no clause was found.

## Covers

FR-20, UC-8. The request, the quote check and keyword matching are those of [F2](F2-clause-matching.md).

## Inputs and outputs

Input: the lease text of Moving out (F1), and a question of 1 to 120 characters.

Output: for each question, the quote or a sentence saying that none was found, and a list of the questions without an answer to copy.

## Rules

- F7-R1 "Ask" is enabled when the lease text meets F2-R1. An empty question or one over 120 characters is rejected next to the field.
- F7-R2 Each question is one match item and one request (`POST /api/clauses/match`). The question is the label. The server and its prompt are the same as for F2, so the question is untrusted data (F2-R15).
- F7-R3 The consent notice of F2-R3 is shown before the first question about a lease text. Later questions about the same text in the same visit are sent without it. A changed lease text, or leaving the page, asks again. On Cancel nothing is sent.
- F7-R4 An answer is the quote, word for word. `verified` and `excludes` show "The lease says:" with the quote and its source tag. `none` shows "No clause about this was found in the lease you pasted." `unconfirmed` shows "An answer could not be confirmed." The app adds no explanation, opinion or advice.
- F7-R5 Suggested questions come from what the tenant entered, by code. First one for each deduction other than rent (at most 3), then one for the latest repair, then the fixed questions below. Questions over 120 characters and questions already answered are left out, and at most 5 are shown. Pressing one asks it.
- F7-R6 The newest answer is first, and at most 20 are kept. Answers are kept in memory only. They go when the lease text changes or the page is left.
- F7-R7 "Copy questions" copies the questions whose answer is not a quote, one per line, oldest first.
- F7-R8 The sample lease button works as in F4-R9. Editing the lease here is the same as on the Lease step (F1-R15).
- F7-R9 A failed request keeps the answers and offers "Try again". The mode notice and warnings are those of F2-R7 and F2-R16. A question cannot be asked while another one is running.

Fixed questions: "When is the deposit refunded?", "How much notice must I give?", "Can the rent increase?", "Who pays for repairs?", "Is there a lock-in period?"

## Acceptance criteria

- F7-AC1 Given a lease and an answer `verified` with a passing quote, when the tenant asks, then the question is shown with "The lease says:" and the quote.
- F7-AC2 Given the first question, when the tenant presses Cancel, then nothing is sent. When they ask again and continue, one request is sent. The next question sends one request with no notice.
- F7-AC3 Given answers `none` and `unconfirmed`, then the two sentences of F7-R4 are shown and "Copy questions" copies both questions.
- F7-AC4 Given a deduction "Repainting", then "Can the landlord charge me for Repainting?" is suggested, and it is not suggested after it was answered.
- F7-AC5 Given answers, when the lease text changes, then the answers go and the next question asks for consent again.
- F7-AC6 Given an empty question, then the field shows a message and nothing is sent.

## Out of scope

Explaining a clause, answers that combine clauses, follow-up context between questions, storing questions.
