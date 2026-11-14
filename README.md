# Satanipara Community

**Satanipara Somaj Kallyan Sangha (সাতানীপাড়া সমাজকল্যাণ সংঘ) — est. 1999**

Digital brand: **Satanipara Community**
Tagline: **একটি এলাকা, একটি পরিবার** (One area, one family)
Slogan: **শিক্ষা • ঐক্য • শান্তি • প্রগতি** (Education • Unity • Peace • Progress)

A premium, Bengali-first digital community platform — website first, mobile app later.
All content in this repository is **DEMO data only**: demo names, demo figures, demo photos
(clearly labelled "নমুনা ছবি · Demo image"). No real community statistics, personal
information, or financial records are in here. Real data must replace the demo content
before any public launch.

**Live site (GitHub Pages):** https://mefahim.github.io/satanipara-community/

---

## Overview

Satanipara Community is the digital platform of Satanipara Somaj Kallyan Sangha, a community
organisation founded in 1999. One area, one family: the platform keeps a verified databank of the
area's people, families, professionals, institutions, and places; publishes the organisation's
history, constitution, committee, and annual activities; runs expatriate support for families at
home, requested from abroad, with a transparent Request ID, a status timeline, and an itemised
expense account; runs a consent-based blood-donor service; publishes notices, news, events, jobs,
and galleries; and shows the organisation's accounts openly.

Two rules shape everything the platform does:

- **No service charge on expatriate support.** The applicant pays the actual cost of goods and
  transport only. There is no service-charge field anywhere in the system.
- **This is not an emergency service.** Expatriate support and the Emergency Response Team (3–5
  people) are not a replacement for official emergency services — call 999 first. This disclaimer is
  permanent on every expatriate-support surface.

## Organization background

Satanipara Somaj Kallyan Sangha was founded in **1999**. That founding year is the only verified
historical milestone in the platform today; the heritage timeline shows it and nothing else, and no
other date is invented. Year-by-year history will be added only where documents verify it. The
organisation's committee, advisory council, and former leaders are published on the Organization
page; the constitution is published as a versioned document (the prototype carries a 5-article sample
summary only — the full text must come from the organisation).

Where no verified figure exists, the platform shows "তথ্য হালনাগাদ হচ্ছে" ("information being
updated") instead of inventing a number. Member, family, and expatriate counts are computed from
real records once they exist — they are never hand-typed.

## Product vision

A single platform, one source of truth, three clients: a public website, a mobile app, and an admin
panel — all reading from the same backend and the same database. The website comes first and is the
complete web platform; the mobile app (Android and iOS) follows once the web platform is stable and
the API is proven. The admin panel is how the organisation runs the platform day to day: members and
approvals, community data, content, blood donors, finance, reports, and notifications — with every
admin action written to an audit log that cannot be deleted.

## Current prototype status

`index.html` is **Direction D** — the current design direction, and the approved frontend direction.
Open it (or the Pages URL above) and you get the full prototype: home, community directory,
organization, activities, expatriate support, blood donors, news/notices/events, gallery, financial
transparency, membership, contact, FAQ and privacy — 18 views in one file, with Bangla/English toggle
and light/dark theme. The site **always opens in light theme by default**, even in a dark-preferring
browser; the theme button switches manually for that session.

**Status: Implemented (simulated).** The prototype renders and its flows can be clicked through
(wizard → new Request ID, tracking, demo login, donor consent, lightbox, BN/EN, light/dark — verified
2026-11-14, 0 console errors). It is a static HTML/CSS/JS demonstration: it has no server, no
database, no real authentication, and no persistence. A page reload resets login, filters, drafts,
submitted requests, notifications, and donor consent. Every name, figure, and record in it is demo
data, and the demo accounts printed on the login view (`01700000000` / `demo1234` for a member,
`01700000001` / `helper1234` for a helper) are demo-only, with plaintext passwords in the source file
— they must never be carried into a real system. There is no Super Admin demo account.

`alternatives/` holds the two earlier directions, preserved untouched for comparison:

| File | Direction | In short |
| --- | --- | --- |
| `index.html` | **Direction D** (current) | "The Meridian" — editorial + Apple-inspired premium product UI |
| `alternatives/satanipara-editorial-redesign.html` | Editorial redesign | "Ivory paper, forest ink, one gold rule" — Bengali civic broadsheet |
| `alternatives/satanipara-v1-prototype.html` | v1 prototype | First full-site prototype (Hind Siliguri + Noto Serif Bengali) |

## The design sense — Direction D, in full

Direction D was built to feel like three things at once: an international award-winning editorial
website, an Apple-inspired premium digital product, and a distinctly Bengali community platform. The
one memorable idea is **The Meridian**: a single continuous 1px gold line that is both the home-page
heritage timeline (only the verified 1999 founding milestone — nothing invented) and the live status
line of an expatriate request (Pending → Accepted → In Progress → Completed). It starts at the
baseline of a full-bleed deep-forest hero field (`#102E27`, ~92vh). It is the **only** gold line on
the page.

- **Ground:** cool-white `#FBFBF8` (≥60% of every page); ivory is rationed to ≤30% (story sections
  only). The hero goes dark instead of light. At most two large forest fields per page (hero +
  footer).
- **Colour budget:** gold = one line + at most 3 point accents per viewport. No gold buttons, no
  gradients, no glassmorphism (except the sticky-nav backdrop blur), no excessive cards, no
  decorative shapes. Gold/brass text is banned below 32px — measured brass `#9A7B2E` on ivory is only
  3.64:1 contrast (gold on forest uses `#E4C98F`, 7.25:1).
- **Typography:** Anek Bangla (variable) is the single workhorse — display, UI and body, with
  hierarchy built by **weight and width, not size** (hero 800 condensed, titles 700, body 400 at
  17px/1.85). Tiro Bangla survives only as italic pull-quotes. Manrope for English. Fonts are
  self-hosted WOFF2 (no Google Fonts dependency at runtime); conjuncts (শ্র/ফ্র etc.) were verified
  rendered in headless Chromium on Linux. Fallback: Noto Sans/Serif Bengali.
- **Layout:** every section has its own composition — asymmetric grids, editorial storytelling,
  numbered service index, ledger tables, timeline, pull-quotes — never the generic "centered hero +
  three identical cards" formula. 9 differently-composed sections on the home page.
- **Mobile (the part that was fixed three times from real phone screenshots):** text and photos share
  a consistent **18px side gutter** at 360px — nothing clipped at the edges, no horizontal overflow.
  Photos are shown **whole** on phones (natural ratio, `object-fit: contain` below 860px); an earlier
  `object-fit: cover` treatment had sliced them to 22–34% of their width. Mobile header is a single
  slim row (max 56px).
- **Interaction:** hash routing, BN/EN toggle, light/dark toggle, search and filters, tabs,
  accordions, gallery lightbox (arrow keys + Escape), forms with inline validation, notifications UI,
  loading/empty/error/success states. Motion is subtle and respects `prefers-reduced-motion`.

### How the three versions differ

- **v1** — functional-first: 10 views, 14-section home, green cards with gold buttons, Hind Siliguri
  + Noto Serif Bengali. Rejected as a final visual direction, kept as the functional reference.
- **Editorial redesign** — the broadsheet: ivory-always ground, serif-led Tiro display, gold rules
  everywhere, 11 views, 16-beat home page. Also not approved.
- **Direction D (this one)** — the synthesis above: sans-led type, cool-white ground, dark hero, one
  gold line, product-like service interfaces.

## Pages & flows (Direction D)

- **Home** — hero, story (1999), heritage timeline, services, expatriate support, blood donation,
  activities & news, community stories, gallery, financial transparency, footer.
- **Community Profile / Directory** — search + filters over people, professionals, institutions and
  infrastructure (demo entries).
- **Organization** — history, constitution (accordion), executive committee, advisory council, former
  leaders.
- **Annual Activities** — year + category filters, activity detail pages.
- **Expatriate Support** — 3-step wizard (service → details → review) → submission → Request ID
  (`EXP-2026-XXXX`) → Meridian tracking timeline + expense ledger. **No service charge** — the
  applicant pays the actual cost of goods + transport only. An Emergency Response Team of 3–5 people
  handles urgent cases. **This is NOT a replacement for official emergency services (call 999
  first).**
- **Blood Donor** — blood-group + area filters, consent-gated phone numbers (masked until the donor
  consents), emergency blood request.
- **News / Notices / Events / Jobs** — category + year filters.
- **Photo & Video Gallery** — lightbox with keyboard navigation. (Video is a labelled placeholder in
  the prototype: "ভিডিও গ্যালারি শীঘ্রই আসছে".)
- **Financial Transparency** — income/expense, project accounts, annual reports (demo figures,
  clearly labelled).
- **Membership** — simulated login with **mobile number + password only (no OTP)**. Demo login:
  `01700000000` / `demo1234`. Member dashboard, profile, my requests, notifications.
- **Contact, FAQ, Privacy** — contact info, emergency numbers, FAQ accordion.

### Standing decisions (Phase 1 scope)

- Only **2 admin roles**: Super Admin (everything + user creation) and Expatriate Helper (expatriate
  requests only). President/GS/Treasurer and other roles are deferred to a later phase.
- **No OTP** anywhere — simple mobile + password login; Super Admin resets forgotten passwords.
- New expatriate requests trigger a browser notification to Super Admin and all Helpers (simulated in
  this prototype).
- No backend, database, payment, or real OTP in this phase — this is a static HTML/CSS/JS prototype.
  Real development (Laravel + MySQL 8.4 + Next.js + Flutter) is a separate, later phase.

## Planned Laravel backend architecture

> **Status: Planned — not yet implemented.** Nothing in this section describes a working system. It
> describes what will be built, so that the prototype is not mistaken for the product.

The backend is a **Laravel 13 modular monolith** (`^13.0`, PHP 8.4 or 8.5, floor 8.3) with a
**MySQL 8.4 LTS (InnoDB)** database, a **Sanctum**-secured REST API (`/api/v1`, `^4.0`), a **Filament 5** admin
panel (`^5.0`), and **Spatie Laravel Permission v8** (`^8.0`) for role-based access control — one API
and one database serving the public website (Next.js), the mobile app (Flutter, later), and the admin
panel. The full blueprint is in `docs/backend-architecture/` (see Documentation below).

Key architecture decisions (all verified against primary sources on 2026-11-14; patch versions are
resolved from Packagist at scaffold time, never asserted here):

- **Modular monolith, not microservices** — 12 modules (M1–M12), each with its own models, controllers,
  policies, and tests; modules communicate through service classes, never by querying each other's
  tables.
- **MySQL 8.4 LTS + InnoDB (Confirmed, Phase 0.1 — Fahim)** — project standard; ubiquitous on cheap Bangladeshi shared/cPanel hosting, same decimal integrity, `CHECK` constraints, generated columns, `FULLTEXT`. The Phase 0 PostgreSQL lean is superseded (ADR-003). Bengali FTS measured on MySQL 8.0.46 (ngram FULLTEXT + BOOLEAN MODE recommended — Doc 15 §9); re-test on 8.4 required.
- **Auth:** Sanctum cookie auth for the first-party web SPA (same top-level domain) and personal access
  tokens for the Flutter app. No refresh-token flow and no per-device session list exist in Sanctum
  itself — the design works around that.
- **RBAC:** Spatie Laravel Permission, Gate-native, with permissions named `resource.action` (for
  example `members.view`, `expatriate.requests.assign`, `finance.approve`, `donors.view_contact`,
  `audit_logs.view`). Filament has no built-in roles; access is enforced through gates/policies and
  Filament's `canAccessPanel()` / `can*()` hooks.
- **Queue/cache to start:** database driver for both (zero new services); Redis + Horizon only when
  latency or volume justifies them. Sessions on the database. Cache tags are not supported by the
  database/file drivers — no tag-dependent code is written unless Redis is adopted.
- **Search to start:** Scout `database` engine in **BOOLEAN MODE** (or `whereFullText`/`whereLike`); natural-language mode must NOT be the default (Doc 15 §9). Meilisearch later only
  if typo tolerance or Bengali search demonstrably fails.
- **Media to start:** local `public` disk via the Storage facade (never hard-coded `public_path()`
  writes); S3-compatible storage later when volume, CDN, or off-server durability requires it. Private
  files are served through controllers with signed URLs.
- **Backup:** spatie/laravel-backup v10, nightly database + uploads to local storage and one off-server
  S3-compatible disk, with a mandatory monthly automated restore check + quarterly full restore rehearsal. Recovery targets: RPO 24 hours, RTO 4
  hours.
- **Testing:** Pest 4 / PHPUnit 12, with 80%+ business-logic coverage as the target; every valid and
  invalid state-machine transition tested; API contract tests for every endpoint. Pint for style,
  Larastan for static analysis, Telescope for local development only.

**What the plan changed:** this architecture follows Engineering Plan v1.1 (Laravel modular monolith +
REST API, MySQL 8.4 LTS, Sanctum, Spatie, Filament, Next.js, Flutter, one API/DB, 47 application tables (49 defined, 57 physical), 134
endpoints, expatriate state machine, immutable ledger, RPO/RTO) except for three explicit divergences:
Laravel 12 → 13 (Laravel 12 bug fixes ended 2026-08-13, security-only until 2027-02-24); the plan's
design tokens/fonts → Direction D tokens (above); and the plan's pinned versions (Filament 3 → 5,
PostgreSQL 16 → MySQL 8.4 LTS (Phase 0.1, Confirmed — Fahim), Redis/Horizon and S3 as day-one → deferred until justified, Next.js 15 /
Flutter 3.x → verify current at build time).

## Major modules (M1–M12)

| Module | Name | Product phase (plan v1.1) | Roadmap phase (Doc 12) | In one line |
|---|---|---|---|
| M1 | Identity & Membership | Phase 1 | Phase 2 | Registration, login (no OTP), approval queue, profiles, family members, account deletion. |
| M2 | Community Profile | Phase 1 | Phase 3 | Households/persons databank, computed statistics, professionals directory, institutions and landmarks. |
| M3 | Organisation | Phase 1 | Phase 3 | History and timeline, constitution, term-based committee, advisory council, former leaders. |
| M4 | Annual Activities | Phase 1 | Phase 4 | Activities by year and category, with dates, descriptions, photos, beneficiary counts. |
| M5 | Expatriate Support | Phase 1 | Phase 5 | Request intake, Request ID, 5-state status machine, 4-node public timeline, helper assignment, expenses with photos, notifications. The most sensitive module. |
| M6 | Blood Donor | Phase 1 | Phase 5 | Donor register, group + area search, emergency blood requests, donor-side consent. |
| M7 | Content | Phase 1 | Phase 4 | Notices, news, events, jobs, gallery (photo; video in plan Phase 2), draft → review → published. |
| M8 | Finance | Phase 1 | Phase 6 | Immutable ledger, project accounts, public summary, annual reports. |
| M9 | Notifications | Phase 1 | Phase 5 (partial) + Phase 7 (remainder) | One notification service: Web Push (primary), in-app list, app push in plan Phase 3. No SMS. |
| M10 | Admin & Reporting | Phase 1 | Phase 8 (separate approval) | Filament dashboard, list/filter/export, activity-log viewer, system health. |
| M11 | Public Web Experience | Phase 1 | Phase 7 | The public website (Next.js): all content from the API, nothing hard-coded. BN/EN, light/dark. |
| M12 | Mobile App | Phase 3 | Future Mobile | Flutter Android + iOS: Home, Community, Services, Profile; offline cache; push deep-links. |

Canonical module→phase map (Doc 12 §1.5): M1→Ph2, M2/M3→Ph3, M4/M7→Ph4, M5/M6→Ph5, M8→Ph6, M9→Ph5 (partial) + Ph7 (remainder), M10→Ph8 (separate approval), M11→Ph7, M12→Future Mobile.

## Dynamic content strategy

Everything the prototype hard-codes becomes dynamic — managed in the admin panel, stored in the
database, and served by the API. Nothing on the public site is hard-coded in the client: home sections,
directory entries, committee terms, activities, news, notices, events, jobs, gallery items, finance
rows, project accounts, annual reports, FAQ entries, contact details, navigation, footer, SEO meta, and
notification templates are all content records with draft / review / published / archived states.

Three rules govern dynamic content:

1. **Statistics are computed, never hand-typed.** Counts come from the data and are cached (15
   minutes); where data is unverified, the site shows "তথ্য হালনাগাদ হচ্ছে".
2. **One source of truth.** Each fact lives in exactly one place — the prototype's duplications (the
   demo request rendered in 4 places, the 2026 finance rows rendered twice, the 1999 fact re-typed in
   6 places, policy copy re-typed in 4 places) are replaced by single records read by every view.
3. **Restricted approval for sensitive content.** Finance entries, donor contact numbers, member
   personal data, and expatriate requests need a named approver, a second check, or a consent record
   before publication or disclosure. Donor numbers are never public; a full number is revealed only
   after the donor grants consent for that specific request, and the grant is logged. Member personal
   data is public only with recorded consent, and withdrawing consent hides it immediately.

The complete inventory — every content item with its fields, relationships, workflow, states, media,
search/filter, public API needs, permissions, and retention — is in
`docs/backend-architecture/03-DYNAMIC-CONTENT-INVENTORY.md`.

## Super Admin + RBAC

Phase 1 has exactly **two admin roles**:

- **Super Admin** — everything: members and families (add/approve), community data, committee,
  activities, content, blood donors, finance, reports, notifications, and creating new users and
  assigning them the Super Admin or Expatriate Helper role. Resets forgotten passwords.
- **Expatriate Helper** — expatriate requests only: view the queue, take or be assigned requests,
  advance status with notes, photos, and expense lines. No access to any other module's editing.

**Member** is a registered community user, not an admin role. **Public** is an unauthenticated visitor.

Permissions are named `resource.action` and registered on Laravel's Gate, so the same permission model
is enforced in the API (policies) and in the Filament admin panel. The permission structure is built so
that deferred roles (President, General Secretary, Treasurer) can be added later without a database or
API rebuild — but they are not implemented in Phase 1. A Helper who tries to open any admin area
outside expatriate requests is denied server-side, not merely hidden in the UI.

## Future Android/iOS roadmap

The mobile app (M12) is **Future Mobile (plan Phase 3) — not yet implemented**. It will be a Flutter app for Android and
iOS with bottom navigation (Home, Community, Services, Profile), offline reading cache for notices and
the directory, push deep-links (a notification opens the related request or notice directly), optional
biometric unlock, and a forced-update policy. It will use the same `/api/v1` endpoints and the same
response envelope as the website, authenticating with Sanctum personal access tokens. No mobile-only
backend will be built. Later phases (after the web platform is stable) add the automatic annual-report
PDF generator, video streaming optimisation, email newsletter, and member card / QR ID; online
donation/payment is a later phase subject to the organisation's merchant-account readiness, and is
excluded from Phase 1 entirely.

## How to run locally (prototype)

No build step, no dependencies. Any of these works:

```bash
# just open it
open index.html
# or serve it
python3 -m http.server 8000
# then visit http://localhost:8000/
```

## How to update later (so nothing breaks)

1. **Small content/design change:** edit the live artifact (`satanipara-community-direction-d`) or edit
   `index.html` directly, then commit. Keep the Meridian rules in `docs/direction-d/DESIGN_SYSTEM.md`
   in mind: one gold line, ≤3 gold accents per viewport, no gold buttons, 18px mobile gutters, photos
   whole on phones.
2. **Bigger redesign:** export the updated artifact (it produces a single `.html` file), replace
   `index.html` with the fresh export, and verify the light-default init is still there — the theme
   init must unconditionally call `setTheme("light")` on first load and must not follow
   `prefers-color-scheme`.
3. **Docs in the same commit:** every change gets a matching doc update in `docs/` — Direction D
   changes go in `docs/direction-d/PROJECT_PROGRESS.md` (and `DESIGN_SYSTEM.md` /
   `DESIGN_RATIONALE.md` if a rule changed); alternative versions get their own `alternatives/` file
   replaced, never edited in place as the live one.
4. **Before every push:** check the changed pages at 360px in both themes with real rendered
   screenshots (not just by reading CSS) — the padding and photo-crop regressions in this project were
   both caught on a real phone after CSS-only checks had "passed". Confirm 0 console errors.
5. **Push:** commit to `main`; GitHub Pages (main branch, root) publishes automatically within a minute
   or two.

## Documentation

- `docs/direction-d/` — Direction D: `DESIGN_RATIONALE.md` (typography, hierarchy, layout,
  interaction decisions + comparison with the broadsheet), `DESIGN_SYSTEM.md` (tokens, type scale,
  colour budget, motion, dark mode), `FONT_COMPARISON.md` + `FONT_COMPARISON.html` (8 Bengali faces
  compared), `QA_REPORT.md`, `FUNCTIONAL_TEST_REPORT.md`, `REVERIFY_REPORT.md`,
  `PROJECT_PROGRESS.md`, `ASSUMPTIONS.md`.
- `docs/redesign/` — the editorial (broadsheet) redesign: creative direction, reference research,
  direction comparison, typography research + specimen, design system, existing-design audit, final
  review, QA reports.
- `docs/v1/` — the v1 prototype: project audit, design research, skill audit, sitemap, user flows, UX
  architecture, design system, QA report.
- `docs/backend-architecture/` — the Phase 0 Laravel backend blueprint (planned, not implemented):
  `README.md` (index), `01-REPOSITORY-AUDIT.md` (what the prototype is and is not),
  `02-PRODUCT-REQUIREMENTS.md` (vision, users, modules M1–M12, numbered requirements),
  `03-DYNAMIC-CONTENT-INVENTORY.md` (every content item that must become dynamic),
  `04-USER-ROLES-PERMISSIONS.md` (Super Admin governance, granular permissions, Role–Permission
  Matrix), `05-BACKEND-ARCHITECTURE.md` (Laravel 13, MySQL 8.4 LTS, Sanctum, state machines),
  `06-DATABASE-DESIGN.md` (47 application tables, migration order, financial integrity, privacy),
  `07-API-ARCHITECTURE.md` (134-endpoint inventory), `08-SECURITY-ARCHITECTURE.md` (OWASP threat
  model), `09-ADMIN-DASHBOARD-REQUIREMENTS.md` (functional spec, planning only),
  `10-TESTING-QUALITY-STRATEGY.md` (testing, CI/CD, observability),
  `11-DEPLOYMENT-OPERATIONS.md` (environments, hosting, backup/DR, handover),
  `12-DEVELOPMENT-ROADMAP.md` (Phase 0–9 plus mobile),
  `13-OPEN-QUESTIONS-AND-ASSUMPTIONS.md` (everything still undecided, nothing guessed),
  `14-ACCEPTANCE-CRITERIA.md` (measurable acceptance criteria per module, plus the Phase 0 quality
  gate), `15-PHASE-0.1-REVIEW-AND-RESOLUTION.md` (Phase 0.1 reconciliation), `adr/` (13 Architecture Decision Records), `diagrams/` (system architecture, ERD,
  RBAC matrix, API flows — all in Mermaid).

## Development roadmap

Phases follow `docs/backend-architecture/12-DEVELOPMENT-ROADMAP.md` (revised by dependency from the
directive's Phase 0–9 + mobile phases). Plan estimates from Engineering Plan v1.1 §15 —
**estimates, not commitments**. If the organisation's real data is late, the affected phase moves; the
quality bar does not.

| Phase | Scope | Depends on |
|---|---|---|
| Phase 0 | Audit & Architecture Planning (this blueprint) | Repository audit, technology research |
| Phase 1 | Laravel Foundation | Phase 0; scaffold-time version checks |
| Phase 2 | Core Identity & Access Control | Phase 1 |
| Phase 3 | Organisation & Community Management | Phase 2 |
| Phase 4 | CMS & Public Content | Phase 2, Phase 3 |
| Phase 5 | Community Services (Expatriate Support + Blood Donor) | Phase 2, Phase 1 (queue) |
| Phase 6 | Financial Transparency | Phase 2 (can run in parallel with 3–5) |
| Phase 7 | API Integration (public web client against the API) | Phases 3–6 |
| Phase 8 | Admin Dashboard | Phases 2–6, plus its own separate approval |
| Phase 9 | QA & Production Readiness | All approved phases 1–8 |
| Future Mobile | Flutter Android & iOS | Phases 1–7 (stable versioned API), separate decision |

Per-phase scope, deliverables, dependencies, risks, testing requirements, and acceptance criteria are in
`docs/backend-architecture/12-DEVELOPMENT-ROADMAP.md`; measurable acceptance criteria are in
`docs/backend-architecture/14-ACCEPTANCE-CRITERIA.md`.

Website (Phase 0–1D in the plan's terms): approximately 12 weeks. Complete (with apps): approximately
18 weeks. These are the plan's estimates, not commitments.

## Security & privacy principles

- **Passwords are hashed, never stored in plain text.** Login is mobile number + password (no OTP in
  Phase 1), with rate limiting per IP and per account and a temporary lock after repeated failures.
- **Phone numbers and beneficiary information are stored in encrypted columns** and decrypted only for
  entitled roles. Public API responses contain no personal field at all — verified by contract tests.
- **Consent is first-class.** No person's profile, phone, or photo is public without recorded consent;
  withdrawing consent hides it immediately. Donor numbers are revealed only after donor-side consent
  for that specific request, and the grant is logged.
- **Least privilege.** Helpers see and edit only expatriate requests; every other module is Super
  Admin only. Every admin action is written to an audit log (who, when, IP, old and new values) that
  cannot be deleted, including by an admin. Retention is at least 2 years.
- **Money is immutable.** Ledger entries cannot be edited or deleted; errors are corrected only by
  reversal entries that point at the original.
- **HTTPS mandatory** (Let's Encrypt, auto-renew), with HSTS and CSP headers. Secrets live in `.env`
  only, never in Git. Backups are nightly (database + uploads) to local storage and one off-server
  disk, with a mandatory monthly automated restore check and a quarterly full restore rehearsal.
- **Data rights.** Members can request access, correction, or deletion of their data; deletion takes
  effect after a 30-day grace period, except that financial and request records are retained in
  anonymised form for legal record-keeping.

## Current status

| Area | Status |
|---|---|
| Prototype (Direction D, `index.html`) — 18 views, all flows clickable | **Implemented (simulated)** — static demo, no backend |
| Editorial redesign and v1 prototype (`alternatives/`) | **Implemented (simulated)** — preserved, superseded directions |
| Design direction (Direction D, "The Meridian") | **Under review** — working direction approved for the build; client's formal Design OK still pending (Doc 13 A-01) |
| Laravel backend, API, database, admin panel | **Planned** — blueprint in `docs/backend-architecture/`, not built |
| Next.js public website (from the API) | **Planned** — Doc 12 Phase 7 (plan Phase 1C) |
| Flutter mobile app (Android + iOS) | **Not yet implemented** — Future Mobile (plan Phase 3) |
| Real data (members, committee, donors, finance, photos, constitution) | **Not yet implemented** — demo data only; real data needs client approval and individual consent |
| Expatriate wizard step count (3 built vs 4 in the design system, D11) | **Under review** — open question, not resolved by guessing |
| Public tracking privacy boundary (what a visitor with a Request ID may see) | **Under review** — mechanism decided in Phase 0.1 (Request ID + tracking secret, Tier-S allowlist); open only for AO-04 (first name / beneficiary name in the Tier-S view) |
| Forgot-password mechanism (no OTP, no SMS in Phase 1) | **Under review** — mechanism decided in Phase 0.1 (Super-Admin-mediated temporary password); open only for the delivery channel / identity-verification procedure (AO-05) |
| Domain name, logo, helper list, public-vs-members-only statistics, finance public summary level | **Under review** — open questions for the organisation |
| Client Design OK, public launch | **Not yet implemented** — prototype is not approved as final, not a public launch |

Still unverified (from the prototype's own QA): real-device phone check beyond emulation,
Safari/Firefox/Android font rendering, full-page dark-mode pixels, reduced-motion/keyboard/
screen-reader pass.

## Next steps

1. **Client feedback** on the demo and on Engineering Plan v1.1.
2. **Answers to the open decisions** (domain name, logo, helper list, data owner, public vs
   members-only statistics, finance public summary level, Apple Developer account, future
   donation/payment, UAT testers) — listed in full in
   `docs/backend-architecture/13-OPEN-QUESTIONS-AND-ASSUMPTIONS.md`.
3. **Commercial proposal** (payment steps, contract) — separate from this repository and from the
   blueprint; no prices appear here.
4. **Phase 0 approval**, then Doc 12 Phase 2 (plan Phase 1A: identity, 2-role access, community data model, Filament admin,
   audit log) on staging.
