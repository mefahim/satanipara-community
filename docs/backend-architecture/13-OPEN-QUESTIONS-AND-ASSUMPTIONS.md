# 13 — Open Questions and Assumptions

**Status:** Under review — nothing in this document is decided. Every question here needs an answer
from the named decision-maker before the affected work is built. Nothing in this document is resolved
by guessing.
**Sources:** the repository audit (document 01), Engineering Plan v1.1 §17 (its ten open decisions,
reproduced in §2), the Decision Sheet (including the unresolved D11), and the research notes
(unverified items, §9).
**Rule:** an open question stays open until the decision-maker answers it in writing, with the date and
the evidence recorded. When a question is answered, it is removed from this document in the same change
that records the decision in the affected blueprint document.

---

## 1. Open questions

### Q-01 — Expatriate wizard: 3 steps or 4 steps? (D11) — BLOCKS the wizard build

- **Question:** `DESIGN_SYSTEM.md` §7.1 describes the expatriate wizard as 4 steps; the built Direction D
  wizard has 3 panes + a success pane (service/details → personal info → review → success). Which is
  correct?
- **Why it matters:** the frontend step structure, the draft-saving behaviour between steps, and the
  validation order all depend on the step count.
- **What is known:** the audit (document 01 §8.11) records this as a doc/build mismatch to confirm. The
  backend accepts the wizard's data regardless of step count (document 02, REQ-M5-003), so the backend
  is not blocked — but the frontend build is.
- **Decided by:** Fahim / the design owner, confirming against the design system.
- **Status:** Open (unresolved since the Direction D QA report, 2026-11-14).

### Q-02 — Public tracking privacy boundary

- **Question:** anyone with a Request ID can track a request publicly with no login (prototype
  `doTrack()`). The prototype's tracking result exposes the applicant's name and area in `#trMeta`, plus
  the service, the beneficiary ("for whom"), the 4-step timeline with notes, and the expense ledger.
  What exactly may a non-logged-in visitor see?
- **Options:** (a) keep the prototype's exposure (name + area visible); (b) show status and timeline
  only, hiding names; (c) show a masked applicant identity; (d) require the applicant's phone number
  (or another second factor) as well as the Request ID.
- **Why it matters:** expatriate requests are the most sensitive module (plan v1.1 §6 M5); beneficiary
  phone/address are encrypted in the backend design. Publishing an applicant's name and area to anyone
  who guesses or shares an ID is a privacy decision, not a default.
- **Decided by:** the organisation (Super Admin / client), with Fahim.
- **Status:** Open.

### Q-03 — Does expatriate submission require login in production?

- **Question:** in the prototype the wizard is reachable logged-out and any visitor can submit. In
  production, must the submitter be a logged-in member, or can a visitor submit and track by Request ID
  alone?
- **Why it matters:** it changes the intake API (authenticated vs public endpoint), spam/abuse controls,
  and how "My Requests" is linked to an account. The backend is designed so the requirement can change
  without a rewrite (document 02, REQ-M5-001), but the decision must be made before the intake endpoint
  is finalised.
- **Decided by:** the organisation, with Fahim.
- **Status:** Open.

### Q-04 — Forgot-password mechanism without OTP or SMS

- **Question:** the standing Phase 1 scope says the Super Admin resets forgotten passwords, and there is
  no OTP and no SMS in Phase 1. How does a member who forgot their password actually get back in?
- **Options:** (a) the member contacts the office and the Super Admin sets a new temporary password in
  the admin panel (and the member must change it at next login); (b) a reset link sent by email — but
  the prototype has no email field anywhere and no email service in Phase 1, so this needs an email
  address on the account and an email-sending decision; (c) something else the organisation proposes.
- **Why it matters:** Direction D has no forgot-password UI at all (0 matches for "forgot"); v1/editorial
  have only a note. The mechanism determines whether accounts need an email address, whether an email
  service is needed in Phase 1, and what the admin panel must support.
- **Decided by:** Fahim, with the organisation.
- **Status:** Open.

### Q-05 — Password policy

- **Question:** the prototype's only password rule is length ≥ 6 (registration) with no complexity rule
  and no length rule at login. What is the production password policy (minimum length, complexity,
  expiry, reuse rules)?
- **Why it matters:** with no OTP, the password is the only authentication factor; the policy is the
  main defence (plan v1.1 §12). It must be set before the registration endpoint is built.
- **Decided by:** Fahim.
- **Status:** Open.

### Q-06 — Real contact details

- **Question:** what are the real office address, office hours, phone number, and email address to
  publish on the contact page? The prototype states "প্রকৃত ফোন/ইমেইল যাচাই শেষে প্রকাশিত হবে — ডেমোতে
  কোনো নমুনা নম্বর দেওয়া হয়নি" and uses a sample address and sample hours.
- **Why it matters:** the contact page cannot launch with invented details; until verified details
  exist it must show the "information being updated" state.
- **Decided by:** the organisation (must supply and verify).
- **Status:** Open — awaiting the organisation.

### Q-07 — Domain name

- **Question:** what is the final domain name, and in whose name/email is it registered?
  (Plan v1.1 §17 decision 1.)
- **Why it matters:** it determines the production URL, the Sanctum stateful-domain configuration
  (cookie auth requires the SPA and API to share the same top-level domain), SSL, and the sitemap/SEO
  base URL.
- **Decided by:** the organisation.
- **Status:** Open.

### Q-08 — Logo

- **Question:** will the organisation supply a formal logo, or is logo design a separate scope?
  (Plan v1.1 §17 decision 2.) The prototype uses a text crest ("সা").
- **Why it matters:** the logo appears in the header, footer, app icon, and Open Graph images. A
  missing logo blocks the final visual build, not the backend.
- **Decided by:** the organisation.
- **Status:** Open.

### Q-09 — Helper list (who receives notifications)

- **Question:** who are the final Expatriate Helpers — names and numbers — who will receive browser
  notifications on new requests, and on whose devices is notification permission set up? (Plan v1.1
  §17 decisions 3 and 5.) Who are the Emergency Response Team members (3–5 people) and their backups?
- **Why it matters:** helpers cannot be created, notified, or trained until the list exists. The
  notification subscription setup happens at first dashboard login per helper.
- **Decided by:** the organisation (must supply before launch).
- **Status:** Open — awaiting the organisation.

### Q-10 — Which statistics are public vs members-only?

- **Question:** which statistics and information are public, and which are members-only? (Plan v1.1
  §17 decision 6.) The plan's default is proposed in the plan; the organisation must confirm or change
  it. This covers member/family/expatriate counts, the directory's members-only tier, and any
  statistics beyond the two verified facts (1999 founding, ERT 3–5).
- **Why it matters:** it sets the `visibility` defaults on every person/directory record and the
  `GET /public/stats` response. Getting it wrong publishes personal data or hides public information.
- **Decided by:** the organisation (policy decision).
- **Status:** Open.

### Q-11 — Finance public summary level

- **Question:** how detailed is the public finance summary — monthly totals only, or project-level
  detail as well? (Plan v1.1 §17 decision 7.) Is a second approval step required before a finance
  figure is published?
- **Why it matters:** it sets the `is_public_summary` behaviour, the `GET /finance/summary` response,
  and the finance approval workflow.
- **Decided by:** the organisation.
- **Status:** Open.

### Q-12 — Donation / payment in the future

- **Question:** does the organisation want online donation/payment in the future, and if so, when?
  (Plan v1.1 §17 decision 9.) Phase 1 excludes payment; Phase 2 includes a donation page with an online
  payment gateway subject to the organisation's merchant-account readiness. No payment provider is
  named in the blueprint.
- **Why it matters:** it affects nothing in Phase 1 except that the finance module must not be built in
  a way that blocks a later payment integration — and that no payment copy or button is added in Phase 1.
- **Decided by:** the organisation (future decision; no answer needed for Phase 1).
- **Status:** Open (deferred).

### Q-13 — Bengali full-text search quality

- **Question:** does PostgreSQL full-text search handle Bengali names and notices well enough, or is
  Meilisearch (or another engine) needed? PostgreSQL has no built-in Bengali dictionary; MySQL n-gram
  behaviour for Bengali is likewise unverified. (Research notes §6, §9 item 7.)
- **Why it matters:** member, notice, and activity search is a core public feature. Search quality
  cannot be claimed until it is tested.
- **What is needed:** a small empirical test with real Bengali names and notices, on the chosen database,
  before launch. `pg_trgm` trigram search is a likely fallback; it is not verified.
- **Decided by:** the build team, by measurement — not by opinion.
- **Status:** Open (unverified; test required).

### Q-14 — Reverb database driver

- **Question:** Laravel 13 is reported (secondary sources only) to add a database driver for Reverb
  (realtime WebSockets). Is that driver real, documented, and suitable for the "new request → browser
  notification to helpers" flow, or is the flow delivered by database notifications + polling instead?
  (Research notes §8, §9 item 10.)
- **Why it matters:** Reverb is optional for Phase 1 — the notification requirement can be met without
  it — but the architecture must not rely on an unverified driver.
- **What is needed:** confirm in the Reverb documentation at scaffold time before relying on it.
- **Decided by:** the build team, by checking the primary docs.
- **Status:** Open (unverified).

### Q-15 — Map

- **Question:** does the platform include a map (for infrastructure/places and the contact page)? The
  prototype has no map (0 `<iframe>`, no map library). If yes: which provider, and what location data
  is published?
- **Why it matters:** a map needs location data on infrastructure records, a provider decision, and a
  privacy review (exact household locations must never be published).
- **Decided by:** the organisation, with Fahim.
- **Status:** Open (Under review).

### Q-16 — Activity detail: unknown ID behaviour

- **Question:** the prototype's activity detail falls back to the first activity when the ID is unknown
  (`#/activity?id=aX`, unknown id → a1). In production, should an unknown activity ID show the first
  activity or a 404?
- **Why it matters:** it affects the API contract and SEO (a 404 is correct for a missing resource; a
  silent fallback is confusing and can mask broken links).
- **Decided by:** Fahim.
- **Status:** Open.

### Q-17 — Emergency escalation rules

- **Question:** what are the escalation rules for a flagged emergency request — who is alerted, in what
  order, and how quickly? What is the on-call rotation for the 3–5 person Emergency Response Team?
- **Why it matters:** the prototype has no expatriate-emergency request path and no ERT roster; the
  escalation rules determine the notification design for flagged requests.
- **Decided by:** the organisation.
- **Status:** Open.

### Q-18 — Event RSVP

- **Question:** do events need RSVP/registration, or are they display-only? The prototype has no RSVP
  and no date/time/venue fields beyond prose.
- **Why it matters:** RSVP adds a registration entity, capacity handling, and notifications. Display-only
  is the Phase 1 default unless the organisation asks for RSVP.
- **Decided by:** the organisation.
- **Status:** Open (Under review; default display-only).

### Q-19 — Homepage section count: plan's 11 parts vs Direction D's 9 sections

- **Question:** Engineering Plan v1.1 §6 M11 describes the homepage as 11 parts (hero, statistics,
  ongoing activities, notices, upcoming events, service shortcuts, expatriate section, blood-donor
  search, gallery, contact and emergency numbers). Direction D's home page has 9 differently-composed
  sections. Which structure does the built website follow?
- **What this blueprint does:** Direction D governs the frontend; the plan governs the backend structure.
  The 11-part list is treated as a content checklist (every part must be reachable from the home page),
  not as a section count. If the organisation wants the 11-part structure literally, that is a design
  decision, not a backend change.
- **Decided by:** Fahim / the design owner.
- **Status:** Open.

### Q-20 — Language and theme preference persistence

- **Question:** the prototype's language and theme choices are session-only (no storage at all; reload
  resets to Bengali and light). In production, are the language and theme preferences persisted per user
  (or per device), or kept session-only by an explicit decision?
- **Why it matters:** it determines whether a preferences record and API exist, and whether the site
  follows `prefers-color-scheme` (the prototype explicitly does not).
- **Decided by:** Fahim.
- **Status:** Open.

### Q-21 — Voting rights

- **Question:** membership copy in the prototype mentions "ভোটাধিকারসহ সব সুবিধা" (all benefits including
  voting rights), but no voting feature exists anywhere. Is voting a real future requirement, or copy to
  be corrected?
- **Why it matters:** voting would be a new module (eligibility, ballots, audit). It is not a Phase 1
  requirement either way; the question is whether the copy stays.
- **Decided by:** the organisation.
- **Status:** Open.

### Q-22 — Expatriate service types: 7 (prototype) or 6 (plan)?

- **Question:** the prototype's `SVC` object has 7 services (grocery, medicine, hospital, elderly,
  home, document, general). Engineering Plan v1.1 §6 M5 lists 6 types (market/medicine, hospital help,
  check-in, home emergency work, documents, other) and §7 lists 6 types with a different grouping.
  What is the final service list?
- **Why it matters:** the service catalogue is a managed list in the backend (§3 of document 03), so
  either list can be implemented — but the final list must be confirmed before the wizard is built.
- **Decided by:** the organisation, with Fahim.
- **Status:** Open.

### Q-23 — Apple Developer account (iOS)

- **Question:** will the organisation open an Apple Developer account for iOS publication? (Plan v1.1
  §17 decision 8.) This is a Phase 3 decision; no answer is needed for Phase 1, but the account takes
  time to set up and the App Store review needs a privacy policy and an account-deletion flow (both
  specified in this blueprint).
- **Decided by:** the organisation (Phase 3).
- **Status:** Open (deferred).

### Q-24 — UAT testers and sign-off owner

- **Question:** who are the 2–3 UAT testers, and who is the named person responsible for sign-off at
  each step? (Plan v1.1 §17 decision 10.)
- **Why it matters:** plan v1.1 §14 requires written sign-off from the organisation's nominated testers
  at each phase on staging. Without named testers, acceptance cannot be evidenced.
- **Decided by:** the organisation (must nominate before UAT).
- **Status:** Open — awaiting the organisation.

### Q-25 — Primary data owner

- **Question:** who is the person responsible for supplying the primary data (statistics, committee
  information) — and is that person the Super Admin? (Plan v1.1 §17 decision 4.)
- **Why it matters:** real data cannot be onboarded without a named owner; the Super Admin account
  cannot be created without a named person.
- **Decided by:** the organisation.
- **Status:** Open — awaiting the organisation.

### Q-26 — Database choice: PostgreSQL or MySQL?

- **Question:** the blueprint leans PostgreSQL, narrowly, because the project starts on a single VPS
  where hosting availability is not a constraint (research notes §6). If shared-hosting portability in
  Bangladesh becomes a requirement, MySQL/MariaDB LTS is the documented alternative. Which constraint
  decides it — VPS-only, or shared-hosting portability?
- **Why it matters:** it is the one infrastructure decision that is expensive to reverse after data
  exists. It must be recorded explicitly, with the deciding constraint named.
- **Decided by:** Fahim, with the build team.
- **Status:** Open (lean recorded; decision to confirm at scaffold time).

### Q-27 — Hosting, domain ownership, and handover accounts

- **Question:** in whose name are the domain, hosting, GitHub organisation, and (later) Play Console /
  Apple Developer / Firebase / S3 accounts held? (Plan v1.1 §16: all accounts in the organisation's
  name/email, never the developer's.)
- **Why it matters:** ownership is a handover requirement, not an afterthought; accounts created in the
  wrong name are hard to transfer.
- **Decided by:** the organisation, with Fahim.
- **Status:** Open.

---

## 2. Engineering Plan v1.1 §17 — open decisions (reproduced)

For completeness, the ten decisions plan v1.1 §17 lists as required from the organisation before
development starts. Each is cross-referenced to the question above that carries it.

| # | Plan v1.1 §17 decision | This document |
|---|---|---|
| 1 | Finalise the domain name (e.g. sataniparacommunity-based) and in whose name/email it is registered | Q-07 |
| 2 | Supply a formal logo — or logo design becomes a separate scope | Q-08 |
| 3 | Final list of Expatriate Helpers — who receives browser notifications and on whose devices permission is set up (no SMS/OTP needed) | Q-09 |
| 4 | Nominate the person responsible for primary data — who supplies statistics and committee information (may be the Super Admin) | Q-25 |
| 5 | Names and numbers of the Expatriate Helper team and backups (before launch) — they receive the helper role and browser notifications | Q-09 |
| 6 | Which statistics/information are public and which are members-only — a policy decision (default: the plan's proposal) | Q-10 |
| 7 | Public finance summary level — monthly totals only, or project-level detail | Q-11 |
| 8 | Decision to open an Apple Developer account (annual fee borne by the organisation, if iOS is wanted) | Q-23 |
| 9 | Whether online donation/payment is wanted in the future — merchant-account preparation in advance if so | Q-12 |
| 10 | Nominate 2–3 UAT testers and the person responsible for step-by-step sign-off | Q-24 |

Plan v1.1 §17 also lists risks and mitigations (real data arriving late; objections to publishing personal
information; helpers not granting notification permission or changing browsers; a compromised admin
account; App Store review delay/rejection; a future developer change; scope growth delaying delivery).
Those risks are carried into the blueprint's assumptions below and into the acceptance criteria
(document 14); they are not repeated as questions here because each already has a mitigation in the plan.

**Next steps in the plan (v1.1 §17):** (1) the organisation's feedback on the plan and demo → (2) answers
to the decisions above → (3) commercial proposal (price, payment steps, contract) → (4) Phase 0 begins on
approval. Each step is in writing.

---

## 3. Assumptions

Every assumption is marked as an assumption. Each states what would invalidate it and who must decide.
An assumption is not a fact; if it is invalidated, the affected requirement or design must be revisited.

| # | Assumption | What would invalidate it | Decided / confirmed by |
|---|---|---|---|
| A-01 | The prototype's Direction D is the approved frontend direction and will not be redesigned during the backend build. | The client gives a Design OK for a different direction, or rejects Direction D. | Fahim / the client (Design OK). |
| A-02 | The organisation will supply real data (members, committee, donors, finance, photos, constitution) before launch, using the Phase 0 data-collection template. Late data delays the affected step, not the quality bar. | The organisation cannot or will not supply real data. | The organisation. |
| A-03 | Two admin roles (Super Admin + Expatriate Helper) are sufficient for Phase 1, and the deferred roles (President, GS, Treasurer) can wait until after launch. | The organisation requires a committee role to approve or enter data in Phase 1. | The organisation, with Fahim. |
| A-04 | Login with mobile number + password (no OTP) is acceptable to the organisation and its members, with rate limiting and temporary lockout as the main defence. | The organisation requires OTP, or members cannot reliably use password login. | The organisation, with Fahim. |
| A-05 | Browser/push notification (Web Push) is sufficient for helper alerts, and helpers will grant notification permission at first dashboard login. | Helpers refuse permission, change browsers frequently, or need SMS. Mitigation in the plan: the dashboard bell badge showing unread requests is the backup. | The organisation (helpers). |
| A-06 | The project starts on a single VPS, so PostgreSQL availability is not a constraint and the PostgreSQL lean holds. | The site must move to cheap shared hosting in Bangladesh, where only MySQL/MariaDB is practical. | Fahim (see Q-26). |
| A-07 | The 7 demo services in the prototype's `SVC` object are close to the final service list, and the list can be finalised without changing the request workflow. | The organisation wants a materially different service catalogue (see Q-22). | The organisation. |
| A-08 | The public tracking page can show at least the request status and timeline without login, as the prototype does. | The organisation decides public tracking must be authenticated or masked (see Q-02). | The organisation. |
| A-09 | Finance figures can be published as a monthly/project summary once audited, and the organisation will supply audited figures. | The organisation decides finance is members-only, or cannot supply audited figures. | The organisation. |
| A-10 | The 80%+ business-logic test-coverage target and the performance budgets (LCP ≤2.5 s, API p95 ≤300 ms, Lighthouse 90+, 500 concurrent users, 99.5% uptime) are achievable on the planned stack and are treated as targets to test against, not guarantees. | Load testing shows the targets cannot be met on the planned hosting; the targets are then revised with evidence, not ignored. | The build team, by measurement. |
| A-11 | Real photos, committee lists, and directory entries can be published with individual consent, and consent can be collected in time for launch. | Members or photographed people refuse consent, or consent cannot be collected. | The organisation. |
| A-12 | The organisation's hosting, domain, and store accounts will be in the organisation's name (plan v1.1 §16), and handover will include full access and a backup/restore drill. | Accounts are created in a developer's name, or handover is refused. | The organisation, with Fahim. |
| A-13 | The Laravel 13 / PHP 8.4-or-8.5 / Filament 5 / Spatie v8 stack is available and stable at scaffold time, and any version drift is resolved from Packagist at that time (no patch numbers are asserted in this blueprint). | A package is withdrawn, incompatible, or requires a newer PHP than the host provides. | The build team, at scaffold time. |
| A-14 | The 3-step wizard (as built) is an acceptable basis for the intake API, and the step-count question (Q-01/D11) is a frontend matter that does not change the request data model. | The design owner requires a 4-step wizard with different data captured per step. | Fahim / the design owner. |
| A-15 | No payment, dues collection, or voting feature is needed in Phase 1, and the prototype's mentions of "চাঁদা" (as a finance income line) and voting rights (in membership copy) do not imply a Phase 1 feature. | The organisation requires dues collection or voting in Phase 1. | The organisation. |
| A-16 | The single verified historical milestone is the 1999 founding, and no other date will be published until document-verified. | The organisation supplies verified documents for additional milestones. | The organisation. |
| A-17 | The English translations in the prototype's `EN` dictionary (400 keys) are a starting point for the bilingual content, not a final translation, and professional review is needed before launch. | The organisation supplies its own translations or requires a different translation workflow. | The organisation. |
| A-18 | The backup/restore targets (RPO 24 h, RTO 4 h, monthly automated restore check + quarterly full restore rehearsal) are acceptable to the organisation. | The organisation requires stricter recovery targets. | The organisation. |
