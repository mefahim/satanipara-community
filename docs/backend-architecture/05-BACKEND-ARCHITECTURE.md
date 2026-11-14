# 05 — Backend Architecture

| | |
|---|---|
| **Document** | Satanipara Community — Phase 0 Backend Blueprint, doc 05 |
| **Status** | Planned — not yet implemented. Nothing in this document describes live behaviour. |
| **Sources** | Decision Sheet (single source of truth, 2026-11-14); Audit Findings (repo audit, 2026-11-14, HEAD `6792f5e`); Research Notes (verified 2026-11-14); Engineering Plan v1.1 §§6–10, §14 |
| **Companion docs** | `04-USER-ROLES-PERMISSIONS.md` (RBAC); `06-DATABASE-DESIGN.md` (schema); `diagrams/ERD.md` (relationships) |

---

## 1. Purpose and architectural stance

This document defines the Laravel backend architecture for the Satanipara Community platform: the framework and language versions, the modular monolith structure, the layering rules, the API-first frontend separation, the authentication architecture, the state machines, and the supporting services (caching, queues, scheduler, media, notifications).

**Architectural stance, in one paragraph:** a single Laravel application — a **modular monolith** — exposing one versioned REST API (`/api/v1`) backed by one PostgreSQL database, with a Filament 5 admin panel served from the same application. The public website (Next.js) and the future mobile app (Flutter) are thin clients over that API; they hold no business logic and no data of their own. The Direction D prototype is a **design reference** for the frontend, not the production frontend and not a backend. The system is built for a small community on a single VPS, so every infrastructure choice starts with the simplest option that meets the requirement, and upgrades only when a stated trigger is met.

**What this document does not contain:** no Laravel code, no migrations, no dashboard UI or mockups, no redesign of Direction D, no prices, no invented dates, stats, or people. Version constraints use caret ranges (`^13.0`, `^4.0`, …) and no patch numbers, per the Decision Sheet.

---

## 2. Framework and language versions

### 2.1 Laravel 13 — the choice, and the divergence from Plan v1.1

| Item | Decision |
|---|---|
| Framework | **Laravel 13**, constraint `laravel/framework ^13.0`. |
| Released | 17 March 2026 (Research Notes §1, primary source: laravel.com/docs/13.x/releases). |
| Support | Bug fixes until Q3 2027; security fixes until 17 March 2028. Laravel's policy is 18 months of bug fixes and 2 years of security fixes per major; there is no LTS major. |
| PHP range | 8.3–8.5. |

**Divergence from Engineering Plan v1.1 — stated explicitly, as required by the Decision Sheet.** Plan v1.1 specifies Laravel 12. The blueprint recommends **Laravel 13 instead**, for one reason: Laravel 12's bug fixes ended **13 August 2026** and its security fixes end **24 February 2027** (Research Notes §1, primary source). A new project started on Laravel 12 in November 2026 would be security-only from day one, with roughly three months of security runway left. Starting on Laravel 13 gives a full support window (bug fixes to Q3 2027, security to 17 March 2028) and avoids a major-version upgrade in the project's first year. The upgrade effort from 12 to 13 is small (the upgrade guide estimates ~10 minutes for a typical app), but there is no reason to incur it at all when the project has not been scaffolded yet. **Do not start on Laravel 12.**

### 2.2 PHP version

| Item | Decision |
|---|---|
| Target | **PHP 8.4** (conservative) or **PHP 8.5** (longest runway). The choice is made at scaffold time, based on the hosting environment's available PHP and package maturity at that moment. |
| Floor | **PHP 8.3** — the minimum Laravel 13 supports. |
| Never | **PHP 8.2** — security support ends 31 December 2026 (Research Notes §2, primary source: php.net/supported-versions.php). Starting on 8.2 would be starting on an end-of-life branch. |
| Support windows | PHP 8.3: security to 31 Dec 2027. PHP 8.4: active support to 31 Dec 2026, security to 31 Dec 2028. PHP 8.5: active to 31 Dec 2027, security to 31 Dec 2029. |
| Not a target | PHP 8.6 — GA planned 19 Nov 2026 (Research Notes §2, secondary). Not a target until GA plus first patch releases, and Laravel 13's published PHP range (8.3–8.5) does not document 8.6 support. |

**Reasoning:** PHP 8.5 gives the longest security runway (to 31 December 2029) and is the current stable branch. PHP 8.4 is the conservative choice — security to 31 December 2028, with the widest host and package maturity at the time of writing. Either satisfies Laravel 13. Choosing 8.4 or higher also keeps the test-toolchain upgrade path open (Pest 5 requires PHP ^8.4 — Research Notes §8, secondary). The floor of 8.3 is acceptable only as a floor, never as a target, because 8.3 is already security-only with EOL on 31 December 2027.

### 2.3 Package versions (confirmed, per Research Notes)

| Package | Constraint | Notes |
|---|---|---|
| Laravel framework | `laravel/framework ^13.0` | See §2.1. |
| Laravel Sanctum | `laravel/sanctum ^4.0` | Auth — see §8. Latest patch unverified (secondary sources conflict between 4.2.0 and 4.3.x); resolve at install time. |
| Spatie Laravel Permission | `spatie/laravel-permission ^8.0` | RBAC — see doc 04. Requires PHP 8.3+, Laravel 12–13, MIT. |
| Filament | `filament/filament ^5.0` | Admin panel — see §5.3. Requires PHP 8.2+, Laravel 11.28+, Livewire 4+, Tailwind 4.1+. MIT. |
| Spatie Laravel Backup | `spatie/laravel-backup` (v10 current major) | Backup — see §11 and doc 06 §12. Resolve at install time; do not quote a patch number. |
| Pest / PHPUnit | `pestphp/pest ^4.0` / `phpunit/phpunit ^12.0` | Testing — conservative default per the Laravel 13 upgrade guide. Pest 5 is an explicit opt-in (requires PHP ^8.4); verify at scaffold time. Do not quote Pest 5 as the Laravel 13 default. |
| Laravel Pint | `laravel/pint ^1.0` | Code style; run in CI. |
| Larastan | `nunomaduro/larastan ^3.0` (verify at scaffold) | Static analysis. Strictness level is a project decision. |
| Laravel Horizon | `laravel/horizon ^5.0` | **Only when Redis is adopted** (§10.2). Horizon is Redis-only and does not work with the database queue driver. |
| Laravel Telescope | dev-only | Debugging; **never enabled in production** (it records queries and request payloads). |
| Laravel Reverb | `laravel/reverb ^1.0` (optional) | Realtime — see §12. Optional, not required for Phase 1 notifications. The Reverb database driver is **unverified** (secondary only) — do not rely on it. |
| Laravel Boost | `laravel/boost ^2.0` | First-party MCP server / upgrade assistance. |
| Laravel Tinker | `laravel/tinker ^3.0` | Console REPL. |

**Plan v1.1 versions superseded (per the Decision Sheet):** Laravel 12 → 13 (see §2.1); Filament 3 → 5; PostgreSQL 16 → current major at scaffold time (verify; do not assert PostgreSQL 18 dates without re-checking — Research Notes §6, §9); Redis 7 + Horizon as day-one → deferred to when justified (§10); Next.js 15 / Flutter 3.x → verify the current stable at build time, do not assert.

### 2.4 Laravel 13 changes the codebase must respect

From the Laravel 13 upgrade guide and release notes (Research Notes §1). These are not optional details — they shape the skeleton from day one:

- **CSRF middleware renamed:** `VerifyCsrfToken` → `PreventRequestForgery`, now origin-aware using the `Sec-Fetch-Site` header. The old name remains as a deprecated alias; new code uses the new name and the `preventRequestForgery(...)` middleware configuration API.
- **Cache defaults:** `serializable_classes => false` — objects in cache need an explicit allow-list. Do not cache Eloquent models or arbitrary objects without allowing their classes.
- **Session defaults:** the new skeleton sets session `serialization` to `json` (was `php`). Switching an existing app invalidates all active sessions — decide at scaffold time and do not change it later without a maintenance window.
- **Cache/session key prefixes:** defaults now use hyphenated suffixes (`-cache-`, `-database-`, `-session`). Set `CACHE_PREFIX`, `REDIS_PREFIX`, and `SESSION_COOKIE` explicitly so behaviour is deliberate.
- **Queue routing by class:** `Queue::route(JobClass::class, connection: ..., queue: ...)` defines default queue/connection routing centrally. Use it instead of scattering connection names through dispatch calls.
- **Attributes:** `#[Middleware]` and `#[Authorize]` on controllers; queue-job attributes `#[Tries]`, `#[Backoff]`, `#[Timeout]`, `#[FailOnTimeout]`. Prefer attributes over fluent configuration where the framework supports them, for readability.
- **JSON:API resources:** Laravel 13 ships first-party JSON:API resources. The platform's API uses the envelope from the Decision Sheet (`{"data": ..., "meta": {...}}`), **not** JSON:API — the envelope is a standing decision. JSON:API resources are noted as available but are not adopted; if a future client needs JSON:API, that is a separate decision.
- **AI SDK / vector search:** Laravel 13's AI SDK and native vector search exist, but vector search requires PostgreSQL + `pgvector` (§3) and the AI SDK has no Phase 1 use case. Both are noted as available, not adopted.
- **Other upgrade-guide items** (low impact for a new app, recorded for completeness): `upsert` now validates a non-empty `uniqueBy`; model instantiation during `boot()` throws `LogicException`; polymorphic pivot table names are now pluralised when inferred; `Js::from` uses `JSON_UNESCAPED_UNICODE`. None of these changes the architecture; they are listed so the scaffold does not accidentally rely on old behaviour.

---

## 3. Database decision — PostgreSQL vs MySQL

### 3.1 Decision

**PostgreSQL is the database, with a narrow lean, for a single-VPS start.** This is the Decision Sheet's confirmed position, following Research Notes §6. It is **not** presented as a foregone conclusion: the deciding constraint is stated below, and the alternative is documented with its own trigger.

### 3.2 Why PostgreSQL (on a VPS)

In order of weight (Research Notes §6):

1. **Laravel 13 vector search is PostgreSQL-only** (requires PostgreSQL + `pgvector`). Choosing MySQL closes that door permanently. There is no Phase 1 vector-search use case, but the option value is real for a databank with Bengali/English text.
2. **Native full-text search is stronger without an extra service** — `tsvector`/`tsquery` with GIN indexes, configurable dictionaries, ranking (`ts_rank`), phrase matching. At this scale (thousands of rows, not millions) it is good enough that no separate search engine is needed (§10.4).
3. **JSONB** — binary, GIN-indexable across the whole document, with rich operators — reduces the risk of the two most common "we'll regret this later" problems in a databank/ledger app (flexible attributes and audit payloads).
4. **Transactional DDL** — a failed migration rolls back cleanly, instead of leaving partial schema changes. For a project whose migrations carry financial-integrity constraints, this matters.

Other PostgreSQL strengths that apply here: strict SQL semantics, deferrable and partial/exclusion constraints, window functions, CTEs (including recursive), `FILTER` aggregates, materialised views, true MVCC (readers never block writers), and mature logical backup tooling (`pg_dump` / `pg_restore`).

### 3.3 The MySQL counterweight (documented, not dismissed)

MySQL/MariaDB (LTS line) is a **perfectly adequate database for this workload**, and the better choice **if shared-hosting portability in Bangladesh becomes a requirement**:

- MySQL is ubiquitous on cheap Bangladeshi shared/cPanel hosting; PostgreSQL is rarely offered there. If the site ever has to move to cheap shared hosting, MySQL/MariaDB is the only practical option.
- Decimal integrity is **identical** in both: `DECIMAL(p,s)` / `NUMERIC(p,s)` give exact decimal arithmetic in either engine, provided the application uses `decimal` columns (never float) and `numeric(12,2)` consistently (Decision Sheet). The choice of database does not change money handling.
- Foreign keys on InnoDB are fine for practical purposes; MySQL's window functions and CTEs (since 8.0) cover the reporting this platform needs; `mysqldump` is as well understood as `pg_dump`.

**Trade-off statement (recorded):** PostgreSQL is the better default **on a VPS**; MySQL is the better choice **if shared-hosting portability is a requirement**. Either is defensible. The constraint that decided it here is that the project starts on a single VPS, where hosting availability is not a constraint.

### 3.4 What is unverified

**Bengali full-text search quality is unverified in both engines** (Research Notes §6, §9). PostgreSQL has no built-in Bengali dictionary; MySQL's n-gram parser behaviour for Bengali is likewise untested. Before any search-quality claim is made, a small empirical test with real Bengali names and notices is required. `pg_trgm` (trigram search) is a likely fallback on PostgreSQL; it is not verified here and is not assumed. The search design in §10.4 therefore starts with the simplest mechanism and treats search quality as something to measure, not assert.

### 3.5 Version and hosting notes

- PostgreSQL major: **current major at scaffold time** — verify against postgresql.org. Do not assert a specific major or its dates in this blueprint (Research Notes §6, §9: PostgreSQL 18 dates are secondary lifecycle summaries; re-verify).
- The database runs on the same single VPS as the application in Phase 1 (Docker or a system package — the deployment choice is an operations decision, not an architecture decision). No managed-database service is required at this scale.
- Connection handling: Laravel's default connection pool behaviour is sufficient at Phase 1 volume (500 concurrent users is the plan's performance budget — Engineering Plan v1.1, cited in the Decision Sheet — and the database is not the bottleneck at that level). PgBouncer or a similar pooler is a future option if connection counts become a problem; it is not adopted on day one.

---

## 4. Modular monolith structure

### 4.1 Why a modular monolith (and not microservices, and not a single flat app)

Engineering Plan v1.1 §6 states the module-boundary test: *"কোনো ফিচার অনুরোধ এলে প্রথম প্রশ্ন — এটি কোন মডিউলের? উত্তর না মিললে তা নতুন মডিউল/স্কোপ — আলাদা অনুমোদন লাগবে"* (when a feature request arrives, the first question is: which module is it? If there is no answer, it is a new module/scope and needs separate approval). The modular monolith serves that test: modules are explicit, bounded, and independently understandable, while the deployment stays one application, one database, one queue, and one set of logs — which is what a single-VPS community platform can actually operate.

Microservices are rejected for Phase 1: they would multiply the operational surface (service discovery, distributed transactions for the finance ledger, cross-service audit logging) with no benefit at this scale. A flat, unstructured Laravel app is also rejected: the 12 modules below would blur into each other, and the finance ledger's integrity rules would leak across the codebase.

### 4.2 Module map — M1–M12

Per Engineering Plan v1.1 §6, reconciled with the audit's 37 features (Audit Findings §3). The module list is the Decision Sheet's M1–M12 naming; nothing here renames a module.

| Module | Name | Phase | Owns (from the audit) |
|---|---|---|---|
| **M1** | Identity & Membership | Phase 1 | Registration, member approval, profiles, family records, account lifecycle, password reset (Super-Admin-mediated), data-rights requests. Audit #30–#33, #37. |
| **M2** | Community Profile | Phase 1 | Households/persons databank, statistics (computed, never hand-typed), professionals directory, institutions, landmarks, freedom fighters. Audit #2–#6. Infrastructure (#6) is a **reserved** sub-area: the permission exists (doc 04 §4.2) but the records and UI are built only when the client supplies facility data. |
| **M3** | Organisation | Phase 1 | History/timeline (verified milestones only), constitution (versions + documents), committee terms/members, advisors, past leaders, achievements. Audit #7–#11. |
| **M4** | Annual Activities | Phase 1 | Activities by year and category (category stored per activity — the prototype's category filter had no data behind it, Audit Findings §8.7), activity detail, linked reports. Audit #12–#13. |
| **M5** | Expatriate Support | Phase 1 | Request intake, Request IDs, assignment, status workflow, updates/photos, itemised expenses, ERT roster, public tracking. The platform's most sensitive module (Plan v1.1 §6). Audit #14–#17. |
| **M6** | Blood Donor | Phase 1 | Donor registry (computed availability — 90-day rule), donor search, emergency blood requests, donor-side consent and phone reveal. Audit #18–#19. |
| **M7** | Content | Phase 1 | Notices, news, events, job circulars, FAQs, gallery (photos), video gallery (placeholder in the prototype — Audit Findings §3 #25; the module exists, video records are built when the client supplies video), media library. Audit #20–#25, #36. |
| **M8** | Finance | Phase 1 | Immutable ledger, categories, project accounts, monthly summaries, annual reports. Audit #26–#29. |
| **M9** | Notifications | Phase 1 | Notification service (Web Push primary, in-app list, email optional Phase 2, no SMS). Audit #34. |
| **M10** | Admin & Reporting | Phase 1 | Filament dashboard, exports, activity/audit-log viewer, system health. Audit #32 (Super Admin dashboard — absent in the prototype, to be built). |
| **M11** | Public Web Experience | Phase 1 | The Next.js public website. This module is the **consumer** of the API, not a backend module — its backend footprint is the public API surface, the SEO/bilingual routing contract, and the caching rules for public pages. |
| **M12** | Mobile App | Phase 3 | The Flutter app. Phase 1 backend work for M12 is limited to: token auth that already works for mobile (§8), push-notification device registration (M9), and API versioning that does not break when the app ships. No app is built in Phase 1. |

### 4.3 Physical layout

The application follows Laravel 13's default skeleton, with modules as the organising principle inside `app/`:

- `app/Modules/{Identity, Community, Organisation, Activities, Services, Blood, Content, Finance, Notifications}` — one directory per backend module (M1–M10, with M5 and M6 as `Services` and `Blood` respectively, matching the plan's domain groupings). Each module directory contains its own models, policies, Form Requests, API Resources, service classes, events/listeners, jobs, and notifications — grouped by module, not by technical layer, so that a developer working on expatriate support finds everything about expatriate support in one place.
- `app/Http/Controllers/Api/V1/` — thin API controllers, one per resource, delegating to module services. Controllers are organised by API version, not by module, because the API surface is the contract.
- `app/Http/Controllers/` (web) — the minimal web routes: the Filament panel entry, Sanctum's CSRF cookie route, health checks. No business logic in web controllers.
- `app/Models/` — Eloquent models. A model may live in its module directory instead where that keeps the module self-contained; the choice is consistent per module and recorded in the module's README. Either way, a model belongs to exactly one module.
- `app/Policies/` — one policy per resource, enforcing doc 04.
- `app/Services/` — cross-module services only (e.g. the notification dispatcher, the media pipeline, the statistics computer). Module-specific logic lives in the module, not here.
- `app/Events/` and `app/Listeners/` — domain events (see §6.6).
- `app/Jobs/` — queued jobs, routed by class (§2.4).
- `app/Notifications/` — notification classes (database, Web Push, mail channels).
- `app/Filament/` — Filament resources, pages, and widgets (M10), organised by module.
- `routes/api.php` — the `/api/v1` route definitions. `routes/web.php` — the panel and health routes. `routes/console.php` — the scheduler (§10.5).
- `config/` — framework and package configuration. Secrets live in environment variables, never in config files and never in the repository.
- `database/migrations/` — one migration per table (or per coherent change), ordered per doc 06 §10. `database/seeders/` — the bootstrap seeder (first Super Admin — doc 04 §3.1), the permission seeder (doc 04 §4), and reference-data seeders (blood groups, finance categories, service catalogue). **No demo data is seeded** (doc 06 §13).
- `tests/` — Pest tests mirroring the module structure (`tests/Feature/Modules/...`, `tests/Unit/...`).

### 4.4 Module boundaries and the rules that keep them honest

1. **No module touches another module's tables directly.** If M5 needs a member's name, it goes through M1's service or a read-model — never a raw query against M1's tables. Cross-module reads go through a service interface or a domain event; cross-module writes always go through the owning module's service.
2. **Shared kernel, minimal.** Only genuinely cross-cutting concerns live outside modules: authentication/authorization primitives, the API envelope, the audit-log writer, the notification dispatcher, the media storage abstraction, and the bilingual-content helpers. Everything else is module-owned.
3. **The finance ledger is the strictest boundary.** No module other than M8 writes to the ledger. M5's expense lines are **not** ledger entries — they are request expenses (actual cost + transport, borne by the applicant). The ledger records the organisation's own income and expenditure. The two are related (an expatriate request's expenses may be summarised in finance reporting) but they are different records, and conflating them would corrupt both.
4. **Events cross boundaries; queries do not.** When M5 changes a request's status, it fires a domain event (`ExpatriateRequestStatusChanged`). M9 listens and sends notifications; M10 listens and updates dashboard aggregates. M5 never calls M9's notification code directly. This keeps M5 testable without a notification service and keeps M9 replaceable.
5. **A module's public surface is its service class + its API resources + its events.** Everything else in the module is internal. If another module needs something, it uses the service — it does not reach into the module's models.

---

## 5. Layering

The layering rules exist so that a future team can implement without guessing where a rule lives. The order below is the order a request travels through.

### 5.1 Request flow (API)

```
HTTP request
  → Route (routes/api.php, /api/v1)
  → Middleware (auth:sanctum, throttle, locale, permission gate where route-level)
  → Form Request (validation + authorisation — see §5.2)
  → Controller — thin (see §5.3)
  → Policy / Gate check (doc 04 — see §6)
  → Service class (business logic, transactions — see §5.5)
  → Eloquent models (persistence — see doc 06)
  → Domain events fired (see §6.6)
  → API Resource (response shaping — see §5.4)
  → Response envelope {"data": ..., "meta": {...}} (Decision Sheet)
```

Errors travel the reverse path through the **exception handler** (§7.2), which renders the bilingual error envelope (`{"message_bn": "...", "message_en": "...", "error": {"code": "..."}}`).

### 5.2 Form Requests — validation and authorisation

- Every mutating endpoint (POST/PUT/PATCH/DELETE) has a **Form Request** class. Validation rules live there and nowhere else. Controllers never validate inline.
- Form Requests carry the **authorisation check** (`authorize()` method) as the first gate: the request is rejected before validation runs if the caller lacks the permission. The policy check in the service layer is the second gate (defence in depth — the Form Request checks the permission, the policy checks the record-level scope).
- Validation rules encode the audit's findings as server-side rules (Audit Findings §7.1 was client-side only and is **not** trusted): names ≥ 2 characters, details/messages ≥ 10 characters, phone = ≥ 10 digits after stripping non-digits (with the additional rule that Bangladeshi mobile numbers must start with `01` — a tightening over the prototype, which accepted any 10 digits; the exact format rule is confirmed at build time against the client's real numbers), hospital name ≥ 3 characters, consent checkbox required where the flow demands it, password per doc 04 §5.1 (12 characters minimum, complexity, history).
- Validation messages are **bilingual** (Bengali + English) and come from the language files, not from hard-coded strings. The prototype's error strings (Audit Findings §7.2) are the starting point for the Bengali wording, reviewed for tone at build time.
- File-upload validation (size, MIME type, image dimensions) lives in the Form Request too, before the file reaches the media pipeline (§11).

### 5.3 Controllers — thin

- A controller does exactly four things: resolve the Form Request, call the service, select the API Resource, return the envelope. It contains **no business logic, no queries beyond a scoped lookup, no transactions, and no notification sending**.
- Controllers are named by resource (`ExpatriateRequestController`, `BloodDonorController`, …) and grouped under `Api/V1/`. One controller per resource; nested resources (e.g. a request's updates) are separate controllers, not extra methods on the parent.
- Controllers never check a role name (`if ($user->hasRole('super-admin'))`). They check permissions (`$user->can('finance.approve')`) or delegate to a policy. Role-name checks in controllers are a code-review failure.

### 5.4 API Resources — response shaping

- Every response is shaped by an **API Resource** (or Resource Collection). Models are never returned directly, and `$model->toArray()` is never the response.
- Resources enforce the **sensitive-field rules** (doc 04 §7): a phone number field is present in a resource only when the caller's permissions allow it, and the resource is the place that decision is made (the policy decides *whether*, the resource decides *what shape*). A resource for public tracking omits applicant identity entirely (doc 04 §7.4).
- Resources carry the **bilingual content rule** (doc 06 §9): a translatable field is returned as an object (`{"bn": "...", "en": "..."}`) or in the requested locale with a Bengali fallback — the contract is fixed per endpoint in the API specification (a later Phase 0 document) and is consistent across resources.
- Pagination is standard: `?page=` and `?per_page=` (capped, e.g. 50), with `meta` carrying `current_page`, `per_page`, `total`, `last_page`. The prototype's lists were tiny and unpaginated (Audit Findings §3.1); the real API paginates every list. No endpoint returns an unbounded list.
- Filtering and searching use query parameters (`?status=`, `?year=`, `?blood_group=`, `?q=`), validated by the Form Request, applied as scoped queries in the service. The prototype's client-side array filtering (Audit Findings §6) is replaced by server-side filtering throughout.

### 5.5 Service classes — where business logic lives

- Each module has service classes that own its business logic: `ExpatriateRequestService` (intake, assignment, transitions, expenses), `FinanceService` (entry, approval, reversal, summaries), `MemberService` (registration, approval, suspension), `DonorService` (registration, consent, matching), `ContentService` (draft → publish → archive), `NotificationService` (dispatch — M9), `MediaService` (upload pipeline — §11), `StatisticsService` (computed aggregates — doc 06 §9).
- Services are the **transaction boundary**: a service method that changes more than one record wraps the whole change in a database transaction, including the audit-log write (doc 04 §5.7 — an action without its log entry cannot commit). A failed step rolls back everything, including dispatched jobs where the queue driver supports it (the database queue driver participates in transactions — Research Notes §7.1 — so a job dispatched inside a rolled-back transaction never exists).
- Services are the **state-machine boundary**: status transitions go through the service, which validates the transition against the machine (§9) before touching the model. Models never change their own status directly outside the service.
- Services are **framework-thin**: they depend on models, events, and other services — not on HTTP objects, not on the request, not on the session. That makes them unit-testable without HTTP.

### 5.6 Policies and gates

- One **policy per resource** (`ExpatriateRequestPolicy`, `MemberPolicy`, `FinanceEntryPolicy`, `BloodDonorPolicy`, …). Policies encode the record-level and ownership rules from doc 04 §7 (assignment-scoped helper edits, ownership-scoped member access, visibility-scoped directory reads).
- **Gates** are used for the cross-cutting checks that are not tied to a single record: `Gate::define('access-admin-panel', ...)` for Filament panel access, and the Spatie-registered permission gates for the granular permissions (Spatie registers every permission on the Gate automatically — Research Notes §5).
- The `before()` hook on a policy grants Super Admins the permissions they hold — **by permission, not by role name**. A Super Admin passes a policy check because they hold the permission, not because a `before()` hook returns `true` for the role. (A blanket role-based `before()` would silently grant future permissions to the role, including permissions added by mistake. The permission set is the authority.)
- Filament resources use the same policies through Filament's `can*()` hooks (`canView`, `canCreate`, `canEdit`, `canDelete`, …) and `canAccessPanel()`. There is one authorisation source, used by both the API and the panel.

### 5.7 Events, listeners, and jobs

- **Domain events** are fired by services when something meaningful happens: `MemberRegistered`, `MemberApproved`, `ExpatriateRequestSubmitted`, `ExpatriateRequestStatusChanged`, `ExpatriateRequestExpenseAdded`, `BloodRequestSubmitted`, `DonorConsentGranted`, `DonorConsentRevoked`, `FinanceEntryPublished`, `FinanceEntryReversed`, `ContentPublished`, `NoticeExpired`.
- **Listeners** react: M9's notification listener (send the right notification to the right people), the audit-log listener (write the immutable record), the statistics-invalidation listener (bust the cached aggregates), the scheduler-reminder listener (e.g. the 72-hour no-update reminder — §9.1).
- **Jobs** are the queued, retryable units of work: sending a Web Push notification, generating media variants (thumbnails/WebP), generating a report file, pruning expired tokens, running the nightly backup. Jobs are dispatched from services and listeners, never from controllers.
- **Idempotency:** jobs that send notifications are idempotent by design (a notification record is created first; the job sends it and marks it sent; a retry finds the record already sent and does nothing). This matters because queue retries are expected, not exceptional.
- **Failures:** a failed job goes to `failed_jobs`, is visible in the admin system-health view (M10), and is retried per its `#[Tries]` / `#[Backoff]` attributes. A notification job that fails permanently is recorded as failed in the delivery log (M9) — the failure is visible, not silent.

### 5.8 Caching

- **Cache driver to start: `database`** (Decision Sheet). Zero new services; matches the queue choice; fine at this scale.
- **What is cached:** computed statistics (member/family/expatriate counts, finance summaries — 15-minute TTL per Engineering Plan v1.1 §7, or invalidated on write, whichever the implementation chooses; invalidation on write is preferred because it is always correct), public content lists (activities, notices, news — short TTL, invalidated on publish), and the Spatie permission cache (Spatie caches all permissions/roles with a default 24-hour expiry and flushes automatically when permissions/roles change — Research Notes §5).
- **What is never cached:** personal data (member records, request details, donor phones), anything permission-scoped (a cached response must never leak across users — cache keys include the scope, or the data is not cached at all), and the audit log.
- **Cache tags are NOT supported by the database/file drivers** (Research Notes §7.2). No tag-dependent code is written unless Redis is adopted. Cache invalidation uses explicit key deletion (or versioned keys), not tags.
- **If Redis is added** for any reason (queues/Horizon/Reverb), the cache moves to Redis at the same time and sessions stay on `database` (Decision Sheet). A Redis used as a cache with an `allkeys-lru` eviction policy must never share an instance/database with queues (eviction can silently delete queued jobs — use `noeviction` for queue Redis or separate instances — Research Notes §7.2).

---

## 6. Frontend separation — API-first

### 6.1 The Direction D prototype is a design reference, not the production frontend

The live prototype (`index.html`, Direction D) is the approved **visual direction**: the tokens (Deep Forest `#102E27`, Forest `#173F35`, Warm Gold `#C49A4A`, Cool White `#FBFBF8`, Ivory `#F7F4EA` story-only), the type (Anek Bangla variable as workhorse, Tiro Bangla italic for pull-quotes only, Manrope for English/numerals), and "The Meridian" single 1px gold line (Decision Sheet). The production frontend **follows that direction**; it does not reuse the prototype's code.

What the prototype is **not**:

- It is not the production frontend. It is a single self-contained HTML file with embedded base64 images, no network calls, no persistence, and all state in memory (Audit Findings §1.1, §6). Nothing in it is carried into production as code.
- Its data is **demo data** — every name, figure, and record is labelled নমুনা/Demo, and none of it is migrated (doc 06 §13).
- Its behaviours are **simulated**: login against two hard-coded accounts with plaintext passwords, registration that stores nothing, request IDs that are random and can collide, consent granted by the requester's own click, a finance report generated in the browser as a `.txt` file (Audit Findings §6). Each of these is replaced by a real backend behaviour specified in this document and doc 06.
- Its design tokens **supersede** Plan v1.1's tokens (Forest `#14532D`, Gold `#C9A227`, Hind Siliguri/Noto Serif Bengali) — the Decision Sheet records this divergence explicitly.

### 6.2 The three clients, one API

| Client | Technology (per Plan v1.1, versions verified at build time) | Auth | Phase |
|---|---|---|---|
| **Public web** | **Next.js** (version: verify current stable at build time; Plan v1.1 says Next.js 15 — superseded as a version claim, not as a technology choice). Server-rendered public pages with ISR (5-minute revalidate; on-demand purge on urgent notices — Plan v1.1 §10). Bilingual routing by URL (`/{lang}/…` — Plan v1.1 §10, M11), light/dark mode, fully responsive. | Sanctum cookie auth (same top-level domain — §8.1). | Phase 1 |
| **Admin panel** | **Filament 5.x** (`^5.0`), served from the same Laravel application. Not a separate app, not a separate deployment. | Session auth (web guard) through the same Laravel session. Panel access gated by `canAccessPanel()` + the permission set (doc 04). | Phase 1 |
| **Mobile app** | **Flutter** (version: verify current stable at build time; Plan v1.1 says Flutter 3.x — superseded as a version claim). Bottom navigation: Home, Community, Services, Profile (Plan v1.1 §6, M12). Offline read cache for notices and directory; push deep-links; optional biometric unlock; app-version force-update policy. | Sanctum personal access tokens (§8.2). | Phase 3 |

**Rules:**

1. **All clients consume `/api/v1`.** There is no second API, no admin-only API, and no direct database access from any client. The Filament panel is the one exception to "consume the API" — it runs inside the Laravel application and uses the same services and policies directly (not over HTTP), because it is part of the application. That is a deliberate, documented exception: the panel shares the service layer, not the HTTP layer.
2. **No business logic in any client.** Validation that exists in a client is for user experience only (immediate feedback); the server re-validates everything (Form Requests, §5.2). A client that disagrees with the server loses.
3. **No hard-coded content in any client.** Every piece of content on the public site comes from the API (Plan v1.1 §6, M11). The prototype's hard-coded arrays (`DIRECTORY`, `DONORS`, `FINANCE`, … — Audit Findings §2.5) are replaced by API responses.
4. **The API is versioned from day one.** The base is `/api/v1`. A breaking change creates `/api/v2`; it never silently changes `/api/v1`. The Flutter app (Phase 3) depends on this.
5. **The public website's routes are not the prototype's hash routes.** The prototype uses hash routing (`#/home`, `#/expatriate`, … — Audit Findings §2.1). The production Next.js site uses real URL routes (`/{lang}/`, `/{lang}/expatriate`, …) for SEO and shareability. The prototype's 18 hash views map to the production route set (the mapping is a frontend-build decision, recorded in the frontend specification — not in this backend document).

### 6.3 Filament 5 admin panel

- **What it is:** the admin panel for Super Admins (and, in future phases, for deferred roles). Built on Livewire, Alpine.js, and Tailwind CSS, with server-driven UI defined declaratively in PHP (Research Notes §4).
- **Panels:** a single admin panel in Phase 1. Filament supports multiple panels (e.g. a separate member portal panel later); Phase 1 does not create one. The member-facing experience is the Next.js site and (later) the Flutter app, not a Filament panel.
- **Resources:** one Filament resource per manageable entity (members, directory entries, committee, activities, expatriate requests, donors, blood requests, posts, media, ledger entries, projects, contact messages, notifications). Each resource wires its policy through `can*()` hooks. Tables support filtering, sorting, and pagination (Filament Tables). Forms use Filament Forms with the same validation rules as the API Form Requests (the rules are shared where the framework allows; where they cannot be shared, they are kept identical by test — a test asserts the two rule sets match for the fields they share).
- **Dashboards and widgets:** the M10 dashboard uses Filament widgets (stats, charts, tables) for the KPIs: members, pending approvals, in-progress requests, month's finance. Widgets read from the same services as the API (never raw queries that bypass scopes).
- **Notifications in the panel:** Filament Notifications for flash/database notifications to admins (e.g. "new request submitted" appears in the panel as well as by Web Push).
- **RBAC hooks:** Filament has no built-in roles (Research Notes §4). Access is via gates/policies + `canAccessPanel()` / `can*()`. The community **Filament Shield** plugin (which wires Spatie roles/permissions into Filament) is **not verified** (Research Notes §4) — it is **not adopted** on the basis of this blueprint. If the build team wishes to adopt it, they check its version, maintenance, and Laravel 13 / Filament 5 compatibility first and record the decision. The default is to wire the hooks by hand, which is a small amount of code.
- **Styling:** the panel uses Filament's Tailwind token design system. It is an internal tool; it does **not** need to match Direction D's public tokens. Do not spend effort making the admin panel look like the public site.

---

## 7. API design

### 7.1 Base, envelope, and versioning

- **Base:** `/api/v1` (Decision Sheet).
- **Response envelope (success):** `{"data": ..., "meta": {...}}` — `data` is the resource or collection; `meta` carries pagination and any request-scoped metadata.
- **Error envelope:** `{"message_bn": "...", "message_en": "...", "error": {"code": "..."}}` (Decision Sheet). Every error — validation, authorisation, not-found, server — uses this shape. HTTP status codes follow the standard meaning (400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 422 validation detail, 429 throttled, 500 server error).
- **Validation errors** include a per-field breakdown inside `error` (field → [messages, bilingual]) alongside the top-level bilingual message.
- **Versioning:** URL versioning (`/api/v1`). No header-based versioning. A new major version is a new prefix; the old prefix is supported until the last client using it is upgraded (the Flutter app's force-update policy, Plan v1.1 M12, is the mechanism that retires old versions).

### 7.2 Exception handling and logging

- A single **exception handler** renders every exception into the error envelope. Unhandled exceptions return a generic bilingual message ("Something went wrong" / "কিছু একটা ভুল হয়েছে") with a server-side correlation id; the detail (stack trace, query, payload) goes to the log, never to the client.
- **Logging:** Laravel's log stack (single file / daily rotation on the VPS, or a structured channel if the operations setup provides one). Log levels: `info` for business-significant events (request submitted, member approved, finance published), `warning` for suspicious-but-not-blocking events (repeated failed logins, validation floods), `error` for exceptions and failed jobs. **Sensitive data is never logged** — no passwords, tokens, full phone numbers, or file contents (doc 04 §5.7).
- **Telescope** is dev-only (§2.3). Production debugging uses the log files and the M10 system-health view.
- **Correlation ids:** each request carries a correlation id (generated per request, returned in a response header) so that a user-visible error can be traced to its log lines.

### 7.3 Endpoint inventory (summary)

Engineering Plan v1.1 estimated **~70 endpoints** under `/api/v1`. The full inventory in doc 07 §14 lists **108 endpoints** (6 wholly proposed, 4 with behaviour-level proposals) against the schema in doc 06; the OpenAPI specification is produced in Sprint 1 of development (Plan v1.1 §8 note) and must cover the doc 07 inventory and no others without a scope decision. The resource groups below are the complete scope; the OpenAPI document must cover all of them and no others without a scope decision:

| Group | Resources (summary) |
|---|---|
| Auth (M1) | register, login, logout, logout-all, change-password, request-password-reset (Super Admin only), me, my sessions/tokens. |
| Members (M1) | member CRUD, approval, suspension, family records, member search/filter, member export. |
| Community (M2) | directory entries (search/filter by category and area), households/persons (admin), professions, institutions, landmarks, freedom fighters, statistics. |
| Organisation (M3) | organisation profile, timeline milestones, constitution versions/articles, committee terms/members, advisors, past leaders, achievements. |
| Activities (M4) | activities (year/category filter, detail, related), activity media. |
| Expatriate (M5) | request intake (public), request tracking by ID (public), request queue (helper/admin), assignment, status transitions, updates, expenses, ERT roster. |
| Blood (M6) | donor search (group/area), donor registration, own donor record, blood requests (public submit), donor response, consent grant/revoke, phone reveal (consent-gated, logged). |
| Content (M7) | posts (notices/news/events/jobs/FAQs — list, detail, publish workflow), gallery albums/items, media upload, annual reports. |
| Finance (M8) | ledger entries (draft/publish/reverse), categories, projects, monthly summaries, annual reports, exports. |
| Notifications (M9) | own notifications (list, mark read, clear), push-subscription registration, notification preferences, delivery log (admin). |
| Admin (M10) | dashboard KPIs, audit-log view, system health, contact-message inbox, data-rights requests, settings. |
| Public (M11) | home assembly (hero, stats, feed, gallery, ledger strip — one endpoint that assembles the home page from the modules, replacing the prototype's duplicated rendering — Audit Findings §4), sitemap-relevant public lists. |

### 7.4 Rate limiting

- **Public, unauthenticated endpoints** (request intake, tracking, blood-request submit, contact, donor search): throttled per IP (e.g. 60 requests/minute per IP for reads, 10 submissions/minute per IP for writes — exact numbers are configuration, set at deployment and recorded in the runbook). The purpose is to prevent spam intake and ID-enumeration on tracking (a tracking lookup that is throttled cannot be brute-forced across the `EXP-YYYY-####` space quickly).
- **Authenticated endpoints:** throttled per user (generous — e.g. 300 requests/minute) so a bug in a client cannot take the API down.
- **Login:** throttled per the rules in doc 04 §5.2 (5 failures / 15 minutes, 10 failures / 30-minute lock).
- Throttle responses use the standard error envelope with `error.code` indicating throttling, and a `Retry-After` header.

---

## 8. Authentication architecture

### 8.1 Sanctum 4.x — two modes, deliberately separate

Authentication is **Laravel Sanctum 4.x** (`^4.0`), per the Decision Sheet and Research Notes §3. Sanctum has two modes and they are used for different clients, exactly as the Sanctum documentation prescribes:

| Client | Mode | How it works |
|---|---|---|
| **Next.js public web (first-party SPA)** | **Cookie-based SPA authentication** | No tokens. The SPA uses Laravel's session auth via the `web` guard, giving CSRF protection and protection against credential leakage via XSS. The SPA fetches the CSRF cookie from `/sanctum/csrf-cookie` first, then authenticates with the session cookie. The SPA and the API must share the **same top-level domain** (different subdomains allowed). Stateful domains are configured explicitly (`stateful` config / `Sanctum::currentApplicationUrlWithPort()`), and the API is enabled with `$middleware->statefulApi()`. |
| **Flutter mobile app** | **Personal access tokens** | Tokens issued per user via `HasApiTokens::createToken()`, stored SHA-256 hashed in `personal_access_tokens`, sent as `Authorization: Bearer <token>`. Multiple tokens per user (one per device). The plain-text value is shown only once, at creation. Tokens carry abilities where useful (e.g. a token's scope is the user's permissions — authorisation still lives in policies/gates, not in the token). |
| **Filament admin panel** | **Session auth (web guard)** | Same session as the SPA mode. Panel access is additionally gated by `canAccessPanel()` + permissions (doc 04). |

**The Sanctum documentation's rule is followed verbatim** (Research Notes §3): *"You should not use API tokens to authenticate your own first-party SPA. Instead, use Sanctum's built-in SPA authentication features."* API tokens are for the mobile app only.

### 8.2 How web and mobile auth coexist

- The `auth:sanctum` guard tries the **session cookie first, then the `Authorization` header token**. One guard serves both clients; the route definitions do not branch by client type.
- **Abilities:** tokens can be granted abilities (e.g. `['server:update']` in the docs' example). For first-party SPA requests `tokenCan()` always returns `true` — real authorisation still belongs in policies/gates (Research Notes §3). Token abilities are therefore used only as a coarse scope on mobile tokens (e.g. a token issued for a read-only kiosk, if such a thing is ever needed), never as the authorisation mechanism.
- **Token expiry:** by default Sanctum tokens **never expire**. The application configures a global `expiration` (in minutes) in `config/sanctum.php` and/or per-token expiry at creation. Expired tokens are pruned on schedule (`php artisan sanctum:prune-expired`, daily — §10.5). The exact expiry (e.g. 90 days for a mobile token, with re-login on expiry) is a configuration decision recorded at build time. A token that never expires is a credential that can never be revoked by time — Phase 1 does not allow that.
- **Revocation:** deleting the token row (`$user->tokens()->delete()`, `currentAccessToken()->delete()`, or a specific token id). There is no server-side token-introspection endpoint; revocation is a database delete and takes effect immediately.
- **Device/session management (designed around Sanctum's limits):** Sanctum itself has **no per-device session list, no "log out everywhere", and no refresh-token flow** (Research Notes §3). The application builds these on top:
  - *Per-device list:* the `user_devices` table (doc 06 §2) records each device (FCM token, platform, last seen) at login/token creation. The profile page lists them.
  - *"Log out everywhere":* implemented as deleting all of the user's tokens **and** invalidating all of their sessions (database session driver — the session rows are deleted). This is a service method, not a Sanctum feature.
  - *Refresh tokens:* not used. A mobile token that expires requires a fresh login (username + password). If the client later requires silent refresh, that is a design change (and the point at which Passport or a refresh-token package would be evaluated — see §8.4), not a quiet addition.
- **Account suspension** immediately revokes all tokens and invalidates all sessions (§5.4 of doc 04 — enforced by the suspension service, not by Sanctum).

### 8.3 Registration, login, and the member lifecycle

Per Engineering Plan v1.1 §9.2 and doc 04 §2.3:

```
Registration (name + mobile + password)
  → status: pending
  → Super Admin approval queue
  → approved → status: approved (full Member permissions)
  → rejected → status: rejected (with reason; may re-apply)
  → suspended → status: suspended (by Super Admin; sessions/tokens revoked)
```

- **Login:** mobile number + password, verified against the hash. Wrong-password handling per doc 04 §5.2 (rate limit + temporary lock). A successful login for a `pending` user **succeeds as a login** but the user sees an "awaiting approval" screen and services are locked (Engineering Plan v1.1 §9.2). A `suspended` or `rejected` user cannot log in.
- **Password reset:** Super-Admin-mediated only, per doc 04 §5.5. No OTP/SMS reset in Phase 1, no self-service email reset (there is no email field in the prototype and no email service in Phase 1 scope).
- **Email/mobile verification:** **optional, not Phase 1.** The prototype has no email field anywhere (Audit Findings §2.4) and the Phase 1 login is mobile + password. If an email address is collected later (e.g. for report delivery or a self-service reset), verification of that email is added at that time. Mobile-number verification by OTP is a **future** option, not Phase 1 (Decision Sheet: NO OTP).
- **"Remember me":** not offered in Phase 1 (§5.4 of doc 04).

### 8.4 Passport — explicitly not adopted

**Laravel Passport is not used in Phase 1.** Passport is a full OAuth2 authorisation server (authorisation codes, PKCE, client credentials, refresh tokens, scopes, `/oauth/authorize`, `/oauth/token`, RSA-signed tokens, its own tables — Research Notes §3). It is the right choice only when **third-party developers** need delegated access to the API (a public API platform, "Login with…" products, OAuth-compliance audits). All Phase 1 clients are first-party (the organisation's own Next.js site, its own Filament panel, its own future Flutter app). Adopting Passport would add material security and maintenance cost for a capability no one needs. **Revisit Passport only if/when external developers need delegated access** — that is a scope decision, recorded at the time.

### 8.5 Future auth options (not Phase 1)

| Option | Status | Trigger |
|---|---|---|
| OTP login (SMS or authenticator) | Future. Decision Sheet: NO OTP in Phase 1. | Client request + a funded SMS/OTP provider + a decision on who pays per-message costs. |
| MFA (TOTP) for Super Admins | Optional in Phase 1, recommended (doc 04 §5.8). | Client decision at handover. The system is built so enabling it is configuration, not a rebuild. |
| Self-service password reset by email | Future. | An email service is adopted (M9 email is Phase 2) and email addresses are collected and verified. |
| Social login (Socialite) | Not planned. | No use case — the community's identity is a mobile number, not a social account. |
| Biometric unlock (mobile) | Phase 3 (M12), app-side only. | Flutter app build. It unlocks the app locally; it does not replace server authentication. |

---

## 9. State machines

Per Engineering Plan v1.1 §9: the complex parts of the platform are **state machines with rules, not bare status fields**. An illegal transition is rejected by the system. Every transition does three things together — an audit-log entry, a notification to the relevant parties, and (where applicable) a scheduler timer (reminder/expiry). If any of the three is missing, the test fails (Plan v1.1 §9, design principle).

**Common rules for all machines:**

- Transitions go through the owning service, inside a transaction, with the audit-log write in the same transaction.
- The transition records: actor, from-state, to-state, timestamp, and (where applicable) a reason/note.
- A transition that is not listed is rejected with a validation error naming the legal transitions from the current state.
- Status values are stored as strings (`pending`, `accepted`, …) in the database, matching the Decision Sheet's enum. The prototype's integer statuses (0–3, Audit Findings §5.5) are **not** carried forward.

### 9.1 Expatriate request lifecycle (M5)

Per Engineering Plan v1.1 §9.1 and the Decision Sheet. Status enum: `pending → accepted → in_progress → completed → closed`, plus `rejected` and `cancelled`.

```
pending ──(helper/Super Admin accepts)──▶ accepted ──(work starts)──▶ in_progress
  │                                                              │
  │                                                              ▼
  │                                                        completed ──(applicant confirms)──▶ closed
  │
  └──(with reason)──▶ rejected

Any state ──(applicant cancels)──▶ cancelled        [see rules below]
```

| Transition | Who | Rules |
|---|---|---|
| `pending → accepted` | Assigned helper, or a helper taking the request, or Super Admin. | Assignment is recorded (helper id + timestamp). A request cannot be accepted by two helpers — the first acceptance wins; a concurrent second acceptance is rejected (row-level lock / atomic update). |
| `accepted → in_progress` | Assigned helper or Super Admin. | Means work has started. The helper may add updates and expenses from this state onward. |
| `in_progress → completed` | Assigned helper or Super Admin. | **Requires at least one expense entry OR an explicit "no expenses incurred" declaration** (Plan v1.1 §9.1). A request cannot be marked completed with an empty expense record and no declaration. The completion must include a summary update (what was done) and, where applicable, a photo. |
| `completed → closed` | The **applicant** confirms (or a Super Admin closes it after confirmation is received out of band and recorded). | Closure is the applicant's act, not the helper's. A helper cannot close their own completed request. |
| `pending → rejected` | Super Admin (or the assigned helper, where the organisation allows it — the permission `expatriate.requests.reject` is Super Admin + assigned helper; the policy decision is recorded at build time). | A reason is **mandatory**. The applicant is notified with the reason. |
| Any state → `cancelled` | The **applicant** (their own request), or a Super Admin with a reason. | Cancellation is terminal. A cancelled request cannot be re-opened; a new request is submitted instead. |
| — | — | `pending → completed` directly is **illegal**. `completed → in_progress` (re-opening) is **illegal** — if completed work proves incomplete, the Super Admin creates a follow-up request linked to the original, or the applicant submits a new request. |

**Additional rules:**

- **72-hour reminder:** if a request sits in `in_progress` with no update for 72 hours, the system sends an automatic reminder to the Super Admin (Plan v1.1 §9.1). Implemented as a scheduled job (§10.5) that scans for stale `in_progress` requests.
- **New-request notification:** the moment a request is submitted, **all** Expatriate Helpers and all Super Admins receive a browser push notification with the Request ID (Decision Sheet; Plan v1.1 §5). Urgent requests also notify the backup helper (Plan v1.1 §9.1). Delivery is via M9 (§12) and is logged.
- **Expenses:** itemised (product cost + transport). There is **no service-charge field** anywhere (Decision Sheet). Expense lines are added by the assigned helper (or Super Admin) and are visible to the applicant in tracking (totals) and to admins in full.
- **Request IDs:** server-generated, unique, format `EXP-YYYY-####` (Decision Sheet). The prototype's random IDs could collide (Audit Findings §8.10) and its `created` date was hard-coded. The real system generates the ID from a per-year sequence inside a transaction, so uniqueness is guaranteed, and `created_at` is the real timestamp.
- **Open question D11:** the wizard is 3 steps in the Direction D build but Design System §7.1 describes 4 steps. This does **not** change the state machine — the machine governs the request after submission, not the form's step count. D11 is recorded as open in doc 04 §11 and in doc 06; it is a UX question for the frontend build.

### 9.2 Member lifecycle (M1)

Per Engineering Plan v1.1 §5 and §9.2:

```
registered (pending) ──(Super Admin approves)──▶ approved
                    └──(Super Admin rejects, with reason)──▶ rejected
approved ──(Super Admin suspends)──▶ suspended ──(Super Admin reinstates)──▶ approved
rejected ──(re-application)──▶ registered (pending)   [a new registration]
```

| Rule | Detail |
|---|---|
| Approval | Only a Super Admin (`members.approve`). The approver cannot be the applicant (trivially true — the applicant is not an admin). Approval is audit-logged and the member is notified. |
| Pending login | A pending user **can** log in but sees only an "awaiting approval" screen; services are locked (Plan v1.1 §9.2). Their effective permission set is the pending subset (doc 04 §8.15). |
| Suspension | Only a Super Admin (`members.suspend`). Suspension immediately revokes all tokens and sessions (§8.2). The member is told why (a reason is recorded). Reinstatement restores the account; the member must log in again. |
| Deletion | Soft-delete only (`members.delete`), subject to the retention rules in doc 06 §11. If the member has finance or request records, the account is **anonymised**, not deleted — the records stay for legal retention, the personal data is removed. Account deletion requested by the member has a **30-day grace period** (Plan v1.1 §6, M1) before permanent anonymisation, during which the member may cancel the request. |
| Rejection | A reason is mandatory and is shown to the applicant. A rejected applicant may register again. |

### 9.3 Content publish lifecycle (M7)

Per Engineering Plan v1.1 §9.5:

```
draft ──(review)──▶ review ──(publish)──▶ published ──(expiry)──▶ archived
   │                                │                       │
   └──────(scheduled)──────────────▶│ scheduled ──(time)──▶ published
                                    │
                                    └──(unpublish)──▶ draft
```

| Rule | Detail |
|---|---|
| Draft → review → published | Super Admin authors and publishes in Phase 1 (doc 04 §6.3). When a Content Editor role exists, the editor authors and the Super Admin publishes (enforced separation). |
| Scheduled publish | A `publish_at` timestamp. The scheduler (§10.5) publishes due items. A scheduled item is not visible publicly before its time. |
| Expiry / auto-archive | Notices carry an `expires_at`. At expiry the scheduler moves them to `archived` automatically. Archived notices remain visible as history (where the archive is public) but no longer appear in the active list or the homepage ticker. |
| Editing a published item | Creates a **new revision**; the published version stays live until the new revision is published. There is no silent in-place edit of live content. (Revision history is a content-table concern — doc 06 §5.) |
| Urgent notices | An urgent flag puts the notice on the homepage ticker and triggers a push notification (Plan v1.1 §6, M7). Urgent publication is a sensitive action (confirmation — doc 04 §5.6). |
| Job circulars | Carry a `verified` flag. Only verified circulars are published (Audit Findings §3 #23 — the prototype's job body says "প্রকৃত বিজ্ঞপ্তি যাচাই করে প্রকাশিত হয়" — real circulars are published after verification). |

### 9.4 Finance entry lifecycle (M8)

Per Engineering Plan v1.1 §9.4:

```
draft ──(verify + publish, by someone other than the enterer)──▶ published (locked)
                                                              │
                                                              └──(error found)──▶ reversal entry
                                                                     (original stays, untouched)
published ──(monthly summary)──▶ included in monthly summary (automatic)
```

| Rule | Detail |
|---|---|
| Entry | A Super Admin (or future Treasurer) enters a draft (`finance.create`): type (income/expense/donation), category, project/activity link, amount `numeric(12,2)`, date, payee, voucher image. |
| Approval / publish | A **different** person verifies and publishes (`finance.approve`). Self-approval is rejected by the system (doc 04 §6.1). Publishing locks the entry — it becomes immutable. |
| Correction | A published entry is **never edited and never deleted**. An error is corrected by a **reversal entry** (equal and opposite, linked to the original) that itself goes through draft → approval. The original stays in the ledger forever (Decision Sheet; Plan v1.1 §6, M8). |
| Monthly summary | Published entries are automatically included in the monthly summary (computed, not hand-typed — doc 06 §9). The summary is published (`finance.reports.publish`) and is what the public sees. |
| Annual report | Yearly roll-up, published as a file (PDF) + metadata, with an `audited` flag. The prototype's `.txt` browser-generated download (Audit Findings §2.3) is replaced by a real published file. |

### 9.5 Blood request lifecycle (M6)

Per Engineering Plan v1.1 §9.3:

```
submitted ──(matching donors notified)──▶ notified
   │                                              │
   │                                              ▼
   │                                     donor responds "I can help"
   │                                              │
   │                                              ▼
   │                                     donor grants consent ──▶ number revealed to requester (logged)
   │                                              │
   │                                              ▼
   └──────────────────────────── fulfilled / cancelled ──▶ donor last_donation_date updated (if fulfilled)
```

| Rule | Detail |
|---|---|
| Submission | Public (no login required), group + units + hospital + contact (Audit Findings §2.4). Creates a real record (the prototype created none — Audit Findings §3 #19). |
| Matching | Donors matching the group and area, who are **available** (computed 90-day rule — doc 04 §7.3), are notified. Unavailable donors are not notified and cannot respond. |
| Response | A donor responds "I can help" (`blood.requests.respond`). This is a donor-side action. |
| Consent | The donor grants consent for **that request** (`blood.consents.grant`). Only then is the number revealed to the requester (`donors.view_contact`), and the reveal is audit-logged. Consent expires with the request; revocation hides the number immediately. |
| Fulfilment | When the request is fulfilled, the donor's `last_donation_date` is updated (by the donor or the coordinator, confirmed by the donor). This drives the 90-day availability computation. |

---

## 10. Queues, caching, scheduler, and search

### 10.1 Queue driver to start: database

Per the Decision Sheet and Research Notes §7.1: **the queue driver is `database` to start**. Zero new services; the default `QUEUE_CONNECTION` in Laravel's shipped config is already `database`.

- The `jobs` and `failed_jobs` tables are the standard Laravel tables (created by the default migration).
- The database driver uses `FOR UPDATE SKIP LOCKED` on PostgreSQL, so concurrent workers do not double-claim jobs.
- **Transactional participation is a feature, not a footnote:** a job dispatched inside a rolled-back transaction never exists. This is relied on by the audit-log rule (doc 04 §5.7) — a notification job dispatched by a service that then rolls back is correctly never sent.
- **The worker runs under Supervisor/systemd, never `queue:listen` in production** (Research Notes §7.1). `queue:listen` reloads the framework on every job and is a development tool.
- **Queue routing by class** (`Queue::route(...)`, §2.4) assigns jobs to queues centrally: e.g. notifications on `notifications`, media processing on `media`, backups on `maintenance`. A single worker processes the default queue; additional workers are added per queue when volume justifies it.

### 10.2 When Redis + Horizon is justified (and not before)

**Redis + Horizon v5 is adopted only when one of these triggers is met** (Decision Sheet; Research Notes §7.1):

- (a) queue latency becomes user-visible (a notification that should arrive in seconds takes minutes because the database worker's `--sleep` interval dominates);
- (b) Horizon monitoring is wanted (throughput/failure metrics, auto-scaling configuration);
- (c) job volume grows past ~10 jobs/second sustained.

Expected Phase 1 volume is a few jobs an hour to a few thousand a day (notifications, expatriate-request emails, nightly cleanup, backup jobs) — far below the database driver's comfort zone. Adopting Redis on day one would add a service to run, monitor, back up, and secure, for no measured benefit. When Redis is adopted, the cache moves to Redis at the same time (§5.8), sessions stay on `database`, and Horizon v5 is installed (Horizon is Redis-only — it does not work with the database driver).

### 10.3 Scheduler jobs

The Laravel scheduler (`routes/console.php`, run by a single cron entry) owns all recurring work. Phase 1 scheduled jobs:

| Job | Schedule | Purpose |
|---|---|---|
| `sanctum:prune-expired` | Daily | Delete expired Sanctum tokens. |
| 72-hour stale-request reminder | Hourly (scan) | Find `in_progress` expatriate requests with no update in 72 hours; notify the Super Admin (§9.1). |
| Notice auto-archive | Hourly | Move expired notices to `archived` (§9.3). |
| Scheduled content publish | Every 5 minutes | Publish content whose `publish_at` has arrived (§9.3). |
| Statistics cache refresh | Every 15 minutes (or on-write invalidation — §5.8) | Recompute cached aggregates if the TTL approach is used. |
| `backup:run` | Nightly | Database + uploads backup (see §11 / doc 06 §12). |
| `backup:clean` | Weekly (or with each run, per package config) | Prune old backups per the retention policy. |
| Failed-job / queue-health check | Hourly | Surface stuck or repeatedly-failing jobs to the system-health view (M10). |
| Donor availability recompute | Daily | Recompute the `available` derivation where it is materialised (if it is computed on read, this job is unnecessary — the implementation decides; the rule is the 90-day computation, not the mechanism). |
| Push-subscription cleanup | Weekly | Remove expired/invalid Web Push subscriptions (endpoints that return 410 Gone). |

### 10.4 Search

Per the Decision Sheet and Research Notes §7.3: **start with Scout's `database` engine** (or plain `whereFullText` / `whereLike` Eloquent queries — `whereLike()` exists since Laravel 11.34 and emits `LIKE` on MySQL, `ILIKE` on PostgreSQL). No external search service on day one.

- **What is searchable:** directory entries (name/role/area, BN+EN), donors (name/area), activities, notices/news/events/jobs (title/body), FAQs. Search is scoped by the caller's permissions (a public search never returns members-only or private records).
- **Meilisearch later, only if justified:** typo tolerance, faceting, or Bengali search quality demonstrably failing. It is a clean additive swap behind the Scout driver, not a rewrite. The trigger is evidence (a failed empirical test — §3.4), not enthusiasm.
- **Bengali FTS quality is unverified** (§3.4). No search-quality claim is made in this blueprint.

### 10.5 Media pipeline — see §11

The media pipeline is described in §11 (its own section, because it spans upload, scanning, variants, and storage).

---

## 11. Media pipeline and storage

### 11.1 Storage to start: local `public` disk

Per the Decision Sheet and Research Notes §7.4: **start on the local `public` disk via the Storage facade**. All file access goes through `Storage` — **never hard-coded `public_path()` writes** — so the disk can be flipped to S3-compatible later without touching call sites.

- **Public files** (gallery photos, activity images, constitution PDFs, annual reports): stored on the `public` disk, served by plain URL.
- **Private files** (voucher images attached to finance entries, expense voucher photos that contain personal data, member photos where the member has not consented to public display): stored on the **non-public `local` disk** and served through a **controller + signed URL** (`temporaryUrl()`), with a policy check on every request. A private file is never reachable by guessing a URL.
- **Move to S3-compatible later when:** (a) media volume outgrows comfortable VPS disk, (b) a CDN is wanted, or (c) off-server durability is required before backups are proven. S3-compatible services (Cloudflare R2, MinIO, DigitalOcean Spaces, Wasabi, Backblaze B2) use the same Flysystem `s3` driver with a custom `endpoint` — the switch is configuration, not code.

### 11.2 Upload → scan → variants → storage

| Step | Rule |
|---|---|
| **Upload** | Through a Form Request (size limit, MIME allow-list, image-dimension limits — §5.2). Maximum sizes are configuration (e.g. 10 MB per photo, 200 MB per video — set at build time and recorded in the runbook; the prototype had no limits because it had no uploads). |
| **Scan** | Uploaded files are scanned before they are stored as usable: MIME-type verification (not just the extension), and — where the hosting provides it — an antivirus scan. A file that fails verification is rejected and the rejection is logged. The scan step is a queued job where the scanner is asynchronous; it is synchronous validation where the check is cheap (MIME/dimensions). |
| **Variants** | Images get derived variants via a queued job (Plan v1.1 §6, M7): a thumbnail and a WebP conversion, at the sizes the frontend needs. The original is kept. Video uploads get a size limit and a poster frame (Plan v1.1 §6, M7). Variants are generated once, stored alongside the original, and referenced by the `media` record (doc 06 §5). |
| **Storage** | The `media` record (doc 06) holds the disk, path, MIME type, size, dimensions, variants, consent flags, and the polymorphic link to the owning record. The file path is never constructed by string concatenation in a controller. |
| **Consent** | Every photo of an identifiable person carries a consent flag (doc 06 §11). A photo without recorded consent is not published. The prototype's images are demo images with no consent record (Audit Findings §5.6) — that is precisely why none of them is migrated. |
| **Deletion** | Deleting a media record (soft-delete) removes it from public view immediately; the file is removed from storage after the retention/grace period (or immediately, where the deletion is a consent withdrawal — the consent rule governs, see doc 06 §11). |

---

## 12. Notification service (M9)

Per Engineering Plan v1.1 §6 (M9): **one Notification Service — every module sends through it.** No module sends a notification directly.

### 12.1 Channels (Phase 1)

| Channel | Status | Notes |
|---|---|---|
| **In-app** (database notifications + bell icon) | Phase 1 — primary record | Every notification is stored as a database notification (recipient, title, body, link, read/unread, timestamp). The bell/badge UI reads this list. This is the durable record; the other channels are delivery attempts for it. |
| **Browser Web Push (VAPID)** | Phase 1 — primary delivery for helpers | Service Worker + VAPID. A helper grants permission on first dashboard login; the subscription (endpoint + keys) is stored in `push_subscriptions` (doc 06 §2). Works even when the browser is closed. Clicking the notification opens the relevant request directly. **No SMS cost** (Plan v1.1 §5). |
| **App Push (FCM/APNs)** | Phase 3 (with the Flutter app) | Device tokens stored in `user_devices` (doc 06 §2). The service is built so that adding the FCM/APNs channel later is a new channel class, not a redesign. |
| **Email** | Phase 2 (optional) | Not in Phase 1 — there is no email service in scope and no email field in the prototype. When adopted, it is a channel on the same service. |
| **SMS** | Not planned | Explicitly excluded (Plan v1.1 §6, M9: "SMS আপাতত নেই" — no SMS for now). The Phase 1 requirement is browser notification, not SMS. |

### 12.2 What triggers a notification

| Event | Recipients | Channel |
|---|---|---|
| New expatriate request submitted | All Expatriate Helpers + all Super Admins | Web Push + in-app (Decision Sheet). Urgent requests also notify the backup helper (Plan v1.1 §9.1). |
| Request status changed | The applicant (Member, if registered / or by tracking — the applicant is notified in-app if they have an account; otherwise the status is visible by tracking) + the assigned helper + Super Admins | In-app (+ Web Push to the helper where the change needs action). |
| Request assigned to a helper | That helper | Web Push + in-app. |
| 72-hour no-update reminder | Super Admin | In-app + Web Push. |
| Member registration approved / rejected | The applicant | In-app (and shown on next login). |
| New blood request (matching group/area) | Matching available donors | Web Push + in-app (donors who have the app / push enabled). |
| Donor consent requested | The specific donor | Web Push + in-app. |
| Donor consent granted | The blood-request requester | In-app. |
| Finance entry published / reversal created | Super Admins | In-app. |
| Urgent notice published | All Members (and helpers/admins) | Web Push + in-app + homepage ticker. |
| Contact message received | Super Admins | In-app. |
| System: backup failed / queue stuck | Super Admins | In-app (+ a visible banner in the admin panel). |

### 12.3 Delivery log and preferences

- **Every send is logged** (M9): recipient, channel, notification id, timestamp, success/failure, and (for Web Push) the provider's response. The log is viewable by Super Admins (`notifications.view_log`) and is the evidence that a notification was or was not delivered.
- **Preferences:** a user can turn off browser/app notifications from their settings (Plan v1.1 §6, M9). Turning off notifications does **not** turn off the in-app record — the in-app list is the durable record and is always kept. A helper who turns off Web Push still sees the queue badge in the dashboard; the organisation should treat a helper with notifications off as a staffing risk, not a system state.
- **Reverb (realtime):** Laravel Reverb v1 is **optional** for Phase 1. The new-request → helper notification can be delivered by Web Push + database notifications + a short poll on the dashboard — at this scale, that is sufficient and simpler. Reverb (self-hosted WebSockets + Laravel Echo) is adopted only if the organisation wants true realtime dashboard updates (e.g. the queue updating live without a refresh). The Reverb database driver is **unverified** — do not rely on it (Research Notes §8, §9). If Reverb is adopted, it uses its Redis driver, which implies the Redis adoption in §10.2.

---

## 13. Backup and recovery (summary — detail in doc 06 §12)

- **Tool:** `spatie/laravel-backup` v10 (Decision Sheet; Research Notes §7.5).
- **Schedule:** nightly `backup:run` — database (`pg_dump`) + uploads (`storage/app/public`).
- **Destinations:** local **plus one off-server S3-compatible disk**. The package's own documentation warns: *"If you only use the local disk … and that disk crashes you will have nothing left but tears"* (Research Notes §7.5). A local-only backup is not a backup.
- **Cleanup:** `backup:clean` on schedule, per the retention policy (30 days — doc 06 §12).
- **Restore test:** **monthly automated restore check + quarterly full restore rehearsal, mandatory, documented** (doc 06 §13, doc 11 §6.3, ADR-013). Untested backups are the common failure; the restore test is a scheduled, evidenced activity, not a hope.
- **RPO 24 hours / RTO 4 hours** (per Engineering Plan v1.1, cited in the Decision Sheet). Nightly backups give an RPO of up to 24 hours; the RTO of 4 hours is the target for restoring the application and database from the off-server backup onto a fresh VPS.
- **Exclusions:** `storage/framework` (cache/views/sessions) is excluded. **Never put an unencrypted `.env` in a backup.**

---

## 14. Testing, quality, and performance

### 14.1 Testing

- **Framework:** Pest 4 / PHPUnit 12 (conservative default — §2.3). Pest 5 is an opt-in only.
- **Coverage target:** **80%+ of business logic** (Engineering Plan v1.1, cited in the Decision Sheet). "Business logic" means services, policies, and state machines — not framework boilerplate. Coverage is measured and reported in CI; a drop below the target blocks a merge.
- **What is tested (minimum):** every state-machine transition (legal and illegal), every policy (granted and denied, including the 403-vs-404 distinction — doc 04 §7.5), the finance separation-of-duties rule (self-approval rejected), the last-Super-Admin guard (doc 04 §3.2), donor-consent reveal (no grant → no number; grant → reveal + log; revoke → hidden), public-tracking privacy (no PII in the public view), the expense-or-declaration rule for completion (§9.1), and the audit-log write in the same transaction as the action.
- **Test types:** unit (services, policies), feature (API endpoints, full request/response), and — where the Filament panel has custom logic — panel tests using Filament's test utilities (compatible with Pest or PHPUnit — Research Notes §4).
- **Browser testing (Dusk):** not required in Phase 1. The frontend is a separate build with its own testing; the backend's contract is the API, tested at the HTTP layer.
- **CI/CD:** GitHub Actions (Plan v1.1, cited in the Decision Sheet): run Pint, Larastan, and the Pest suite on every push/PR. Docker for the deployment image (Plan v1.1). Deployment itself is an operations decision.

### 14.2 Performance budgets (plan figures — not commitments)

Per Engineering Plan v1.1, cited in the Decision Sheet as **plan estimates, not commitments**:

- Homepage LCP ≤ 2.5 s on mobile 4G; API p95 ≤ 300 ms; Lighthouse 90+; 500 concurrent users; 99.5% uptime.
- These are the budgets the implementation is measured against. If a budget cannot be met on the single VPS, the shortfall is reported with evidence and the budget is revisited — the budget is not silently lowered.

### 14.3 Observability

- Structured logging (§7.2), the M10 system-health view (queue depth, last backup date, failed jobs, storage use), and the notification delivery log (§12.3) are the Phase 1 observability surface.
- **Laravel Pulse** (server/application monitoring) is available as a future addition; it is not adopted on day one.
- Uptime monitoring (external) and error tracking are operations decisions, recorded in the runbook.

---

## 15. Changes from Engineering Plan v1.1

This document **agrees** with Engineering Plan v1.1 on: the modular monolith (§4), the M1–M12 module catalogue, one API/one database, PostgreSQL, Sanctum, Spatie Permission, Filament admin, Next.js public web, Flutter app later, the state machines (§9), statistics computed not stored, money entries never edited/deleted (reversal only), RPO 24h / RTO 4h, the API-first approach under `/api/v1` (108-endpoint inventory in doc 07; the plan estimated ~70), Web Push (VAPID) + FCM/APNs, and the performance budgets (§14.2, as plan figures).

It **diverges** from the plan, with reasons, in the following places (per the Decision Sheet's divergence list):

1. **Laravel 12 → Laravel 13** (§2.1). Reason: Laravel 12 bug fixes ended 13 Aug 2026; security fixes end 24 Feb 2027. A new project on Laravel 12 would be security-only from day one.
2. **Design tokens/fonts** — the plan's tokens (Forest `#14532D`, Gold `#C9A227`, Hind Siliguri/Noto Serif Bengali) are **superseded by Direction D** (§6.1). Direction D is the approved frontend direction.
3. **Plan versions superseded** (§2.3): Filament 3 → 5; PostgreSQL 16 → current major at scaffold time; Redis 7 + Horizon as day-one → deferred to when justified (§10.2); Next.js 15 / Flutter 3.x → verify current stable at build time.
4. **Queue/cache to start: database, not Redis** (§10.1, §5.8). The plan lists Redis + Horizon without a trigger. This blueprint starts on the database driver and adopts Redis only on a stated trigger (§10.2), because Phase 1 volume does not justify a second service.
5. **Media storage to start: local `public` disk, not S3-compatible** (§11.1). The plan lists S3-compatible storage. This blueprint starts local (via the Storage facade, so the switch is configuration) and moves to S3-compatible on a stated trigger.
6. **Search to start: Scout `database` engine, not Meilisearch** (§10.4). Meilisearch is a later, evidence-triggered addition.
7. **Reverb: optional, not assumed** (§12.3). The plan's notification design does not require realtime WebSockets; Web Push + database notifications + dashboard polling meet the Phase 1 requirement. Reverb is adopted only for live dashboard updates.
8. **Prototype status corrections** (§6.1): the plan was written against the v1/editorial prototypes; this blueprint is written against the audited Direction D prototype and records where its behaviours are simulated and must be replaced (login, registration, consent, finance report, random Request IDs).

## 16. Open questions

| # | Question | Status |
|---|---|---|
| D11 | Expatriate wizard is 3 steps in the build, 4 in Design System §7.1. No state-machine impact (§9.1). Frontend build to confirm the step count. | Under review |
| ARCH-1 | PHP 8.4 (conservative) vs 8.5 (longest runway) — decide at scaffold time against the hosting environment. | Under review — decide at scaffold |
| ARCH-2 | PostgreSQL major version at scaffold time — verify against postgresql.org; do not assert dates from secondary sources. | Under review — verify at scaffold |
| ARCH-3 | Exact token expiry for mobile (Sanctum) and exact throttle numbers (§7.4) — configuration decisions, record in the runbook. | Under review — decide at build |
| ARCH-4 | Bengali full-text search quality — empirical test required before any quality claim (§3.4). | Under review — test with real data |
| ARCH-5 | Filament Shield plugin — not verified; adopt only after a version/maintenance/compatibility check, or wire the hooks by hand (§6.3). | Under review |
| ARCH-6 | Reverb adoption for live dashboard updates — optional; decide after Phase 1 notification delivery is proven. | Under review |

---

*End of doc 05. Companion: `04-USER-ROLES-PERMISSIONS.md` (RBAC), `06-DATABASE-DESIGN.md` (schema), `diagrams/ERD.md` (relationships).*
