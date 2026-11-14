# API Flows

| | |
|---|---|
| Document | Satanipara Community — Phase 0 Backend Blueprint, Diagrams |
| Status | **Planned** — planning only; no backend code exists yet |
| Sources | Decision Sheet (single source of truth); Audit Findings; Research Notes (verified 2026-11-14); Engineering Plan v1.1; Doc 07 (API Architecture) |

> Each flow below has one sequence diagram plus short notes. The diagrams show the **planned** behaviour. The prototype's versions of these flows were simulated in the browser (in-memory state, no server — Audit Findings §6); the notes call out where the real flow differs from the prototype's simulation.

## 1. Expatriate request lifecycle

Status enum (Decision Sheet): `pending → accepted → in_progress → completed → closed`, plus `rejected` and `cancelled`. Services (7): `grocery`, `medicine`, `hospital`, `elderly`, `home`, `document`, `general`.

```mermaid
sequenceDiagram
    autonumber
    participant V as Visitor (public, no login)
    participant WEB as Next.js website
    participant API as Laravel API (/api/v1)
    participant DB as MySQL 8.4
    participant Q as Queue (database driver)
    participant H as Expatriate Helper
    participant SA as Super Admin
    participant M as Member (requester, after login)

    V->>WEB: Fill wizard (service, for whom,<br/>details, when, name, phone, country, agree)
    WEB->>API: POST /expatriate-requests
    API->>API: Validate server-side (Doc 07 §7)<br/>+ rate limit (public-submit)
    API->>DB: Create request — server-generated<br/>unique ID EXP-YYYY-####, status pending,<br/>server timestamp
    DB-->>API: Request created
    API->>DB: Create notifications for<br/>Super Admin + all Helpers
    API->>Q: Dispatch push-delivery job<br/>(Web Push to registered devices)
    API-->>WEB: 201 + Request ID
    WEB-->>V: Success pane — Request ID +<br/>4-node Meridian timeline (Pending → Accepted → In Progress → Completed)
    Q->>H: Push / browser notification<br/>(best-effort; DB notification is the record)
    H->>API: GET /expatriate-requests<br/>(queue — helpers see all requests)
    API-->>H: Page list
    H->>API: POST /expatriate-requests/{id}/assign<br/>(claim, or SA assigns)
    API->>DB: Assignment recorded + audit entry
    H->>API: POST /expatriate-requests/{id}/transition<br/>{to_status: accepted, note}
    API->>API: Check transition is valid<br/>in the state machine
    API->>DB: Status + history row<br/>(actor, timestamp, note)
    H->>API: POST /expatriate-requests/{id}/expenses<br/>{label, amount, receipt?}
    API->>DB: Expense line stored;<br/>total recomputed server-side
    H->>API: POST /expatriate-requests/{id}/transition<br/>{to_status: in_progress, note}
    H->>API: POST /expatriate-requests/{id}/transition<br/>{to_status: completed, note}
    API->>DB: Notify requester (member)
    M->>API: GET /expatriate-requests/mine
    API-->>M: Own requests only
    M->>API: POST /expatriate-requests/{id}/transition<br/>{to_status: closed, note} (confirm receipt)
    Note over API,DB: Or Super Admin closes it.<br/>Invalid transitions → 409 invalid_transition.<br/>Rejection (from pending) and cancellation<br/>(from pending/accepted/in_progress) are terminal.
```

**Notes**

- **No login is required to submit** — matching the prototype (Audit Findings §3.1). The requester's phone is stored encrypted and is visible only to the Super Admin and assigned helpers.
- **The prototype's flaws are fixed here, not reproduced:** random IDs with no uniqueness check (Audit Findings §8 item 10) become server-generated IDs under a database uniqueness constraint; the hardcoded creation date (`"2026-11-14"` for every new request — Audit Findings §6) becomes the server timestamp; the generic helper note ("সহায়ক আপডেট দিয়েছেন (ডেমো)") becomes a mandatory note (≥10 characters) written by the acting helper; the empty-draft bug (D3 — submitting an empty draft created a corrupt request) becomes a 422 with no record created, covered by a regression test (Doc 10 §3).
- **The helper notification is best-effort at the push layer and reliable at the database layer.** The queue is the reliable record: if a push does not arrive, the request is still in the helper queue (Doc 07 §12).
- **The demo request is never appended to a member's list.** The prototype appended the seeded `EXP-2026-1052` to every member's list (Audit Findings §8 item 9); the API returns only the caller's own requests.
- **Open question D11** (wizard is 3 steps in the build, 4 in the design system §7.1) does not change this flow — the API accepts one complete submission — but the frontend step count must be confirmed before the web client is built (Doc 07 §17 item 9).

## 2. Login — web cookie and mobile token

```mermaid
sequenceDiagram
    autonumber
    participant U as User (member / helper / Super Admin)
    participant WEB as Next.js website (SPA)
    participant MOB as Flutter app (future)
    participant API as Laravel API (/api/v1)
    participant DB as MySQL 8.4

    Note over WEB,API: --- Web (first-party SPA): cookie auth ---
    WEB->>API: GET /sanctum/csrf-cookie
    API-->>WEB: CSRF cookie set
    U->>WEB: Enter phone + password
    WEB->>API: POST /auth/login {phone, password}<br/>+ CSRF token, Accept: application/json
    API->>API: Rate limit (login — strict:<br/>5 attempts/min per IP + phone)
    API->>DB: Look up phone_hash;<br/>verify password hash
    alt Credentials invalid
        API-->>WEB: 401 invalid_credentials<br/>(same message whether phone<br/>or password is wrong)
    else Credentials valid
        API->>DB: Regenerate session;<br/>record login (audit log)
        API-->>WEB: 200 + user summary<br/>(session cookie set, no token)
        WEB-->>U: Dashboard
    end

    Note over MOB,API: --- Mobile (Flutter app): bearer token ---
    U->>MOB: Enter phone + password
    MOB->>API: POST /auth/login {phone, password,<br/>device_name}
    API->>DB: Look up phone_hash;<br/>verify password hash
    alt Credentials invalid
        API-->>MOB: 401 invalid_credentials
    else Credentials valid
        API->>DB: Create personal access token<br/>(SHA-256 hashed at rest;<br/>plaintext shown once)
        API-->>MOB: 200 + token + token_expires_at
        MOB->>MOB: Store token securely<br/>(platform secure storage)
        MOB->>API: GET /auth/user<br/>Authorization: Bearer <token>
        API-->>MOB: 200 user summary
    end

    Note over U,API: --- Logout ---
    U->>API: POST /auth/logout
    API->>DB: Delete current token /<br/>invalidate session
    API-->>U: 204 No Content
    U->>API: POST /auth/logout-all {password}
    API->>DB: Delete ALL tokens +<br/>invalidate ALL sessions
    API-->>U: 204 No Content
```

**Notes**

- **The Sanctum rule is followed:** API tokens are never used to authenticate the first-party SPA; the SPA uses cookie authentication (Research Notes §3, Doc 07 §8.1).
- **Sanctum provides no refresh-token flow, no per-device session list, and no "log out everywhere"** (Research Notes §3). The API designs around this: logout deletes the current token; logout-all deletes all tokens and invalidates all sessions (Doc 07 §8.2).
- **The prototype's login is not a model:** hardcoded users with plaintext passwords in the HTML file, a fake 450 ms delay, and an in-memory session that vanished on reload (Audit Findings §5.5, §6). The real flow uses hashed passwords, server sessions/tokens, rate limiting with growing lockout, and an audit log.
- **No OTP in Phase 1** (scope decision). Password reset is Super Admin-only and audited (Doc 07 A6). There is no self-service forgot-password email flow in Phase 1.
- **Registration does not log the user in.** It creates a pending application; a Super Admin approves it (issuing a member ID and enabling login). The prototype stored nothing and the registrant could not log in at all (Audit Findings §3 #30); the approval workflow is the fix (Doc 07 A5, D2).

## 3. Blood request and donor consent

```mermaid
sequenceDiagram
    autonumber
    participant V as Visitor (public)
    participant WEB as Next.js website
    participant API as Laravel API (/api/v1)
    participant DB as MySQL 8.4
    participant Q as Queue (database driver)
    participant D as Donor (registered member)
    participant SA as Super Admin

    V->>WEB: Search donors by blood group<br/>(public list — NO phone numbers)
    WEB->>API: GET /donors?blood_group=O+
    API-->>WEB: Cursor list (name, group, area,<br/>last donation, availability)
    V->>WEB: Submit emergency blood request<br/>(group, units, hospital, contact phone)
    WEB->>API: POST /blood-requests
    API->>DB: Create blood request, status open
    API->>DB: Notify matching available donors<br/>(same group, available)
    API->>Q: Dispatch donor-notification jobs
    API-->>WEB: 201 + request ID
    Q->>D: Notification — "A blood request<br/>needs your group in your area"
    D->>API: GET /blood-requests/{id}<br/>(as the donor, authenticated)
    API-->>D: Request details (no requester phone<br/>beyond what the flow allows)
    D->>API: POST /blood-requests/{id}/consent<br/>{donor_id, granted: true}
    API->>DB: Consent recorded with timestamp<br/>(grant is a permanent history row)
    API->>DB: Notify requester — number available
    V->>API: GET /blood-requests/{id}/donor-contact<br/>?donor_id=... (requester, authenticated)
    API->>API: Policy check — did THIS donor grant<br/>consent for THIS request?
    alt Consent granted
        API->>DB: Audit-log the reveal<br/>(actor, donor, request, timestamp)
        API-->>V: 200 + donor phone number
    else Consent not granted
        API-->>V: 403 consent_not_granted
    end
    SA->>API: POST /blood-requests/{id}/close<br/>{outcome: fulfilled}
    API->>DB: Request closed
    Note over D,API: Donor revokes later:<br/>POST /blood-requests/{id}/consent<br/>{granted: false} creates a NEW<br/>revocation row; the grant is not deleted.
```

**Notes**

- **Consent is a donor-side action.** The prototype's consent was granted by the *requester's own click* (Audit Findings §6) — a button that instantly revealed the number with no donor involved. The real flow requires the donor to grant consent for that specific request; the requester cannot grant it for them.
- **Phones are never in a list or search response.** The prototype showed masked phones (`01••• •••421`); the API returns no phone digits at all in a list (Doc 07 B1). The full number is returned only by the donor-contact endpoint, only after consent, and every reveal is audit-logged (Doc 08 §9.1).
- **Consent records are permanent history.** A revocation is a status change on the same consent row (`status = revoked`, Doc 07 B5), not a deletion — so the history of who consented, when, and for which request is always reconstructable.
- **The prototype's blood request created no record and contacted no donor** (Audit Findings §3 #19). The real flow creates the request, notifies matching donors, and tracks the lifecycle to closure.
- **Unavailable donors** have their consent path disabled (matching the prototype, where the consent button was disabled for unavailable donors — Audit Findings §5.2).

## 4. Finance entry, approve-and-publish, and reversal

Money rules: BDT, `decimal(12,2)`, never float. Ledger entries are immutable — corrections only by reversal (Decision Sheet, Doc 07 §14.9).

```mermaid
sequenceDiagram
    autonumber
    participant SA as Super Admin<br/>(Phase 1 — Treasurer role deferred)
    participant PANEL as Filament admin panel
    participant API as Laravel API (/api/v1)
    participant DB as MySQL 8.4
    participant PUB as Public website (visitor)

    SA->>PANEL: Create entry (date, item, kind,<br/>category, amount, payee, receipt?)
    PANEL->>API: POST /finance/entries
    API->>API: Validate (amount ≠ 0,<br/>two decimals, kind in enum)
    API->>DB: Entry created, status draft<br/>(NOT public)
    API-->>PANEL: 201 + entry
    SA->>PANEL: Approve entry (approve IS publish — one step)
    PANEL->>API: POST /finance/entries/{id}/approve
    API->>DB: Status published + audit entry<br/>(approved_by / approved_at / published_at set)
    Note over SA,API: Dual control is mandatory (decided<br/>Phase 0.1): the approver must differ<br/>from the creator (Doc 04 §6.1, Doc 07 F4).
    PUB->>API: GET /finance/ledger?year=2026
    API->>DB: Sum published entries<br/>server-side
    API-->>PUB: Cursor list + totals
    Note over SA,DB: --- Correction: an error is found ---
    SA->>PANEL: Reverse entry (reason required)
    PANEL->>API: POST /finance/entries/{id}/reverse {reason}
    API->>DB: Create reversal entry linked<br/>to the original; mark original<br/>reversed. Original NEVER edited<br/>or deleted.
    API-->>PANEL: 201 + reversal entry
    PUB->>API: GET /finance/ledger?year=2026
    API-->>PUB: Totals reflect the reversal
    Note over API,DB: Editing or deleting a published<br/>entry is not possible — no endpoint<br/>exists for it. Reversal without a<br/>reason → 422. Reversing an already<br/>reversed entry → 409.
```

**Notes**

- **The prototype's finance rows had no dates, payees, receipts, or sub-categories** (Audit Findings §5.4) and its totals were computed in the browser. The API stores the full record and computes totals server-side.
- **The prototype generated its "annual report" as a `.txt` file in the browser** and noted "ডেমোতে PDF তৈরি হয় না" (Audit Findings §6). Real reports are real files (PDF), versioned by year, uploaded through `POST /finance/reports` with an audited flag (Doc 07 F8).
- **Project accounts** (budget vs spent per project) exist only in the editorial alternative, not in Direction D (Audit Findings §3 #28) — the endpoint is marked proposed pending Sprint 1 confirmation (Doc 07 F9).
- **Phase 1 performer:** the Treasurer role is deferred, so the Super Admin performs entry, approval, and publishing in Phase 1 (Doc 09 §3.11). Dual control is mandatory (decided Phase 0.1): approval must be by a different person than the creator — a one-Super-Admin organisation cannot publish until a second approver exists (Doc 04 §6.1). A rejected entry stays `draft` (F6a, reason ≥10 characters) and can be corrected and resubmitted.

## 5. Content publish workflow

Applies to news, notices, events, jobs, activities, and gallery items (with the per-type rules noted below). Draft → publish is the same shape everywhere, by design.

```mermaid
sequenceDiagram
    autonumber
    participant SA as Super Admin
    participant PANEL as Filament admin panel
    participant API as Laravel API (/api/v1)
    participant DB as MySQL 8.4
    participant PUB as Public website (visitor)

    SA->>PANEL: Create content (title/body bn/en,<br/>tag/category, dates, files)
    PANEL->>API: POST /news (or /activities,<br/>/notices, /events, /jobs, /gallery)
    API->>API: Validate (required fields;<br/>category mandatory for activities;<br/>expiry after publish date for notices)
    API->>DB: Content created, status draft<br/>(NOT public)
    API-->>PANEL: 201 + content
    SA->>PANEL: Preview draft
    PANEL->>API: GET /news/{id} (admin view —<br/>drafts visible to admins only)
    API-->>PANEL: Draft content
    SA->>PANEL: Publish
    PANEL->>API: POST /news/{id}/publish
    API->>DB: Status published,<br/>published_at set + audit entry
    API-->>PANEL: 200
    PUB->>API: GET /news
    API->>DB: Published items only
    API-->>PUB: Cursor list
    Note over SA,API: Unpublish: POST /news/{id}/unpublish<br/>(proposed — confirm in Sprint 1 if a<br/>separate unpublish endpoint is wanted,<br/>or use PUT with status).<br/>Delete: soft delete only.
    Note over API,DB: Per-type gates enforced<br/>at publish time:<br/>- Job: verified must be true<br/>- Notice: expired notices leave<br/>  the public list automatically<br/>- Activity: category required<br/>- Gallery: consent_on_file required<br/>  for photos of people
```

**Notes**

- **Publishing is a separate, audited action from saving.** Creating content never publishes it. The prototype published everything unconditionally (all prototype content is published with no workflow — Audit Findings §9 item 11); the real system does not.
- **Per-type gates:** a job circular with `verified=false` is never public (Audit Findings §3 #23); an expired notice leaves the public list automatically; an activity without a category cannot be created (the prototype's category filter had no data behind it — Audit Findings §8 item 7); a gallery photo of a person requires `consent_on_file`.
- **The constitution is versioned, not overwritten:** publishing a new constitution version retains the old ones (Doc 07 O6, Doc 09 §3.5).
- **Unpublishing:** whether unpublish is a dedicated endpoint or a status update is a Sprint 1 detail; either way it is audited and the item leaves every public list immediately.
