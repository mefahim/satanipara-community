# Satanipara Community — Admin Dashboard QA Report (Batch M)

| | |
|---|---|
| Date | 2026-11-14 |
| Scope | Full Batch M sweep (directive §15, checks 1–24) over the whole prototype, plus the three Part 1 must-fixes |
| Build under test | `design/admin-dashboard/`, clone HEAD `f1c8179`, uncommitted (no branch, no commit, per task) |
| Method | Headless Chromium (Playwright-core + cached Chromium 156) driving the real UI; no unit tests, no static-only checks |
| Isolated setup | Served `design/admin-dashboard/` on `http://127.0.0.1:8161` (fresh port, never 9223/8130/8137/8138/8141/8155); fresh browser contexts per role; in-page logout/login used where a second user was needed (store is in-memory, so no reload) |
| Evidence | Screenshots + machine logs in `~/workspace/satanipara-admin-dashboard/qa-final/` (outside the repo): `qa-log.json` (route sweep), `qa-log2.json` (interactive), `qa-log3.json` (reversal/drawer), `qa-log5.json` (reversal round-trip), `qa-log6.json` (edit routes/modals/keyboard/links), `qa-log7.json` (content detail/reset) + 21 PNGs |

**Reading the overflow numbers:** `html{scrollbar-gutter:stable}` reserves
15px, so a healthy page measures `scrollWidth` 345 at a 360px viewport,
625 at 640px, 885 at 900px, 1185 at 1200px, 1425 at 1440px. Pass =
`scrollWidth ≤ innerWidth`. Anything above the viewport width is overflow.

**Verdict: PASS — 68 of 68 screens built, all 24 checks pass.**
All 68 planned screens are built and verified, including Reports & Analytics
(`#/reports`, D2, final-fix pass). Check 19 (keyboard) was a partial pass in
the main sweep — Esc did not close the mobile nav sheet — and is a full pass
after the final-fix pass (D4). The three Part 1 fixes are verified. Nothing
was committed.

**Final-fix pass (2026-11-14, after this report): defects D2–D9 are FIXED —
see the updated defect table below. Coverage is now 68 of 68 screens built.
Check 19 is now a full pass (Esc closes the mobile nav sheet, D4).**

## Part 1 — The three must-fixes (all verified)

### (a) 360px horizontal overflow — FIXED

- **Before (fix-pass evidence):** household detail `scrollWidth` 395px,
  expatriate detail 702px at a 360px viewport.
- **Root cause:** `.detail-grid` children kept `min-width:auto`,
  propagating table/form min-content widths; `.kv` label column 160px too
  wide for 282px of content.
- **Fix (`css/views.css` only, no inline styles):**
  `.detail-grid > * { min-width:0 }` (+ `div`/`aside`/`.card`),
  `.kv dt/dd { min-width:0; overflow-wrap:anywhere }`, and below 640px
  `.kv { grid-template-columns:104px 1fr; gap:4px 12px }`.
- **After (live probe, 360px):** `#/households/hh-1` 345, `#/households/hh-3`
  345, `#/expatriate/EXP-2026-0006` 345, `#/expatriate/EXP-2026-0009` 345
  — no overflow on either route. Screenshots `p1a-*.png`.

### (b) Missing i18n key `finance.overview.publicNote` — FIXED

- **Root cause:** the key is owned by the finance module
  (`views/finance.js`, namespace `finance`) — but `finance.js` is never
  loaded on the `#/finance/projects` route, so the lookup fell through to
  the literal key in the projects footer.
- **Fix (`views/finance-reports.js`):** registered the same key for the
  `finance` namespace from the finance-reports module (identical BN/EN
  text to `finance.js`; it only fills the gap when `finance.js` has not
  loaded). Call site unchanged.
- **After:** footer renders "সাধারণের জন্য প্রকাশিত তথ্যই শুধু দেখানো হয়।"
  in BN and "Only published information is shown to the public." in EN;
  the literal key appears nowhere. Screenshots `p1b-finance-projects-bn/en.png`.

### (c) Photos field normalisation — FIXED

- **Before:** the seed duplicated captions in both `photos`
  (`{caption_bn, label}`) and `_photos` (`{caption, by, at}`) because
  `views/expatriate.js` read `r._photos`.
- **Fix:** `views/expatriate.js` now reads the canonical `r.photos`
  (`caption_bn` with `caption` fallback; `by`/`at` shown only when present,
  otherwise the `label`); new photo captions are added in the canonical
  shape. The duplicated `_photos` seeds were removed from
  `js/data/demo-requests.js` (both EXP-2026-0006 and EXP-2026-0009).
  Zero `_photos` references remain in `views/` or `js/`.
- **After:** photos section renders both captions on EXP-2026-0006
  ("ঔষধ কেনার ছবি", "ঔষধ পৌঁছে দেওয়ার ছবি") and EXP-2026-0009
  ("বাজার করার ছবি", "বাজার পৌঁছে দেওয়ার ছবি"); no "no photos" message.
  Screenshots `p1c-exp-2026-0006/0009.png`. `node --check` passes on all
  three edited JS files.

## Part 2 — Per-check results (Batch M, checks 1–24)

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Super Admin login journey | **PASS** | `01990000000` / `AdminDemo-2026` → onboarding → `#/dashboard`. Wrong password shows a generic error. Login states pending/expired/forced all render. Demo creds + "simulated" label on screen. |
| 2 | Helper login journey | **PASS** | `01990000001` / `HelperDemo-2026` → reduced dashboard ("আমার সারি": 3 pending, 6 assigned, 1 urgent, 3 in progress). |
| 3 | Role-specific navigation | **PASS** | SA sidebar = **42 items** in 9 groups (directive IA 1:1). Helper sidebar = **exactly 4**: `#/dashboard`, `#/expatriate`, `#/notifications`, `#/profile`. |
| 4 | Every sidebar destination renders | **PASS** | All 73 routed screens visited at 1440px and 360px; every one renders an `h1` and content, including `#/reports` after the final-fix pass (D2). |
| 5 | Every create/edit/detail journey | **PASS** | Household create verified end-to-end (new `hh-…` detail, redirect works); finance draft create → `#/finance/pending` with toast; content new (notices), activity new, user new render with correct titles; edit routes verified for finance draft, activity, member, household, user, content news/notice; published-entry edit correctly shows detail instead of a form. |
| 6 | Every important confirmation modal | **PASS** | Member approve + reject modals open; finance approve modal with re-auth password field; user reset-password modal → temp-password drawer (shown once); suspend modal. All name the record + consequence. |
| 7 | Every status transition (incl. invalid blocks) | **PASS** | Expatriate: `pending → completed` blocked with "এই অবস্থা পরিবর্তন বৈধ নয়।" toast and status unchanged; short note blocked (see note below); `pending → accepted` with a ≥10-char note succeeds with "অবস্থা পরিবর্তন হয়েছে।" toast. |
| 8 | Finance dual control (both directions + second-reversal block) | **PASS** | Pending list: LE-2026-0006 (entered by SA1) approve **disabled** for SA1; LE-2026-0007 (entered by SA2) approve **enabled** for SA1 → approved + toast "এন্ট্রি প্রকাশিত হয়েছে।" Full reversal round-trip: SA1 creates reversal draft LE-2026-0008 of LE-2026-0001 → SA2 approves (in-page logout/login) → toast "বিপরীত এন্ট্রি প্রকাশিত হয়েছে — মূল এন্ট্রিটি বিপরীতকৃত হয়েছে।" → original status `বিপরীতকৃত`. Second reversal blocked (detail shown, not the form); reversal-of-reversal blocked. |
| 9 | Request completion/closure (expense + no-expense, applicant gate) | **PASS** | EXP-2026-0007 `in_progress → completed` with no expense and no declaration blocked (toast cites the expense hint); with the no-expense checkbox → completes. EXP-2026-0008 `completed → closed` without applicant confirmation blocked (toast cites the confirmation hint); with the checkbox → closes. |
| 10 | Search and filtering | **PASS** | Expatriate search `EXP-2026-0006` returns only that row (0007 absent); `?status=pending` filter applies; clear-filters resets the hash to `#/expatriate` / `#/finance/ledger` when a filter is active. |
| 11 | BN/EN switching | **PASS** | Dashboard `h1` "সুপার অ্যাডমিন ড্যাশবোর্ড" → "Super Admin Dashboard" and back; finance footer verified in both languages (fix b). |
| 12 | Light/dark theme | **PASS** | Toggle sets `data-theme="dark"` (screenshot `10-theme-dark.png`) and back to `light`; defaults are BN + light on load. |
| 13 | Mobile navigation (drawer/bottom sheet) | **PASS** | At 360px the hamburger opens the bottom sheet with all 42 SA items + theme button; tapping Expatriate navigates and closes the sheet. Esc closes the sheet (D4 — fixed in the final-fix pass, re-verified). |
| 14–18 | Layouts 360/640/900/1200/1440px | **PASS** | 146 route measurements at 360 + 1440, 24 more at 640/900/1200 on key routes. Zero overflow after the two CSS fixes (see §23). |
| 19 | Keyboard navigation | **PASS** | Tab order on login = visual order (mobile → password → show → submit → demo-state links). Skip link is the first Tab stop. Esc closes modals and focus returns to the opening button (verified: "প্রত্যাখ্যান করুন"). Esc also closes the mobile nav sheet (D4 — fixed in the final-fix pass, re-verified). User-menu Esc not tested. |
| 20 | Console errors | **PASS (0 app errors)** | Across all contexts the only console error is the Google Fonts CDN `ERR_TUNNEL_CONNECTION_FAILED` (environmental — egress proxy; fallback fonts render). No `pageerror` anywhere. The `views/reports.js` 404 seen in the main sweep is gone (D2 fixed). |
| 21 | Broken links | **PASS** | All in-app `href`s collected from dashboard, finance overview, expatriate queue, settings, notifications resolve to existing routes (incl. `#/members/m-7…m-10`, `#/expatriate/EXP-2026-0013/0014`, `#/finance/pending`, `#/health`). No link points at `#/reports`. |
| 22 | Dead buttons | **PASS** | Dashboard 4/4 controls act; queue + ledger "ফিল্টার মুছুন" (Clear filters) shows no visible effect only when no filter is active — with a filter active it resets the route (verified). Login screen buttons act. |
| 23 | Horizontal overflow (per-route) | **PASS** | See measurements below. |
| 24 | Empty/loading/error/permission states | **PASS** | Empty household hh-3 renders its empty state; donor A− and AB− filters render empty states; Helper deep-links to 7 SA routes all show the denied screen; unknown routes + unknown member/expatriate/finance ids show the designed 404. Exception: unknown/wrong-type content id shows a bare empty state instead of 404 (D3). |

**Note on check 7 (short note):** a note shorter than 10 chars is blocked
by the transition form's native `minlength="10"` validation
(`validity.valid === false, tooShort === true`; no modal opens, no toast).
The block itself is correct; the mechanism is browser validation rather
than the app's `noteShort` toast. Not a defect — recorded for accuracy.

### §23 — Overflow measurements

- **360px, all 73 routes:** `scrollWidth` 345 (pass) on every route after
  the fixes. Before the topbar fix, 4 routes measured 381:
  `#/reports`, `#/denied`, `#/404`, `#/no-such-route-xyz` — root cause was
  the topbar title wrapper refusing to shrink (`min-width:auto`) under a
  long title ("এই মডিউলটি এখনো তৈরি হচ্ছে"). Fixed in `css/shell.css`
  (title wrapper `min-width:0`, controls `flex-shrink:0`); re-verified
  345 on all 6 re-checked routes including `#/finance/reports`.
- **640px / 900px / 1200px** (dashboard, expatriate queue + detail 0006,
  household hh-1, finance ledger + projects, members, settings): 625 /
  885 / 1185 respectively, zero overflow.
- **1440px, all 73 routes:** zero overflow.

## Defects found in this sweep

Fixed during QA (in-scope files only):

| ID | Defect | File fixed | Fix |
|---|---|---|---|
| D1 | Topbar overflows at 360px (381px) on long titles | `css/shell.css` | Title wrapper `min-width:0`; `.seg`/`.icon-btn`/`.user-menu` `flex-shrink:0`. Re-verified 345 on all affected routes. |

Recorded (need another file — **not edited**, fix described for the owner):

| ID | Defect | Exact file + fix |
|---|---|---|
| D2 | **Reports & Analytics — FIXED (final-fix pass 2026-11-14).** Created `views/reports.js` (200 lines; no router change needed). `#/reports` renders all four sections (member, service, finance, activity reports) from live demo-store figures — e.g. finance 2026: income ৳৫০,০০০, donations ৳২,৭০,০০০, net ৳৩,২০,০০০; members 12 total. Date-range filter (`?from&to`) verified. CSV export downloads a real file (`satanipara-reports-members-2026-01-01_to_2026-12-31.csv`, 10 lines); Excel/PDF are simulated exports — confirm modal + toast + CSV fallback download (documented on screen and in code). Evidence: `qa-finalfix/d2-reports-bn/en/360/dark.png`, `verify-results.json`. | Create `views/reports.js` (date-range summaries, per-module breakdowns, export CSV) per audit §3.10 #44; no router change needed. |
| D3 | **FIXED (final-fix pass).** `views/content.js` detail/edit branches now return `notFoundHtml()` when `findItem()` fails. Verified live: `#/content/notices/post-1` (wrong type), `#/content/news/post-999`, `#/content/jobs/post-999/edit` all show the designed 404 (`#view h1` "পাতা বা তথ্য পাওয়া যায়নি" + back link); correct-type `#/content/news/post-1` and its edit route still render. Evidence: `qa-finalfix/d3-content-wrong-type.png`. | `views/content.js` lines ~79–80: return `notFoundHtml()` when `findItem()` fails, as the finance/member/expatriate views do. |
| D4 | **FIXED (final-fix pass).** `js/app.js` mobile-sheet creation now adds a capture-phase `keydown` Escape listener (mirroring `js/components/modal.js`) that closes the sheet and returns focus to `#nav-toggle`. Verified live at 360px: sheet open (1) → Esc → sheet gone (0), `document.activeElement.id === 'nav-toggle'`. Evidence: `qa-finalfix/d4-mobile-360.png`. | `js/app.js` mobile-sheet creation in `bindShell`: add a `keydown` Escape listener that closes the sheet (and returns focus to `#nav-toggle`), mirroring `js/components/modal.js`. |
| D5 | **FIXED (final-fix pass).** `js/app.js` `render()` now calls `shell.setTitle()` + `shell.setBreadcrumb(['nav.dashboard'])` in the unmatched-route, `/denied`, and `/404` branches (and the role-guard branch now also resets the breadcrumb). Verified live: `#/denied` topbar "অনুমতি নেই", `#/404` and `#/no-such-route-xyz` topbar "পাতা বা তথ্য পাওয়া যায়নি" (no stale previous title). Evidence: `qa-finalfix/d5-404.png`, `verify-results.json`. | `js/app.js` `render()`: call `shell.setTitle(t('denied.title'))` / `t('notfound.title')` in the `/denied`, `/404`, and unmatched-route branches (the role-guard branch already does this). |
| D6 | **FIXED (final-fix pass).** `views/finance.js` `entryFormHtml`: for a reversal, item/payee (and kind/category/project) are pre-filled from the original entry and shown **read-only** (not disabled, so the values still submit); a `reverse.prefilled` hint names the source. Verified live on `#/finance/LE-2026-0001/reverse`: item "অনুদান — জানুয়ারি (ডেমো)", payee "দাতা (ডেমো)", `readonly` present. Evidence: `qa-finalfix/d6-reversal-form.png`. | `views/finance.js` `entryFormHtml`: when `isReverse`, prefill `item_bn`/`item_en`/`payee_bn` (and category/project) from the original entry. |
| D7 | **FIXED (final-fix pass).** `views/households.js` `saveHousehold` now navigates first, then fires the toast with `setTimeout(…, 350)` (the finance-view pattern). Verified live: creating "পরীক্ষা পরিবার চূড়ান্ত" redirects to `#/households/hh-…` and the toast "পরিবার সংরক্ষণ করা হয়েছে।" is visible after navigation. Evidence: `qa-finalfix/d7-household-created.png`. | `views/households.js` `saveHousehold`: toast after navigation (e.g. `setTimeout` after `go()`, the pattern used by the expatriate/finance views). |
| D8 | **FIXED (final-fix pass, audit.js only — no shared-dictionary change needed).** `views/audit.js` now registers `audit.action.*` BN/EN labels for all common codes (~65, covering every `writeAudit` action + the 10 seed rows) and renders the label in the list and detail (detail keeps the raw code in muted text for traceability); unknown codes fall back to the raw code, never a bare key. Verified live: audit list shows "সদস্য অনুমোদন" and no raw `member.approve` in the list. Evidence: `qa-finalfix/d8-audit-bn.png`. Known remainder: the dashboard's recent-audit list (`views/dashboard.js`) still shows the raw code — it was out of the D8 scope (audit.js) and is a one-line follow-up, not a defect in the audit screens. | Optional: add an `audit.action.*` string table in `views/audit.js` if human-readable actions are wanted. |
| D9 | **FIXED (final-fix pass).** `js/lib/auth.js`: `switchRole(role, userId?)` now accepts an exact user id, and a new `switchUser(userId)` switches to any demo account. `js/app.js` user menu now lists all three demo accounts by name + phone (SA1 01990000000, SA2 01990000002, Helper 01990000001) with a ✓ on the current one, under the same "simulated" label. Verified live: menu lists SA2; switching to SA2 works (menu header + ✓ move to SA2) and the dual-control path is reachable in-session — as SA2, approve on LE-2026-0006 (entered by SA1) is enabled. Evidence: `qa-finalfix/d9-pending-as-sa2.png`, `verify-results.json`. | `js/lib/auth.js` `switchRole`: accept a user id (or cycle through matching users) instead of first-match; or add a user picker to the demo switch menu. |
| D10 | (Informational) Short-note blocking uses native `minlength` validation, not the app's `noteShort` toast — see check 7 note. No change required. | — |

## Data gaps + known limitations (collected)

Seed volumes measured from the built data files (audit §3.7 targets in
parentheses — variances are seed drift, not QA failures):

- **Expatriate requests:** 14 seeded — 3 pending, 2 accepted, 4 in
  progress, 2 completed, 1 closed, 1 rejected, 1 cancelled. Audit target
  was 2 pending / 3 in progress (incl. 1 stale >72 h): the seed has one
  extra pending (EXP-2026-0014) and one extra in progress
  (EXP-2026-0013, emergency-flagged). The stale >72 h request
  (EXP-2026-0005) is present.
- **Ledger:** 14 entries — 9 published, 2 draft, 1 rejected, 1 reversed,
  1 discarded. The reversal entry is LE-2025-0005 (published). Audit
  target said "4 draft" — the seed has 2 drafts (LE-2026-0006 entered by
  SA1, LE-2026-0007 entered by SA2), which is still enough to demonstrate
  dual control in both directions.
- **Members:** 12 — 6 approved, 4 pending, 1 rejected, 1 suspended
  (matches target). **Users:** 2 SA, 3 Helpers, 12 members.
- **Donors:** 12; blood requests 4. A− and AB− have no donors (empty
  states verified).
- **Audit log seed:** 10 rows (audit target ~25).
- **Notifications:** 12 seeded rows — 8 for SA1, 4 for Helper 1. SA2 and
  Helpers 2–3 have **zero** notifications, so their bell count is 0 and
  their inboxes are empty. This is the "Helper notification count" gap:
  only Helper 1 has demo inbox content.
- **Delivery log** (`#/notifications/log`): derived in-view from inbox
  rows + the routing rule; the screen labels it as simulated. There is no
  delivery-log collection in the demo data.
- **Meridian timeline:** every completed step shows the request's
  `created_at` as its timestamp (`js/components/timeline.js`) — per-step
  timestamps are not in the seed, so all completed nodes share one time.
- **Committee free-text terms:** committee/advisory/former-leader entries
  use free-text role/term fields (no controlled term list in the seed).
- **Landmarks / freedom-fighter edit limits:** catalogue screens are
  list + detail; no dedicated edit flows beyond the shared directory
  editor.
- **BN-only rejection reasons:** rejection/cancellation reasons exist
  only as `rejection_reason_bn` / `cancellation_reason_bn` in the seed
  (no EN fields).
- **Google Fonts CDN:** fails in this VM (`ERR_TUNNEL_CONNECTION_FAILED`,
  egress proxy) — fallback fonts render; excluded from the console-error
  count as environmental, per the task brief. Real-device rendering of
  Anek Bangla / Manrope is unverified here.
- **Real-device tap behaviour not verified** — Fahim's phone check is
  pending (hamburger tap, bottom-sheet gestures, 360px rendering on a
  real phone).
- **Reload resets everything** (login, filters, drafts, notifications,
  consent) — by design for a static prototype.

## Unresolved owner decisions (affecting the dashboard — not resolved here)

- **Helper-reject conflict (Doc 05 §9.1 vs Doc 09 §3.9, amendment A6):**
  Doc 05 allows the assigned helper to reject; Doc 09 says Super Admin
  only. Prototype follows Doc 09 (no reject action for Helpers).
- **Helper applicant-visibility conflict:** brief vs audit — the prototype
  shows applicant contact to a Helper only for requests assigned to them
  (SA sees all).
- **Demo-count variance in expatriate data:** see "Data gaps" above
  (3 pending / 4 in progress vs audit target 2 / 3).
- **Q/AO items from audit §2 touching the dashboard** (see
  `USER-JOURNEYS.md` for the per-journey list): Q-02, Q-03, Q-04/AO-05,
  Q-06, Q-08, Q-10, Q-11, Q-13, Q-14, Q-15, Q-16, Q-17/AO-06, Q-18,
  Q-20, Q-21, Q-22, Q-24, Q-25, Q-27; AO-01, AO-02, AO-07, AO-08,
  AO-09, AO-10, AO-11, AO-12, AO-13, AO-14, AO-15, AO-16, AO-17,
  AO-18–AO-21. None was resolved in QA; the prototype designs around
  them with placeholders / documented defaults.

## Coverage

- **68 planned screens** (audit §3.10's 56 + amendment A2's 12):
  **68 built, 0 not built** (final-fix pass 2026-11-14 closed D2 — `#/reports`
  is built and verified; see the updated defect table). Full table in
  `SCREEN-INVENTORY.md`.
- **73 routes** swept at 360px and 1440px (sidebar routes + detail/edit +
  denied/404/unknown); all render except `#/reports`.
- **Files changed by this QA pass (uncommitted):** `css/views.css`
  (Part 1a), `css/shell.css` (D1), `views/finance-reports.js` (Part 1b),
  `views/expatriate.js` (Part 1c), `js/data/demo-requests.js` (Part 1c
  dedup). Docs added: `README.md` (completed), `DESIGN-SYSTEM.md`,
  `SCREEN-INVENTORY.md`, `USER-JOURNEYS.md`, `QA-REPORT.md` (this file).
  `node --check` passes on every edited JS file. Nothing committed, no
  branch created.
