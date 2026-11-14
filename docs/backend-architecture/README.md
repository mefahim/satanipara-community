# Satanipara Community — Backend Architecture Documentation

**Project:** Satanipara Community (Satanipara Somaj Kallyan Sangha, est. 1999)
**Phase:** Phase 0 — Laravel backend blueprint (documentation only)
**Status of this document set:** Planned — none of the backend described here is implemented.
**Date:** 2026-11-14
**Single source of truth:** `~/workspace/satanipara-phase0/decision-sheet.md` (the Decision Sheet). Where any
document in this set conflicts with the Decision Sheet, the Decision Sheet wins; the conflict must be flagged
to the Phase 0 coordinator.

---

## 1. Purpose

This document set is the backend blueprint for the Satanipara Community platform. It exists so that a
development team that has never seen the project can build the Laravel backend, the Filament admin panel,
the public API, and (later) the Next.js public website and the Flutter mobile app without guessing — and
without mistaking the existing prototype for a working system.

There are two things in this project that must never be confused:

1. **The prototype** — a static, single-file HTML/CSS/JS demonstration (Direction D, `index.html` in
   [mefahim/satanipara-community](https://github.com/mefahim/satanipara-community), HEAD `6792f5e`).
   It is **Implemented** as a prototype: it renders, its flows can be clicked through, and it was verified
   live on 2026-11-14 with 0 console errors. It has no server, no database, no real authentication, and
   no persistence. Every name, figure, and record in it is **demo data**.
2. **The planned backend** — a Laravel 13 modular monolith with a MySQL 8.4 LTS (InnoDB) database, a Sanctum-secured
   REST API (`/api/v1`), and a Filament 5 admin panel, as specified in this document set. It is **Planned**,
   not built. Nothing in these documents describes backend work as implemented.

This set therefore does two jobs at once: it records, faithfully, what the prototype actually does (so the
backend reproduces the approved behaviour and fixes the prototype's known defects), and it specifies what
must be built from scratch (authentication, persistence, admin, notifications, finance ledger, audit log,
and everything else that has no prototype counterpart at all).

## 2. Phase 0 scope

Phase 0 is documentation and design only. It produces the blueprint; it does not write application code,
create migrations, build a dashboard UI, or redesign Direction D.

**In scope for Phase 0:**

- A factual audit of the prototype repository (what exists, what is simulated, what is missing).
- Product requirements distilled from the audit and from Engineering Plan v1.1.
- A complete inventory of every piece of content that must become dynamic.
- The data, API, authentication, authorisation, notification, finance, and audit design (in the
  numbered blueprint documents — see §4).
- Open questions and assumptions, stated explicitly, with nothing resolved by guessing.
- Measurable acceptance criteria for every module and for the Phase 0 documentation itself.

**Out of scope for Phase 0:**

- Writing Laravel/PHP code, migrations, seeders, or tests.
- Building the Filament admin panel or any dashboard UI.
- Building the Next.js website or the Flutter app (both are later phases).
- Any redesign of Direction D. Direction D is the approved frontend direction; its design tokens, the
  Meridian, and its typography are governed by `docs/direction-d/DESIGN_SYSTEM.md` in the prototype
  repository, not by this blueprint.
- Any change to the live prototype repository. The new root README is drafted as a separate file
  (`README-new.md` in the Phase 0 workspace) and is not applied to the repository by this work.

**Phase 1 scope (fixed by the Decision Sheet, Fahim's word 2026-11-14, FINAL for Phase 1):**

- Admin roles: only two — **Super Admin** and **Expatriate Helper**. All other roles (President, General
  Secretary, Treasurer, and others) are deferred.
- **No OTP** anywhere. Login is mobile number + password only. Forgotten passwords are reset by the
  Super Admin (the mechanism is an open question — see document 13).
- A new expatriate request triggers a browser/push notification to the Super Admin and all Helpers.
- **Excluded from Phase 1:** online payment/donation gateway, NID verification, live chat, video calls,
  e-commerce, and online courses.

## 3. How to read these documents

- **Read in order.** Document 01 establishes the facts; document 02 states what must be built;
  document 03 lists every dynamic content item; documents 13 and 14 state what is still undecided and
  how completion will be judged. The remaining numbered documents (04–12) cover the technical design
  in depth and are written by the parallel blueprint workstreams.
- **Status labels are part of the content.** Every feature, module, and requirement carries one of four
  labels, used exactly as defined by the Decision Sheet:
  - **Implemented** — live in the prototype (within its simulated limits).
  - **Planned** — agreed and specified, but not built.
  - **Under review** — proposed or partially agreed; a decision is still open.
  - **Not yet implemented** — identified as needed, with no design or decision yet.
  
  Planned backend work is never described as implemented. Where a prototype feature is labelled
  "Implemented (simulated)", the word "simulated" is part of the label: the UI works, but there is no
  server behind it.
- **Demo data is never real data.** Figures, names, phone numbers, and finance rows quoted from the
  prototype are reproduced only so the backend team knows exactly what must be replaced. They are
  labelled demo wherever they appear. Unverified statistics are shown in the prototype as
  "তথ্য হালনাগাদ হচ্ছে" ("information being updated") — the backend must preserve that behaviour and
  never invent a figure.
- **No prices appear anywhere in this blueprint.** Pricing and quotation are separate, recommendations
  only, not final, and not sent. Do not add prices to any document in this set.
- **No patch version numbers.** Dependencies are given as major constraints only (for example Laravel
  `^13.0`, Sanctum `^4.0`, Filament `^5.0`, Spatie Laravel Permission `^8.0`). Exact patch versions are
  resolved from Packagist at scaffold time.
- **Bengali terms** appear in parentheses where they first occur. Documentation is in professional
  English; user-facing Bengali strings are specified in the content inventory (document 03) and in the
  API/error conventions.


> **Phase vocabulary (Phase 0.1).** Three phase schemes exist in the blueprint's sources and must not be confused: **Product Phase 1** is the Decision Sheet scope (the whole Phase 1 product = Doc 12 Phases 1–9); **Roadmap Phase N** is a Doc 12 phase (an unqualified "Phase N" means a Doc 12 phase); **Plan Phase N** is an Engineering Plan v1.1 phase, always written as "plan Phase N". **Sprint 1** is the first development sprint of Phase 1 (foundation). Canonical module→phase map: M1→Ph2, M2/M3→Ph3, M4/M7→Ph4, M5/M6→Ph5, M8→Ph6, M9→Ph5 (partial) + Ph7 (remainder), M10→Ph8 (separate approval), M11→Ph7, M12→Future Mobile (Doc 12 §1.5).

## 4. Document map

| # | Document | One-line summary |
|---|---|---|
| — | `README.md` (this file) | Index, purpose, scope, conventions, and change process for the whole set. |
| 01 | `01-REPOSITORY-AUDIT.md` | The published condensation of the Phase 0 repo audit: what the prototype is, what it does, and what it does not do. |
| 02 | `02-PRODUCT-REQUIREMENTS.md` | Product requirements: vision, users, modules M1–M12, numbered testable requirements, non-functional targets, constraints, and out-of-scope list. |
| 03 | `03-DYNAMIC-CONTENT-INVENTORY.md` | Every content item that must become dynamic, per module, with fields, workflow, states, permissions, and retention. |
| 04 | `04-USER-ROLES-PERMISSIONS.md` | User roles and permissions — RBAC and governance; Phase 1 two-role model, granular permission catalogue, full Role–Permission Matrix. |
| 05 | `05-BACKEND-ARCHITECTURE.md` | Backend architecture: Laravel 13 modular monolith, MySQL 8.4 LTS, Sanctum auth, state machines, queues, media, notifications. |
| 06 | `06-DATABASE-DESIGN.md` | Database design: 47 application tables in 7 domains (49 defined, 57 physical), per-table schema, migration order, financial integrity, privacy, backup/recovery. |
| 07 | `07-API-ARCHITECTURE.md` | API architecture: `/api/v1`, response/error envelopes, pagination, rate limits, and the full 132-endpoint inventory. |
| 08 | `08-SECURITY-ARCHITECTURE.md` | Security architecture: OWASP Top 10 threat model, controls, encryption, uploads, incident response, acceptance. |
| 09 | `09-ADMIN-DASHBOARD-REQUIREMENTS.md` | Admin dashboard functional requirements (planning only — no UI): per-module screens, actions, filters, permissions, states. |
| 10 | `10-TESTING-QUALITY-STRATEGY.md` | Testing and quality strategy: PSR-12, Pest/PHPUnit, API contract tests, CI/CD, observability, performance budgets. |
| 11 | `11-DEPLOYMENT-OPERATIONS.md` | Deployment and operations: environments, VPS hosting, Docker, CI/CD, monitoring, backup/DR, handover. |
| 12 | `12-DEVELOPMENT-ROADMAP.md` | Development roadmap: Phase 0–9 plus mobile, per-phase scope, deliverables, dependencies, risks, acceptance. |
| 13 | `13-OPEN-QUESTIONS-AND-ASSUMPTIONS.md` | Every open question and every assumption, each with what would invalidate it and who must decide. |
| 14 | `14-ACCEPTANCE-CRITERIA.md` | Measurable acceptance criteria per module and per cross-cutting area, plus the Phase 0 quality gate. |

### Architecture decision records (`adr/`)

| ADR | Decision | Status |
|---|---|---|
| `adr/ADR-001-laravel-version.md` | Laravel version (13) | Confirmed |
| `adr/ADR-002-php-version.md` | PHP version (8.4 / 8.5, floor 8.3) | Confirmed |
| `adr/ADR-003-database.md` | Database (MySQL 8.4 LTS + InnoDB) | Confirmed |
| `adr/ADR-004-authentication.md` | Authentication (Sanctum) | Confirmed |
| `adr/ADR-005-rbac-implementation.md` | RBAC implementation (Spatie Permission v8) | Confirmed |
| `adr/ADR-006-api-architecture.md` | API architecture (REST, API-first, `/api/v1`) | Confirmed |
| `adr/ADR-007-media-storage.md` | Media storage (local first, S3-compatible later) | Recommended |
| `adr/ADR-008-queue-driver.md` | Queue driver (database first) | Recommended |
| `adr/ADR-009-cache-driver.md` | Cache driver (database first) | Recommended |
| `adr/ADR-010-search-strategy.md` | Search strategy (Scout `database` engine first) | Recommended |
| `adr/ADR-011-admin-frontend-strategy.md` | Admin frontend strategy (Filament 5) | Confirmed |
| `adr/ADR-012-deployment-architecture.md` | Deployment architecture (single VPS, Docker, GitHub Actions) | Recommended |
| `adr/ADR-013-backup-strategy.md` | Backup strategy (spatie/laravel-backup v10, off-server, restore tests) | Confirmed |

`adr/README.md` is the ADR index: purpose, status vocabulary, and how to write a new ADR.

### Diagrams (`diagrams/`)

| Document | Contents |
|---|---|
| `diagrams/SYSTEM-ARCHITECTURE.md` | System architecture (Mermaid): clients → Laravel 13 API → MySQL 8.4 LTS, queue/cache, storage, push services. |
| `diagrams/ERD.md` | Entity Relationship Diagram (Mermaid `erDiagram`) for all 47 application tables, plus a written relationship guide. |
| `diagrams/RBAC-MATRIX.md` | Role–Permission Matrix (Mermaid + tables): Phase 1 roles, Member, Public; deferred roles in a marked future section. |
| `diagrams/API-FLOW.md` | API flows (Mermaid sequence diagrams): expatriate lifecycle, login, blood consent, finance entry, content publish. |

## 5. Conventions

### 5.1 Naming

- **Modules:** M1–M12, exactly as in Engineering Plan v1.1 §6 — M1 Identity & Membership, M2 Community
  Profile, M3 Organisation, M4 Annual Activities, M5 Expatriate Support, M6 Blood Donor, M7 Content,
  M8 Finance, M9 Notifications, M10 Admin & Reporting, M11 Public Web Experience, M12 Mobile App.
- **Request IDs:** `EXP-YYYY-####` (for example `EXP-2026-1052`). Server-generated, unique, never reused.
- **Expatriate request status enum:** `pending → accepted → in_progress → completed → closed`, plus
  `rejected` and `cancelled`.
- **API base:** `/api/v1`. Success envelope: `{"data": ..., "meta": {...}}`. Error envelope:
  `{"message_bn": "...", "message_en": "...", "error": {"code": "..."}}`.
- **Money:** BDT, `decimal numeric(12,2)`, never float. Ledger entries are immutable; corrections are made
  only by reversal entries.
- **Roles (Phase 1):** `super-admin`, `expatriate-helper`. `Member` is a registered community user, not an
  admin role. `Public` is an unauthenticated visitor.
- **Permissions:** `resource.action` (for example `members.view`, `expatriate.requests.assign`,
  `finance.approve`, `donors.view_contact`, `audit_logs.view`).
- **Requirements:** numbered `REQ-<module>-<n>` (for example `REQ-M5-014`).

### 5.2 Status labels

Implemented / Planned / Under review / Not yet implemented — as defined in §3 above. Every feature table
in this set uses them. A feature that exists in the prototype only as a simulation is labelled
"Implemented (simulated)" with a note of what the simulation omits.

### 5.3 Language

Documents are in professional English. Bengali terms appear in parentheses on first use. User-facing
strings (including error messages) are specified in both Bengali and English, with Bengali as the
fallback language where a translation is missing (per Engineering Plan v1.1 §7).

### 5.4 Sources and citation

- The **Decision Sheet** (`~/workspace/satanipara-phase0/decision-sheet.md`) is the single source of
  truth and overrides everything else.
- The **audit** (`~/workspace/satanipara-phase0/audit-findings.md`) is the factual basis for every claim
  about the prototype. File paths in the prototype repository are cited where useful (for example
  `index.html`, `docs/direction-d/QA_REPORT.md`).
- The **research notes** (`~/workspace/satanipara-phase0/research-notes.md`) are the basis for every
  technology fact (Laravel 13, PHP, Sanctum, Filament 5, Spatie v8). All technology facts in these
  documents were verified against primary sources on 2026-11-14; anything not verified is marked as
  such.
- **Engineering Plan v1.1** (the 19-page Bengali plan,
  `~/workspace/your_files/satanipara-community-engineering-plan/satanipara-community-engineering-plan.pdf`)
  is cited as "Engineering Plan v1.1 §n" wherever this blueprint agrees with it. Where the blueprint
  diverges from the plan, the divergence is stated explicitly with reasons (see §6 below).

## 6. Relationship to Engineering Plan v1.1

This blueprint **agrees with** Engineering Plan v1.1 on its core architecture, and cites it throughout:

- Laravel modular monolith + REST API; MySQL 8.4 LTS + InnoDB; Sanctum; Spatie Permission; Filament admin; Next.js
  public web; Flutter app; one API and one database (plan §3–§4, §6–§8).
- 39 tables named in 7 domains in the plan (§7 — the plan states 38; the mechanical count is 39, Doc 06 §1.4), extended to 47 application tables in this blueprint
  (doc 06); 132 endpoints under `/api/v1` in the full inventory (doc 07), against the plan's ~70
  estimate (§8).
- Expatriate state machine `pending → accepted → in_progress → completed → closed`, with
  `rejected`/`cancelled` (plan §9).
- Statistics computed from data, never hand-typed (plan §7).
- Money entries never edited or deleted, only reversed (plan §7–§8).
- RPO 24 hours / RTO 4 hours (plan §12).
- Website approximately 12 weeks, with apps approximately 18 weeks — **plan estimates, repeated as
  estimates, not commitments** (plan §15).
- Redis queue/cache + Horizon; S3-compatible media storage; Web Push (VAPID) + FCM/APNs; GitHub Actions
  CI/CD; Docker; Pest/PHPUnit with 80%+ business-logic coverage (plan §4, §13–§14).
- Performance budgets as plan targets (plan §14) — see document 02, §5.

This blueprint **diverges from** Engineering Plan v1.1 in three places, each stated explicitly with its
reason (per the Decision Sheet):

1. **Laravel 12 → Laravel 13.** The plan specifies Laravel 12. Laravel 12 bug fixes ended 2026-08-13
   and it is security-only until 2027-02-24; a new project starting on it would have only months of
   security runway. The blueprint recommends Laravel 13 (released 17 March 2026; PHP 8.3–8.5; bug fixes
   to Q3 2027; security to 17 March 2028), constraint `^13.0`.
2. **Design tokens and fonts.** The plan's tokens (Forest `#14532D`, Gold `#C9A227`, Hind Siliguri /
   Noto Serif Bengali) are superseded by Direction D: Deep Forest `#102E27`, Forest `#173F35`, Warm Gold
   `#C49A4A`, Cool White `#FBFBF8`, Ivory `#F7F4EA`; Anek Bangla variable (workhorse), Tiro Bangla
   italic (pull-quotes only), Manrope (English). Direction D is the approved frontend direction.
3. **Versions the plan pinned that are now superseded.** Filament 3 → Filament 5 (`^5.0`); PostgreSQL 16
   → MySQL 8.4 LTS (Phase 0.1, Confirmed — Fahim; ADR-003); Redis 7 + Horizon as
   day-one infrastructure → deferred until latency or volume justifies them (database queue/cache to
   start, per the research notes); Next.js 15 / Flutter 3.x → verify the current stable release at
   build time, do not assert. S3-compatible storage as the day-one media store → local `public` disk
   via the Storage facade to start, with S3-compatible storage when volume, CDN, or off-server
   durability requires it.

Where the plan and the prototype disagree (for example, the plan's 11-part homepage in §6 M11 versus
Direction D's 9-section home), the prototype's Direction D governs the frontend and the plan governs the
backend structure; the disagreement is recorded in document 01 and in the open questions (document 13).

## 7. How to propose changes

1. **Do not edit a published blueprint document silently.** Propose the change in writing to the Phase 0
   coordinator, naming the document and section, the current text, the proposed text, and the reason.
2. **Cite the source.** A change to a fact about the prototype must cite the audit or the repository
   file. A change to a technology fact must cite the research notes or a primary source checked at the
   time. A change that contradicts the Decision Sheet must be flagged as a Decision Sheet change, not
   smuggled in as an edit — only the coordinator (with Fahim's word where it is a scope decision) can
   change the Decision Sheet.
3. **Keep the status labels honest.** If a change moves something from Planned to Implemented, it must
   point to the implemented, verified work. Prototype simulations do not count as implementation.
4. **Keep the open questions open.** If a change answers an open question from document 13, record who
   decided it, when, and on what evidence — and remove the question from document 13 in the same change,
   so the two documents never disagree.
5. **No invented facts.** No dates, prices, statistics, or people may be added without a source. If a
   figure is needed and no verified figure exists, write "তথ্য হালনাগাদ হচ্ছে" (information being
   updated) as the content rule, and add an open question naming who must supply the figure.
6. **Version the set.** Any published revision records its date and what changed, in this README, so a
   reader can tell which revision of the blueprint a build was made against.

---

*End of index. Start with `01-REPOSITORY-AUDIT.md` for the facts, then `02-PRODUCT-REQUIREMENTS.md`
for what must be built.*
