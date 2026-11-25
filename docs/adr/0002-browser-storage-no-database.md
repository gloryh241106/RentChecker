# 0002 Browser storage, no database

Status: Accepted, 2026-11-25

## Context

The SRS rules out accounts and a server database. Lease text and amounts are private. The tenant works on one tenancy at a time. Time is short.

## Decision

Store the whole workspace as one JSON document in `localStorage` under `rentchecker:v1`, with `schemaVersion` 1. The server keeps nothing. Results and totals are derived, not stored. See DATA_MODEL.md.

## Consequences

- No account, no backup service and no privacy store to defend (NFR-2).
- Data is lost if the user clears site data or changes browser or device. The app must say so.
- localStorage has a size limit of a few megabytes. One lease of up to 40,000 characters fits easily.
- Any script on the page can read it, so the CSP matters.
- A bad or old value must be handled on load (FRONTEND.md).
- No sharing between devices and no history.

## Alternatives

- A hosted database: needs accounts and storage of sensitive text. Out of scope.
- IndexedDB: more room, more code, and the data is small.
- Export and import of files: useful later, not needed for the first submission.
