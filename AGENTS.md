# Instructions for coding agents

RentChecker helps a tenant check rent and deposit charges against their lease.

## Before you write code

1. Read [docs/PLAN.md](docs/PLAN.md) and find the first step that is not ticked. Work on that step only.
2. Read the files in its "Read first" column, and [docs/CONVENTIONS.md](docs/CONVENTIONS.md).
3. Say which rule IDs you will implement and which files you will touch.

## Sources of truth

| Question | File |
|---|---|
| What must the app do, and what is out of scope? | [docs/spec/SRS.md](docs/spec/SRS.md) |
| How is an amount, result or total worked out? | [docs/spec/DOMAIN_RULES.md](docs/spec/DOMAIN_RULES.md) |
| How does one feature behave? | `docs/spec/F*.md` |
| What are the routes and errors? | [docs/design/API.md](docs/design/API.md) |
| Where does code go? | `docs/design/` |
| Why was it decided? | `docs/adr/` |
| What proves it works? | `docs/testing/` |

DOMAIN_RULES.md wins over a feature spec. Specs win over design files. If two files disagree or something is missing, stop and ask.

## Never

- Add a feature, route, field, dependency or rule that the docs do not describe.
- Let AI calculate an amount, choose a result or write the message.
- Put calculations outside `shared/`.
- Commit a secret, or log lease text, labels or quotes.
- Create or push any branch other than `main`, or force push.
- Change or delete a test to make it pass.
- Tick a step whose exit check you have not run.

## When a step is finished

1. Run type check, lint, tests and build. Report the real output, including failures.
2. Tick the step in PLAN.md and update README only for what now works.
3. Commit with a Conventional Commits message. Push only when asked.
