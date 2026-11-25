# 0004 Vercel with a Docker fallback

Status: Accepted, 2026-11-25

## Context

The contest form asks for a Cloud Run URL. The event resources page says any suitable cloud platform is allowed. Whether a Vercel link is accepted is not confirmed. Vercel Hobby deploys the Vite build and an Express app as one function with little setup. An in-memory rate limit works only partly on serverless.

## Decision

Deploy to Vercel first. Keep a Dockerfile in which Express also serves the built client and listens on `PORT`, so the same code can run on Cloud Run. Build step 1 deploys an empty client and one route, so the platform risk shows up early. Ask the organisers whether a Vercel link is accepted, and if not, deploy the image to Cloud Run before submitting.

## Consequences

- Fast deploys and previews on Vercel.
- The app factory is separate from `listen`, and `staticDir` is optional (BACKEND.md).
- Two deploy paths to keep working. The Docker path is tested once before submission.
- Rate limiting is only partial on both platforms, because the counter is per instance.
- Details not yet confirmed are in DEPLOYMENT.md under "Not verified yet".

## Alternatives

- Cloud Run only: matches the form, but slower to set up and deploy.
- Vercel only: risk that the submission is not accepted.
- Split the client and the API across two hosts: needs CORS and a second deployment for no gain.
