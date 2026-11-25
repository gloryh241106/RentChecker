# F5 Bills and repairs

## Goal

The tenant recalculates a metered bill from readings and rate, and keeps a dated repair log that F1 can link to a deduction.

## Covers

FR-15, FR-16, UC-4, UC-5. Linking from the deduction side is in [F1](F1-move-out.md) (F1-R16).

## Inputs and outputs

Bill check input: previous reading, current reading, rate in rupees per unit, fixed charge (default 0), and the bill total. All but the fixed charge are required.

Bill check output: the expected amount from D-22, the bill total, the difference, and the reasons ABOVE_METER_TOTAL, BELOW_EXPECTED or MATCHES as defined in D-37.

Repair entry: date, description (1 to 120 characters), reported to (1 to 120 characters, for example "Landlord, by WhatsApp").

Repair log output: the entries in date order, oldest first.

## Rules

- F5-R1 Readings, rate, fixed charge and bill total follow D-1, D-3, D-4 and D-22, including the rule that the current reading cannot be lower than the previous one. Amounts are shown as in F1-R1.
- F5-R2 "Check bill" validates the fields, then calculates in the browser with no network call. A missing required field is rejected next to the field, as in F1-R8.
- F5-R3 The output uses D-22 for the expected amount and D-37 for the reason. It shows no primary result, because D-32 to D-36 apply to deductions only.
- F5-R4 The bill form values are kept in local storage and removed by "Delete everything" (F1-R19).
- F5-R5 A repair entry needs a valid date (D-5), a description and a reported-to text. Entries can be edited and deleted. The log holds at most 50 entries.
- F5-R6 A repair entry can be linked to one deduction in F1. A linked entry adds only the reason REPAIR_REPORTED when D-37 says so. It never changes a result, an amount or a total.
- F5-R7 Deleting an entry removes its links. A notice in F1 marks results as out of date (F1-R14).
- F5-R8 Repair text is plain text and never leaves the browser. F5 sends nothing to the server.

## Acceptance criteria

- F5-AC1 Given previous 1,200.00, current 1,350.50, rate ₹7.50 per unit, fixed charge ₹100 and bill total ₹1,300, then expected is ₹1,228.75 and the reason is ABOVE_METER_TOTAL.
- F5-AC2 Given the same readings and a bill total of ₹1,228.75, then the reason is MATCHES.
- F5-AC3 Given the same readings and a bill total of ₹1,000, then the reason is BELOW_EXPECTED.
- F5-AC4 Given current reading 1,100 and previous reading 1,200, then the current reading is rejected.
- F5-AC5 Given a missing rate, then the rate field shows a message and no amount is shown.
- F5-AC6 Given an entry dated 2026-03-10 linked to a deduction with handover 2026-06-15, then F1 shows REPAIR_REPORTED and the result is unchanged. Given an entry dated 2026-07-01, then no reason is added.
- F5-AC7 Given three entries dated 2026-05-01, 2026-03-10 and 2026-04-02, then the log lists 2026-03-10, 2026-04-02, 2026-05-01.
- F5-AC8 Given a log with 50 entries, then the add control is disabled and says why.
- F5-AC9 Given a linked entry, when it is deleted, then the link is gone and the F1 results are marked out of date.

## Errors and edge cases

- Current reading equal to previous gives 0 units. Expected is then the fixed charge.
- A date in the future is accepted.
- Stored data that cannot be read follows F1. The log starts empty.

## Out of scope

Tiered or slab tariffs, photos or files, reminders, sending a repair request, saving bill history, adding a bill as a deduction.
