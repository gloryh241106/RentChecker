# F2 Clause matching

## Goal

The app finds, for each item, the lease sentence that covers or rules out the charge, and shows it only after the server has confirmed that the sentence is in the pasted lease.

## Covers

FR-8 to FR-12, UC-1, UC-3. Also NFR-3 (a failed match never blocks calculations) and NFR-6 (one AI request per match run). Used by F1 for deductions and by [F4](F4-before-signing.md) for review topics. The route is in API.md.

## Inputs and outputs

Input: the lease text and a list of items. For F1 the items are all deductions except `rent` (D-31), one item per deduction, with the deduction's label.

Output: one evidence state per item (D-30) with a quote for `verified` and `excludes`, the mode used (`ai` or `keyword`), and any warnings. Each item also shows who set the state: the AI, a keyword match or the tenant.

Each match run is one request to `POST /api/clauses/match`. Limits (lease length, 1 to 20 items, label length, request rate) are those in API.md, and the app checks them before sending.

## Rules

- F2-R1 Matching starts only when the lease text is 50 to 40,000 characters after trimming and there is at least one item. Otherwise the button is disabled and says why.
- F2-R2 One match run sends one request for all items. The button is disabled while a run is in progress.
- F2-R3 Before each request, a notice says that the lease text and the labels go through the server to an AI service, that the AI provider may use them to improve its products and people may review them, that the server does not save or log them, and that the tenant should remove names, ID numbers and bank details first. The tenant chooses "Continue" or "Cancel". On Cancel nothing is sent. If `/api/health` reports that AI is not configured, the notice instead says the text goes to the server for keyword matching only.
- F2-R4 Quote check. Normalise the lease and the quote the same way: Unicode NFKC, curly quotes to straight quotes, runs of whitespace to one space, lower case, trim. The quote passes if it is 15 to 600 characters after normalising and is a substring of the normalised lease. The text shown to the tenant is the quote as returned, trimmed.
- F2-R5 AI matching returns per item one of `covers`, `excludes` or `none`, plus a quote. The server maps it: `covers` with a passing quote is `verified`, `excludes` with a passing quote is `excludes`, `none` is `none` with no quote. A `covers` or `excludes` answer whose quote fails the check, or has no quote, is `unconfirmed` with warning QUOTE_REJECTED. One warning is returned however many quotes fail.
- F2-R6 An item missing from the AI answer is `unconfirmed`. An answer for an ID that is not in the request is ignored. Any other value than the three above makes the item `unconfirmed`. If an ID is answered twice, the first answer is used. The AI never supplies amounts or results.
- F2-R7 Keyword matching runs on the server when AI is not configured, fails or times out (AI_NOT_CONFIGURED, AI_UNAVAILABLE, AI_TIMEOUT). It returns only `verified` or `unconfirmed`. The app says that keyword matching was used and why.
- F2-R8 Keyword algorithm. Lower-case the text and split it into words of letters and digits. Split the lease into sentences at `.`, `!`, `?`, `;` followed by whitespace, and at line breaks (a page break copied from a PDF counts as one). Only sentences that are 15 to 600 characters after normalising are candidates. Item words are the words of the label without stop words. If an item word is in a topic group below, all words of that group are added. The score of a sentence is the number of distinct item words in it. The best sentence needs a score of at least 1.
- F2-R9 Keyword outcome. If the best sentence is tied with another, or no sentence scores, the item is `unconfirmed`. If the best sentence contains any of the words not, cannot, no, never, without, except, unless, or a word that ends in n't, the item is `unconfirmed`. Otherwise the item is `verified` and the quote is that sentence. A keyword match is labelled "Keyword match, read the quote".
- F2-R10 Stop words: a, an, the, of, to, for, and, or, in, on, at, by, is, are, be, shall, will, may, any, all, from, as, this, that, with, charges, charge.
- F2-R11 Topic groups: painting (paint, painting, repaint, repainting, whitewash, distemper); cleaning (clean, cleaning, cleaned, sweep, housekeeping); repair (repair, repairs, repairing, fix, fixing, damage, damages, replace, replacement); rent (rent, rental, monthly, month, day, days, daily); electricity (electricity, electric, power, unit, units, meter); water (water, meter, supply); maintenance (maintenance, society, service, upkeep); notice (notice, vacate, vacating, terminate, termination); deposit (deposit, security, refund, refundable, advance).
- F2-R12 Manual override, paste a quote. The tenant can paste a quote for an item. It must pass the F2-R4 check against the current lease, run in the browser. If it passes, the state is `verified` with that quote. If not, the item is unchanged and the field shows "That text was not found in the lease. Paste it exactly as written."
- F2-R13 Manual override, no clause. The tenant can confirm there is no clause. The state is `none`.
- F2-R14 An override wins over a match run and is not changed by a later run. "Remove override" returns the item to `unconfirmed`. Editing the lease text removes every override and every state (F1-R15).
- F2-R15 Lease text, labels and quotes are untrusted data. The server keeps the lease text apart from its instructions, accepts only the answer shape above, and never acts on instructions found in them. The app shows them as plain text. The server does not store or log them (NFR-2).
- F2-R16 Each warning has a plain sentence next to the mode notice. QUOTE_REJECTED says that some AI quotes were not found in the lease and were ignored.

## Acceptance criteria

- F2-AC1 Given the lease sentence "The tenant shall pay for painting on exit." and the AI answer `covers` with the quote "The tenant shall pay for painting on exit", when the response is built, then the item is `verified`, `source` is `ai` and the quote is shown.
- F2-AC2 Given the lease above and the quote "pay for paintin" (15 characters), then it passes. Given "pay for painti" (14), then it is rejected and the item is `unconfirmed` with QUOTE_REJECTED.
- F2-AC3 Given a lease that writes The Tenant’s  Duty to Paint with a curly apostrophe and two spaces, and a quote "the tenant's duty to paint" with a straight apostrophe and one space, then the quote passes.
- F2-AC4 Given a quote that is not in the lease, then the item is `unconfirmed` and QUOTE_REJECTED is returned once.
- F2-AC5 Given an AI answer `none` for item d2, then d2 is `none` with a `null` quote and the F1 result is Not found in the lease.
- F2-AC6 Given three items and an AI answer for two of them plus an unknown ID, then there are three matches in request order, the missing one is `unconfirmed` and the unknown ID is dropped.
- F2-AC7 Given AI is not configured, then `mode` is `keyword`, the warning is AI_NOT_CONFIGURED and the app says keyword matching was used.
- F2-AC8 Given keyword mode, the item "Repainting" and exactly one sentence "The tenant shall pay for painting on exit.", then the item is `verified` with that sentence.
- F2-AC9 Given keyword mode and the best sentence "The tenant shall not pay for painting.", then the item is `unconfirmed`.
- F2-AC10 Given keyword mode and two sentences with the same top score, then the item is `unconfirmed`.
- F2-AC11 Given a `verified` item and a manual "no clause" override, when matching runs again, then the item stays `none`.
- F2-AC12 Given the tenant cancels the consent notice, then no request is sent and the states do not change.
- F2-AC13 Given the AI client fails, when the tenant runs the F1 check, then the calculations still run (NFR-3).
- F2-AC14 Given a lease of 49 characters, then matching cannot start.

## Errors and edge cases

- 400 VALIDATION_ERROR: the app shows "Check the lease text and labels, then try again." States do not change.
- 413 PAYLOAD_TOO_LARGE: the app says the lease text is too long.
- 429 RATE_LIMITED: the app says "Too many checks. Try again in a few minutes."
- 500 INTERNAL_ERROR, a network failure, or no answer within 30 seconds: the app says matching failed. States do not change and calculations stay available. No retry runs by itself.
- A quote that appears twice in the lease passes.
- An AI quote that joins two sentences passes if the check passes.
- The consent notice also covers keyword mode, because the text still reaches the server.

## Out of scope

Retries, other than those after 503 or a slow call (BACKEND.md), streaming, a client-side keyword fallback when the server is unreachable, stemming, languages other than English, deciding what a clause means in law.
