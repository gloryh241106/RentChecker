# Software requirements

This file says what RentChecker must do. Calculations and results are defined only in [DOMAIN_RULES.md](DOMAIN_RULES.md). Technology choices belong in `docs/design/`.

## Scope

RentChecker helps a tenant compare each charge with their lease, recalculate what can be recalculated, and write a message asking about the rest.

The user is a tenant in India with a written lease. They are not a lawyer and may be using a phone. There is one user role and no login.

### In scope

- One tenancy at a time, kept in the user's browser.
- An optional cloud copy in PostgreSQL, opened with a recovery code.
- Moving-out deductions, lease review before signing, monthly bill check, repair log.
- Questions about the pasted lease, answered only with its own words.
- Reading the charges out of a landlord's pasted message.
- English lease text pasted by the user, and amounts in Indian rupees.

### Out of scope

- Payments, accounts, landlord access, chat, sending messages.
- File upload, OCR, photo comparison, checking that a receipt is genuine.
- Legal advice, state law, or deciding who is right.
- Storing lease text on a server.

Anything not listed under "In scope" needs a change to this file before it is built.

## Use cases

| ID | Use case | Main steps | Feature |
|---|---|---|---|
| UC-1 | Check moving-out deductions | Enter tenancy facts, paste lease, add deductions, run the check, read results | [F1](F1-move-out.md), [F2](F2-clause-matching.md) |
| UC-2 | Draft a message | Open results, review the draft, edit, copy | [F3](F3-draft-message.md) |
| UC-3 | Review a lease before signing | Paste lease, run the review, copy questions | [F4](F4-before-signing.md), [F2](F2-clause-matching.md) |
| UC-4 | Check a monthly bill | Enter readings, rate and total, read the recalculated amount | [F5](F5-bills-repairs.md) |
| UC-5 | Keep a repair log | Add a dated entry, link it to a deduction later | [F5](F5-bills-repairs.md), [F1](F1-move-out.md) |
| UC-6 | Delete everything | Choose delete, confirm, all stored data is removed | [F1](F1-move-out.md) |
| UC-7 | Keep a cloud copy | Turn on cloud save, keep the recovery code, open the case on another device, delete the copy | [F6](F6-cloud-save.md) |
| UC-8 | Ask about the lease | Type or choose a question, read the sentence of the lease, copy the questions without an answer | [F7](F7-ask-lease.md), [F2](F2-clause-matching.md) |
| UC-9 | Read the landlord's message | Paste the message, check the charges found, add them | [F8](F8-read-message.md), [F1](F1-move-out.md) |

## Functional requirements

Must = needed for the first submission. Should = built if time allows.

| ID | Requirement | Priority | Feature |
|---|---|---|---|
| FR-1 | The user can enter the deposit, monthly rent, handover date and, optionally, the tenancy start date, the refund the landlord stated, how the lease charges a partial month and whether the handover day counts | Must | F1 |
| FR-2 | The user can add, edit and remove up to 20 deductions of the four kinds in D-10 | Must | F1 |
| FR-3 | Invalid input is rejected next to the field, with a message saying how to fix it | Must | F1 |
| FR-4 | Each deduction gets one primary result and all reasons that apply | Must | F1 |
| FR-5 | The user sees the four totals in D-40 and they add up to the total deducted | Must | F1 |
| FR-6 | The user can delete all stored data after confirming | Must | F1 |
| FR-7 | The app can load a sample case, clearly marked as sample data | Must | F1 |
| FR-8 | The user can paste lease text and ask the app to find a related clause for each deduction | Must | F2 |
| FR-9 | A quote is shown only if it was found in the pasted lease | Must | F2 |
| FR-10 | When AI matching is unavailable, the app uses keyword matching and says so | Must | F2 |
| FR-11 | The user can overrule a match by pasting a quote from the lease or by confirming there is no clause | Must | F2 |
| FR-12 | Before lease text leaves the browser, the app says where it goes and asks the user to continue | Must | F2 |
| FR-13 | The app drafts a message from the results, which the user can edit and copy | Must | F3 |
| FR-14 | The app reviews a lease against a fixed list of deposit topics and suggests questions | Should | F4 |
| FR-15 | The app recalculates a metered bill from readings and rate | Should | F5 |
| FR-16 | The user can record dated repairs and link them to a deduction | Should | F5 |
| FR-17 | The user can choose to save the case to the cloud and gets a recovery code | Should | F6 |
| FR-18 | The user can open a saved case with its recovery code | Should | F6 |
| FR-19 | The user can delete the cloud copy | Should | F6 |
| FR-20 | The user can ask a question about the pasted lease and gets the sentence that answers it, or is told that none was found | Should | F7 |
| FR-21 | The user can paste the landlord's message and add the charges found in it after checking them | Should | F8 |

## Non-functional requirements

| ID | Requirement | How it is checked |
|---|---|---|
| NFR-1 Security | No secret reaches the browser or the repository. Every request is validated and limited in size and rate | Tests, search of the built client |
| NFR-2 Privacy | The server never logs lease text, labels, quotes or recovery codes, and never stores lease text or quotes. It stores labels only in a case the user chose to save | Code review, test on the logger |
| NFR-3 Reliability | A failed or slow AI call never blocks the calculations | Test with the AI client failing |
| NFR-4 Correctness | Every rule ID in DOMAIN_RULES.md has at least one test | [CASES.md](../testing/CASES.md) |
| NFR-5 Accessibility | WCAG 2.2 AA for the main flow: keyboard, visible focus, labels, contrast, announced errors | Manual pass, automated check |
| NFR-6 Efficiency | One AI request per check, however many deductions. One more only when the AI service is overloaded (BACKEND.md). Calculations run without a network call | Test, code review |
| NFR-7 Maintainability | TypeScript strict mode, no `any`, lint and type check pass | Build |
| NFR-8 Size | Repository under 10 MB, one branch | Manual |
| NFR-9 Data access | A saved case can be read, changed or deleted only with its recovery code. Only a hash of the code is stored | Tests against a real PostgreSQL engine |

## Assumptions

| ID | Assumption |
|---|---|
| A-1 | The user pastes the whole lease. A missing page can cause a wrong "Not found" |
| A-2 | The user reports receipts, readings and payments truthfully |
| A-3 | Partial months are charged per calendar day unless the user says the lease differs |
| A-4 | The handover day counts as a day of use unless the user says otherwise |
| A-5 | A verified quote proves that the words are in the lease. It does not prove what they mean in law |
