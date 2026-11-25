# Plan

Submission closes on 26 November 2026 at 01:30 Vietnam time (25 November, 18:30 UTC). There are two attempts. Stop adding features at 22:30 Vietnam time.

Work through the steps in order. Tick a step only when its exit check passes, and commit to `main` after each one.

| Done | Step | Exit check | Read first |
|---|---|---|---|
| [ ] | 0. `.gitignore`, `.env.example`, workspace, lint, test and build scripts | All scripts pass on an empty project | [CONVENTIONS](CONVENTIONS.md), [ARCHITECTURE](design/ARCHITECTURE.md) |
| [ ] | 1. Empty client and `/api/health` on Vercel | The public URL opens in a private window, health answers, refreshing a page does not give 404 | [DEPLOYMENT](design/DEPLOYMENT.md), [BACKEND](design/BACKEND.md) |
| [ ] | 2. Shared money, dates, rules and totals | Every D-ID case in CASES passes | [DOMAIN_RULES](spec/DOMAIN_RULES.md), [CASES](testing/CASES.md) |
| [ ] | 3. Moving-out screens with sample case and local storage | UC-1 works without a network, by keyboard alone | [F1](spec/F1-move-out.md), [UI](design/UI.md), [FRONTEND](design/FRONTEND.md), [DATA_MODEL](design/DATA_MODEL.md) |
| [ ] | 4. Clause matching with fallback | Works with a key, without a key and with a failing AI service | [F2](spec/F2-clause-matching.md), [API](design/API.md) |
| [ ] | 5. Draft message | UC-2 works on the deployed site | [F3](spec/F3-draft-message.md) |
| [ ] | 6. First submission check | Definition of done below | [STRATEGY](testing/STRATEGY.md) |
| [ ] | 7. Bill check and repair log | UC-4 and UC-5 work | [F5](spec/F5-bills-repairs.md) |
| [ ] | 8. Cloud save | UC-7 works on the deployed site, and F6-AC1 to F6-AC8 pass | [F6](spec/F6-cloud-save.md), [DATA_MODEL](design/DATA_MODEL.md), [ADR 0006](adr/0006-optional-postgres-cloud-save.md) |
| [ ] | 9. Review before signing | UC-3 works | [F4](spec/F4-before-signing.md) |
| [ ] | 10. Final pass | Definition of done below | [STRATEGY](testing/STRATEGY.md) |

Submit the first attempt after step 6, so a working version is in. Use the score to decide how far to go with steps 7 to 9. Step 10 always happens. Who does what is in [WORKFLOW.md](WORKFLOW.md).

## Definition of done for a submission

- Type check, lint, tests and build pass from a clean clone.
- The public URL works in a private window, on a phone and with a keyboard.
- No secret is in the repository, its history or the built client.
- The repository is public, under 10 MB and has only `main`.
- README describes only what works, and states the vertical, approach, how it works and assumptions.
- The LinkedIn post is public.

## Open questions

| Question | Owner | Needed by |
|---|---|---|
| Does the form accept a Vercel URL without affecting the score? | Ask the organisers | Step 6 |
| Which Gemini model and quota does the key have? | Project owner | Step 4 |
| Neon project and `DATABASE_URL` | Project owner | Step 8 |
