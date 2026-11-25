# Backend

Express with TypeScript strict. Routes are specified in [API.md](API.md) and not repeated here. There is no session. PostgreSQL is optional and used only by F6. Calculations are not done here (see [ARCHITECTURE.md](ARCHITECTURE.md)).

## Layers

Calls go one way: route, controller, service, then shared functions or the AI client.

| Layer | Does | Must not |
|---|---|---|
| Route | Binds a path and method to middleware and a controller | Hold logic |
| Controller | Parses the body with the shared Zod schema, calls one service, sends the response | Call the AI client, touch `process.env`, build error bodies by hand |
| Service | Chooses AI or keyword mode, verifies quotes, builds the match list, maps failures to warnings | Import Express types, read `req` or `res` |
| Shared functions | Pure code from `shared/` | Be changed for server needs |
| AI client | One call to Gemini, returns validated data or throws a typed error. `gemini-call.ts` is the call, and the clause matcher and the prompt reader are two users of it | Verify quotes, know about HTTP |
| Case repository | All SQL, in transactions, behind an interface | Know about HTTP, return rows outside the given case |
| Error handler | Turns any thrown error into the error body in API.md | Include input text, stack traces or provider responses |

## App factory

`server/src/app.ts` exports `createApp(options)` and does not call `listen`. `server/src/index.ts` calls it and listens on `PORT`. `api/index.ts` default exports the same app for Vercel. Tests import `createApp` with Supertest and pass a fake AI client through `options`.

`createApp` takes an optional `staticDir`. When set (Docker only), it serves the built client and the SPA fallback after the API routes. See [DEPLOYMENT.md](DEPLOYMENT.md).

## Middleware order

1. `trust proxy` setting (not middleware, set first)
2. Helmet with a Content Security Policy
3. Request logger, before the body parser so that a rejected body is logged too
4. `express.json` with a 200 KB limit
5. Rate limits on `/api/clauses/match`, `/api/assistant/read` and `/api/cases`
6. Routes
7. 404 handler for unknown `/api` paths
8. Static files and SPA fallback, only when `staticDir` is set
9. Error handler, always last

The error handler maps a body over the limit to 413 `PAYLOAD_TOO_LARGE`, any other malformed request (a JSON syntax error, an unknown charset, a broken URL) to 400 `VALIDATION_ERROR`, and the rest to 500 `INTERNAL_ERROR` with a generic message.

Helmet's CSP on the API alone protects little. The same policy must also be sent for the client files, from Express in Docker and from `vercel.json` on Vercel. The policy blocks inline scripts and allows only same origin connections. Exact directives are not verified yet.

## Trust proxy and rate limiting

Vercel and Cloud Run put a proxy in front of Express. Without a trust proxy setting, every request looks like it comes from the proxy and one client can exhaust the limit for all. Set `trust proxy` to 1, so Express reads the client address from the last forwarded hop. Which hop count is right on each platform is not verified yet.

The limit is 20 match requests per 10 minutes per client (API.md). The counter is in memory. On serverless each instance has its own counter and instances come and go, so the limit is only partial. It slows casual abuse and does not cap Gemini cost. A spend limit on the key is the real cap.

## AI client

- The key and the model name come only from `GEMINI_API_KEY` and `GEMINI_MODEL`. No default model is written in code. If either is missing, `aiConfigured` is false and the service uses keyword mode with `AI_NOT_CONFIGURED`.
- One request per check, however many items (NFR-6). The one retry after 503 is the exception.
- Structured JSON output is requested with a response schema. The reply is parsed again with Zod. Anything that does not parse is a failure, not a partial result.
- The request is aborted after 20 seconds.
- When Gemini answers 503 (overloaded), the server waits 1 second and asks one more time. Both calls and the wait share the 20 seconds. No other failure is retried, because a second call would not help or would add to the load.
- `retryWhenOverloaded` wraps the matcher and is added in `bootstrap.ts`, so the Gemini client and the service do not know about it.
- Failures map to warnings. Timeout gives `AI_TIMEOUT`. Any other failure, including invalid output, gives `AI_UNAVAILABLE`. The route still answers 200 in keyword mode.
- The AI answer holds only an item id, one of `covers`, `excludes` or `none`, and a quote (F2-R5). It has no amount and no result.
- The reading of a prompt holds a task, sources and doubts (F9-R2). Its schema has no field for an amount or a date. The assistant service drops what is not in the prompt (F9-R3).

## Quote check

The comparison is F2-R4, and the mapping to states is F2-R5 and F2-R6. The keyword fallback is F2-R7 to F2-R11. The quote check lives in `shared/`, because the browser also uses it for FR-11.

## Prompt injection

Lease text, labels and prompts are untrusted. Defences, from strongest:

1. Code decides results, so a hijacked reply cannot change an amount or a result (ADR 0003).
2. The output schema allows only three answers and a quote. Extra fields are dropped.
3. A quote must appear in the lease, so invented text is rejected.
4. The lease is sent as a separate content part from the instructions, wrapped in delimiters, with an instruction to treat it as data.
5. Labels and prompts are length limited by the schema (API.md).
6. A prompt can change only the task, facts and doubts shown, and the tenant confirms them (F9-R13).

These lower the risk. They do not remove it. A lease that contains the right quote text can still push a state to `verified`. A-5 in the SRS covers what a quote proves.

## Case storage (F6)

- The repository is created only when `DATABASE_URL` is set. Without it, case routes answer 503 and the rest works.
- `pg` pool with 1 connection per instance, TLS with certificate checks, 5 second connect and statement limits.
- All values are query parameters. Every statement filters by the case found from the code hash.
- Saving runs in one transaction: lock the case row, compare the revision, replace the child rows, add 1 to the revision.
- Dates are read as text, not as JavaScript `Date`, so no time zone can shift them (D-5).
- The recovery code is hashed as soon as the header is parsed. It is never logged.
- Migrations are run by a script before deploy, never when the server starts.

## Logging

A small logger wrapper writes one line per request: method, route, status, duration, mode, warning codes and a request id. It never logs bodies, headers with content, lease text, labels, quotes or provider replies (NFR-2). Errors log the error code and class name, not the message. An AI failure logs its kind (request failed, HTTP status, invalid reply), so a wrong key can be told from an outage. A test sends a lease with a marker string and checks the captured log lines do not contain it.
