# Conventions

## Language and style

- TypeScript strict mode everywhere. No `any`, no `@ts-ignore`, no non-null `!`. Use `unknown` and narrow it.
- Code, comments, commits and interface text are in English.
- Prettier formats, ESLint checks. Both pass before a commit.
- Functions do one thing. Split a file that passes about 200 lines.
- Comments explain why. A rule is cited by its ID, for example `// D-20`.
- No dead code, commented-out code or `console.log`.

## Names

| Thing | Style | Example |
|---|---|---|
| React component and its file | PascalCase | `DeductionCard.tsx` |
| Other files | kebab-case | `prorate-rent.ts` |
| Functions, variables | camelCase | `expectedPaise` |
| Types | PascalCase | `Deduction` |
| Constants | UPPER_SNAKE | `MAX_DEDUCTIONS` |
| Amounts | end in `Paise` | `depositPaise` |
| Result and reason codes | exactly as in DOMAIN_RULES.md | `not_found`, `RECEIPT_MISSING` |

## Boundaries

- `shared/` holds pure functions, types and Zod schemas. It does no I/O, reads no environment variables and never reads the clock.
- `client/` and `server/` may import `shared/`. `shared/` imports neither, and `client/` never imports `server/`.
- Calculations and results live only in `shared/`, never in components, controllers or prompts.
- Data from users, local storage, the network, the database or AI is parsed with Zod before use.
- SQL appears only in the case repository and in `db/migrations/`. Values are always query parameters.

## Errors

- Expected problems are typed results or typed errors. Unexpected ones reach the single error handler.
- Never swallow an error silently. Never show a stack trace or provider message to the user.
- An AI failure falls back to keyword mode. It never blocks calculations.

## Security and privacy

- Secrets come from environment variables on the server. Nothing secret starts with `VITE_`.
- `.env` is never committed. `.env.example` holds names only.
- Never log lease text, labels, quotes or request bodies.
- Render user and AI text as text. No `dangerouslySetInnerHTML`.
- Add a dependency only when it replaces real work, and run `npm audit` before release.

## Accessibility

- Use native elements before ARIA. Every input has a visible label.
- Everything works with a keyboard and focus is always visible.
- Meaning is never carried by colour alone.

## Tests

- A test title starts with the rule it checks: `D-20 prorates rent by calendar day`.
- Tests never call the real AI service or the network.
- A bug fix starts with a failing test.

## Git

- One branch, `main`. Never create or push another branch.
- Small commits in Conventional Commits form: `feat:`, `fix:`, `test:`, `docs:`, `chore:`.
- Type check, lint, tests and build pass before a push.
- If code and spec disagree, change the spec first, then the code, in the same commit.
