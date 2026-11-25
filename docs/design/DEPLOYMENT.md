# Deployment

Primary target is Vercel Hobby with one project. A Docker image for Cloud Run is the fallback (ADR 0004). Anything not confirmed by running it is listed under "Not verified yet".

## Vercel

| Part | Setup |
|---|---|
| Client | `vite build` writes `client/dist`. Vercel serves it as static files |
| API | `api/index.ts` default exports the Express app from `server/`. Vercel turns an Express app into a single function |
| Rewrites | `/api/(.*)` goes to the function. Every other path that is not a file goes to `/index.html` for the SPA |
| Static files | `express.static()` is ignored on Vercel, so Express never serves the client there |
| Duration | Hobby maximum is 300 seconds. The AI call is limited to 20 seconds, so the default is enough. A shorter explicit value is still worth setting |
| Body size | Vercel allows 4.5 MB by default. Express rejects bodies above 200 KB first (API.md) |

A starting `vercel.json` has a build command and output directory for the client, the two rewrites, and a `headers` block that sends the same CSP as Helmet for client files. Its exact keys are not verified yet.

## Environment variables

| Name | Used by | Notes |
|---|---|---|
| `GEMINI_API_KEY` | server | Secret. Set in the Vercel dashboard or the Cloud Run secret store |
| `GEMINI_MODEL` | server | Model name, chosen at deploy time and not written in code or docs |
| `DATABASE_URL` | server, migrations | Secret. Optional, only for F6. The pooled Neon connection string |
| `PORT` | Docker and local only | Cloud Run sets it. Vercel ignores it |

Never prefix a name with `VITE_`, because Vite copies those into the browser bundle (NFR-1). Change a value, then redeploy.

`.env.example` is committed and holds the names with empty values:

```text
GEMINI_API_KEY=
GEMINI_MODEL=
DATABASE_URL=
PORT=3001
```

Add to `.gitignore`:

```text
node_modules/
dist/
dist-server/
.env
.env.*
!.env.example
.vercel/
coverage/
*.log
```

## Local development

1. Copy `.env.example` to `.env` and fill it in. Without a key the app still runs in keyword mode.
2. Install once at the repository root.
3. Run the Express server and the Vite dev server. Vite proxies `/api` to Express.
4. Run tests with Vitest. Supertest imports `createApp`, so no port is opened.

Script names are chosen when the project is created and are not fixed here.

## Database for F6

1. The owner creates a free Neon project and copies the pooled connection string.
2. The owner puts it in `.env` and in the Vercel environment variables. It is never pasted into chat or committed.
3. Run the migration script once from a local machine.
4. Deploy, then save, open and delete a test case.

Neon's free plan needs no card and allows 1 GB of storage, 100 compute hours and 5 GB of transfer a month per project. Compute sleeps after 5 idle minutes. Checked on neon.com/pricing on 2026-11-25.

## Docker for Cloud Run

Two stages. The build stage installs all dependencies, builds the client and compiles the server. The run stage installs production dependencies only, copies the build output and runs the server as a non-root user.

- Express serves `client/dist` through `staticDir` and the SPA fallback, after the API routes ([BACKEND.md](BACKEND.md)).
- The process listens on `PORT` at `0.0.0.0`.
- The key and model name are passed at deploy time. They are not baked into the image. `.dockerignore` excludes `.env` and `node_modules`.
- The image holds no state, so any instance can serve any request.

## Smoke checklist after deploy

1. `GET /api/health` returns 200 and `aiConfigured` is true. After step 8, `cloudSaveConfigured` is true too.
2. An unknown `/api/x` path returns 404 `NOT_FOUND` as JSON.
3. Open `/move-out` directly and reload. The page loads (SPA fallback).
4. Load the sample case with the network off. Results and totals still show (NFR-6).
5. Send a valid match request. The response is 200, with `mode` `ai`.
6. Send an invalid body, then a body above 200 KB. The responses are 400 and 413.
7. Unset the key on a preview deploy. The response is `mode` `keyword` with `AI_NOT_CONFIGURED`.
8. Response headers include the CSP.
9. Search the built client for `GEMINI` and for the start of the key. Nothing matches (NFR-1).
10. Look at the platform logs after step 5. No lease text appears (NFR-2).
11. Send 21 match requests within 10 minutes. Note whether a 429 appears. On serverless it may not.

## Rollback

- Vercel: promote the previous deployment from the dashboard. Then run the smoke checklist.
- Cloud Run: send traffic back to the previous revision.
- A leaked key: revoke it in the Google console, create a new one, set it, redeploy.

## Not verified yet

- Whether the `/api/(.*)` rewrite hands Express the original path, so routes match as written.
- How `api/index.ts` pulls in `server/` and `shared/` at build time, including module format and import extensions.
- The `vercel.json` keys for headers, duration and rewrites.
- The right `trust proxy` hop count on Vercel and on Cloud Run.
- Whether a Vercel link is accepted by the contest form, which asks for a Cloud Run URL (ADR 0004).
- Cloud Run request timeout and cold start time with this image.
- The CSP directives that let the built client run with no inline script.
- The Node version to use on both platforms.
