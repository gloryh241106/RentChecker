# 0005 Integer paise

Status: Accepted, 2026-11-25

## Context

The app compares amounts to the paisa. Floating point numbers give results such as 0.1 + 0.2 not equal to 0.3. A wrong total would undermine the tool. The contract fixes the rules in D-1 to D-4.

## Decision

- Store and calculate money as whole numbers of paise (D-1).
- Convert rupee text to paise once, at input, with the D-3 parser. Convert back only for display.
- Divide with one shared integer helper that rounds halves up (D-2).
- Readings are integers in hundredths (D-22).
- Every amount is at most 1,000,000,000 paise (D-4). That is far below the largest safe integer in JavaScript.

## Consequences

- Totals add up exactly (D-40, D-41).
- Intermediate products, such as a reading times a rate, can exceed the safe integer range if their inputs have no bound. D-22 limits readings and rates for this reason.
- Display code must format paise with the Indian digit grouping.
- Tests compare integers, not decimals.

## Alternatives

- Floating point rupees: simple, wrong at the edges.
- A decimal library: correct, but an extra dependency for a small set of formulas.
- BigInt: safe for large products, but awkward in JSON and in Zod.
