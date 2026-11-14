# 14 — Acceptance Criteria

**Status:** Planned — these criteria define how completion is judged. None of them has been met yet,
because nothing has been built.
**Sources:** the product requirements (document 02), Engineering Plan v1.1 §14–§15 (test strategy,
performance budgets, and per-phase acceptance), and the repository audit (document 01).
**How to read this document:** each criterion is written as a testable check — given/when/then, or a
checklist item with a pass condition. A criterion passes only on observed evidence (a passing test, a
staging demonstration, a written sign-off); "it is done" without evidence does not pass. Per plan v1.1
§1 principle 5, evidence-based acceptance applies at every phase: a test report and a checklist at the
end of each step, with known limitations listed — nothing hidden.
**UAT rule (plan v1.1 §14):** at each phase, 2–3 people nominated by the organisation test on staging
and give written sign-off. (The testers themselves are an open question — document 13, Q-24.)

---

## 1. Phase 0 acceptance (this blueprint)

> **Source of this list.** This is the Phase 0 quality gate from the Master Directive §17, reproduced
> verbatim as the acceptance list. (An earlier draft of this section derived the gate from the task
> brief because the directive text had not reached that writer; the coordinator has now reconciled it
> against directive §17, and the directive version below governs.)

The Phase 0 blueprint is accepted when **all** of the following hold:

- [x] **G-01 — Entire repository inspected.** (Doc 01; audit findings, HEAD `6792f5e`.)
- [x] **G-02 — All existing pages and features inventoried.** (Doc 01 §3: 37 features; 18 routes.)
- [x] **G-03 — Static and hardcoded content identified.** (Doc 01 §5: full demo-data catalogue.)
- [x] **G-04 — Complete dynamic content inventory prepared.** (Doc 03.)
- [x] **G-05 — Super Admin governance defined.** (Doc 04.)
- [x] **G-06 — Role and permission matrix completed.** (Doc 04 + `diagrams/RBAC-MATRIX.md`.)
- [x] **G-07 — Backend architecture documented.** (Doc 05.)
- [x] **G-08 — Database schema and ERD prepared.** (Doc 06 + `diagrams/ERD.md`.)
- [x] **G-09 — API endpoint inventory completed.** (Doc 07: 132 endpoints.)
- [x] **G-10 — Security architecture documented.** (Doc 08.)
- [x] **G-11 — Privacy and consent rules documented.** (Doc 06 §11, doc 08 §8, doc 04 §9.)
- [x] **G-12 — Admin dashboard functional requirements completed.** (Doc 09 — planning only, no UI.)
- [x] **G-13 — Testing and quality strategy completed.** (Doc 10.)
- [x] **G-14 — Architecture decisions documented.** (Doc `adr/`: 13 ADRs.)
- [x] **G-15 — Development roadmap prepared.** (Doc 12.)
- [x] **G-16 — Open questions and assumptions documented.** (Doc 13.)
- [x] **G-17 — Root README updated.** (Root `README.md`, updated from the approved draft in this set.)
- [x] **G-18 — All documentation reviewed for consistency.** (Coordinator review: endpoint count, table count, restore-test cadence, and permission names reconciled across docs; see the supplementary checks below.) **Unticked in Phase 0.1, re-ticked after Batch 6 passed (Doc 15 §12, 2026-11-14):** the claim was false — Phase 0.1 found 31 MySQL reconciliation items (A), 26 database/API mismatches (C), and 12 broken references (D), plus 39 further issues found and fixed in Batch 6. All 13 Batch 6 checks pass.
- [x] **G-19 — Existing prototype preserved.** (`index.html`, `alternatives/`, and
      `docs/direction-d/`, `docs/redesign/`, `docs/v1/` are untouched; only
      `docs/backend-architecture/` is added and the root `README.md` is updated.)
- [ ] **G-20 — Changes committed and pushed.** (Completed by the coordinator at publication; commit
      SHA recorded in the Phase 0 report.)
- [ ] **G-21 — GitHub publication verified.** (Completed by the coordinator at publication; read-back
      of the pushed files + live Pages check recorded in the Phase 0 report.)

Items G-20 and G-21 are marked open in this document because they can only be completed by the
publication step itself; they are not marked complete in advance. Do not mark incomplete items as
complete.

### 1.1 Supplementary documentation-quality checks (coordinator review)

These checks were applied across the whole set in addition to the §17 gate:

- [x] **P0-02 — Grounded in the audit.** Every claim about the prototype can be traced to the audit
      findings file or to a cited file path in the repository (for example `index.html`,
      `docs/direction-d/QA_REPORT.md`). No prototype behaviour is described that the audit does not
      support.
- [x] **P0-03 — Grounded in verified technology facts.** Every technology fact can be traced to the
      research notes or to a primary source checked on 2026-11-14. No patch version numbers appear
      anywhere; constraints use major versions only (`^13.0`, `^4.0`, `^5.0`, `^8.0`).
- [x] **P0-04 — Status labels honest.** Every feature, module, and requirement carries one of
      Implemented / Planned / Under review / Not yet implemented, used as defined in the index. No
      planned backend work is described as implemented. Prototype simulations are labelled as simulated.
- [x] **P0-05 — No invented facts.** No dates, prices, statistics, or people are invented. Every figure
      quoted from the prototype is labelled demo. Unverified statistics are handled by the
      "তথ্য হালনাগাদ হচ্ছে" rule, not by a number.
- [x] **P0-06 — No prices.** No document in the set contains a price, a quotation, or a cost figure.
- [x] **P0-07 — Divergences explicit.** Every place where the blueprint diverges from Engineering Plan
      v1.1 (Laravel 12 → 13; design tokens/fonts; Filament 3 → 5; PostgreSQL 16 → MySQL 8.4 LTS (Phase 0.1, Confirmed — Fahim);
      Redis/Horizon and S3 as day-one → deferred; endpoint inventory 132 vs the plan's ~70 estimate;
      8 added tables) is stated explicitly with its reason, and every agreement with the plan cites
      the plan section.
- [x] **P0-08 — Open questions open.** Every open question (document 13) is listed with a named
      decision-maker; none is resolved by guessing. D11 (wizard 3 vs 4 steps) is listed as open.
- [x] **P0-09 — Terminology consistent.** Module names M1–M12, Request ID format `EXP-YYYY-####`, the status enum, `/api/v1`, the response/error envelopes, money as `numeric(12,2)`, role names, and permission names (`resource.action`) match the Decision Sheet exactly, in every document. **Unticked in Phase 0.1, re-ticked after Batch 6 passed (Doc 15 §12, 2026-11-14):** the claim was false — the endpoint count was cited inconsistently (108 vs the plan's ~70), the table count was wrong (44 vs 47 defined), and permission names `users.create` / `users.update` / `reports.publish` / `finance.publish` contradicted Doc 04. Corrected in Phase 0.1 (132 endpoints, 47 application tables, canonical permission names) and verified by Batch 6 (checks C2/C3/C5/C10).
- [x] **P0-10 — No code, no mockups, no redesign.** The set contains no Laravel code, no migrations,
      no dashboard UI or mockups, and no redesign of Direction D.
- [x] **P0-11 — Coordinator review.** The Phase 0 coordinator has reviewed the set against the Decision
      Sheet and confirmed it follows it; the conflicts found in review (endpoint count, table count,
      restore cadence, stale index rows, §17 gate source) are corrected in this revision and listed in
      the Phase 0 report.

## 2. Acceptance criteria per module (M1–M12)

Criteria reference the requirements in document 02 by REQ-ID. "Staging" means the staging environment
(a faithful copy of production, with sample data — plan v1.1 §13); no feature goes to production without
passing on staging first.

### M1 — Identity & Membership

- [ ] **AC-M1-01.** Given the registration form, when a visitor submits a valid name (2+ characters),
      a unique mobile number (10+ digits), a password (meeting the agreed policy — document 13, Q-05),
      an area, and a member type, then an account is created in `pending` status and the visitor sees a
      bilingual confirmation that approval is pending. (REQ-M1-001, REQ-M1-002, REQ-M1-004, REQ-M1-013)
- [ ] **AC-M1-02.** Given a mobile number that is already registered, when a second registration is
      submitted with it, then it is rejected with a bilingual error and no second account is created.
      (REQ-M1-002)
- [ ] **AC-M1-03.** Given a pending account, when the owner logs in, then login succeeds and the owner sees an 'awaiting approval' screen with services locked. (REQ-M1-004; Recommended, pending Fahim's confirmation — REG-AUTH-01.)
- [ ] **AC-M1-04.** Given an approved account, when the member logs in with the correct mobile number
      and password, then a session (web) or token (app) is issued and the member reaches their dashboard.
      When the password is wrong, login fails, the attempt is counted, and after the defined number of
      failures the account/IP is temporarily locked. (REQ-M1-006, REQ-M1-007)
- [ ] **AC-M1-05.** Given the database, when an auditor inspects stored credentials, then no password
      exists in plain text and the prototype's demo passwords are absent. (REQ-M1-003)
- [ ] **AC-M1-06.** Given the Super Admin in the admin panel, when they approve a pending member, then
      the member receives a unique member ID, the status becomes `approved`, and the member can log in.
      When they reject, the status becomes `rejected` with a recorded reason. (REQ-M1-004, REQ-M1-005,
      REQ-M1-012)
- [ ] **AC-M1-07.** Given a member, when they edit their own profile (including family members) and save,
      then the changes persist across logout and login, and server-side validation rejects invalid input
      with bilingual errors. (REQ-M1-008, REQ-M1-009)
- [ ] **AC-M1-08.** Given a member who requests account deletion, when the 30-day grace period passes,
      then the account is permanently deleted except for anonymised financial/request records.
      (REQ-M1-010)
- [ ] **AC-M1-09.** Given a member who forgot their password, when the agreed reset mechanism
      (document 13, Q-04) is used, then the member regains access and the old password stops working.
      (REQ-M1-011)

### M2 — Community Profile

- [ ] **AC-M2-01.** Given persons records in the database, when the public statistics endpoint is called,
      then the counts (population, expatriate count, gender/age breakdown, expatriates by country) match
      a direct count of the data, and no hand-typed number exists anywhere in the response.
      (REQ-M2-002)
- [ ] **AC-M2-02.** Given unverified statistics, when the home page renders, then it shows
      "তথ্য হালনাগাদ হচ্ছে" instead of a number. (REQ-M2-002)
- [ ] **AC-M2-03.** Given the public directory, when a visitor searches by name (Bengali or English),
      role, or area, or filters by category, then the results match, are paginated, and contain no phone
      number, email, or address unless that record's consent explicitly covers it. (REQ-M2-003,
      REQ-M2-007)
- [ ] **AC-M2-04.** Given a person whose consent is withdrawn, when the public directory is viewed, then
      that person is hidden immediately. (REQ-M2-007)
- [ ] **AC-M2-05.** Given the professionals listing, when a visitor filters by profession, then only
      professionals of that profession are shown, from the same records as the directory (no second
      copy). (REQ-M2-004)
- [ ] **AC-M2-06.** Given an institution, when its detail page is viewed, then type, services, hours,
      contact, and location are shown as entered by the Super Admin. (REQ-M2-005)
- [ ] **AC-M2-07.** Given a public API response for a person, when it is inspected, then it contains no
      date of birth — only an age band. (REQ-M2-009)
- [ ] **AC-M2-08.** Given a new directory entry, when it is created, then it is not public until the
      Super Admin approves it. (REQ-M2-010)

### M3 — Organisation

- [ ] **AC-M3-01.** Given the timeline, when the public history page and the home Meridian are viewed,
      then they show the same milestones from the same records, and only the 1999 founding milestone
      (the only verified one) carries a date. (REQ-M3-001, REQ-M3-002)
- [ ] **AC-M3-02.** Given an unverified milestone, when it is saved, then it is not published until its
      verification flag is set. (REQ-M3-001)
- [ ] **AC-M3-03.** Given the constitution, when a new version is published, then the old version remains
      available and downloadable, and the current version is the real text supplied by the organisation —
      not the prototype's 5-article sample summary. (REQ-M3-003)
- [ ] **AC-M3-04.** Given a committee term that ends, when the term end date passes, then the term is
      archived automatically and remains in history, and the current committee shows the new term.
      (REQ-M3-004)
- [ ] **AC-M3-05.** Given a former leader, when their record is viewed, then the term range is complete
      (no open-ended or blank term). (REQ-M3-005)

### M4 — Annual Activities

- [ ] **AC-M4-01.** Given activities, when the public list is filtered by year and by category, then only
      matching activities are shown — and every activity has a stored category, so the category filter
      works (unlike the prototype, where it had no data behind it). (REQ-M4-001, REQ-M4-002)
- [ ] **AC-M4-02.** Given an activity, when its detail page is opened, then title, meta, image, and body
      are shown; an unknown ID returns the agreed response (document 13, Q-16). (REQ-M4-003)
- [ ] **AC-M4-03.** Given a year that ends, when the archive runs, then that year's activities are
      archived and remain browsable. (REQ-M4-004)

### M5 — Expatriate Support

- [ ] **AC-M5-01.** Given the wizard, when a visitor submits a complete request, then a unique Request ID
      `EXP-YYYY-####` is returned, the status is `pending`, the creation timestamp is the real submission
      time, and the ID is never a random number that could collide. (REQ-M5-002, REQ-M5-004)
- [ ] **AC-M5-02.** Given a request in `pending`, when a helper (or Super Admin) accepts it, then the
      status becomes `accepted` with actor and timestamp recorded; a direct `pending → completed`
      transition is rejected by the API with a bilingual error. Every valid and invalid transition in the
      state machine is covered by a test. (REQ-M5-005, REQ-M5-007)
- [ ] **AC-M5-03.** Given a request, when it is assigned to a helper, then the assignment (helper,
      backup helper, assigned-by, assigned-at) is recorded and visible to the helper queue.
      (REQ-M5-006)
- [ ] **AC-M5-04.** Given a request in `in_progress`, when the helper adds a note, a photo, and an
      expense line, then all three appear on the tracking timeline/ledger with actor and timestamp, and
      the expense total updates. (REQ-M5-008, REQ-M5-009)
- [ ] **AC-M5-05.** Given a request, when its expense total is viewed, then it is the sum of its expense
      lines, the service charge is shown as ৳০, and **no service-charge field exists** in the request,
      the API, or the database. (REQ-M5-009)
- [ ] **AC-M5-06.** Given a request with no expense line and no "no expense incurred" declaration, when
      a helper tries to mark it `completed`, then the transition is rejected. (REQ-M5-010)
- [ ] **AC-M5-07.** Given a `completed` request, when the applicant confirms, then the status becomes
      `closed`; before confirmation it stays `completed`. (REQ-M5-011)
- [ ] **AC-M5-08.** Given a request in `in_progress` with no update for 72 hours, when the scheduler
      runs, then the Super Admin receives a reminder. (REQ-M5-012)
- [ ] **AC-M5-09.** Given a Request ID and the tracking secret, when a visitor tracks it without logging in, then the status, the service type, the 4-node Meridian timeline (Pending → Accepted → In Progress → Completed; `closed` shown as a completion banner; `rejected`/`cancelled` replace the timeline with a terminal-state notice), and the expense ledger are shown — and nothing beyond the Tier-S allowlist (Doc 04 §7.4; in particular, no beneficiary phone or address). (REQ-M5-013)
- [ ] **AC-M5-10.** Given a new request submission, when it is saved, then every Helper and the Super
      Admin receive a browser/push notification containing the Request ID; for an urgent request the
      backup helper is notified as well. (REQ-M5-014)
- [ ] **AC-M5-11.** Given a member with no requests, when they open "My Requests", then the list is empty
      — the prototype's bug of appending the seeded demo request to every member is not present.
      (REQ-M5-015)
- [ ] **AC-M5-12.** Given any expatriate-support page, when it is viewed, then the permanent disclaimer
      ("not a replacement for official emergency services — call 999 first; not an ambulance
      replacement") is visible. (REQ-M5-016)

### M6 — Blood Donor

- [ ] **AC-M6-01.** Given a donor whose last donation was less than 90 days ago, when the public directory
      is viewed, then the donor is shown as unavailable — computed by the system, not by a stored flag.
      (REQ-M6-001)
- [ ] **AC-M6-02.** Given the public donor search, when it is filtered by blood group and area, then only
      matching donors are shown, paginated, with masked phone numbers only. A group with no donors shows
      the empty state "এই গ্রুপে দাতা পাওয়া যায়নি". (REQ-M6-002, REQ-M6-003)
- [ ] **AC-M6-03.** Given a donor record, when any public API response is inspected, then it contains no
      full phone number under any circumstance. (REQ-M6-003)
- [ ] **AC-M6-04.** Given an emergency blood request, when it is submitted, then a real request record is
      created, matching donors (same group, available, in the area) are notified, and the request moves
      through its lifecycle. The prototype's behaviour — a confirmation panel with no record and no
      notification — is not present. (REQ-M6-004, REQ-M6-005)
- [ ] **AC-M6-05.** Given a blood request, when the donor grants consent for that request, then the
      requester sees the donor's full number and the grant is logged with a timestamp; when the donor
      revokes, the number is hidden again. The requester's click alone never reveals a number.
      (REQ-M6-003, REQ-M6-006)

### M7 — Content

- [ ] **AC-M7-01.** Given a news article in `draft`, when it is published, then it appears on the news
      list and on the home feed, with a detail page, author, and date. (REQ-M7-001)
- [ ] **AC-M7-02.** Given a notice with an expiry date, when the expiry passes, then it stops appearing
      on the site and the announcement strip automatically. An urgent notice appears on the home ticker
      and triggers a push. (REQ-M7-002)
- [ ] **AC-M7-03.** Given an event, when it is viewed, then date/time and venue are shown (not prose
      only). (REQ-M7-003)
- [ ] **AC-M7-04.** Given a job circular that is not verified, when publishing is attempted, then it is
      refused and the circular stays unpublished. (REQ-M7-004)
- [ ] **AC-M7-05.** Given content in `draft`, when it is submitted for review, then it is not public until it is published; in Phase 1 `review` is a same-person checkpoint (the Super Admin authors and publishes — Doc 05 §9.3), not a second-person approval; a scheduled publish goes live at the set time. (REQ-M7-005)
- [ ] **AC-M7-06.** Given a gallery photo, when it is uploaded, then thumbnails and a WebP version are
      generated by a queue job, and the photo is not public until its consent flag is set. (REQ-M7-006)
- [ ] **AC-M7-07.** Given the video gallery in Phase 1, when it is opened, then it shows the labelled
      placeholder ("ভিডিও গ্যালারি শীঘ্রই আসছে") and no invented video content. (REQ-M7-007)
- [ ] **AC-M7-08.** Given the FAQ, when a visitor searches, then matching questions and answers are
      returned, filterable by category. (REQ-M7-009)

### M8 — Finance

- [ ] **AC-M8-01.** Given a ledger entry, when an edit or delete is attempted at the application level,
      then it is refused; when a correction is needed, a reversal entry pointing at the original is
      created and the history stays intact. (REQ-M8-002)
- [ ] **AC-M8-02.** Given a project, when its page is viewed, then budget, spent (computed from linked
      entries), and status are shown; spent is never a hand-typed number. (REQ-M8-003)
- [ ] **AC-M8-03.** Given the public finance page, when it is viewed, then it shows only the published
      summary at the level agreed in document 13, Q-11, donor names appear only with consent, and no
      demo figure from the prototype is shown. (REQ-M8-004, REQ-M8-007)
- [ ] **AC-M8-04.** Given an annual report, when it is downloaded, then it is a real published file for
      that year with an audited flag; no report is labelled "audited" unless it is audited.
      (REQ-M8-005)
- [ ] **AC-M8-05.** Given the ledger, when the nightly scheduler runs, then the monthly summary is
      updated from the entries. (REQ-M8-006)

### M9 — Notifications

- [ ] **AC-M9-01.** Given any notification sent by any module, when the delivery log is inspected, then
      the recipient, time, channel, and success/failure are recorded. (REQ-M9-001)
- [ ] **AC-M9-02.** Given a new expatriate request, when it is saved, then a Web Push notification reaches
      the helpers' devices even with the browser closed, and clicking it opens the request.
      (REQ-M9-002)
- [ ] **AC-M9-03.** Given a user, when they open their notification list, then it is persistent across
      login sessions, with read/unread state and an unread count on the bell. (REQ-M9-003)
- [ ] **AC-M9-04.** Given a user who turns notifications off, when an event occurs, then they receive
      nothing on that channel. (REQ-M9-004)

### M10 — Admin & Reporting

- [ ] **AC-M10-01.** Given the Super Admin dashboard, when it loads, then it shows members, pending
      approvals, in-progress requests, and the month's accounts. (REQ-M10-001)
- [ ] **AC-M10-02.** Given the Helper dashboard, when it loads, then it shows the request queue with
      search and filters by status/service, and assignment controls. (REQ-M10-002)
- [ ] **AC-M10-03.** Given any module list in the admin panel, when export is used, then a CSV/Excel/PDF
      export is produced. (REQ-M10-003)
- [ ] **AC-M10-04.** Given the activity log, when it is viewed, then every create/update/delete, login,
      approval, finance entry, status change, and consent-based number disclosure is listed with actor,
      time, IP, and old/new values — and no log entry can be deleted, including by an admin.
      (REQ-M10-004)
- [ ] **AC-M10-05.** Given a Helper account, when they try to open any admin area outside expatriate
      requests, then access is denied server-side (not only hidden in the UI). (REQ-M10-006)

### M11 — Public Web Experience

- [ ] **AC-M11-01.** Given the public website, when any page is viewed, then every piece of content on it
      comes from the API; no content is hard-coded in the web client. (REQ-M11-001)
- [ ] **AC-M11-02.** Given the website, when the 18 Direction D views are visited, then each renders
      with its content, and the home page has Direction D's 9 sections. (REQ-M11-002)
- [ ] **AC-M11-03.** Given the language switch, when `/en` is visited, then the page renders in English
      with a Bengali fallback for any missing translation, and the URL is language-based for SEO.
      (REQ-M11-003)
- [ ] **AC-M11-04.** Given a fresh visit, when the site loads, then it opens in light theme.
      (REQ-M11-004)
- [ ] **AC-M11-05.** Given a public page, when its head is inspected, then it has a correct title/meta
      (BN/EN), an Open Graph image, and structured data; `sitemap.xml` lists it, and the sitemap updates
      when a notice is published. (REQ-M11-005)
- [ ] **AC-M11-06.** Given the home hero, when it loads, then it shows live data (next event + open
      request count) from the API, closing QA defect D4 — or, until that data exists, it shows no
      invented live data. (REQ-M11-006)
- [ ] **AC-M11-07.** Given the site at 360px width, when it is checked with real rendered screenshots in
      both themes, then text and photos share the 18px side gutters, nothing is clipped, photos are
      shown whole, the header is a single slim row (max 56px), and there is no horizontal overflow and
      0 console errors. (REQ-M11-007)
- [ ] **AC-M11-08.** Given the contact page, when it is viewed, then it shows real, verified contact
      details and a map (once supplied), and a submitted message appears in the Super Admin's inbox.
      Until real details exist, no invented phone number or address is shown. (REQ-M11-008)

### M12 — Mobile App (Future Mobile; plan Phase 3)

- [ ] **AC-M12-01.** Given the API, when a mobile client calls it, then the same endpoints and the same
      response envelope serve it as serve the web client, with Sanctum token authentication.
      (REQ-M12-001, REQ-M12-004)
- [ ] **AC-M12-02.** M12 has no Phase 1 acceptance criteria. Its criteria are written when Phase 3 is
      scoped. (REQ-M12-005)

## 3. Cross-cutting acceptance criteria

### 3.1 Authentication & authorisation

- [ ] **AC-X-AUTH-01.** Every authenticated endpoint rejects unauthenticated requests with 401, and
      every authorisation failure returns 403 with a bilingual error — never a raw server error.
- [ ] **AC-X-AUTH-02.** A member cannot access another member's requests, profile, family, or
      notifications by changing an ID in the URL or API call (verified by a negative test for each
      resource).
- [ ] **AC-X-AUTH-03.** A Helper cannot read or change finance entries, members, content, or donor
      contact details, via the API or the admin panel. (Verified by a negative test per resource.)
- [ ] **AC-X-AUTH-04.** The web SPA authenticates by Sanctum cookie (same top-level domain); the mobile
      app authenticates by personal access token. API tokens are never used to authenticate the
      first-party web SPA. (Research notes §3.)
- [ ] **AC-X-AUTH-05.** Expired tokens are pruned on schedule; revoking a token (logout, or Super Admin
      action) immediately stops it working.

### 3.2 RBAC

- [ ] **AC-X-RBAC-01.** Every permission in the system follows `resource.action` naming, is registered on
      Laravel's Gate, and is checked in both the API (policies) and the Filament panel (hooks) — one
      permission model, two surfaces.
- [ ] **AC-X-RBAC-02.** Adding a deferred role (for example Treasurer) requires only adding the role and
      its permissions in the admin, with no database or API rebuild. (Verified by adding a test role on
      staging.)

### 3.3 API

- [ ] **AC-X-API-01.** Every endpoint returns the agreed envelope: success `{"data": ..., "meta": {...}}`;
      errors `{"message_bn": "...", "message_en": "...", "error": {"code": "..."}}` with the correct HTTP
      status (401/403/404/422/429).
- [ ] **AC-X-API-02.** Every list endpoint is paginated (default 20, max 50), and cursor pagination is
      used for large public lists.
- [ ] **AC-X-API-03.** API contract tests cover every endpoint's response shape and permissions — in
      particular, no personal field appears in any public API response. (Plan v1.1 §14.)
- [ ] **AC-X-API-04.** An OpenAPI (Swagger) specification is generated from the code and kept current;
      it is the reference a future developer uses. (Plan v1.1 §8.)
- [ ] **AC-X-API-05.** Rate limiting is enforced: strict on the login endpoint (IP + account based, with
      temporary lock), 120 requests/minute/user on the general API. (Plan v1.1 §8.)

### 3.4 Security

- [ ] **AC-X-SEC-01.** The site is served over HTTPS only (Let's Encrypt, auto-renew), with HSTS and CSP
      headers set.
- [ ] **AC-X-SEC-02.** Secrets exist only in `.env`; a scan of the repository finds no secret, and no
      unencrypted `.env` is included in any backup.
- [ ] **AC-X-SEC-03.** File uploads are MIME-checked and scanned; a disallowed file type is rejected with
      a bilingual error.
- [ ] **AC-X-SEC-04.** Phone and beneficiary information are stored in encrypted columns; the
      application decrypts them only for entitled roles.
- [ ] **AC-X-SEC-05.** Telescope (or any debug tool) is not enabled in production.
- [ ] **AC-X-SEC-06.** Every admin action is written to the audit log with actor, time, IP, and old/new
      values; the log cannot be deleted.

### 3.5 Performance

Targets from plan v1.1 §14, labelled as targets (document 02 §5). Each is verified on staging, not
asserted.

- [ ] **AC-X-PERF-01.** Homepage LCP ≤ 2.5 s on mobile 4G.
- [ ] **AC-X-PERF-02.** API response p95 ≤ 300 ms.
- [ ] **AC-X-PERF-03.** Lighthouse Performance 90+ (mobile).
- [ ] **AC-X-PERF-04.** Home page weight under 1.5 MB.
- [ ] **AC-X-PERF-05.** 500 concurrent users sustained in a load test.
- [ ] **AC-X-PERF-06.** Uptime 99.5% per month (measured by 5-minute uptime checks).

### 3.6 Backup & restore

- [ ] **AC-X-BKP-01.** A nightly backup (database + uploads) runs to local storage **and** one off-server
      S3-compatible disk; `backup:clean` runs on schedule; retention is 30 days (daily), 12 weeks (weekly),
      and 12 months (monthly).
- [ ] **AC-X-BKP-02.** Monthly automated restore check + quarterly full restore rehearsal, mandatory, documented (Doc 06 §13), and the result is recorded. An untested backup does not count as a backup.
- [ ] **AC-X-BKP-03.** Recovery meets RPO 24 hours and RTO 4 hours in the drill.

### 3.7 Documentation

- [ ] **AC-X-DOC-01.** The API documentation (OpenAPI) matches the implemented API; a sample call from
      the docs succeeds against staging.
- [ ] **AC-X-DOC-02.** An admin user guide in Bengali exists, covering Super Admin and Helper tasks.
- [ ] **AC-X-DOC-03.** A deployment guide exists, covering environments, backup/restore, and rollback.
- [ ] **AC-X-DOC-04.** The blueprint documents are updated in the same change as any behaviour change,
      so the docs and the system never disagree.

## 4. Phase acceptance (per Engineering Plan v1.1 §15 — plan phase scheme, for traceability)

| Phase (plan v1.1) | Deliverable | Acceptance (plan v1.1 §15) | Doc 12 equivalent |
|---|---|---|
| Phase 0 | Final UI/UX (all screens), sitemap, OpenAPI draft, server and repository setup, CI/CD | Client's written Design Sign-off | Doc 12 Phase 0 |
| Phase 1A | Identity (ordinary login), simple 2-role access, community data model, Filament admin structure, audit log | Ordinary login and member approval flow pass on staging | Doc 12 Phases 1–3 |
| Phase 1B | Expatriate support, blood donors, finance ledger, notifications (Browser Push) | All state machines in plan §9 pass end-to-end tests | Doc 12 Phases 5–6 |
| Phase 1C | Complete Next.js site, bilingual content, gallery, public finance page | Lighthouse budgets and responsive checks pass | Doc 12 Phase 7 |
| Phase 1D | Real data entry support, UAT, security test, production deploy, admin training (1 session + recording) | Client sign-off on the Go-Live checklist | Doc 12 Phase 9 + go-live |
| Phase 2 | Report generator, QR member card, newsletter (payment gateway subject to merchant-account readiness, separate scope) | Feature-based UAT | Post-launch (no Doc 12 phase) |
| Phase 3 | Flutter app, push, offline cache, store submission | Approved and published in both stores | Future Mobile |

Where this table and Doc 12 disagree on ordering, Doc 12 governs the build order.

**Timings are plan estimates, not commitments:** website (Phase 0–1D) approximately 12 weeks; complete
(with apps) approximately 18 weeks (plan v1.1 §15). If the organisation's data is late, the affected
phase moves — the quality bar does not (plan v1.1 §15).

## 5. What "done" means

A module is done when: its criteria in §2 pass on staging with evidence; its cross-cutting criteria in
§3 pass; its known limitations are listed in writing; and the organisation's nominated testers have given
written sign-off. A criterion that cannot be evidenced is reported as not met — never as "done" on the
basis of a verbal claim (plan v1.1 §1, principle 5).
