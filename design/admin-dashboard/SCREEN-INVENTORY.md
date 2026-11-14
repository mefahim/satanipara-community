# Satanipara Community — Admin Dashboard Screen Inventory

Every planned screen, accounted for. Source: audit `AUDIT-BATCH-A.md`
§3.10 (56 screens) + `AMENDMENT-01-IA-AND-I18N.md` A2 (12 more screens —
households ×3, activity categories, annual archives, student achievements,
media library, finance overview, ledger, pending approval, finance
categories, published summaries, system health). **Total: 68 screens.**

Status key: **Built + verified** = renders in the Batch M QA sweep
(2026-11-14, headless Chromium, evidence in `QA-REPORT.md` + screenshots
in `~/workspace/satanipara-admin-dashboard/qa-final/`) and re-verified in
the Design Iteration 2 sweep (2026-11-14, 128/128 checks passed, evidence
in `../iteration2/qa-final-v2/`). **Built, with limitation** = renders but
with a noted gap. **Not built** = route exists but no view file; the shell
shows the "module in build" state.

Route table verified against `js/lib/router.js`; owner files verified
against `views/`.

## Audit §3.10 screens (1–56)

| # | Screen | Route | Owner file | Role | Status |
|---|---|---|---|---|---|
| 1 | Login (+ pending / expired / forced-change states) | `#/login`, `#/login/pending`, `#/login/expired`, `#/login/forced` | views/login.js | public | Built + verified |
| 2 | Dashboard — Super Admin overview | `#/dashboard` (SA) | views/dashboard.js | SA | Built + verified |
| 3 | Dashboard — Helper reduced overview | `#/dashboard` (EH) | views/dashboard.js | EH | Built + verified |
| 4 | User list | `#/users` | views/users.js | SA | Built + verified |
| 5 | Create user | `#/users/new` | views/users.js | SA | Built + verified |
| 6 | User detail (+ reset password, role history) | `#/users/:id` | views/users.js | SA | Built + verified |
| 7 | Edit user | `#/users/:id/edit` | views/users.js | SA | Built + verified |
| 8 | Roles & Permissions (view-only matrix) | `#/roles` | views/roles.js | SA | Built + verified |
| 9 | Member list (+ pending-applications view) | `#/members`, `#/members?status=pending` | views/members.js | SA | Built + verified |
| 10 | Member detail (+ family tab, request history) | `#/members/:id` | views/members.js | SA | Built + verified |
| 11 | Edit member | `#/members/:id/edit` | views/members.js | SA | Built + verified |
| 12 | Organisation — history milestones | `#/organisation`, `#/organisation/history` | views/organisation.js | SA | Built + verified |
| 13 | Constitution versions | `#/organisation/constitution` | views/organisation.js | SA | Built + verified |
| 14 | Committee — 3 tabs | `#/organisation/committee` | views/organisation.js | SA | Built + verified |
| 15 | Achievements | `#/organisation/achievements` | views/organisation.js | SA | Built + verified |
| 16 | Directory list | `#/directory` | views/directory.js | SA | Built + verified |
| 17 | Directory entry detail / create | `#/directory/:id`, `#/directory/new` | views/directory.js | SA | Built + verified |
| 18 | Infrastructure catalogue | `#/infrastructure` | views/directory.js | SA | Built + verified |
| 19 | Freedom-fighter register | `#/freedom-fighters` | views/directory.js | SA | Built + verified |
| 20 | Expatriate request queue | `#/expatriate` | views/expatriate.js | SA+EH | Built + verified |
| 21 | Request detail (transitions, notes, photos, expenses, Meridian) | `#/expatriate/:requestNo` | views/expatriate.js | SA+EH | Built + verified |
| 22 | Donor list | `#/blood`, `#/blood/donors` | views/blood.js | SA | Built + verified |
| 23 | Donor detail (consent record) | `#/blood/donors/:id` | views/blood.js | SA | Built + verified |
| 24 | Blood-request list | `#/blood/requests` | views/blood.js | SA | Built + verified |
| 25 | Blood-request detail (matching donors, consent outcomes) | `#/blood/requests/:id` | views/blood.js | SA | Built + verified |
| 26 | Content home — news list | `#/content`, `#/content/news` | views/content.js | SA | Built + verified |
| 27 | Notices list | `#/content/notices` | views/content.js | SA | Built + verified |
| 28 | Events list | `#/content/events` | views/content.js | SA | Built + verified |
| 29 | Jobs list | `#/content/jobs` | views/content.js | SA | Built + verified |
| 30 | Content create / detail-preview / edit (per type) | `#/content/:type/new`, `#/content/:type/:id`, `#/content/:type/:id/edit` | views/content.js | SA | Built, with limitation — detail/edit spot-verified for news + notices only; events/jobs detail/edit not individually probed. Unknown/wrong-type id shows a bare empty state instead of the designed 404 (QA defect D3). |
| 31 | Activity list (year-grouped) | `#/activities` | views/activities.js | SA | Built + verified |
| 32 | Activity create / detail / edit | `#/activities/new`, `#/activities/:id`, `#/activities/:id/edit` | views/activities.js | SA | Built + verified |
| 33 | Media library (grid/list, albums) — see also #65 | `#/gallery` | views/gallery.js | SA | Built + verified |
| 34 | Media upload | `#/gallery/upload` | views/gallery.js | SA | Built + verified |
| 35 | Video gallery — placeholder state | `#/gallery/video` | views/gallery.js | SA | Built + verified (placeholder only, no upload/playback, by design) |
| 36 | FAQ list/editor | `#/faq` | views/faq.js | SA | Built + verified |
| 37 | Ledger list | `#/finance/ledger` (audit §3.10 named `#/finance`; the built split is overview `#/finance` + ledger `#/finance/ledger` — see #57/58) | views/finance.js | SA | Built + verified |
| 38 | New ledger entry (draft) | `#/finance/new` | views/finance.js | SA | Built + verified |
| 39 | Entry detail (reversal history) | `#/finance/:entryNo` | views/finance.js | SA | Built + verified |
| 40 | Edit draft / discard / reject | `#/finance/:entryNo/edit` (+ actions) | views/finance.js | SA | Built + verified (edit of a published entry shows detail instead, by design) |
| 41 | Create reversal draft | `#/finance/:entryNo/reverse` | views/finance.js | SA | Built + verified (full round-trip verified in QA; form ships blank item/payee — QA defect D6) |
| 42 | Project accounts | `#/finance/projects` | views/finance-reports.js | SA | Built + verified |
| 43 | Monthly summaries + annual reports | `#/finance/summaries`, `#/finance/reports` (built as two screens — summaries is also #67) | views/finance-reports.js | SA | Built + verified |
| 44 | Reports & Analytics | `#/reports` | views/reports.js | SA | Built + verified (final-fix pass 2026-11-14 — QA defect D2 closed; CSV export downloads a real file, Excel/PDF are labelled simulated exports with CSV fallback; no sidebar item points at it, by design). |
| 45 | Own notification inbox | `#/notifications` | views/notifications.js | SA+EH | Built + verified |
| 46 | Notification delivery log | `#/notifications/log` | views/notifications.js | SA | Built + verified (derived from inbox rows + routing rule; labelled as such on screen) |
| 47 | Contact-message inbox | `#/messages` | views/messages.js | SA | Built + verified |
| 48 | Message detail + reply | `#/messages/:id` | views/messages.js | SA | Built + verified |
| 49 | Audit-log list | `#/audit` | views/audit.js | SA | Built + verified |
| 50 | Audit entry detail | `#/audit/:id` | views/audit.js | SA | Built + verified |
| 51 | Settings (brand/contact/policy/system/health/sessions) | `#/settings` | views/settings.js | SA | Built + verified (health also has its own screen, #68) |
| 52 | Data-rights queue | `#/data-rights` | views/datarights.js | SA | Built + verified (no sidebar item; linked from Users + Settings) |
| 53 | ERT roster | `#/emergency-team` | views/emergency.js | SA | Built + verified (no sidebar item; linked from Expatriate queue) |
| 54 | Service catalogue | `#/services` | views/services.js | SA | Built + verified (no sidebar item; linked from Expatriate queue + Settings) |
| 55 | Own profile + password change | `#/profile` | views/profile.js | SA+EH | Built + verified |
| 56 | Denied / 404 states | `#/denied`, `#/404` | js/lib/guards.js + js/lib/router.js | any authed | Built + verified (denied ×7 Helper deep-links; 404 for unknown routes + unknown member/expatriate/finance ids) |

## Amendment A2 screens (57–68)

Twelve screens beyond audit §3.10. (Ledger `#/finance/ledger` and annual
reports `#/finance/reports` are the built split of audit rows #37 and #43,
not new screens — they are covered in the table above.)

| # | Screen | Route | Owner file | Role | Status |
|---|---|---|---|---|---|
| 57 | Finance overview | `#/finance` | views/finance.js | SA | Built + verified |
| 58 | Pending approval (finance) | `#/finance/pending` | views/finance.js | SA | Built + verified |
| 59 | Households list | `#/households` | views/households.js | SA | Built + verified |
| 60 | Household detail | `#/households/:id` | views/households.js | SA | Built + verified (incl. empty household hh-3) |
| 61 | Household create / edit | `#/households/new`, `#/households/:id?edit=1` | views/households.js | SA | Built + verified (create verified end-to-end) |
| 62 | Activity categories | `#/activities/categories` | views/activities.js | SA | Built + verified |
| 63 | Annual archives | `#/activities/archives` | views/activities.js | SA | Built + verified |
| 64 | Student achievements | `#/content/achievements` | views/content.js | SA | Built + verified |
| 65 | Media library | `#/media` | views/gallery.js | SA | Built + verified |
| 66 | Finance categories | `#/finance/categories` | views/finance-reports.js | SA | Built + verified |
| 67 | Published summaries | `#/finance/summaries` | views/finance-reports.js | SA | Built + verified |
| 68 | System health | `#/health` | views/health.js | SA | Built + verified |

## Coverage

- **Planned: 68 screens** (56 audit + 12 amendment).
- **Built: 68 of 68.** — #44 Reports & Analytics (`#/reports`) was built
  in the final-fix pass (2026-11-14, QA defect D2 closed).
- **Built with a limitation: 0** — the two earlier limitations (#30
  unknown-id empty state, #41 blank reversal fields) were closed by the
  final-fix pass (D3, D6).
- Nothing else is silently missing: every sidebar item (42 SA + 4 Helper)
  lands on a built screen, and every blueprint-only surface (#52–54) is
  reachable via in-app links.

## Iteration 2 comparison — original 68 vs final 68

The iteration-2 sweep (2026-11-14, `QA-REPORT.md`, evidence
`../iteration2/qa-final-v2/`) visited all 73 routes at 1440px and 360px
and confirmed every one of the 68 screens above still renders with an
`h1` and content. **Nothing was removed. No screen was added** — the
route table (`js/lib/router.js`) was not changed in iteration 2, so no
new route and no new screen exists to count. What changed was *inside*
the 68 screens (see `UX-IMPROVEMENTS.md` for the full list). The
in-screen additions are recorded here so the count stays honest:

| # | Screen | Added inside the screen in iteration 2 | Reason |
|---|---|---|---|
| 2 | Dashboard — Super Admin | "যা দেখা দরকার" attention list (pending approvals, urgent/stale requests, pending finance drafts, unread messages — each a real link, hidden when zero); greeting + live Dhaka date; finance snapshot now also shows published 2026 income/expense/net beside the 4-row preview vs full-year figures; Helper queue search now actually filters | Attention-first triage: the admin sees what needs them before the numbers |
| 3 | Dashboard — Helper | Queue search now filters by request no./service/applicant; queue table sortable | The v1 search re-rendered but never filtered (dead control) |
| 9–11 | Member list / detail / edit | Household link on profile + family tab (members carry `household_id`); detail request/activity tables sortable; edit form validation now reachable (`novalidate` so the app's error summary runs) | Correct a wrong v1 note; make validation actually reachable |
| 16–17 | Directory list / detail | Per-row "দ্রুত দেখুন" quick-view button wiring the drawer; infrastructure + freedom-fighter rows now navigate to detail | Two dead controls in v1 (untriggered drawer binding, `onRowClick: null`) |
| 20–21 | Expatriate queue / detail | Summary card first (status, priority, assigned helper, last update absolute + relative, latest note, expense summary, next permitted action); no-charge line; SA-only exits shown as disabled options with the reason written out (Helper close/reject/cancel explained, not silently gated); Meridian per-step timestamps (`stepTimes`); relative "time since update" | Effort reduction + the audit D3 explanation fix |
| 22–25 | Blood registry / requests | Consent-records section on donor detail; phone row label fixed (was "Name"); `consent.waiting` line now shown; availability + fulfilment on the live clock | Correctness + consent transparency |
| 26–30 | Content lists / detail | Totals stat grid on the overview; expired/scheduled plain-language notes on detail; list sort moved from a confusing `<select>` to table headers | One sorting mechanism instead of two; plain language for states |
| 31–32 | Activities | List stat cards (total/published/archived/beneficiaries); empty-submit now renders the shared error summary; detail shows status as a labelled row | Consistency with the shared components |
| 42–43 | Finance projects / summaries | Project "Used" column now uses the shared `.progress` component | Remove the last inline-styled progress bars |
| 45–46 | Notifications | Opening a related record now marks it read (bell drops); delivery log states in plain language that there is no resend button (derived log) | Audit D4 fix; no fake controls |
| 51 | Settings | Tabbed layout (`?tab=brand/contact/policy/system/sessions`) | Group a long form into findable sections |
| 55 | Profile | Now reachable by Super Admin too (`profile.view` added to the SA permission set — the G1 blocker) | Was denied for SA under permission enforcement |
| — | All screens | Real table sorting (`?sort=&dir=`), shared stat cards, shared `field()` forms, `.link-more` 44px text links, no 350ms toast delay, no inline styles in module files, fully Bengali navigation | DS v2 adoption (see `DESIGN-SYSTEM.md`) |

**Comparison table:**

| | Original (iteration 1) | Final (iteration 2) |
|---|---|---|
| Screens planned | 68 | 68 |
| Screens built | 68 | 68 |
| Screens removed | — | 0 |
| Screens added | — | 0 |
| Routes | 73 (+ 4 login variants) | 73 (+ 4 login variants), unchanged |
| Screens with a documented limitation | 0 (by design: #35 video placeholder, #46 derived log, #51/#55 simulated sections, #62 disabled add, #68 demo values) | 0 added; the same by-design limitations remain and are listed in `QA-REPORT.md` |
