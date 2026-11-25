# Frontend

React, Vite, Tailwind CSS, TypeScript strict, no `any` (NFR-7). All calculations come from `shared/`. The client holds no rule of its own. See [ARCHITECTURE.md](ARCHITECTURE.md) for the dependency rules and [DATA_MODEL.md](DATA_MODEL.md) for the stored shape.

## Pages

| Route | Page | Use case | Build step |
|---|---|---|---|
| `/` | Home: choose a stage, load the sample case (FR-7), delete all data (FR-6) | UC-6 | 3 |
| `/move-out` | Facts, deductions, lease text, results, draft message | UC-1, UC-2 | 3 to 5 |
| `/lease-review` | Paste lease, run review, copy questions | UC-3 | 9 |
| `/tenancy` | Bill check and repair log | UC-4, UC-5 | 7 |
| `*` | Not found page with a link home | | 3 |

Routing uses a client router. Vercel and Express both serve `index.html` for these paths (see [DEPLOYMENT.md](DEPLOYMENT.md)). Pages for steps 7 and 9 are not built if time runs out (SRS "Should").

## Components

| Component | Notes |
|---|---|
| Layout | Skip link, one `main`, page title per route, visible focus (NFR-5) |
| MoneyInput | Text input. Parses with the shared D-3 parser, shows the error under the field (FR-3) |
| DateInput | Accepts `YYYY-MM-DD` (D-5) |
| TenancyForm | The fields in FR-1 |
| DeductionList, DeductionForm | Up to 20 items (FR-2). The form shows extra fields by `kind` (D-10) |
| LeaseInput | Textarea with a character count against the 40,000 limit in API.md |
| ConsentDialog | Says where lease text goes and asks to continue (FR-12). Traps focus, closes with Escape |
| MatchStatus | Says when keyword mode was used and why (FR-10), and lists warnings |
| EvidenceOverride | Paste a quote or confirm no clause (FR-11) |
| ResultCard | Primary result, all reasons (D-37), quote, linked repair |
| StageNav | Links to the three stages in the header, on every screen except Home |
| ExampleResult | The sample case, checked by `shared/`, as an example on Home |
| SplitBar | The four totals as parts of one bar, hidden from screen readers |
| TotalsPanel | The four totals, total deducted, refund gap, excess over deposit (D-40 to D-43) |
| DraftMessage | Editable textarea and copy button (FR-13) |
| DeleteAllDialog | Confirm, then clear (FR-6) |
| SampleBanner | Shown while `isSample` is true (FR-7) |
| CloudSavePanel | Turn on, save, recovery code, open, delete, conflict choice (F6). On Home and Moving out |

Errors are linked to fields with `aria-describedby`. A summary region uses `aria-live` so screen readers hear new results and errors.

## Hooks

| Hook | Does |
|---|---|
| useWorkspace | Context access to state and dispatch |
| useCheck | Holds the facts that were last checked, in memory only. Results come from the shared evaluate function with `useMemo`. They are out of date (F1-R14) when the tenancy, lease text, deductions, evidence or repairs are no longer the checked ones |
| usePersistence | Loads once at start, saves after changes, handles load failures |
| useCloudSave | Case API calls, revision, save state (F6). Reads health once to see if cloud save is available |
| useClauseMatch | Runs consent, then the API call, then dispatches evidence. Owns the abort controller |

## State

One reducer holds the whole workspace as stored. A provider at the app root exposes it.

| Action | Effect |
|---|---|
| `tenancy/update` | Replace tenancy fields |
| `lease/set` | Set lease text and reset all evidence to `unconfirmed` (D-30) |
| `deduction/add`, `deduction/update`, `deduction/remove` | Change the list. A label change resets that item's evidence. Removal also removes its evidence and repair links |
| `evidence/apply` | Store matches from the API, one per item |
| `evidence/override` | Store a user quote or a user confirmed `none` (FR-11) |
| `repair/*`, `bill/*`, `review/*` | Same pattern for the Should features. The F4 lease text is separate from the F1 lease text |
| `draft/set` | Store the edited message (F3-R11) |
| `sample/load`, `workspace/replace`, `workspace/reset` | Sample case, load result, delete all |

Form text is local component state. A value goes to the reducer only when it parses, so the store never holds invalid input. Dialog state, match status and warnings are local and are not saved.

## Reading localStorage

Key `rentchecker:v1`. The storage module returns one of five outcomes.

| Outcome | When | App does |
|---|---|---|
| `empty` | Key missing | Start with an empty workspace |
| `ok` | JSON parses and passes the shared workspace schema | Use it |
| `corrupt` | Not JSON, or fails the schema | Start empty, show a notice, keep the raw text under `rentchecker:v1:corrupt` |
| `version_mismatch` | `schemaVersion` is not 1 | Same as corrupt with a different message. No migration exists |
| `unavailable` | Storage throws on read or write | Work in memory and show that nothing is saved |

Nothing is written until the user makes a change, so a bad value is not overwritten by a page load. Delete all removes both keys. Saves are debounced and wrapped in `try` for quota errors.

## API client

One function, `matchClauses(request, signal)`, calls `POST /api/clauses/match` with a relative URL. It validates the response with the shared Zod schema.

| Error kind | Source |
|---|---|
| `validation` | 400 `VALIDATION_ERROR`, keeps `fields` for display |
| `too_large` | 413 `PAYLOAD_TOO_LARGE` |
| `rate_limited` | 429 `RATE_LIMITED` |
| `server` | 500 `INTERNAL_ERROR` or any other status |
| `unauthorized`, `case_not_found`, `conflict`, `storage_unavailable` | Case routes only: 401, 404 `CASE_NOT_FOUND`, 409, 503 |
| `network` | `fetch` rejected |
| `aborted` | The user cancelled or the page left |
| `bad_response` | The body fails the schema |

The kinds are a typed union, so the UI handles each case. The hook aborts the previous request when a new one starts and on unmount. The client gives up after 30 seconds (F2), above the server's 20. Any error leaves evidence unchanged and results stay visible (NFR-3). There is no automatic retry.

## Development

Vite proxies `/api` to the local Express server. The client reads no environment variable and holds no key (NFR-1).
