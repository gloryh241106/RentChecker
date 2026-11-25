# Conventions

## Language and style

- TypeScript strict mode everywhere. No `any`, no `@ts-ignore`, no non-null `!`. Use `unknown` and narrow it.
- Code, comments, commits and interface text are in English.
- Prettier formats, ESLint checks. Both pass before a commit.
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

## Design: SOLID, kept small

| Principle | In this project |
|---|---|
| Single responsibility | One reason to change per file. A component renders, a hook holds state, a service decides, a repository stores. A component never calls `fetch` or local storage |
| Open and closed | Kinds, reasons and warnings are typed tables or discriminated unions. Adding a kind adds an entry, and the compiler reports every place that must handle it. No long `if` chains on `kind` |
| Liskov substitution | Every implementation of an interface passes the same tests: real and fake AI client, database and in-memory repository |
| Interface segregation | Small interfaces made for the caller: `ClauseMatcher`, `CaseRepository`, `WorkspaceStorage`, `Logger`. Pass only the fields a function needs |
| Dependency inversion | Services and hooks get their dependencies as arguments or options. Only `createApp` and the React root choose the real ones. Nothing but the server entry reads `process.env` |

- Add an interface only where a second implementation exists, including a test fake. No base classes, no factories for one type, no layers that only pass calls on.
- Pure functions before classes. Composition before inheritance.
- ESLint enforces the limits: 200 lines per file, 50 per function (150 for a React component or a test), complexity 10, depth 3, 4 parameters. A rule table or test table may be longer, with a reason in a comment.

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
