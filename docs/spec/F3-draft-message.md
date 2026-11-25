# F3 Draft message

## Goal

The app builds a polite message to the landlord from the check results, which the tenant edits, copies and sends themselves.

## Covers

FR-13, UC-2. Uses the results, reasons, quotes and totals from [F1](F1-move-out.md) and repair entries from [F5](F5-bills-repairs.md).

## Inputs and outputs

Input: the current results of the F1 check, the tenancy facts, and linked repair entries.

Output: one plain-text message in English, shown in an editable text box, with a "Copy" button and a "Regenerate" button. Or, when nothing needs asking, a short note and no message.

Message parts, in order:

- Greeting with a placeholder for the landlord's name.
- One opening paragraph that gives the deposit and the total deducted.
- One block for each deduction that needs asking, in input order.
- One closing paragraph that asks for an itemised statement and for receipts or bills.
- Sign-off with a placeholder for the tenant's name.

## Rules

- F3-R1 The message is built from a template in code. No AI is used and nothing is sent to the server.
- F3-R2 Only deductions with the result `not_found`, `recalculate`, `needs_proof` or `unclear` get a block. Deductions that are `supported` are not mentioned.
- F3-R3 Each block has: the label, the amount charged, the expected amount when D-20 to D-24 give one and it is not a duplicate, the reasons in plain words, the quote in quotation marks when there is one, and the repair dates when repairs are linked. Reasons use the same sentences as the result cards in F1-R9, rewritten in the first person where needed. A block has no sentence that is not tied to a result or a reason.
- F3-R4 Each block ends with a question or a request, never a demand. The wording depends only on the primary result: `not_found` asks which clause covers it, `recalculate` asks the landlord to check the amount, `needs_proof` asks for the receipt, `unclear` asks which clause applies.
- F3-R5 Amounts use Indian grouping, for example ₹1,30,000, with decimals only when the paise are not 0 (F1-R1).
- F3-R6 The tone is polite English in short sentences. The message never says a charge is illegal, unlawful or improper. It does not cite a law, set a deadline, threaten action or say who is right. A result of "Not found in the lease" is worded as "I could not find a clause in the lease", because it describes the pasted documents only (A-1, A-5).
- F3-R7 Linked repairs: when a linked entry triggers REPAIR_REPORTED, the block gives its date (written like 10 March 2026), its description and who it was reported to. Entries dated after the handover date are left out.
- F3-R8 If refundGap (D-42) is above 0, the opening paragraph adds one question asking the landlord to explain the difference, with the three amounts it comes from.
- F3-R9 The closing paragraph always asks for an itemised statement of all deductions and for receipts or bills for each cost.
- F3-R10 Placeholders are written in square brackets. A line under the text box says "Replace the text in square brackets before you send."
- F3-R11 The text box is editable. The tenant's edits are kept in local storage until they regenerate or delete everything.
- F3-R12 "Regenerate" after an edit asks "Regenerating will replace your edits. Continue?" On Cancel the text stays. With no edits it regenerates without asking.
- F3-R13 "Copy" puts the current text on the clipboard and announces "Copied". If the clipboard is not available, the text is selected and the app says "Press Ctrl+C or long-press to copy."
- F3-R14 Generating is available only when the results are current. If the results are out of date (F1-R14), the button is disabled and says "Run the check again first." An existing draft shows "This draft may be out of date."
- F3-R15 If no deduction needs asking, the page says "Nothing to ask about. Every deduction is supported." and offers no message and no copy button. The same happens when there are no results yet, with the text "Run the check first."
- F3-R16 Labels, quotes and repair descriptions are inserted as plain text.

## Acceptance criteria

- F3-AC1 Given the sample case checked, then the message has blocks for Repainting, June rent and Service fee, in that order.
- F3-AC2 Given the sample case checked, then the message contains "₹12,000", "₹15,000", "₹7,500", "₹3,000" and "₹30,000".
- F3-AC3 Given the sample case checked, then the Repainting block asks for the receipt and shows the quote that was verified.
- F3-AC4 Given a deduction of ₹1,30,000 that is `unclear`, then the message shows "₹1,30,000".
- F3-AC5 Given a deduction of ₹15,000.50 that is `recalculate`, then the message shows "₹15,000.50".
- F3-AC6 Given a deduction that is `supported`, then its label does not appear in the message.
- F3-AC7 Given a deduction with a linked repair dated 2026-03-10 and handover 2026-06-15, then its block gives 10 March 2026 and the description. Given the repair is dated 2026-07-01, then the block does not mention it.
- F3-AC8 Given deposit ₹30,000, total deducted ₹20,000 and a stated refund of ₹7,000, then the opening paragraph asks about a difference of ₹3,000.
- F3-AC9 Given any generated message, then it contains a request for an itemised statement and for receipts, and none of the words illegal, unlawful, fraud or court.
- F3-AC10 Given an edited draft, when the tenant chooses "Regenerate" and cancels, then the edited text is unchanged. When the tenant continues, then the template text replaces it.
- F3-AC11 Given every deduction is `supported`, then the page shows the "Nothing to ask about" note and no message.
- F3-AC12 Given results that are out of date, then "Generate" is disabled.
- F3-AC13 Given the tenant chooses "Copy", then the clipboard holds exactly the text in the box, including edits.

## Errors and edge cases

- A very long label or quote is inserted in full. The tenant can shorten it.
- Two blocks with the same label stay separate and keep input order.
- A duplicate (D-25) block gives the amount charged and the reason DUPLICATE_CHARGE, and no expected amount.
- A `recalculate` deduction with only part of the amount in question still shows the full amount charged and the expected amount.
- Clipboard permission denied: see F3-R13.
- Stored data that cannot be read follows F1. No draft is kept.

## Out of scope

AI-written text, other languages, tone settings, email or WhatsApp links, sending, saving as PDF, legal citations, deadlines.
