# Satanipara Community — Admin Dashboard (design-only prototype)

Batches B/C/D: design system + shared shell + components + authentication + Super Admin /
Helper dashboard overviews. Built on `AUDIT-BATCH-A.md` + `AMENDMENT-01-IA-AND-I18N.md`
(the amendment wins where they conflict).

**Design Iteration 2 (2026-11-14)** redesigned every view on the v2 system
(see `DESIGN-SYSTEM.md` §1): one nav system (sidebar / rail / bottom nav +
More sheet), stable shell, real table sorting, shared stat cards, bottom
sheets, validated re-auth, fully Bengali navigation, and the shared fixes in
`../iteration2/INTEGRATION-REPORT.md`. All 68 screens re-verified live
(`QA-REPORT.md`: 128/128 integration checks passed, 0 page errors).

## What this is — and is not

A **static, simulated, design-only prototype**, same standing as Direction D `index.html`.
No server, no database, no real authentication, no persistence. **Reload resets**
login, filters, drafts, notifications and consent. Every record is DEMO data, labelled
as such in the UI. Demo passwords are plaintext in the demo source and must **never**
be carried into a real system.

## Run

```sh
cd design/admin-dashboard
python3 -m http.server 8130
# open http://localhost:8130/index.html
```

No build step, no dependencies. Vanilla HTML/CSS/JS only.

## Demo logins (simulated — FRESH, never the Direction D logins)

| Role | Mobile | Password |
|---|---|---|
| Super Admin | `01990000000` | `AdminDemo-2026` |
| Super Admin 2 | `01990000002` | `AdminDemo-2026b` |
| Expatriate Helper | `01990000001` | `HelperDemo-2026` |

They are printed on the login screen under a "simulated" heading. 5 failed attempts
locks the account for a simulated 30 minutes. No OTP anywhere. No public Super Admin
registration. The login screen's "demo states" link reaches the pending-approval,
session-expired and forced-password-change states. After a successful login a
first-login onboarding step appears, including a **simulated** browser-notification
permission prompt (labelled as such).

## Defaults

BN + light on first load, unconditional `setTheme('light')`, never
`prefers-color-scheme`. Language and theme toggles are session-only (Q-20 open);
reload resets to BN + light.

## Fonts

Anek Bangla (Bengali) + Manrope (English) via a Google Fonts CDN link in
`index.html`, with robust fallbacks (`Noto Sans Bengali`, system sans) in
`css/tokens.css`. Direction D prefers self-hosted WOFF2; the CDN link is a
prototype convenience and the fallbacks keep the UI usable offline. The English
dictionary is a starting point, not a final translation — professional review is
needed before launch.

## Demo data — consistency notes

- Finance: 2026 published income, first 4 rows = ৳230,000 (dashboard preview),
  all 5 rows = ৳320,000 (full year). Rows sum to the shown totals.
- Only 1999 is a verified milestone; the one unverified draft milestone is marked
  `draft` and never published.
- Donors: A− and AB− are EMPTY (reachable empty state). Donor availability is
  computed from the 90-day rule, never a static flag.
- 2 Super Admins, so dual control is demonstrable. `LE-2026-0006` was entered by
  the logged-in demo Super Admin (`u-sa1`), so self-approval blocking is
  demonstrable. The single-Super-Admin warning banner appears only when exactly
  one active Super Admin exists (with the demo's 2, it correctly does not show).
- 14 expatriate requests; `EXP-2026-0005` is the stale >72 h `in_progress` request.
- No real people, no real phone numbers, no invented statistics — unverified
  figures show "তথ্য হালনাগাদ হচ্ছে".

## File map

```
index.html, README.md
css/ tokens.css base.css shell.css components.css views.css
js/app.js            boot, hash router wiring, shell render, theme/lang init
js/i18n.js           t(), BN/EN toggle, registerStrings(namespace, {bn,en})
js/i18n/bn.js en.js  360 keys each, identical key sets (shell/common/login/dashboard + audit.action.*)
js/lib/ store.js router.js auth.js format.js guards.js action-label.js
js/components/ table.js filters.js badges.js modal.js drawer.js sheet.js toast.js forms.js timeline.js states.js stat.js icons.js
js/data/ demo-users.js demo-requests.js demo-directory.js demo-org.js demo-content.js
         demo-blood.js demo-finance.js demo-system.js demo-media.js
views/login.js views/dashboard.js
```

## CONTRACT — how a module agent adds a view (binding)

1. **Create ONLY your view file** at the path the route table already imports,
   e.g. `views/expatriate.js`. Do NOT edit `js/app.js`, `js/lib/router.js`,
   `js/i18n/bn.js`, `js/i18n/en.js`, any `js/data/*` file, or any other module's file.
2. **Route wiring is already done.** The route table lives in `js/lib/router.js`
   (imported by `js/app.js`); the router dynamically imports your file per route.
   If your file does not exist yet, the shell renders a clear "module in build"
   state — never a blank page, never a crash. You do not touch the table.
3. **Export shape (exact):**
   ```js
   export const Expatriate = {
     route: '#/expatriate',
     title: { bn: '…', en: '…' },
     breadcrumb: ['dashboard', 'expatriate'],
     roles: ['super-admin', 'expatriate-helper'],
     permissions: ['expatriate.requests.view'],
     render(ctx) { /* returns HTML string */ },
     onMount(ctx) {}, onUnmount() {}
   };
   ```
   `ctx` carries `{ params, query, path, role, user, store, t, format, modal,
   toast, drawer, shell, rerender }`. Views **never** touch sidebar/topbar DOM —
   use `shell.setTitle()`, `shell.setBreadcrumb()`, `shell.setCounts()`.
4. **Strings:** put your view's strings at the top of your file as
   `const STRINGS = { bn: {...}, en: {...} }` and call
   `registerStrings('<module>', STRINGS)` (from `js/i18n.js`). Keys are
   namespaced (`members.list.title`, …). No literal user-facing string in a view.
   Fallback is BN, never English, never the key.
5. **Components:** import from `js/components/*` (table, filters, badges, modal,
   drawer, toast, forms, timeline, states). 48px controls, 20 default / 50 max
   rows, badges text+dot never colour alone, no gold badges, focus trap + Esc,
   toasts 5s `role=status`. Confirm modals name the record + consequence.
6. **Data:** read from `store` (`js/lib/store.js`). If a field you need does not
   exist, derive it in your view or report it to the coordinator — never edit
   `js/data/*`.
7. **Rules:** no OTP, no payment UI, no service-charge field, no gold buttons,
   no green cards, no invented figures/milestones/names. Unverified = "তথ্য
   হালনাগাদ হচ্ছে". Helper reject = Super Admin only (Doc 09). Dual control:
   never approve your own finance entry. Every consequential action writes a
   demo audit row via `writeAudit()` and shows a confirm modal.
8. **Check:** run `node --check` on your file; keep it under ~400 lines (split
   by tab/section if larger). Do not commit.

## Module inventory (all views built)

| Area | Files | Routes |
|---|---|---|
| Shell / login / dashboards | `views/login.js`, `views/dashboard.js` | `#/login*`, `#/dashboard` (SA + Helper) |
| People | `views/users.js`, `views/roles.js`, `views/members.js` | `#/users*`, `#/roles`, `#/members*` |
| Community | `views/households.js`, `views/directory.js` | `#/households*`, `#/directory*`, `#/infrastructure`, `#/freedom-fighters` |
| Organisation | `views/organisation.js` | `#/organisation*` (history, constitution, committee 3 tabs, achievements) |
| Activities | `views/activities.js` | `#/activities*` (list, categories, archives, new/detail/edit) |
| Content | `views/content.js`, `views/gallery.js`, `views/faq.js` | `#/content*`, `#/gallery*`, `#/media`, `#/faq` |
| Finance | `views/finance.js`, `views/finance-reports.js` | `#/finance`, `#/finance/ledger`, `#/finance/pending`, `#/finance/projects`, `#/finance/categories`, `#/finance/summaries`, `#/finance/reports`, `#/finance/new`, `#/finance/:entryNo*` |
| Communication | `views/notifications.js`, `views/messages.js` | `#/notifications*`, `#/messages*` |
| Administration | `views/audit.js`, `views/health.js`, `views/settings.js`, `views/profile.js` | `#/audit*`, `#/health`, `#/settings`, `#/profile` |
| Blueprint-only (no sidebar item; in-app links only) | `views/datarights.js`, `views/emergency.js`, `views/services.js` | `#/data-rights`, `#/emergency-team`, `#/services` |

All 68 planned screens are **built**, including Reports & Analytics
(`#/reports`, `views/reports.js` — built in the final-fix pass 2026-11-14;
CSV export downloads a real file, Excel/PDF are labelled simulated exports
with a CSV fallback). See `QA-REPORT.md` defect D2 and
`SCREEN-INVENTORY.md` #44.

## What was verified (Batch M QA, 2026-11-14, + Design Iteration 2, 2026-11-14)

Batch M full sweep in `QA-REPORT.md` (evidence + screenshots in
`~/workspace/satanipara-admin-dashboard/qa-final/`, outside the repo):
Super Admin + Helper logins, 42-item SA nav / 4-item Helper nav, all 73
routed screens, every create/edit/detail journey, confirmation modals, all
expatriate status transitions, finance dual control both directions plus the
full reversal round-trip, request completion/closure gates, search/filter,
BN/EN, light/dark, mobile drawer, layouts at 360/640/900/1200/1440px with
zero horizontal overflow, keyboard (skip link, Esc closes modals, focus
returns), 0 app console errors, empty/denied/404 states. One environmental
note: the Google Fonts CDN fails in this VM (egress proxy), so the UI renders
in fallback fonts there — not an app error.

**Iteration 2 re-verification (2026-11-14, `QA-REPORT.md` + evidence in
`../iteration2/qa-final-v2/`): 128/128 checks passed, 0 failed, 0 page
errors** — all 73 routes at 1440px and 360px (h1 + content, no overflow),
the 3 journeys end-to-end (SA member approval, Helper queue → complete,
finance draft → dual-control publish → reversal), search/filters/sorting,
BN/EN toggle, light/dark, mobile drawer, bottom nav, More sheet, dialogs,
form errors, empty states, Helper deep-links, back navigation, toasts,
notification mark-read (incl. opening a related record), re-auth
wrong/correct, login lockout, responsive matrix at 360/390/430/640/900/
1200/1440px, money-stat geometry at every width/theme, and the bell badge
at 360px light + dark, 1- and 2-digit counts (badge whole, inside its
44px button in all 4 combinations).

## Known limitations (prototype)

- Reload resets everything (login, filters, drafts, notifications, consent).
- Demo data is seeded, not live: 14 expatriate requests (3 pending, 2
  accepted, 4 in progress, 2 completed, 1 closed, 1 rejected, 1 cancelled),
  12 members (6 approved, 4 pending, 1 rejected, 1 suspended), 14 ledger
  entries (9 published, 2 draft, 1 rejected, 1 reversed, 1 discarded),
  10 audit-log seed rows. Counts differ slightly from the audit's target
  volumes — see `QA-REPORT.md` §"Data gaps".
- The notification delivery log is derived from inbox rows + the routing
  rule (no delivery-log collection in the demo data); it says so on screen.
- The Meridian timeline shows per-step timestamps from
  `service_request_updates` (latest update with `status_to === step`); steps
  with no update in the seed fall back to the request's `created_at`.
- Rejection/cancellation reasons are BN-only in the seed
  (`rejection_reason_bn` / `cancellation_reason_bn`).
- The demo role switch lists all three demo accounts in the topbar user
  menu and switches to any of them (SA2 included), so cross-user approval
  works in one session.
- Real-device tap behaviour is not verified — Fahim's phone check is pending.
- Iteration 2 known limitations (full list in `QA-REPORT.md`): 7 inline
  `style="…"` attributes remain (select max-widths + the progress-fill
  width, which is a data value); the finance ledger keeps its select sort
  instead of header sorting (deliberate — two sort controls would compete);
  activities list sorting applies within each year group; screen-reader /
  keyboard tab-order audit beyond Esc-to-close is not done; the intended
  Anek Bangla / Manrope rendering was never exercised (Google Fonts CDN
  blocked in this VM — self-host WOFF2 before launch).
- Unresolved owner decisions that touch this dashboard (helper-reject
  conflict Doc 05 vs Doc 09, helper applicant-visibility brief-vs-audit
  conflict, Q/AO items from audit §2) are listed in `QA-REPORT.md`, not
  resolved here.

## Docs in this folder

- `README.md` — this file (run, logins, file map, limitations).
- `DESIGN-SYSTEM.md` — v2 tokens, type, spacing, shell/nav system,
  components (values quoted from `css/` + `js/`).
- `SCREEN-INVENTORY.md` — all 68 planned screens (audit §3.10's 56 +
  amendment A2's 12), each with route, owner file, role, build status,
  plus the iteration-2 comparison (original 68 vs final 68).
- `USER-JOURNEYS.md` — journeys A–M + Helper workflow, Mermaid flow and
  state-machine diagrams, open questions per journey; updated for the v2
  navigation (bottom nav, drawer, More sheet).
- `QA-REPORT.md` — Design Iteration 2 full sweep: per-check results,
  evidence, defects, data gaps, unresolved decisions (Batch M report kept
  as history in § "Iteration 1 (Batch M) — history").
- `UX-IMPROVEMENTS.md` — what changed vs iteration 1 and why, with
  before/after screenshot references.

