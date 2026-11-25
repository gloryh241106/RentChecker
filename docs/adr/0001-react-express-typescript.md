# 0001 React, Express and TypeScript

Status: Accepted, 2026-11-25

## Context

One developer builds the app in one day with a coding agent. The same calculation code must run in the browser and be tested on the server. The AI key must stay off the client (NFR-1).

## Decision

- TypeScript in strict mode everywhere (NFR-7).
- React with Vite and Tailwind for the client.
- Express for the server.
- A `shared/` folder with calculations, result rules, types and Zod schemas, imported by both sides.
- Vitest, Supertest and Testing Library with axe for tests.

## Consequences

- One language and one set of types for the request, the response and the stored data.
- The shared code is the single source of the D-rules, so the browser and the tests cannot drift apart.
- Dependency rules need enforcing (see ARCHITECTURE.md).
- Express is more setup than a framework with built in routing, but the team knows it and it fits both Vercel and Docker.

## Alternatives

- Next.js: fewer pieces, but ties the app to its conventions and hides the Cloud Run fallback.
- A Python backend: weaker sharing of types and rules with the client.
- Plain JavaScript: faster to start, but loses the compile time checks on money code.
