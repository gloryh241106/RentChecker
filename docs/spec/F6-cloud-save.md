# F6 Cloud save

## Goal

The tenant can keep a copy of their case in PostgreSQL and open it on another device, so a repair log built up over a year is not lost with one browser.

## Covers

FR-17 to FR-19, UC-7, NFR-9. Tables are in [DATA_MODEL.md](../design/DATA_MODEL.md), routes in [API.md](../design/API.md).

## Inputs and outputs

A cloud case holds the tenancy facts, deductions, repairs and the bill form. It never holds lease text, quotes, evidence or the draft message.

## Rules

- F6-R1 Cloud save is off until the tenant turns it on. Everything else works without it and without a database.
- F6-R2 Before the first save, a notice lists what is stored and what is not, says the case is deleted 365 days after the last save, and asks to continue. On Cancel nothing is sent.
- F6-R3 The first save returns a recovery code. The server makes it from 20 random bytes of a cryptographic generator and writes it as 32 Crockford base32 characters in groups of 4. The database holds only the SHA-256 hash of the code.
- F6-R4 The code is shown with a Copy button and the text "Anyone with this code can open and change this case. We cannot recover it if you lose it." The browser keeps it under `rentchecker:cloud:v1`.
- F6-R5 When the code is typed in, case, spaces and hyphens are ignored, `O` is read as `0`, and `I` and `L` as `1`.
- F6-R6 The code travels only in the `Authorization` header, never in a URL, and is never logged.
- F6-R7 "Save to cloud" sends the whole case with the revision it was based on. The server replaces the rows in one transaction and adds 1 to the revision. The page shows the time of the last save and "Not saved yet" after an edit.
- F6-R8 If the revision is stale, the server changes nothing and answers 409. The tenant chooses "Load the cloud copy" or "Replace the cloud copy".
- F6-R9 "Open a saved case" asks for the code. If local data exists, the tenant confirms before it is replaced. After opening, every deduction is `unconfirmed` and the page says "Paste the lease again to check clauses."
- F6-R10 "Delete the cloud copy" asks for confirmation, deletes the case and all its rows, and forgets the code. If cloud save is on, "Delete everything" (F1-R19) does this too. If the server cannot be reached, the local data is deleted, the code is kept, and the app says the cloud copy still exists.
- F6-R11 A case that is past its expiry is treated as not found. Expired cases are deleted when a new case is created.
- F6-R12 The sample case cannot be saved to the cloud.
- F6-R13 If no database is configured or it fails, the cloud controls say "Cloud save is not available right now." Local data and calculations are not affected.
- F6-R14 The server validates a case with the same shared schema rules as local storage. All SQL is parameterised, and every query is limited to the case found by the code hash.

## Acceptance criteria

- F6-AC1 Given a case with 2 deductions and 1 linked repair, when it is saved and opened with its code, then the facts, the order and the link are the same.
- F6-AC2 Given a saved case, when the database rows are read, then they contain no lease text, no quote and no recovery code.
- F6-AC3 Given codes A and B for two cases, when A is used, then only the rows of case A are read, changed or deleted.
- F6-AC4 Given a save based on revision 1 when the server has revision 2, then the answer is 409 and the rows are unchanged.
- F6-AC5 Given an insert that fails half way, then the earlier version of the case is still complete.
- F6-AC6 Given the tenant deletes the cloud copy, then the next request with that code answers 404 and no child rows remain.
- F6-AC7 Given no `DATABASE_URL`, then the server starts, health reports it, and case routes answer 503.
- F6-AC8 Given the code typed in lower case without hyphens, then the case opens.

## Errors and edge cases

- 401 for a missing or malformed code, 404 for an unknown or expired one. Both show "No case found for this code."
- A failed save keeps the local data and can be repeated by the tenant. There is no automatic retry.
- A lost code cannot be recovered or reset.

## Out of scope

Accounts, passwords, email, sharing with roles, live sync, version history, storing lease text.
