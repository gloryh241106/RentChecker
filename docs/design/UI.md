# UI

Mobile first. One column on a phone, up to 40rem wide on larger screens. Routes and components are in [FRONTEND.md](FRONTEND.md). Flows are in [USER_FLOW.md](USER_FLOW.md). Rules and requirements win over this file.

## Fixed wording

| Item | Text |
|---|---|
| Consent notice, AI on. Title "Before we send your lease" | To find the clause for each charge, RentChecker sends your lease text and the names of your deductions to our server. The server passes them to Google Gemini, which handles them under its own terms. Our server does not save them or write them to logs. The amounts and dates you typed stay in this browser. Please remove names, ID numbers and bank details from the lease text first. Buttons: Continue, Cancel |
| Consent notice, AI not configured | AI matching is not set up on this server. RentChecker will send your lease text and the names of your deductions to our server, which looks for matching words. They go to no other service, and the server does not save them or write them to logs. Please remove names, ID numbers and bank details from the lease text first. Buttons: Continue, Cancel |
| Keyword-mode notice | AI matching was not used. Clauses were found by matching words, which is less reliable. Read each quote. If it is wrong, paste the right quote or say there is no clause. Followed by the warning sentence below |
| AI_NOT_CONFIGURED | AI matching is not set up on this server. |
| AI_UNAVAILABLE | The AI service did not answer. |
| AI_TIMEOUT | The AI service took too long. |
| QUOTE_REJECTED (shown in either mode) | Some quotes from the AI were not found in your lease and were ignored. Those charges show Unclear. |
| Not legal advice | RentChecker compares your charges with the documents you entered. It is not legal advice and does not say who is right. |
| Out of date | Results are out of date. Run the check again. |
| Sample banner | Sample data. This is an example case, not your tenancy. |
| Result names | Recalculate, Unclear, Not found in the lease, Needs proof, Supported |
| Bucket names | Ask about, Awaiting proof, Unclear, Consistent |
| Evidence source tags | AI match, Keyword match, read the quote, Sample match, Set by you |
| Delete dialog | Delete all data stored by RentChecker in this browser? This cannot be undone. Buttons: Delete everything, Cancel |
| Matching failed (500, network, no answer in 30 s) | Matching failed. Your calculations still work. Run the check without clauses, or try again. |
| 400, 413, 429 | Check the lease text and labels, then try again. The lease text is too long to send. Too many checks. Try again in a few minutes. |
| Quote override rejected | That text was not found in the lease. Paste it exactly as written. |
| Money error | Enter an amount in rupees, like 15,000 or 15,000.50. Use at most 2 decimals. |
| Cloud save notice. Title "Save this case to the cloud" | RentChecker will store your dates, amounts, deduction names, repair log and bill form in a database. It will not store your lease text, quotes or message. The case is deleted 365 days after your last save, or when you delete it. Do not put names or bank details in labels. Buttons: Continue, Cancel |
| Recovery code | Anyone with this code can open and change this case. We cannot recover it if you lose it. Button: Copy code |
| Cloud save states | Not saved yet. Saved at {time}. Cloud save is not available right now. No case found for this code. Paste the lease again to check clauses. |
| Cloud conflict | This case was changed on another device. Buttons: Load the cloud copy, Replace the cloud copy |
| Delete cloud copy | Delete the cloud copy? The data in this browser stays. Buttons: Delete the cloud copy, Cancel |
| Storage unavailable | Your browser is blocking storage. Nothing will be saved, but the app still works until you close this page. |
| Stored data unreadable | Your saved data could not be read, so you are starting empty. |

Each result name has an icon and the text. Colour is never the only signal. Recalculate uses a calculator, Unclear a question mark in a circle, Not found in the lease a magnifier with a cross, Needs proof a receipt, Supported a tick in a circle. Icons are hidden from screen readers because the text is there.

Reason sentences, one for each code in D-37 (amounts are filled in from the calculation):

| Code | Sentence |
|---|---|
| DUPLICATE_CHARGE | This repeats an earlier charge. |
| ABOVE_PRORATED_RENT | Rent for the {days} of {daysInMonth} days you lived there is {expected}. This charge is {amount}. |
| RENT_OUTSIDE_TENANCY | None of your tenancy days fall in this month. |
| ABOVE_METER_TOTAL | The readings and rate give {expected}. This charge is {amount}. |
| ABOVE_LEASE_AMOUNT | The lease states {expected}. This charge is {amount}. |
| ABOVE_RECEIPT | The receipt is for {expected}. This charge is {amount}. |
| CLAUSE_NOT_FOUND | No clause in the lease you pasted covers this. |
| CLAUSE_UNCONFIRMED | A matching clause could not be confirmed. |
| CLAUSE_EXCLUDES | A clause in the lease seems to rule this charge out. |
| FACTS_MISSING | A reading or the rate is missing, so the amount cannot be checked. |
| RECEIPT_MISSING | No receipt was given for this cost. |
| AMOUNT_NOT_STATED | The lease amount for this fee was not entered. |
| ASSUMED_PER_DAY | A partial month was calculated per day. Choose how your lease charges it to confirm. |
| BELOW_EXPECTED | This charge is lower than the {expected} that was worked out. |
| REPAIR_REPORTED | You reported a repair on {date}, on or before handover. |
| MATCHES | This charge matches the {expected} that was worked out. |

## Screens

Every screen has a header with the app name, a footer with the not-legal-advice line and "Delete everything", and one h1.

### Home (/)

h1 "Check your rent and deposit charges". Three stage links in this order: Moving out (main), Before signing, During the tenancy. Each has one line of help. Buttons: Load sample case. Empty state: nothing saved, no note. Saved data: the Moving out link says "Saved in this browser". Errors: storage notices above. Success: not applicable.

### Moving out (/move-out)

A step list shows Details, Deductions, Lease, Results, Message. The current step has `aria-current="step"`. Every step can be opened at any time. Each step has Back and Next, full width on a phone. The sample banner shows on every step while sample data is in use.

Details. Fields: Deposit, Monthly rent, Handover date, Start date (optional), Refund the landlord stated (optional), How does the lease charge a partial month? (Not sure, Per day, Full month; Not sure is calculated per day), a checkbox "The handover day does not count as a day of use". Each field has a visible label and a hint, for example "For example 15,000 or 1,30,000" and "Write the date as YYYY-MM-DD, for example 2026-06-15". States: empty form is the start state. Error: messages next to fields.

Deductions. A list of cards, each with label, kind, amount, edit and remove. "Add deduction" opens the form: Label, Kind (Rent, Metered bill, Fixed fee, Cost), Amount charged, then the facts of the kind: Rent month and Already paid; Previous reading, Current reading, Rate per unit and Fixed charge; Amount stated in the lease; Receipt amount. Linked repairs show as checkboxes from the repair log. Empty: "No deductions yet. Add the first charge from your landlord's list." At 20: the add button is disabled and says "You can add up to 20 deductions." Remove deletes the card and says so in the status region.

Lease. A text area "Lease text" with a count "0 of 40,000", hint "Paste the whole lease. A missing page can cause a wrong Not found in the lease." Buttons: Find clauses, Run check. Under the text area, each non-rent deduction shows its evidence (the state as words, its source tag, the quote if any) and the controls "Paste a quote", "No clause here" and "Remove override". Empty: "No lease pasted. Charges that need a clause will show Unclear." Loading: "Finding clauses. This can take up to 30 seconds." Find clauses is disabled, Run check stays enabled. Error: the matching messages above, with "Try again". Out of date: editing the lease text clears every state and shows "The lease text changed. Find clauses again." Success: mode notice if keyword, warnings, and "Clause matching finished." in the status region.

Results. Empty (no check run): "You have not run the check yet." and a Run check button. Success: first the totals as a definition list (Total deducted, Ask about, Awaiting proof, Unclear, Consistent), then the refund gap line only when it is above 0, then an excess notice when the total is above the deposit ("The deductions are ₹{excess} more than the deposit."). Then one card for each deduction in input order: label, kind, amount charged, expected amount when known, result name with icon, reasons as a list, quote with its source tag, linked repairs with date, description and who it was reported to, and the controls from the Lease step. Out of date: the notice appears above the totals, old values stay. Error: field messages as in Details. Not legal advice line under the totals.

Message. Empty: "Run the check first." Nothing to ask: "Nothing to ask about. Every deduction is supported." with no copy button. Success: a text area "Message to your landlord" with the draft, buttons Copy and Regenerate, and the line "Replace the text in square brackets before you send." Out of date: Regenerate is disabled with "Run the check again first." and an existing draft shows "This draft may be out of date." Copy success: "Copied" in the status region. Copy blocked: the text is selected and the page says "Press Ctrl+C or long-press to copy." Regenerate after edits asks "Regenerating will replace your edits. Continue?". Not legal advice line below.

### Before signing (/lease-review)

h1 "Review a lease before you sign". A text area for the lease (its own text, not shared with moving out), Run review. Ten topic rows after a run, each with the topic, an outcome (Found, Not found, Could not confirm, Lease may rule this out), the quote when there is one, and the question when the outcome is not Found. Page line: "A found clause is not a check that its terms are fair." Copy questions copies the questions that are shown. If every topic is Found: "Every topic has a clause. Read each quote to check the terms." Empty: "Paste the lease to see which deposit topics it covers." Loading, error, keyword notice, consent and override as in Lease above. Out of date: "The lease text changed. Run the review again." Not legal advice line at the bottom.

### During the tenancy (/tenancy)

h1 "During the tenancy". Two sections, each with an h2. Check a bill: Previous reading, Current reading, Rate per unit, Fixed charge (optional), Bill total, button Check bill. Success: "Worked out from your readings: ₹{expected}. Your bill: ₹{total}. Difference: ₹{difference}." followed by one reason sentence from the table. Empty: just the form. Error: messages next to fields, and no amount is shown. Repair log: Date, What was wrong, Reported to, button Add repair. Entries oldest first, each with Edit and Delete. Empty: "No repairs recorded. Add one when you report a problem." At 50: "The log holds up to 50 entries." Deleting an entry says in the status region that its link was removed.

## Design tokens

Roles only. Pick the values so the contrast ratios hold. Light theme only for now.

| Role | Use | Requirement |
|---|---|---|
| text, text-muted | Body and hints | 4.5:1 on every surface |
| surface, surface-raised, surface-sunken | Page, cards, notices | n/a |
| border, border-input | Dividers, input edges | 3:1 for input edges |
| primary, primary-text | Main buttons | Text 4.5:1 on the button |
| focus | Focus ring, 2 px with 2 px offset | 3:1 against both neighbours |
| danger, warning, success, info | Notices and result accents, always with icon and text | Text 4.5:1, icon 3:1 |
| space 4, 8, 12, 16, 24, 32 | Gaps, 16 px side gutter on a phone | n/a |
| text-base 16 px, line height 1.5 | Inputs are at least 16 px so phones do not zoom | n/a |
| target-min 44 px | Buttons, links in lists, inputs, checkboxes | Height and width |

## Accessibility

- Landmarks: one `header`, `nav` (the step list, labelled "Steps"), one `main`, one `footer`. A skip link goes to `main`.
- One h1 on each screen. Steps use h2 for sections and h3 for cards. No level is skipped.
- Every field has a visible label, a hint linked with `aria-describedby`, and `autocomplete="off"` where the value is private. Required fields say "required" in the label text.
- Errors: the message sits under the field, is linked with `aria-describedby`, and the field has `aria-invalid="true"`. On Run check or Next, an error summary appears at the top listing each problem as a link to its field, and focus moves to the first bad field. The summary is also announced through a polite status region, so a screen reader hears "3 problems" first. Messages say how to fix the problem and never rely on colour.
- A status region (`role="status"`) announces check completion ("Check finished. Ask about ₹10,500, awaiting proof ₹12,000, unclear ₹0."), matching completion, "Copied" and link removal. It is always in the page, not added when needed.
- On a step change, focus moves to the new h1, which has `tabindex="-1"`, and the document title changes to the step name.
- Dialogs use the native `dialog` element. Focus goes inside, stays inside, Escape closes, and focus returns to the control that opened it.
- Focus is always visible with the focus token. Sticky bars never cover a focused control.
- Targets are at least 44 by 44 CSS px with at least 8 px between them.
- Contrast: text 4.5:1, large text, icons, input edges and focus ring 3:1. Check text on every surface and the dimmed state of out-of-date results.
- Result names are text with an icon. Totals are a definition list. On a phone, results are cards, not tables.
- Motion: use none that matters. With `prefers-reduced-motion`, there is no animation and the loading state is static text.
- Reflow: no horizontal scroll at 320 px wide. Long labels, quotes and lease text wrap. 200 percent zoom loses no content or function.
- Lease text, labels, quotes and repair text are plain text and never HTML.
- Amounts are written with Indian grouping and `₹`, for example ₹1,30,000, with paise only when not 0.
