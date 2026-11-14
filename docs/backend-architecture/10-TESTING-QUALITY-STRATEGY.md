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

- **Test database:** a dedicated test database (MariaDB 11.8.9, matching production) for feature/API tests; SQLite in-memory is acceptable for pure unit tests that do not touch the database, but any test that touches queries runs against MariaDB 11.8.9 so that database-specific behaviour (JSON-as-LONGTEXT columns, FULLTEXT without ngram, generated columns, CHECK constraints, non-transactional DDL) is genuinely tested. See 16-MARIADB-ADDENDUM.md.
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
- **Database integrity tests:** foreign keys, unique constraints (phone hash, Request ID, `endpoint_hash`, (`user_id`, `fcm_token_hash`)), decimal precision (no float rounding — store 0.1 + 0.2 style cases in BDT and assert exact totals), soft-delete behaviour, audit-log append-only behaviour. Concurrent re-registration tests: two simultaneous subscriptions of the same endpoint → one row (upsert); two simultaneous registrations of the same FCM token for one user → one row, 1062 on the loser; same token for two different users → two rows; `NULL`-token device rows → no uniqueness failure.
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

### 4.4.1 Ledger immutability tests (T-LED-01–T-LED-34)

DB tests run against real MySQL (never SQLite — SQLite does not enforce MySQL `CHECK`s, triggers, or privileges the same way), in a scratch database (proven pattern: `satanipara_test_b` on MySQL 8.0.46, Worker B `TEST-LOG.md`). APP tests are Laravel feature tests. MariaDB execution notes (2026-11-14, `tests/ledger-suite/TEST-RESULTS.md` §4): M-5 `SIGNAL SQLSTATE '45000'` behaves identically (1644); T5's `SELECT … INTO` with no row yields NULL + warning 1329 only, as designed. M-6 trigger-file ownership warning (ERROR 35) on a scratch instance is a datadir quirk, not a trigger defect — verify with `SHOW TRIGGERS`; it should not appear on Hostinger's MariaDB. M-7 MySQL 8.0.46 `mysqldump` cannot dump MariaDB (queries `information_schema.COLUMN_STATISTICS`) — all MariaDB work must use MariaDB binaries. Error codes on MariaDB 11.8.9: 1644 = trigger SIGNAL SQLSTATE 45000; **4025 = CHECK violation** (MySQL uses 3819 for the same thing — any code or test matching on 3819 will silently miss CHECK violations on MariaDB); 1062 = duplicate key; 1142 = privilege denied; 409/403/422 = API responses. Invalid ENUM values are caught by the named CHECK as 4025, not by ENUM truncation 1265 (M-3). MariaDB adds implicit `JSON_VALID` CHECKs on JSON columns — the drift check (T-LED-26) must match on the named CHECKs, not on an exact CHECK count (M-4). T-LED-13 (T5) was **EXECUTED 2026-11-14 on MariaDB 11.8.9** — all four branches proven, 43/43 suite PASS (`tests/ledger-suite/TEST-RESULTS.md`). T-LED-14 is replaced by the provisioned-database re-run — until it passes, no doc may claim production enforcement (UV-10; see 16-MARIADB-ADDENDUM.md).

| # | Test | Layer | Setup → action → expected outcome |
|---|---|---|---|
| T-LED-01 | Draft field edit succeeds; identity columns immutable | DB + APP | Draft entry → `PUT F3a` changing `amount`/`item_bn` → 200, new values stored. Direct `UPDATE … SET entry_no='LE-2099-9999'` / `entered_by=99` on a draft → trigger rejects (1644, 45000). |
| T-LED-02 | Draft → published (happy path, dual control) | APP + DB | Draft entered by user A → F4 by user B → 200, `status='published'`, `approved_by=B`, `approved_at`/`published_at` set, audit row written in the same transaction. |
| T-LED-03 | Draft → discarded; discard is not a delete | APP + DB | Draft → F3b with reason (≥10 chars) → 200, `status='discarded'`, `discarded_by`/`discarded_at`/`discard_reason` set, row still present, `entry_no` unchanged. F3b with reason <10 chars → 422. F3b on a published entry → 409. |
| T-LED-04 | Discarded row is immutable | DB | Direct `UPDATE` of amount and of `status` back to `draft` on a discarded row → 1644 (45000) both times; row unchanged. |
| T-LED-05 | Published row: direct update refused | DB | Published entry → direct `UPDATE amount`, `UPDATE payee_bn`, `UPDATE category_id`, `UPDATE approved_by` (each separately) → 1644 (45000) every time; row byte-identical afterwards (compare all columns). |
| T-LED-06 | Published row: direct delete refused, every user | DB | `DELETE` on a published row as the app user → 1142 (privilege); as root / migration user → 1644 (trigger). Row still present after both. |
| T-LED-07 | Concurrent double-publish: exactly one wins | APP (two sessions) | Two approvers call F4 on the same draft simultaneously → exactly one 200, the other 409; only one `approved_by`/`approved_at` set; exactly one publish audit row. (Design: `SELECT … FOR UPDATE` + guarded `UPDATE … WHERE status='draft'` + affected-row check.) |
| T-LED-08 | Self-approval refused at both layers | APP + DB | Enterer calls F4 on own draft → 403/409 with an error naming the dual-control rule; entry stays `draft`. Direct `UPDATE … SET status='published', approved_by=entered_by` bypassing the app → rejected (1644 trigger, and 4025 CHECK if the trigger is bypassed in the test harness). Repeat with a Super Admin as both enterer and approver — same refusal. |
| T-LED-09 | Reversal happy path (two steps) | APP + DB | Published entry (+1200) → F6 by user C (reason ≥10 chars) → 201, reversal entry exists in `draft`, link row exists with `approved_by NULL`, **original still `published`**. F4 on the reversal entry by user D (D ≠ C) → 200; reversal entry `published`; link row `approved_by=D`; original `reversed`; totals net to zero. |
| T-LED-10 | F6 does not flip the original | APP | After F6 (before F4), read the original → `status` is still `published` and its `updated_at` is unchanged. (Guards the C5 regression: F6 must not collapse create + approve.) |
| T-LED-11 | Second reversal refused at every layer | APP + DB | Reversed original → F6 again → 409. Direct second `INSERT` into `ledger_reversals` for the same `ledger_entry_id` → 1062 (`uk_one_reversal_per_original`). Direct `UPDATE original SET status='published'` → 1644. |
| T-LED-12 | T1 published-branch compares **every** column | DB | Published entry → attempt the flip `published → reversed` while also changing one other column (repeat for each: `amount`, `entry_date`, `kind`, `category_id`, `project_id`, `activity_id`, `item_bn`, `payee_bn`, `note_bn`, `voucher_media_id`, `approved_by`, `approved_at`) → 1644 every time. Flip with only `status` (+ `updated_at`) changed → succeeds. (Closes the known limitation of the tested trigger — Worker B FINDINGS.md §5 note.) |
| T-LED-13 | T5 BEFORE INSERT trigger on `ledger_reversals` | DB | Execute the T5 trigger definition; then attempt `INSERT` into `ledger_reversals` where (a) the original is a draft → rejected; (b) the original is already reversed → rejected; (c) the original is itself a reversal entry → rejected; (d) the original is published and unreversed → accepted. **EXECUTED 2026-11-14 on MariaDB 11.8.9 — all four branches proven, 43/43 suite PASS (`tests/ledger-suite/TEST-RESULTS.md` §2).** |
| T-LED-14 | Whole suite re-run against the provisioned database | DB | Re-run `tests/ledger-suite/` verbatim against the provisioned MariaDB 11.8.9 database once Fahim provisions it (same files, same runner); all cases must produce identical outcomes (CHECK violations 4025 on MariaDB). Until this passes, no doc may claim production enforcement (closes UV-10). The MySQL 8.4 re-run target is superseded — see 16-MARIADB-ADDENDUM.md. |
| T-LED-15 | Reversal of a reversal is impossible | APP + DB | Published reversal entry → F6 targeting it → 409 ("target is itself a reversal entry"). Direct `INSERT` into `ledger_reversals` with `ledger_entry_id` = a reversal entry's id → rejected (T5 / service check). Correcting the wrong reversal via a fresh ordinary entry (F3 + F4) → succeeds and changes no status. |
| T-LED-16 | Reversal link-row immutability | DB | After approval: direct `UPDATE` of `reason_bn` / `created_by` / `ledger_entry_id` / `reversal_entry_id` on the link row → 1644; direct `DELETE` of the link row → 1644; direct `UPDATE approved_by` a second time (already filled) → 1644. |
| T-LED-17 | Rejected draft can be corrected and resubmitted | APP | Draft → F6a reject by user B (reason ≥10 chars) → 200, stays `draft`, rejection fields set. F3a corrects the amount → 200. F4 by user B → 200, `published`. (Proves the C6 fix end to end.) |
| T-LED-18 | Draft edit by a non-enterer; discard by a non-enterer | APP | Draft entered by A → F3a edit by Super Admin B (holds `finance.create`) → 200, `entered_by` still A. F3b discard by B → 200, `discarded_by=B`. A Member/Helper calling F3a/F3b → 403. |
| T-LED-19 | App user DELETE refused | DB | Connect as `satanipara_app` (grants `SELECT, INSERT, UPDATE` on the ledger tables, no `DELETE`, no DDL) → `DELETE FROM ledger_entries` (draft and published) → 1142 (42000) `DELETE command denied` both times. |
| T-LED-20 | App user TRUNCATE refused | DB | As `satanipara_app` → `TRUNCATE TABLE ledger_entries` → 1142 (42000) `DROP command denied` (proves truncate is privilege-blocked, not trigger-blocked). |
| T-LED-21 | App user DDL refused | DB | As `satanipara_app` → `DROP TRIGGER trg_ledger_entries_bd`, `CREATE TRIGGER …`, `ALTER TABLE ledger_entries …` → 1142 every time. |
| T-LED-22 | App user legitimate flows succeed | DB | As `satanipara_app` → normal draft insert / draft update / guarded publish update → all succeed (proves the grants are sufficient for the legitimate flows, not just restrictive). |
| T-LED-23 | Privileged user DELETE stopped by trigger | DB | As `satanipara_migrate` (or root) → `DELETE FROM ledger_entries` → 1644 (45000) from the trigger — the trigger, not the privilege, is the backstop for privileged users. |
| T-LED-24 | Backup user read-only | DB | As `satanipara_backup` → `mysqldump` of the database succeeds; attempt `INSERT`/`UPDATE`/`DELETE` → 1142 every time. |
| T-LED-25 | Report user scope | DB | As `satanipara_report` (once provisioned) → `SELECT` on finance tables succeeds; `SELECT` on `users` phone columns / `activity_log` denied; any write denied. |
| T-LED-26 | Drift check | CI | Post-deploy smoke test asserts the four triggers (T1–T4) exist on `ledger_entries`/`ledger_reversals` and the named CHECKs exist; fails the deploy if any trigger or named CHECK is missing. |
| T-LED-27 | CHECK dual control | DB | `INSERT` with `approved_by = entered_by` → 4025 CHECK violation (`chk_ledger_dual_control`) on MariaDB (3819 on MySQL). |
| T-LED-28 | CHECK amount nonzero | DB | `INSERT` with `amount = 0` → 4025 (`chk_ledger_amount_nonzero`) on MariaDB (3819 on MySQL). |
| T-LED-29 | CHECK status enum | DB | `INSERT` with `status = 'approved'` (or any value outside the four) → 4025 (`chk_ledger_status`) on MariaDB (3819 on MySQL) — and the application enum rejects it first (422). |
| T-LED-30 | CHECK reversal dual control | DB | `INSERT` into `ledger_reversals` with `approved_by = created_by` → 4025 (`chk_reversal_dual_control`) on MariaDB (3819 on MySQL). |
| T-LED-31 | `entry_no` uniqueness + gap behaviour | DB | Two inserts with the same `entry_no` → 1062. Discard a draft → its `entry_no` is never re-issued (attempted re-insert → 1062). |
| T-LED-32 | Status strings contract | APP | Every `status` string returned by F1/F3/F3a/F3b/F4/F6/F6a exists in the Doc 06 enum (`draft`/`published`/`reversed`/`discarded`); no endpoint returns `approved` as a status. |
| T-LED-33 | Illegal transitions → 409 | APP | F4 on an already-published entry → 409; F4 on a reversed/discarded entry → 409; F6 on a draft/discarded/reversed entry → 409; F3a/F3b on a non-draft → 409. All illegal transitions return 409, never 200 and never 500. |
| T-LED-34 | Reason floor | APP | F6 with `reason` < 10 chars → 422; F6a with `reason` < 10 chars → 422; F3b with `reason` < 10 chars → 422. |

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
3. **Unit + feature + API contract tests** — all must pass, on MariaDB 11.8.9. CI runs the full suite against a real MariaDB 11.8.9 service (not SQLite, not PostgreSQL); the migration suite runs twice with the second run a no-op (Phase 0.1, CK-24 as amended by 16-MARIADB-ADDENDUM.md).
- **Concurrency + migration-discipline tests (Phase 0.1):** simultaneous-activation tests for the generated-column invariants (Doc 06 §§4.1–4.2), per-year sequence-counter allocation under concurrency (Doc 06 §7.1), and the finance immutability triggers (Doc 06 §7.1) run against MariaDB 11.8.9 (CK-15/CK-16/CK-22 as amended by 16-MARIADB-ADDENDUM.md).
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
