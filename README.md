# RentChecker

Check your rent and deposit charges before you argue about them.

> Status: the moving-out check works in the browser, with a sample case and local storage. The server can match clauses, and the screens for that come next. Progress is in [docs/PLAN.md](docs/PLAN.md).

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

## Approach and logic

Code makes every decision that can be checked, and AI only reads.

- Plain TypeScript functions do the arithmetic, choose each result and write the draft message. The same facts always give the same answer.
- Gemini finds the lease clause that relates to each charge. It never calculates an amount or decides a result.
- A quote from Gemini is kept only if it appears in the pasted lease.
- When something cannot be confirmed, the app says so. It does not guess.

The exact rules are in [docs/spec/DOMAIN_RULES.md](docs/spec/DOMAIN_RULES.md).

## How it works

1. The tenant enters the facts and pastes the lease text. Zod checks every field.
2. If the tenant agrees, the server sends the lease and the charge labels to Gemini, which suggests a clause and an exact quote for each charge. Rent is skipped, because the tenant enters the monthly rent.
3. The server compares each quote with the lease. A quote that does not match is thrown away and the charge becomes "Unclear".
4. The browser calculates the results and totals. This works without a network or a database.
5. A message is drafted from the results. The tenant edits it, copies it and sends it themselves.

Lease text is treated as untrusted data and kept apart from the instructions, which limits prompt injection. If Gemini is unavailable or no API key is set, the app falls back to keyword matching and tells the user. The tenant can overrule any match.

### Results

Rules are tried from top to bottom and the first match gives the main result. All other reasons that apply are listed with it.

| Result | When |
|---|---|
| Not found in the lease | No clause in the pasted lease covers the charge (rent does not need one) |
| Recalculate | The amount is higher than the recalculated one, or the charge is a duplicate |
| Unclear | A clause could not be confirmed or appears to rule the charge out, or a meter reading or rate is missing |
| Needs proof | A cost has no receipt, or a fixed fee has no amount in the lease |
| Supported | Everything else |

Each charge is then split into four totals that add up to the amount deducted: ask about, awaiting proof, unclear and consistent.

"Supported" and "Not found" describe the documents the tenant entered. They do not say whether a charge is legal.

## Boundaries

RentChecker will not:

- take or send payments, or hold money
- give legal advice or decide who is right
- contact the landlord or submit anything for the tenant
- manage properties, repair requests or chat between tenants and landlords
- compare photos, scan documents or check that a receipt is genuine
- need an account, or store lease text on a server

The full scope is in [docs/spec/SRS.md](docs/spec/SRS.md).

### Privacy

Entries stay in the browser's local storage, and the tenant can delete them. A tenant can also choose to keep a cloud copy in PostgreSQL, opened with a recovery code. It holds dates, amounts, labels, repairs and the bill form, never the lease text or quotes, and it can be deleted at any time. When AI matching is on, the lease text and charge descriptions are sent through the server to the Gemini API, and the app says so before sending. Google handles them under its own terms, and on the free tier it may use them to improve its products and people may review them. The RentChecker server does not save them or write them to logs. Tenants are asked to remove names, ID numbers and bank details first.

## Assumptions

- Amounts are in Indian rupees, and the lease is pasted as English text.
- Amounts are stored as whole paise to avoid rounding errors.
- A partial month is charged per calendar day and the handover day counts as a day of use. The tenant can change both.
- The tenant enters the whole lease and reports receipts truthfully. Missing pages can produce a wrong "Not found".
- Laws differ by state, so state rules are out of scope.

## Tech stack

| Part | Choice |
|---|---|
| Language | TypeScript, strict mode |
| Client | React, Vite, Tailwind CSS |
| Server | Node.js, Express |
| AI | Gemini API, called only from the server |
| Database | PostgreSQL on Neon, optional cloud save |
| Validation | Zod |
| Security | Helmet, request size limits, rate limiting |
| Tests | Vitest, Supertest, Testing Library, axe |
| Hosting | Vercel, with a Dockerfile for Cloud Run |

Rate limits are kept in memory, so on serverless hosting they are only a partial safeguard.

Planned layout:

```text
client/   React interface
server/   Express routes, services and middleware
shared/   calculations, result rules, types and Zod schemas
api/      entry point that runs Express on Vercel
db/       SQL migrations for the optional cloud copy
docs/     specifications, design, decisions and test cases
```

## Development

Needs Node 24.

```text
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

## Documentation

| Topic | Files |
|---|---|
| Requirements and use cases | [SRS](docs/spec/SRS.md), [domain rules](docs/spec/DOMAIN_RULES.md), [feature specs](docs/spec) |
| Design | [architecture](docs/design/ARCHITECTURE.md), [data model](docs/design/DATA_MODEL.md), [API](docs/design/API.md), [user flow](docs/design/USER_FLOW.md), [UI](docs/design/UI.md), [deployment](docs/design/DEPLOYMENT.md) |
| Decisions | [ADRs](docs/adr/README.md) |
| Tests | [strategy](docs/testing/STRATEGY.md), [cases](docs/testing/CASES.md) |
| Work | [plan](docs/PLAN.md), [workflow](docs/WORKFLOW.md), [conventions](docs/CONVENTIONS.md), [instructions for coding agents](AGENTS.md) |

## License

[MIT](LICENSE)
