# 09 — Admin Dashboard Requirements

| | |
|---|---|
| Document | Satanipara Community — Phase 0 Backend Blueprint, Doc 09 |
| Status | **Planned** — planning only; no backend code, no UI, and no mockups exist yet |
| Sources | Decision Sheet (single source of truth); Audit Findings (37 features, gaps); Research Notes (verified 2026-11-14); Engineering Plan v1.1 |
| Implementation vehicle | Filament 5.x (`^5.0`) — per Decision Sheet and ADR-011. This document specifies **behaviour**, not visuals. No screen is designed here; no mockup is included |

> **Scope of this document.** This is a functional specification for the admin dashboard: what each module must do, who may do it, what data it shows, and how it behaves in empty, loading, and error states. It does not design screens, choose layouts, or prescribe Filament component choices beyond the behaviour they must deliver. The dashboard itself is Phase 8 in the roadmap (Doc 12) and is built **only after separate approval** — the requirements are specified now so the API (Doc 07) and the data model support them.

> **Phase 1 role constraint — applies throughout this document.** Only two admin roles exist in Phase 1: **Super Admin** and **Expatriate Helper** (Decision Sheet, final). An Expatriate Helper sees **only expatriate requests** — the helper's dashboard is the request queue and nothing else. Every other module in this document is Super Admin-only in Phase 1. Other roles (President, General Secretary, Treasurer, etc.) are **deferred** and must not be implemented in Phase 1. Where a module below names a role that does not exist yet (e.g. Treasurer for finance approval), the requirement is written for the future role and the Phase 1 behaviour is stated explicitly: the Super Admin performs it.

## 1. Principles

1. **The dashboard is a client of the same API.** Wherever the API already defines an endpoint (Doc 07 §14), the dashboard uses it. The dashboard does not get a private, undocumented API. Filament resources that need data the API does not yet expose must have the API endpoint added first (or the gap recorded as an open decision).
2. **Permissions are enforced server-side, twice.** Filament's `canAccessPanel()` / `can*()` hooks hide what a user may not use, **and** the underlying API/policy layer denies it. Hiding a menu item is not access control (see Doc 08 §8).
3. **Nothing is published by accident.** Every publish, approve, and delete action is explicit, confirmed, and audited. Drafts are never public.
4. **Money is never edited.** Ledger entries are immutable; corrections are reversal entries only (Doc 07 §14.9).
5. **Every list is searchable, filterable, and paginated.** The prototype rendered at most 10 rows with no pagination (Audit Findings §3.1). The dashboard lists are page-based (Doc 07 §5): default 20 rows, maximum 50.
6. **Empty, loading, and error states are specified, not improvised.** Every module below defines all three.
7. **Bengali-first.** The dashboard's working language is Bengali with English where the organisation needs it. All labels, messages, and confirmations are bilingual in the same way as the API error envelope (Doc 07 §3.2).

## 2. Navigation structure

The dashboard navigation is organised by module. Visibility is permission-driven: a user sees only the sections their permissions allow. In Phase 1, a Helper sees exactly one section (**Expatriate Operations**); a Super Admin sees all sections.

| Group | Sections | Phase 1 visibility |
|---|---|---|
| Overview | Dashboard (overview) | Super Admin; Helper sees a reduced overview (their queue only) |
| People | Users, Members, Roles & Permissions | Super Admin only |
| Community | Organisation, Committee, Directory, Infrastructure | Super Admin only |
| Services | Expatriate Operations, Blood Operations | Expatriate Operations: Helper + Super Admin. Blood Operations: Super Admin only |
| Content | Content (news/notices/events/jobs), Gallery & Media, FAQ | Super Admin only |
| Money | Finance, Reports & Analytics | Super Admin only |
| System | Notifications, Contact Messages, Audit Logs, Settings | Super Admin only (notifications: each admin sees their own; the notification *management* view is Super Admin-only) |

**Module dependencies.** The overview depends on every module's summary data. Expatriate Operations depends on Users (helpers) and Notifications. Finance depends on nothing except its own entries and the published reports. Content modules are independent of each other. Roles & Permissions depends on Users. Reports & Analytics depends on all modules' data (it aggregates; it never stores its own copy of the figures).

## 3. Module specifications

Each module below follows the same structure: purpose, main screens, actions, data displayed, filters, search, forms, validation, permissions, approval workflow, and empty/loading/error states.

### 3.1 Overview (dashboard home)

- **Purpose:** one screen that answers "what needs attention right now?" for the signed-in admin.
- **Main screens:** a single overview page.
- **Data displayed (Super Admin):** counts of pending member applications; open expatriate requests by status; unanswered contact messages; unpublished drafts (content, finance); recent audit events; finance summary for the current year (published figures only, with the year selectable). All figures are computed from data, never hand-typed (per Engineering Plan v1.1).
- **Data displayed (Helper):** only their queue — open requests assigned to them, unassigned requests they may claim, and their own recent activity. No member counts, no finance, no content.
- **Actions:** click-through from any count to the filtered list in the relevant module.
- **Filters/search:** year selector for the finance summary; no free-text search on the overview itself.
- **Forms/validation:** none.
- **Permissions:** `dashboard.view` (Super Admin); helpers receive the reduced overview automatically — there is no separate "helper dashboard" permission to misconfigure.
- **Approval workflow:** none (read-only).
- **Empty state:** "No items need attention" when every count is zero, with a link to each module for review. **Loading state:** skeleton rows for each summary card until the data arrives. **Error state:** if a summary fails to load, that card shows "Could not load this summary — try again" with a retry action; the rest of the page still renders.

### 3.2 Users

- **Purpose:** manage the accounts that can sign in to the admin side (Super Admins and Helpers) and the member accounts.
- **Main screens:** user list; user detail; create-user form; edit-user form.
- **Actions:** create user, edit user, deactivate/reactivate user, reset a user's password (Super Admin-only, audited — Doc 07 A6), assign/change role (Super Admin-only; Phase 1 roles only: `super-admin`, `expatriate-helper`).
- **Data displayed:** name, phone (masked in the list; full number only on the detail view and only for Super Admins), role, area, status (active/inactive), last login, created date.
- **Filters:** by role, by status, by area. **Search:** by name or phone (phone search uses the `phone_hash` lookup — Doc 08 §6.2).
- **Forms:** name, phone, password (on create; minimum 8 characters, letter + digit), role, area. **Validation:** as Doc 07 §7; phone must be unique (409 `duplicate_phone`); role must be one of the two Phase 1 roles.
- **Permissions:** `users.view`, `users.create`, `users.update`, `users.reset_password` (all Super Admin-only in Phase 1).
- **Approval workflow:** none — creation is immediate, but it is audited. A proposed self-lockout guard (a Super Admin cannot remove their own Super Admin role) is listed for Sprint 1 confirmation (Doc 07 §17).
- **Empty state:** "No users yet" (only reachable before the first admin is created — in practice the list always has at least the initial Super Admin). **Loading:** skeleton table rows. **Error:** the list shows a retryable error banner; the create form shows field errors inline and preserves entered values.

### 3.3 Roles & Permissions

- **Purpose:** inspect (and, in future, manage) the roles and permissions that gate the whole system.
- **Main screens:** role list (role → its permissions); permission list grouped by resource.
- **Actions:** view only in Phase 1. Creating or editing roles/permissions through the UI is **not** a Phase 1 requirement — roles are seeded by the deployment and changed by a developer through a defined process. If the organisation later wants UI management, it is a separate change request.
- **Data displayed:** role name, description, permission count, user count; per permission: name (`resource.action`), description, which roles hold it.
- **Filters/search:** by resource (members, expatriate, finance, content, donors, …); search by permission name.
- **Permissions:** `roles.view` (Super Admin-only).
- **Empty/loading/error:** an empty permission group shows "No permissions in this group"; loading shows skeleton rows; errors show a retryable banner.

### 3.4 Members

- **Purpose:** manage the community membership register — applications, approvals, member records, and member lookup.
- **Main screens:** member list (with a pending-applications view); member detail; member edit form.
- **Actions:** approve an application (issues a member ID and enables login — Doc 07 D2), reject an application (reason required — Doc 07 D3), edit member details, deactivate a member, view a member's requests and history.
- **Data displayed:** member ID, name, phone (masked in the list), area, type (resident/expat/student), status (pending/approved/rejected/inactive), joined date, donor opt-in flag.
- **Filters:** by status, type, area, donor opt-in. **Search:** by name, member ID, or phone (hash lookup).
- **Forms:** member edit (name, phone, area, country, family info, type). **Validation:** as Doc 07 §7; phone unique excluding the member being edited.
- **Permissions:** `members.view`, `members.approve`, `members.update` (Super Admin-only).
- **Approval workflow:** registration creates a *pending application*, not a member (Doc 07 A5). Approval is a deliberate action by a Super Admin; rejection requires a reason. Both are audited. The prototype had no approval step and the registrant could not log in at all (Audit Findings §3 #30) — the approval workflow is the fix.
- **Empty state:** "No pending applications" on the pending view; "No members match these filters" on the list, with a clear-filters action. **Loading:** skeleton rows. **Error:** retryable banner; a failed approval shows the error on the detail page and changes nothing.

### 3.5 Organisation

- **Purpose:** manage the organisation's public identity — history, constitution, committee, advisory council, former leaders.
- **Main screens:** history (timeline) list; constitution versions; committee list (current/former/advisory); organisation settings (brand, tagline, slogan, office hours, emergency number).
- **Actions:** add/edit a history milestone (with a `verified` flag — unverified milestones are never published), publish a new constitution version (old versions retained), add/edit committee memberships with term dates, update public settings.
- **Data displayed:** milestone date/title/body/verified flag; constitution version/effective date/articles; person/role/term start/end/photo (photo only with consent).
- **Filters:** committee by term (current/former) and role; history by verified status; constitution by version. **Search:** by person name or milestone title.
- **Forms:** milestone (date, title bn/en, body bn/en, verified checkbox); constitution version (version, effective date, articles, document file); committee entry (person, role, term start/end, photo). **Validation:** required fields; term end after term start; only one verified milestone per date unless the organisation confirms otherwise.
- **Permissions:** `organization.manage` (Super Admin-only).
- **Approval workflow:** publishing a constitution version and publishing a verified milestone are explicit actions; drafts are not public.
- **Empty state:** "No milestones yet — add the verified founding milestone (1999) first" (the only verified milestone in the prototype — Audit Findings §2.2). **Loading/error:** as §3.1.

### 3.6 Committee

- **Purpose:** covered by §3.5 as a screen within Organisation in the current navigation. It is listed separately here because the prototype treats committee, advisory, and former leaders as three lists (Audit Findings §5.3) and the dashboard must preserve that separation: three tabs (Executive Committee, Advisory Council, Former Leaders), each with its own list, but one shared person-entry form.
- **Permissions, validation, states:** as §3.5.

### 3.7 Content — news, notices, events, jobs

- **Purpose:** publish and manage all public content except activities and gallery (which have their own modules).
- **Main screens:** four lists (news, notices, events, jobs) with a shared create/edit form pattern; each item has a detail/preview view.
- **Actions:** create (draft), edit, publish, unpublish, delete (soft delete). For jobs: mark verified/unverified (unverified circulars are never public — Audit Findings §3 #23). For notices: set priority and expiry (expired notices leave the public list automatically).
- **Data displayed:** title, tag/category, date, status (draft/published/unpublished), author, expiry (notices), deadline and verification flag (jobs), venue and times (events).
- **Filters:** by status, by tag/category, by date range; notices by priority; jobs by verified flag; events by upcoming/past. **Search:** by title or body text.
- **Forms:** title bn/en, body bn/en, tag/category, publish date/time (optional scheduling), expiry (notices), deadline (jobs), venue/start/end (events). **Validation:** required fields; end after start (events); expiry after publish date (notices); deadline in the future for a new job circular.
- **Permissions:** `content.create`, `content.update`, `content.publish` (Super Admin-only).
- **Approval workflow:** create → draft → publish. Publishing is a separate, audited action from saving. There is no second-person approval in Phase 1; if the organisation wants one, it is a change request.
- **Empty state:** per list ("No news yet — create the first article", etc.). **Loading:** skeleton rows. **Error:** retryable banner; a failed publish leaves the item in draft and shows the error.

### 3.8 Activities (annual activities)

- **Purpose:** manage the annual-activities programme — the activity list, detail pages, and their archive by year.
- **Main screens:** activity list (year-grouped); activity detail/editor; cover-image and gallery-image management for the activity.
- **Actions:** create (draft), edit, publish, unpublish, delete (soft delete); attach/remove images.
- **Data displayed:** year, date, category, title bn/en, body bn/en, cover image, status.
- **Filters:** by year (2026/2025/2024 in the prototype — Audit Findings §5.2; the year list is derived from data, not hardcoded) and by category. **Search:** by title or body.
- **Forms:** as §3.7, plus **category — mandatory**. The prototype's category filter had no data behind it (Audit Findings §8 item 7); the dashboard must require a category on every activity so the public filter works.
- **Permissions:** `activities.create`, `activities.update`, `activities.publish` (Super Admin-only).
- **Approval workflow:** as §3.7.
- **Empty state:** "No activities in this year yet". **Loading/error:** as §3.1.

### 3.9 Expatriate Operations

- **Purpose:** the working queue for expatriate support requests — the single most-used screen in the system. This is the **only** module an Expatriate Helper sees.
- **Main screens:** request queue (list); request detail (full record: service, for whom, details, urgency, applicant, phone, country, status history, expenses, helper assignment); new-request entry is **not** here — requests arrive from the public website (Doc 07 X1) and the queue is where they are worked.
- **Actions (Helper):** view the queue; claim an unassigned request; advance the status of a request assigned to them (with a mandatory note, ≥10 characters — the prototype filled a generic note, which is not acceptable in production, Audit Findings §6); add an expense line with an optional receipt photo; view the expense total (computed server-side; service charge always 0).
- **Actions (Super Admin):** all helper actions, plus assign/reassign a request to a helper, reject a request (reason required), close a completed request, cancel a request.
- **Data displayed:** Request ID (`EXP-YYYY-####`), service, for whom, applicant name, country, urgency, status (with the Meridian-style progress: Pending → Accepted → In Progress → Completed → Closed), assigned helper, created date, expense lines and total, status history (actor, timestamp, note).
- **Filters:** by status, service, urgency, assigned helper (Super Admin), unassigned only. **Search:** by Request ID or applicant name.
- **Forms:** status-transition form (new status + note); expense form (label, amount, receipt upload). **Validation:** transition must be a valid move in the state machine (Doc 07 §14.7); note required; expense amount > 0; receipt must pass the upload checks (Doc 08 §3.6).
- **Permissions:** `expatriate.requests.view`, `expatriate.requests.assign` (Super Admin), `expatriate.requests.update` (Helper on assigned requests; Super Admin on all).
- **Approval workflow:** the state machine *is* the workflow. Rejection and cancellation are terminal and audited. A helper cannot advance a request assigned to another helper.
- **Empty state:** "No open requests — the queue is clear" (with the count of completed requests available via the status filter). **Loading:** skeleton rows. **Error:** a failed transition shows the error on the detail page and changes nothing; the queue shows a retryable banner.
- **Notifications:** a new request creates a notification for the Super Admin and all Helpers (Doc 07 §12); the queue is the reliable record whether or not a push notification arrived.

### 3.10 Blood Operations

- **Purpose:** manage the donor registry and blood requests, including the consent flow.
- **Main screens:** donor list; donor detail; blood-request list; blood-request detail (request, matching donors, consent outcomes).
- **Actions:** add/edit a donor (with consent-to-list recorded); mark a donor available/unavailable; record a last-donation date; view a blood request; ask a donor for consent (sends the donor a consent request — it does **not** reveal the number); record a donor's consent decision; close a blood request with an outcome.
- **Data displayed:** donor name, blood group, area, last donation, availability; request group, units, hospital, contact, status, consent outcomes (counts and per-donor status, not phone numbers in the list).
- **Filters:** donors by blood group, area, availability; requests by status and group. **Search:** donors by name or area; requests by hospital.
- **Forms:** donor form (name, blood group, area, phone, last donation, availability, consent-to-list checkbox — required); blood-request form mirrors the public form (Doc 07 B2) for requests taken by phone at the office.
- **Permissions:** `donors.view`, `donors.create`, `donors.update`, `donors.view_contact`, `blood.requests.view` (Super Admin-only in Phase 1).
- **Approval workflow:** a donor is listed only after consent-to-list is recorded. A donor's phone number is revealed to a requester **only** through the consent flow (Doc 07 B4–B6): the donor grants consent for that specific request; the reveal is audit-logged. The prototype's consent was granted by the requester's own click (Audit Findings §6) — the dashboard must never reproduce that.
- **Empty state:** "No donors in this blood group yet" (A− and AB− have no donors in the prototype — Audit Findings §5.2 — so this state is reachable and must be handled gracefully, with a prompt to file an emergency request). **Loading/error:** as §3.1.

### 3.11 Finance

- **Purpose:** record, approve, publish, and reverse ledger entries; publish annual reports; view project accounts (if confirmed).
- **Main screens:** ledger list (year-grouped, kind-filtered); entry form; entry detail (with reversal history); annual-report list; finance summary.
- **Actions:** create an entry (draft); approve an entry; publish an entry; reverse an entry (reason required — the original is never edited or deleted); upload an annual report (PDF, with audited flag).
- **Data displayed:** date, item, kind (income/expense/donation), category, amount (BDT), payee, receipt, status (draft/approved/published/reversed), reversal link where applicable; totals computed server-side.
- **Filters:** by year, kind, category, status, date range. **Search:** by item or payee.
- **Forms:** entry form (date, item, kind, category, amount, payee, receipt upload). **Validation:** amount ≠ 0 with two decimals; date valid; kind in enum; receipt passes upload checks.
- **Permissions:** `finance.create`, `finance.approve`, `finance.publish`, `finance.reverse`, `finance.view` (Super Admin-only in Phase 1; the Treasurer role is deferred, so the Super Admin performs these actions in Phase 1).
- **Approval workflow:** create (draft) → approve → publish. Whether approval must be by a *different* person than the creator (dual control) is **proposed — confirm in Sprint 1** (Doc 07 §17). Reversal requires a reason and is audited; a reversed entry stays visible with its reversal linked.
- **Empty state:** "No entries of this type in this year" (the prototype's own empty text — Audit Findings §7.4). **Loading/error:** as §3.1. A failed publish or reversal changes nothing and shows the error on the entry.

### 3.12 Gallery & Media

- **Purpose:** manage photos (and, if confirmed, videos) — upload, caption, consent, albums, ordering.
- **Main screens:** media library (grid/list); upload form; item detail (caption, album, consent flag, usage — where the image appears).
- **Actions:** upload (image), edit caption/album, delete (soft delete; file retained per the retention rule, then purged), reorder within an album.
- **Data displayed:** thumbnail, caption bn/en, album, consent flag, upload date, uploader, file size.
- **Filters:** by album, by consent status. **Search:** by caption.
- **Forms:** upload (file, caption bn/en, album, consent-on-file checkbox — required for photos of people). **Validation:** file passes the upload checks (Doc 08 §3.6) including the ClamAV scan; consent flag required.
- **Permissions:** `media.upload`, `media.delete` (Super Admin-only).
- **Approval workflow:** none in Phase 1 — an uploaded image with consent is available for use. If the organisation wants a review step before a photo appears publicly, it is a change request.
- **Empty state:** "No photos in this album yet". **Loading:** skeleton tiles. **Error:** a failed upload shows the error and keeps the form values; a failed scan is reported generically ("This file could not be accepted").

### 3.13 Reports & Analytics

- **Purpose:** cross-module summaries for the organisation's leadership — not a separate data store.
- **Main screens:** summary report (date-range selectable); per-module breakdowns (requests by status/service, donors by group, finance totals, membership counts); export (download the report as a file — format to be confirmed at scaffold time; CSV is the recommended starting point).
- **Actions:** select a date range, export.
- **Data displayed:** all figures computed from live data at request time, never hand-typed.
- **Permissions:** `reports.view` (Super Admin-only).
- **Empty state:** "No data in this period" when the range contains nothing. **Loading:** skeleton summary cards. **Error:** retryable banner.

### 3.14 Notifications

- **Purpose:** each admin's own notification inbox, plus (Super Admin) visibility into notification delivery.
- **Main screens:** notification list (own); notification detail is not a separate screen — the notification links to the underlying record (request, member application, contact message).
- **Actions:** mark read, mark all read, clear (delete) own notifications.
- **Data displayed:** title, body, type, related record, read/unread, time.
- **Filters:** by read/unread, by type. **Search:** by title/body text.
- **Permissions:** own notifications need no permission beyond authentication; the delivery overview is Super Admin-only.
- **Empty state:** "No notifications yet" (the prototype's own empty text — Audit Findings §7.4). **Loading/error:** as §3.1.

### 3.15 Contact Messages (inbox)

- **Purpose:** receive, read, and reply to messages sent through the public contact form.
- **Main screens:** message list; message detail with reply form.
- **Actions:** mark read, reply (the reply text is stored as the record; in Phase 1 there is no email provider, so the reply is conveyed out of band — Doc 07 D8), mark resolved.
- **Data displayed:** sender name, phone, message, received time, status (new/read/replied/resolved).
- **Filters:** by status. **Search:** by sender name or message text.
- **Forms:** reply (≥10 characters). **Validation:** reply ≥10 characters.
- **Permissions:** `contact.view`, `contact.reply` (Super Admin-only).
- **Empty state:** "No messages". **Loading/error:** as §3.1.

### 3.16 Audit Logs

- **Purpose:** the tamper-evident record of who did what, for accountability and incident review.
- **Main screens:** audit-log list; entry detail.
- **Actions:** view and filter only. There is **no** edit, delete, or export-to-edit action. Export (read-only file) is permitted for Super Admins if the organisation needs it — **proposed — confirm in Sprint 1**.
- **Data displayed:** actor, action, target (type + id), old → new value where applicable, IP address, timestamp (Asia/Dhaka display, UTC stored).
- **Filters:** by actor, action type, target type, date range. **Search:** by actor name or target id.
- **Permissions:** `audit_logs.view` (Super Admin-only).
- **Empty state:** "No audit events match these filters" (the log is never genuinely empty once the system is in use). **Loading/error:** as §3.1.

### 3.17 Settings

- **Purpose:** manage site-wide settings — public policy copy, contact details, and system configuration.
- **Main screens:** settings form (grouped: brand & identity, contact & office, policy copy, system).
- **Actions:** edit settings; every change is audited with old → new values.
- **Data displayed:** current values for every setting, with a note on where each value appears publicly.
- **Forms:** brand (name, tagline, slogan), office (address, hours — real values only after verification), policy copy (no-service-charge statement, 999 disclaimer, ERT size), system (pagination defaults are not editable here — they are code constants).
- **Validation:** per-field; policy copy fields require both Bengali and English text.
- **Permissions:** `settings.view`, `settings.update` (Super Admin-only).
- **Approval workflow:** none in Phase 1; changes are immediate and audited. Changing public policy copy is a significant action and should be announced to the organisation by the Super Admin out of band.
- **Empty/loading/error:** settings always have values (seeded at deployment); a failed save preserves the form and shows field errors.

## 4. Cross-cutting dashboard behaviour

- **Authentication:** the dashboard is reached through the Filament panel behind the same Sanctum session authentication as the web SPA (Doc 07 §8.1). There is no separate dashboard password.
- **Session timeout:** the same idle timeout as the rest of the system (Doc 08 §5); an expired session returns the user to the login screen with a "Your session expired — please sign in again" message, and unsaved form data is preserved where the browser allows it.
- **Confirmations:** destructive or consequential actions (delete, reject, reverse, unpublish, deactivate, password reset) always show a confirmation step naming the record and the consequence. The confirmation is a modal, not a browser `confirm()` dialog.
- **Audit:** every action listed in Doc 08 §9.1 is recorded, including the actions performed through the dashboard.
- **Accessibility:** the dashboard must be keyboard-navigable; all actions must be reachable without a mouse; status is conveyed by text as well as colour (a red/green dot alone is not enough).
- **Performance:** list pages render within the budgets in Doc 10 (admin list p95 ≤300ms server-side is the API target; the dashboard's own rendering budget is set at build time).
- **Language:** Bengali-first labels; the dashboard does not need the full public-site BN/EN toggle, but every user-facing string must exist in Bengali.

## 5. What is not in this specification

- No screen designs, wireframes, or mockups (explicitly out of scope for this document).
- No Filament component choices (which table, which form field) — those are implementation decisions for Phase 8.
- No member-facing dashboard specification — the member dashboard is part of the public web client (M11), specified through the API in Doc 07 §14.11, not here.
- No mobile-app admin specification — administration is web-only in Phase 1; the Flutter app (M12) is member-facing.
