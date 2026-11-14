# 07 — API Architecture

| | |
|---|---|
| Document | Satanipara Community — Phase 0 Backend Blueprint, Doc 07 |
| Status | **Planned** — planning only; no backend code exists yet |
| Sources | Decision Sheet (single source of truth); Audit Findings (37 features, validation rules, gaps); Research Notes (verified 2026-11-14); Engineering Plan v1.1 |
| Modules | M1–M12 (per Engineering Plan v1.1 §6) |
| API base | `/api/v1` |

> **Status discipline.** Nothing in this document is implemented. The live artefact is a static HTML prototype (Direction D) with no server, no database, no API, and no persistence (Audit Findings §6). Every endpoint below is **Planned** unless marked otherwise. Endpoints whose need is not yet confirmed are marked **"proposed — confirm in Sprint 1"**.

## 1. Design principles

1. **API-first.** One Laravel 13 backend serves every client — the Next.js public website (M11), the Filament 5 admin panel (M10), and the future Flutter apps (M12) — over the same API and the same database (per Engineering Plan v1.1 §1). No client talks to the database directly; no business logic lives in a frontend.
2. **Single source of truth.** Each fact exists once in the backend. The prototype duplicated the same data in several places — the demo request `EXP-2026-1052` rendered in four places, finance 2026 rows in two, activities/news in two, gallery images in three (Audit Findings §4). The API must expose each resource once; clients render it wherever needed.
3. **REST, resource-oriented.** Resources are nouns (`/expatriate-requests`, `/donors`, `/ledger-entries`); actions are HTTP verbs. No verb-style URLs (no `/getRequests`, no `/approveFinance`).
4. **Bengali-first, English-supported.** Responses carry Bengali and English messages (see §4). Stored content is bilingual where the prototype already is (directory entries, activities, FAQ carry `bn`/`en` fields — Audit Findings §2.5).
5. **Secure by default.** Every endpoint is authenticated and policy-checked unless this document explicitly says it is public (see §8 and Doc 08). Client-side guards in the prototype (a JavaScript `state.user` check) are not security and are not carried forward.
6. **No invented data.** Unverified statistics are never returned as numbers; the API returns an explicit "updating" state, matching the prototype's "তথ্য হালনাগাদ হচ্ছে" placeholder (Audit Findings §2.2, §5.6).

## 2. Versioning

- **Base URL:** `/api/v1/...` for all endpoints. The version is part of the path, not a header, so it is visible in logs, caches, and client code.
- **v1 support rule:** v1 is supported for **12 months after the release of v2** (or after v1 is formally deprecated, whichever is later). During that window v1 receives security fixes and critical bug fixes but no new features. Deprecation is announced in the API response headers and in the changelog (see §13).
- **Version negotiation:** clients send `Accept: application/json`. A request to an unknown version (e.g. `/api/v2/...` before v2 exists) returns `404` with error code `api_version_not_found`.
- **Breaking vs non-breaking changes.**
  - Non-breaking (allowed within v1): adding a field, adding an optional query parameter, adding an endpoint, widening an enum only where documented as extensible.
  - Breaking (requires a new major version): removing or renaming a field, changing a field's type, changing a status enum value, making an optional field required, changing pagination behaviour, changing an error code's meaning.
- **No version in the database.** Versioning is a transport concern only; stored data is version-neutral.

## 3. Response envelope

### 3.1 Success envelope

Every successful response uses this shape:

```json
{
  "data": { "...": "..." },
  "meta": {
    "request_id": "req_01J...",
    "timestamp": "2026-11-14T11:04:17+06:00"
  }
}
```

- `data` holds the resource, a list, or an object. For a single resource it is an object; for a list it is an array.
- `meta` always carries `request_id` (a unique per-request identifier, also returned in the `X-Request-Id` response header, used when reporting a fault) and `timestamp` (server time, ISO 8601 with the Asia/Dhaka offset).
- For paginated lists, `meta` additionally carries pagination information (see §5).

### 3.2 Error envelope

Every error response uses this shape:

```json
{
  "message_bn": "এই ID-তে কোনো আবেদন পাওয়া যায়নি।",
  "message_en": "No request was found with this ID.",
  "error": {
    "code": "expatriate_request_not_found",
    "details": { "...": "..." }
  },
  "meta": {
    "request_id": "req_01J...",
    "timestamp": "2026-11-14T11:04:17+06:00"
  }
}
```

- `message_bn` is the primary, user-facing message (Bengali first, matching the product's language). `message_en` is the English equivalent.
- `error.code` is a stable, machine-readable snake_case string. Clients branch on `code`, never on message text. Codes are documented per endpoint in §14 and must not change meaning within v1.
- `error.details` is optional and carries structured detail — for validation errors it carries the per-field errors (see §7).
- No stack traces, no exception class names, no SQL, and no internal paths are ever returned in an error body.

### 3.3 HTTP status codes

| Status | Meaning | Used when |
|---|---|---|
| 200 OK | Success | Read, update, action completed |
| 201 Created | Resource created | Registration application, request submission, new content, new ledger entry |
| 202 Accepted | Accepted for async processing | A request accepted onto a queue (e.g. bulk notification dispatch) where the result is not yet known |
| 204 No Content | Success, no body | Logout (token revoked), notification cleared, device unregistered |
| 400 Bad Request | Malformed request | Invalid JSON, malformed query parameter, an ID in the wrong format |
| 401 Unauthorized | Not authenticated | Missing/expired/invalid token or session; login failure returns 401, never a 200 with an error flag |
| 403 Forbidden | Authenticated but not permitted | Policy/gate denial (e.g. a member requesting another member's data; a helper requesting finance) |
| 404 Not Found | Resource does not exist | Unknown ID; unknown route. The body must not reveal whether a resource exists when the caller has no right to know (see §8.4) |
| 405 Method Not Allowed | Wrong verb on a known path | e.g. `DELETE /api/v1/news` (collection delete is not offered) |
| 409 Conflict | State conflict | Duplicate phone on registration; an invalid state transition (e.g. completing a request that is already closed); a stale `If-Match` / version conflict on a contested update |
| 422 Unprocessable Entity | Validation failed | Field-level validation errors (see §7) |
| 429 Too Many Requests | Rate limit exceeded | See §9; body carries `retry_after_seconds` in `error.details` |
| 500 Internal Server Error | Unexpected server fault | Generic code `internal_error`; the real detail goes to the server log with `request_id`, never to the client |
| 503 Service Unavailable | Dependency down / maintenance | Database or queue unavailable; maintenance window announced in advance |

## 4. Conventions

- **JSON only.** Request and response bodies are JSON (`Content-Type: application/json`). Form-data is used only for file uploads (see §11).
- **Field naming:** snake_case in JSON (`request_id`, `blood_group`, `created_at`). Dates are ISO 8601 strings. Money is a string or a JSON number with exactly two decimal places in BDT, backed by `decimal(12,2)` columns — never a float (per Decision Sheet).
- **IDs:** internal numeric IDs are never exposed as the public identifier where a public one exists. Expatriate requests are addressed by their public ID `EXP-YYYY-####` (e.g. `EXP-2026-1052`); other resources use UUIDs or numeric IDs as defined at scaffold time. IDs in URLs are validated for format before any database lookup.
- **Language:** the response language for `message_bn`/`message_en` is fixed (both always present). Stored content fields are returned as objects where bilingual, e.g. `"title": {"bn": "...", "en": "..."}`. A `?lang=bn|en` query parameter may be used by clients to request a preferred display language for *content*; it never changes the error envelope, which always carries both languages.
- **Timestamps:** all timestamps are stored in UTC and rendered with the Asia/Dhaka offset in responses. Clients must not compute business logic from rendered timestamps.
- **No trailing-slash ambiguity:** `/api/v1/news` and `/api/v1/news/` are treated identically; the canonical form has no trailing slash.

## 5. Pagination

Two pagination styles, chosen by list size and use, per the decision recorded in the task brief:

| Style | Used for | Behaviour |
|---|---|---|
| **Cursor pagination** | Large public lists: directory, donors, activities, news/notices/events/jobs, gallery, public finance ledger | `?cursor=<opaque>&per_page=N`. Response `meta` carries `next_cursor` (null when exhausted), `prev_cursor`, `per_page`. Stable ordering is mandatory (a deterministic sort key, e.g. `created_at` + `id`); new rows must not cause duplicates or skips across pages. |
| **Page-based pagination** | Admin lists: members, requests queue, finance entries, audit logs, contact messages, notifications | `?page=N&per_page=M`. Response `meta` carries `current_page`, `last_page`, `per_page`, `total`, `from`, `to`. |

- **Defaults and limits:** default `per_page` is **20**; maximum is **50**. A request for more than 50 is clamped to 50 (not rejected). A request for `per_page=0` or a non-numeric value returns `422`.
- **No unbounded lists.** Every list endpoint paginates. The prototype rendered at most 10 rows with no pagination at all (Audit Findings §3.1) — that does not scale and is not carried forward.
- **Total counts:** page-based responses include `total`. Cursor responses do not include a total (counting the full set on every request is wasteful at scale); where a client needs a count (e.g. "3 open requests"), a dedicated summary endpoint returns it.

## 6. Filtering, sorting, search

- **Filtering:** query parameters named after the field, e.g. `?status=pending&service=medicine`, `?blood_group=O+`, `?year=2026&kind=expense`, `?area=মধ্য পাড়া`. Only fields listed in the endpoint's documentation are filterable; unknown filter parameters are ignored (not an error), except where an endpoint documents strict validation.
- **Multi-value filters:** comma-separated, e.g. `?status=pending,accepted`. Values are validated against the allowed enum; an invalid value returns `422`.
- **Sorting:** `?sort=-created_at` (minus = descending), `?sort=title_bn`. Only whitelisted sort fields are accepted; anything else returns `422` with code `invalid_sort`. The default sort is defined per endpoint and is deterministic (always includes a tie-breaker on `id`).
- **Search:** `?search=<text>` performs a server-side search over the fields the endpoint documents. Implementation is default-parser FULLTEXT + BOOLEAN MODE with `+term*` wildcards as an Eloquent model scope (or `whereFullText` boolean / `whereLike`) per ADR-010 as rewritten for MariaDB 11.8.9. Bengali full-text quality was **measured on MariaDB 11.8.9 (2026-11-14, 35 cases / 171 timed queries, `benchmark-mariadb/`)**: default-parser FULLTEXT + BOOLEAN MODE with `+term*` wildcards as an Eloquent model scope (NOT Scout — Scout's database engine cannot express the `+term*` shape and defaults to natural-language mode); NATURAL LANGUAGE MODE must NOT be the default; `LIKE 'term%'` is for prefix/autocomplete; minimum 2 characters per term; strip English stopwords from `+`-terms; escape boolean operators; split multi-word input with `+` AND operators and `*` wildcards; order explicitly, never by MATCH relevance. Spelling variants are NOT tolerated by any approach. The `search_tokens` column is conditional on an explicit product decision (Awaiting Organisation). The Phase 0.1 MySQL 8.0.46 ngram recommendation does NOT transfer to MariaDB (no ngram parser). Production re-validation on MariaDB 11.8.9 + a real-data snapshot is required before any performance claim (Doc 13 Q-13, Doc 15 §9 as amended by 16-MARIADB-ADDENDUM.md). Search never returns fields the caller is not permitted to see.
- **Filtering is server-side.** The prototype filtered arrays in the browser over hardcoded data (Audit Findings §6). The API filters, sorts, and paginates in the database; clients never receive the full dataset to filter locally.

## 7. Validation and error handling

- **Server-side re-validation of every prototype rule.** The prototype's client-side rules (Audit Findings §7.1) are the *minimum* the API enforces, and the API enforces them again on the server — client-side validation is a convenience, never a boundary. The prototype rules to re-validate:
  - Name / free text: at least 2 characters after trimming (`fForWhom`, `fName`, `fCountry`, `rName`, `rArea`, `cName`).
  - Details / message: at least 10 characters after trimming (`fDetails`, `cMsg`).
  - Phone: at least 10 digits after stripping non-digits (`phoneOk()`). The prototype had no `01` prefix check and no length cap — the production rule must be stronger (see below).
  - Password (registration): at least 6 characters in the prototype — production requires a stronger rule (see below).
  - Hospital name: at least 3 characters after trimming.
  - Consent checkbox (`fAgree`): must be checked.
  - Request ID lookup: any string is looked up; unknown IDs return a not-found error.
  - Profile form: the prototype had **no validation at all** — the API must validate profile updates like any other write.
- **Stronger production rules (planned, to be confirmed at scaffold time):**
  - Phone: Bangladesh mobile format — 11 digits starting `01`, or the international form `+8801…` normalised to the same stored value; stored normalised, displayed masked where required. Maximum length enforced.
  - Password: the single policy in Doc 04 §5.1 governs — minimum 12 characters for all accounts, 16 enforced for Super Admin; no composition rules; mandatory breach screening (HIBP k-anonymity + local ≥10,000 list + context blocklist); Argon2id (m=19 MiB, t=2, p=1), bcrypt cost ≥12 fallback; history 5; no expiry. Passwords are hashed; plaintext passwords are never stored, logged, or returned — the prototype stored demo passwords in plaintext in the HTML file (Audit Findings §5.5) and that must never be repeated.
  - Text fields: maximum lengths on every string field (to be set per field at scaffold time); HTML is stripped or escaped on output (see Doc 08).
  - File uploads: see §11 and Doc 08.
- **Validation failure response (422):**

```json
{
  "message_bn": "দেওয়া তথ্যে ভুল আছে।",
  "message_en": "The provided data is invalid.",
  "error": {
    "code": "validation_failed",
    "details": {
      "errors": {
        "phone": ["সঠিক মোবাইল নম্বর দিন (কমপক্ষে ১০ ডিজিট)।"],
        "details": ["অন্তত ১০ অক্ষরে বিবরণ লিখুন।"]
      }
    }
  }
}
```

- Field errors are keyed by field name, each a list of messages (Bengali messages as written in the prototype, Audit Findings §7.2, plus English equivalents). The HTTP status is always 422 for validation failures, never 200.
- **Mass-assignment protection:** only explicitly whitelisted fields are accepted on write; unknown fields in a request body are ignored (and logged at debug level), never stored. See Doc 08.

## 8. Authentication

Sanctum 4.x (`^4.0`) per Research Notes §3 and ADR-004. Two modes, deliberately separate — the Sanctum documentation rule applies: **API tokens must not be used to authenticate the first-party web SPA; the SPA uses cookie authentication.**

### 8.1 Web (Next.js, first-party SPA) — cookie authentication

- The SPA and the API share the same top-level domain (different subdomains allowed). The SPA fetches a CSRF cookie from `/sanctum/csrf-cookie` before its first state-changing request.
- Authentication is the Laravel session cookie plus CSRF protection (`PreventRequestForgery` middleware in Laravel 13, origin-aware via `Sec-Fetch-Site` — Research Notes §1). Requests send `Accept: application/json` and the `Origin`/`Referer` headers.
- Stateful domains are configured explicitly; no wildcard stateful domain is used in production.
- Session driver: **database** to start (per Decision Sheet). Sessions are not stored in cookies beyond the session ID.

### 8.2 Mobile (Flutter app, future) — personal access tokens

- The app authenticates with a personal access token issued at login (`POST /api/v1/auth/login` returns a token for token clients; see §14.1), sent as `Authorization: Bearer <token>`.
- Tokens are stored SHA-256 hashed; the plaintext value is shown exactly once, at creation. Tokens never expire by default in Sanctum — this deployment **sets a global token expiry of 30 days** (decided Phase 0.1) and prunes expired tokens daily (`sanctum:prune-expired`).
- Token abilities (scopes) are used where they add value (e.g. a token limited to `requests:read`), but abilities are not a substitute for policies — see §8.3.
- Sanctum provides **no refresh-token flow, no per-device session list, and no "log out everywhere"** (Research Notes §3). The API designs around this: logout deletes the current token; "log out of all devices" deletes all of the user's tokens (and, for the web, invalidates the session). These are explicit endpoints in §14.1.

### 8.3 Authorization — policies and gates on every endpoint

- **Every endpoint is policy-checked.** Authentication proves *who* the caller is; a policy/gate proves *what* they may do. No endpoint relies on a client-side role check, on a hidden URL, or on the caller simply not asking for something.
- Implementation: Spatie Laravel Permission v8 (`^8.0`) roles and permissions, registered on Laravel's Gate, checked with policies (per Research Notes §5 and ADR-005). Permission names follow the `resource.action` convention (e.g. `members.view`, `expatriate.requests.assign`, `finance.approve`, `donors.view_contact`, `audit_logs.view`).
- **Phase 1 roles (final, per Decision Sheet):** `super-admin` and `expatriate-helper` only. `member` is a registered community user, not an admin role. `public` is an unauthenticated visitor. Other roles (President, General Secretary, Treasurer, etc.) are **deferred** — they are evaluated as future options and must not be implemented in Phase 1.
- **Helper boundary (enforced server-side, throughout):** an Expatriate Helper sees and acts on **expatriate requests only** — no members, no finance, no content, no donors, no settings, no audit logs. A helper requesting any other resource receives `403` with code `forbidden`.
- **Object-level rules (examples, enforced by policies):**
  - A member reads only their own profile, their own requests, and their own notifications. Requesting another member's record returns `404` (not `403`) so the existence of another member's data is not leaked — see §8.4.
  - A helper advances only requests assigned to them, or unassigned requests they claim through the documented claim/assign flow; they cannot advance a request assigned to another helper.
  - A donor's phone number is never returned in a list or search response. It is revealed only through the consent flow (§14.8) and only to the requester of that specific blood request, after the donor grants consent; every reveal is logged (Audit Findings §3 #18–#19, Decision Sheet).
- Public tracking is **secret-authenticated** (`POST /api/v1/expatriate-requests/track`, X2): the caller presents the Request ID **and** the 128-bit tracking secret issued at submission (stored as a SHA-256 hash, doc 06 §6.1). The Request ID is a public identifier, never a credential. The tracking view is the **Tier-S allowlist only** (Doc 04 §7.4 — canonical wording; full field table, JSON names, and sample response in Worker C `ALLOWLIST.md`): `request_no`; `status`; `service` (`key` + `name_bn` snapshots); the 4-node tracking timeline (Pending → Accepted → In Progress → Completed; per node `label_en`, `reached_at`, latest applicant-visible `note_bn`/`note_en` — no author identities, no internal notes); itemised expense lines (`item_bn`, `item_en`, `kind`, `amount`) + server-computed `expense_total` + the constant `service_charge: 0` (a literal, not a column — there is no service-charge field anywhere in the system). **No applicant/beneficiary name or phone, no details, no vouchers, no author identities** — and no `urgency`/`needed_by`, no request-level timestamps, no rejection/cancellation reasons, no `no_expense_declaration` flag, no update photos, no plain notes (AO-18–AO-21, open). The prototype exposed the applicant's name and area to anyone with the ID (Audit Findings §3.1) — that behaviour is deleted. Uniform 404 for unknown IDs and for wrong, revoked, expired, and locked secrets; 10/min/IP + 5/min/Request ID; 10 failures in 60 minutes → 60-minute lock.
- **Super Admin password reset:** forgotten passwords are reset by the Super Admin (per Phase 1 scope; the prototype had no reset flow at all — Audit Findings §8 item 5). The reset endpoint is Super Admin-only and is audited. There is no self-service "forgot password" email flow in Phase 1 (no email provider is confirmed); this is a deliberate scope decision, not an omission to fill silently.

### 8.4 Information disclosure in errors

- A `404` and a `403` must be indistinguishable to an unauthorised caller where the resource's existence is itself sensitive (member records, donor contact details, another user's requests). The rule: if the caller would not be permitted to know the resource exists, return `404` with code `not_found`.
- Error messages never include database details, file paths, or internal identifiers.

## 9. Rate limiting

Per Engineering Plan v1.1 (rate limits) and the task brief:

| Scope | Limit | Notes |
|---|---|---|
| Login (`POST /api/v1/auth/login`) | **Strict** — 5 attempts per 15 minutes per IP + phone number; 10 failed attempts → 30-minute account lock, growing 30 → 60 → 240 minutes on repeated failure (Doc 04 §5.2) | Failed logins are logged; the response does not say whether the phone number exists; 423 only after the correct password is presented on a locked account, else generic 401 |
| Password reset (Super Admin action) | 10 per minute per admin | |
| Public tracking (`POST /api/v1/expatriate-requests/track`) | 10 per minute per IP + 5 per minute per Request ID; 10 failures in 60 minutes → 60-minute lock | Prevents Request-ID enumeration and secret guessing; uniform 404 |
| Public form submissions (expatriate request, blood request, contact) | 10 per minute per IP; 3 per hour per phone number for the same form | Prevents spam and enumeration |
| General authenticated API | **120 requests per minute per user** | Per plan v1.1 |
| General unauthenticated public reads | 120 requests per minute per IP | |
| File uploads | 10 per minute per user | Plus size limits (§11) |
| Blood donor-contact reveal (B6) | **Strict** — 10 per minute per user | The most sensitive read; every reveal is audit-logged |

- Rate-limit state is stored in the cache driver (database cache to start; Redis when adopted — see ADR-009). Limits are returned in headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`).
- A `429` response carries `retry_after_seconds` in `error.details` and code `rate_limit_exceeded`.
- Rate limits are enforced in middleware, not in controllers, so no endpoint can forget them.

## 10. OpenAPI / Swagger documentation

- The API is documented with **OpenAPI 3.x, generated from the code** (annotations/attributes on controllers and Form Requests), not hand-written in a separate file that drifts from the implementation.
- The generated specification is published at a documented URL on staging and production (read-only), and the interactive Swagger UI is available on staging; on production it is available only to authenticated Super Admins, or not at all — to be confirmed at scaffold time.
- The specification is a **contract test input**: contract tests (Doc 10) validate live responses against the published schema. A response that does not match its schema fails CI.
- Every endpoint in §14 must appear in the specification with its parameters, request body, responses, error codes, and auth requirements. An endpoint that exists in code but not in the specification is a defect.

## 11. File uploads and media delivery

- **Uploads go through the API only** (`multipart/form-data` to the endpoints in §14). Files are validated before storage: allowed MIME types (checked by content, not by extension), per-type size limits (to be set per endpoint at scaffold time; images are expected to be a few MB at most), and a ClamAV scan per Engineering Plan v1.1 (see Doc 08).
- **Never executable.** Executable types (`.php`, `.exe`, `.sh`, scripts, HTML/SVG with embedded script) are rejected. Uploaded files are stored outside the web root or on a disk that never executes them; filenames are server-generated (UUID + safe extension), never the user-supplied name.
- **Storage:** local `public` disk via the Storage facade to start (per Decision Sheet and ADR-007); all access goes through the facade so the disk can move to S3-compatible storage later without touching call sites. Private files live on a non-public disk.
- **Delivery:**
  - Public media (activity photos, gallery images, published report files): served by direct URL with cache headers.
  - Private media (member photos, receipts, proof-of-delivery photos, donor-related documents): served **only through a controller that checks the policy, then returns a signed, time-limited URL** (`temporaryUrl()`). Signed URLs expire (recommended: 15–60 minutes, per resource type) and are single-purpose. A signed URL is never logged.
- **Image handling:** the backend stores the original and generates the display sizes it needs (thumbnail, standard, wide). The prototype embedded 21 base64 JPEGs totalling ~13 MB in a single HTML file (Audit Findings §1.1) — that approach is not carried forward; images are files, referenced by URL.
- **Video:** the video gallery is a placeholder in the prototype ("ভিডিও গ্যালারি শীঘ্রই আসছে" — Audit Findings §3 #25). Video upload/embedding is **proposed — confirm in Sprint 1**; if confirmed, videos are stored as files or embedded from an approved provider, never as base64 in a page.

## 12. Notifications, device registration, and push — integration points

This section defines the **integration points** only. The delivery mechanisms themselves are built in later phases; nothing here claims a working push system exists.

- **Two sources of truth (Phase 0.1, B §3.9):** the `notifications` table is what the user was told (read state); `notifications_log` (doc 06 §8.1) is the delivery-attempt record. The two are never merged. Failed sends are retried at most 3 times with exponential back-off.
- **In-app notifications (database):** every event that matters creates a persistent, per-user notification row (Laravel database notifications). The prototype's notifications were an in-memory array that vanished on reload (Audit Findings §6). The API exposes list / read / clear endpoints (§14.10). Notifications are per-user; a user lists only their own.
- **New expatriate request → helper notification (Phase 1 requirement):** on submission, the backend creates notifications for the Super Admin and **all** Expatriate Helpers, and attempts browser/push delivery to registered devices. Delivery is best-effort at this layer; the database notification is the reliable record, and the helper queue in the admin panel always shows the request whether or not a push arrived.
- **Web Push (VAPID):** browsers that support it register a push subscription (`POST /api/v1/devices/web-push`) storing endpoint + keys. The server sends via the Web Push protocol with VAPID keys held server-side only. Subscriptions are per user and per device; unsubscribing deletes the row. Expired/invalid subscriptions (410 Gone from the push service) are pruned automatically.
- **FCM / APNs (future mobile, M12):** the Flutter app registers its device token (`POST /api/v1/devices`) with platform (`android`/`ios`), token, and app version. The server stores tokens per user and sends through FCM (Android) and APNs (iOS). Tokens are refreshed on app start; invalid tokens are pruned on delivery failure. No push provider credentials are ever shipped in the app or the frontend.
- **Guests (no account) receive no completion notification in Phase 1** — there is no notification channel for guests; tracking IS the notification (X2, X11/X12). A guest confirms closure or cancels via the secret-authenticated endpoints (§14.7).
- **What is not in Phase 1:** email and SMS delivery (no provider is confirmed), live chat, and any realtime socket. If a realtime channel is wanted for helper notifications, Laravel Reverb v1 is the candidate — its database driver is **unverified** (Research Notes §8, §9 item 10) and must be confirmed in the Reverb documentation before it is relied on. Polling the notifications endpoint is the safe fallback.
- **Notification content rules:** notification bodies never contain a full phone number, a password, or a signed URL. They contain the minimum needed to act (e.g. "New expatriate request EXP-2026-1052 — medicine").

## 13. Compatibility and deprecation policy

- **Additive changes** (new fields, new optional parameters, new endpoints) are released inside v1 without notice beyond the changelog.
- **Deprecations** are announced at least one release before removal, in the changelog and in the response header `Deprecation: true` plus `Sunset: <date>` on the affected endpoints. A deprecated endpoint keeps working until its Sunset date.
- **Sunset rule:** no endpoint is removed before the v1 support window in §2 expires. Clients are given a migration note naming the replacement endpoint.
- **Changelog:** every API change is recorded in a versioned changelog (date, version, change, migration note). The changelog is part of the repository, not a chat message.
- **Client compatibility:** the Next.js web client and the Flutter app pin the API version they were built against and are tested against it in CI before any API release.

## 14. Endpoint inventory

Conventions for the tables below:

- **Auth:** `Public` (no authentication), `Cookie` (web session), `Token` (mobile bearer token), `Cookie or Token` (either Sanctum mode; the `auth:sanctum` guard tries the session first, then the token).
- **Permissions** use the `resource.action` convention. `—` means no permission check beyond authentication (the endpoint's own logic enforces ownership).
- **Rate limit** column gives the named bucket from §9 (`login`, `public-read`, `general`, `public-submit`, `tracking`, `upload`).
- **Privacy** notes flag the sensitive point of each endpoint.
- Endpoints marked **"proposed — confirm in Sprint 1"** are not confirmed requirements; they must be confirmed or dropped in Sprint 1 and must not be built on assumption.

Count: **134 endpoints** are listed below. This exceeds Engineering Plan v1.1's estimate of ~70 endpoints; the plan's figure was an estimate made before the per-module inventory was drawn up, and the full inventory — including the admin module, device/push registration, and the finance and consent workflow steps — totals 134 (108 at Phase 0 + 25 added in Phase 0.1 + 2 added in Phase 0.1.1 − 1 deleted in Phase 0.1; see Doc 15 §6/§21). The plan figure is not a cap, and the difference is recorded here rather than hidden by cutting endpoints. Of the 134, **7 endpoints are wholly proposed** (C6–C8 infrastructure, G4–G5 video, F9–F10 project accounts) and **0 carry a behaviour-level proposal outstanding** — the 4 behaviour-level proposals from Phase 0 (C4, F4, M2, D5) were all decided in Phase 0.1 (see their rows).

### 14.1 Auth (M1)

| # | Method & URL | Auth | Permissions | Params / body | Response | Validation | Error cases | Rate limit | Privacy |
|---|---|---|---|---|---|---|---|---|---|
| A1 | `POST /api/v1/auth/login` | Public | — | Body: `phone`, `password`, `device_name?` (token clients) | 200: user summary + (token clients) `token` (plaintext, shown once) + `token_expires_at`; (web) session cookie, no token | phone: required, valid phone format; password: required | 401 `invalid_credentials` (same message whether phone or password is wrong); 429 `rate_limit_exceeded`; 423 `account_locked` — only after the correct password is presented on a locked account, otherwise the generic 401 (Doc 04 §5.2) | login (strict) | Never reveal whether the phone exists. Never return a password hash. Log failed attempts without the password |
| A2 | `POST /api/v1/auth/logout` | Cookie or Token | — | — | 204 No Content (current token deleted / session invalidated) | — | 401 if not authenticated | general | — |
| A3 | `POST /api/v1/auth/logout-all` | Cookie or Token | — | Body: `password` (confirmation) | 204 (all tokens deleted, all sessions invalidated) | password: required, must match current password | 401; 422 `validation_failed` | general | Use after a suspected compromise |
| A4 | `GET /api/v1/auth/user` | Cookie or Token | — | — | 200: authenticated user summary (id, name, phone, area, type, roles, permissions) | — | 401 | general | Returns only the caller's own data |
| A5 | `POST /api/v1/auth/register` | Public | — | Body: `name`, `phone`, `password`, `area`, `type` (resident/expat/student), `donor_opt_in?` (boolean) | 201: membership application created, status `pending`; **login succeeds but services are locked** — a pending user who logs in sees an 'awaiting approval' screen and cannot use services until a Super Admin approves (Doc 04 §8.15; Recommended, pending Fahim's confirmation — REG-AUTH-01). The prototype flaw (Audit Findings §3 #30: registration stored nothing and the new user could not log in) is fixed by a real approval workflow, not by auto-login | name ≥2 chars; phone valid + unique; password meets Doc 04 §5.1 (≥12 chars); area ≥2 chars; type in enum | 422 `validation_failed`; 409 `duplicate_phone` | public-submit | Password hashed server-side; phone stored encrypted (see Doc 08) |
| A6 | `POST /api/v1/auth/password/reset-by-admin` | Cookie | `members.reset_password` | Body: `user_id` (no `new_password` field — the system generates a random temporary password, ≥16 characters, single-use, 24-hour expiry) | 200: confirmation; temporary password returned once, only to the Super Admin, never emailed in Phase 1 | — | 403; 404 `not_found` (user); 422 | general | The reset is audit-logged with actor + target. The Super Admin must convey the temporary password to the member out of band. The member must change it on first login (`must_change_password`) |
| A7 | `POST /api/v1/auth/password/change` | Cookie or Token | — | Body: `current_password`, `new_password` | 200 | current must match; new meets the password rule and differs from current | 401; 422 | general | — |
| A8 | `GET /api/v1/auth/tokens` | Cookie or Token | — | — | 200: list of the caller's active tokens (id, device name, abilities, last used, expires) — **never the token value** | — | 401 | general | Own tokens only |
| A9 | `DELETE /api/v1/auth/tokens/{token}` | Cookie or Token | — | Path: token id | 204 | — | 401; 404 | general | Own tokens only; cannot delete the token making the request via this route (use A2) |

### 14.2 Public (M11 — no login required)

| # | Method & URL | Auth | Permissions | Params / body | Response | Validation | Error cases | Rate limit | Privacy |
|---|---|---|---|---|---|---|---|---|---|
| P1 | `GET /api/v1/public/home` | Public | — | — | 200: hero copy, story, Meridian timeline nodes (only verified milestones — the prototype has exactly one verified node, 1999; Audit Findings §2.2), services list, stats (verified figures only; unverified counts returned as `{"status": "updating"}`), latest 2 activities + 2 news, gallery subset, finance 2026 summary | — | 500 | public-read | No personal data |
| P2 | `GET /api/v1/public/stats` | Public | — | — | 200: aggregate counts by area/status; unverified figures returned as `updating`, never invented | — | 500 | public-read | Aggregates only; no personal data |
| P3 | `GET /api/v1/public/settings` | Public | — | — | 200: public site settings (brand, tagline, slogan, office hours, emergency number 999, ERT size 3–5, policy copy: no service charge, 999 disclaimer) — the single source for policy copy the prototype re-typed in several places (Audit Findings §4 item 10) | — | 500 | public-read | No real phone/email until verified and approved for publication |
| P4 | `GET /api/v1/public/faq` | Public | — | `?search=` | 200: cursor list of published FAQ entries (question/answer, order) | — | 422 bad sort/search | public-read | — |
| P5 | `GET /api/v1/public/privacy-policy` | Public | — | — | 200: current privacy policy text + version + effective date | — | 404 if no published version | public-read | — |
| P6 | `POST /api/v1/public/contact` | Public | — | Body: `name`, `phone`, `message` | 201: message received (id + reference) | name ≥2; phone valid; message ≥10 chars | 422; 429 | public-submit | Stored for admin inbox only; never published |
| P7 | `GET /api/v1/public/finance/summary` | Public | — | `?month=` (YYYY-MM) | 200: published monthly summary (totals by kind, balance) computed on read from published entries | month format YYYY-MM | 422 | public-read | Aggregates only; no unpublished figures |
| P8 | `GET /api/v1/public/announcements` | Public | — | `?cursor=` | 200: cursor list of published announcements | — | 422 | public-read | — |
| P9 | `GET /api/v1/public/emergency-contacts` | Public | — | — | 200: emergency contacts (ERT size 3–5, 999 disclaimer, office contact where approved for publication) | — | 500 | public-read | No real phone until verified and approved for publication |
| P10 | `GET /api/v1/public/contact` | Public | — | — | 200: contact-page info (office address, hours, public contact channels) — distinct from P6, which submits a message | — | 500 | public-read | No real phone/email until verified and approved for publication |
| P11 | `GET /api/v1/public/freedom-fighters` | Public | — | `?cursor=` | 200: cursor list of published freedom-fighter profiles (verified only, consent-gated) | — | 422 | public-read | Published only with consent (doc 06 §3.7) |

### 14.3 Community — directory, profile, infrastructure (M2)

| # | Method & URL | Auth | Permissions | Params / body | Response | Validation | Error cases | Rate limit | Privacy |
|---|---|---|---|---|---|---|---|---|---|
| C1 | `GET /api/v1/directory` | Public | — | `?search=&category=&area=&cursor=&per_page=`; categories: teacher, doctor, professional, business, institution, place (Audit Findings §5.1) | 200: cursor list (name bn/en, role bn/en, category, area). **No phone, email, or address** — the prototype stores none on directory entries (Audit Findings §5.1) | category/area in allowed lists; per_page ≤50 | 422 | public-read | Public by design; entries are published only after consent (see §14.3 note) |
| C2a | `GET /api/v1/directory/persons/{id}` | Public | — | Path id | 200: single person entry | — | 404 | public-read | As C1 |
| C2b | `GET /api/v1/directory/institutions/{id}` | Public | — | Path id | 200: single institution entry | — | 404 | public-read | As C1 |
| C2c | `GET /api/v1/directory/places/{id}` | Public | — | Path id | 200: single place/landmark entry | — | 404 | public-read | As C1 |
| C3 | `POST /api/v1/directory` | Cookie | `directory.create` | Body: name bn/en, role bn/en, category, area, `kind` (person / institution / place — required), `consent_on_file` (boolean, required) | 201: entry created, status `draft` (not public until approved) | Required fields; category in enum; consent flag must be true | 403; 422 | general | Consent is a precondition for publication, not a formality |
| C4 | `PUT /api/v1/directory/{id}` | Cookie | `directory.update` | Body: same as C3 | 200: updated entry | As C3 | 403; 404; 422 | general | Editing a published entry sets `visibility=private` until re-approved — **decided (Phase 0.1)** |
| C5 | `DELETE /api/v1/directory/{id}` | Cookie | `directory.delete` | — | 204 (soft delete; retained for audit) | — | 403; 404 | general | Soft delete only; hard delete requires Super Admin + audit entry |
| C6 | `GET /api/v1/infrastructure` | Public | — | `?search=&type=&cursor=` | 200: cursor list of facilities/places | — | 422 | public-read | — |
| C7 | `POST /api/v1/infrastructure` | Cookie | `community.infrastructure.manage` | Body: name, type, description, location text | 201 | Required fields | 403; 422 | general | — |
| C8 | `PUT /api/v1/infrastructure/{id}` | Cookie | `community.infrastructure.manage` | Body: as C7 | 200 | As C7 | 403; 404; 422 | general | — |

> C6–C8 cover Audit Findings §3 #6 (community infrastructure — absent in Direction D). The data model (facilities, locations, status, map) is **proposed — confirm in Sprint 1**; no map provider is chosen in this blueprint. Facilities (`infrastructure_facilities`, doc 06 §3.8) and landmarks/places (`landmarks`, doc 06 §3.6, via C2c) are separate resources (M-23).
| C9 | `GET /api/v1/members/directory` | Cookie or Token | — (members only) | `?search=&category=&area=&cursor=` | 200: cursor list incl. members-only entries (the members-only view C1 does not cover) | — | 401; 422 | general | Members-only entries are never public |
| C10 | `GET /api/v1/community/professionals` | Public | — | `?profession=&area=&cursor=` | 200: cursor list of professionals (from `persons`, `profession_bn`/`area_bn` search — doc 06 §3.2) | — | 422 | public-read | Public entries only |
| C11 | `GET /api/v1/public/institutions/{id}` | Public | — | Path id | 200: single institution (name, type, services, hours, contact where consented) | — | 404 | public-read | Phone shown only where `show_phone_publicly` is true (doc 06 §3.5) |

### 14.4 Organisation (M3)

| # | Method & URL | Auth | Permissions | Params / body | Response | Validation | Error cases | Rate limit | Privacy |
|---|---|---|---|---|---|---|---|---|---|
| O1 | `GET /api/v1/organization/history` | Public | — | — | 200: verified timeline milestones only (1999 founding is the only verified milestone — Audit Findings §2.2); unverified years are not returned | — | 500 | public-read | — |
| O2 | `GET /api/v1/organization/constitution` | Public | — | — | 200: current constitution version (articles; the prototype's 5 articles are explicitly a *sample summary*, Audit Findings §3 #8 — the real text must be supplied and versioned) | — | 404 if unpublished | public-read | — |
| O3 | `GET /api/v1/organization/committee` | Public | — | `?term=` (current/former) | 200: committee, advisory council, former leaders (role, term start/end; photos only with consent) | — | 422 | public-read | Contact details are not public |
| O4 | `POST /api/v1/organization/committee` | Cookie | `organization.manage` | Body: person, role, term_start, term_end?, photo? | 201 | Required fields; term dates valid | 403; 422 | general | — |
| O5 | `PUT /api/v1/organization/committee/{id}` | Cookie | `organization.manage` | Body: as O4 | 200 | As O4 | 403; 404; 422 | general | — |
| O6 | `POST /api/v1/organization/constitution` | Cookie | `organization.manage` | Body: version, articles, effective_date, document file? | 201: new version (old versions retained) | Required fields | 403; 422 | upload | — |
| O7 | `GET /api/v1/admin/organization/history` | Cookie | `organization.manage` | — | 200: all milestones incl. unverified/draft | — | 403 | general | Admin-only view; distinct from the public O1, which returns verified milestones only |
| O8 | `POST /api/v1/organization/history` | Cookie | `organization.manage` | Body: date, title bn/en, body bn/en, `verified` (boolean) | 201 | Required fields; unverified milestones are never published | 403; 422 | general | The `verified` flag is the control that prevents invented history |

### 14.5 Activities (M4)

| # | Method & URL | Auth | Permissions | Params / body | Response | Validation | Error cases | Rate limit | Privacy |
|---|---|---|---|---|---|---|---|---|---|
| AC1 | `GET /api/v1/activities` | Public | — | `?search=&year=&category=&cursor=&per_page=` | 200: cursor list (id, year, date, title bn/en, summary, cover image URL). **Category is stored per activity** — the prototype's category filter had no data behind it (Audit Findings §8 item 7); the API must store `category` or drop the filter | year/category in allowed lists | 422 | public-read | — |
| AC2 | `GET /api/v1/activities/{id}` | Public | — | Path id (or slug) | 200: full activity (body bn/en, gallery image URLs, outcomes) | — | 404 | public-read | — |
| AC3 | `POST /api/v1/activities` | Cookie | `activities.create` | Body: year, date, category, title bn/en, body bn/en, cover image | 201, status `draft` | Required fields; date valid | 403; 422 | upload | — |
| AC4 | `PUT /api/v1/activities/{id}` | Cookie | `activities.update` | Body: as AC3 | 200 | As AC3 | 403; 404; 422 | upload | — |
| AC5 | `POST /api/v1/activities/{id}/publish` | Cookie | `activities.publish` | — | 200: status `published`, `published_at` set | — | 403; 404; 409 (already published) | general | Publishing is a separate, audited action from saving |
| AC6 | `DELETE /api/v1/activities/{id}` | Cookie | `activities.delete` | — | 204 (soft delete) | — | 403; 404 | general | — |

### 14.6 Content — news, notices, events, jobs, gallery, FAQ (M7)

| # | Method & URL | Auth | Permissions | Params / body | Response | Validation | Error cases | Rate limit | Privacy |
|---|---|---|---|---|---|---|---|---|---|
| N1 | `GET /api/v1/news` | Public | — | `?search=&cursor=` | 200: cursor list of published news (date, tag, title, body) | — | 422 | public-read | — |
| N2 | `GET /api/v1/news/{id}` | Public | — | Path id | 200: full article (author, date, body, images) — the prototype had no detail page (Audit Findings §3 #20) | — | 404 | public-read | — |
| N3 | `POST /api/v1/news` | Cookie | `content.create` | Body: title, body, tag, publish_at? | 201, status `draft` | Required fields | 403; 422 | general | — |
| N4 | `PUT /api/v1/news/{id}` | Cookie | `content.update` | Body: as N3 | 200 | As N3 | 403; 404; 422 | general | — |
| N5 | `POST /api/v1/news/{id}/publish` | Cookie | `content.publish` | — | 200 | — | 403; 404; 409 | general | — |
| N6 | `GET /api/v1/notices` | Public | — | `?cursor=` (expired notices excluded by default) | 200: published, unexpired notices (priority, expiry) | — | 422 | public-read | — |
| N7 | `POST /api/v1/notices` | Cookie | `content.create` | Body: title, body, priority, expires_at? | 201, status `draft` | Required fields; expiry after publish date | 403; 422 | general | — |
| N8 | `PUT /api/v1/notices/{id}` | Cookie | `content.update` | Body: as N7 | 200 | As N7 | 403; 404; 422 | general | — |
| E1 | `GET /api/v1/events` | Public | — | `?cursor=&upcoming=` | 200: published events (date/time, venue, body) | — | 422 | public-read | — |
| E2 | `POST /api/v1/events` | Cookie | `content.create` | Body: title, body, starts_at, ends_at?, venue | 201, status `draft` | Required fields; end after start | 403; 422 | general | — |
| E3 | `PUT /api/v1/events/{id}` | Cookie | `content.update` | Body: as E2 | 200 | As E2 | 403; 404; 422 | general | — |
| J1 | `GET /api/v1/jobs` | Public | — | `?cursor=` | 200: published, **verified** job circulars only (`employer_bn`, `application_deadline`, details) — the prototype requires verification before publication (Audit Findings §3 #23) | — | 422 | public-read | — |
| J2 | `POST /api/v1/jobs` | Cookie | `content.create` | Body: `employer_bn`, `employer_en?`, title, body, `application_deadline`, `verified` (false by default) | 201, status `draft`, verified=false | Required fields | 403; 422 | general | Unverified circulars are never public |
| J3 | `PUT /api/v1/jobs/{id}` | Cookie | `content.update` | Body: as J2 (incl. `verified`) | 200 | As J2 | 403; 404; 422 | general | Setting `verified=true` is audited |
| G1 | `GET /api/v1/gallery` | Public | — | `?album=&cursor=` | 200: cursor list (image URL, caption bn/en, album) — captions and consent flags stored per item | — | 422 | public-read | Only items with photo consent are public |
| G2 | `POST /api/v1/gallery` | Cookie | `media.upload` | multipart: image file, caption bn/en, album, `consent_on_file` (required) | 201 | File passes §11 checks; consent flag true | 403; 422 | upload | Consent is mandatory for photos of people |
| G3 | `DELETE /api/v1/gallery/{id}` | Cookie | `media.manage` | — | 204 (soft delete; file retained per retention rule, then purged) | — | 403; 404 | general | — |
| G4 | `GET /api/v1/videos` | Public | — | `?cursor=` | 200: published videos | — | 422 | public-read | **proposed — confirm in Sprint 1** (video gallery is a placeholder in the prototype, Audit Findings §3 #25) |
| G5 | `POST /api/v1/videos` | Cookie | `media.upload` | Body: source (file or approved embed URL), caption, consent flag | 201 | As G2 | 403; 422 | upload | **proposed — confirm in Sprint 1** |
| Q1 | `POST /api/v1/faq` | Cookie | `content.create` | Body: question bn/en, answer bn/en, order, category? | 201 | Required fields | 403; 422 | general | — |
| Q2 | `PUT /api/v1/faq/{id}` | Cookie | `content.update` | Body: as Q1 | 200 | As Q1 | 403; 404; 422 | general | — |

### 14.7 Expatriate Services (M5)

The core workflow. Status enum (per Decision Sheet): `pending → accepted → in_progress → completed → closed`, plus `rejected` and `cancelled`. Services: from the admin-managed catalogue (`service_types`, doc 06 §6.8; the 7 prototype values are the seed candidates, pending Q-22). Urgency: `normal` / `urgent`; timing preference `needed_by`: `today` / `tomorrow` / `week` / null.

| # | Method & URL | Auth | Permissions | Params / body | Response | Validation | Error cases | Rate limit | Privacy |
|---|---|---|---|---|---|---|---|---|---|
| X1 | `POST /api/v1/expatriate-requests` | Public | — | Body: `service_key` (from the catalogue, S1), `for_whom`, `details`, `urgency` (`normal`/`urgent`), `needed_by?` (`today`/`tomorrow`/`week`), `applicant_name`, `phone`, `country_code`, `agree` (must be true) | 201: request created with server-generated unique ID `EXP-YYYY-####` (the prototype generated random IDs with no uniqueness check — Audit Findings §8 item 10 — the API generates them under a uniqueness constraint), status `pending`, `created_at` = server time (the prototype hardcoded the creation date — Audit Findings §6). **The response includes the 128-bit tracking secret (32 hex chars, shown exactly once)** — the applicant must keep it; it is the only way to track, confirm-close, or cancel without an account (X2, X11, X12) | service_key in the active catalogue; for_whom ≥2 chars; details ≥10 chars; urgency in enum; needed_by in enum or null; applicant_name ≥2; phone valid; country_code valid; agree=true | 422; 429 | public-submit | No login is required to submit (matching the prototype, Audit Findings §3.1). The requester's phone is stored encrypted and is visible only to Super Admin and assigned helpers. The tracking secret is stored only as a SHA-256 hash (doc 06 §6.1) |
| X2 | `POST /api/v1/expatriate-requests/track` | Public | — (secret-authenticated) | Body: `request_no`, `tracking_secret` (never in a URL or query string) | 200: **Tier-S allowlist view only** (Doc 04 §7.4 — canonical wording; full field table + sample response in Worker C `ALLOWLIST.md`): `request_no`; `status`; `service` (`key`, `name_bn`); `timeline` (4 nodes: Pending, Accepted, In Progress, Completed; per node `label_en`, `reached_at`, `note_bn`, `note_en` — latest applicant-visible note only, no author identities); `expenses[]` (`item_bn`, `item_en`, `kind`, `amount`); `expense_total` (server-computed, incl. reversals); `service_charge: 0` (constant, not a column). **No applicant/beneficiary name or phone, no details, no vouchers, no author identities** — and no `urgency`/`needed_by`, no request-level timestamps, no rejection/cancellation reasons, no `no_expense_declaration` flag, no update photos, no plain notes (AO-18–AO-21, open). For `rejected`/`cancelled`, `timeline` is `[]` (terminal-state notice rendered client-side from `status`); for `closed`, all 4 nodes are reached (completion banner rendered client-side from `status`). | request_no format `EXP-YYYY-####`; tracking_secret 32 hex chars | 400 bad format; 404 `expatriate_request_not_found` — **uniform** for unknown IDs and wrong secrets (no existence leak); 10 failures in 60 minutes → 60-minute lock | tracking (strict) | The Request ID is never a credential — the secret is. The old GET-by-ID tracking endpoint is deleted |
| X3 | `GET /api/v1/expatriate-requests` | Cookie or Token | `expatriate.requests.view` (helpers + Super Admin); members use X4 | `?status=&service=&search=&page=&per_page=` (page-based, admin) | 200: page list (id, service, for_whom, applicant, status, helper, created_at). Helpers see all requests; Super Admin sees all | status/service in enums | 403; 422 | general | Helpers see requester phones only for requests they may act on |
| X4 | `GET /api/v1/expatriate-requests/mine` | Cookie or Token | — (own only) | `?page=` | 200: page list of the caller's own requests. **Only the caller's own requests** — the prototype appended the seeded demo request to every member's list (Audit Findings §8 item 9); the API never does this | — | 401 | general | Own data only |
| X5 | `GET /api/v1/expatriate-requests/{id}` | Cookie or Token | `expatriate.requests.view` | Path id | 200: full request incl. status history (actor, timestamp, note), expense lines, helper assignment | — | 401; 403; 404 | general | Members may call this only for their own requests (else 404) |
| X6 | `POST /api/v1/expatriate-requests/{id}/assign` | Cookie | `expatriate.requests.assign` | Body: `helper_id` (or `self` for a helper claiming it) | 200: request assigned; notification to the helper; audit entry | helper exists and has the helper role | 403; 404; 409 (already assigned to another helper — reassign needs Super Admin) | general | Assignment is audited with actor + timestamp |
| X7 | `POST /api/v1/expatriate-requests/{id}/transition` | Cookie | `expatriate.requests.accept` (for `pending → accepted`) / `expatriate.requests.advance` (for all other transitions) | Body: `to_status`, `note` (required, ≥10 chars — the prototype filled a generic note, "সহায়ক আপডেট দিয়েছেন (ডেমো)"; real notes are written by the acting helper) | 200: request with new status + history entry | to_status is a valid transition from the current status (see §14.7 state machine); note required | 403; 404; 409 `invalid_transition` | general | Every transition records actor, timestamp, note |
| X8 | `POST /api/v1/expatriate-requests/{id}/expenses` | Cookie | `expatriate.expenses.create` | Body: `item_bn`, `amount` (BDT, decimal), `voucher?` (file) | 201: expense line added; request total recomputed server-side (never trust a client-computed total). Service charge is always 0 — there is no service-charge field in the system (Decision Sheet) | item_bn ≥2 chars; amount > 0, ≤ a per-line cap to be set at scaffold time; voucher passes §11 checks | 403; 404; 422; 409 (request is closed — expenses cannot be added after closure) | upload | Voucher images are private files (signed URLs only) |
| X9 | `POST /api/v1/expatriate-requests/{id}/cancel` | Cookie or Token | — (requester or Super Admin) | Body: `reason?` | 200: status `cancelled` | — | 401; 403; 404; 409 (already closed/completed) | general | Cancellation is a terminal state; it is audited |
| X10 | `GET /api/v1/expatriate-requests/{id}/expenses` | Cookie or Token | `expatriate.requests.view` (or own) | Path id | 200: expense lines + total + service charge 0 | — | 401; 403; 404 | general | Totals are computed server-side |
| X11 | `POST /api/v1/expatriate-requests/{id}/confirm-close` | Public | — (secret-authenticated) | Body: `tracking_secret` (the `{id}` in the URL is the Request ID; a secret that does not belong to that request is a uniform 404) | 200: status `closed` (from `completed`) | — | 400 bad format; 404 uniform (unknown ID or wrong secret); 409 (not completed) | tracking (strict) | Guest confirm-close — the applicant confirms receipt without an account; no notification channel is sent in Phase 1 (tracking IS the notification, §12) |
| X12 | `POST /api/v1/expatriate-requests/{id}/cancel` | Public | — (secret-authenticated) | Body: `tracking_secret`, `reason?` (the `{id}` in the URL is the Request ID) | 200: status `cancelled` | — | 400 bad format; 404 uniform; 409 (already closed/completed) | tracking (strict) | Guest cancel — secret-authenticated; audited |

**State machine (enforced server-side, tested in Doc 10):**

```
pending ──► accepted ──► in_progress ──► completed ──► closed
   │            │              │               │
   └────► rejected            └────► cancelled (from pending/accepted/in_progress)
   └────► cancelled
```

- `rejected` is terminal and only from `pending` (by Super Admin or an assigned helper, with a reason).
- `cancelled` is terminal and reachable from `pending`, `accepted`, `in_progress`.
- `completed → closed` is the confirmation step (the applicant or Super Admin confirms receipt/completion).
- Any other transition returns `409 invalid_transition`. No transition is ever performed by a raw status write; only X7, X9, X11 and X12 change status.

**Open question D11 (unresolved, per Decision Sheet):** the expatriate wizard is 3 steps in the built prototype but the Direction D design system §7.1 describes 4 steps. The API is step-agnostic (it accepts one complete submission), so D11 does not change these endpoints — but the frontend step count must be confirmed before the web client is built against this API, and the confirmation must be recorded in the changelog.

### 14.8 Blood (M6)

| # | Method & URL | Auth | Permissions | Params / body | Response | Validation | Error cases | Rate limit | Privacy |
|---|---|---|---|---|---|---|---|---|---|
| B1 | `GET /api/v1/donors` | Public | — | `?search=&blood_group=&area=&available=&cursor=` | 200: cursor list (name, blood group, area, last donation, availability). **Phones are never included** — the prototype shows masked phones (`01••• •••421`, Audit Findings §5.2); the API returns no phone digits at all in a list | blood_group in the 8 groups; available boolean | 422 | public-read | The list is public by design; availability/last-donation are shown because donors consented to listing |
| B2 | `POST /api/v1/blood-requests` | Public | — | Body: `blood_group`, `units` (1–4+), `hospital`, `contact_phone`, `contact_name?` | 201: blood request created, status `submitted`; matching available donors are notified (server-side) | blood_group in enum; units 1–4; hospital ≥3 chars; contact_phone valid | 422; 429 | public-submit | The requester's contact is visible only to Super Admin and to donors who are asked for consent |
| B3 | `GET /api/v1/blood-requests/{id}` | Cookie or Token | `blood.requests.view` (Super Admin / helper) or the requester | Path id | 200: request + status + consent outcomes (counts, not donor phones) | — | 401; 403; 404 | general | — |
| B4 | `POST /api/v1/blood-requests/{id}/ask-consent` | Cookie or Token | `blood.requests.view` or the requester | Body: `donor_id` | 200: consent request sent to that donor (notification); **does not reveal the number** | donor exists and is available | 403; 404; 409 (consent already requested/pending) | general | This replaces the prototype's flaw: consent was granted by the *requester's own click* (Audit Findings §6). Consent is a donor-side action only |
| B5 | `POST /api/v1/blood-requests/{id}/consent` | Cookie or Token | — (the donor, on their own record) | Body: `donor_id`, `granted` (boolean) | 200: consent recorded with timestamp; if granted, the requester is notified that the number is available. **Revocation is a status change on the same row** (`status = revoked`), not a new record | granted is boolean | 401; 403 (not the donor); 404; 409 (already decided — use B6 to change) | general | Consent records are permanent history; revocation is a status change, not a deletion |
| B6 | `GET /api/v1/blood-requests/{id}/donor-contact` | Cookie or Token | `donors.view_contact` | Path id + `?donor_id=` | 200: the donor's phone number — **only if that donor granted consent for this request**; otherwise 403. Every successful reveal is audit-logged | donor_id required | 401; 403 `consent_not_granted`; 404 | strict | The most sensitive read in the system; rate-limited at 10/min/user (§9) and logged (see Doc 08) |
| B7 | `POST /api/v1/blood-requests/{id}/close` | Cookie | `blood.requests.view` | Body: `outcome` (fulfilled/cancelled), `note?` | 200: request closed | outcome in enum | 403; 404; 409 (already closed) | general | — |
| B8 | `POST /api/v1/donors` | Cookie | `donors.create` | Body: name, blood_group, area, phone, last_donation? | 201: donor created (phone encrypted; see Doc 08) | Required fields; blood_group in enum; phone valid + unique | 403; 422; 409 duplicate | general | Donor registration requires the donor's consent to be listed |
| B9 | `PUT /api/v1/donors/{id}` | Cookie or Token | `donors.update` (Super Admin, or the donor on their own record) | Body: as B8 (no `available` field — availability is computed from `last_donation_date`, doc 06 §6.5) | 200 | As B8 | 403; 404; 422 | general | — |

### 14.9 Finance (M8)

Money rules (per Decision Sheet and Engineering Plan v1.1): BDT, `decimal(12,2)`, never float. Ledger entries are **immutable** — corrections are made only by reversal entries, never by editing or deleting a published entry.

| # | Method & URL | Auth | Permissions | Params / body | Response | Validation | Error cases | Rate limit | Privacy |
|---|---|---|---|---|---|---|---|---|---|
| F1 | `GET /api/v1/finance/ledger` | Public | — | `?year=&kind=&cursor=` (kind: income/expense/donation) | 200: cursor list of **published** entries (year, item, kind, amount) + totals computed server-side. The prototype's finance rows had no dates, payees, or receipts (Audit Findings §5.4) — the API stores them; the public view shows the published summary fields only | year/kind valid | 422 | public-read | Only published entries are public |
| F2 | `GET /api/v1/finance/reports` | Public | — | `?year=` | 200: published annual reports (year, title, file URL, audited flag). The prototype generated a `.txt` in the browser and noted "ডেমোতে PDF তৈরি হয় না" — real reports are real files, versioned by year (Audit Findings §6) | — | 422 | public-read | — |
| F3 | `POST /api/v1/finance/entries` | Cookie | `finance.create` | Body: `entry_date`, `item_bn`, kind, category, amount, `payee_bn?`, `voucher?` | 201: entry created, status `draft` | Required fields; amount ≠ 0; entry_date valid | 403; 422 | upload | Drafts are not public |
| F3a | `PUT /api/v1/finance/entries/{id}` | Cookie | `finance.create` | Body: any of `entry_date`, `kind`, `category_id`, `project_id`, `activity_id`, `item_bn`, `item_en`, `amount`, `payee_bn`, `note_bn`, `voucher?`, `donor_name_bn`, `donor_name_consented` | 200: draft entry updated. Only while `status='draft'`; `id`, `entry_no`, `entered_by` can never change | amount ≠ 0; entry must be `draft` | 403; 404; 409 (not a draft) | general | The correction path for a rejected draft (F6a). A rejected entry stays `draft`, is corrected here, and is resubmitted via F4. |
| F3b | `POST /api/v1/finance/entries/{id}/discard` | Cookie | `finance.create` | Body: `reason` (required, ≥10 chars) | 200: entry `discarded` (`discarded_by`/`discarded_at`/`discard_reason` recorded). **Discard is a status change, not a delete** — the row and its `entry_no` are retained forever and the number is never reused | reason ≥10 chars; entry must be `draft` | 403; 404; 409 (not a draft) | general | Only drafts can be discarded. A discarded row is immutable thereafter. |
| F4 | `POST /api/v1/finance/entries/{id}/approve` | Cookie | `finance.approve` | — | 200: entry approved AND published in one step (status `published`; `approved_by`/`approved_at`/`published_at` set) — **approve IS publish; there is no separate `approved` state** | — | 403; 404; 409 (already published) | general | Dual control is **mandatory**: the approver must differ from the enterer (enforced by the service and by `CHECK (approved_by <> entered_by)`, doc 06 §7.1). Decided Phase 0.1 (B §3.7) |
| F6 | `POST /api/v1/finance/entries/{id}/reverse` | Cookie | `finance.reverse` | Body: `reason_bn` (required), `reason_en?`, `reversal_date?` (defaults to today) | 201: reversal entry created in status `draft` + `ledger_reversals` link row created (`approved_by` null). **The original is NOT changed by this call — it stays `published` until the reversal entry is approved via F4**, at which point (same transaction) the reversal entry becomes `published`, the link row's `approved_by` is filled, and the original becomes `reversed`. The original is never edited or deleted except for that single status flip | reason_bn ≥10 chars; original must be `published` | 403; 404; 409 (already reversed; target is itself a reversal entry) | general | Reversal is the only correction path. The reversal creator MAY be the original entry's enterer (Doc 04 §6.1); the approver (F4) must differ from the reversal creator. One reversal per original, ever. |
| F6a | `POST /api/v1/finance/entries/{id}/reject` | Cookie | `finance.approve` | Body: `reason` (required, ≥10 chars) | 200: entry rejected, stays `draft` (`rejected_by`/`rejected_at`/`rejection_reason` recorded) | reason ≥10 chars | 403; 404; 409 (already published) | general | Rejection is audited; a rejected entry can be corrected and resubmitted |
| F7 | `GET /api/v1/finance/summary` | Cookie | `finance.view` | `?year=` | 200: totals by kind/category, balance, per-project totals | — | 403; 422 | general | Admin-only summary (unpublished figures included) |
| F8 | `POST /api/v1/finance/reports` | Cookie | `finance.reports.publish` | multipart: year, title, file (PDF), `audited` (boolean) | 201 | File is a PDF and passes §11 checks | 403; 422 | upload | — |
| F9 | `GET /api/v1/finance/projects` | Public | — | — | 200: project accounts (name, budget, spent, status) — **proposed — confirm in Sprint 1**: project accounts exist only in the editorial alternative, not in Direction D (Audit Findings §3 #28) | — | 422 | public-read | Only published project figures |
| F10 | `GET /api/v1/finance/projects/{id}` | Public | — | Path id | 200: single project account (name, budget, spent, status) — **proposed — confirm in Sprint 1** (same scope as F9) | — | 404 | public-read | Only published project figures |

### 14.10 Notifications (M9) and devices

| # | Method & URL | Auth | Permissions | Params / body | Response | Validation | Error cases | Rate limit | Privacy |
|---|---|---|---|---|---|---|---|---|---|
| T1 | `GET /api/v1/notifications` | Cookie or Token | — (own only) | `?read=&page=` | 200: page list of the caller's notifications (title, body, type, read, created_at) + unread count in `meta` | — | 401 | general | Own only |
| T2 | `POST /api/v1/notifications/{id}/read` | Cookie or Token | — (own only) | Path id | 200 | — | 401; 404 | general | — |
| T3 | `POST /api/v1/notifications/read-all` | Cookie or Token | — (own only) | — | 200: count marked read | — | 401 | general | — |
| T4 | `DELETE /api/v1/notifications/{id}` | Cookie or Token | — (own only) | Path id | 204 | — | 401; 404 | general | Hard delete of the user's own inbox row (decided Phase 0.1, C-20) |
| T5 | `POST /api/v1/devices` | Cookie or Token | — | Body: `platform` (android/ios), `token`, `app_version?`, `device_name?` | 201: device registered (or updated if the token exists) | platform in enum; token required | 401; 422 | general | Tokens are per user; a token is never returned in a list |
| T6 | `DELETE /api/v1/devices/{id}` | Cookie or Token | — (own only) | Path id | 204 | — | 401; 404 | general | — |
| T7 | `POST /api/v1/devices/web-push` | Cookie or Token | — | Body: `endpoint`, `keys` (p256dh, auth) | 201: push subscription stored | endpoint valid URL; keys present | 401; 422 | general | VAPID keys are server-side only |
| T8 | `DELETE /api/v1/devices/web-push` | Cookie or Token | — | Body: `endpoint` | 204 | — | 401; 404 | general | — |

### 14.11 Member (M1)

| # | Method & URL | Auth | Permissions | Params / body | Response | Validation | Error cases | Rate limit | Privacy |
|---|---|---|---|---|---|---|---|---|---|
| M1 | `GET /api/v1/members/me` | Cookie or Token | — (own only) | — | 200: own profile (name, phone, area, country, family info, type, member ID, status, joined date). The prototype pre-filled country/family from nowhere (Audit Findings §8 item 8) — the API stores them or returns them empty, never invents them | — | 401 | general | Own only |
| M2 | `PUT /api/v1/members/me` | Cookie or Token | — (own only) | Body: name, phone, area, country, family info | 200: updated profile. **Server-side validation applies** — the prototype's profile form had none (Audit Findings §7.1) | name ≥2; phone valid + unique (excluding self); area ≥2 | 401; 422; 409 duplicate phone | general | Changing a phone number requires re-verification by a Super Admin — **decided as the default (Phase 0.1)**; the policy decision is AO-17 |
| M3 | `GET /api/v1/members/me/dashboard` | Cookie or Token | — (own only) | — | 200: dashboard summary (own request counts by status, recent activity, unread notifications). Helpers additionally receive the request queue summary — the same endpoint, with the response shaped by role | — | 401 | general | Role-shaped response; a member never receives the helper queue |
| M4 | `GET /api/v1/members/me/family` | Cookie or Token | — (own only) | — | 200: the caller's family links (doc 06 §3.8) | — | 401 | general | Own only |
| M5 | `POST /api/v1/members/me/family` | Cookie or Token | — (own only) | Body: `related_person_id`, `relationship`, `relationship_bn?` | 201: family link created | relationship in enum | 401; 422; 409 duplicate | general | Own only |
| M6 | `DELETE /api/v1/members/me/family/{id}` | Cookie or Token | — (own only) | Path id | 204 | — | 401; 404 | general | Own only |
| M7 | `POST /api/v1/members/me/data-requests` | Cookie or Token | — (own only) | Body: `type` (access/correction/deletion/export), `details_bn?` | 201: data-rights request created (status `new`, doc 06 §8.5) | type in enum | 401; 422 | general | Own data only |

### 14.12 Admin (M10)

| # | Method & URL | Auth | Permissions | Params / body | Response | Validation | Error cases | Rate limit | Privacy |
|---|---|---|---|---|---|---|---|---|---|
| AD1 | `GET /api/v1/admin/members` | Cookie | `members.view` | `?search=&status=&type=&page=` | 200: page list of members (incl. pending applications) | — | 403; 422 | general | Super Admin only in Phase 1 |
| AD2 | `POST /api/v1/admin/members/{id}/approve` | Cookie | `members.approve` | — | 200: member approved, member ID issued, login enabled; notification to the member | — | 403; 404; 409 (already approved) | general | Approval is audited |
| AD3 | `POST /api/v1/admin/members/{id}/reject` | Cookie | `members.approve` | Body: `reason` (required) | 200: application rejected | reason ≥10 chars | 403; 404; 409 | general | — |
| AD4 | `POST /api/v1/admin/users` | Cookie | `members.create` + `users.manage_roles` (jointly) | Body: name, phone, password, role (super-admin or expatriate-helper only in Phase 1), area? | 201: user created (Super Admin creates users — per Phase 1 scope; no UI for this exists in the prototype, Audit Findings §3.1) | Required fields; role in the Phase 1 set | 403; 422; 409 duplicate phone | general | Only the two Phase 1 roles may be assigned |
| AD5 | `PUT /api/v1/admin/users/{id}` | Cookie | `members.create` + `users.manage_roles` (jointly) | Body: name, phone, area, role, active? | 200 | As AD4 | 403; 404; 422 | general | A Super Admin cannot remove their own Super Admin role — **decided (Phase 0.1): mandatory** (no self-removal at all, Doc 04 §3.2) |
| AD6 | `GET /api/v1/admin/audit-logs` | Cookie | `audit_logs.view` | `?actor=&action=&from=&to=&page=` | 200: page list of audit entries (actor, action, target, timestamp, IP, outcome) | Date range valid | 403; 422 | general | Audit logs are append-only; no delete endpoint exists |
| AD7 | `GET /api/v1/admin/reports/summary` | Cookie | `dashboard.view_admin` | `?from=&to=` | 200: cross-module summary (requests by status/service, donors by group, finance totals, membership counts) — statistics computed from data, never hand-typed (per Engineering Plan v1.1) | Date range valid | 403; 422 | general | Aggregates only |
| AD8 | `POST /api/v1/admin/contact-messages/{id}/reply` | Cookie | `contact_messages.reply` | Body: `reply` (≥10 chars) | 200: reply recorded; message status `replied` | reply ≥10 chars | 403; 404; 422 | general | Replies are sent out of band in Phase 1 (no email provider confirmed); the reply text is stored as the record |
| AD9 | `GET /api/v1/admin/contact-messages` | Cookie | `contact_messages.view` | `?status=&page=` | 200: page list of contact messages | — | 403; 422 | general | Admin-only inbox |
| AD10 | `GET /api/v1/admin/settings` | Cookie | `settings.manage` | — | 200: site settings (all fields incl. non-public) | — | 403 | general | — |
| AD11 | `PUT /api/v1/admin/settings` | Cookie | `settings.manage` | Body: settings fields | 200 | Per-field validation | 403; 422 | general | Changing public policy copy (e.g. ERT size, 999 disclaimer) is audited |


| AD12 | `GET /api/v1/admin/data-requests` | Cookie | `data_rights.manage` | `?status=&type=&page=` | 200: page list of data-rights requests | — | 403; 422 | general | Admin-only |
| AD13 | `POST /api/v1/admin/data-requests/{id}/handle` | Cookie | `data_rights.manage` | Body: `status` (in_review/completed/rejected), `resolution_note?` | 200: request handled; if a deletion request is completed, the person's records are anonymised (doc 06 §11.5) | status in enum | 403; 404; 422 | general | Handling is audited |

### 14.13 Service catalogue (M5)

| # | Method & URL | Auth | Permissions | Params / body | Response | Validation | Error cases | Rate limit | Privacy |
|---|---|---|---|---|---|---|---|---|---|
| S1 | `GET /api/v1/public/services` | Public | — | — | 200: active service catalogue (key, name bn/en, description) | — | 500 | public-read | — |
| S2 | `GET /api/v1/admin/service-types` | Cookie | `service_types.manage` | — | 200: full catalogue incl. inactive | — | 403 | general | — |
| S3 | `POST /api/v1/admin/service-types` | Cookie | `service_types.manage` | Body: key, name_bn, name_en?, description_bn? | 201 | key unique; required fields | 403; 422; 409 duplicate key | general | — |
| S4 | `PUT /api/v1/admin/service-types/{id}` | Cookie | `service_types.manage` | Body: as S3 (key immutable) | 200 | As S3 | 403; 404; 422 | general | Renaming does not rewrite submitted requests (snapshots, doc 06 §6.1) |
| S5 | `DELETE /api/v1/admin/service-types/{id}` | Cookie | `service_types.manage` | — | 204 (soft delete; a service in use cannot be deleted — deactivate instead) | — | 403; 404; 409 (in use) | general | — |

## 15. What this inventory deliberately does not include

- **No payment/donation gateway endpoints.** Online payment is excluded from Phase 1 (Decision Sheet). No endpoint accepts a payment, a card, or a donation transaction.
- **No NID verification endpoints.** Excluded from Phase 1.
- **No live-chat or video-call endpoints.** Excluded from Phase 1.
- **No e-commerce or online-course endpoints.** Excluded from Phase 1.
- **No voting endpoints.** The membership copy mentions voting rights ("ভোটাধিকারসহ সব সুবিধা", Audit Findings §9 item 13) but no voting feature exists in the prototype; voting is not specified here and must be defined as a separate requirement if the organisation wants it.
- **No third-party OAuth endpoints.** Sanctum is first-party only; Passport/OAuth2 is out of scope unless third-party developers ever need delegated access (Research Notes §3, ADR-004).

## 16. Traceability

| Prototype / plan item | API coverage in this document |
|---|---|
| 37 audited features (Audit Findings §3) | §14: every feature maps to at least one endpoint; absent features (#6 infrastructure, #25 video, #28 project accounts, #32 Super Admin dashboard) are covered by C6–C8, G4–G5, F9–F10, and §14.12 respectively, with proposed flags where unconfirmed |
| 8 prototype forms (Audit Findings §2.4) | X1, B2, A5, A1, P6, M2, T7, plus the admin forms in §14.12 |
| Validation rules (Audit Findings §7.1) | §7 — re-validated server-side, with stronger production rules |
| ~70 endpoints (Engineering Plan v1.1 estimate) | §14 — 134 endpoints listed (108 at Phase 0 + 25 added in Phase 0.1 + 2 added in Phase 0.1.1 − 1 deleted in Phase 0.1; Doc 15 §6/§21); the excess over the estimate is explained in §14 (full per-module inventory incl. admin, devices, workflow steps). 7 endpoints wholly proposed, 0 with behaviour-level proposals outstanding |
| Rate limits (Engineering Plan v1.1) | §9 |
| Sanctum / Spatie / Filament (Research Notes §§3–5) | §8, ADR-004, ADR-005, ADR-011 |
| Performance budgets (Engineering Plan v1.1) | Doc 10 (testing) — API p95 ≤300ms target |

## 17. Open decisions (for Sprint 1)

1. Public tracking privacy boundary — **Decided (Phase 0.1) as a mechanism:** secret-authenticated tracking, Tier-S allowlist view (§8.3, X2). Open: AO-03 (tracking-secret validity after a terminal status, recommended 90 days) and AO-04 (Tier-S view: first name / beneficiary name?) — plus AO-18–AO-21 (B-only Tier-S fields held out of the allowlist). See Doc 13 Q-02 / Doc 15 AO register.
2. Token expiry value for mobile tokens — **Decided (Phase 0.1): 30 days** (§8.2).
3. Whether editing a published directory entry reverts it to review — **Decided (Phase 0.1):** the edit sets `visibility=private` until re-approved (C4).
4. Dual control (separate approver) on finance entries — **Decided (Phase 0.1): mandatory**, approve IS publish (F4, F6a).
5. Phone-number change re-verification — **Decided as the default (Phase 0.1):** Super Admin re-verification required (M2); the policy decision is AO-17.
6. Self-lockout guard for Super Admins — **Decided (Phase 0.1): mandatory** — no Super Admin may remove their own Super Admin role (AD5, Doc 04 §3.2).
7. Video gallery scope (G4–G5) and project accounts scope (F9–F10).
8. Infrastructure data model and whether a map is wanted (C6–C8).
9. The D11 wizard step-count mismatch (3 built vs 4 specified) — frontend confirmation, recorded in the changelog. ("D11" here is the open-question ID, not the AD11 endpoint.)
10. Whether Swagger UI is exposed on production at all (§10).
11. All other owner decisions: the AO register in Doc 15 §11 (AO-01–AO-21 + the D decision register + C/D open items, deduplicated).
