# Architecture

This file shows how RentChecker is split and how a check runs. Rules live in [DOMAIN_RULES.md](../spec/DOMAIN_RULES.md), requirements in [SRS.md](../spec/SRS.md) and routes in [API.md](API.md). Details per part: [FRONTEND.md](FRONTEND.md), [BACKEND.md](BACKEND.md), [DATA_MODEL.md](DATA_MODEL.md), [DEPLOYMENT.md](DEPLOYMENT.md).

## Level 1: system context

```mermaid
flowchart LR
  tenant["Tenant<br/>reads on a phone or desktop"]
  rc["RentChecker<br/>web app"]
  gem["Gemini API<br/>external service"]
  tenant -->|"enters facts and lease text"| rc
  rc -->|"shows results and a draft message"| tenant
  rc -->|"lease text and charge labels, after consent"| gem
```

| Element | Role |
|---|---|
| Tenant | The only user. No login (SRS scope) |
| RentChecker | Checks deductions, keeps data in the browser |
| Gemini API | Suggests a clause and quote per item. It never calculates or decides a result (D-32 to D-36 are code) |

The landlord is not a user. The tenant sends the draft message outside the app (FR-13).

## Level 2: containers

```mermaid
flowchart LR
  tenant["Tenant"]
  subgraph browser["Tenant browser"]
    spa["Single page app<br/>React, Vite, Tailwind"]
    ls[("localStorage<br/>key rentchecker:v1")]
  end
  subgraph host["Vercel function or Cloud Run container"]
    api["Express API"]
  end
  gem["Gemini API"]
  db[("PostgreSQL on Neon<br/>optional, F6")]
  tenant --> spa
  spa <-->|"read and write"| ls
  spa -->|"HTTPS JSON to /api"| api
  api -->|"HTTPS, 20 second limit"| gem
  api -->|"TLS, parameterised SQL"| db
```

| Element | Technology | Holds |
|---|---|---|
| Single page app | React, Vite, Tailwind, TypeScript strict | UI, the workspace reducer, all calculations through `shared/` |
| localStorage | Browser storage | The working copy of the whole workspace (ADR 0002) |
| Express API | Node.js, Express, Zod | Clause matching and cloud save. No state of its own |
| PostgreSQL | Neon, `pg` driver | Saved cases, only when the tenant turns cloud save on (ADR 0006). No lease text |
| Gemini API | Google | Nothing after the call. Prompt and response are not stored by RentChecker |

## Level 3: components

```mermaid
flowchart TB
  subgraph client["client/"]
    pages["Pages"]
    hooks["Hooks"]
    reducer["Workspace reducer"]
    storage["Storage module"]
    apiclient["API client"]
  end
  subgraph shared["shared/ (pure, no I/O)"]
    calc["Money, dates and expected amounts<br/>D-1 to D-25"]
    rules["Evidence, results, reasons, totals<br/>D-30 to D-43"]
    schemas["Zod schemas and types"]
    draft["Draft message builder"]
    quote["Quote check, F2-R4"]
  end
  subgraph server["server/"]
    mw["Middleware"]
    routes["Routes"]
    ctrl["Controllers"]
    svc["Clause service"]
    helpers["Keyword matcher"]
    ai["AI client"]
    cases["Case service"]
    repo["Case repository"]
  end
  db[("PostgreSQL")]
  gem["Gemini API"]
  pages --> hooks
  hooks --> reducer
  hooks --> storage
  hooks --> apiclient
  hooks --> calc
  hooks --> rules
  hooks --> draft
  storage --> schemas
  apiclient --> schemas
  apiclient -->|"HTTP"| mw
  mw --> routes
  routes --> ctrl
  ctrl --> schemas
  ctrl --> svc
  ctrl --> cases
  cases --> repo
  repo -->|"SQL"| db
  svc --> helpers
  svc --> quote
  hooks --> quote
  svc --> ai
  ai --> schemas
  ai -->|"HTTPS"| gem
```

| Component | Responsibility |
|---|---|
| Pages, hooks | Screens, form handling, calling `shared/` to derive results |
| Workspace reducer | One state object for the whole workspace |
| Storage module | Load with validation, save, delete all |
| API client | One typed call with abort |
| shared/ | Everything in DOMAIN_RULES.md, the quote check, the Zod schemas for API.md and the workspace, the draft message |
| Middleware, routes, controllers | HTTP concerns, validation, status codes |
| Clause service | Chooses AI or keyword mode, checks quotes, builds the response |
| AI client | The only code that talks to Gemini |
| Case service, case repository | Recovery codes, revisions and expiry. The repository is the only code with SQL |

## Check deductions

```mermaid
sequenceDiagram
  actor T as Tenant
  participant UI as Browser app
  participant SH as Shared functions
  participant API as Express API
  participant AI as Gemini API
  T->>UI: Enter facts, deductions and lease text
  T->>UI: Choose check
  UI->>SH: Evaluate workspace with stored evidence
  SH-->>UI: Results and totals, derived in the browser
  UI-->>T: Show results, clauses unconfirmed until matched
  opt lease text was pasted and the tenant runs matching
    UI-->>T: Consent notice says where the text goes
    alt tenant declines
      Note over UI: No request is sent, results stay as shown
    else tenant continues
      UI->>API: POST /api/clauses/match
      API->>API: Rate limit, then validate body
      alt request rejected
        API-->>UI: 400, 413 or 429 error body
        Note over UI: Evidence unchanged, error shown
      else request accepted
        API->>AI: Lease text and labels, abort after 20 seconds
        alt valid answer in time
          AI-->>API: Clause and quote per item
          API->>API: Keep a quote only if it is in the lease
          API-->>UI: 200, mode ai, QUOTE_REJECTED if a quote failed
        else no key, error, timeout or invalid output
          API->>API: Keyword matching
          API-->>UI: 200, mode keyword, one warning
        end
        UI->>SH: Evaluate again with new evidence
        SH-->>UI: Updated results and totals
        UI-->>T: Show results and say if keyword mode was used
      end
    end
  end
```

A failed or slow AI call never blocks the calculations (NFR-3). Calculations need no network call (NFR-6).

## Folder tree

```text
RentChecker/
  api/index.ts            exports the Express app for Vercel
  client/                 React app (src/pages, components, hooks, state, storage, api)
  server/                 Express (src/app.ts, index.ts, routes, controllers, services, ai, middleware)
  db/migrations/          numbered SQL files
  shared/                 money, dates, calculations, results, totals, quote check, schemas, types, draft message
  docs/                   spec, design, adr, testing
  Dockerfile  vercel.json  .env.example  package.json  tsconfig.json
```

One root `package.json` serves all folders. Tests sit next to the code they test.

## Dependency rules

| From | May import | Must not import |
|---|---|---|
| client | shared, npm packages | server |
| server | shared, npm packages | client |
| shared | other shared files, Zod | client, server, Node or DOM APIs |
| api | server | client |

- shared does no I/O: no `fetch`, no `fs`, no `Date.now()`, no storage, no environment reads. Dates and clocks are passed in.
- Use relative imports, not path aliases, so the same files build in Vite, Vercel and Docker.
- Enforce with an ESLint import rule and by giving `shared` a tsconfig without DOM or Node types. Whether this setup works unchanged is not verified yet.
