# User flows

These diagrams show the steps of each use case in [SRS.md](../spec/SRS.md). Screens and wording are in [UI.md](UI.md). Calculations run in the browser, and only the clause match uses the server (see [API.md](API.md)).

## UC-1 Check moving-out deductions

The tenant works through five steps: Details, Deductions, Lease, Results, Message. Next checks the fields of the step. The step list can open any step without checking. On a bad field the page shows a message next to the field and puts focus on the first bad field. Finding clauses is optional. If the AI is not available, the server answers in keyword mode and the flow goes on. If the request itself fails, the tenant can retry or run the check without clauses, because calculations never wait for the server (NFR-3). Rent deductions are not sent for matching (D-31). Results appear only after "Run check", and any later edit marks them out of date. The Message step is UC-2.

```mermaid
flowchart TD
    S1(["Home: choose Moving out"]) --> D1["Details: deposit, rent, handover date, optional fields"]
    D1 --> V1{"Fields valid?"}
    V1 -- "No" --> E1["Messages next to fields, focus on the first bad field"]
    E1 --> D1
    V1 -- "Yes" --> D2["Deductions: add 1 to 20, each with its kind"]
    D2 --> V2{"Deductions valid?"}
    V2 -- "No" --> E2["Messages next to fields, focus on the first bad field"]
    E2 --> D2
    V2 -- "Yes" --> L1["Lease: paste lease text, or leave it empty"]
    L1 --> Q1{"Find clauses?"}
    Q1 -- "No, lease empty or skipped" --> U1["Every non-rent deduction stays unconfirmed"]
    Q1 -- "Yes" --> Q2{"Lease 50 to 40,000 characters?"}
    Q2 -- "No" --> E3["Find clauses disabled, reason shown"]
    E3 --> L1
    Q2 -- "Yes" --> C1["Consent notice: where the text goes"]
    C1 --> Q3{"Continue?"}
    Q3 -- "Cancel" --> L1
    Q3 -- "Continue" --> R1["One request to POST /api/clauses/match"]
    R1 --> Q4{"Answer?"}
    Q4 -- "200, mode ai" --> M1["Evidence stored, with quotes that passed the check"]
    Q4 -- "200, mode keyword, with a warning" --> M2["Keyword notice shown, evidence stored"]
    Q4 -- "400, 413, 429, 500, network error or no answer in 30 s" --> E4["Matching failed message, evidence unchanged"]
    E4 --> Q5{"Retry?"}
    Q5 -- "Yes" --> C1
    Q5 -- "No" --> U1
    M1 --> L2["Lease: review matches, override if needed"]
    M2 --> L2
    L2 --> K1["Run check"]
    U1 --> K1
    K1 --> V3{"Facts and deductions valid?"}
    V3 -- "No" --> E5["Messages next to fields, focus on the first bad field"]
    E5 --> D1
    V3 -- "Yes" --> RS["Results: result, reasons, four totals, refund gap, excess"]
    RS --> Q6{"Edit anything?"}
    Q6 -- "Yes" --> O1["Out-of-date notice, old values stay"]
    O1 --> K1
    Q6 -- "No" --> MG["Message: review, edit, copy (UC-2)"]
    MG --> F1(["Tenant sends the message themselves"])
```

## UC-3 Review a lease before signing

The tenant pastes a lease and the app checks ten fixed deposit topics. This flow has its own lease text, separate from UC-1. The consent notice, the keyword mode and the failure handling are the same as in UC-1. Each topic ends as Found, Not found, Could not confirm or Lease may rule this out. The tenant copies the questions for every topic that is not Found.

```mermaid
flowchart TD
    A1(["Home: choose Before signing"]) --> A2["Paste lease text"]
    A2 --> A3{"50 to 40,000 characters?"}
    A3 -- "No" --> A4["Run review disabled, reason shown"]
    A4 --> A2
    A3 -- "Yes" --> A5["Consent notice: where the text goes"]
    A5 --> A6{"Continue?"}
    A6 -- "Cancel" --> A2
    A6 -- "Continue" --> A7["One request to POST /api/clauses/match with the ten topics"]
    A7 --> A8{"Answer?"}
    A8 -- "200" --> A9["Ten rows: Found, Not found, Could not confirm or Lease may rule this out"]
    A8 -- "Keyword mode warning" --> A10["Keyword notice shown with the rows"]
    A8 -- "Request failed" --> A11["Failure message, rows unchanged, retry offered"]
    A11 --> A5
    A10 --> A9
    A9 --> A12["Optional: override a topic with a quote or no clause"]
    A12 --> A13["Copy questions for topics that are not Found"]
    A13 --> A14(["Tenant asks the landlord before signing"])
```

## UC-4 and UC-5 Check a bill and keep a repair log

Both sit on one screen, During the tenancy. The bill check validates its fields and shows the recalculated amount, the difference and a reason. It saves no history. The repair log stores dated entries in the browser. Linking an entry to a deduction happens later, in the Deductions step of UC-1, and adds only the reason REPAIR_REPORTED. Deleting an entry removes its links and marks results out of date.

```mermaid
flowchart TD
    B1(["Home: choose During the tenancy"]) --> B2{"What now?"}
    B2 -- "Check a bill" --> B3["Enter readings, rate, fixed charge, bill total"]
    B3 --> B4{"Valid? Current reading not lower"}
    B4 -- "No" --> B5["Message next to the field, focus on it"]
    B5 --> B3
    B4 -- "Yes" --> B6["Show recalculated amount, difference and reason"]
    B6 --> B2
    B2 -- "Add a repair" --> B7["Enter date, description, reported to"]
    B7 --> B8{"Valid? Log under 50 entries"}
    B8 -- "No" --> B9["Message next to the field, or add disabled with reason"]
    B9 --> B7
    B8 -- "Yes" --> B10["Entry saved in the log, oldest first"]
    B10 --> B2
    B10 -.->|"At move-out"| B11["UC-1 Deductions: link the entry to one deduction"]
    B11 --> B12["Results show the entry and REPAIR_REPORTED"]
```

## UC-6 Delete everything

Available from the footer of every screen. The dialog names what happens and that it cannot be undone. Cancel changes nothing and returns focus to the control that opened the dialog. After a delete the app shows the empty Home screen and moves focus to its heading.

```mermaid
flowchart TD
    X1(["Any screen: choose Delete everything"]) --> X2["Dialog: Delete all data stored by RentChecker in this browser?"]
    X2 --> X3{"Confirm?"}
    X3 -- "Cancel or Escape" --> X4["Dialog closes, focus returns to the control, nothing removed"]
    X3 -- "Delete" --> X5["Remove tenancy, lease texts, evidence, deductions, repairs, bill form, draft"]
    X5 --> X6{"Removed?"}
    X6 -- "Yes" --> X7["Empty Home screen, focus on the heading, confirmation announced"]
    X6 -- "Storage error" --> X8["Error message: clear site data in the browser settings"]
```
