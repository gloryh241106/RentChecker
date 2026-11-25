# 0006 Optional PostgreSQL cloud save

Status: Accepted, 2026-11-25. Amends 0002.

## Context

A repair log is collected over a whole tenancy, but local storage is lost when site data is cleared or the phone changes. Accounts would add passwords, email and more private data than the app needs. The database must cost nothing.

## Decision

- Cloud save is optional and off by default. Local storage stays the working copy.
- The store is PostgreSQL on Neon, reached through the standard `pg` driver and `DATABASE_URL`, so another PostgreSQL host can replace it.
- A case is opened with a random recovery code. Only its SHA-256 hash is stored. A plain hash is enough because the code has 160 random bits.
- Lease text, quotes and the draft message never reach the database.
- Tables are relational, with foreign keys and check constraints. Migrations are plain SQL files.
- It is built after the first submission.

## Consequences

- A case survives a lost device if the tenant kept the code. A lost code means a lost cloud copy.
- The server now holds some private data, so access tests, expiry and deletion are required.
- The free compute sleeps when idle, so the first request after a pause is slower.
- The app must keep working when the database is missing or down.

## Alternatives

- Supabase: also PostgreSQL and free, but free projects are paused after one week without activity.
- Google Sheets: free, but 60 writes a minute per user, no transactions or foreign keys, and it needs a service account key.
- One encrypted blob per case: more private, but no relational constraints.
- Accounts with a password: more code and more private data for no gain here.
