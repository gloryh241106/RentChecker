# RentChecker

Check your rent and deposit charges before you argue about them.

> Status: planning. Nothing described below is built yet. Features are ticked in [Build order](#build-order) once they work.

## The problem

When tenants move out, the landlord often sends a list of deductions from the security deposit. Working out which ones are fair means rereading the lease, redoing the arithmetic and finding the receipts. Many tenants skip that and accept the total.

A 2026 report by NoBroker, an Indian property platform, found that only [35% of Bengaluru tenants got their last deposit back in full without any dispute](https://www.hindustantimes.com/real-estate/bengaluru-tenants-have-31-628-crore-locked-in-security-deposits-only-35-get-full-refund-without-disputes-report-101784354346796.html). In one [case reported by Mint](https://www.livemint.com/money/personal-finance/bengaluru-tenant-gets-only-rs-19-000-of-1-3-lakh-security-deposit-what-does-the-law-say-on-arbitrary-deductions-11789204342327.html), a tenant got ₹19,000 back from a ₹1.3 lakh deposit. They accepted that the lease required repainting. Their complaint was that there were no bills or itemised calculation, and that a full month's rent was deducted although they left on the 15th.

## Vertical and persona

The vertical is rental housing.

The user is a tenant in India who has a written lease and has received, or is about to receive, a list of charges. They are not a lawyer and may be reading on a phone. Landlords do not need an account or the app. They receive a clear message that says which charges need an explanation and why.

## What it does

RentChecker is an assistant that changes its checks and questions depending on where the tenant is in the tenancy.

| Stage | The tenant provides | RentChecker returns |
|---|---|---|
| Before signing | Lease text | Deposit terms that are missing or vague, with questions to ask |
| During the tenancy | Meter readings, rates, bill total, repairs they reported | A recalculated bill and a dated repair log |
| Moving out (core feature) | Lease, deposit, handover date, deductions, receipts they were given | A result for each deduction and a draft message to the landlord |

The repair log carries over. If a tenant reported a leaking tap in March and is charged for it in June, the moving-out check shows the March entry next to that charge.

### Example

The deposit is ₹30,000 and rent is ₹15,000 a month. The tenant hands over the room on 15 June. The lease says the tenant pays for painting on exit and that a partial month is charged per day.

| Deduction | Amount | Result |
|---|---:|---|
| Repainting | ₹12,000 | Needs proof. The lease covers it, but no receipt was given. |
| June rent | ₹15,000 | Recalculate. 15 of 30 days is ₹7,500, so ₹7,500 is in question. |
| Service fee | ₹3,000 | Not found in the lease. |

RentChecker reports ₹10,500 to ask about (₹7,500 + ₹3,000) and ₹12,000 waiting for a receipt, then drafts the message.

## How it works

1. The tenant enters the facts and pastes the lease text. Zod checks every field.
2. Gemini reads the lease and suggests the clause that relates to each charge, with an exact quote. Lease text is sent separately from the instructions to limit prompt injection.
3. The server checks that each quote really appears in the lease. A quote that does not match is thrown away and the charge becomes "Unclear".
4. Plain TypeScript functions do all the arithmetic and choose the result. Gemini never calculates an amount or decides a result.
5. A message is drafted from the results. The tenant edits it, copies it and sends it themselves.

If Gemini is unavailable or no API key is set, the app falls back to keyword matching and tells the user.

### Results

Rules are tried from top to bottom and the first match wins. Every result shows its reason.

| Result | When |
|---|---|
| Recalculate | The amount differs from the recalculated one, or the charge is a duplicate |
| Unclear | A clause could not be confirmed, or facts needed for the check are missing |
| Not found in the lease | No clause in the pasted lease covers the charge |
| Needs proof | A clause covers a cost the landlord paid, such as painting, but the tenant received no receipt |
| Supported | A clause covers it, and either the amount matches the lease formula (rent, metered bills) or a receipt was given |

"Supported" and "Not found" describe the documents the tenant entered. They do not say whether a charge is legal.

## Boundaries

RentChecker will not:

- take or send payments, or hold money
- give legal advice or decide who is right
- contact the landlord or submit anything for the tenant
- manage properties, repair requests or chat between tenants and landlords
- compare photos, scan documents or check that a receipt is genuine
- need an account or store data in a server-side database

### Privacy

Entries stay in the browser's local storage, and the tenant can delete them. When AI matching is on, the lease text and charge descriptions are sent through the server to the Gemini API, and the app says so before sending. The server does not save them or write them to logs. Tenants are asked to remove names, ID numbers and bank details first.

## Assumptions

- Amounts are in Indian rupees, and the lease is pasted as English text.
- Amounts are stored as whole paise to avoid rounding errors.
- A partial month is charged per calendar day unless the lease says otherwise, and the handover day counts as a day of use.
- The tenant enters the whole lease and reports receipts truthfully. Missing pages can produce a wrong "Not found".
- Laws differ by state, so state rules are out of scope.

## Tech stack

| Part | Choice |
|---|---|
| Language | TypeScript, strict mode |
| Client | React, Vite, Tailwind CSS |
| Server | Node.js, Express |
| AI | Gemini API, called only from the server |
| Validation | Zod |
| Security | Helmet, request size limits, rate limiting |
| Tests | Vitest, Supertest |
| Hosting | Vercel, with a Dockerfile for Cloud Run |

Rate limits are kept in memory, so on serverless hosting they are only a partial safeguard.

Planned layout:

```text
client/   React interface
server/   Express routes, services and middleware
shared/   calculations, result rules, types and Zod schemas
api/      entry point that runs Express on Vercel
```

## Build order

Each step should leave a version that can be deployed and submitted.

- [ ] 1. Deploy an empty client and one API route to Vercel
- [ ] 2. Moving-out calculations and result rules, with tests
- [ ] 3. Moving-out screens, usable by keyboard and screen reader
- [ ] 4. Gemini clause matching, quote checking and the fallback
- [ ] 5. Draft message
- [ ] 6. Before-signing check
- [ ] 7. Bill check and repair log
- [ ] 8. Final test, security and accessibility pass

Steps 1 to 5 are the minimum version. Steps 6 and 7 are dropped if time runs out, and this README is updated to match what was built.

## License

[MIT](LICENSE)
