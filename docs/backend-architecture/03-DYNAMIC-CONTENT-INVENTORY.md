# 03 — Dynamic Content Inventory

**Status:** Planned — this inventory specifies content that must become dynamic. In the prototype all
of it is hard-coded demo data (audit document 01 §5–§6); none of it is dynamic today.
**Sources:** the repository audit (document 01) and Engineering Plan v1.1 §6–§7. Field lists are derived
from the prototype's own data structures (`DIRECTORY`, `ACTIVITIES`, `FINANCE`, `SVC`, and the 8 forms)
and from the plan's table catalogue; where the plan adds a field the prototype does not have, it is
marked "(plan v1.1)".
**How to read this document:** one table per content area. "Restricted approval" (🔒) marks content
whose publication needs a second check or a named approver because it involves money, donor contacts,
member personal data, or expatriate requests — see §2. States use the shared vocabulary
`draft / in_review / published / archived` for content, and the expatriate state machine
(`pending → accepted → in_progress → completed → closed`, plus `rejected`, `cancelled`) for requests.
**Rule for every item:** statistics are computed from data, never hand-typed; where data is unverified
the public surface shows "তথ্য হালনাগাদ হচ্ছে" (information being updated). All content is bilingual
(BN/EN) unless marked otherwise; Bengali is the fallback where a translation is missing (plan v1.1 §7).

## 1. How this inventory maps to the prototype

| Prototype source (hard-coded) | Becomes (backend content) |
|---|---|
| Inline home HTML (§01–§09), `FINANCE["2026"]` strip, `ACTIVITIES.slice(0,2)` + `NEWS.slice(0,2)` feed | Homepage CMS (§4), Finance (§20), Activities (§11), News (§17) |
| `DIRECTORY` (10 entries) | Community Directory (§6), Professional Directory (§8), Institution Management (§9) |
| `COMMITTEE` / `ADVISORY` / `FORMER` / `CONSTITUTION` | Organisation (§5) |
| `ACTIVITIES` (6) | Activities (§11) |
| `SVC` (7 services) + wizard forms + `state.requests` | Expatriate Services (§12), Expatriate Requests (§13), Emergency (§14) |
| `DONORS` (6) + `#bloodForm` | Blood Donors (§15), Blood Requests (§16) |
| `NEWS` / `NOTICES` / `EVENTS` / `JOBS` | News (§17), Notices (§18), Events (§19), Jobs (§20) |
| `GALLERY` (8) | Gallery (§21) |
| `FINANCE` (3 years) + report buttons | Financial Transparency (§22), Project Accounting (§23), Annual Reports (§24) |
| `FACTS` (5 FAQ) + `#/privacy` inline text | FAQ (§25), Privacy/Policy (§27) |
| `#regForm` / `#loginForm` / `#profileForm` / `USERS` | Member Management (§7) |
| `#contactForm` + contact info panel | Contact (§26) |
| Header nav, footer columns, announcement strip | Navigation (§28), Footer (§29) |
| `EN` dictionary (400 keys), `data-i18n` | SEO (§30), Notification Templates (§31), System Config (§32) |
| (No counterpart in the prototype) | Global Settings (§3), Infrastructure (§10), Audit Logs (§33) |

## 2. Restricted-approval content (🔒)

These items need restricted approval — a named approver, a second check, or a consent record — before
publication or disclosure. They are flagged 🔒 in their tables.

| Category | Why restricted | Approver / control |
|---|---|---|
| Finance entries, project accounts, annual reports | Money; public trust; audit trail | Super Admin enters; a second approval step for publication is **Under review** (document 13, Q-10). Ledger entries are immutable; corrections only by reversal. |
| Donor contact numbers | Personal data; consent-gated by design | Donor grants consent per request; grant/revocation logged with timestamp; number never public. |
| Member personal data (phone, date of birth, family, address) | Personal data; visibility + consent flags | Record is public only with recorded consent; consent withdrawal hides it immediately. Date of birth never public (age band only). |
| Expatriate requests (applicant, beneficiary, phone, address) | Sensitive personal data; most sensitive module (plan v1.1 §6 M5) | Visible only to the assigned helper, backup helper, and Super Admin; public tracking shows only the Tier-S allowlist (Doc 04 §7.4 — Request ID + tracking secret required; no applicant/beneficiary name or phone, no details, no vouchers, no author identities). Beneficiary phone/address in encrypted columns. |
| Real photos of people | Consent + licence | Consent flag per media item; no photo published without it. |
| Job circulars | Must be verified before publication | Super Admin publishes only after verification. |
| Constitution full text, history beyond 1999 | Must be document-verified | Published only after document verification; verification flag per milestone. |

## 3. Global Settings (M10 / M11)

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Site identity | Brand name (BN/EN), tagline, slogan, founding year (1999 — verified), crest/logo file | Managed as `settings` keys (no draft workflow — Phase 0.1, M-07; single live record; changes versioned) | `settings.manage` — Super Admin | `GET /public/settings` (brand, tagline, slogan, founding year) | Keep all versions; logo file retained while in use + 1 year after replacement. Logo itself is an open item (document 13, Q-07). |
| Policy copy (single source) | No-service-charge statement, 999/emergency disclaimer, ERT size (3–5), service catalogue text | Managed as `settings` keys (no draft workflow — Phase 0.1, M-07); one record feeds home, wizard, FAQ, privacy (the prototype re-types this text in 4 places — audit §5.10) | `settings.manage` — Super Admin | Public (rendered in page content) | Versioned; old versions kept for audit. |
| Contact defaults | Office address, hours, phone, email, emergency number (999) | Managed as `settings` keys (no draft workflow — Phase 0.1, M-07); real values only after verification | `settings.manage` — Super Admin | Public once verified; until then the contact page shows no invented details | Until verified, fields stay empty and the public page shows the "information being updated" state. |
| Announcement strip | Notice text (BN/EN), link, start/end, dismissible flag | Draft → published → archived (expiry automatic) | `notices.publish` — Super Admin | `GET /public/announcements` (current only) | Archived strips kept 1 year. |

## 4. Homepage CMS (M11)

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Hero | Headline, subline, CTAs (label + target), hero image + caption, live-data right column (next event + open request count — D4, fed by API) | Managed as `settings` keys (no draft workflow — Phase 0.1, M-07); image needs consent flag | `content.publish` — Super Admin | `GET /public/home` | Images retained per media rules (§21). |
| Our story (§01) | Body (BN/EN), pull-quote + attribution, image + caption | Managed as `settings` keys (no draft workflow — Phase 0.1, M-07) | `content.publish` — Super Admin | `GET /public/home` | Quote attribution must be a real, consenting person or marked as a sample; the prototype's quote is explicitly a sample from an unnamed elder. |
| Community at a glance (§02) | Stat definitions only (no hand-typed numbers) | Published when the underlying data is verified; otherwise the "তথ্য হালনাগাদ হচ্ছে" state | `settings.manage` — Super Admin | `GET /public/stats` (computed, cached 15 min) | Stats are computed, never stored as numbers. |
| Heritage timeline / Meridian (§03) | Milestone records (date, title, body BN/EN, verified flag) + undated era blocks | Draft → in_review (verification) → published → archived | `organization.manage` — Super Admin | `GET /public/timeline` | Only verified milestones published; today only 1999 is verified. |
| Services index (§04) | Service rows (order, title, description, target) — 6 rows in Direction D | Managed as `settings` keys (no draft workflow — Phase 0.1, M-07) | `content.publish` — Super Admin | `GET /public/home` | Numbering is a design matter (QA D5); content order is managed here. |
| Expatriate pitch (§05) | Pitch copy, 4-step "how it works" (labels BN/EN), CTAs, disclaimer | Managed as `settings` keys (no draft workflow — Phase 0.1, M-07) | `content.publish` — Super Admin | `GET /public/home` | Step labels must match the request workflow (§13). |
| Blood-donation section (§06) | Intro copy, group chips (8 groups), CTAs | Managed as `settings` keys (no draft workflow — Phase 0.1, M-07) | `content.publish` — Super Admin | `GET /public/home` | Chips link to the donor search with the group pre-selected. |
| Activities & news feed (§07) | Feed assembly rule (latest 2 activities + latest 2 news) — no stored copy | Automatic from Activities + News | — (derived) | `GET /public/home` | Feed is assembled, never duplicated (§1). |
| Gallery strip (§08) | Subset rule (featured gallery items) | Automatic from Gallery | — (derived) | `GET /public/home` | Same media records as §21. |
| Transparency strip (§09) | Mini-ledger rule (first rows of the current year's published ledger) | Automatic from Finance | — (derived) | `GET /public/home` | Demo figures never shown; unpublished years show the updating state. |

## 5. Organization (M3)

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| History & mission/vision | Body (BN/EN), mission, vision, verification flag per paragraph | Draft → in_review → published | `organization.manage` — Super Admin | `GET /public/organization` | History beyond 1999 only after document verification. |
| Timeline milestones | Date, title, body (BN/EN), verified flag, source note (internal) | Draft → in_review → published → archived | `organization.manage` — Super Admin | `GET /public/timeline` | Same records as home §03 (§4). |
| Constitution | Articles/clauses (BN/EN), version number, effective date, PDF file | Draft → in_review → published (versioned; old versions retained and downloadable) | `organization.manage` — Super Admin | `GET /public/constitution` (+ PDF download) | Prototype's 5-article text is a sample summary, not the constitution; replace with the real text. |
| Achievements | Title, date, body (BN/EN), linked activity/report | Draft → published | `organization.manage` — Super Admin | `GET /public/organization` | Linked to M4 where applicable. |

## 6. Committee (M3) — Executive Committee, Advisory Council, Former Leaders

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Committee membership | Person (link to M2 person or standalone name BN/EN), role (President, General Secretary, Treasurer, Organising Secretary, Expatriate Affairs Secretary, other), term start/end, photo, contact rules | Draft → published → archived (term end archives automatically; archived terms remain in history) | `organization.manage` — Super Admin | `GET /public/committee` (current term + archive) | Terms are the unit of record; a person may hold successive terms. |
| Advisory council | Person, role (Chief Adviser, Adviser), term start/end, photo | Draft → published → archived | `organization.manage` — Super Admin | `GET /public/committee` | Same structure as committee, role = adviser. |
| Former leaders | Person, role, term start/end (complete ranges — the prototype's terms are open-ended or blank), photo | Draft → published | `organization.manage` — Super Admin | `GET /public/committee` | Historical record; never deleted, only corrected with a note. |

## 7. Community Directory (M2)

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Directory entry (person) | Name (BN/EN), role/description (BN/EN), category (teacher/doctor/professional/business), profession (taxonomy, §8), area (para), photo, visibility (public/members-only/private), consent_status + consent_given_at | Draft → in_review (consent check) → published → archived | `directory.manage` — Super Admin (create/edit); public/members view by visibility | `GET /public/directory` (public entries), `GET /community/directory` (members-only, authenticated) | No phone, email, or address on a public entry unless consent explicitly covers it. Consent withdrawal hides immediately. |
| Directory entry (institution) | See §9 | — | — | — | — |
| Directory entry (place) | Name (BN/EN), description, area, category = place | Draft → published | `directory.manage` — Super Admin | `GET /public/directory` | e.g. Historic Banyan Tree Square (demo). |
| Areas (para taxonomy) | Name (BN/EN), order | Managed list (no workflow) | `settings.manage` — Super Admin | Public (as filter options) | Prototype areas: উত্তর/মধ্য/দক্ষিণ/পূর্ব/বাজার পাড়া — confirm the real list with the organisation. |
| Search & filter | — (behaviour, not content) | — | — | `GET /public/directory?q=&category=&area=` — server-side search/filter, paginated (default 20, max 50, per plan v1.1 §8) | Search matches BN+EN name/role/area. Bengali search quality is unverified (document 13, Q-12). |

## 8. Member Management (M1) 🔒

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Member account | Phone (encrypted + HMAC hash for lookup, unique), password hash, status (pending/approved/rejected/suspended), member ID (unique, issued at approval), joined date, last login | Registered → pending approval → approved / rejected → suspended | `members.manage` — Super Admin; own record — member (view/edit own) | None public. `POST /auth/register`, `POST /auth/login`, `GET /me`, `PATCH /me` (authenticated) | Deletion request: 30-day grace, then permanent deletion except anonymised financial/request records (plan v1.1 §6 M1). |
| Member profile | Name (BN/EN), photo, profession, address, area, country (expatriates), member type (resident/expat/student) | Draft (member edits) → published (own profile; Super Admin can correct) | Own profile — member; `members.view` — Super Admin | `GET /me` (own only) | Profile fields are personal data; never in a public response. |
| Family members | Name (BN/EN), relationship, date of birth (age band only in any shared view), gender | Added by member; Super Admin can correct | Own family — member; `members.view` — Super Admin | `GET /me/family` (own only) | Present in v1 prototype, dropped in Direction D; restored here. Children's data: counts/statistics only, never a named public profile (plan v1.1 §12). |
| Blood-donor opt-in | Boolean + link to donor record (§15) | Set at registration or later; reversible | Own — member | — | Opt-in creates/updates a donor record only with the member's consent. |
| Approval queue | Applicant, submitted date, status, decided-by/at, reason | Pending → approved / rejected | `members.approve` — Super Admin | Admin only (Filament) | Rejection records the reason. |

## 9. Professional Directory (M2)

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Professional listing | Same person record as §7 + profession taxonomy (doctor, engineer, teacher, lawyer, journalist, government officer, police/army, businessperson — plan v1.1 §6 M2), credentials/qualification (BN/EN, optional), workplace (optional) | Draft → in_review → published | `directory.manage` — Super Admin | `GET /public/directory?category=professional&profession=`; `GET /community/professionals?profession=` | The prototype has no separate professionals view; the listing is a filtered view of the same records, not a second copy. |
| Profession taxonomy | Name (BN/EN), order | Managed list | `settings.manage` — Super Admin | Public (as filter options) | Extendable without code changes. |

## 10. Institution Management (M2)

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Institution | Name (BN/EN), subtype (school/mosque/madrasa/clinic/other), description (BN/EN), services, hours, contact, location, area, photo, visibility, consent_status | Draft → in_review → published → archived | `directory.manage` — Super Admin | `GET /public/directory?category=institution`; `GET /public/institutions/{id}` (detail) | Prototype has 3 institution entries with no detail page and no hours/services/contact fields — all new. |

## 11. Infrastructure (M2)

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Facility | Name (BN/EN), type (field, graveyard, road, other), description, location, status (e.g. active/under maintenance), area, photo | Draft → published | `community.infrastructure.manage` — Super Admin | `GET /public/infrastructure` (via C2c) | **Absent in the prototype** — entirely new. Stored in `infrastructure_facilities` (Doc 06 §3.8). A map is Under review (document 13, Q-15); do not promise map coordinates until decided. |
| Landmark / place | Name (BN/EN), description, area, location note (BN) | Draft → published | `directory.manage` — Super Admin | `GET /public/directory` (via C2c) | Stored in `landmarks` (Doc 06 §3.6). |

## 12. Activities (M4)

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Activity | Year, category (scholarship/winter clothing/blood donation/medical camp/tree plantation/national day/relief/other), date, title (BN/EN), body (BN/EN), images, beneficiary count, linked annual-report document | Draft → in_review → published → archived (year-end auto-archive) | `activities.manage` — Super Admin | `GET /public/activities?year=&category=`; `GET /public/activities/{id}` | Category is mandatory on every activity — the prototype's category filter has no data behind it (audit §8.7). |
| Activity detail | Same record + gallery, participants, outcomes, related activities (optional, plan Phase 2 if not decided) | Same as above | Same as above | `GET /public/activities/{id}` | No comments or attendance in Phase 1. |

## 13. Expatriate Services (M5) — service catalogue

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Service type | Key (grocery/medicine/hospital/elderly/home/document/general), name (BN/EN), description (BN/EN), urgency options (normal/urgent), `needed_by` (today/tomorrow/week), active flag | Managed table (`service_types`, Doc 06 §6.8); requests snapshot `service_key`/`service_name_bn` at submission | `service_types.manage` — Super Admin | `GET /public/services` (S1); admin endpoints S2–S5 | The 7 services come from the prototype's `SVC` object; confirm the final list with the organisation (plan v1.1 §6 M5 lists 6 types — reconcile, document 13, Q-22). |
| Service policy copy | No-charge statement, 999 disclaimer, ERT size, "how it works" steps | Managed as `settings` keys (no draft workflow — Phase 0.1, M-07; single source, §3) | `settings.manage` — Super Admin | Public (rendered in page content) | Step labels must match the request workflow (§14). |

## 14. Expatriate Requests (M5) 🔒

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Request | Request ID `EXP-YYYY-####` (server-generated, unique, never reused), service type, for-whom, details, urgency, applicant name/phone/country (encrypted), beneficiary name/phone/address (encrypted), status, assigned helper + backup helper, created/updated timestamps | State machine: pending → accepted → in_progress → completed → closed; rejected (with reason); cancelled (by applicant). Invalid transitions rejected. | Submit — public (login requirement open, document 13 Q-03); view own — member; view/act on all — `expatriate.requests.view` / `.assign` / `.update` (Helper + Super Admin) | `POST /api/v1/expatriate-requests` (public, X1); `GET /api/v1/expatriate-requests/mine` (auth, X4); `POST /api/v1/expatriate-requests/track` (public, secret-authenticated, Tier-S allowlist only — Doc 04 §7.4, Doc 07 X2). The old `GET …/track` endpoint is deleted. | Never hard-deleted. Retention per audit-log rules (§33); anonymise on member-deletion request except where legal record-keeping requires retention. |
| Status history | Request, from/to status, actor, timestamp, note (BN/EN) | Append-only | Helper + Super Admin write; applicant/member reads own | Included in tracking response **as the 4-node timeline only** (transition + latest applicant-visible note per node; **never the actor** — no author identities in the public view, Doc 04 §7.4) | Append-only; never edited or deleted. |
| Update notes + photos | Note (BN/EN), photo(s) with consent flag, author, timestamp | Appended during in_progress/completed | Assigned helper / Super Admin | **Not** included in the public tracking response. Notes appear only as the per-node sanitised note (visible-flagged, author stripped); photos are never public (AO-21 for any future inclusion). | Proof-of-delivery photos are a prototype promise ("ছবিসহ আপডেট") with no prototype implementation. |
| Expense lines | Item, amount BDT `numeric(12,2)`, receipt/photo, entered-by, timestamp | Appended; never edited (correction by a compensating line, recorded as such) | Assigned helper / Super Admin | Included in tracking response as itemised lines (`item_bn`, `item_en`, `kind`, `amount`) + server-computed total + constant `service_charge: 0`. **Receipt/voucher photos and the recorder identity are never included** (no vouchers, no author identities — Doc 04 §7.4). | **No service-charge field exists.** A request reaches `completed` only with ≥1 expense line or a "no expense incurred" declaration (plan v1.1 §9). |
| Assignment | Request, helper, backup helper, assigned-by/at | Assigned → reassigned (history kept) | `expatriate.requests.assign` — Super Admin (helpers take unassigned requests) | Admin only | Assignment history retained. |

## 15. Emergency (M5)

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| ERT roster | Member (link to person/user), role (primary/backup), on-call rotation, contact (internal only) | Managed; rotation changes logged | `emergency.manage` — Super Admin | None public (roster is internal) | Team size 3–5 (Decision Sheet). No ERT phone numbers are public. |
| Emergency flag on request | Flag, reason, flagged-by/at, escalation state | Set on a request; alerts ERT | Helper + Super Admin | Included in tracking where approved | Escalation rules are an open question (document 13, Q-17). The 999 disclaimer is permanent. |
| Emergency contacts (public) | National emergency service 999, organisation emergency contact (once verified) | Published once verified | `settings.manage` — Super Admin | `GET /public/emergency-contacts` | The prototype has no real emergency contact number. |

## 16. Blood Donors (M6) 🔒

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Donor | Name (BN/EN), blood group (8 groups), area, last donation date, availability (computed: not available until 90 days after last donation), phone (encrypted, never public), consent flags + consent_given_at, visibility | Draft → in_review (consent check) → published → archived (consent withdrawn hides immediately) | `donors.manage` — Super Admin; own record — donor/member | `GET /public/blood-donors?group=&area=` (masked phones only) | Prototype stores availability as a static flag and free-text last donation — both replaced by a date + computed availability. |
| Consent records | Donor, request (§17), granted/revoked, timestamp, channel | Append-only | Donor acts on own consent; Super Admin views log | — (internal; disclosure logged) | Consent is a donor-side action. The prototype's requester-click consent must not be reproduced. |

## 17. Blood Requests (M6) 🔒

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Blood request | Blood group, units (1/2/3/4+ bags), hospital, contact phone (encrypted), status (submitted → donors notified → consent granted → fulfilled/closed; cancelled), created/updated timestamps | Lifecycle per plan v1.1 §6 M6; status history append-only | Submit — public; act — donor (own consent) + Super Admin | `POST /blood-requests`; `GET /blood-requests/{id}` (requester + Super Admin; donors see requests matching them) | The prototype creates no record and notifies no donor; the whole lifecycle is new. Matching donors are notified on submission. |
| Donor notifications | Request, donor, notified-at, channel, delivered/failed | Logged per send | System | — | Delivery log retained per §31/§33. |

## 18. News (M7)

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| News article | Date, tag, title (BN/EN), body (BN/EN), author, images, slug | Draft → review → published → archived; scheduled publish supported | `content.publish` — Super Admin | `GET /public/posts?type=news`; `GET /public/posts/{slug}` (detail — new; the prototype has no detail page) | Prototype's 2 items have no detail page, author, or images. |

## 19. Notices (M7)

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Notice | Date, title (BN/EN), body (BN/EN), priority (normal/urgent), expiry date, show-on-strip flag, show-on-ticker flag | Draft → review → published → archived (expiry automatic; urgent notices trigger home ticker + push) | `notices.publish` — Super Admin | `GET /public/posts?type=notice`; `GET /public/announcements` | Expired notices stop showing automatically. The announcement strip carries one notice in the prototype. |

## 20. Events (M7)

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Event | Date/time, venue, title (BN/EN), body (BN/EN), slug | Draft → review → published → archived | `content.publish` — Super Admin | `GET /public/events`; `GET /public/events/{slug}` | Prototype's 2 events have no date/time/venue fields beyond prose. RSVP is Under review (document 13, Q-18). |

## 21. Jobs (M7)

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Job circular | Employer, deadline, title (BN/EN), body (BN/EN), application route, verified flag | Draft → in_review (verification) → published → archived (deadline expiry automatic) | `content.publish` — Super Admin (publish only after verification) | `GET /public/posts?type=job` | Unverified circulars are never published. Prototype's 1 item has no employer, deadline, or apply link. |

## 22. Gallery (M7)

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Photo | Image file, caption (BN/EN), album, order, consent flag, photographer/source note (internal) | Draft → in_review (consent check) → published → archived | `media.manage` — Super Admin | `GET /public/gallery`; `GET /public/gallery/{id}` | Thumbnails + WebP conversion by queue job (plan v1.1 §6 M7). The prototype's 8 base64 demo images are replaced, not reused. Consent flag mandatory. |
| Album | Title (BN/EN), year, category, cover photo | Draft → published | `media.manage` — Super Admin | `GET /public/gallery` (albums) | Albums group photos by year/category. |
| Video | Source (upload/embed), caption (BN/EN), poster frame, consent flag, size limit | **plan Phase 2** — placeholder only in Phase 1 ("ভিডিও গ্যালারি শীঘ্রই আসছে") | `media.manage` — Super Admin (plan Phase 2) | None in Phase 1 | No video content is invented for Phase 1. |

## 23. Financial Transparency (M8) 🔒

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Ledger entry | Entry number (unique), direction (income/expense), kind (income/expense/donation), category, linked project/activity, amount BDT `numeric(12,2)`, date, payee, voucher image, entered-by, approved-by, is_public_summary | Entered (draft) → approved-and-published in one step (summary). **Immutable once published** — no edit/delete at application level | `finance.create` / `finance.approve` — Super Admin (Treasurer role deferred) | `GET /finance/summary` (published summary only); monthly + per-project totals | Corrections only by reversal entry pointing at the original. Monthly balances computed on read (15-minute cache, Doc 06 §9.1). |
| Finance category | Name (BN/EN), kind, order | Managed list | `finance.manage` — Super Admin | Public (as summary labels) | Prototype has only 3 kinds and no sub-categories. |
| Monthly summary | Month, totals by kind/category, published flag | Computed on read (15-minute cache, Doc 06 §9.1); no stored snapshot | `finance.reports.publish` — Super Admin | `GET /public/finance/summary?month=` | Computed, never hand-typed. A later reversal changes the next computed summary (known limitation — the snapshot table remains a future option). |

## 24. Project Accounting (M8) 🔒

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Project | Name (BN/EN), budget BDT `numeric(12,2)`, spent (computed from linked entries), status (ongoing/completed), start/end dates | Draft → published → completed → archived | `finance.manage` — Super Admin | `GET /finance/projects/{id}` (published totals) | **Absent in Direction D** — entirely new. The editorial alternative's 4 demo projects are demo data, not a specification. Spent is computed, never typed. |
| Project–entry link | Project, ledger entry, amount | Set at entry time | `finance.create` — Super Admin | Included in project totals | An entry may link to one project (or none). |

## 25. Annual Reports (M8) 🔒

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Annual report | Year, title (BN/EN), summary (BN/EN), PDF file, audited flag, published date | Draft → in_review (audit) → published → archived (versioned by year) | `finance.reports.publish` — Super Admin | `GET /finance/reports/annual?year=` (PDF download) | The prototype's generated `.txt` download is replaced. Automatic PDF generation is plan Phase 2 (plan v1.1 §15). The UI must not label a report "audited" unless it is audited. |

## 26. FAQ (M7)

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| FAQ entry | Question (BN/EN), answer (BN/EN), category, order | Draft → published | `content.publish` — Super Admin | `GET /public/faq` (with search; categories as filters) | Prototype's 5 Q&A are static; categories and search are new. |

## 27. Contact (M11)

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Contact message | Name, phone (encrypted), message, submitted-at, status (new/read/replied/archived), replied-by/at, reply text | New → read → replied → archived | Submit — public; inbox — `contact_messages.view` / `contact_messages.reply` (Super Admin) | `POST /contact` (public) | The prototype's message goes nowhere; the inbox is new. Validation as coded: name 2+ characters, phone 10+ digits, message 10+ characters (audit §7.1). |
| Contact info page | Office address, hours, phone, email, map (see §3 contact defaults) | Published once verified | `settings.manage` — Super Admin | `GET /public/contact` | No real phone/email exists in the prototype; no map (0 `<iframe>`). A map is included once real details exist — see document 13, Q-15. |

## 28. Privacy / Policy (M1 / M10) 🔒

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Privacy policy | Versioned text (BN/EN), effective date, version number | Draft → in_review → published (versioned; old versions retained) | `settings.manage` — Super Admin | `GET /public/privacy` | The prototype's 4 principles are inline static text; the full policy must be supplied and versioned. Required for app-store submission in plan Phase 3 (Future Mobile). |
| Consent records | Person/donor, scope (public profile / public phone / photo), granted/revoked, timestamp, channel | Append-only | Subject acts on own consent; Super Admin views log | — (internal) | Withdrawal takes effect immediately across the API. |
| Data-rights requests | Requester, type (access/correction/deletion), status (received/in progress/completed), decided-by/at | Received → in progress → completed | Submit — member; handle — Super Admin | `POST /me/data-request` (auth); admin inbox | The privacy view promises the right to correct/delete; no flow exists in the prototype. Deletion: 30-day grace (plan v1.1 §6 M1). |

## 29. Navigation (M11)

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Primary nav | Items (label BN/EN, target, order, visibility: public/member/admin) — 8 items in Direction D (Home, Directory, Organization, Activities, Expatriate Support, Blood Donor, News, Finance) | Managed as `settings` keys (no draft workflow — Phase 0.1, M-07) | `settings.manage` — Super Admin | Part of `GET /public/settings` or page chrome | The mobile menu (12 items in the prototype) is a separate ordered list in the same record. QA D6/D7 (drawer vs bottom sheet; toggle placement) are frontend decisions. |
| Footer | Link columns (Services / Organisation / Help), brand block, demo disclaimer (removed at launch; replaced by a real disclaimer if needed) | Managed as `settings` keys (no draft workflow — Phase 0.1, M-07) | `settings.manage` — Super Admin | Part of page chrome | Footer links must resolve to real pages; no dead links. |

## 30. Footer (M11)

Covered with Navigation in §29 (same record, separate section). Footer content is managed, not
hard-coded: link columns, brand block, and any legal/disclaimer line are content records with draft →
published workflow, Super Admin only.

## 31. SEO (M11)

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Page meta | Page, title (BN/EN), description (BN/EN), Open Graph image, slug, structured-data type (Organization, Event) | Managed as `settings` keys (no draft workflow — Phase 0.1, M-07; per page; defaults from Global Settings) | `content.publish` — Super Admin | Rendered in page head; `sitemap.xml` auto-generated | Sitemap updates when a notice is published (plan v1.1 §14). Slugs are clean and stable; changing a slug keeps a redirect. |
| Sitemap / robots | Generated `sitemap.xml`, `robots.txt` | Automatic | — (generated) | `GET /sitemap.xml` | No hand-maintained sitemap. |

## 32. Notification Templates (M9)

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Template | Event key (e.g. `expatriate.request.created`, `blood.request.created`, `member.approved`), title (BN/EN), body (BN/EN), channels (web push / in-app / app push / email), variables (Request ID, name, status) | Code constants, versioned in git (no draft workflow, no admin UI in Phase 1 — Phase 0.1, M-06) | — (code change; no permission) | — (internal; rendered at send time) | Every send is logged (recipient, time, success/failure). Templates are bilingual; Bengali is the fallback. |
| Delivery log | Notification, recipient, channel, sent-at, delivered/failed, read-at | Append-only | System writes; Super Admin views | `GET /notifications` (own, authenticated) | Retention per §33. |

## 33. System Config (M10)

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Settings (key–value) | Feature flags, rate-limit thresholds, lockout policy, session/token expiry, pagination defaults (20, max 50), cache TTLs, backup schedule | Changed by Super Admin; every change logged | `settings.manage` — Super Admin | None public | Settings changes are audit-logged. Secrets are never stored here — secrets live in `.env` only. |
| Roles & permissions | Roles (super-admin, expatriate-helper in Phase 1), permissions (`resource.action`), assignments | Managed in admin; changes logged | `roles.manage` — Super Admin | None public | Spatie Laravel Permission v8 stores these as database rows; the admin UI is built on top (no built-in UI in the package). |

## 34. Audit Logs (M10) 🔒

| Item | Key fields | Workflow / states | Permissions | Public API | Retention / notes |
|---|---|---|---|---|---|
| Activity log | Actor (user), timestamp, IP, action, record type + ID, previous value, new value | Append-only; **never deleted, including by an admin** | `audit_logs.view` — Super Admin | None public | Retention at least 2 years (plan v1.1 §12). Covers every create/update/delete, login, approval, finance entry, status change, and consent-based number disclosure. |
| Login / security log | User, timestamp, IP, result (success/failure/lockout), device info where available | Append-only | `audit_logs.view` — Super Admin | None public | Supports lockout review and suspicious-login alerts (plan v1.1 §12). |

---

## 35. Inventory completeness check

Every content area named in the task brief is covered above: Global Settings (§3), Homepage CMS (§4),
Organization (§5), Committee (§6), Community Directory (§7), Member Management (§8), Professional
Directory (§9), Institution Management (§10), Infrastructure (§11), Activities (§12), Expatriate
Services (§13), Expatriate Requests (§14), Emergency (§15), Blood Donors (§16), Blood Requests (§17),
News (§18), Notices (§19), Events (§20), Jobs (§21), Gallery (§22), Financial Transparency (§23),
Project Accounting (§24), Annual Reports (§25), FAQ (§26), Contact (§27), Privacy/Policy (§28),
Navigation (§29), Footer (§30), SEO (§31), Notification Templates (§32), System Config (§33), Audit
Logs (§34).

**Not yet inventoried (no prototype or plan source):** voting (mentioned only in membership copy —
document 13, Q-21), member dues/subscription collection (no flow exists; finance shows "চাঁদা" only as an
income line), and a map (Under review — document 13, Q-15). These are recorded as open questions, not
invented here.
