# 0003 Code decides, AI only finds clauses

Status: Accepted, 2026-11-25

## Context

The app tells a tenant whether a charge needs an explanation. Language models can make arithmetic mistakes, invent quotes and follow instructions hidden in pasted text. The tenant may send the result to a landlord.

## Decision

- Plain TypeScript in `shared/` does every calculation and picks every result, reason and total (D-20 to D-43).
- Gemini only suggests a clause and an exact quote for each item, in one request per check (NFR-6).
- The server keeps a quote only if it appears in the pasted lease (FR-9). Otherwise the item is `unconfirmed`.
- If Gemini is missing or fails, keyword matching takes over and the app says so (FR-10, NFR-3).

## Consequences

- Results are repeatable and every rule has a test (NFR-4).
- A prompt injection can at worst change a clause suggestion, which the tenant can overrule (FR-11).
- Clause matching is weaker than a model reading the whole lease, because a quote must be in the lease (F2-R4).
- The app proves that words are in the lease, not what they mean in law (A-5).

## Alternatives

- Let the model compute amounts and results: faster to build, not reproducible, and hard to test.
- No AI, keywords only: simple and private, but misses clauses with different wording.
- Model output without quote checking: easier, but shows invented quotes.
