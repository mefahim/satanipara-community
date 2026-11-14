# UX Improvements — Design Iteration 2 (vs Iteration 1)

| | |
|---|---|
| Date | 2026-11-14 |
| Baseline | Iteration 1 (Batch M, `QA-REPORT.md` §13) — 68 screens, all built and verified, but several controls were dead or decorative, tables sorted only by URL, and the mobile navigation was a single hamburger sheet |
| This iteration | Design System v2 (`DESIGN-SYSTEM.md`) applied to all 68 screens — same screens, same routes, same data; the change is what the screens *do* and how they feel |

Screenshots referenced below: iteration-1 baseline in
`~/workspace/satanipara-admin-dashboard/qa-final/` (outside the repo),
iteration-2 in `~/workspace/satanipara-admin-dashboard/iteration2/qa-final-v2/`
(file names given per item).

## 1. Attention-first dashboards

**Before:** both dashboards led with KPI numbers. A Super Admin saw
counts, then had to hunt through lists to find what actually needed
them; a Helper saw their queue without any sense of what was urgent.

**After:** the Super Admin dashboard opens with a greeting + live Dhaka
date, then a "যা দেখা দরকার" attention list — pending member approvals,
urgent requests, requests stale >72 h, pending finance drafts, unread
messages — each a real link to the filtered list, and hidden entirely
when its count is zero. Only after that come the KPI stat cards, then
urgent requests + pending approvals, sortable recent requests, and the
finance snapshot (published 2026 income/expense/net beside the 4-row
preview ৳230,000 vs full-year ৳320,000 and a pending-drafts link).
The Helper dashboard is reduced to the same idea for their work:
"আমার সারি" with pending/urgent/in-progress counts and nothing else
they are not allowed to see.

**Why:** the dashboard's job is triage, not reporting. The admin's
first question is "what needs me?" — the answer is now the first thing
on the page, and every count is a link, not a dead number.

*Screenshots:* `sa-dashboard-1440-light.png` (v2) vs
`sa-dashboard-1440-light.png` (v1 baseline, `qa-final/`) —
attention list at the top; `helper-dashboard-1440-light.png`.

## 2. Dead controls made real

Iteration 1 had a set of controls that rendered but did nothing. Every
one below was either wired or removed in iteration 2:

| Control (v1) | What it did | What it does now |
|---|---|---|
| Helper dashboard queue search | Re-rendered the queue but never filtered | Filters by request no. / service / applicant |
| Directory "দ্রুত দেখুন" button | The drawer binding was never triggered | Opens the quick-view drawer with the row's details |
| Infrastructure / freedom-fighter rows | `onRowClick: null` — rows did nothing | Navigate to the detail page |
| Member edit validation | A plain `required` attribute fired the browser's native bubble and the app's error summary never appeared | `novalidate` on the form, so the app's own error summary (shared `field()` component) runs |
| Content list sort `<select>` | A second, confusing sorting mechanism alongside the table headers | Removed; header sorting is the only mechanism |
| Finance progress bars | Inline-styled divs, no semantics | Shared `.progress` component with `role="progressbar"` and `aria-valuenow` |
| Table "sort" on some lists | Sorted the URL but not the visible order | Real `?sort=` + `?dir=` sorting on every table that offers it |
| Toasts | 350 ms artificial delay before appearing | Appear immediately |
| Notification rows | Opening a related record left the notification unread | Opening it marks it read (bell drops) |

**Why:** a control that looks clickable and does nothing is worse than
no control — it teaches the user not to trust the interface. The v2
rule is: if it renders, it works; if it cannot work, it is labelled
(simulated) or it is not rendered.

## 3. Mobile: a navigation system instead of a hamburger

**Before:** one hamburger opened a sheet; the bottom of the screen had
no navigation, and the most-used destinations were two taps away.

**After (one nav system, three layouts):** <640px — compact topbar +
**bottom nav** (SA: Dashboard, Requests, Members, Finance, More;
Helper: Dashboard, Requests, Notifications, Profile, More) and the
**More sheet** with the full grouped navigation; 640–1199px —
**adaptive rail** (76px, icon + label); ≥1200px — **collapsible
sidebar** (264px, collapses to the rail). Active destination is marked
with ink-strong text, a surface-2 background and a 6px gold dot, plus
`aria-current="page"`. Breadcrumbs link to their real parent.
Screenshots: `drawer-390-open.png`, `more-sheet-390.png`.

**Why:** the five destinations in the bottom nav are the ones an admin
reaches for on the phone — the rest is one tap into the More sheet.
The rail and sidebar keep the same items, so the mental model does not
change between phone and desktop.

## 4. Tables → cards where the phone wins

**Before:** dense tables on narrow screens, with horizontal scroll or
clipped columns on several list screens.

**After:** list views keep their tables on desktop but render as
**card rows** under ~640px (member list, expatriate queue, blood
registry, content lists): each card carries the key facts, the status
badge, and the primary action, with a 44px touch target. Stat grids
collapse 4 → 2 → 1 columns and every `.stat .num` is now sized to fit
its cell on one line at every width (see §6).

**Why:** a table is a desktop layout. On a phone the same data reads
better as cards, and a tap target below 44px is a miss. Verified: no
page overflow at 360/390/430/640/900/1200/1440px on the five
responsive-matrix pages.

## 5. Finance clarity

**Before:** the finance overview showed published figures and a
4-row preview that summed to ৳230,000 while the full-year total was
৳320,000 — a reader could reasonably think the numbers disagreed; the
project "Used" column used inline-styled progress bars; and the
ledger's long money values clipped at 360px.

**After:** the overview now shows published 2026 income/expense/net
beside the preview, the preview is labelled as a 4-row preview, and
the full-year figure is the one the snapshot totals. Project "Used"
uses the shared `.progress` component. Money stats render on one line
at every width and theme (verified 42/42 measurements + visual
re-fix screenshots). The dual-control flow itself is unchanged — but
the enterer-can't-approve state is now shown as a disabled button
with a self-block note instead of a missing button.

**Why:** money is the screen where a wrong reading is a real mistake.
The numbers are the same; the ambiguity is gone.

*Screenshots:* `finance-overview-360-light-refix.png`,
`finance-overview-1440-light-refix.png`,
`sa-dashboard-1440-light-refix.png`.

## 6. The expatriate request, rewritten around the Helper's next step

**Before:** the request detail opened with service fields; the
timeline showed the same `created_at` under every completed step; a
Helper who could not close/reject/cancel a request simply did not see
those actions — and had no way to know why.

**After:** the detail opens with a **Summary card** — status,
priority, assigned helper, last update (absolute + "X ago"), latest
note, expense summary, and the **next permitted action**. The Meridian
timeline shows **per-step timestamps** from the update history
(`stepTimes`), falling back to `created_at` only where no update
exists. SA-only exits stay visible to Helpers as **disabled options
with the reason written out** ("— শুধু সুপার অ্যাডমিন" + an
explanation box), never silently gated. The no-charge rule is stated
on the detail, and the 999 disclaimer sits in the queue header.

**Why:** the Helper's question is "what do I do next?" — the Summary
card answers it in one glance. And a permission boundary the user
cannot see is a bug in their mental model: explaining it is better
than hiding it.

*Screenshots:* `expatriate-detail-1440-light.png`,
`j2-request-detail.png`, `j2-completed.png`.

## 7. Fully Bengali navigation

**Before:** the navigation labels and several module strings were
English or mixed; 111 module keys + 92 audit action labels lived in
view-local dicts, so some screens fell back to English when the
language was Bengali.

**After:** the base i18n dicts now hold **360 keys each (BN/EN,
identical sets)**; the navigation, the merged screens (members,
expatriate, blood, finance, audit, settings) and the dashboard
render fully Bengali in BN mode, fully English in EN mode (verified
live on the users list and the finance overview).

**Why:** the admin's working language is Bengali. A half-translated
interface is a translation bug, not a cosmetic gap.

## 8. Consistency: shared components everywhere

Iteration 1 built the shared components; iteration 2 made them the
only way things are done:

- **Stat cards** — one component, same grid, same numerals, same
  behaviour on every screen (the R-G5-1 fix lives here).
- **Forms** — the shared `field()` component with one error-summary
  pattern, one re-auth pattern (validated: empty password, wrong
  password, correct password all handled and verified live).
- **Tables** — one sorting mechanism (`?sort=` + `?dir=`), one
  filter bar, one empty state.
- **Sheets & modals** — one drawer, one bottom sheet, one modal;
  Esc closes, focus returns.
- **Router helpers** — `setHash` / `go` / `withQuery` collapsed from
  per-view copies into `js/lib/router.js` (7 `setHash` copies, 3 `go`,
  2 `withQuery` removed); `actionLabel` and `donorAvailable` moved
  out of view/data modules into `js/lib/`.

**Why:** consistency is not a style preference — it is how the user
learns the interface once and trusts it everywhere. A sort that works
on one list and not another is a lie the user has to re-learn per
screen.

## 9. What did not change (deliberately)

- **All 68 screens, all 73 routes** — nothing added, nothing removed
  (comparison table in `SCREEN-INVENTORY.md`).
- **The expatriate state machine, finance dual control, Helper
  restrictions, demo logins, demo-data labelling** — all preserved
  exactly; the changes above are presentation and wiring, not policy.
- **No backend, no production change** — this is still a design-only
  prototype served statically; reload resets everything.

## 10. Things still open

- Real-device touch and phone-pixel checks (Fahim's phone) — the
  browser cannot prove a tap.
- Screen-reader / tab-order audit beyond Esc-to-close.
- Anek Bangla / Manrope were never exercised (Google Fonts CDN
  blocked in this VM) — self-host WOFF2 before launch.
- 7 inline `style="…"` attributes remain (select max-widths +
  progress-fill width, a data value); finance ledger keeps its
  select sort by design; activities sorting applies within year
  groups. Full list in `QA-REPORT.md` §9.
