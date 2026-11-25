# Test strategy

This file says how RentChecker is tested. The cases themselves are in [CASES.md](CASES.md). Rules come from [DOMAIN_RULES.md](../spec/DOMAIN_RULES.md) and requirements from [SRS.md](../spec/SRS.md).

## Levels

| Level | Tool | Covers | Where |
|---|---|---|---|
| Unit | Vitest | Everything in `shared/`: money parsing (D-3, D-4), dates (D-5), expected amounts (D-20 to D-25), results (D-32 to D-36), reasons (D-37), buckets and totals (D-40 to D-43), the quote check, keyword matching, the message template | next to the code, `*.test.ts` |
| API | Vitest and Supertest | Both routes: validation, every error status, AI success, AI failure, timeout, quote rejection, rate limit, logging, injection text | `server/` |
| Database | Vitest and PGlite, a PostgreSQL engine that runs in the test process | Migrations, constraints, transactions and access by code (F6) | `server/` |
| Component | Vitest and Testing Library | Screens and flows: field errors and focus, consent notice, keyword notice, labels, out-of-date notice, delete everything, copy | `client/` |
| End to end | Playwright in a real browser, against the built client and server | Whole use cases, offline use, reload, keyboard, phone width, CSP, axe with colour contrast (T-200 to T-210, T-213 to T-217 and T-236 to T-238) | `e2e/` |
| Manual | A person | Screen reader, zoom, reflow, contrast, target size, reduced motion, a real phone | CASES.md, last table |

An automated axe check runs inside the component level on every screen. It does not replace the manual pass.

## Rules for tests

- The AI client is always faked. The fake can return a scripted answer, throw, or never answer. No test calls Gemini or a hosted database, and none needs a key.
- Calculation tests are table driven. They take dates as input and never read the clock.
- Timeouts and the rate-limit window use fake timers, so the suite stays fast.
- Calculations are pure functions, so unit tests need no browser and no server.
- The component level fakes `fetch` and the clipboard, and uses an in-memory local storage.
- The end-to-end level runs the real server without a key, so it uses keyword mode. AI answers are faked by intercepting `/api/clauses/match` in the browser. Elements are found by role, label or visible text.
- Tests never use real names, leases or keys. Lease text in API tests carries a marker string, so the log and error tests can search for it.

## Naming rule

A test title starts with the rule ID, then a short phrase, then the case ID. For example: `D-20 handover day not counted (T-026)`. A test that covers several IDs starts with the first. API and component tests start with the FR, NFR or API term from the Rule column.

The acceptance criteria in the feature specs (F1-AC1 to F8-AC6) are tests too. A test title uses the AC ID when no case in CASES.md covers it.

## If time runs short

The first submission needs T-001 to T-151, the axe check (T-173) and T-156, T-158, T-160, T-161, T-165 and T-168. The other component cases follow. A case that was not written is listed as not covered, never marked as passed.

## Coverage

There is no percentage target. Instead:

- Every D-ID in DOMAIN_RULES.md has at least one test whose title starts with it. To check, list the IDs found in test titles and compare them with DOMAIN_RULES.md: `grep -rhoE "D-[0-9]+" --include=*.test.ts . | sort -u`
- Every Must requirement (FR-1 to FR-13) has at least one test.
- Every reason code in D-37 and every warning and error code in API.md appears in at least one expected result.
- Every result case in CASES.md checks that the four buckets add up to the amount charged.
- The worked example in DOMAIN_RULES.md is one test and must match exactly.

| Requirement | Main level |
|---|---|
| FR-1, FR-2, FR-3 | Component, with unit tests for D-3, D-4, D-5 |
| FR-4, FR-5 | Unit, then component for the display |
| FR-6, FR-7 | Component |
| FR-8, FR-9 | API, then component |
| FR-10 | API and component |
| FR-11, FR-12 | Component |
| FR-13 | Unit for the template, component for edit and copy |
| FR-14 to FR-16 (Should) | Same rule, once built |
| FR-20 | Component, with a unit test for the suggestions |
| FR-21 | Unit, then component for the list |
| FR-17 to FR-19, NFR-9 (Should) | Database and API, then component, once built |
| NFR-1, NFR-2 | API |
| NFR-3, NFR-6 | API and component |
| NFR-4 | CASES.md rule column |
| NFR-5 | Component axe check and manual pass |

## Definition of done

A build step is done when:

- The cases in CASES.md for that step pass and none is skipped, within the limits above.
- The coverage checks above pass.
- Type check and lint pass with no `any` (NFR-7).
- The built client has been searched for the API key and found clean (NFR-1).
- For any screen that changed, the manual accessibility rows have been run on a phone-width viewport and a desktop one, and the result is noted in the commit message.
- README and docs match what was built. Features not built are marked as dropped.
