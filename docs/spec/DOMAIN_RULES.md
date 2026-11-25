# Domain rules

This is the only place that defines calculations, results and totals. Code and tests use these IDs.

## Money and dates

- **D-1** Amounts are stored as whole paise (₹1 = 100 paise). Calculations never use fractional rupees.
- **D-2** A division is rounded to the nearest paisa, with halves rounded up.
- **D-3** Accepted rupee input: optional `₹`, digits, up to 2 decimals. Commas between digits are ignored, so Indian and Western grouping both work. Examples: `15000`, `15,000`, `1,30,000`, `₹15,000.50`. Negative numbers and anything else are rejected.
- **D-4** A single amount is at most ₹1,00,00,000 (1,000,000,000 paise). A deduction must be more than 0.
- **D-5** Dates are calendar dates written `YYYY-MM-DD`, with no time or time zone. The start date, if given, is not after the handover date.

## Kinds of deduction

- **D-10** Every deduction has one kind:

| Kind | Used for | Extra facts |
|---|---|---|
| `rent` | Rent for one month | `rentMonth` (`YYYY-MM`), `alreadyPaidPaise` (default 0) |
| `metered` | Electricity, water | `previousReading`, `currentReading`, `ratePaisePerUnit`, `fixedChargePaise` (default 0) |
| `fixed_fee` | Service, maintenance or other set fee | `leaseAmountPaise`, if the lease states it |
| `cost` | Painting, cleaning, repair | `receiptAmountPaise`, if a receipt was given |

## Expected amount

- **D-20 Rent.** Days used are the days of `rentMonth` from the later of day 1 and the start date, to the earlier of the last day and the handover date, both included. If the month contains the handover date and the user says the handover day does not count, subtract 1. Never go below 0. "0 days used" and "partial month" below refer to the number after this step. A partial month has at least 1 day used and fewer than `daysInMonth`.
  `expected = max(0, round(monthlyRent × daysUsed ÷ daysInMonth) − alreadyPaid)`
- **D-21 Rent charged by the full month.** If the user says the lease charges a full month, `round(...)` is replaced by `monthlyRent` whenever `daysUsed` is more than 0.
- **D-22 Metered.** Readings have up to 2 decimals, are stored as hundredths and are at most 10,000,000 units. The current reading cannot be lower than the previous one. The rate is at most ₹1,000 per unit. These limits keep every product a safe integer.
  `expected = round((current − previous) × rate ÷ 100) + fixedCharge`
- **D-23 Fixed fee.** Expected is `leaseAmountPaise` if given, otherwise unknown.
- **D-24 Cost.** Expected is `receiptAmountPaise` if given, otherwise unknown.
- **D-25 Duplicate.** A deduction is a duplicate if an earlier one in the list has the same kind and the same `rentMonth` (for rent), or the same kind, label and amount (for the others). Labels are compared without case or extra spaces. A duplicate's expected amount is 0.

## Clause evidence

- **D-30** Each deduction has one evidence state:

| State | Meaning |
|---|---|
| `verified` | A quote was found in the pasted lease and it covers the charge |
| `excludes` | A quote was found in the pasted lease and it appears to rule the charge out |
| `none` | AI matching or the user reported that no clause covers it |
| `unconfirmed` | No lease was pasted, matching has not run, a quote failed the check, or keyword matching found nothing |

- **D-31** Rent does not need a clause, because the user enters the monthly rent. For `rent`, evidence never changes the result.

## Primary result

Rules are tried in this order and the first match wins.

| ID | Result | Condition |
|---|---|---|
| **D-32** | `not_found` | Kind is not `rent` and evidence is `none` |
| **D-33** | `recalculate` | It is a duplicate, or expected is known and the amount is higher than expected |
| **D-34** | `unclear` | Kind is not `rent` and evidence is `unconfirmed` or `excludes`, or the kind is `metered` and a reading or rate is missing |
| **D-35** | `needs_proof` | Kind is `cost` without a receipt, or `fixed_fee` without a lease amount |
| **D-36** | `supported` | Everything else |

## Reasons

- **D-37** Every reason that applies is listed, whatever the primary result is.

| Code | Applies when |
|---|---|
| `DUPLICATE_CHARGE` | D-25 |
| `ABOVE_PRORATED_RENT` | Rent, not a duplicate, days used above 0, amount above expected |
| `RENT_OUTSIDE_TENANCY` | Rent with 0 days used |
| `ABOVE_METER_TOTAL` | Metered, not a duplicate, amount above expected |
| `ABOVE_LEASE_AMOUNT` | Fixed fee, not a duplicate, amount above expected |
| `ABOVE_RECEIPT` | Cost, not a duplicate, amount above expected |
| `CLAUSE_NOT_FOUND` | Not rent, evidence `none` |
| `CLAUSE_UNCONFIRMED` | Not rent, evidence `unconfirmed` |
| `CLAUSE_EXCLUDES` | Not rent, evidence `excludes` |
| `FACTS_MISSING` | Metered with a missing reading or rate |
| `RECEIPT_MISSING` | Cost without a receipt |
| `AMOUNT_NOT_STATED` | Fixed fee without a lease amount |
| `ASSUMED_PER_DAY` | Rent for a partial month and the user has not confirmed how the lease charges it |
| `BELOW_EXPECTED` | Expected is known, not a duplicate, amount below expected |
| `REPAIR_REPORTED` | A linked repair entry is dated on or before the handover date |
| `MATCHES` | Expected is known, not a duplicate, amount equals expected |

## Totals

- **D-40** Each deduction is split into four buckets. The buckets always add up to the amount charged.

| Result | Ask about | Awaiting proof | Unclear | Consistent |
|---|---|---|---|---|
| `not_found` | all | | | |
| `recalculate` | amount − expected | | expected, if not rent and evidence is `unconfirmed` or `excludes` | expected, otherwise |
| `unclear` | | | all | |
| `needs_proof` | | all | | |
| `supported` | | | | all |

- **D-41** Total deducted is the sum of all deductions. The four case totals are the sums of the buckets.
- **D-42** If the user entered the refund the landlord stated, `refundGap = deposit − total deducted − stated refund`. A positive gap is money missing from the landlord's own arithmetic. It is shown separately and is not added to "Ask about". A gap of 0 or less is not shown.
- **D-43** If total deducted is more than the deposit, the app says so and shows the excess.

## Worked example

Deposit ₹30,000, rent ₹15,000, handover 2026-06-15, per-day rent confirmed, no start date.

| Deduction | Facts | Result | Ask about | Awaiting proof | Consistent |
|---|---|---|---:|---:|---:|
| Repainting ₹12,000 | `cost`, no receipt, `verified` | `needs_proof` | 0 | 12,000 | 0 |
| June rent ₹15,000 | `rent`, 2026-06, 15 of 30 days | `recalculate` | 7,500 | 0 | 7,500 |
| Service fee ₹3,000 | `fixed_fee`, `none` | `not_found` | 3,000 | 0 | 0 |
| Total ₹30,000 | | | 10,500 | 12,000 | 7,500 |

Unclear is 0, and 10,500 + 12,000 + 0 + 7,500 = 30,000.
