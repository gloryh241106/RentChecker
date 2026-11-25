# API

The server has two routes. Calculations run in the browser with the shared functions and do not need the server.

## GET /api/health

`200`

```json
{ "status": "ok", "aiConfigured": true }
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

An AI failure is not an error. The server answers `200` in keyword mode with a warning. The AI call is cancelled after 20 seconds and is not retried.

## Errors

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "leaseText must have at least 50 characters", "fields": ["leaseText"] } }
```

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Body is not valid JSON or breaks a rule above. `fields` lists the paths, for example `items.0.label` |
| 404 | `NOT_FOUND` | Unknown `/api` path |
| 413 | `PAYLOAD_TOO_LARGE` | Body above 200 KB (204,800 bytes) |
| 429 | `RATE_LIMITED` | More than 20 match requests in 10 minutes from one client. Health is not limited |
| 500 | `INTERNAL_ERROR` | Anything else. The message is generic |

Error messages never contain lease text, stack traces or provider responses.
