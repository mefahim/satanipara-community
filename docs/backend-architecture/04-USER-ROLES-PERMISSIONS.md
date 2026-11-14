# 04 — User Roles & Permissions (RBAC & Governance)

| | |
|---|---|
| **Document** | Satanipara Community — Phase 0 Backend Blueprint, doc 04 |
| **Status** | Planned — not yet implemented. Nothing in this document describes live behaviour. |
| **Sources** | Decision Sheet (single source of truth, 2026-11-14); Audit Findings (repo audit, 2026-11-14, HEAD `6792f5e`); Research Notes (verified 2026-11-14); Engineering Plan v1.1 §5, §9.2 |
| **Companion docs** | `05-BACKEND-ARCHITECTURE.md` (how RBAC is enforced); `06-DATABASE-DESIGN.md` (roles, permissions, audit-log tables); `diagrams/RBAC-MATRIX.md` (matrix in Mermaid + tables — must match this document exactly) |

---

## 1. Purpose and governing decisions

This document defines **who may do what** in the Satanipara Community platform: the roles, the granular permission catalogue, the Role–Permission Matrix, and the governance protections that keep a two-role Phase 1 administration safe.

### 1.1 Phase 1 scope — a Fahim decision, not an oversight

**Phase 1 has exactly two admin roles: Super Admin (`super-admin`) and Expatriate Helper (`expatriate-helper`).** This is Fahim's decision of 2026-11-14, recorded in the Decision Sheet and in Engineering Plan v1.1 §5 ("আপাতত রোল ব্যবস্থা ইচ্ছাকৃতভাবে সহজ রাখা হলো" — the role system is deliberately kept simple for now). The other roles named in this document — President, General Secretary, Treasurer, and the rest — are **deferred future options**. They are evaluated in §8 as a catalogue for a later phase; they are **not** to be implemented, seeded, or exposed in any Phase 1 UI, API, or admin panel.

The reason for the narrow Phase 1 scope, per Engineering Plan v1.1 §5, is deliberate: the user base is small at launch, responsibility is clear (one main administrator runs everything; helpers handle only expatriate requests), and more roles mean more training, more confusion, and more risk of wrong access. Roles are added when the need grows — on the same permission structure, without rebuilding the system.

### 1.2 Two non-admin actor types

- **Member** — a registered, Super-Admin-approved community user (resident or expatriate). A Member is **not** an admin role. Members act only on their own data.
- **Public Visitor** — an unauthenticated visitor. Sees only content explicitly marked public. Never sees a phone number or personal information.

### 1.3 Implementation mechanism (summary — detail in doc 05)

RBAC will be implemented with **Spatie Laravel Permission v8** (`spatie/laravel-permission`, constraint `^8.0`, MIT licence), per Research Notes §5. Roles and permissions are database rows; every permission is registered on Laravel's Gate, so checks use native `$user->can(...)` and Blade `@can(...)`. Filament 5.x has no built-in role system of its own; its access control runs through the same gates and policies plus Filament's `canAccessPanel()` / per-resource `can*()` hooks (Research Notes §4). Spatie provides **no admin UI, no audit log, and no approval workflow** — all three are application features built on top, and are specified in this document and in doc 05.

**Rules that apply to the whole document:**

1. **Deny by default.** Anything not explicitly granted is denied. No permission is implied by another permission, and no role inherits from another role.
2. **Server-side enforcement only.** The Direction D prototype's auth guard is client-side only (Audit Findings §2.1, §3.1) and proves nothing. Every permission in this document must be checked on the server — in policies/gates on every API route and in Filament resource/policy hooks — regardless of what the frontend shows or hides.
3. **Permission names are stable API.** Permission names follow the `resource.action` convention from the Decision Sheet (e.g. `members.view`, `expatriate.requests.assign`, `finance.approve`, `donors.view_contact`, `audit_logs.view`). Once seeded, a permission name is never renamed silently; renaming is a migration plus a changelog entry.
4. **Roles are data, not code.** Roles and their permission assignments are managed through the Super Admin UI (doc 05 §7), not hard-coded. The only hard-coded element is the bootstrap seed described in §3.
5. **No invented people.** This document names no real committee members, helpers, or administrators. Real names come from client-supplied data at onboarding (see doc 06 §13).

---

## 2. Role definitions

### 2.1 Super Admin (`super-admin`)

| Attribute | Definition |
|---|---|
| **Who** | The organisation's responsible person(s) — one or two people, per Engineering Plan v1.1 §5. The exact holders are a client decision at onboarding; the blueprint names no one. |
| **Mandate** | Full administration of the platform. The Super Admin is the only role that can create users, assign roles, approve members, enter and publish finance, manage content, and view audit logs. |
| **Scope** | All modules M1–M12 (admin-side). |
| **Phase 1 power list** (from the directive and Engineering Plan v1.1 §5) | 1. Create users and assign them the `super-admin` or `expatriate-helper` role (and, in future phases, deferred roles once they exist). 2. Approve or reject member registrations; suspend and reinstate member accounts. 3. Add, edit, approve, and remove members and family records (M1) and community-profile records — households, persons, professions, institutions, landmarks, freedom fighters (M2). 4. Manage the organisation: history/timeline, constitution (document upload + versions), committee terms and members, advisors, past leaders, achievements (M3). 5. Manage annual activities, including year and category, images/video, beneficiary counts, and linked annual reports (M4). 6. Full expatriate-support authority: view all requests, assign helpers, change any status, add updates/notes/photos/expenses, reject, cancel, and close requests (M5). 7. Manage the blood-donor registry and all blood requests, including donor consent records (M6). 8. Write, review, publish, schedule, and archive all content — notices, news, events, job circulars, FAQs, gallery albums and items, videos (M7). 9. Enter finance ledger entries, verify and publish them, create reversal entries, manage finance categories and project accounts, publish monthly summaries and annual reports (M8). 10. Send and manage notifications; view delivery logs (M9). 11. View the admin dashboard, activity/audit logs, system health, and exports (M10). 12. Manage site settings, contact messages, privacy/data-rights requests, and consent records. 13. Reset any user's password (Super-Admin-mediated reset — see §5.5; no OTP/SMS reset in Phase 1). 14. Manage roles and permissions themselves (grant/revoke permissions on roles), subject to the governance guards in §5. |

**What a Super Admin must NOT do alone (separation of duties, §6):** a Super Admin who *enters* a finance entry must not be the one who *approves/publishes* the same entry. The system enforces this even for Super Admins — see §6.1.

### 2.2 Expatriate Helper (`expatriate-helper`)

| Attribute | Definition |
|---|---|
| **Who** | People who help expatriates with services on the ground. Appointed by the Super Admin. |
| **Mandate** | Expatriate support requests only (M5). Nothing else. Engineering Plan v1.1 §5: "অন্য মডিউলে সম্পাদনার অধিকার নেই" — no edit rights in any other module. |
| **Scope** | M5 only, plus own profile, own notifications, and the helper dashboard queue. |
| **Phase 1 power list** | 1. View the full expatriate request queue (all requests, all statuses) and the detail of any request, including applicant contact details (needed to do the work). 2. Accept a request assigned to them, or take (self-assign) an unassigned pending request. 3. Advance the status of a request they own or are assigned to: `pending → accepted → in_progress → completed` (only along the legal transitions in doc 05 §9; `rejected` only with a reason; never `pending → completed` directly). 4. Add update notes and photos to a request they own/are assigned to. 5. Add itemised expense lines (actual product cost + transport only — there is **no service-charge field anywhere in the system**, per the Decision Sheet) with voucher photos. 6. Request closure by marking a request `completed` (closure itself is confirmed by the applicant — see doc 05 §9.1). 7. View their own notifications and their own profile; edit their own profile. 8. View the public site exactly as a Member does (read-only public content). |
| **Explicitly NOT granted** | Member approval or any member management; finance of any kind; content creation or publishing; donor registry management or donor phone reveal; user creation; role assignment; audit-log access; settings; contact-message inbox; any action on a request they are not assigned to beyond viewing the queue (view is allowed; edit is not). |

### 2.3 Member (`member`)

A registered community user whose registration has been approved by a Super Admin. **Not an admin role.** Powers:

1. View and edit their **own** profile and their own family records.
2. Submit expatriate support requests (for themselves or for a beneficiary — e.g. a parent at home) and track **their own** requests by Request ID or in "My Requests".
3. Submit emergency blood requests; request donor consent through the system (the donor grants it — the requester never self-grants, see §7.3).
4. Register as a blood donor (opt-in at registration or later) and manage **their own** donor record: availability, last-donation date, consent to be contacted.
5. View member-visible directory entries (visibility `members-only` as well as `public`).
6. View their own notifications; manage their own notification preferences and push subscriptions.
7. Submit contact messages; submit data-rights requests (access / correction / deletion) about their own data.
8. Change their own password (when logged in); request a password reset from the Super Admin.

Members have **no** admin powers: they cannot view other members' personal data, cannot see the helper queue, cannot see finance entries beyond published summaries, cannot see audit logs, and cannot publish anything.

### 2.4 Public Visitor (`public`)

Unauthenticated. Powers:

1. View content marked `public`: home sections, published activities, notices, news, events, job circulars, gallery, FAQ, constitution summary, committee/advisory/past-leader listings, organisation history (verified milestones only), published finance summaries and annual reports.
2. Search the public directory and the blood-donor directory (names, areas, blood groups, availability — **phones masked**).
3. Track an expatriate request **by Request ID** (`EXP-YYYY-####`) — see the privacy boundary in §7.4.
4. Submit an expatriate support request **without logging in** (the prototype allows this — Audit Findings §3.1 — and Phase 1 keeps it: requiring an account would block the expatriates' families who need help most). Submission creates a request tied to the applicant's phone; it does **not** create an account.
5. Submit an emergency blood request and a contact message without logging in.
6. Read the privacy policy.

Public Visitors cannot see any personal data: no phone numbers (masked or otherwise, except through the donor-consent flow), no member lists, no unpublished content, no finance detail, no request internals beyond the tracking view.

---

## 3. Bootstrap and the last-active-Super-Admin guard

### 3.1 Bootstrap seeding (one-time, at first deployment)

The system cannot be administered until a first Super Admin exists, and no Super Admin can create the first Super Admin through the UI. The bootstrap is therefore a **one-time, audited, out-of-band operation**:

1. The deployment runbook creates the first Super Admin account via a console command (or a signed seeder run by the deployer), with a strong temporary password delivered to the named person through a secure channel — never in chat, email, or a ticket.
2. The bootstrap command **refuses to run if any Super Admin already exists**, and refuses to run in production more than once. It writes an audit-log entry recording that bootstrap occurred (actor: `system`, no password material logged).
3. On first login the Super Admin **must** change the temporary password (forced password-change flag) before any other action is possible.
4. The demo accounts from the prototype (`01700000000` / `demo1234`, `01700000001` / `helper1234` — Audit Findings §5.5, plaintext passwords in the repo) are **never seeded, never migrated, and never usable** in the real system. Demo data is never migrated (doc 06 §13).

### 3.2 Last-active-Super-Admin guard (mandatory)

This is the single most important governance protection in Phase 1, because with only two admin roles the loss of the last Super Admin locks the organisation out of its own platform.

**Rules (enforced in the application layer, not by convention):**

1. **At least one active Super Admin must always exist.** The system counts Super Admins who are active (not suspended, not deleted, not pending).
2. The following operations are **blocked with a clear error** when they would leave zero active Super Admins:
   - removing the `super-admin` role from the last active Super Admin;
   - suspending the last active Super Admin;
   - deleting (soft-deleting) the last active Super Admin's account;
   - demoting the last active Super Admin to another role.
3. The guard is checked **inside the same database transaction** as the change, so a race between two simultaneous demotions cannot slip through.
4. The guard applies to **all** actors, including another Super Admin — no one may remove the last Super Admin, including themselves.
5. **Recovery path (documented, not secret):** if the last Super Admin is genuinely unreachable (e.g. has left the organisation), recovery is by a fresh bootstrap performed by the deployer/maintainer under a written instruction from the organisation, creating a new Super Admin and recording the event in the audit log. The recovery procedure and who may authorise it are agreed with the client at handover; the procedure itself is documented in the operations runbook, not in this blueprint.
6. **Recommendation (not a rule):** the organisation should hold **two** active Super Admins at all times, so that one person's absence never blocks administration. The system should surface a warning banner in the admin panel whenever only one active Super Admin exists. This is a standing recommendation to the client, not an enforced rule — a single-Super-Admin organisation is valid, just riskier.

### 3.3 Role assignment rules

- Only a Super Admin may assign or remove roles. A Super Admin may assign the `super-admin` role to another user (creating a second Super Admin) — this is how the organisation grows its admin bench.
- An Expatriate Helper **cannot** assign roles, promote anyone, or change their own role.
- Role changes are **always** audit-logged (who, whom, which role, added/removed, when) and notified to all other Super Admins.
- A user holds **one primary role** in Phase 1 (`super-admin`, `expatriate-helper`, or `member`). The data model supports multiple roles (Spatie supports it natively), but Phase 1 policy is one role per user to keep accountability unambiguous. If a future phase needs a person to hold two roles, that is a policy decision recorded at the time — the mechanism already exists.
- **No self-promotion, no self-approval:** a user cannot approve their own member registration, cannot assign a role to themselves, and cannot reset their own password through the admin reset flow (they use the change-password flow instead).

---

## 4. Granular permission catalogue

Permission names use the Decision Sheet convention `resource.action`. The catalogue below is the **complete** Phase 1 catalogue. Every permission is a row in the `permissions` table (Spatie), seeded by name; the API and Filament check these names, never hard-coded role names, in business logic.

### 4.1 Naming rules

- **Resources** are nouns in plural or singular as listed (`members`, `expatriate.requests`, `finance`, `donors`, …). Dotted names group sub-resources (`expatriate.requests.*`).
- **Actions** are verbs: `view`, `view_own`, `create`, `update`, `delete`, `approve`, `reject`, `assign`, `advance`, `publish`, `archive`, `export`, `manage` (settings-level), `view_contact` (sensitive-field reveal), `reset_password`.
- `view` means list + detail of records the actor is allowed to see. `view_own` means only records the actor owns or is the subject of.
- `manage` is used only for settings-level resources (`settings.manage`, `roles.manage`) where the action is a bundle of create/update/delete on configuration. It is never used for content or personal data.
- **Wildcard permissions are NOT used** in Phase 1 (Spatie supports them, but they hide exactly what is granted; explicit listing is auditable). If wildcards are ever adopted, that is a separate decision.

### 4.2 Full catalogue

#### Identity & membership (M1)

| Permission | Meaning |
|---|---|
| `members.view` | List and view member records (admin view, including PII). |
| `members.create` | Create a member/user account (Super Admin creates users — Audit Findings §6). |
| `members.update` | Edit any member's record. |
| `members.approve` | Approve or reject a pending member registration. |
| `members.suspend` | Suspend / reinstate a member account. |
| `members.delete` | Soft-delete a member account (subject to the retention rules in doc 06 §11; never hard-delete where finance/request records exist — anonymise instead). |
| `members.export` | Export member data (CSV/Excel). Sensitive — see §7.2. |
| `members.reset_password` | Reset another user's password (Super-Admin-mediated reset, §5.5). |
| `profile.view_own` | View own profile. |
| `profile.update_own` | Edit own profile and own family records. |
| `families.manage_own` | Add / edit / remove members of one's own family record. |

#### Community profile & directory (M2)

| Permission | Meaning |
|---|---|
| `directory.view` | View public and members-only directory entries (scope by visibility — see §7.1). |
| `directory.create` | Create a directory entry (person / institution / place / landmark). |
| `directory.update` | Edit a directory entry. |
| `directory.delete` | Soft-delete a directory entry. |
| `directory.publish` | Mark an entry public (publish) or withdraw it from public view. Consent must be recorded first (see §7.2). |
| `community.stats.view` | View community statistics (computed aggregates — doc 06 §9). |
| `community.infrastructure.view` | View infrastructure/facility records (feature absent in the prototype — Audit Findings §3 #6; permission reserved for when the module exists). |
| `community.infrastructure.manage` | Create / edit / delete infrastructure records (reserved, future). |

#### Organisation (M3)

| Permission | Meaning |
|---|---|
| `organisation.view` | View organisation pages (public side is covered by `content.view_public`; this is the admin-side view). |
| `organisation.update` | Edit organisation profile, history, mission/vision. |
| `organisation.timeline.manage` | Add / edit / archive timeline milestones (verified flag required — only the verified 1999 founding milestone exists today; Audit Findings §2.2). |
| `constitution.view` | View the constitution (summary and full text per organisation decision). |
| `constitution.manage` | Upload new constitution versions, edit articles, manage versions. |
| `committee.view` | View committee / advisory / past-leader records. |
| `committee.manage` | Create / edit / archive committee terms, members, advisors, past leaders. |

#### Annual activities (M4)

| Permission | Meaning |
|---|---|
| `activities.view` | View activities (public side covered by `content.view_public`). |
| `activities.create` | Create an activity (year, category — the prototype's category filter had no data behind it, Audit Findings §8.7; categories are stored per activity in the real system). |
| `activities.update` | Edit an activity. |
| `activities.delete` | Soft-delete an activity. |
| `activities.publish` | Publish / unpublish an activity. |

#### Expatriate support (M5)

| Permission | Meaning |
|---|---|
| `expatriate.requests.view` | View the full request queue and any request's detail (admin/helper scope). |
| `expatriate.requests.view_own` | View only requests the Member submitted (or is the beneficiary of). |
| `expatriate.requests.create` | Submit a request (public — no login required; the permission exists so the API can express it, and so a future logged-in-only policy could be applied without renaming). |
| `expatriate.requests.assign` | Assign a helper to a request (Super Admin), or self-assign (helper taking a pending request). |
| `expatriate.requests.accept` | Accept an assigned request (`pending → accepted`). |
| `expatriate.requests.advance` | Advance a request one legal step (`accepted → in_progress → completed`). |
| `expatriate.requests.reject` | Reject a request with a reason (`pending → rejected`). |
| `expatriate.requests.cancel` | Cancel a request (applicant cancels their own; Super Admin may cancel any with a reason). |
| `expatriate.requests.close` | Mark a request closed after applicant confirmation (`completed → closed`). |
| `expatriate.requests.update` | Edit request fields (service, beneficiary, details, urgency) — Super Admin only; helpers edit via updates/expenses, not the core fields. |
| `expatriate.updates.create` | Add an update note / photo to a request. |
| `expatriate.expenses.create` | Add an itemised expense line (+ voucher photo). |
| `expatriate.expenses.view` | View expense lines on a request (scope follows the request's visibility). |
| `expatriate.track` | Look up a request by Request ID (public tracking — see §7.4). |
| `expatriate.emergency.manage` | Manage the Emergency Response Team roster (3–5 members) and on-call rotation. Reserved in Phase 1 to the Super Admin; the ERT roster itself is Phase 1 data, the management permission is Super Admin-only. |

#### Blood donor (M6)

| Permission | Meaning |
|---|---|
| `donors.view` | Search and view the donor directory (names, groups, areas, availability; phones masked). |
| `donors.view_contact` | Reveal a donor's full phone number — **only after that donor has granted consent for that specific blood request**, and only to the requester of that request. Every reveal is logged (see §7.3). This is the most sensitive read permission in the system. |
| `donors.create` | Register a donor (self-registration by a Member, or Super Admin on a donor's behalf with consent recorded). |
| `donors.update_own` | A Member edits their own donor record (availability, last-donation date). |
| `donors.update` | Super Admin edits any donor record. |
| `donors.delete` | Soft-delete / withdraw a donor record (consent withdrawal — see §7.3). |
| `blood.requests.view` | View blood requests (admin scope). |
| `blood.requests.create` | Submit an emergency blood request (public — no login required). |
| `blood.requests.update` | Update a blood request's status (fulfilled / cancelled). |
| `blood.requests.respond` | A donor responds "I can help" to a blood request (donor-side action). |
| `blood.consents.grant` | A donor grants consent to reveal their number for a specific request (donor-side action). |
| `blood.consents.revoke` | A donor revokes consent (number hidden again immediately; past reveals stay in the audit log). |

#### Content (M7)

| Permission | Meaning |
|---|---|
| `content.view_public` | View published public content. |
| `content.create` | Create a draft post (notice / news / event / job circular / FAQ / gallery item). |
| `content.update` | Edit a draft or published item (editing a published item creates a new revision — see doc 05 §9.3). |
| `content.publish` | Publish / schedule / unpublish content. |
| `content.archive` | Archive expired content (notices auto-archive at expiry — doc 05 §9.3). |
| `content.delete` | Soft-delete content. |
| `media.upload` | Upload media (photos / video) with consent flags. |
| `media.manage` | Manage the media library (albums, captions, consent flags, delete). |
| `reports.publish` | Publish an annual report (file + metadata, audited flag). |
| `reports.download` | Download a published annual report (public for published reports). |

#### Finance (M8)

| Permission | Meaning |
|---|---|
| `finance.view` | View ledger entries and finance detail (admin scope). |
| `finance.view_public` | View published monthly summaries and annual totals (public). |
| `finance.create` | Enter a ledger entry (draft). |
| `finance.approve` | Verify and publish a ledger entry (moves draft → published/locked). **Never the same person who entered it** — §6.1. |
| `finance.reverse` | Create a reversal entry correcting a published entry (the original is never edited or deleted). |
| `finance.categories.manage` | Manage finance categories. |
| `finance.projects.manage` | Manage project accounts (budget, status) and their linkage to ledger entries. |
| `finance.reports.publish` | Publish a monthly summary / annual report. |
| `finance.export` | Export finance data (CSV/Excel). Sensitive — see §7.2. |

#### Notifications (M9)

| Permission | Meaning |
|---|---|
| `notifications.view_own` | View own notifications. |
| `notifications.manage_own` | Mark own notifications read / clear own list; manage own push subscriptions and preferences. |
| `notifications.send` | Send a notification (Super Admin — e.g. urgent notice push). Helpers do **not** send notifications; the system sends them automatically on request events. |
| `notifications.view_log` | View the notification delivery log (who, when, success/failure). |

#### Admin, reporting & system (M10)

| Permission | Meaning |
|---|---|
| `dashboard.view_admin` | View the Super Admin dashboard (KPIs, queues, system health). |
| `dashboard.view_helper` | View the helper dashboard (request queue, own workload). |
| `audit_logs.view` | View the audit log. **Super Admin only, read-only, never editable, never deletable** (see §5.7). |
| `roles.manage` | Create / edit / delete roles and assign permissions to roles. Super Admin only; guarded by §5.6 (sensitive-action confirmation) and the last-Super-Admin guard (§3.2). |
| `users.manage_roles` | Assign / remove roles on a user. Super Admin only; same guards. |
| `settings.manage` | Manage site settings (brand, contact details, office hours, policy text, announcement strip). |
| `contact_messages.view` | View the contact-message inbox. |
| `contact_messages.reply` | Reply to / resolve a contact message. |
| `data_rights.manage` | Process data-rights requests (access / correction / deletion) and consent records. |
| `system.health.view` | View system health (queue depth, last backup, storage). |

---

## 5. Governance protections

These protections are **mandatory** in Phase 1. They are not optional hardening for later; the two-role model concentrates power in very few hands, and these controls are what make that concentration safe. Each item states what is enforced, and where (application layer, database, or process).

### 5.1 Strong password policy

The prototype's password rule was length-only (≥ 6 characters, registration; no rule at all on login — Audit Findings §7.1). That is **not** carried forward.

| Rule | Phase 1 standard |
|---|---|
| Minimum length | **12 characters** for all accounts; **16 characters** recommended for Super Admin accounts. The admin user-creation form enforces the same rule it will enforce on the user (no weaker admin-set passwords). |
| Complexity | At least one uppercase letter, one lowercase letter, one digit, and one non-alphanumeric character. |
| Breach check | Passwords are checked against a breached-password list where feasible (e.g. a local list of the most common passwords at minimum; an online k-anonymity check only if the deployment has reliable outbound network access — the check must never block login if the service is unreachable; it applies at set/change time, not at login). |
| History | A new password must differ from the previous **5** passwords. |
| No shared accounts | One account per person. Shared "office" logins are prohibited by policy and the system offers no shared-account feature. |
| Storage | Passwords are stored only as hashes (Laravel's default hasher — bcrypt/argon2 per framework default at scaffold time). Plaintext passwords are never stored, never logged, never emailed. The prototype's plaintext demo passwords (Audit Findings §5.5) are never reproduced. |
| Forced change | Temporary/reset passwords and bootstrap passwords must be changed on first login before any other action. |
| Expiry | **No forced periodic expiry** (it drives weaker passwords). A password is changed when it is suspected compromised, when a reset is requested, or on first login after a reset. |

### 5.2 Login throttling and lockout

Per Engineering Plan v1.1 §5 and §9.2 ("ভুল পাসওয়ার্ডে rate limit ও সাময়িক লক থাকবে" — wrong passwords get rate limiting and a temporary lock):

- **Rate limit:** after **5 failed login attempts** for a given phone number (or from a given IP address) within 15 minutes, further attempts are throttled.
- **Temporary lock:** after **10 failed attempts**, the account is locked for **30 minutes**. The lock is per-account, not per-IP, so an attacker cannot lock out unrelated users by trying their numbers — but the per-IP throttle still applies to slow down distributed guessing.
- **Lockout response:** the login response during a lock states only that the account is temporarily locked and when to retry. It never reveals whether the phone number exists (see §5.3).
- **Successful login resets** the failure counter immediately.
- **Super Admin lockout:** a locked Super Admin account is unlocked by another Super Admin, or — if it is the only Super Admin — by the documented recovery path in §3.2. There is no self-service unlock that bypasses the lock.
- **Implementation:** Laravel's built-in rate limiting (`RateLimiter`, `throttle` middleware) on the login route, plus an account-level `locked_until` timestamp. Failed attempts are audit-logged (phone number hashed in the log, never in plaintext — see §5.7).

### 5.3 Account enumeration and error-message discipline

- Login failure returns a **single generic message** ("Mobile number or password did not match") whether the number does not exist, the password is wrong, or the account is pending approval. The system never confirms that a phone number is registered.
- Registration with an already-registered phone number returns a generic response ("If this number is not yet registered, your application has been received" style) — the exact wording is a UX decision at build time, but the principle is fixed: **no oracle for account existence**.
- Password-reset requests (Super-Admin-mediated, §5.5) never confirm or deny the existence of an account to the requester.

### 5.4 Session management

Sanctum 4.x has no per-device session list and no built-in "log out everywhere" (Research Notes §3). The application designs around that (doc 05 §8):

| Rule | Phase 1 standard |
|---|---|
| Web sessions | Database session driver (per the Decision Sheet: sessions on database). Session cookie is `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict` where the frontend allows it). |
| Session lifetime | Idle timeout **120 minutes** for Member/helper web sessions; **30 minutes** for Super Admin web sessions (privileged sessions are shorter). Absolute session lifetime **12 hours** — re-authentication is required after that regardless of activity. Exact values are configuration, recorded here so they are chosen deliberately, not by default. |
| Mobile tokens | Personal access tokens (Sanctum), one per device, with an **expiry** configured (tokens never expire by default — the application sets an expiry; see doc 05 §8). Token names record the device. |
| Revocation | A user can revoke their own tokens/sessions from their profile ("log out of all devices"). A Super Admin can revoke any user's tokens/sessions (e.g. on suspension). Revocation is a database delete (Sanctum's mechanism) and takes effect immediately. |
| Suspension effect | Suspending an account immediately revokes all its tokens and invalidates all its sessions. A suspended user cannot log in, and any in-flight request after suspension is rejected. |
| Concurrent sessions | No hard limit in Phase 1, but the profile page lists active sessions/tokens (device, last activity) so the user can spot and revoke unfamiliar ones. |
| "Remember me" | Not offered in Phase 1. Re-authentication after the absolute lifetime is the expected behaviour. |

### 5.5 Password reset — Super-Admin-mediated (Phase 1)

Per Engineering Plan v1.1 §9.2 and the Decision Sheet: **there is no OTP/SMS password reset in Phase 1, and no self-service reset email flow** (the prototype has no email field anywhere — Audit Findings §2.4 — and no email service is in Phase 1 scope).

The reset flow is:

1. The user contacts the Super Admin (in person, by phone, or through the office) and asks for a reset.
2. The Super Admin verifies the person's identity by a means agreed with the organisation (e.g. in person with known identity, or a call-back to a known number). The verification method is an organisational procedure, documented in the operations runbook — the system does not invent one.
3. The Super Admin issues a reset from the admin panel (permission `members.reset_password`). The system generates a **single-use, time-limited (24 hours) reset token** and shows the Super Admin a temporary password (or a reset link, if the user has an email on file — email is optional in Phase 1).
4. The temporary credential is delivered to the user **out of band** by the Super Admin (in person or by phone). It is never written into a ticket, a chat message, or the audit log.
5. The user must change it on first login (§5.1). The reset token is invalidated after first use or after expiry, whichever comes first.
6. The reset event (who reset whose password, when, by which Super Admin) is audit-logged. The password itself is never logged.
7. **Future option (not Phase 1):** self-service reset by email link, and later OTP/MFA. See doc 05 §8.5.

### 5.6 Sensitive-action confirmation

Certain actions are destructive or privilege-escalating. They require **explicit confirmation in the UI plus re-authentication** (the user re-enters their own password) — a single click is never enough:

| Action | Requires |
|---|---|
| Assigning or removing the `super-admin` role | Confirmation dialog + re-authentication + audit log + notification to all other Super Admins. |
| Changing any role's permission set (`roles.manage`) | Confirmation dialog + re-authentication + audit log. |
| Suspending or deleting a user | Confirmation dialog (stating the consequences, e.g. "this revokes all sessions") + audit log. |
| Resetting another user's password | Confirmation dialog + audit log. |
| Creating a finance reversal | Confirmation dialog stating the original entry and the reversal amount + audit log. |
| Publishing finance / annual reports | Confirmation dialog + audit log. |
| Deleting published content or media | Confirmation dialog + audit log. |
| Exporting member or finance data | Confirmation dialog + audit log (exports are sensitive — §7.2). |
| Changing site settings that affect public visibility | Confirmation dialog + audit log. |

Re-authentication means the acting user enters **their own** password again at the moment of the action (not a second factor — MFA is optional, §5.8). The re-authentication window is short (the confirmation is valid for that single action only).

### 5.7 Immutable audit logging

Per Engineering Plan v1.1 §5: "সব অ্যাডমিন কাজ অডিট লগে: কে, কখন, কোন রেকর্ডে কী বদলালেন — লগ থাকবে, তা মোছা যাবে না" (all admin work in the audit log: who, when, which record, what changed — the log will be kept, it cannot be deleted).

| Rule | Standard |
|---|---|
| What is logged | Every admin action (create/update/delete/approve/reject/assign/publish/reverse/reset/role change/login/logout/failed login/export), every expatriate-request status transition (actor, from → to, note, timestamp), every finance entry and reversal, every donor-consent grant/revoke and every phone reveal, every data export, every settings change. |
| What is never logged | Passwords (plaintext or hashed), tokens, full phone numbers in plaintext where avoidable (store a hash for lookup — doc 06 §11), OTP codes, push-subscription private keys, file contents. |
| Immutability | Audit-log rows are **append-only**. No update, no delete, no truncate through the application. The database user the application uses has no `DELETE`/`UPDATE` privilege on the `activity_log` table (enforced at the database level where the hosting allows it; otherwise enforced by policy + code review + a database trigger where possible). `audit_logs.view` is read-only and there is **no** `audit_logs.delete` permission — it does not exist in the catalogue. |
| Retention | Audit logs are retained for the life of the platform and are included in backups. No automatic purge in Phase 1. If a retention policy is ever adopted, it is a client decision recorded in writing. |
| Visibility | Only Super Admins may view the audit log (`audit_logs.view`). Helpers and Members cannot view it, even for their own actions. |
| Integrity | Each entry records: actor (user id), actor role at the time, action, subject type + id, before/after values (for field changes), IP address, user agent, timestamp. Entries are written in the same database transaction as the action they record, so an action without its log entry cannot commit. |

### 5.8 Optional MFA for privileged accounts

Multi-factor authentication is **optional in Phase 1, and recommended for Super Admin accounts**. It is not mandatory, because the organisation's devices and habits are not yet known, and a mandatory MFA that the Super Admin cannot complete would lock the organisation out (see the last-Super-Admin guard, §3.2).

- **If adopted:** TOTP-based MFA (authenticator app) for Super Admin accounts, enforced at login after password verification. Recovery codes are issued at enrolment, stored hashed, and each usable once. Losing both the device and the recovery codes requires the §3.2 recovery path.
- **Helpers and Members:** MFA is not offered in Phase 1. The login-throttling (§5.2) and password policy (§5.1) are the controls for those accounts.
- **Future:** OTP login (SMS or authenticator) as a *login method* is a future option, not Phase 1 — the Decision Sheet records "NO OTP" for Phase 1 login. MFA as a *second* factor after password login is a different thing from OTP-as-login, and is the only MFA shape contemplated here.
- The decision to enable or require MFA for Super Admins is made with the client at handover, and recorded in the operations runbook. The system must be built so that enabling it later is a configuration change, not a rebuild (doc 05 §8.5).

---

## 6. Separation of duties

Separation of duties exists because a single person who can do every step of a sensitive process can also abuse it undetected. Phase 1 has only two admin roles, so the separations below are deliberately few, simple, and enforced by the system — not by asking people to be careful.

### 6.1 Finance: entry vs approval vs publish

The finance lifecycle is `draft → published (locked) → (reversal if wrong)` — Engineering Plan v1.1 §9.4, doc 05 §9.4. The separation rules are:

1. **The person who enters a ledger entry (`finance.create`) cannot approve/publish that same entry (`finance.approve`).** The system rejects the approval with an error naming the rule. This applies to Super Admins as well — a sole Super Admin cannot self-approve.
2. **Consequence for a single-Super-Admin organisation:** if the organisation has only one Super Admin, that Super Admin can *enter* entries but cannot *publish* them until a second approver exists. This is intentional and must be explained to the client at handover. The practical answers are: (a) hold two Super Admins (the standing recommendation in §3.2), or (b) a future Treasurer/Finance-approver role (§8) takes the approval step. **The system must never silently allow self-approval as a workaround.** If the client insists on a single approver, that is a recorded policy exception with a written client sign-off, and the audit log will show the exception — it is not a code change made quietly.
3. **Reversal is a separate act:** creating a reversal (`finance.reverse`) also cannot be done by the person who entered the original entry, and a reversal itself is an entry that goes through the same draft → approval path.
4. **Publishing a monthly summary or annual report (`finance.reports.publish`)** requires the same separation from the person who prepared it, where a preparer is recorded.
5. **Exports** (`finance.export`) are logged and require confirmation (§5.6). Exporting is not approval and does not substitute for it.

### 6.2 Membership: approval vs finance

- The person who **approves a member** (`members.approve`) and the person who **records any money from that member** (e.g. a subscription/"চাঁদা" entry — note the prototype has no dues-payment flow, Audit Findings §8.14; if one is added later, this rule applies) should not be the same person for the same member where two approvers exist. In Phase 1, with a single Super Admin doing both, this is a **documented limitation**, not an enforced block — the audit log is the control: every approval and every money entry carries its actor, so the two acts are always attributable. When a Treasurer role exists (§8), the rule becomes enforced.
- **Member approval vs member creation:** the Super Admin who creates a user account directly (`members.create`) is not the same act as approving a self-registered member (`members.approve`). A self-registration must be approved by a Super Admin who did not submit it (trivially true — the applicant is not an admin), and the approval is logged.

### 6.3 Content: author vs publisher

- In Phase 1 the Super Admin is both author and publisher of content (Engineering Plan v1.1 §5, M7). No separation is enforced for ordinary content — the audit log records who wrote and who published each item.
- **Exception:** an urgent notice pushed to the homepage ticker and to all helpers/members (`notifications.send` + `content.publish` with the urgent flag) should be confirmed by a second Super Admin where one exists. In Phase 1 this is a **recommended practice**, recorded in the operations runbook, not an enforced block — enforcing it would block urgent notices when only one Super Admin is available.
- When a Content Editor / News Editor role is introduced (§8), the author/publisher separation becomes enforced: an editor authors, a Super Admin (or a senior editor) publishes.

### 6.4 Read-only auditor

There is **no auditor role in Phase 1**. The auditor is a future role (§8, "Finance Auditor — read-only"). What Phase 1 provides instead, so that an auditor can be served later without a rebuild:

- The audit log is complete and append-only (§5.7), so a future auditor can reconstruct any action.
- Finance exports (`finance.export`) and the audit-log view (`audit_logs.view`) are separate permissions, so a future read-only auditor role can be granted exactly `finance.view`, `finance.view_public`, `finance.export`, `audit_logs.view`, `dashboard.view_admin` — and nothing else — without any code change.
- Until that role exists, **no one outside the Super Admin group** may view the audit log or export finance data. If the organisation's auditor asks for records in Phase 1, a Super Admin exports them and hands them over out of band; the export itself is logged.

---

## 7. Module-level, record-level, ownership, and sensitive-field rules

Permissions alone are not enough: the same permission must mean different things for different records. The rules below are enforced by **policies** (doc 05 §6), not by the frontend.

### 7.1 Scope restrictions (module-level and record-level)

| Rule | Enforcement |
|---|---|
| **Helper scope is M5-only.** A helper's `expatriate.requests.view` grants the queue and request details. It grants nothing in M1, M2, M3, M4, M6, M7, M8, M9-admin, or M10. A helper who navigates (or calls the API) for a member record, a finance entry, or a donor phone gets a 403. | Policy + route middleware on every module. |
| **Helper edit scope is assignment-scoped.** A helper may advance, update, or add expenses to a request only if they are the **assigned helper** (or the request is unassigned and they take it). Viewing the queue is open to all helpers; editing is not. Attempting to advance another helper's request returns 403 and is audit-logged. | `ExpatriateRequestPolicy` — checks `assigned_helper_id`. |
| **Member scope is ownership-scoped.** A Member sees only their own requests (`expatriate.requests.view_own`), their own profile, their own family, their own donor record, their own notifications. Any attempt to access another member's record by id returns 404 (not 403 — see §7.5) and is logged. | Policies on every member-facing endpoint. |
| **Directory visibility is a data attribute, not a role.** Each directory entry carries `visibility`: `public` / `members-only` / `private` (Engineering Plan v1.1 §6, M2). Public Visitors see `public` only. Members additionally see `members-only`. `private` entries are visible only to Super Admins (and to the subject themselves, where applicable). Visibility is enforced in the query (a global scope), not by filtering after fetch. | Eloquent global scope + policy. |
| **Finance visibility is publication-scoped.** Unpublished/draft ledger entries are visible only to Super Admins. The public sees only published monthly summaries and annual totals (`finance.view_public`). There is no "member-only finance detail" in Phase 1. | Policy + published flag. |
| **Content visibility is status-scoped.** Drafts and scheduled (not-yet-published) content are visible only to Super Admins. Published content is public. Archived content is visible to Super Admins and (where the archive is public) to visitors as history. | Policy + status scope. |
| **Notification scope is recipient-scoped.** A user sees only notifications addressed to them (or to a role they hold, e.g. all helpers for a new-request alert). A user cannot list another user's notifications. | Query scope on `recipient_id` / role targeting. |

### 7.2 Sensitive-field restrictions

| Data | Rule |
|---|---|
| **Member PII (names, phone, address, date of birth, profession, expatriate country, family details)** | Visible in full only to Super Admins and to the Member themselves. Helpers see PII **only** where it is part of an expatriate request they are assigned to (applicant name, beneficiary, phone, country) — and only for that request. Public API responses never contain member PII. Member exports (`members.export`) are Super-Admin-only, confirmation-gated, and audit-logged. |
| **Phone numbers generally** | Never in a public API response. Stored encrypted at rest where the field is flagged sensitive (doc 06 §11); lookups use a `phone_hash` (HMAC) so the system can find a user by phone without decrypting every row. |
| **Donor phones** | See §7.3. |
| **Expatriate request internals** | Applicant phone, beneficiary details, expense vouchers, and helper notes are visible to Super Admins and the assigned helper. The public tracking view (§7.4) shows only status, step notes (sanitised), and expense totals — never the applicant's phone or internal notes. |
| **Finance detail** | Payee names, voucher images, and entry notes are admin-only. The public sees aggregates. Donor names in finance appear only with that donor's consent (Engineering Plan v1.1 §6, M8). |
| **Passwords / tokens / secrets** | Never readable through any API or admin screen. A Super Admin can *reset* a password; they can never *view* one. |

### 7.3 Blood donors — consent as a first-class rule

The prototype's consent was a button the **requester** clicked, which instantly revealed the number (Audit Findings §3 #19, §6). That is **not** consent and is not carried forward. The real flow (Engineering Plan v1.1 §9.3) is:

1. A donor's phone is **masked in every search result** (e.g. `01••• •••421` as in the prototype's display). The full number is never in a list response.
2. When a blood request matches a donor, the **donor** is notified and asked. The donor grants consent (`blood.consents.grant`) for **that specific request only**. Consent is an explicit donor-side action, recorded with donor id, request id, timestamp, and channel.
3. Only after the grant may the requester see the number (`donors.view_contact`), and only for that request. **Every reveal is audit-logged** (who viewed whose number, for which request, when).
4. The donor may **revoke** consent (`blood.consents.revoke`) at any time; the number is hidden again immediately. Revocation does not erase the audit record of a reveal that already happened, and the requester is told the consent was withdrawn.
5. Consent **expires** with the blood request (when the request is fulfilled or cancelled, the grant lapses). A new request needs a new grant. There is no standing "reveal my number to everyone" consent.
6. **Availability is computed, not typed:** a donor whose last donation was less than 90 days ago is not shown as available (Engineering Plan v1.1 §6, M6). The system computes this from `last_donation_date`; no one hand-edits an "available" flag to bypass it.
7. Unavailable donors have their consent/request actions disabled (as in the prototype — Audit Findings §5.2).
8. A donor record is **withdrawn** (soft-deleted) when the donor asks, or when consent to be listed is withdrawn. Withdrawal hides the donor from search immediately; the consent/reveal history stays in the audit log.

### 7.4 Expatriate requests — public tracking privacy boundary

The prototype's tracking is public by Request ID and exposes the applicant's name and area in the tracking result (Audit Findings §3.1, §3 #16). The backend must **confirm the boundary, not assume it**. Phase 1 decision:

- **Public tracking shows:** Request ID, current status (Pending / Accepted / In Progress / Completed / Closed / Rejected / Cancelled), the four step notes (sanitised — no internal notes, no helper names unless the organisation decides otherwise), and the expense total with the "service charge ৳0" line. No applicant name, no beneficiary name, no phone, no area, no voucher images.
- **Why:** a Request ID is guessable in structure (`EXP-YYYY-####`) and is routinely shared with family members; anyone holding the ID can track. The ID is therefore treated as a **low-security bearer token** — enough to see status, never enough to see identity.
- **Member tracking shows more:** a logged-in Member viewing their own request sees the full detail (their own data).
- **Helper/Super Admin tracking** shows the full record (subject to §7.1 scoping).
- If the client later decides the public view should include the applicant's first name (as the prototype did), that is a **recorded client decision** changing this boundary — not a developer's quiet choice.

### 7.5 Error-response discipline (403 vs 404)

- **403 Forbidden** is returned when the caller is authenticated but lacks the permission for a resource they are known to be able to address (e.g. a helper requesting a finance entry, a Member requesting the admin dashboard). The response names the missing permission in the server log, not necessarily to the caller.
- **404 Not Found** is returned when an authenticated user requests a record that exists but is outside their ownership scope (e.g. Member A requesting Member B's request by id). Returning 403 would confirm the record exists; 404 does not.
- **401 Unauthenticated** is returned when there is no valid session/token at all.
- All three are returned in the standard error envelope from the Decision Sheet (`{"message_bn": "...", "message_en": "...", "error": {"code": "..."}}`), with Bengali and English messages.

---

## 8. Deferred future roles — evaluation catalogue

The roles below are **deferred**. They are not Phase 1 roles, not seeded, and not assigned to anyone. This section evaluates them so that, when the organisation asks for one, the answer is a configuration change (create the role, grant the permissions listed) rather than a redesign. Each entry states the role's purpose, its recommended permission set (drawn from the catalogue in §4 — no new permissions are invented here), and the condition that would justify creating it.

**Recommended minimum practical structure (when the organisation outgrows two roles):** do not create all of these at once. The recommended first additions, in order, are: **(1) Treasurer** (finance separation — the §6.1 self-approval problem disappears), **(2) Content Editor** (content authoring leaves the Super Admin's desk), **(3) Member Manager** (member approvals and directory work leave the Super Admin's desk). The remaining roles are created only when a named person is ready to hold them and the workload justifies it. Creating a role with no holder, or a holder with no workload, recreates the confusion the two-role model was chosen to avoid.

### 8.1 Admin (general administrator)

| | |
|---|---|
| **Purpose** | A deputy to the Super Admin for day-to-day administration, without the most sensitive powers (role management, audit-log access, finance approval). |
| **Recommended permissions** | `members.view/create/update/approve/suspend`, `directory.*` (except `directory.publish` — see note), `organisation.update`, `committee.manage`, `activities.*`, `content.*`, `media.*`, `reports.publish`, `contact_messages.view/reply`, `data_rights.manage`, `dashboard.view_admin`, `notifications.view_log`, `expatriate.requests.view/assign`, `donors.view/update`, `blood.requests.view/update`. **Not granted:** `roles.manage`, `users.manage_roles`, `members.reset_password` (or granted only with a second Super Admin's approval — a policy decision at creation time), `audit_logs.view`, `finance.approve`, `finance.reverse`, `settings.manage`. |
| **Justify when** | The Super Admin is a bottleneck on routine approvals and content, but the organisation is not ready to split duties by function. |
| **Caution** | This role is the easiest to over-grant. If it accumulates `finance.approve` and `audit_logs.view`, it is a second Super Admin in all but name — in which case, call it that. |

### 8.2 President (সভাপতি) and 8.3 General Secretary (সাধারণ সম্পাদক)

| | |
|---|---|
| **Purpose** | The organisation's elected leadership. Their system role is **oversight and representation**, not daily operation. In the prototype's demo committee (Audit Findings §5.3) the President is মোঃ হাবিবুর রহমান (নমুনা) and the General Secretary is মোঃ সেলিম উদ্দিন (নমুনা) — demo names, not real holders. |
| **Recommended permissions** | `dashboard.view_admin` (read-only KPIs), `members.view`, `directory.view`, `activities.view`, `content.view_public`, `finance.view`, `finance.view_public`, `finance.export`, `audit_logs.view` (read-only — the President/GS are the natural internal auditors until a Finance Auditor exists), `reports.download`, `notifications.view_own`. **Not granted:** any `create/update/delete/approve/publish` on operational data. |
| **Justify when** | The committee wants to see the platform's state without asking the Super Admin for screenshots, and wants independent visibility of the audit log and finance. |
| **Caution** | Do not grant operational powers to these roles "because they are senior". Seniority is not a permission. If the President also does operational work, they hold a second, operational role for that work (see §3.3 — one primary role in Phase 1; a future dual-role policy would be needed first). |

### 8.4 Treasurer (কোষাধ্যক্ষ)

| | |
|---|---|
| **Purpose** | Owns finance: enters ledger entries, prepares monthly summaries and annual reports. This is the role that **solves the §6.1 self-approval problem**: the Treasurer enters, a Super Admin (or a second approver) approves. |
| **Recommended permissions** | `finance.view/create/reverse`, `finance.categories.manage`, `finance.projects.manage`, `finance.reports.publish` (only if the preparer/approver split is preserved — otherwise `finance.reports.publish` stays with the Super Admin), `finance.export`, `dashboard.view_admin`, `reports.download`. **Not granted:** `finance.approve` on their own entries (enforced by §6.1); `members.*` beyond `members.view`; `roles.manage`; `audit_logs.view`. |
| **Justify when** | Finance volume grows beyond what the Super Admin can enter and get approved, or the organisation wants the entry/approval split enforced between two people. **This is the highest-priority future role.** |
| **Note** | The prototype's demo committee lists a Treasurer (মোসাঃ শারমিন আক্তার, নমুনা — Audit Findings §5.3). That is demo data; the real Treasurer is a client decision. |

### 8.5 Organization Secretary (সাংগঠনিক সম্পাদক)

| | |
|---|---|
| **Purpose** | Owns the organisation's records: committee terms, advisors, past leaders, timeline, constitution. |
| **Recommended permissions** | `organisation.update`, `organisation.timeline.manage`, `constitution.manage`, `committee.view/manage`, `directory.view`, `activities.view`, `content.view_public`, `dashboard.view_admin`. **Not granted:** finance, members, expatriate requests, donor contacts. |
| **Justify when** | Committee/organisation records change often enough that the Super Admin is a bottleneck, and the holder is the person who actually maintains those records. |

### 8.6 Member Manager

| | |
|---|---|
| **Purpose** | Owns the member lifecycle: registrations, approvals, profiles, family records, suspensions (but not deletions or password resets). |
| **Recommended permissions** | `members.view/create/update/approve/suspend`, `members.export` (confirmation-gated), `directory.create/update/publish`, `profile.view_own/update_own`, `dashboard.view_admin`, `contact_messages.view`. **Not granted:** `members.delete`, `members.reset_password`, `roles.manage`, `users.manage_roles`, finance, audit logs. |
| **Justify when** | Member volume grows (registrations per week become a queue) and the Super Admin needs the approval work off their desk while keeping deletions and resets centralised. |

### 8.7 Content Editor and 8.8 News Editor

| | |
|---|---|
| **Purpose** | **Content Editor:** authors and edits all content (notices, news, events, jobs, FAQs, gallery) and uploads media. **News Editor:** a narrower variant — notices and news only. Create one or the other, not both, unless the volume justifies the split. |
| **Recommended permissions (Content Editor)** | `content.create/update/archive`, `media.upload/manage`, `activities.create/update` (activity copy is content work; `activities.publish` stays with the Super Admin until the author/publisher split in §6.3 is formalised), `reports.publish` (no — reports are finance; excluded). **Not granted:** `content.publish` (until the split is formalised), `content.delete`, finance, members, audit logs. |
| **Recommended permissions (News Editor)** | Same as Content Editor but scoped by content type (notices + news only) — enforced by a policy check on the post's category, not by a separate permission set. |
| **Justify when** | Content volume grows beyond the Super Admin's capacity, or the organisation wants a named person responsible for what is published. |
| **Caution** | The `content.publish` question must be decided **before** creating the role: either the editor publishes (and the Super Admin reviews by audit), or the editor authors and the Super Admin publishes (enforced separation, §6.3). Do not leave it ambiguous. |

### 8.9 Event Manager

| | |
|---|---|
| **Purpose** | Owns events: creates and manages event listings (and, if RSVP is added later, registrations). |
| **Recommended permissions** | `content.create/update` scoped to the `event` category (policy-enforced), `activities.create/update` (events that are also annual activities), `media.upload`, `dashboard.view_admin`. **Not granted:** other content categories, finance, members. |
| **Justify when** | Events become frequent enough to need a dedicated owner. In Phase 1, events are infrequent and the Super Admin handles them. |

### 8.10 Expatriate Support Manager

| | |
|---|---|
| **Purpose** | A senior helper: manages the expatriate queue as a whole — assigns helpers, monitors the 72-hour no-update reminder (doc 05 §9.1), handles escalations and urgent requests, manages the ERT roster. |
| **Recommended permissions** | All `expatriate.*` permissions, including `expatriate.requests.assign`, `expatriate.requests.reject`, `expatriate.requests.cancel`, `expatriate.emergency.manage`, plus `dashboard.view_helper` and `dashboard.view_admin` (queue KPIs), `notifications.view_log` (for the M5 scope). **Not granted:** any other module. |
| **Justify when** | Helper count grows beyond a handful, or urgent/escalation handling needs a single accountable person rather than "whichever helper sees it first". |

### 8.11 Blood Donor Coordinator

| | |
|---|---|
| **Purpose** | Owns the donor registry and blood-request lifecycle: verifies donors, manages availability, coordinates emergency requests, follows up fulfilment. |
| **Recommended permissions** | `donors.view/create/update/delete`, `blood.requests.view/create/update`, `blood.requests.respond` (on a donor's behalf only where the donor cannot act themselves — logged), `donors.view_contact` (only under the same consent rule as everyone else — **the coordinator does not get a blanket reveal**; each reveal needs the donor's grant for that request and is logged). **Not granted:** finance, members beyond `members.view`, audit logs. |
| **Justify when** | Blood requests become frequent and need coordination beyond "the requester clicks and hopes". |
| **Caution** | This role is the most likely to be over-granted on `donors.view_contact`. The consent rule (§7.3) applies to every role, including this one. There is no role that can see donor phones without consent. |

### 8.12 Finance Manager and 8.13 Finance Auditor (read-only)

| | |
|---|---|
| **Finance Manager — purpose** | A Treasurer with approval power: enters **and** approves finance entries (but still never approves their own entries — §6.1 applies to every role). Effectively the Treasurer plus `finance.approve` on others' entries. |
| **Finance Manager — permissions** | All Treasurer permissions plus `finance.approve`, `finance.reports.publish`. **Not granted:** `members.*` beyond view, `roles.manage`, `audit_logs.view` (unless also the auditor — see below; the two should not be the same person). |
| **Finance Auditor — purpose** | Read-only oversight of finance and of the audit trail. The auditor verifies; they never enter, approve, or change anything. |
| **Finance Auditor — permissions** | `finance.view`, `finance.view_public`, `finance.export`, `reports.download`, `audit_logs.view`, `dashboard.view_admin`. **Nothing else. No create, update, delete, approve, publish, or manage permission of any kind.** |
| **Justify when** | **Finance Manager:** when finance volume needs a dedicated approver who is not the Super Admin. **Finance Auditor:** when the organisation appoints an internal or external auditor (annual audit, donor reporting). The auditor role can be created at any time — it needs no workload threshold, because read-only access costs nothing and the audit trail is already complete. |
| **Caution** | The Finance Manager and the Finance Auditor must **never** be the same person. If one person holds both, the audit is meaningless. Enforce this as a policy rule (the system should warn when assigning the auditor role to someone who holds finance write permissions). |

### 8.14 Gallery Manager

| | |
|---|---|
| **Purpose** | Owns the photo/video library: uploads, captions, albums, consent flags. |
| **Recommended permissions** | `media.upload/manage`, `content.create/update` scoped to gallery items. **Not granted:** other content, finance, members. |
| **Justify when** | Media volume grows (regular event photography) and the Super Admin is not the person taking or curating the photos. Note the consent dimension: the Gallery Manager must record consent for every photo of an identifiable person (doc 06 §11) — the permission grants upload, not the right to publish without consent. |

### 8.15 Member and 8.16 Registered Community User

These are not two different roles — they are the same actor at two stages, and the distinction matters for permissions:

| | |
|---|---|
| **Registered Community User** | Someone who has registered (name + mobile + password) but whose registration is **pending approval**. They can log in (Engineering Plan v1.1 §9.2: login succeeds, services are locked, and they see an "awaiting approval" screen). Their permissions: `profile.view_own`, `profile.update_own`, `notifications.view_own`, `content.view_public`. **Nothing else** — no request submission, no donor registration, no directory members-only view — until approved. |
| **Member** | The same user after Super Admin approval. Full Member permissions (§2.3). |
| **Transition** | Approval is a single Super Admin action (`members.approve`) that flips the user's status from `pending` to `approved` and unlocks the Member permission set. Rejection flips it to `rejected` with a reason; the user is told, and may re-apply. The status lives on the user record, not on the role — the role stays `member` throughout, and the *effective* permission set is role **plus** status. This is why the member lifecycle is a state machine (doc 05 §9.2), not just a role. |

### 8.17 Public Visitor

Not a role and never an account. Listed here for completeness: the Public Visitor is the absence of authentication, governed by the public-visibility rules in §7. No permissions are assigned; the public surface is defined by `visibility = public` and `status = published` on the data itself.

---

## 9. Role–Permission Matrix (summary)

The authoritative matrix — with every permission from §4 crossed against every role — is in **`diagrams/RBAC-MATRIX.md`**, in both Mermaid and table form. The summary below states the shape only; where the two disagree, the matrix document governs and the discrepancy must be reported to the coordinator.

| Role | Scope in one line |
|---|---|
| **Super Admin** | Everything, except self-approving own finance entries (§6.1) and removing the last Super Admin (§3.2). |
| **Expatriate Helper** | M5 only: view queue, take/accept assigned requests, advance status, add updates/expenses. Nothing else. |
| **Member** | Own data only: own profile/family, own requests, own donor record, own notifications. |
| **Public Visitor** | Published public content; masked donor search; tracking by Request ID (status only). |
| **Deferred roles (§8)** | As listed per role; none granted in Phase 1. |

**Reading the matrix:** a `✓` means the permission is granted to that role in Phase 1. A `—` means not granted. A `F` (future) means the permission belongs to a deferred role and is not granted to anyone in Phase 1. A `◐` (conditional) means granted with a scope condition stated in the matrix notes (e.g. helper edit only on assigned requests; public tracking shows status only).

---

## 10. Changes from Engineering Plan v1.1

This document **agrees** with Engineering Plan v1.1 §5 on the two-role Phase 1 model, the Super Admin and Helper power lists, the Member and Public definitions, the no-OTP login, the Super-Admin-mediated password reset, and the immutable audit log. It **extends** the plan in the following places (extensions, not contradictions — the plan states the principles; this document makes them enforceable):

1. **Last-active-Super-Admin guard (§3.2)** — the plan does not state this guard. It is added here because a two-role model with a single Super Admin has a single point of failure, and the guard is cheap to enforce. It is a new rule, flagged as such.
2. **Password policy (§5.1)** — the plan says "strong password" (Decision Sheet) and "passwords always hashed". This document fixes the numbers: 12 characters minimum (16 recommended for Super Admin), complexity, history of 5, no forced expiry. These numbers are blueprint decisions, not plan quotations.
3. **Login throttling numbers (§5.2)** — the plan requires rate limiting and a temporary lock; this document fixes 5 attempts / 15 minutes (throttle) and 10 attempts / 30 minutes (lock). Blueprint decisions.
4. **Session lifetimes (§5.4)** — the plan does not fix session lifetimes. 120 minutes idle (Member/helper), 30 minutes idle (Super Admin), 12 hours absolute. Blueprint decisions.
5. **Sensitive-action confirmation (§5.6)** — the plan does not require re-authentication for sensitive actions. Added here as a governance control for a high-concentration-of-power model.
6. **Separation of duties (§6)** — the plan's finance lifecycle (§9.4) implies entry vs approval, but does not state the "never approve your own entry" rule explicitly. This document makes it an enforced rule, and states its consequence for single-Super-Admin organisations plainly.
7. **Donor-consent correction (§7.3)** — the plan (§9.3) already describes donor-side consent correctly. This document explicitly records that the prototype's requester-click consent is **not** consent and is not carried forward. That is a correction of the prototype, not of the plan.
8. **Public-tracking privacy boundary (§7.4)** — the plan does not specify what public tracking shows. The prototype shows applicant name and area; this document narrows the public view to status + sanitised steps + expense total, and flags any widening as a recorded client decision.
9. **Deferred-role catalogue (§8)** — the plan names the deferred roles in one line ("President, General Secretary, Treasurer ইত্যাদি"). This document evaluates each deferred role named in the task brief with a recommended permission set, so the future decision is a configuration change.

## 11. Open questions

| # | Question | Status |
|---|---|---|
| D11 | The expatriate wizard is 3 steps in the Direction D build but Design System §7.1 describes 4 steps. Does the step-count difference change any permission (e.g. is a review step a separate approval)? **No** — the wizard's step count is a UX matter; it does not create or remove a permission. The submit guard (all fields complete before a request is created) is the control that matters, and it exists regardless of step count. | Under review — UX only; no RBAC impact. |
| RBAC-1 | Should the public tracking view include the applicant's first name (as the prototype did), or stay at status-only (§7.4)? | Under review — client decision required. Default is status-only. |
| RBAC-2 | Should the organisation hold two Super Admins from day one (§3.2 recommendation), or start with one? | Under review — client decision required. |
| RBAC-3 | Is MFA for Super Admins (§5.8) enabled at launch or deferred? | Under review — client decision required. |
| RBAC-4 | Who is authorised to request the §3.2 recovery bootstrap, and through what channel? | Under review — to be agreed at handover and recorded in the operations runbook. |
| RBAC-5 | Exact lockout/throttling numbers (§5.2) and session lifetimes (§5.4) are blueprint decisions; confirm with the client that the trade-off (security vs convenience) is acceptable. | Under review. |

---

*End of doc 04. Companion: `diagrams/RBAC-MATRIX.md` (authoritative matrix), `05-BACKEND-ARCHITECTURE.md` §6–§8 (enforcement), `06-DATABASE-DESIGN.md` §2 (roles/permissions/audit tables).*
