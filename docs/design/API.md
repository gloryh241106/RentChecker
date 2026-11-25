# API

Calculations run in the browser with the shared functions and do not need the server. Case routes belong to F6 and are added in step 8.

## GET /api/health

`200`

```json
{ "status": "ok", "aiConfigured": true, "cloudSaveConfigured": false }
```

## POST /api/clauses/match

Finds the lease clause that relates to each item. Used by F2 for deductions and by F4 for review topics.

Request:

```json
{
  "leaseText": "The tenant shall pay for painting on exit...",
  "items": [{ "id": "d1", "label": "Repainting" }]
}
```

| Field | Rule |
|---|---|
| `leaseText` | String, 50 to 40,000 characters after trimming |
| `items` | 1 to 20 |
| `items[].id` | 1 to 40 characters, letters, digits, `-` or `_`, unique in the request |
| `items[].label` | 1 to 120 characters after trimming |

Unknown fields are rejected.

Response `200`:

```json
{
  "mode": "ai",
  "warnings": [],
  "matches": [
    { "itemId": "d1", "state": "verified", "quote": "The tenant shall pay for painting on exit", "source": "ai" }
  ]
}
```

| Field | Values |
|---|---|
| `mode` | `ai` or `keyword` |
| `warnings` | Any of `AI_NOT_CONFIGURED`, `AI_UNAVAILABLE`, `AI_TIMEOUT`, `QUOTE_REJECTED` |
| `matches[].state` | `verified`, `excludes`, `none` or `unconfirmed` (D-30) |
| `matches[].quote` | Text for `verified` and `excludes`, otherwise `null` |
| `matches[].source` | `ai` or `keyword`, the same as `mode` for every item |

The server never returns `user` or `sample`. Those sources exist only in the browser ([DATA_MODEL.md](DATA_MODEL.md)).

There is exactly one match per item, in request order. Keyword mode returns only `verified` or `unconfirmed`.

An AI failure is not an error. The server answers `200` in keyword mode with a warning. The AI call is cancelled after 20 seconds. Only a 503 from Gemini is retried, once, within those 20 seconds.

## Case routes (F6)

A cloud case is `{ tenancy, deductions, repairs, bill }`, with the field rules of [DATA_MODEL.md](DATA_MODEL.md). Unknown fields are rejected, so lease text, quotes and evidence cannot be sent. All routes except create need `Authorization: Bearer <recovery code>`. Responses carry `Cache-Control: no-store`.

| Route | Body | Success |
|---|---|---|
| `POST /api/cases` | `{ case }` | `201 { recoveryCode, revision, expiresAt }` |
| `GET /api/cases/current` | none | `200 { case, revision, expiresAt }` |
| `PUT /api/cases/current` | `{ revision, case }` | `200 { revision, expiresAt }` |
| `DELETE /api/cases/current` | none | `204` |

`expiresAt` is an ISO 8601 time, 365 days after the last save.

## Errors

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "leaseText must have at least 50 characters", "fields": ["leaseText"] } }
```

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Body is not valid JSON or breaks a rule above. `fields` lists the paths, for example `items.0.label`, and is absent when the body is not valid JSON |
| 401 | `UNAUTHORIZED` | Case route with a missing or malformed code |
| 404 | `NOT_FOUND` | Unknown `/api` path |
| 404 | `CASE_NOT_FOUND` | The code matches no case, or the case has expired |
| 409 | `REVISION_CONFLICT` | The sent revision is stale. The error also holds `currentRevision` |
| 413 | `PAYLOAD_TOO_LARGE` | Body above 200 KB (204,800 bytes) |
| 429 | `RATE_LIMITED` | More than 20 match requests in 10 minutes from one client. Health is not limited |
| 429 | `RATE_LIMITED` | More than 10 new cases in an hour, or 120 other case requests in 10 minutes, from one client |
| 500 | `INTERNAL_ERROR` | Anything else. The message is generic |
| 503 | `STORAGE_UNAVAILABLE` | Case route when no database is configured or it does not answer in 5 seconds |

Error messages never contain lease text, recovery codes, SQL, stack traces or provider responses.
