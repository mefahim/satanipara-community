# 10 — Testing & Quality Strategy

| | |
|---|---|
| Document | Satanipara Community — Phase 0 Backend Blueprint, Doc 10 |
| Status | **Planned** — planning only; no backend code or tests exist yet |
| Sources | Decision Sheet (single source of truth); Audit Findings (37 features, validation rules, gaps); Research Notes (verified 2026-11-14); Engineering Plan v1.1 |
| Companion docs | Doc 07 (API Architecture), Doc 08 (Security Architecture), Doc 11 (Deployment & Operations), Doc 12 (Development Roadmap) |

> **Status discipline.** There is no test suite yet. The prototype was verified by live probing (41 checks in the Direction D functional test report, Audit Findings §1.1), not by automated tests. Everything in this document is a requirement for later phases. A test that has not been run has not passed.

## 1. Engineering standards

### 1.1 Code style and conventions

- **PSR-12** code style for all PHP, enforced by **Pint v1** (`laravel/pint`). Pint runs in CI and in a pre-commit hook; a pull request that fails Pint does not merge.
- **Laravel conventions** throughout: Eloquent models, Form Requests for validation, policies for authorisation, API Resources for response shaping, service classes for business logic (see §1.2), events/listeners for side effects (notifications), jobs for queued work. Controllers stay thin: they validate, authorise, call a service, and return a resource.
- **Naming:** models singular (`ExpatriateRequest`), tables plural snake_case, API routes kebab-case plural resources (`/expatriate-requests`), permissions `resource.action` (per Decision Sheet), statuses snake_case (`in_progress`), Request IDs `EXP-YYYY-####`. Bengali content fields are suffixed `_bn` / `_en` where bilingual.
- **No dead code, no commented-out code, no TODO without a tracking reference.** A TODO must name the phase or decision that resolves it.
- **Static analysis:** **Larastan 3.x** (verify the exact version at scaffold time — Research Notes §8). The target level is set at scaffold time and raised over time; the level must never be lowered to make a failing build pass without a recorded reason.
- **Documentation in code:** every public method on a service class carries a short docblock stating what it does and what it throws. Complex business rules (the expatriate state machine, the finance reversal rule, the donor consent rule) are documented at the code that enforces them, with a reference to the blueprint section.

### 1.2 Service-layer discipline

- Business logic lives in service classes (one per aggregate: `ExpatriateRequestService`, `FinanceService`, `DonorConsentService`, …), not in controllers and not in models. A controller that contains a state-transition rule or a money calculation is a defect.
- Services are the unit that unit tests target (§3). Services receive their dependencies by constructor injection and are testable without HTTP.
- Cross-aggregate operations (e.g. "approve a member and send a notification") are performed in a database transaction; a failure anywhere rolls back everything.
- Money is computed in the service layer using decimal arithmetic, never in the controller and never in JavaScript on the client. The client displays totals the server computed.

### 1.3 What "done" means for a piece of work

A feature is done only when: the code is written to the standards above, the tests in §3–§7 that apply to it pass, the API documentation (Doc 07 §10) includes it, the audit log records its sensitive actions (Doc 08 §9), and the acceptance criteria in Doc 12 for its phase are met. A feature that "works on my machine" but has no test is not done.

## 2. Test stack

| Tool | Version / constraint | Role |
|---|---|---|
| Pest | **4** (`pestphp/pest ^4.0`) per the Laravel 13 upgrade guide | Default test framework (built on PHPUnit). Pest 5 exists and requires PHP ^8.4 — it is an explicit opt-in only, to be verified at scaffold time; it is **not** the Laravel 13 default (Research Notes §8) |
| PHPUnit | **12** (`phpunit/phpunit ^12.0`) | Underlies Pest; used directly where a PHPUnit-style test is clearer |
| Laravel test helpers | As shipped with Laravel 13 | HTTP tests, database tests (RefreshDatabase), queue fakes, notification fakes, storage fakes |
| Playwright | Current stable at build time | End-to-end browser tests (§6) |
| Pint v1 | `laravel/pint` | Style (CI gate) |
| Larastan 3.x | Verify at scaffold | Static analysis (CI gate) |
| GitHub Actions | — | CI/CD (see §8) |

- **Test database:** a dedicated test database (MySQL 8.4, matching production) for feature/API tests; SQLite in-memory is acceptable for pure unit tests that do not touch the database, but any test that touches queries runs against MySQL 8.4 so that database-specific behaviour (JSON columns, FULLTEXT, generated columns, CHECK constraints, non-transactional DDL) is genuinely tested.
- **Factories and seeders:** every model has a factory; the test suite never depends on the prototype's demo data. Demo data (the 10 directory entries, 6 donors, 6 activities, finance rows — Audit Findings §5) is **never** seeded into a test database as if it were real; test data is generated by factories with clearly fake values.
- **No tests against production.** Tests run in CI and locally against disposable databases. Staging is for UAT (§7), not for the automated suite.

## 3. Testing pyramid

```
        /        \
       /   E2E    \        Playwright — few, high-value journeys (§6)
      /------------\
     /  API contract \    Contract + authorisation — every endpoint (§4, §5)
    /----------------\
   /  Feature tests   \  HTTP + workflow + state machine (§4)
  /--------------------\
 /   Unit tests         \  Services, rules, calculations (§3)
--------------------------
```

- **Unit tests (base, most numerous):** services, validation rules, money calculations, ID generation (uniqueness under concurrency), state-machine transition tables, phone normalisation and hashing, expense-total computation, permission definitions.
- **Feature tests:** HTTP-level tests of each endpoint — happy path, validation failures, and authorisation failures. A feature test uses the real database and the real middleware stack (auth, rate limiting where it does not make the test flaky — rate limits are tested separately).
- **API contract tests:** every response is validated against the published OpenAPI schema (Doc 07 §10). A field that appears in a response but not in the schema fails the build; a field in the schema but missing from the response fails the build.
- **Auth tests:** login success/failure, token issue/revoke/expiry, logout-all, session regeneration, password change and admin reset, lockout behaviour.
- **Authorisation tests:** the matrix in §5, run for every endpoint.
- **Database integrity tests:** foreign keys, unique constraints (phone hash, Request ID), decimal precision (no float rounding — store 0.1 + 0.2 style cases in BDT and assert exact totals), soft-delete behaviour, audit-log append-only behaviour.
- **Workflow / state-machine tests:** every valid transition **and** every invalid transition for the expatriate request lifecycle, the finance publish/reverse lifecycle, the donor consent lifecycle, and the member approval lifecycle (§4).
- **File-upload tests:** each allowed type accepted, each rejected type rejected, oversized file rejected, MIME-spoof rejected, scan-failure rejected, private file unreachable without a signed URL, signed URL expiry enforced (§7 of Doc 08, §11 of Doc 07).
- **Security tests:** injection payloads, XSS payloads, IDOR attempts, mass-assignment attempts, brute-force simulation, CSRF checks (§7).
- **Regression tests:** every bug fixed gets a test that fails before the fix and passes after it. The prototype's D3 bug (submitting an empty draft created a corrupt request — Audit Findings §8 item 11) is the model case: the regression test submits an empty draft and asserts no request is created and a 422 is returned.
- **Performance tests:** the budgets in §8 of this document, measured in CI on a staging-like dataset (see §8 below).

### Coverage target

**80%+ of business logic** (per Engineering Plan v1.1). Coverage is measured on services, policies, Form Requests, and domain rules — not on generated code, migrations, or Blade views. Coverage is a floor, not a goal: the authorisation matrix and the state-machine tables must be at 100% regardless of the overall percentage. A coverage report that is high because it counts trivial getters while an invalid transition is untested is a failure of this strategy, not a pass.

## 4. Feature and workflow test requirements

### 4.1 Expatriate request lifecycle (the highest-value workflow)

Test, end to end at the API level:

1. Public submission with valid data → 201, unique ID in `EXP-YYYY-####` format, status `pending`, server timestamp (not a hardcoded date — Audit Findings §6), service charge absent/zero.
2. Submission with each prototype validation failure (name 1 char, details 9 chars, phone 9 digits, consent unchecked, invalid service, invalid urgency) → 422 with the correct field error.
3. Submission with an empty body → 422 and **no request created** (D3 regression).
4. Two concurrent submissions → two distinct IDs (uniqueness under concurrency; the prototype's random IDs could collide — Audit Findings §8 item 10).
5. Public tracking with a valid ID → 200 with the limited view; with an unknown ID → 404 with the not-found code; with a malformed ID → 400.
6. Helper claims an unassigned request → assigned; another helper attempts to advance it → 403.
7. Every **valid** transition in the state machine (Doc 07 §14.7) succeeds and records actor + timestamp + note.
8. Every **invalid** transition (e.g. `pending → completed`, `closed → accepted`, `rejected → in_progress`, any transition on a `closed` request) → 409 `invalid_transition` and no state change.
9. Transition without a note → 422; transition with a 9-character note → 422.
10. Expense added → total recomputed server-side; expense on a closed request → 409; expense with amount ≤ 0 → 422; expense with a receipt → file stored privately, reachable only by signed URL.
11. New request creates a notification for the Super Admin and for every Helper (assert the database notification rows exist); the helper queue lists it.
12. Cancellation by the requester and by the Super Admin; cancellation of a closed request → 409.

### 4.2 Member lifecycle

Registration → pending application → approval (member ID issued, login enabled) → login → profile view/edit → password change. Plus: duplicate phone → 409; approval of an already-approved member → 409; rejection without a reason → 422; a member reading another member's record → 404; a pending applicant logging in → 200 with the 'awaiting approval' screen and services locked (Recommended, pending Fahim's confirmation — REG-AUTH-01).

### 4.3 Blood and consent lifecycle

Donor search (public, no phones in the response) → blood request submission → matching donors notified → consent requested → donor grants consent (as the donor) → requester reveals the number (logged) → request closed. Plus: consent requested by the requester clicking a button → must fail (the prototype's flaw, Audit Findings §6 — consent is a donor-side action); reveal without consent → 403; reveal by a user who is not the requester → 403; consent revoked after grant → the number is no longer revealable and the revocation is recorded.

### 4.4 Finance lifecycle

Entry created (draft, not public) → approved → published (visible in the public ledger) → reversal with a reason (original marked `reversed`, reversal entry linked, totals correct). Plus: editing a published entry directly → not possible (no endpoint; assert 405/404); deleting a published entry → not possible; reversal without a reason → 422; reversal of an already-reversed entry → 409; totals computed from the ledger equal the sum of the entries (regression test using the prototype's own demo figures: 2026 total ৳320,000 from its five rows — Audit Findings §5.4 — as a fixture for the arithmetic, labelled demo).

### 4.5 Content lifecycle

Create (draft, not public) → publish (public) → unpublish → delete (soft). Plus: an unpublished item is absent from every public list; a job circular with `verified=false` is absent from the public list; an expired notice is absent from the public list; an activity without a category cannot be created (the prototype's category-filter gap, Audit Findings §8 item 7).

## 5. Authorisation test matrix

For **every** endpoint in Doc 07 §14, a test exists for each of these callers:

| Caller | Expected result (typical) |
|---|---|
| Anonymous (no credentials) | 401 on protected endpoints; 200 only on the endpoints documented as Public |
| Member (own resource) | 200 where the endpoint is theirs (own profile, own requests, own notifications) |
| Member (another member's resource) | 404 (not 403 — existence is not leaked, Doc 07 §8.4) |
| Member (admin resource) | 403 |
| Expatriate Helper (expatriate request) | 200 where the request is theirs or claimable |
| Expatriate Helper (any other module: members, finance, content, donors, settings, audit logs) | 403 — every time, on every endpoint |
| Super Admin | 200 on all admin endpoints |
| Super Admin (another Super Admin's own member data, where applicable) | 200 only where the policy allows it; the matrix records the expected result per endpoint rather than assuming |

The matrix is maintained as a table in the test suite (one row per endpoint × caller), and CI fails if an endpoint has no matrix row. A new endpoint without a matrix row does not merge.

## 6. End-to-end tests (Playwright)

E2E tests run against a staging-like build of the web client plus the API, with a disposable database. They cover the journeys a user actually takes — not every endpoint (that is the API suite's job). The required journeys:

1. **Login** — member login with valid credentials lands on the dashboard; wrong password shows the error and does not log in; logout returns to the public site.
2. **Expatriate request submit → helper notification** — submit a request as a public visitor; sign in as a helper; assert the notification exists and the request appears in the queue; advance the status with a note; assert the status history shows the helper's note.
3. **Tracking** — submit a request, copy its ID, track it as an anonymous visitor, assert the limited view shows the status and the expense total.
4. **Blood search** — search donors by blood group; assert no phone numbers are visible; submit a blood request; assert the confirmation.
5. **Finance report** — as a public visitor, view the published ledger and download a published annual report; as a Super Admin, create, approve, and publish an entry and assert it appears publicly.
6. **Registration → approval → login** — register, assert login succeeds while pending and returns the 'awaiting approval' screen with services locked, approve as Super Admin, assert login succeeds with full access.

E2E tests are run on every pull request against the review build and nightly against staging. They are not run against production.

## 7. Security test requirements

- **Injection:** SQL-injection payloads (`' OR 1=1 --`, union-based, time-based) against every text input and every filter/sort parameter; assert no error message leaks SQL and no unintended rows are returned.
- **XSS:** stored-XSS payloads in every text field (name, details, message, titles, captions); assert the payload is escaped on output in both the API response and any rendered page.
- **IDOR:** the authorisation matrix (§5) is itself the IDOR test; in addition, targeted tests attempt to read/update/delete resources by guessing sequential IDs as a low-privilege user.
- **Mass assignment:** requests containing `role`, `status`, `verified`, `published_at`, `phone_hash`, and computed totals; assert none of them take effect.
- **Uploads:** executable, HTML, SVG-with-script, MIME-spoofed, and oversized files; assert rejection; assert an uploaded file is never executable from its URL.
- **Brute force:** repeated failed logins from one IP trigger the lockout; assert the lockout and the identical error message.
- **CSRF:** a state-changing web request without a CSRF token is rejected; a token-based API request does not depend on CSRF.
- **Headers:** every response carries the security headers in Doc 08 §4.3; assert in a dedicated test.

## 8. Performance budgets (plan targets)

Per Engineering Plan v1.1. These are **targets to be measured against**, not guarantees, and not commitments to the client. They are tested with a realistic dataset (thousands of members, hundreds of requests, hundreds of ledger entries — not the prototype's 10 rows).

| Budget | Target | How it is measured |
|---|---|---|
| Homepage Largest Contentful Paint (mobile, 4G) | ≤ 2.5 s | Lighthouse / WebPageTest on staging |
| API p95 response time | ≤ 300 ms | Load test against staging (authenticated reads and writes) |
| Lighthouse (performance, accessibility, best practices, SEO) | 90+ each | Lighthouse CI on staging |
| Concurrent users | 500 | Load test: 500 concurrent simulated users on the public site + API |
| Uptime | 99.5% | Monitoring over a rolling 30-day window (Doc 11) — this is an operational target, not a test |

Performance tests run nightly against staging and before every production release. A release that regresses a budget beyond its threshold does not ship until the regression is explained or fixed.

## 9. CI/CD — quality gates

GitHub Actions pipeline (detail in Doc 11 §4). The quality gates on every pull request:

1. **Pint** — style must pass.
2. **Larastan** — static analysis at the configured level must pass.
3. **Unit + feature + API contract tests** — all must pass, on MySQL 8.4. CI runs the full suite against a real MySQL 8.4 service (not SQLite, not PostgreSQL); the migration suite runs twice with the second run a no-op (Phase 0.1, CK-24).
- **Concurrency + migration-discipline tests (Phase 0.1):** simultaneous-activation tests for the generated-column invariants (Doc 06 §§4.1–4.2), per-year sequence-counter allocation under concurrency (Doc 06 §7.1), and the finance immutability triggers (Doc 06 §7.1) run against MySQL 8.4 (CK-15/CK-16/CK-22).
4. **Authorisation matrix** — complete for every endpoint; no endpoint without a row.
5. **Coverage** — 80%+ of business logic; the state-machine and authorisation suites at 100% of their tables.
6. **Dependency audit** — no critical vulnerabilities; high vulnerabilities reported and triaged.
7. **Build verification** — the frontend (Next.js) builds; the Filament panel builds; no build warnings that indicate a broken import.
8. **OpenAPI check** — the generated specification matches the implemented routes; a route without a schema entry fails the build.

Staging auto-deploys from `main` after the gates pass. **Production deploys are manual approval only, with a pre-deploy backup** (Doc 11 §7).

## 10. UAT and sign-off

- **Per phase:** each phase in Doc 12 ends with a UAT window on staging.
- **Testers:** 2–3 client testers named by the organisation (names are not invented here; the organisation supplies them). Testers use a written checklist derived from the phase's acceptance criteria — they do not test from memory.
- **What UAT proves:** the feature works as the organisation understands it, in Bengali, on their own devices, with their own data where applicable. UAT findings are recorded as issues with a severity; a phase does not close with an open critical or high-severity UAT finding.
- **Sign-off:** written (a short message from the organisation is sufficient) per phase. Sign-off on one phase does not imply sign-off on the next.
- **What UAT is not:** it is not a substitute for the automated suite, and it is not a security review. A feature can pass UAT and still fail the security gates in §7 — in that case it does not ship.

## 11. Observability (requirements for later phases)

These are specified now so the code is written to support them; the tooling is stood up in Phase 9 (Doc 12).

- **Logs:** structured, in UTC, with `request_id` on every line; scrubbed of secrets and phone numbers (Doc 08 §9).
- **Error tracking:** Sentry-style error tracking (tool to be confirmed at build time — the requirement is that production exceptions are captured with context and alerted, not that a specific vendor is used).
- **Audit logs:** as Doc 08 §9.1 — queryable in the admin panel (Doc 09 §3.16).
- **Queue monitoring:** failed jobs visible and retryable; a failed job alerts (when Redis + Horizon are adopted, Horizon provides this; on the database driver, the `failed_jobs` table plus a scheduled check provides it — see Doc 11 §5).
- **Performance monitoring:** p95 latency, error rate, and slow-query logging; a weekly summary for the team.
- **Health checks:** a `/health` endpoint (or equivalent) reporting database, queue, cache, and storage status; the uptime monitor calls it every 5 minutes (Doc 11 §5).
- **Backup verification:** the monthly automated restore check (and quarterly full rehearsal) is itself an observability event — its result is recorded and reported (Doc 11 §7.3).

## 12. Quality risks carried from the prototype

These are the prototype's own gaps (Audit Findings §8–§9) that the test strategy must explicitly cover, because they are the failures most likely to recur:

1. **Empty-draft submission creating a corrupt record** (D3) — regression test required (§3).
2. **Random IDs colliding** — concurrency test required (§4.1 item 4).
3. **Category filter with no data behind it** — the API must store a category or drop the filter; tested in §4.5.
4. **Demo request visible to every member** — the "own only" rule is tested in the authorisation matrix (§5).
5. **Consent granted by the requester** — the donor-side consent flow is tested in §4.3.
6. **Profile form with no validation** — server-side validation tests for profile updates (§4.2).
7. **Finance totals computed in the browser** — server-side totals tested in §4.4.
8. **No Super Admin surface at all** — the admin endpoints and the Filament panel are tested as a first-class surface, not as an afterthought.
