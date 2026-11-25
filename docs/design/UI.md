# UI

Mobile first. One column on a phone. The page is up to 64rem wide on larger screens, and forms and text stay within 48rem. Routes and components are in [FRONTEND.md](FRONTEND.md). Flows are in [USER_FLOW.md](USER_FLOW.md). Rules and requirements win over this file.

## Fixed wording

| Item | Text |
|---|---|
| Consent notice, AI on. Title "Before we send your lease" | To find the clause for each charge, RentChecker sends your lease text and the names of your deductions to our server. The server passes them to Google Gemini, which handles them under its own terms. Google may use them to improve its products, and people may review them. Our server does not save them or write them to logs. The amounts and dates you typed stay in this browser. Please remove names, ID numbers and bank details from the lease text first. Buttons: Continue, Cancel |
| Consent notice, AI not configured. Same title | AI matching is not set up on this server. RentChecker will send your lease text and the names of your deductions to our server, which looks for matching words. They go to no other service, and the server does not save them or write them to logs. Please remove names, ID numbers and bank details from the lease text first. Buttons: Continue, Cancel |
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
| Find clauses disabled | Paste at least 50 characters of the lease first. Add a deduction other than rent first. |
| 400, 413, 429 | Check the lease text and labels, then try again. The lease text is too long to send. Too many checks. Try again in a few minutes. |
| Quote override rejected | That text was not found in the lease. Paste it exactly as written. |
| Field error, required | Enter the {field}. For example: Enter the deposit. |
| Field error, amount format | Enter an amount in rupees, like 15,000 or 15,000.50. Use at most 2 decimals. |
| Field error, amount above the limit | Enter an amount up to ₹1,00,00,000. |
| Field error, amount 0 where it must be more | Enter an amount above 0. |
| Field error, date | Write the date as YYYY-MM-DD, for example 2026-06-15. |
| Field error, rent month | Write the month as YYYY-MM, for example 2026-06. |
| Field error, start after handover | The start date must be on or before the handover date. |
| Field error, reading | Enter a reading like 120 or 120.50. Use at most 2 decimals and no more than 1,00,00,000. |
| Field error, current reading | The current reading must not be lower than the previous one. |
| Field error, rate | Enter a rate in rupees per unit, like 8 or 8.50, up to ₹1,000. |
| Field error, text too long | Use at most 120 characters. |
| Field error, no deductions | Add at least one deduction. |
| Ask your lease, consent, AI on. Title "Before we send your lease" | To answer your questions, RentChecker sends your lease text and each question you ask to our server. The rest is the notice above |
| Ask your lease, consent, AI not configured | AI matching is not set up on this server. RentChecker will send your lease text and each question you ask to our server, which looks for matching words. The rest is the notice above |
| Ask your lease, keyword mode | AI matching was not used. The sentence was found by matching words, which is less reliable. Read the quote before you rely on it. |
| Ask your lease, QUOTE_REJECTED | The quote from the AI was not found in your lease and was ignored. |
| Ask your lease, failed. 400. 429 | The question could not be answered. Try again. Check the lease text and the question, then try again. Too many questions. Try again in a few minutes. |
| Answers | The lease says: (then the quote). No clause about this was found in the lease you pasted. An answer could not be confirmed. |
| Landlord's message, amounts left out | 1 amount was left out, because it looks like a total, a refund or a payment. {n} amounts were left out, because they look like totals, refunds or payments. |
| Landlord's message, rent with no month | Enter the handover date on Details first, so the month is known. |
| Landlord's message, nothing found | No charge was found. Write each charge with its amount, for example Painting 12,000. |
| Landlord's message, too long | Use at most 4,000 characters. |
| Landlord's message, over the limit | You can add up to 20 deductions. The last ones will not be added. |
| Assistant, consent, AI on. Title "Before we send your message" | To understand your message, RentChecker sends it to our server. The server passes it to Google Gemini, which handles it under its own terms. Google may use it to improve its products, and people may review it. Our server does not save it or write it to logs. Your answers to the questions that follow stay in this browser. Please remove names, ID numbers and bank details first. |
| Assistant, consent, AI not configured | AI is not set up on this server. RentChecker will send your message to our server, which looks for matching words. It goes to no other service, and the server does not save it or write it to logs. Please remove names, ID numbers and bank details first. |
| Assistant, keyword mode | AI was not used. Your message was read by matching words, which is less reliable. Check every detail. |
| Assistant, QUOTE_REJECTED | Some details from the AI were not found in your message and were ignored. |
| Assistant, failed. 400. 429 | Your message could not be read. Try again, or choose a stage below. Check your message, then try again. Too many messages. Try again in a few minutes. |
| Assistant, field errors | Write what you need. Use at most 2,000 characters. Write one amount in rupees, for example 30,000 or 30k. Write one full date with its year, for example 15 June 2026. Write each charge with its amount, for example painting 12,000. |
| Input checks (F9-R11). Title "Please check" | One sentence for each code, in `shared/src/assistant/checks.ts` and `note-text.ts` |
| Cloud save notice. Title "Save this case to the cloud" | RentChecker will store your dates, amounts, deduction names, repair log and bill form in a database. It will not store your lease text, quotes or message. The case is deleted 365 days after your last save, or when you delete it. Do not put names or bank details in labels. Buttons: Continue, Cancel |
| Recovery code | Anyone with this code can open and change this case. We cannot recover it if you lose it. Button: Copy code |
| Cloud save states | Not saved yet. Saved at {time}. Cloud save is not available right now. No case found for this code. Paste the lease again to check clauses. |
| Cloud conflict | This case was changed on another device. Buttons: Load the cloud copy, Replace the cloud copy |
| Delete cloud copy | Delete the cloud copy? The data in this browser stays. Buttons: Delete the cloud copy, Cancel |
| Storage unavailable | Your browser is blocking storage. Nothing will be saved, but the app still works until you close this page. |
| Stored data unreadable | Your saved data could not be read, so you are starting empty. |
| Stored data from another version | Your saved data comes from a different version of RentChecker and cannot be opened, so you are starting empty. |
| Evidence states | Clause found, Lease may rule this out, No clause found, Not confirmed |
| Field error, lease too long | This is longer than 40,000 characters, so it is not used or saved. Take out pages that do not mention charges. |
| Refund gap line | The refund gap is the part of your deposit that neither the deductions nor the refund the landlord stated account for. It is not part of Ask about. |
| Sample over saved data. Title "Load the sample case" | Loading the sample case replaces the data in this browser. Continue? Buttons: Load sample case, Cancel |
| Delete refused by the browser | Your browser did not let RentChecker delete the data. Clear the site data for this page in your browser settings. |

Each result name has an icon and the text. Colour is never the only signal. Recalculate uses a calculator, Unclear a question mark in a circle, Not found in the lease a magnifier with a cross, Needs proof a receipt, Supported a tick in a circle. Icons are hidden from screen readers because the text is there.

Reason sentences, one for each code in D-37 (amounts are filled in from the calculation):

| Code | Sentence |
|---|---|
| DUPLICATE_CHARGE | This repeats an earlier charge. |
| ABOVE_PRORATED_RENT | You used {days} of the {daysInMonth} days. The rent still due for this month works out to {expected}. This charge is {amount}. |
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
| REPAIR_REPORTED | You reported a repair on {dates}, on or before handover. (Several dates are joined with commas and "and".) |
| MATCHES | This charge matches the {expected} that was worked out. |

## Screens

Every screen has a dark header with the app name. Every screen except Home also has the stage links in the header (Moving out, Before signing, During the tenancy, Ask your lease), with the current one marked. Home has its own stage links. Every screen has a footer with the not-legal-advice line and "Delete everything", and one h1.

### Home (/)

From the top:

- A dark band with the h1 "Check your rent and deposit charges", the introduction, the button "Start with a message", which puts focus in the prompt of the assistant, a link "Check my deductions" to Details, and Load sample case. Beside it, under it on a phone, the example.
- The example, h2 "Example result". It is the sample case, checked by the same rules as a real one, never typed in. It shows "Ask about ₹10,500 of ₹30,000 deducted", the split bar, the name and amount of each bucket above ₹0, and each deduction with its amount and result.
- The assistant, h2 "Tell the assistant what you need": the text area "Your message", the button Read my message and three examples, which fill the box and send nothing. Beside it, under it on a phone, what the assistant does, or the plan once a message was read. The plan has an h3 with the task. For deductions it lists each fact with "From your words: …" or "Your answer" and Change or Remove, then "Please check", then one question with Answer and Skip this question, then Use these details. Other tasks have one link. After reading, focus is on the h3 and the status region says "Your message was read." or "Your message could not be read." After an answer, focus is on the next question, or on Use these details. That button opens Moving out and announces "Details filled in. Check them before you run the check." With details in the browser it first asks "This replaces the tenancy details and deductions in this browser. Your own lease text and repair log stay. Continue?"
- h2 "Where are you in your tenancy?" with the three stage cards. Each has an icon and an h3 that is the link, and the whole card can be pressed.
- h2 "Not sure what your lease says?" with the line "Ask in your own words. The answer is a sentence of your lease, checked word for word.", a link "Ask your lease", and an example question with a sentence of the sample lease.
- h2 "How it works" with four points. "Rules work out every amount": "Rent per day, meter readings, receipts and fees the lease states. AI never gives an amount." "Quotes are checked": "Google Gemini looks for the clause. A quote that is not in your lease is ignored." "A message you can edit": "It asks for the clause, the receipt or a new calculation, charge by charge." "Your data stays with you": "Your entries are stored in this browser. A message or a lease is sent only after you agree."

Three stage links in this order: Moving out (main), Before signing, During the tenancy. Each has one line of help: "Check the deductions your landlord listed against your tenancy and your lease.", "Check a metered bill against your readings, and keep a dated log of repairs." for During the tenancy. Buttons: Load sample case. It opens Results with the check run, and the status region says "Sample case loaded." Empty state: nothing saved, no note. Saved data: the Moving out link says "Saved in this browser". Errors: storage notices above. Success: not applicable.

### Moving out (/move-out)

A step list shows Details, Deductions, Lease, Results, Message. The current step has `aria-current="step"`. Every step can be opened at any time. Each step has Back and Next, full width on a phone. The sample banner shows on every step while sample data is in use.

Details. Fields: Deposit, Monthly rent, Handover date, Start date (optional), Refund the landlord stated (optional), How does the lease charge a partial month? (Not sure, Per day, Full month; Not sure is calculated per day), a checkbox "The handover day does not count as a day of use". Each field has a visible label and a hint, for example "For example 15,000 or 1,30,000" and "Write the date as YYYY-MM-DD, for example 2026-06-15". States: empty form is the start state. Error: messages next to fields.

Deductions. A list of cards, each with label, kind, amount, edit and remove. "Add deduction" opens the form: Label, Kind (Rent, Metered bill, Fixed fee, Cost), Amount charged, then the facts of the kind: Rent month and Already paid; Previous reading, Current reading, Rate per unit and Fixed charge; Amount stated in the lease; Receipt amount. Linked repairs show as checkboxes from the repair log. Empty: "No deductions yet. Add the first charge from your landlord's list." At 20: the add button is disabled and says "You can add up to 20 deductions." Remove deletes the card and says so in the status region. A second button, "Read the landlord's message", opens a card with a text area "Message from your landlord" (hint "It is read in this browser and is not sent or saved."), the buttons Find charges and Cancel, and "Use a sample message" while the box is empty. After Find charges, focus is on "Charges found" or "No charge was found". Each charge is a checkbox with its label, amount, kind and rent month. "Add {n} charges" adds the checked ones, closes the card, puts focus on "Charges from your landlord" and announces "Added {n} charges." Editing the message clears the list. Under the cards, "Please check" lists the input checks of F9-R11, if any.

Lease. A text area "Lease text" with a count "0 of 40,000", hint "Paste the whole lease. A missing page can cause a wrong Not found in the lease." Buttons: Find clauses, Run check. Under the text area, each non-rent deduction shows its evidence (the state as words, its source tag, the quote if any) and the controls "Paste a quote", "No clause here" and "Remove override". Text over the limit stays in the box with the field error, and the lease counts as empty until it is shorter. Empty: "No lease pasted. Charges that need a clause will show Unclear." Loading: "Finding clauses. This can take up to 30 seconds." Find clauses is disabled, Run check stays enabled. Error: the matching messages above, with "Try again". Out of date: editing the lease text clears every state and shows "The lease text changed. Find clauses again." Success: mode notice if keyword, warnings, and "Clause matching finished." in the status region. If results were shown, the check runs again by itself when the facts are valid (F1-R14). A failed run says "Clause matching failed." there. During a run focus is on the status text, because the button is disabled. Cancel puts focus on Find clauses.

Results. Empty (no check run): "You have not run the check yet." and a Run check button. Before the first check, the sentence and the button are in a card with an icon. Success: first the sentence "Ask about ₹{askAbout} of ₹{total} deducted" and the split bar, then the totals as a definition list (Total deducted, Ask about, Awaiting proof, Unclear, Consistent), then the refund gap line only when it is above 0, then an excess notice when the total is above the deposit ("The deductions are ₹{excess} more than the deposit."). Then one card for each deduction in input order: label, kind, amount charged, expected amount when known, result name with icon, reasons as a list, quote with its source tag, linked repairs with date, description and who it was reported to, and the controls from the Lease step. Out of date: the notice appears above the totals, old values stay. Error: field messages as in Details. Not legal advice line under the totals.

Message. Empty: "Run the check first." Nothing to ask: "Nothing to ask about. Every deduction is supported." with no copy button. Success: a text area "Message to your landlord" with the draft, buttons Copy and Regenerate, and the line "Replace the text in square brackets before you send." Out of date: Regenerate is disabled with "Run the check again first." and an existing draft shows "This draft may be out of date." A stored draft with no check run in this visit shows the same, with "Run the check first." An edited draft with current results shows "You edited this message. Regenerate to start again from the current results." Copy success: "Copied" in the status region. Copy blocked: the text is selected and the page says "Press Ctrl+C or long-press to copy." Regenerate after edits asks "Regenerating will replace your edits. Continue?". Not legal advice line below.

### Before signing (/lease-review)

h1 "Review a lease before you sign". A text area for the lease (its own text, not shared with moving out), Run review. Until the first run, h2 "What the review looks for" with the ten topic names. Ten topic rows after a run, each with the topic, an outcome (Found, Not found, Could not confirm, Lease may rule this out), the quote when there is one, and the question when the outcome is not Found. Page line: "A found clause is not a check that its terms are fair." Copy questions copies the questions that are shown, says "Copied", and works as Copy on the Message step when the clipboard is blocked. The questions to copy are also in a read-only text area "Questions to ask". If every topic is Found: "Every topic has a clause. Read each quote to check the terms." Empty: "Paste the lease to see which deposit topics it covers." Loading, error, keyword notice, consent and override as in Lease above. The consent notices say "each topic" and "the ten topic names" here, in place of "each charge" and "the names of your deductions". QUOTE_REJECTED ends with "Those topics show Could not confirm." A failed match says "Matching failed. The rows did not change. Try again." Run review disabled: "Paste at least 50 characters of the lease first." The hint under the box is "Paste the whole lease. A missing page can cause a wrong Not found." Status region: "Review finished." and "Review failed." While the box is empty, "Use a sample lease" fills it, moves focus to it and announces "Sample lease added." Home help line: "Paste a lease to see which deposit topics it covers and what to ask." Out of date: "The lease text changed. Run the review again." Not legal advice line at the bottom.

### During the tenancy (/tenancy)

h1 "During the tenancy". Two sections, each with an h2. Check a bill: Previous reading, Current reading, Rate per unit, Fixed charge (optional), Bill total, button Check bill. Success: "Worked out from your readings: ₹{expected}. Your bill: ₹{total}. Difference: ₹{difference}." followed by one reason sentence from the table. Empty: just the form. Error: messages next to fields, and no amount is shown. Repair log: Date, What was wrong, Reported to, button Add repair. Entries oldest first, each with the date, the description, who it was reported to, the linked deduction if any, Edit and Delete. Empty: "No repairs recorded. Add one when you report a problem." At 50: "The log holds up to 50 entries." Deleting an entry says in the status region that its link was removed, for example "Removed the repair of 10 March 2026. Its link to Repainting was removed." The status region also says "Bill checked." followed by the summary, and "Saved the repair of 10 March 2026."

### Ask your lease (/ask)

h1 "Ask your lease". The lease text of Moving out (hint "This is the lease of Moving out. A change here changes it there."), with "Use a sample lease" while it is empty. Beside it, under it on a phone: the field "Your question" with the button Ask, then h2 "Suggested for your case" with up to five questions as buttons, then the mode notice, then h2 "Answers". Each answer is a card with the question as an h3. Questions with no quote are in a read-only text area "Questions to ask your landlord" with Copy questions, which works as on Before signing. Empty: "Paste your lease, or try the sample." Ask disabled: "Paste at least 50 characters of the lease first." Loading: "Reading your lease. This can take up to 30 seconds." After a question, focus is in "Your question" with its text selected. Error: the messages above, with "Try again". The sample banner shows while sample data is in use. Not legal advice line at the bottom.

## Design tokens

Roles only. Pick the values so the contrast ratios hold. Light theme only for now.

| Role | Use | Requirement |
|---|---|---|
| text, text-muted | Body and hints | 4.5:1 on every surface |
| surface, surface-raised, surface-sunken | Page, cards, notices | n/a |
| border, border-input | Dividers, input edges | 3:1 for input edges |
| primary, primary-text | Main buttons | Text 4.5:1 on the button |
| focus | Focus ring, 2 px with 2 px offset | 3:1 against both neighbours |
| band, on-band, on-band-muted | Header and the band on Home | Text 4.5:1 |
| accent, on-accent | The app mark, the current stage, the main link on Home | Text 4.5:1 on accent, accent 3:1 on band |
| focus-on-band | Focus ring inside a band | 3:1 on band |
| danger, warning, success, info | Notices and result accents, always with icon and text | Text 4.5:1, icon 3:1 |
| space 4, 8, 12, 16, 24, 32 | Gaps, 16 px side gutter on a phone | n/a |
| text-base 16 px, line height 1.5 | Inputs are at least 16 px so phones do not zoom | n/a |
| target-min 44 px | Buttons, links in lists, inputs, checkboxes | Height and width |

## Accessibility

- Landmarks: one `header`, `nav` (the step list, labelled "Steps", and the stage links, labelled "Stages"), one `main`, one `footer`. A skip link goes to `main`.
- One h1 on each screen. Steps use h2 for sections and h3 for cards. No level is skipped.
- Every field has a visible label, a hint linked with `aria-describedby`, and `autocomplete="off"` where the value is private. Required fields say "required" in the label text.
- Errors: the message sits under the field, is linked with `aria-describedby`, and the field has `aria-invalid="true"`. On Run check or Next, an error summary appears at the top listing each problem as a link to its field, and focus moves to the first bad field. The summary is also announced through a polite status region, so a screen reader hears "3 problems" first. A message also shows when the user goes from an edited field to another field. Pressing a button never shows one before the click is done, because the button would move. Messages say how to fix the problem and never rely on colour.
- A status region (`role="status"`) announces check completion ("Check finished. Ask about ₹10,500, awaiting proof ₹12,000, unclear ₹0."), matching completion, "Copied" and link removal. It is always in the page, not added when needed.
- Opening "Paste a quote" moves focus into its box. Closing it, or removing an override, moves focus to "Paste a quote".
- On a step change, focus moves to the new h1, which has `tabindex="-1"`, and the document title changes to the step name.
- Dialogs use the native `dialog` element. Focus goes inside, stays inside, Escape closes, and focus returns to the control that opened it.
- Focus is always visible with the focus token. Sticky bars never cover a focused control.
- Targets are at least 44 by 44 CSS px with at least 8 px between them.
- Contrast: text 4.5:1, large text, icons, input edges and focus ring 3:1. Check text on every surface and the dimmed state of out-of-date results.
- Result names are text with an icon. Totals are a definition list. On a phone, results are cards, not tables.
- The split bar shows the four buckets as parts of the total, in the order of the list. It is hidden from screen readers because the list says the same. Each part has the icon of its bucket, which is also beside the bucket name, so colour is never the only signal: Ask about an exclamation mark in a circle, Awaiting proof a receipt, Unclear a question mark in a circle, Consistent a tick in a circle. A bucket of ₹0 has no part, and a total of ₹0 has no bar.
- Motion: use none that matters. Only colours change on hover. With `prefers-reduced-motion`, there is no animation and the loading state is static text.
- Reflow: no horizontal scroll at 320 px wide. Long labels, quotes and lease text wrap. 200 percent zoom loses no content or function.
- Lease text, labels, quotes and repair text are plain text and never HTML.
- Amounts are written with Indian grouping and `₹`, for example ₹1,30,000, with paise only when not 0.
