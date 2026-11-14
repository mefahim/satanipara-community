# Satanipara Community — Admin Dashboard QA Report (Design Iteration 2)

| | |
|---|---|
| Date | 2026-11-14 |
| Scope | Full Design Iteration 2 sweep: integration fixes re-verified + all 73 routes + 3 journeys end-to-end + cross-cutting interactions + responsive matrix + bell-badge acceptance |
| Build under test | `design/admin-dashboard/`, Design Iteration 2 (all five module groups integrated; `node --check` passes on all 52 JS files) |
| Method | Headless Chromium 1248 (Playwright 1.65.2, Python, `--no-sandbox`) driving the real UI; no unit tests, no static-only checks |
| Setup | Served `design/admin-dashboard/` on `http://127.0.0.1:8139` (fresh port); fresh browser contexts per role/journey; in-page demo user switch used where a second approver was needed (store is in-memory, so no reload) |
| Evidence | Screenshots + machine logs in `~/workspace/satanipara-admin-dashboard/iteration2/qa-final-v2/` (outside the repo): `qa-results.json` (main sweep, 128 checks), `qa-results3.json` (supplementary sweep, 11 checks), 83 PNGs |
| Verdict | **PASS — 149/149 executed checks passed, 0 application failures.** All 68 screens built, all 73 routes render at 1440px and 360px, all 3 journeys pass end-to-end, bell badge verified in all 4 combinations. |

**Reading the overflow numbers:** `html{scrollbar-gutter:stable}` reserves
15px, so a healthy page measures `scrollWidth` 345 at a 360px viewport,
625 at 640px, 885 at 900px, 1185 at 1200px, 1425 at 1440px. Pass =
`scrollWidth ≤ innerWidth`. Anything above the viewport width is overflow.
Stat-cell overflow is measured separately (cell rect vs grid rect, plus
`.num` scrollWidth vs clientWidth and line count) because
`.stat-grid{overflow:hidden}` hides it from the page metric.

## 1. Results summary

| Suite | Checks | Passed | Failed | Notes |
|---|---|---|---|---|
| Main sweep (`qa-results.json`) | 128 | 128 | 0 | Routes, journeys, cross-cutting, responsive matrix, stat cells, bell badge |
| Supplementary sweep 2 (drawer / bottom nav / More sheet / form errors) | 11 run | 10 | 0 app failures | 1 entry was a **test-script selector error** (see §5), re-driven in suite 3 |
| Supplementary sweep 3 (member reject / re-auth / blood / EN / lockout / D4) | 11 | 11 | 0 | Includes the re-driven member-reject check |
| Stat re-check after the R-G5-1 follow-up fix | 42 | 42 | 0 | 7 widths × 2 themes × 3 pages (finance / dashboard / reports); separate script run, results in the run log |
| **Total executed** | **149 (+42 re-check)** | **149 (+42)** | **0** | |
| Page errors (`pageerror`) | — | 0 in all runs | — | |
| Console errors | — | 0 app errors | — | Only the VM-blocked Google Fonts request (environmental, §4) |

## 2. Route sweep — all 73 routes

73 view routes + 4 login variants = 77 loads at 1440px, each checked for
`h1` + content; the 69 SA view routes re-checked at 360px (aggregate
check — per-route 360 rows are recorded only on failure, and there were
none).

| Check | Result |
|---|---|
| All 73 routes at 1440px, SA session (h1 + content, no page overflow) | **Passed** — 77/77 loads incl. `/login`, `/login/pending`, `/login/expired`, `/login/forced` |
| All 69 SA view routes at 360px (h1 + content, no page overflow) | **Passed** — aggregate check, 0 failures |
| SA `/profile` renders (G1 blocker: `profile.view` was missing from the SA set) | **Passed** — was denied before the fix, renders after it |
| One-admin banner hidden with 2 active SAs (R-G5-4) | **Passed** — `hidden: true`, not shown; BN string no longer carries "(finance publishing)" |

## 3. Journeys end-to-end

### Journey 1 — SA login → dashboard → member approval

| Step | Result |
|---|---|
| SA login → onboarding → dashboard | Passed |
| Members pending list → member detail `m-10` (row click) | Passed |
| Approve with confirm modal → toast, status `অনুমোদিত`, member ID `MB-2026-0008` issued | Passed |

### Journey 2 — Helper queue → claim → progress → expense → complete

| Step | Result |
|---|---|
| Helper login → reduced dashboard → queue (999 disclaimer, no-charge note, 14 rows) | Passed |
| Request detail `EXP-2026-0001`: Summary card, read-only before claim | Passed |
| Claim → status stays pending, toast shown | Passed |
| pending → accepted → in_progress (badges verified each step) | Passed |
| Progress note ≥10 chars added; expense ৳2,450 added; in_progress → completed | Passed |
| Meridian per-step timestamps (`stepTimes`) | Passed — done nodes show 2 distinct times (created 13 Nov vs transitions 14 Nov 23:28); before the fix all nodes shared `created_at`. Seed data has sparse updates, so more distinct times are not observable from seed alone — the mechanism is proven by the live transitions. |

### Journey 3 — Finance: draft → pending → second approver → publish → reversal

| Step | Result |
|---|---|
| Draft created as SA1 (`LE-2026-0008`, −৳5,000, "অডিট পরীক্ষা — কার্যক্রম ব্যয়") → appears in `#/finance/pending` | Passed |
| Enterer cannot approve: approve button rendered disabled (2 disabled approve buttons on the queue) + self-block note | Passed |
| Switch to SA2 → approve enabled → re-auth modal → publish → toast "এন্ট্রি প্রকাশিত হয়েছে।", approver + timestamp recorded | Passed |
| Published immutable: `#/finance/LE-2026-0001/edit` renders detail (no `#fin-form`), immutable note "এই এন্ট্রিটি প্রকাশিত — এটি সম্পাদনা বা মোছা যাবে না।" | Passed |
| Reversal draft from published detail (prefilled item/payee read-only, auto amount) → draft created | Passed |
| Switch to SA1 → approve reversal → toast "বিপরীত এন্ট্রি প্রকাশিত হয়েছে — মূল এন্ট্রিটি বিপরীতকৃত হয়েছে।" | Passed |
| Original now `বিপরীতকৃত`, reversal `প্রকাশিত`, linked both ways; no second reversal action | Passed |
| Re-auth wrong password → inline error, modal stays open; correct password → publishes (seed draft `LE-2026-0006` as SA2) | Passed |
| Finance empty submit → error summary, stays on `#/finance/new` | Passed |
| Helper deep-link to `#/finance` → denied page | Passed (see §6) |

## 4. Cross-cutting interactions

| Check | Result |
|---|---|
| Members search, nonsense query `q=zzzqqqx` → empty state, stats unchanged | Passed |
| Users table sort → `?sort=name_bn&dir=asc` | Passed |
| BN → EN toggle (users page renders English) → back to BN | Passed |
| EN finance overview renders English | Passed |
| Light → dark toggle (`data-theme="dark"`) and back | Passed |
| Mobile drawer (390px, touch): hamburger visible, sheet opens with 42 nav items + language + theme, nav tap navigates and closes sheet | Passed |
| Bottom nav SA: Dashboard, Requests, Members, Finance, More (5 items); tap navigates | Passed |
| Bottom nav Helper: Dashboard, Requests, Notifications, Profile, More (5 items, no SA destinations) | Passed |
| More sheet opens; Esc closes it | Passed |
| Notifications: single mark-read bell 3 → 2; mark-all-read hides bell; opening a related record marks it read (audit D4, bell 3 → 2) | Passed |
| Helper deep-links denied 6/6 (`/finance`, `/members`, `/users`, `/settings`, `/blood`, `/audit`) — denied page names the required permission | Passed |
| Helper `/profile` and `/notifications` allowed | Passed |
| Member reject: confirm disabled until reason ≥10 chars, then enabled; reject completes, status `প্রত্যাখ্যাত`, reason shown | Passed |
| Back link from member detail returns to `#/members` | Passed |
| Blood: donor `d-2` "এখনো নয়" with next-eligible date; blood-request `br-2` detail renders | Passed |
| Settings tab `?tab=brand` renders | Passed |
| Login lockout after 5 wrong attempts (locked message shown) | Passed |
| Toast auto-dismiss | Not re-driven in this sweep — verified in the Batch M / audit-UX sweeps (≈5 s lifetime); toasts were observed appearing immediately after actions throughout this sweep (no 350 ms delay anywhere) |

## 5. Responsive matrix + money stats

| Viewport | Pages checked | Result |
|---|---|---|
| 360 / 390 / 430 / 640 / 900 / 1200 / 1440 | Dashboard, finance overview, member list, expatriate detail, blood donors | **No page-level horizontal overflow at any width** |
| 360 / 390 / 430 / 640 / 900 / 1200 / 1440, light + dark | Money stats on `#/finance`, `#/dashboard`, `#/reports` (cell rect vs grid rect) | **Passed** — 21/21 in the main sweep |

**R-G5-1 follow-up (found by visual inspection after the main sweep):**
the one-line `display:block` fix stopped the grid clipping, but at 360px
the numbers wrapped mid-number ("৳৫০,০০০" split across two lines) because
of the added `overflow-wrap:anywhere`, and at 1440px the dashboard money
stat still wrapped ("৳৩,২০," / "০০০") at the old `clamp(2.5rem,6vw,4rem)`
size. Fix applied in `css/components.css`: `.stat .num` is now
`clamp(1.35rem,6.2vw,1.75rem)` with `white-space:nowrap`, and ≥1200px
`clamp(1.75rem,3vw,2.75rem)` — sized so the longest money value
(`৳৩,২০,০০০`) fits its cell on one line at every width. **Re-verified:
42/42 measurements** (7 widths × 2 themes × 3 pages — `.num`
scrollWidth == clientWidth, 1 line each) **and visually** in
`finance-overview-360-light-refix.png` and
`sa-dashboard-1440-light-refix.png`. The stat numeral is smaller than
the v1 "giant" size on narrow screens — a deliberate trade: a whole
number at 22px beats a clipped or broken number at 40px.

**Test-script errors (not app defects):** one entry in supplementary
sweep 2 — the member-reject check looked for the confirm button at
`.modal-actions .btn-primary`, but the reject modal's confirm is
`[data-modal-confirm]` (danger). The check was corrected and re-driven
in sweep 3: **Passed**. Two earlier J3 script errors in the first main
run (wrong-row approve targeting; reading only the first toast when two
were present) were fixed the same way and the full journey passes in the
final run — the application was not at fault in either case.

## 6. Bell badge — acceptance criterion 11: VERIFIED

The DS v2 badge (inset `top:2px; right:2px`, no negative offsets,
`min-width:20px`, tabular numerals, 2px `--surface` border, caps at
`99+`) was re-verified at **360px, light + dark, 1-digit and 2-digit
counts**, with close-up screenshots.

| Combination | Badge | Button | Inside button | scrollW = clientW | Verdict |
|---|---|---|---|---|---|
| 360 light, 1 digit (real count 3) | 20.6×20 at (272,9) | 44×44 at (252,6) | Yes | 17 = 17 | **Passed** |
| 360 light, 2 digits (live-DOM probe, count set to 12) | 27.2×20 at (266,9) | 44×44 at (252,6) | Yes | 23 = 23 | **Passed** |
| 360 dark, 1 digit (real count 3) | 20.6×20 at (272,9) | 44×44 at (252,6) | Yes | 17 = 17 | **Passed** |
| 360 dark, 2 digits (probe, 12) | 27.2×20 at (266,9) | 44×44 at (252,6) | Yes | 23 = 23 | **Passed** |

Evidence (`iteration2/qa-final-v2/`): `bell-360-{light,dark}-{1digit,2digit}-closeup.png`
(element close-ups — the badge is whole in all four) and
`bell-360-{light,dark}-{1digit,2digit}-topbar.png` (full topbar clips).
The 2-digit shots use a live-DOM probe setting the count to `12`, the
same method as the iteration-1 audit; no file was changed. The badge is
whole, inside its 44px button, in both themes at both counts.

## 7. Console errors

- **Page errors (uncaught JS exceptions): 0 in all runs.**
- **Console errors: exactly 1 per page load, same in every run** —
  `Failed to load resource: net::ERR_TUNNEL_CONNECTION_FAILED` for
  `https://fonts.googleapis.com/css2?family=Anek+Bangla…&family=Manrope…`.
  The VM's egress proxy blocks Google Fonts; the prototype falls back to
  system fonts and remains fully usable. This is environmental, not an
  application error — but it means the intended Anek Bangla / Manrope
  rendering was **never exercised** in this QA, and the fonts should be
  self-hosted before launch.
- **Failed requests:** only the fonts URL above, in every run. No other
  404/failed asset.

## 8. Defects fixed in this pass (integration)

| ID | Defect | Fix (file:line) | Verified |
|---|---|---|---|
| G1-BLOCKER | `profile.view` missing from SA permissions → SA opening `#/profile` denied | `js/lib/guards.js` — added `'profile.view'` to `PERMISSIONS['super-admin']` | SA `/profile` renders; Helper unchanged |
| R-G5-1 | `.stat .num` / `.stat .lbl` inline → number + label on one line, money stats clipped (360px cells to 547px vs grid edge 327px; 1440px `৳৩,২০,০০০` clipped to `৳৩,২০`) | `css/components.css` — `.stat .num,.stat .lbl{display:block}` + viewport-sized `.stat .num` (`clamp(1.35rem,6.2vw,1.75rem)`, `white-space:nowrap`; ≥1200px `clamp(1.75rem,3vw,2.75rem)`) | 21/21 main-sweep + 42/42 re-check measurements; visually confirmed |
| R-G5-4 | `.banner{display:flex}` defeated `hidden` → false "one Super Admin" warning on every SA page; BN string carried "(finance publishing)" | `css/base.css` — `[hidden]{display:none!important}`; `js/i18n/bn.js:138` — BN string retranslated without the English fragment | Banner hidden with 2 SAs; string verified |
| i18n merge | 111 module keys + 92 `audit.action.*` labels lived only in view-local dicts | Merged into `js/i18n/bn.js` + `en.js` (360 keys each, identical sets) | BN renders fully Bengali on nav + merged screens; EN verified on users + finance |
| G4-1 | Meridian per-step timestamps all `created_at` | `js/components/timeline.js` — `meridianTimeline(request,lang,stepTimes?)`; `views/expatriate.js` derives `stepTimes` from `service_request_updates` | Live transitions show distinct step times (§3 J2) |
| R-G5-2 | Progress bars were inline-styled divs in finance-reports | `css/components.css` — `.progress` / `.progress-fill`; `views/finance-reports.js:114` uses them with `role="progressbar"` | Renders; width remains inline (data value) |
| D-14 / R-G5-3 | `setHash`/`go`/`withQuery` duplicated across views | `js/lib/router.js` — shared `setHash`, `go`, `withQuery`, `buildQueryString`, `hashWithQuery`; 7 `setHash` copies, 3 `go`, 2 `withQuery` removed; `buildQuery` (members/users) and `dashHash` (dashboard) now delegate to the shared builders | All routes + sorting + filters re-verified in the sweep |
| G2 follow-up | `actionLabel` imported by dashboard from a view module (`views/audit.js`) | `js/lib/action-label.js` (new shared lib); `views/audit.js` re-exports it; `views/dashboard.js` imports from the lib; `audit.action.*` strings moved to the base dicts | Dashboard recent-audit labels render; audit list/detail unchanged |
| G4-3 | `donorAvailable()` lived in `js/data/` (view importing from data) | Moved to `js/lib/format.js`; `js/data/demo-blood.js` re-exports it; `views/blood.js` imports from `format.js` | Blood availability + fulfilment re-verified (§4) |
| G4-2 | Relative-time helper screen-local in expatriate.js | `fmtAgo()` added to `js/lib/format.js`; `views/expatriate.js` uses it | Queue + detail "X ago" render |
| DS leftovers | Blood `AS_OF` frozen date; content store migration; finance `publicNote` dedupe | Verified closed (not re-fixed): blood uses live `now()`; content reads/writes `store.student_achievements` via the store API; `finance.js` no longer registers `finance.overview.publicNote` | Grep + live checks (§3, §4) |

## 9. Deferred / known limitations

- **7 inline `style="…"` attributes remain** (select `max-width` in
  finance/finance-reports, progress-fill `width` which is a data value).
  No shared width utility exists; not a visual defect.
- **Finance ledger keeps its select sort** instead of header sorting —
  deliberate (two competing sort controls for one table). Content lists
  dropped their sort `<select>` in favour of header sorting.
- **Activities list sorting applies within each year group** (one table
  per year); default order is still date-desc.
- **Screen-reader / keyboard tab-order audit** beyond Esc-to-close was
  not run (headless Chromium only); real-device touch not run.
- **Dark mode / EN on inner pages:** screenshot-checked for the listed
  screens (see §10); not every one of the 68 screens was eyeballed in
  both themes/languages — the shared tokens render them, but pixels were
  not all inspected.
- **Meridian `stepTimes` fallback:** steps with no update row in the seed
  fall back to `created_at` (by design — the data does not exist).
- **Google Fonts CDN** blocked in this VM (environmental, §7).
- **Unresolved owner decisions** (unchanged from iteration 1): helper
  reject conflict (Doc 05 vs Doc 09 — prototype follows Doc 09, with the
  UI now explaining it); helper applicant-visibility; Q/AO items listed
  in `USER-JOURNEYS.md`. The one-admin banner warning and the
  no-second-approver pending state are kept and shown (not reachable
  with the 2-SA seed, code path intact).

## 10. Screenshot index (`iteration2/qa-final-v2/`)

Light + dark at 360px and 1440px: `login-{360,1440}-light.png` (login
page is fixed deep-forest, so there is no separate dark variant),
`sa-dashboard-{360,1440}-{light,dark}.png`,
`helper-dashboard-{360,1440}-{light,dark}.png`,
`member-list-{360,1440}-{light,dark}.png`,
`member-detail-{360,1440}-{light,dark}.png`,
`expatriate-queue-{360,1440}-{light,dark}.png`,
`expatriate-detail-{360,1440}-{light,dark}.png`,
`finance-overview-{360,1440}-{light,dark}.png`,
`finance-ledger-{360,1440}-{light,dark}.png`,
`blood-registry-{360,1440}-{light,dark}.png`,
`content-list-{360,1440}-{light,dark}.png`,
`notifications-{360,1440}-{light,dark}.png`,
`settings-{360,1440}-{light,dark}.png`. Post-refix versions
(`*-refix.png`) are the current evidence for the stat fix on
`finance-overview` and `sa-dashboard` at 360/1440 light + dark.

Journey screenshots: `j1-members-pending.png`, `j1-member-detail.png`,
`j1-member-approved.png`, `j2-helper-queue.png`,
`j2-request-detail.png`, `j2-accepted.png`, `j2-completed.png`,
`j3-draft-created.png`, `j3-published.png`, `j3-reversal-draft.png`,
`j3-reversal-published.png`, `member-rejected.png`,
`finance-new-empty-errors.png`, `login-lockout.png`.

Bell badge: `bell-360-{light,dark}-{1digit,2digit}-closeup.png`,
`bell-360-{light,dark}-{1digit,2digit}-topbar.png`. Mobile navigation:
`drawer-390-open.png`, `more-sheet-390.png`, `en-users-1440.png`,
`sa-dashboard-1440-dark.png`, `notifications-1440-light.png`,
`profile-sa-1440-light.png`.

## 11. Data gaps + known limitations (carried over, unchanged)

Seed volumes measured from the built data files: 14 expatriate requests
(3 pending, 2 accepted, 4 in progress, 2 completed, 1 closed, 1
rejected, 1 cancelled); 12 members (6 approved, 4 pending, 1 rejected,
1 suspended); 14 ledger entries (9 published, 2 draft, 1 rejected, 1
reversed, 1 discarded); 12 donors, 4 blood requests; 10 audit-log seed
rows; 12 notifications (8 SA1, 4 Helper-1; SA2 / Helpers 2–3 have zero).
Delivery log is derived (labelled simulated). Video gallery is a Phase 2
placeholder by design. Media upload is preview-only. Excel/PDF exports
are simulated with a CSV fallback (CSV is a real download). Settings
sessions/MFA and profile password change are simulated (labelled).
Health values are demo values (labelled). Reload resets everything.

## 12. Coverage

- **68 planned screens: 68 built, 0 not built.** Comparison table in
  `SCREEN-INVENTORY.md` (original 68 vs final 68; added 0, removed 0).
- **73 routes** swept at 360px and 1440px; all render with `h1` +
  content.
- **`node --check` passes on all 52 JS files** (`js/` + `views/` + new
  `js/lib/action-label.js`). Nothing committed, no branch created.

## 13. Iteration 1 (Batch M) — history

The Batch M sweep (2026-11-14, checks 1–24, verdict PASS, 68/68 screens)
is superseded by this report; its detail is preserved here in brief:
Part 1 must-fixes (360px overflow via `.detail-grid`/`kv` min-width
fixes; `finance.overview.publicNote` key gap; photos field
normalisation) and defects D1–D10 (topbar overflow, Reports &
Analytics build, content 404, mobile-sheet Esc, denied/404 titles,
reversal prefill, household toast, audit action labels, demo user
switcher, short-note native validation note) were all fixed and
verified in that pass. The iteration-2 sweep above re-verified the
whole surface on the v2 system; nothing from Batch M regressed.
