# Satanipara Community — Admin Dashboard Design System v2

Source of truth for every value below is the built `css/` in this folder
(`tokens.css`, `base.css`, `shell.css`, `components.css`, `views.css`) and
`index.html`, as implemented in Design Iteration 2 (2026-11-14). Direction D
governs the brand; where Direction D and the dashboard differ, the dashboard
value quoted here is the one built. All values were read from the built files
and verified live (46/46 DS foundation checks + 128/128 integration QA
checks; see `QA-REPORT.md`).

Changes vs v1: 15 dead tokens pruned (0 unused, 0 undefined — verified by
script); dark theme redesigned as a palette, not an inversion; one nav
system (sidebar / rail / bottom nav) driven by role + viewport; stable
shell (renders once per user); real table sorting; bottom sheets; shared
stat card; validated re-auth; BN nav fully translated; bell badge
re-engineered; 44px touch minimum enforced; `[hidden]` now wins over
flex display (R-G5-4); stat numerals stack number-above-label with
viewport-sized type (R-G5-1).

## 1. Tokens (`css/tokens.css`) — 60 tokens, all used

### Identity / brand

```css
--forest:#173F35; --deep:#102E27; --gold:#C49A4A; --moss:#2F6B4F; --ivory:#F7F4EA;
--gold-soft:#E4C98F; --gold-line:var(--gold); /* --gold is the source value */
```

**Gold rule (binding):** gold is a restrained identity accent ONLY —
rules, dots, timeline, demo-badge dot. Never a general button colour, never
a button, outline, gradient, or badge fill. Primary button is forest fill.

### Surfaces / ink (light)

```css
--ground:#FBFBF8; --surface:#FFFFFF; --surface-2:#F3F5F1;
--surface-float:#FFFFFF; --surface-modal:#FFFFFF;
--paper:#F7F4EA; --wash:#F0F2EF;
--ink:#1E2A25; --ink-strong:#102E27; --muted:#5A6B62;
--line:#E3E6E1; --line-strong:#C9CFC9;
--on-danger:#FFFFFF; --on-primary:#F7F4EA;
```

### Status (light) — always text + 6px dot, never colour alone

```css
--ok:#2F6B4F; --danger:#9B2C2C; --warn:#8A5A00; --info:#2F6B4F;
```

Badge map: pending `--warn`; accepted / in_progress `--info`; completed /
closed / published / approved `--ok`; rejected / cancelled / discarded /
reversed `--danger`; draft `--muted`.

### Dark theme (`[data-theme="dark"]`) — designed, not inverted

Deep-forest surfaces, lighter surfaces for elevation (not shadows), status
colours re-tuned, `--forest` lightened so the primary button stays readable.

```css
--ground:#0C1B16; --surface:#122019; --surface-2:#1A2E25;
--surface-float:#1E352B; --surface-modal:#1E352B; --paper:#122019; --wash:#16281F;
--ink:#EDEFE7; --ink-strong:#FBFBF8; --muted:#A9BDB1;
--line:#24443A; --line-strong:#3D5C4E;
--forest:#9CCFAE; --deep:#0B1A15; --moss:#8FC7A8; --ivory:#FBFBF8;
--gold:#C49A4A; --gold-soft:#E4C98F; --gold-line:var(--gold);
--ok:#7FBF9A; --danger:#E88A8A; --warn:#E4C98F; --info:#8FC7A8;
--on-danger:#1A0E0E; --on-primary:#102E27;
--shadow-sheet:0 8px 30px rgba(0,0,0,.45); --shadow-lift:0 2px 10px rgba(0,0,0,.35);
--focus-ring:2px solid var(--gold-soft);
```

Light opens by default, unconditionally (`setTheme('light')` in `js/app.js`,
never `prefers-color-scheme`). Theme toggle is manual and session-only
(Q-20 open); reload resets to BN + light.

### Shape / motion / focus

```css
--radius-sm:12px; --radius-md:16px; --radius-lg:20px; --radius-pill:999px;
--shadow-sheet:0 8px 30px rgba(16,46,39,.12); --shadow-lift:0 2px 10px rgba(16,46,39,.08);
--ease-product:cubic-bezier(.32,.72,0,1);
--dur-fast:150ms; --dur-med:250ms; /* short, purposeful, interruptible only */
--focus-ring:2px solid var(--forest); --focus-ring-offset:2px; /* the ONE ring, :focus-visible */
```

### Spacing (4px scale, wired across `css/*.css`)

```css
--sp-1:4px; --sp-2:8px; --sp-3:12px; --sp-4:16px;
--sp-6:24px; --sp-8:32px; --sp-12:48px; --sp-16:64px;
```

### Type

```css
--font-bn:'Anek Bangla','Noto Sans Bengali','Hind Siliguri',sans-serif;
--font-en:'Manrope','Anek Bangla',sans-serif;
--font-quote:'Tiro Bangla','Noto Serif Bengali',serif; /* brand quote: login-brand h1, .font-quote */
--text-h1:28px; --text-h2:20px; --text-h3:18px;
--text-body:16px; --text-sm:14px; --text-xs:13px;
```

### Layout widths

```css
--touch-min:44px;
--sidebar-w:264px; --rail-w:76px; --topbar-h:64px; --topbar-h-mobile:56px;
--bottomnav-h:64px; --container:1200px;
```

## 2. Typography (`css/base.css`, `css/tokens.css`, `index.html`)

Fonts (Google Fonts CDN in `index.html`, fallbacks in `tokens.css`): Anek
Bangla 400–800, Manrope 400–800. The CDN is a prototype convenience;
offline the fallback stacks render (the CDN fails in the QA VM — see
`QA-REPORT.md`). Self-host WOFF2 before launch.

| Element | Size / weight / line-height |
|---|---|
| Page title `h1` | 28px / 700 / 1.25 (topbar title 20px, 17px mobile, ellipsis) |
| `h2` | 20px / 700 / 1.25 |
| Card title `h3` | 18px / 700 / 1.25 |
| Body | 16px / 400 / 1.65 (Bengali body min 15px) |
| Small / caption (`.small`) | 14px / 500 / 1.60 |
| Label / nav / button | 15–16px / 600 / 1.50 |
| Table body | 15px; table header 14px / 600, muted |
| Stat numeral (`.stat .num`) | `clamp(1.35rem,6.2vw,1.75rem)` / 800 / 1.05, tabular, `white-space:nowrap`; ≥1200px `clamp(1.75rem,3vw,2.75rem)` — sized so the longest money value (`৳৩,২০,০০০`) fits its cell on one line at every width (R-G5-1 follow-up, measured 360–1440px) |
| Stat label (`.stat .lbl`) | 14px muted, **below** the numeral (`.stat .num, .stat .lbl{display:block}`) |
| Badge | 14px / 700, pill |
| Request ID / data (`.num`) | tabular figures, `letter-spacing:.02em`, Latin only |

Rules: no ALL-CAPS labels; sentence case; Bengali never letter-spaced.
Numerals: Bengali ০–৯ in Bengali copy; Latin only in Request IDs
(`EXP-2026-XXXX`), phone numbers as typed. BDT amounts are formatted from
one value (`fmtBDT`): ৳ + Bengali numerals in BN, Latin numerals in EN.

## 3. Layout & breakpoints

- Container: `max-width:1200px`, gutters 18px mobile / 24px ≥1200px
  (`.container`, `.view` in `base.css` / `shell.css`).
- Breakpoints: **360 / 640 / 900 / 1200 / 1440**. Media queries:
  `max-width:639px` (stacked tables, bottom sheets, bottom nav);
  `640–1199px` (navigation rail); `min-width:900px` (two-column detail
  grid 8fr/4fr, 4-column stat grid); `min-width:1200px` (full sidebar,
  24px gutters).
- Detail grid (`.detail-grid`, `views.css`): single column below 900px,
  `8fr 4fr` at ≥900px. Children have `min-width:0` (360px overflow fix).
- `.kv` definition list (`views.css`): `grid-template-columns:160px 1fr`,
  gap `4px 16px`, 15px; below 640px the label column narrows to `104px`
  with a 12px gap.
- `.two-col`: single column below 900px, `1fr 1fr` at ≥900px.
- `[hidden]{display:none!important}` (`base.css`) — the hidden attribute
  wins over any `display:flex` rule (R-G5-4: the one-admin banner).

## 4. Shell & navigation (`css/shell.css`, `js/app.js`)

One nav implementation driven by role + viewport — not three designs.

| Viewport | Navigation |
|---|---|
| < 640px | Compact topbar (56px) + **bottom nav** (primary destinations + **More** opens the full-nav sheet) |
| 640–1199px | **Adaptive rail** (76px, icon + label, scrollable); group labels become hairline rules |
| ≥ 1200px | **Collapsible sidebar** (264px); collapse button in sidebar head → rail (`.shell.nav-collapsed`) |

**Bottom nav (mobile, v3):** Super Admin — Dashboard, Requests,
Members, Finance, More. Helper — Dashboard, Requests, Notifications,
Profile, More. Labels are SHORT single-line forms (`nav.s.*`: ড্যাশবোর্ড /
প্রবাসী / সদস্য / অর্থ / আরও — full labels stay in sidebar, rail and the
More sheet); `white-space:nowrap` + ellipsis guard, so labels NEVER wrap
to two lines. The Requests tab carries a pending-request count badge
(`pendingRequests`, same no-clip rules as the bell badge; hidden at 0,
live-updated by `shell.setCounts`). Helper NEVER sees Super Admin
destinations: nav data is role-split (`NAV_SA` 42 items / `NAV_EH` 4 items
in `js/app.js`), the route guard enforces it, and QA verifies the Helper
sidebar has exactly 4 items and no SA labels.

**Active destination (sidebar/rail):** ink-strong + `--surface-2` bg +
6px gold dot (never underline alone). **Bottom nav active (v3):**
Material-3 style indicator pill (`--nav-pill-bg` forest wash, 64×32px)
behind the icon, forest icon + 800-weight forest label; the gold dot is
NOT used on the bottom nav. `aria-current="page"` is set on the active
item in sidebar, rail and bottom nav alike. **Breadcrumbs link to their REAL
parent** (`crumbHref()` maps crumb keys through the nav tables; group keys
resolve to the group's first item).

**Shell lifecycle:** the shell renders ONCE per signed-in user
(`buildShell()`); only `#view` re-renders per route. `#modal-root`,
`#drawer-root` and `#toasts` live OUTSIDE `#app` (`index.html`) so modals,
drawers and toasts survive navigation. All shell controls are bound ONCE
via a single delegated document click listener (`bindShellOnce()`); no
per-render binding, no listener leak. `currentView.onUnmount()` is called
before each mount. Language change re-renders the view + nav chrome only;
theme change re-renders nothing (token swap).

**Topbar:** 64px (56px mobile), sticky, `background:var(--surface)`,
1px `--line` bottom border, `gap:12px`, padding `0 16px` (12px mobile).
Page title 20px (17px mobile), ellipsis; crumbs 14px muted, `›`
separated, hidden on mobile. The title wrapper has `min-width:0` and
controls have `flex-shrink:0` (long titles never push the row past 360px).

**Language segment (`.seg`):** pill, 1px `--line-strong` border; active
button forest fill, on-primary text, 44px min-height. **Icon buttons
(`.icon-btn`):** 44px circle, 1px `--line` border. **Bell badge
(`.icon-btn .count`):** re-engineered in v2 — inset inside the 44px
button (`top:2px; right:2px`, NO negative offsets), `min-width:20px` +
`padding:0 5px`, tabular numerals, `line-height:1`, 2px `--surface`
border; count caps at `99+` (`shell.setCounts`). Verified whole at 360px,
light + dark, 1- and 2-digit counts (see `QA-REPORT.md` § bell badge).

**Role badge:** 13px/700 pill, `--wash` fill, 1px `--line` border.
**User-menu panel:** absolute, `min-width:260px`, 16px radius,
`--shadow-lift`, rows 44px min-height; lists all three demo accounts
with a ✓ on the current one (demo user switcher).

**One-Super-Admin banner (`.banner`):** `--paper` fill, 1px
`--gold-line` bottom border, 12px/20px padding, 15px. Shown only when
exactly one active Super Admin exists (seed has two, so it is hidden;
`hidden` attribute now respected).

**Mobile sheet (`.mobile-sheet`):** fixed bottom, `max-height:82vh`,
20px top radius, z-index 101 (above its backdrop at z-100); holds the
full grouped nav + language segment + theme button. Esc and backdrop tap
close it; focus returns to the hamburger.

**View:** `padding:20px 18px 48px` (24px/24px/64px at ≥1200px);
mobile bottom padding clears the bottom nav.

**Login page:** deep-forest field (`--deep`), ivory statement, one sheet
`max-width:440px`, 20px radius, `--shadow-sheet`; brand crest 64px with
1px `--gold-line` ring. Shell chrome hidden in auth mode (`.auth-mode`).

**`ctx` contract:** `{params, query, path, role, user, store, t,
format:{fmtBDT}, modal, toast, drawer, sheet, shell, rerender}`.
`ctx.sheet` opens a bottom sheet (see §5).

## 5. Components — use these, do not hand-roll

| Component | File | API | Notes |
|---|---|---|---|
| Buttons | `css/components.css` | `.btn .btn-primary` / `.btn-secondary` / `.btn-ghost` / `.btn-danger`, `.btn-sm`, `.btn-block` | One hierarchy. Primary = forest fill. Gold NEVER a button colour. 48px (44px sm). Press feedback: 1px translate. |
| Forms | `js/components/forms.js` | `field({id,label,hint,error,type,value,required,attrs,options,rows})`, `errorSummary(errors)`, `validateRequired(v,minLen)` | `type:'textarea'` → `<textarea>`; `options:[{value,label}]` → `<select>`. Label above, helper + inline error below, `aria-invalid` + `aria-describedby`. Use the correct input type per field. |
| Cards / stats | `js/components/stat.js` | `statCard({href,num,label})`, `statGrid(items)` | THE one stat card. Pass pre-formatted numbers (`fmtNum`/`fmtBDT`) — it never formats. `href` → link card, else plain div. Number above label, single line (see §2). |
| Progress bar | `css/components.css` | `.progress` (track) + `.progress-fill` (fill) | Token track (`--wash`, 6px, radius 3px) + forest fill; width is set inline (data value) with `role="progressbar"` + `aria-valuenow/min/max`. Used by finance project "Used" column. |
| Modal | `js/components/modal.js` | `openModal({title,body,confirmLabel,cancelLabel,danger,requireReauth,onConfirm})` → `close()` | Focus trap, Esc, focus return. Focus starts on the FIRST focusable. Backdrop click closes only on the backdrop itself. |
| Re-auth | `js/components/modal.js` + `js/lib/auth.js` | `requireReauth:true` + `validateReauth(pw,user)` | Password field is VALIDATED: empty → `common.reauthEmpty`, wrong → `common.reauthWrong`, inline error, modal stays open; `onConfirm` fires ONLY on a correct password (the acting account's demo password). |
| Bottom sheet | `js/components/sheet.js` | `openSheet({title,actions:[{label,icon?,danger?,href?,onClick?}]})` → `close()` | Contextual actions on mobile (sheet + handle); centred small dialog ≥640px. Esc/backdrop close, focus return. Use for action lists; use `openDrawer` for detail panels. |
| Drawer | `js/components/drawer.js` | `openDrawer({title,body,onClose})` | Right slide-over desktop, bottom sheet ≤639px. |
| Toast | `js/components/toast.js` | `toast(message)` | Message inserted as TEXT — never pass HTML. 5s auto-dismiss, `role=status`, 44px dismiss. |
| Table | `js/components/table.js` | `renderTable({columns,rows,page,perPage,onRowClick,stacked,sort})`, `bindTableRows(root)`, `bindTableSort(root,onSort)`, `sortRows(rows,key,dir,get?)` | REAL sorting: column `{sortable:true}` renders a button header with `aria-sort` + ↑/↓/↕ indicator. Keep sort state in the query string (`?sort=&dir=`) and pass `sort:{key,dir}` back in; `bindTableSort` toggles asc→desc and calls `onSort(key,dir)`. Sorting happens BEFORE pagination; numeric-aware incl. Bengali digits. |
| Badges | `js/components/badges.js` | `badge(status,label?)`, `plainBadge(label)`, `statusLabel(status)` | Pill 14px/700, text + 6px dot, never colour alone. |
| Filters | `js/components/filters.js` | `renderFilters({q,chips,activeChip,...})`, `bindFilters(root,{onSearch,onChip,onClear})` | Search fires on `change` (blur/Enter) — DELIBERATE: live `input` would re-render the view per keystroke and drop focus. Do not change without a focus-preserving plan. |
| States | `js/components/states.js` | `emptyState(msg,actionLabel,actionHref)`, `loadingSkeleton(rows=5)`, `errorState(cause,fix,onRetry)` | All three are wired and styled (`.empty`, `.skeleton`, `.error-box`). Use them for any async/loading/error path; do not invent a second set. |
| Timeline | `js/components/timeline.js` | `meridianTimeline(request,lang,stepTimes?)` | `stepTimes` maps step key → ISO timestamp; a done node's `.m-time` shows `fmtDateTime(stepTimes[step])` when present, falling back to `request.created_at`. The expatriate view derives it from `service_request_updates` (latest update with `status_to === step`). Hardcoded strings go through `t()` (`timeline.current`, `timeline.closedByApplicant`). |
| Icons | `js/components/icons.js` | `icon(name,size=20)` | THE one icon set: inline SVG, 24 viewBox, stroke 1.8, round caps, `currentColor`. No emoji, no mixed libraries. Unknown names fall back to `dot`. |
| Search/filter bar, pagination | `css/components.css` | `.filters`, `.search-box`, `.chip`, `.pagination` | Chips 44px, `aria-pressed` for active. |

**Touch targets:** 44px minimum enforced for buttons, chips, seg
buttons, icon buttons. Standalone text links (e.g. "সব দেখুন") MUST use
`.link-more` (44px tall, inline-flex) instead of a bare `<a>`.

**Motion:** `--dur-fast` 150ms / `--dur-med` 250ms,
`var(--ease-product)`, transform/opacity only;
`prefers-reduced-motion` collapses all motion (`css/base.css`). No
springy/decorative motion.

**Shared helpers (`js/lib/`):** `format.js` — `now()` (the SINGLE live
clock), `fmtNum`, `fmtBDT`, `fmtDate`, `fmtDateTime`, `fmtPhoneMasked`,
`fmtAgo` (relative time), `donorAvailable` (90-day rule, moved out of
`js/data/`), `esc`. `router.js` — route table + `setHash`, `go`,
`withQuery`, `buildQueryString`, `hashWithQuery` (the ONE navigation
helper set; views must not carry local copies). `store.js` — in-memory
store + `storeAdd` / `storeRemove` / `storeUpdate` (views must mutate
through these, never an imported `js/data` array) + `counts()`,
`unreadCount()`, `activeSuperAdmins()`, `writeAudit()`. `guards.js` —
`PERMISSIONS` (route `permissions[]` are ENFORCED: guard checks `roles`
then every `permissions[]` entry via `can()`; first missing permission is
named on the denied screen) + `deniedHtml` / `notFoundHtml`.
`action-label.js` — `actionLabel()` for audit action codes (its
`audit.action.*` strings live in the base i18n dicts).

## 6. Buttons (`css/components.css`)

- Base (`.btn`): inline-flex, `min-height:48px`, padding `12px 20px`,
  pill radius, 15px/700, gap 8px.
- `.btn-primary`: forest fill, on-primary text (dark: forest fill,
  `#102E27` text). Hover: `brightness(1.08)`.
- `.btn-secondary`: surface fill, ink-strong text, 1px `--line-strong`
  border. `.btn-danger`: `--danger` fill, on-danger text. `.btn-ghost`:
  transparent. `.btn-sm`: 44px min-height, 14px. `.btn-block`: full width.
- Disabled: `opacity:.5`, `cursor:not-allowed`.
- Touch targets ≥44px everywhere (controls 48px, nav rows 48px, chips
  44px), ≥8px between adjacent targets; no hover-only interaction.

## 7. Forms (`css/components.css`)

- `.field`: 16px bottom margin. `label`: block, 700, 15px, 6px bottom
  margin — visible label above every field, never placeholder-only.
- `.input` (input/select/textarea): `width:100%`, `min-height:48px`,
  padding `12px 14px`, 1px `--line-strong` border, 12px radius, 16px font.
  Focus: `var(--focus-ring)` + offset, `--moss` border. Invalid:
  `--danger` border; error text 14px `--danger` under the field.
- Hint: 14px muted, 4px top margin. Error summary: 1px `--danger`
  border, 12px radius, 12px/16px padding, 16px bottom margin.
- Focus (global, `base.css`): `:focus-visible { outline:var(--focus-ring);
  outline-offset:var(--focus-ring-offset) }`; dark: `--gold-soft`. Never removed.
- Reduced motion (`base.css`): `prefers-reduced-motion:reduce` forces
  animation/transition durations to `0.01ms`.

## 8. Tables (`css/components.css`)

- `.table-wrap`: horizontal scroll container, 1px `--line` border,
  16px radius, surface fill.
- `table.tbl`: 100% width, 15px, `min-width:640px`, collapsed borders.
  Header: 14px/600 muted, left, `12px 16px` padding, sticky top, surface
  background. Cells: `12px 16px`, 1px `--line` row rules, 48px min row
  height, middle vertical alignment. Zebra: even rows `--wash`.
  Row click: `cursor:pointer` on `tr[data-href]`.
- Sortable headers (`.th-sort`): button, 44px min-height, gold arrow
  indicator (↑/↓/↕), `aria-sort` on the `<th>`.
- Phones (≤639px, `.stack-cards`): table becomes stacked cards — thead
  hidden, each row a surface card (16px radius, 1px border, 12px bottom
  margin), cells flex label/value via `data-label` (`::before`, 700,
  muted, 14px).
- Pagination: flex, right-aligned, 12px gap, 14px; per-page select 44px
  min-height.

## 9. Badges, chips, filters

- `.badge`: inline-flex, gap 6px, 14px/700, pill, `--wash` fill,
  ink-strong text, `white-space:nowrap`; 6px dot (`currentColor`).
  No gold badges.
- `.chip`: 44px min-height, pill, 1px `--line-strong` border, surface
  fill, 14px/600; active (`aria-pressed="true"`): forest fill, on-primary text.
- `.filters`: flex, wrap, 12px gap, 16px bottom margin. `.search-box`:
  flex 1, `min-width:220px`.
- Stat grid (`.stat-grid`): 2 columns mobile, 4 at ≥900px; 1px `--line`
  rules between stats (no boxes); `.stat` padding 20px, hover `--wash`;
  `.stat` is a block link/div with `min-height:44px`.

## 10. Cards, lists, timeline

- `.card`: surface, 1px `--line` border, 16px radius, 20px padding,
  20px bottom margin. `h3` 12px bottom margin.
- `.list-row`: flex, 12px gap, `12px 0` padding, 1px `--line` bottom rule.
- Meridian timeline (`.meridian`): vertical 1px `--gold-line` at left 9px;
  nodes 19px circles, 2px `--line-strong` border, surface fill; done =
  forest fill + ✓; current = `--gold-line` border + 3px `--gold-soft`
  ring + 6px gold dot; label 700; time 14px muted. Per-step times via
  `stepTimes` (see §5); closed requests show a completion banner;
  rejected/cancelled show a terminal notice instead of the timeline.
- 999 disclaimer (`.disclaimer-999`): 1px `--gold-line` border, 4px left
  border, 12px radius, 12px/16px padding, 15px. Permanent on every
  expatriate screen.
- Demo badge (`.demo-badge`, `base.css`): 13px/700 pill, `--wash` fill,
  1px `--line` border, 6px gold dot prefix.

## 11. Modal, drawer, sheet, toast (`css/components.css`)

- Modal: fixed backdrop `rgba(11,26,21,.5)`, z-index 100; sheet
  `max-width:520px`, 20px radius (bottom sheet with top-only radius on
  mobile), 24px padding, `--shadow-sheet`, slides up 250ms
  (`--ease-product`). Actions: flex, right-aligned, 12px gap, wrap.
  Re-auth password field validated (see §5).
- Drawer (`.drawer`): fixed right, `min(480px,100%)` wide, full height,
  24px padding, slides in 250ms; on ≤639px it becomes a bottom sheet
  (`max-height:82vh`, top radius 20px).
- Bottom sheet (`.sheet`): fixed bottom, `max-height:82vh`, 20px top
  radius, z-index 101; ≥640px a centred dialog (`min(420px,100vw-48px)`).
- Mobile nav sheet (`.mobile-sheet`, `shell.css`): fixed bottom,
  `max-height:82vh`, 20px top radius, `12px 12px 28px` padding, z-101.
- Toasts (`#toasts`): fixed bottom-right (bottom-centre on mobile, above
  the bottom nav), `max-width:min(420px,calc(100vw - 32px))`, 8px gap;
  `.toast`: surface, 1px `--line` border, 12px radius, `--shadow-lift`,
  12px/16px padding, rises 150ms; dismiss button 44px, 18px.
- Animations: `sheetUp` (translateY 40px → 0, 250ms), `drawerIn`
  (translateX 40px, 250ms), `toastIn` (translateY 8px, 150ms).

## 12. Navigation states

- Sidebar item hover: `--wash` background. Active: ink-strong +
  `--surface-2` bg + gold dot only.
- Topbar language segment: active = forest fill.
- Chips: active = forest fill.
- Table row hover: `--wash`.
- Stat link hover: `--wash`.
- Skip link (`.skip-link`, `base.css`): absolute, off-screen (`top:-48px`)
  until focused, then forest pill at `top:12px`. Screen-reader-only
  utility (`.sr-only`) uses the standard clip pattern.

## 13. Empty / loading / error states (`css/components.css`)

- `.empty`: 32px/16px padding, centred, muted text.
- `.skeleton`: `--wash` fill, 12px radius, 20px min-height, 8px bottom
  margin.
- `.error-box`: 1px `--danger` border, 16px radius, 20px padding, surface.
- Error summary: see §7. No illustration, no joke copy — plain sentence +
  one action.

## 14. Colour budget (per screen, Direction D §11)

- ≤2 forest fields per screen; gold = 1 line + ≤3 points per viewport.
- No green section backgrounds, no green cards, no gold-tinted cards, no
  decorative shapes. Green fills: buttons, progress fill, hero/footer
  fields only. Tables: 1px `--line` rules, `--wash` zebra.
- Gold/brass text below 32px: zero (gold `#C49A4A` on `--ground` is
  2.51:1 — never text on light; `--gold-soft` on forest is 7.25:1).

## 15. i18n

- Base dicts `js/i18n/bn.js` / `en.js`: 360 keys each, identical key sets
  (verified). All shell/common/login/dashboard strings + the
  `audit.action.*` labels live here; every view registers its own
  namespaced strings at the top of its file via `registerStrings`.
  Fallback is BN, never English, never the key.
- All 42 `nav.*` values are natural, professional Bengali in `bn.js`;
  EN strings untouched. New in v2: `nav.more`, `nav.collapse`,
  `common.reauthEmpty`, `common.reauthWrong`, `timeline.current`,
  `timeline.closedByApplicant`, `finance.overview.publicNote`
  (single owner — the duplicate registration in `views/finance.js` was
  removed), plus 111 keys merged from the five module workers and the 92
  `audit.action.*` labels.
