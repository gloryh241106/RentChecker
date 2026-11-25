# F8 Read the landlord's message

## Goal

The tenant pastes the message in which the landlord lists the deductions, and the app fills in the charges, so they do not have to be typed one by one.

## Covers

FR-21, UC-9. Everything runs in the browser by code. Nothing is sent and AI is not used.

## Inputs and outputs

Input: a message of up to 4,000 characters, and the handover date when it is known.

Output: a list of charges, each with a label, an amount and a kind (D-10), which the tenant confirms before anything is added.

## Rules

- F8-R1 The message is split at line breaks, `;`, `|`, a colon and space after a number with commas ("from your deposit of 50,000: 10,000 for painting"), a full stop before a space (not after Rs), a comma that is not followed by a digit, and the words or signs and, `&` and `+`. A part with no number before and, `&` or `+` belongs to the next part ("Water and electricity 1,200").
- F8-R2 An amount is a number in the form of D-3 after `₹`, `Rs` or `INR`, or a number of at least 100 without one. `/-` after it is allowed. A number without a currency sign is not an amount when a letter, `%` or a date part touches it, or when it is a year from 2000 to 2099 after a month name. A part with two amounts uses the last one.
- F8-R3 The label is the text before the amount, or what follows its last colon when words do. If no label is left there, it is the text after the amount, without for, towards or as. List marks, separators and lead-ins such as "I have deducted" are removed. The first letter becomes a capital, and the label is cut to 120 characters. A part with no label is called "Charge".
- F8-R4 A part whose words name a total, balance, refund, net, deposit, advance, or an amount paid or received is not a charge. The app says how many amounts were left out.
- F8-R5 Kind: rent when the label has the word rent. Metered bill for electricity, electric, power, water, gas, meter or units. Fixed fee for fee, fine, penalty, service, maintenance, society or late. Cost for everything else.
- F8-R6 The rent month is the month named in the part, with the year named there, or else the latest such month that is not after the handover month. With no month named it is the handover month. If no month can be worked out, the charge is listed but cannot be added, and the app says to enter the handover date first.
- F8-R7 Each charge has a checkbox, checked at first. "Add" adds the checked charges, up to the limit of F1-R4, with no receipt, reading or lease amount. The tenant can edit each one as usual.
- F8-R8 The message is not stored.

## Acceptance criteria

- F8-AC1 Given "Repainting: Rs 12,000", "June rent - 15000/-" and "Service fee ₹3,000" on three lines and handover 2026-06-15, then three charges are listed: Repainting, Cost, ₹12,000; June rent, Rent for 2026-06, ₹15,000; Service fee, Fixed fee, ₹3,000.
- F8-AC2 Given "I have deducted 12000 for painting, 2,500 for cleaning and 800 towards electricity", then Painting ₹12,000 (Cost), Cleaning ₹2,500 (Cost) and Electricity ₹800 (Metered bill) are listed.
- F8-AC3 Given "Total 30,000" after the charges, then it is not listed and the app says that 1 amount was left out.
- F8-AC4 Given "June rent 15000" and no handover date, then the charge cannot be added and the reason is shown.
- F8-AC5 Given a message with no amount, then the app says that no charge was found.
- F8-AC6 Given 19 deductions and three listed charges, then one is added and the app says that the limit is 20.

## Out of scope

Images, other languages, amounts in words, receipts.
