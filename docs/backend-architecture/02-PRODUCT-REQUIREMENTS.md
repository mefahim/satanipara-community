# 02 — Product Requirements

**Status:** Planned — these requirements specify work to be built. None of them is implemented.
**Sources:** the repository audit (document 01) and Engineering Plan v1.1 (cited as "plan v1.1 §n"
where this document agrees with it). Where a requirement restates a prototype behaviour, the audit
section is cited. Where a requirement goes beyond the prototype, it is stated as a requirement, not as
an existing fact.
**How to read REQ-IDs:** `REQ-<module>-<n>`. Each requirement is written to be testable: it states one
behaviour, one actor, and one observable outcome. Acceptance criteria for these requirements are in
document 14.

---

## 1. Vision

Satanipara Community is the digital platform of Satanipara Somaj Kallyan Sangha (সাতানীপাড়া সমাজকল্যাণ
সংঘ, est. 1999) — brand "Satanipara Community", tagline "একটি এলাকা, একটি পরিবার" (One area, one
family), slogan শিক্ষা • ঐক্য • শান্তি • প্রগতি (Education • Unity • Peace • Progress).

The platform exists so that one area's community can: keep a verified databank of its people, families,
professionals, institutions, and places; publish its organisation, history, constitution, committee, and
annual activities; run expatriate support (help for families at home, requested from abroad) with a
transparent request ID, status timeline, and itemised expense account; run a consent-based blood-donor
service; publish notices, news, events, jobs, and galleries; and show its accounts openly — with no
service charge on expatriate support and no replacement of official emergency services.

**Website first, mobile app later** (plan v1.1 §1, principle 1; Decision Sheet Phase 1 scope). Phase 1
delivers the complete web platform. The mobile app (M12) is plan Phase 3 (Future Mobile) and is specified here only so the
API is built app-ready from the start.

**Design direction:** Direction D ("The Meridian") is the approved frontend direction. These
requirements govern behaviour and content, not visual design; they do not redesign Direction D.

## 2. Users

| User | Who | What they can do (summary) | Admin role? |
|---|---|---|---|
| **Public** (unauthenticated visitor) | Anyone on the internet | Read public content; search the public directory and donors (phones masked); submit an expatriate request, an emergency blood request, and a contact message; track a request by Request ID **and the tracking secret** (Tier-S allowlist only, Doc 04 §7.4); view published finance summaries and reports. No personal data is ever public without consent. | No |
| **Member** (registered community user) | An approved community member / expatriate, logged in with mobile number + password | Everything Public can do, plus: own profile and family information; own expatriate requests (submit, view, confirm completion); member-visible directory information; own notifications. No admin capability. | No — Member is not an admin role |
| **Expatriate Helper** | A person who helps deliver expatriate support on the ground | View the full expatriate request queue; take or be assigned requests; advance status with notes, photos, and expense lines; receive a browser/push notification on every new request. No access to any other module's editing. | Yes (Phase 1 admin role) |
| **Super Admin** | The organisation's main administrator (1–2 people, per plan v1.1 §5) | Everything: members and families (add/approve), community data, committee, activities, content, blood donors, finance, reports, notifications, and creating new users and assigning them the Super Admin or Expatriate Helper role. Resets forgotten passwords. | Yes (Phase 1 admin role) |

**Roles deferred (not Phase 1):** President, General Secretary, Treasurer, and any other committee-based
role. The permission structure must allow them to be added later without a database or API rebuild
(plan v1.1 §5), but they are not implemented in Phase 1 and no requirement in this document assumes
them. See document 13, Q-14.

**Member lifecycle** (per plan v1.1 §5): Registered → Pending Approval → Approved / Rejected →
Suspended. Approval is given by the Super Admin. Account-deletion requests are honoured with a 30-day
grace period before permanent deletion, except that financial and request records are retained in
anonymised form for legal record-keeping (plan v1.1 §6 M1).

## 3. Modules M1–M12 (scope per module)

Modules are exactly as in Engineering Plan v1.1 §6. No module queries another module's tables directly;
modules communicate through service classes (plan v1.1 §3). The module-boundary test (plan v1.1 §6):
when a feature request arrives, the first question is "which module is this?" — if no module fits, it is
a new module or scope, and needs separate approval.

| Module | Name | Product phase (plan v1.1) | Roadmap phase (Doc 12) | Scope in one line |
|---|---|---|---|
| M1 | Identity & Membership | Phase 1 | Phase 2 | Registration, login (no OTP), approval queue, profiles, family members, account deletion. |
| M2 | Community Profile | Phase 1 | Phase 3 | Households/persons databank, computed statistics, professionals directory, institutions and landmarks register. |
| M3 | Organisation | Phase 1 | Phase 3 | History and timeline, constitution, executive committee (term-based), advisory council, former leaders, achievements. |
| M4 | Annual Activities | Phase 1 | Phase 4 | Activities by year and category, with dates, descriptions, photos/video, beneficiary counts, linked annual report. |
| M5 | Expatriate Support | Phase 1 | Phase 5 | Request intake, Request ID, 5-state status machine, 4-node public timeline, helper assignment, expenses with photos, notifications, applicant confirmation. The most sensitive module (plan v1.1 §6). |
| M6 | Blood Donor | Phase 1 | Phase 5 | Donor register, group + area search, emergency blood requests, donor-side consent before any phone number is revealed. |
| M7 | Content | Phase 1 | Phase 4 | Notices, news, events, jobs, student achievements, gallery (photo; video in plan Phase 2), with draft → review → published workflow. |
| M8 | Finance | Phase 1 | Phase 6 | Double-entry-style immutable ledger, project accounts, public summary, annual reports (PDF generation is Phase 2 per plan v1.1 §6 M4/§15; the prototype's `.txt` download is replaced by real published report files). |
| M9 | Notifications | Phase 1 | Phase 5 (partial) + Phase 7 (remainder) | One notification service for all modules: Web Push (primary), in-app list and bell, app push (FCM/APNs in plan Phase 3), email optional in plan Phase 2. No SMS in Phase 1. |
| M10 | Admin & Reporting | Phase 1 | Phase 8 (separate approval) | Filament dashboard, per-module list/filter/export, activity-log viewer, system health. |
| M11 | Public Web Experience | Phase 1 | Phase 7 | The public website (Next.js): home, directory, organisation, activities, expatriate support, blood donors, news, finance, membership, contact, FAQ, privacy — all content from the API, nothing hard-coded. BN/EN, light/dark, fully responsive. |
| M12 | Mobile App | Phase 3 | Future Mobile | Flutter Android + iOS app: Home, Community, Services, Profile (bottom navigation), offline reading cache, push deep-links, optional biometric unlock, forced-update policy. **Not built in Phase 1; the API must be app-ready.** |

---

## 4. Functional requirements

### M1 — Identity & Membership

| ID | Requirement | Source |
|---|---|---|
| REQ-M1-001 | A visitor can register with name, mobile number, password, area, member type (resident / expatriate / student), and an optional "also list me as a blood donor" opt-in — the fields of the prototype `#regForm` (audit §3.4). | Audit §4 #30 |
| REQ-M1-002 | A mobile number can be registered only once; a duplicate registration is rejected with a bilingual error. (The prototype never checks duplicates because it stores nothing.) | Audit §7.3 |
| REQ-M1-003 | Passwords are stored only as hashes, never in plain text. The prototype's plaintext demo passwords (`demo1234`, `helper1234`) are deleted and never carried into the real system. | Audit §6.5; plan v1.1 §12 |
| REQ-M1-004 | Registration creates an account in `pending` status; the account can log in but sees an 'awaiting approval' screen with services locked until the Super Admin approves it. (Recommended, pending Fahim's confirmation — REG-AUTH-01.) Member lifecycle: Registered → Pending Approval → Approved / Rejected → Suspended. | Plan v1.1 §5 |
| REQ-M1-005 | The Super Admin can create users directly and assign them the Super Admin or Expatriate Helper role, and can approve, reject, or suspend member accounts. (No UI for this exists in the prototype — it is new admin work.) | Audit §9.2; plan v1.1 §5 |
| REQ-M1-006 | A member can log in with mobile number + password only. There is no OTP anywhere in Phase 1. | Decision Sheet |
| REQ-M1-007 | Failed logins are rate-limited per IP and per account, with a temporary lock after a defined number of wrong attempts. (The prototype has no lockout.) | Plan v1.1 §5, §12 |
| REQ-M1-008 | A member can view and edit their own profile: name (BN/EN), phone, area, country (for expatriates), family information, photo, and profession. The prototype's profile form has no validation at all and saves nothing; the backend validates server-side and persists. | Audit §4 #33; plan v1.1 §6 M1 |
| REQ-M1-009 | A member can add family members to their profile. (Present in the v1 prototype's dashboard; dropped in Direction D; restored here as a requirement.) | Audit §9.13 |
| REQ-M1-010 | A member can request deletion of their account; deletion takes effect after a 30-day grace period, and financial/request records are retained only in anonymised form. | Plan v1.1 §6 M1 |
| REQ-M1-011 | A forgotten password is reset by the Super Admin via a system-generated, single-use temporary password (24 h expiry, Doc 04 §5.5). There is no OTP and no SMS in Phase 1; a self-service email/SMS reset flow is an open question (document 13, Q-04) and must not be invented without that decision. | Decision Sheet; audit §9.4 |
| REQ-M1-012 | Every member has a unique member ID, issued at approval. (The prototype has no member ID.) | Audit §9.13 |
| REQ-M1-013 | Server-side validation enforces, as a minimum, the prototype's client-side rules: names 2+ characters; phone 10+ digits; password per Doc 04 §5.1 (12 characters minimum, 16 for Super Admin, no composition rules, mandatory breach screening, history of 5). | Audit §7.1 |

### M2 — Community Profile

| ID | Requirement | Source |
|---|---|---|
| REQ-M2-001 | The Super Admin can manage households (house, holding, area/para) and persons (name BN/EN, gender, date of birth, profession, expatriate country, visibility, consent). | Plan v1.1 §7 |
| REQ-M2-002 | Statistics (total population, expatriate count, member/family counts, gender and age breakdown, expatriates by country) are **computed from the persons table** and cached (15 minutes, per plan v1.1 §7), never hand-typed. Where data is unverified, the public site shows "তথ্য হালনাগাদ হচ্ছে" instead of a number. | Audit §3.2; plan v1.1 §7 |
| REQ-M2-003 | The public directory is searchable by name (BN and EN), role, and area, and filterable by category: teacher, doctor, professional, business, institution, place — the prototype's `#dirFilter` categories (audit §3.4). Results are paginated server-side. (The prototype filters a 10-row array in the browser.) | Audit §4 #3 |
| REQ-M2-004 | A separate professionals listing/filter exists, with a profession taxonomy (doctor, engineer, teacher, lawyer, journalist, government officer, police/army, businessperson — per plan v1.1 §6 M2). The prototype has no separate professionals view; this is new. | Audit §4 #4; plan v1.1 §6 M2 |
| REQ-M2-005 | Institutions (school, mosque, madrasa, clinic, and others) have profiles with type, services, hours, contact, and location, plus a detail view. The prototype has 3 institution entries with no detail page and no such fields. | Audit §4 #5; plan v1.1 §7 |
| REQ-M2-006 | Infrastructure/landmarks (fields, graveyards, roads, and other facilities) have a catalogue with location and status. The prototype has no infrastructure feature at all; this is new. A map is **Under review** (see document 13, Q-15). | Audit §4 #6 |
| REQ-M2-007 | Every person/institution record carries `visibility` (public / members-only / private) and `consent_status`. A record is public only with recorded consent; withdrawing consent hides it immediately from the API. | Plan v1.1 §6 M2, §7 |
| REQ-M2-008 | A freedom-fighter register exists as a dedicated honoured page (persons linked 1:1, per plan v1.1 §7). The prototype has no such page. | Plan v1.1 §6 M2, §7 |
| REQ-M2-009 | Date of birth is never sent to a public view; only an age band is shown. | Plan v1.1 §7 |
| REQ-M2-010 | Directory entries are published only after approval (Super Admin), so that real data is published only with consent. | Audit §4 #3 |

### M3 — Organisation

| ID | Requirement | Source |
|---|---|---|
| REQ-M3-001 | The Super Admin can manage dated history/timeline milestones, each with a verification flag. Only verified milestones are published. The only verified milestone today is the 1999 founding; no other date may be invented. | Audit §4 #7 |
| REQ-M3-002 | The heritage timeline (the Meridian on the home page) is driven by the same milestone records as the organisation history page — one source, not two copies. (The prototype types the same 1999 paragraph twice as inline HTML.) | Audit §5 |
| REQ-M3-003 | The constitution is stored as versioned articles/clauses, with a downloadable document (PDF upload). The prototype's 5-article text is explicitly a sample summary, not the constitution, and must be replaced by the real text supplied by the organisation. | Audit §4 #8; plan v1.1 §6 M3 |
| REQ-M3-004 | The executive committee is managed by term: members, roles, term start/end. An ended term is archived and remains in history. | Plan v1.1 §6 M3 |
| REQ-M3-005 | The advisory council and the former-leaders list (with complete term ranges) are managed the same way as the committee, with distinct roles/statuses. (The prototype's former-leader terms are open-ended or blank.) | Audit §4 #10–#11 |
| REQ-M3-006 | Achievements are managed as timeline entries linked to the organisation history. | Plan v1.1 §7 |
| REQ-M3-007 | Committee/advisory/former-leader records are public to view and admin-only to edit; contact details for office-holders are shown only under the organisation's contact rules (see document 13, Q-06). | Audit §4 #9–#11 |

### M4 — Annual Activities

| ID | Requirement | Source |
|---|---|---|
| REQ-M4-001 | The Super Admin can create, edit, and archive activities with year, category, date, title, body (BN/EN), images, beneficiary count, and a linked annual-report document. | Plan v1.1 §6 M4 |
| REQ-M4-002 | Activities are filterable by year and by category. Categories: scholarship, winter clothing, blood donation, medical camp, tree plantation, national day, relief, other (plan v1.1 §6 M4). **The prototype's category filter has no data behind it** (activity objects carry no category field in Direction D) — the backend must store a category on every activity. | Audit §8.7; plan v1.1 §6 M4 |
| REQ-M4-003 | Each activity has a public detail page (title, meta, image, body) reachable by ID/slug. Unknown IDs fall back as the prototype does (first activity) only if the organisation so decides; otherwise a 404 — see document 13, Q-16. | Audit §4 #13 |
| REQ-M4-004 | A year's activities are archived automatically at year end; archived years remain browsable. | Plan v1.1 §6 M4 |
| REQ-M4-005 | Activity images are uploaded through the media library with consent flags; the prototype's embedded base64 demo images are replaced, not reused. | Audit §9.10 |

### M5 — Expatriate Support (most sensitive module)

| ID | Requirement | Source |
|---|---|---|
| REQ-M5-001 | A visitor can submit an expatriate request without logging in (as in the prototype, where the wizard is reachable logged-out). Whether production submission requires login is an **open question** (document 13, Q-03) — the backend must be built so the requirement can change without a rewrite. | Audit §4 #14; doc 13 Q-03 |
| REQ-M5-002 | The request form captures: service type (7 services — grocery, medicine, hospital, elderly care, home emergency work, document collection, general help), for-whom, details (minimum 10 characters), urgency (urgent / today / tomorrow / this week), applicant name, applicant phone, applicant country, and a consent checkbox that must be checked. These are the prototype's `#expForm1`/`#expForm2` fields and rules (audit §3.4). | Audit §3.4 |
| REQ-M5-003 | The wizard step count (3 panes + success as built, vs 4 steps in `DESIGN_SYSTEM.md` §7.1) is **unresolved (D11)**. The backend must accept the wizard's data regardless of how many steps the frontend presents; the step count itself is a frontend/design decision recorded in document 13, Q-01. | Audit §8.11; doc 13 Q-01 |
| REQ-M5-004 | On submission the server generates a unique Request ID in the format `EXP-YYYY-####` (sequence-based, never reused, collision-proof). The prototype's random IDs can collide and hard-code the creation date; both defects are fixed here. | Audit §8.10; plan v1.1 §7 |
| REQ-M5-005 | Request status follows the state machine `pending → accepted → in_progress → completed → closed`, with `rejected` (with reason) and `cancelled` (by the applicant) as exits. Invalid transitions (for example pending → completed directly) are rejected by the system. | Plan v1.1 §9 |
| REQ-M5-006 | A request can be assigned to an Expatriate Helper (and a backup helper). Assignment is recorded with actor and timestamp. (The prototype has no assignment UI — status only advances.) | Audit §4 #15; plan v1.1 §6 M5 |
| REQ-M5-007 | Every status change records actor, timestamp, and note in a status history; the history is shown on the tracking timeline. (The prototype fills a generic note with no actor or timestamp.) | Audit §6; plan v1.1 §9 |
| REQ-M5-008 | The assigned helper (or Super Admin) can add update notes and photos to a request, including proof-of-delivery photos. The home §05 copy promises "ছবিসহ আপডেট" (updates with photos); no prototype implements it. | Audit §9.8 |
| REQ-M5-009 | Expenses are recorded as itemised lines (item, amount in BDT, receipt/photo where available). **There is no service-charge field anywhere in the system** — the applicant pays actual product cost + transport only. The tracking view shows the itemised lines + a server-computed total with "মোট (সার্ভিস চার্জ ০)" (the API returns the constant `service_charge: 0`; no service-charge column exists). | Decision Sheet; plan v1.1 §6 M5 |
| REQ-M5-010 | A request can reach `completed` only when at least one expense line exists or a "no expense incurred" declaration is recorded. | Plan v1.1 §9 |
| REQ-M5-011 | A request reaches `closed` only on the applicant's confirmation. | Plan v1.1 §6 M5 |
| REQ-M5-012 | If a request stays in `in_progress` for 72 hours without an update, the Super Admin receives an automatic reminder. | Plan v1.1 §9 |
| REQ-M5-013 | Any visitor with a Request ID **and** the tracking secret can track it publicly (no login), seeing only the Tier-S allowlist (Doc 04 §7.4 — canonical wording; full field table in Worker C `ALLOWLIST.md`): status, service type, the 4-node tracking timeline (Pending → Accepted → In Progress → Completed; `closed` shown as a completion banner; `rejected`/`cancelled` replace the timeline with a terminal-state notice), and the expense ledger — i.e. the itemised expense lines + server-computed total + constant service charge 0, without vouchers. The prototype's exposure of applicant name and area in `#trMeta` is NOT carried forward. Whether the Tier-S view should additionally include the applicant's first name or the beneficiary name is open (document 13, Q-02 / AO-04; default: no). | Audit §4 #16; doc 13 Q-02 |
| REQ-M5-014 | On submission, every Expatriate Helper and the Super Admin receive a browser/push notification with the Request ID. For an urgent request, the backup helper is notified as well. (Prototype: simulated toast only.) | Decision Sheet; plan v1.1 §5, §9 |
| REQ-M5-015 | The member's "My Requests" list shows only that member's own requests. The prototype's bug — the seeded demo request `EXP-2026-1052` appended to every member's list — must not be reproduced. | Audit §8.9 |
| REQ-M5-016 | The permanent disclaimer is shown wherever expatriate support is presented: "This service is not a replacement for official emergency services (call 999 first) / not an ambulance replacement." The Emergency Response Team is 3–5 people; its roster and on-call rotation are admin-managed. | Decision Sheet; plan v1.1 §6 M5 |
| REQ-M5-017 | An emergency flag can be set on a request; flagged requests alert the Emergency Response Team under escalation rules defined by the organisation (see document 13, Q-17). The prototype has no expatriate-emergency request path. | Audit §4 #17 |

### M6 — Blood Donor

| ID | Requirement | Source |
|---|---|---|
| REQ-M6-001 | A donor can register with name, blood group, area, and last donation date. Availability is **computed by the system**: a donor is not shown as available until 90 days after the last donation (plan v1.1 §6 M6). The prototype stores availability as a static flag and free-text last-donation ("৩ মাস আগে"). | Plan v1.1 §6 M6; audit §5.2 |
| REQ-M6-002 | The public donor directory is searchable by name/area and filterable by blood group (all 8 groups). Donors with no match show the empty state "এই গ্রুপে দাতা পাওয়া যায়নি". Results are paginated server-side. | Audit §4 #18 |
| REQ-M6-003 | Donor phone numbers are **never public**. Search results show masked numbers only. A full number is revealed to a requester only after the donor grants consent for that specific request, and the grant is logged with a timestamp. (The prototype reveals the number on the requester's own click, with no donor involved — that behaviour must not be reproduced.) | Decision Sheet; audit §4 #19 |
| REQ-M6-004 | A visitor can submit an emergency blood request with blood group, units (1/2/3/4+ bags), hospital, and contact phone — the prototype's `#bloodForm` fields and rules (hospital name 3+ characters; phone 10+ digits). | Audit §3.4 |
| REQ-M6-005 | Submitting an emergency blood request creates a real request record, notifies matching donors (same blood group, available, in the area), and tracks the request through a lifecycle (submitted → donors notified → consent granted → fulfilled / closed). The prototype creates no record and notifies no donor. | Audit §4 #19; plan v1.1 §6 M6 |
| REQ-M6-006 | A donor can grant or revoke consent for a specific request; revocation hides the number again. Consent records are retained in the audit log. | Plan v1.1 §7 |
| REQ-M6-007 | Donor records carry consent and visibility flags; a donor whose consent is withdrawn is not listed publicly. | Plan v1.1 §7 |

### M7 — Content

| ID | Requirement | Source |
|---|---|---|
| REQ-M7-001 | The Super Admin can create and publish news articles (date, tag, title, body BN/EN, author, images, detail page). The prototype's 2 news items have no detail page, no author, and no images. | Audit §4 #20 |
| REQ-M7-002 | Notices are managed with dates, expiry, and priority, and can be shown on the home announcement strip and (for urgent notices) the home ticker and push notification. Expired notices stop showing automatically. | Plan v1.1 §6 M7; audit §4 #21 |
| REQ-M7-003 | Events are managed with date/time, venue, and body, and can be listed as upcoming. RSVP is **Under review** (document 13, Q-18). | Audit §4 #22 |
| REQ-M7-004 | Job circulars are published only after verification, with employer, deadline, details, and an application route. Unverified circulars are never published. | Audit §4 #23 |
| REQ-M7-005 | Content follows the workflow Draft → Review → Published. In Phase 1 `review` is a same-person checkpoint (the Super Admin authors and publishes — Doc 05 §9.3), not a second-person approval; the state exists so the future Content Editor split needs no schema change. Scheduled publishing is supported (publish at a set time). | Plan v1.1 §6 M7 |
| REQ-M7-006 | The photo gallery is managed as albums with captions (BN/EN), ordering, and consent flags. Images are uploaded through the media library with automatic thumbnails and WebP conversion (queue job, per plan v1.1 §6 M7). The prototype's 8 base64 demo images are replaced. | Audit §4 #24; plan v1.1 §6 M7 |
| REQ-M7-007 | The video gallery is **plan Phase 2** (plan v1.1 §2, Phase 2: video streaming optimisation). In Phase 1 it remains a labelled placeholder ("ভিডিও গ্যালারি শীঘ্রই আসছে"), with no invented video content. Video upload, size limits, and poster frames are specified for plan Phase 2. | Audit §4 #25; plan v1.1 §2 |
| REQ-M7-008 | Student achievements are a content category (notice/news category), per plan v1.1 §6 M7. | Plan v1.1 §6 M7 |
| REQ-M7-009 | The FAQ is managed (question, answer BN/EN, category, order) with search. The prototype's 5 Q&A are static. | Audit §4 #36 |

### M8 — Finance

| ID | Requirement | Source |
|---|---|---|
| REQ-M8-001 | The Super Admin enters ledger entries with type (income / expense / donation), category, linked project/activity, amount in BDT `numeric(12,2)`, date, payee, voucher image, entered-by, and approved-by. | Plan v1.1 §6 M8, §7 |
| REQ-M8-002 | Ledger entries are **immutable at the database level as well as the application level**: they cannot be edited or deleted — not by the application, not by a direct database session. The only permitted state changes are `draft → draft` (field edit), `draft → published` (approve IS publish, dual control), `draft → discarded` (status change, never a delete), and `published → reversed` (only via an approved reversal, changing only the status). A reversed or discarded entry can never change again, and a reversal entry can never itself be reversed. An error in a published entry is corrected only by a reversal entry that points at the original entry (Doc 06 §7.1). | Plan v1.1 §6 M8, §7 |
| REQ-M8-003 | Project accounts track budget vs spent vs status per project, linked to ledger entries. The prototype's Direction D has no project-accounts table; the editorial alternative's 4 demo projects are demo data, not a specification. | Audit §4 #28 |
| REQ-M8-004 | The public finance page shows only the published summary: monthly summary and per-project totals. Donor names appear only with the donor's consent. The exact public summary level (monthly totals only, or project-level detail) is an open decision (document 13, Q-11; plan v1.1 §17 decision 7). | Plan v1.1 §6 M8; doc 13 Q-11 |
| REQ-M8-005 | Annual reports are published per year as real files (PDF + summary), versioned, with an audited flag. The prototype's generated `.txt` download is replaced; automatic PDF generation is plan Phase 2 (plan v1.1 §15). | Audit §4 #29; plan v1.1 §15 |
| REQ-M8-006 | Monthly balances are computed on read from published entries, with a 15-minute cache; there is no stored snapshot table and no nightly summary update in Phase 1 (Doc 06 §9.1/§12; decided Phase 0.1, Doc 15 §7 item 8). Known limitation: a later reversal changes the next computed summary — the summary is always "as of now", not a frozen historical record. | Plan v1.1 §7 |
| REQ-M8-007 | All finance figures shown publicly are real, audited, and labelled as such; demo figures from the prototype (`FINANCE` 2024–2026) are never published. Where no audited figure exists, the page shows "তথ্য হালনাগাদ হচ্ছে". | Audit §6.4 |

### M9 — Notifications

| ID | Requirement | Source |
|---|---|---|
| REQ-M9-001 | One notification service serves all modules. Every notification is logged (recipient, time, success/failure). | Plan v1.1 §6 M9 |
| REQ-M9-002 | A new expatriate request triggers a Web Push (VAPID + Service Worker) notification to the Super Admin and all Helpers, reaching the device even when the browser is closed; clicking it opens the request directly. Helpers grant permission once, at first dashboard login. | Plan v1.1 §5, §6 M9 |
| REQ-M9-003 | Every user has a persistent in-app notification list with a bell icon, unread count, and read/unread state. The prototype's list starts empty on every load and is session-only. | Audit §4 #34 |
| REQ-M9-004 | A user can turn notifications off from browser/app settings. Each device/browser subscription is stored separately. | Plan v1.1 §6 M9 |
| REQ-M9-005 | App push (FCM/APNs) is delivered in plan Phase 3 (Future Mobile) with the mobile app; the notification service is built so app push is an added channel, not a rebuild. | Plan v1.1 §6 M9 |
| REQ-M9-006 | Email notification is optional in plan Phase 2; there is no SMS in Phase 1. | Plan v1.1 §6 M9 |
| REQ-M9-007 | No notification is sent for a request, donor, or finance event to anyone who is not entitled to see that event (role- and consent-checked at send time). | Plan v1.1 §12 |

### M10 — Admin & Reporting

| ID | Requirement | Source |
|---|---|---|
| REQ-M10-001 | The Super Admin has a dashboard showing key numbers: members, pending approvals, in-progress requests, and the month's accounts (plan v1.1 §6 M10). The prototype has no Super Admin dashboard at all. | Audit §4 #32; plan v1.1 §6 M10 |
| REQ-M10-002 | The Helper has a dashboard showing the request queue with search, filter by status/service, and assignment. (The prototype's helper queue lists all requests with no search, filter, pagination, or assignment.) | Audit §4 #15 |
| REQ-M10-003 | Every module has list, filter, and export (CSV/Excel/PDF) in the admin panel. | Plan v1.1 §6 M10 |
| REQ-M10-004 | An activity-log viewer shows who did what, when, and to which record — including logins, approvals, finance entries, status changes, and consent-based number disclosures. The log cannot be deleted, including by an admin. Retention is permanent (no purge); the plan's "at least 2 years" (plan v1.1 §12) is the floor, not the rule. | Plan v1.1 §12 |
| REQ-M10-005 | System health is visible: queue status and the date of the last successful backup. | Plan v1.1 §6 M10 |
| REQ-M10-006 | The admin panel enforces roles server-side: a Helper sees and edits only expatriate requests; every other module is Super Admin only. Filament's access hooks (`canAccessPanel()`, per-resource `can*()`) are wired to the same gates/policies as the API. | Decision Sheet; research notes §4 |

### M11 — Public Web Experience

| ID | Requirement | Source |
|---|---|---|
| REQ-M11-001 | The public website (Next.js) renders all content from the API. No content is hard-coded in the web client. | Plan v1.1 §6 M11 |
| REQ-M11-002 | The website has the 18 views of Direction D (home, directory, organization, activities, activity detail, expatriate, blood, news, finance, membership, login, dashboard, profile, my-requests, contact, FAQ, privacy, rationale) with hash-equivalent routing in the new stack. The home page has Direction D's 9 sections; the plan's 11-part homepage (§6 M11) is superseded by Direction D for the frontend — see document 01 §2 and document 13, Q-19. | Audit §3.1; plan v1.1 §6 M11 |
| REQ-M11-003 | BN/EN language switch is URL-based (`/bn`, `/en`) for SEO (plan v1.1 §6 M11). Content falls back to Bengali where a translation is missing. The prototype's toggle is client-side only and its demo data stays in its stored language. | Plan v1.1 §6 M11, §7 |
| REQ-M11-004 | Light/dark mode is supported, opening in light by default (as the prototype does). Whether the preference persists across visits is an open question (document 13, Q-20). | Audit §3.3 |
| REQ-M11-005 | Every public page has correct title/meta (BN/EN), Open Graph image, an automatically updated `sitemap.xml`, and structured data (Organization, Event), with clean slugs. The sitemap updates when a notice is published. | Plan v1.1 §14 |
| REQ-M11-006 | The home hero shows live data (next event + open request count) once the backend supplies it — closing QA defect D4. Until then the hero ships without invented live data. | Audit §8.11 D4 |
| REQ-M11-007 | The site is fully responsive, with the mobile rules proven in Direction D: 18px side gutters at 360px, photos shown whole on phones, single slim header row (max 56px), no horizontal overflow. | Audit §2.1 |
| REQ-M11-008 | The contact page shows real contact details (office address, hours, phone, email) once the organisation supplies and verifies them, plus a map. Until then it shows no invented contact details and no sample phone number. A contact message is stored in an inbox the Super Admin can list and reply to. | Audit §4 #35; doc 13 Q-06 |

### M12 — Mobile App (Future Mobile; plan Phase 3; API-ready in Phase 1)

| ID | Requirement | Source |
|---|---|---|
| REQ-M12-001 | The API serves the mobile app with the same endpoints and the same response envelope as the web client. No mobile-only backend is built. | Plan v1.1 §8 |
| REQ-M12-002 | The app (Flutter, Android + iOS) has bottom navigation: Home, Community, Services, Profile. | Plan v1.1 §6 M12 |
| REQ-M12-003 | The app supports offline reading cache for notices and the directory, push deep-links (a notification opens the related request/notice directly), optional biometric unlock, and a forced-update policy for app versions. | Plan v1.1 §6 M12 |
| REQ-M12-004 | The app authenticates with Sanctum personal access tokens (not cookie auth). Login is mobile number + password, no OTP. | Research notes §3 |
| REQ-M12-005 | M12 is **Not yet implemented** in Phase 1. No requirement in this section authorises building the app in Phase 1. | Plan v1.1 §2 |

---

## 5. Non-functional requirements (plan targets, not guarantees)

These targets are taken from Engineering Plan v1.1 §14. They are **targets to design and test against**,
not guarantees and not measured results — nothing has been built or measured yet. Each target is
labelled as such wherever it is repeated.

| ID | Area | Target (plan v1.1 §14) | How it is verified |
|---|---|---|---|
| NFR-001 | Performance | Homepage LCP ≤ 2.5 s on mobile 4G. | Lighthouse / field measurement on staging, mobile 4G profile. |
| NFR-002 | Performance | API response p95 ≤ 300 ms. | Load test against the staging API. |
| NFR-003 | Performance | Lighthouse Performance 90+ (mobile). | Lighthouse run on staging. |
| NFR-004 | Performance | Home page weight under 1.5 MB. (Note: the prototype `index.html` alone is ~12.4 MB, dominated by embedded base64 images — the production site must not ship images this way.) | Build/page-weight audit. |
| NFR-005 | Scalability | 500 concurrent users (verified by load test). | Load test. |
| NFR-006 | Availability | Uptime 99.5% per month. | Uptime monitoring (5-minute checks, per plan v1.1 §13). |
| NFR-007 | Reliability | RPO 24 hours (at most one day of data loss); RTO 4 hours (recovery time after a disaster). | Backup/restore drills (see document 14). |
| NFR-008 | Testing | Business-logic coverage 80%+ (Pest/PHPUnit). Every valid and invalid state-machine transition tested. API contract tests for every endpoint's response shape and permissions — especially that no personal field leaks into a public API response. | Coverage report; contract-test suite. |
| NFR-009 | Security | HTTPS mandatory (Let's Encrypt, auto-renew); security headers (HSTS, CSP); Laravel CSRF/XSS/SQL-injection protections; file uploads MIME-checked and scanned; secrets in `.env` only, never in Git. | Security checklist in document 14. |
| NFR-010 | Privacy | Phone and beneficiary information in encrypted columns; API responses field-filtered by role; public API contains no personal field at all (verified by test). Consent withdrawal takes effect immediately. | Contract tests; privacy review. |
| NFR-011 | Accessibility | The public site passes a keyboard/screen-reader/reduced-motion review. (The prototype's accessibility pass is unverified — audit §8.15.) | Accessibility audit on staging. |
| NFR-012 | SEO | See REQ-M11-005. | SEO checklist in document 14. |
| NFR-013 | Backup | Nightly database dump to off-server S3-compatible storage; three-tier retention — daily 30 days, weekly 12 weeks, monthly 12 months (Doc 06 §12); media with versioning, deleted files recoverable for 30 days; monthly automated restore check + quarterly full restore rehearsal, mandatory, documented (Doc 06 §13). | Backup/restore drill records. |
| NFR-014 | Maintainability | Every schema change is a Laravel migration with a reversible `down()`; hand-run SQL on the production database is prohibited. | Code review; deployment checklist. |

**Bengali search quality — measured on MySQL 8.0.46 (Phase 0.1, Investigator E); that measurement does NOT transfer to MariaDB 11.8.9.** The ngram `FULLTEXT` + BOOLEAN MODE recommendation (Doc 15 §9) cannot be implemented on MariaDB (no ngram parser). NATURAL LANGUAGE MODE must NOT be the default. Re-validation on MariaDB 11.8.9 with real Bengali text is required before any search-quality or performance claim (Doc 13 Q-13; see 16-MARIADB-ADDENDUM.md).

## 6. Constraints

1. **Two admin roles in Phase 1 only** — Super Admin and Expatriate Helper. No other role is
   implemented, and no requirement assumes one.
2. **No OTP, no SMS in Phase 1.** Login is mobile + password. Forgotten passwords are reset by the
   Super Admin (mechanism open — document 13, Q-04).
3. **No online payment or donation gateway in Phase 1.** Finance is record-and-display only; money
   moves offline. (Plan v1.1 §2, Phase 2.)
4. **No NID verification, no third-party identity-database integration.** Identity is verified manually
   by an admin. (Plan v1.1 §2.)
5. **No service-charge field anywhere in the system** (expatriate support). Applicant pays actual
   product cost + transport only.
6. **The service is not an emergency service.** The 999/ambulance disclaimer is permanent on every
   expatriate-support surface.
7. **Demo data is not production data.** No demo name, figure, photo, or finance row is carried into
   production. Real data replaces it only after client approval and (for people) individual consent.
8. **Statistics are computed, never hand-typed.** Where data is unverified, show "তথ্য হালনাগাদ হচ্ছে".
9. **Technology constraints (Decision Sheet, from research notes):** Laravel 13 (`^13.0`), PHP 8.4 or
   8.5 (floor 8.3, never 8.2), MariaDB 11.8.9 + InnoDB (Confirmed, 2026-11-14 — Fahim; see 16-MARIADB-ADDENDUM.md; the PostgreSQL lean and the Phase 0.1 MySQL 8.4 decision are both superseded), Sanctum `^4.0`,
   Spatie Laravel Permission v8 (`^8.0`), Filament 5 (`^5.0`), database queue/cache to start (Redis +
   Horizon deferred), Scout `database` engine to start, local `public` disk to start (S3-compatible
   later), spatie/laravel-backup v10 with a mandatory monthly automated restore check + quarterly
   full restore rehearsal, Pest 4 / PHPUnit 12
   (Pest 5 opt-in only, PHP ^8.4).
10. **No prices in the blueprint.** Quotation is separate and not part of these requirements.

## 7. Out of scope (Phase 1)

Per Engineering Plan v1.1 §2 and the Decision Sheet. These are **not** requirements, and building any of
them in Phase 1 needs a separate, written approval (change control, plan v1.1 §15).

- Online payment/donation collection (plan Phase 2, subject to the organisation's merchant-account readiness).
- Live chat, video calls, e-commerce/shop, online courses.
- NID or any third-party (government) database verification.
- OTP login.
- President / GS / Treasurer and other committee-based admin roles.
- Video gallery streaming optimisation and automatic annual-report PDF generation (both plan Phase 2).
- Email newsletter, member card / QR ID (plan Phase 2).
- Mobile app (Future Mobile; plan Phase 3).
- Content writing, photography, and real data collection — the organisation's responsibility; the
  developer provides only the upload structure.
- Voting features. (Membership copy in the prototype mentions "ভোটাধিকারসহ সব সুবিধা" — voting rights —
  but no voting feature exists anywhere; it is not a Phase 1 requirement. See document 13, Q-21.)

## 8. Dependencies on client-supplied real data

The backend can be built without real data, but it cannot launch with it. The following must come from
the organisation (plan v1.1 §17; document 13). A data-collection template (spreadsheet) is supplied in
Phase 0 so the structure is ready before the data arrives; late data delays the affected step, not the
quality bar (plan v1.1 §15).

1. Real member/family/expatriate counts and records (with consent for each publishable record).
2. Real committee, advisory council, and former-leader lists with correct roles and term dates.
3. Real donor registry with consent for listing.
4. Real finance records and audited reports.
5. Real photos with consent, and the real constitution text.
6. Year-by-year history beyond 1999, only where documents verify it.
7. Real contact details (office address, hours, phone, email) and the domain name and logo.
8. The final list of Expatriate Helpers (who receives browser notifications) and the Emergency
   Response Team roster (3–5 people).
9. Decisions on what is public vs members-only, and on the public finance summary level.
10. UAT testers (2–3 people) and a named person responsible for sign-off at each step.
