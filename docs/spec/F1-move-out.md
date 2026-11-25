# F1 Move-out check

## Goal

The tenant enters the facts of a tenancy and up to 20 deductions, runs the check, and reads a result, its reasons and the totals.

## Covers

FR-1 to FR-7, UC-1, UC-6. Linking repairs covers the link part of FR-16 and UC-5. Clause evidence comes from [F2](F2-clause-matching.md). The repair log itself is in [F5](F5-bills-repairs.md). Results, reasons and totals are defined only in DOMAIN_RULES.md.

## Inputs and outputs

Tenancy facts:

| Field | Required | Note |
|---|---|---|
| Deposit | Yes | Rupees, D-3 and D-4 |
| Monthly rent | Yes | Rupees, D-3 and D-4 |
| Handover date | Yes | D-5 |
| Start date | No | D-5 |
| Refund the landlord stated | No | Rupees, 0 is allowed |
| How the lease charges a partial month | No | Not sure (default), Per day, Full month. Feeds D-20, D-21 and ASSUMED_PER_DAY. "Not sure" is calculated per day (A-3) |
| Handover day does not count | No | Checkbox, off by default. Feeds D-20 |
| Lease text | No | Pasted, handled by F2 |

Each deduction has a label (1 to 120 characters), a kind (D-10), an amount, the extra facts of its kind (D-10) and zero or more linked repair entries.

Output for each deduction: label, kind, amount charged, expected amount when known, the primary result, every reason, the quote when evidence is `verified` or `excludes`, linked repairs, and the buckets of D-40 that are above 0. Output for the tenancy: total deducted and the four case totals (D-41), refundGap (D-42), and the excess over the deposit (D-43).

## Rules

- F1-R1 Amounts follow D-1, D-3 and D-4. Whitespace around the input is trimmed. Every amount is shown in Indian grouping, for example ₹1,30,000, with decimals only when the paise are not 0.
- F1-R2 Dates follow D-5. Rent month is entered as `YYYY-MM`.
- F1-R3 Deposit and monthly rent must be more than 0. Checking needs deposit, monthly rent, handover date and at least one deduction.
- F1-R4 A tenancy has at most 20 deductions. At 20 the add control is disabled and says why.
- F1-R5 The label is required for all four kinds, including rent. Changing the kind clears the facts of the old kind.
- F1-R6 Metered facts: readings are 0 or more with up to 2 decimals, and the current reading is not lower than the previous one (D-22). The rate is entered in rupees per unit, up to 2 decimals. Previous reading, current reading and rate may be left empty, because D-34 handles missing facts. Fixed charge defaults to 0.
- F1-R7 Rent facts: rent month is required. Already paid defaults to 0.
- F1-R8 Each invalid field shows its message next to it. The message is tied to the field for screen readers and says how to fix it. On "Run check" the first invalid field gets focus.
- F1-R9 "Run check" validates, then calculates in the browser with no network call. Every deduction gets one primary result (D-32 to D-36) and all reasons that apply (D-37). Each reason is shown as one plain sentence from a single table in code, shared with F3. No sentence says a charge is legal or illegal.
- F1-R10 Results appear in the order the deductions were entered. Result names are Recalculate, Unclear, Not found in the lease, Needs proof and Supported. A result is never shown by colour alone.
- F1-R11 Totals follow D-40 and D-41. The four case totals add up to total deducted.
- F1-R12 refundGap follows D-42. It has its own line, is not added to "Ask about", and is shown only when it is above 0.
- F1-R13 If D-43 applies, a notice states the excess.
- F1-R14 After a check, any edit to the facts, a deduction, a repair link, the lease text or an evidence state marks the results and totals as out of date. A notice says "Results are out of date. Run the check again." The old values stay visible. "Run check" clears the notice. After a match run that succeeds, the check runs again by itself if results were already shown.
- F1-R15 Editing the lease text resets the evidence of every deduction to `unconfirmed`, whether it came from AI, keywords or the tenant. Editing a deduction's label resets only that deduction's evidence.
- F1-R16 A deduction can link any number of entries from the repair log. An entry is linked to one deduction at most. The card lists each linked entry with its date, description and who it was reported to. REPAIR_REPORTED is decided by D-37. Deleting a repair entry removes its links.
- F1-R17 "Load sample case" fills the case in the worked example of DOMAIN_RULES.md, with per-day charging confirmed and the sample lease below. Evidence is `verified` for Repainting, with the painting sentence as its quote, and `none` for Service fee. Both have source `sample`, shown as "Sample match", and a match run replaces them. A banner says "Sample data" until the tenant deletes everything. If data exists, the tenant confirms before it is replaced.
- F1-R18 Everything is kept in the browser's local storage and restored on reload. If storage is not available, a notice says nothing will be saved and the app still works for the session.
- F1-R19 "Delete everything" asks "Delete all data stored by RentChecker in this browser? This cannot be undone." On confirm it removes the tenancy, both lease texts, evidence, deductions, repair log, bill form and draft message, returns to Home and moves focus to its heading. On cancel nothing changes.

Sample lease:

```text
The monthly rent is Rs 15,000, payable by the 5th of each month.
If the tenant leaves during a month, rent is charged for each day used.
The tenant shall pay for repainting the walls on leaving, against the painter's bill.
The deposit of Rs 30,000 is refunded within 30 days of handover.
```

## Acceptance criteria

- F1-AC1 Given the sample case, when the check runs, then Repainting is Needs proof, June rent is Recalculate with expected ₹7,500, and Service fee is Not found in the lease.
- F1-AC2 Given the sample case checked, then Ask about is ₹10,500, Awaiting proof is ₹12,000, Unclear is ₹0, Consistent is ₹7,500 and total deducted is ₹30,000.
- F1-AC3 Given the sample case checked, then the reasons are RECEIPT_MISSING for Repainting, ABOVE_PRORATED_RENT for June rent, and CLAUSE_NOT_FOUND and AMOUNT_NOT_STATED for Service fee.
- F1-AC4 Given deposit ₹30,000, one deduction of ₹20,000 and a stated refund of ₹7,000, when the check runs, then refundGap is ₹3,000, shown on its own line, and Ask about does not include it.
- F1-AC5 Given deposit ₹30,000 and deductions totalling ₹35,000, then a notice shows an excess of ₹5,000.
- F1-AC6 Given the amount `1,30,000`, then it is accepted and shown as ₹1,30,000. Given `0`, `-5`, `abc` or `1,00,00,001`, then the field is rejected with a message.
- F1-AC7 Given start date 2026-06-20 and handover date 2026-06-15, then the start date is rejected.
- F1-AC8 Given previous reading 120.50 and current reading 110, then the current reading is rejected.
- F1-AC9 Given a checked case, when the handover date changes, then the out-of-date notice appears and the draft message cannot be generated. When "Run check" runs again, then the notice disappears.
- F1-AC10 Given the sample case with `verified` evidence, when one character of the lease text changes, then every deduction shows `unconfirmed` and the next check shows Repainting as Unclear.
- F1-AC11 Given 20 deductions, then the add control is disabled.
- F1-AC12 Given a repair dated 2026-03-10 linked to a deduction with handover 2026-06-15, then the card shows the entry and REPAIR_REPORTED, and the result is the same as without the link.
- F1-AC13 Given stored data, when the tenant confirms "Delete everything", then local storage holds no RentChecker data. When the tenant cancels, then nothing is removed.
- F1-AC14 Given stored data, when the tenant loads the sample, then a confirmation appears before anything is replaced.

## Errors and edge cases

- Stored data that cannot be read is ignored. The app starts empty and says so.
- Running the check with no lease text is allowed. Non-rent deductions then follow D-34.
- Rent with 0 days used shows RENT_OUTSIDE_TENANCY and the amount is asked about in full (D-33, D-40).
- Pressing "Run check" twice gives the same output.
- Labels and lease text are shown as plain text, never as HTML.

## Out of scope

Lease upload or OCR, several tenancies, export or print, sending anything to the landlord, legal opinions, state rules.
