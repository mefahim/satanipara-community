# Satanipara Community — Admin Dashboard Design System

Source of truth for every value below is the built `css/` in this folder
(`tokens.css`, `base.css`, `shell.css`, `components.css`, `views.css`) and
`index.html`. Direction D governs the brand; where Direction D and the
dashboard differ, the dashboard value is the one quoted here. All values
were read from the built files on 2026-11-14 (Batch M QA).

## 1. Tokens (`css/tokens.css`)

### Identity / brand

```css
--forest:#173F35; --gold:#C49A4A; --ivory:#F7F4EA;
--deep:#102E27;   /* login field, sidebar crest — large fields only */
--abyss:#0B1A15;  /* dark-mode hero field */
--pine:#1E4A3C;   /* pressed/hover on forest, progress fill */
--moss:#2F6B4F;   /* links on light, success, focus ring */
--gold-soft:#E4C98F; /* gold text on forest only, large numerals */
--gold-line:#C49A4A;  /* the Meridian, 1px */
```

**Gold rule (binding):** gold is a line and a point only — the 1px Meridian
line, a 6px status dot, an active-nav dot, or a ≥32px numeral. Max 1 gold
line + ≤3 point accents per viewport. No gold buttons, outlines, gradients,
or badges. Primary button is forest fill, ivory text.

### Grounds / ink (light)

```css
--ground:#FBFBF8; --surface:#FFFFFF; --paper:#F7F4EA; --wash:#F0F2EF;
--ink:#1E2A25; --ink-strong:#102E27; --muted:#5A6B62; /* 5.45:1 on --ground */
--line:#E3E6E1; --line-strong:#C9CFC9;
```

### Status

```css
--ok:#2F6B4F; --danger:#9B2C2C; --warn:#8A5A00; --info:#2F6B4F;
```

Status colour map (badges pair text with a 6px dot, never colour alone):
pending `--warn`; accepted / in_progress `--info`; completed / closed /
published / approved `--ok`; rejected / cancelled / discarded / reversed
`--danger`; draft `--muted`.

### Dark theme (`[data-theme="dark"]` — token swap only)

```css
--ground:#0E1F1A; --surface:#14261F; --surface-2:#1B322A; --paper:#122019;
--wash:#16281F; --ink:#F2EFE3; --ink-strong:#FBFBF8; --muted:#B9C9BE;
--line:#2A4A3E; --line-strong:#3D5C4E; --forest:#E9EFEA; /* flips to light ink */
--deep:#0B1A15; --gold-line:#C49A4A;
--ok:#7FBF9A; --danger:#E88A8A; --warn:#E4C98F; --info:#8FC7A8;
```

Light opens by default, unconditionally (`setTheme('light')` in `js/app.js`,
never `prefers-color-scheme`). The theme toggle is manual and session-only
(Q-20 open); reload resets to BN + light.

### Shape / motion

```css
--radius-sm:12px; --radius-md:16px; --radius-lg:20px; --radius-pill:999px;
--shadow-sheet:0 8px 30px rgba(16,46,39,.12); --shadow-lift:0 2px 10px rgba(16,46,39,.08);
--ease-product:cubic-bezier(.32,.72,0,1);
--dur-fast:200ms; --dur-med:300ms; --dur-slow:500ms;
```

Dark shadows: `--shadow-sheet:0 8px 30px rgba(0,0,0,.45)`,
`--shadow-lift:0 2px 10px rgba(0,0,0,.35)`.

### Spacing (4px scale)

```css
--sp-1:4px; --sp-2:8px; --sp-3:12px; --sp-4:16px;
--sp-6:24px; --sp-8:32px; --sp-12:48px; --sp-16:64px;
```

### Layout widths

```css
--sidebar-w:264px; --topbar-h:64px; --topbar-h-mobile:56px; --container:1200px;
```

## 2. Typography (`css/base.css`, `css/tokens.css`, `index.html`)

Fonts (CDN link in `index.html`, fallbacks in `tokens.css`):

```css
--font-bn:'Anek Bangla','Noto Sans Bengali','Hind Siliguri',sans-serif;
--font-en:'Manrope','Anek Bangla',sans-serif;
--font-quote:'Tiro Bangla','Noto Serif Bengali',serif; /* pull-quotes only, unused in admin */
```

Google Fonts CDN weights: Anek Bangla 400–800, Manrope 400–800. The CDN is
a prototype convenience; offline the fallback stacks render (the CDN fails
in the QA VM — see `QA-REPORT.md`).

Admin type scale (`css/base.css` — denser than Direction D's public scale):

| Element | Size / weight / line-height |
|---|---|
| Page title `h1` | 28px / 700 / 1.25 |
| `h2` | 20px / 700 / 1.25 |
| Card title `h3` | 18px / 700 / 1.25 |
| Body | 16px / 400 / 1.65 |
| Small / caption (`.small`) | 14px / 500 / 1.60 |
| Label / nav / button | 15–16px / 600 / 1.50 |
| Table body | 15px; table header 14px / 600, muted |
| Stat numeral (`.stat .num`) | `clamp(2.5rem,6vw,4rem)` / 800 / 1.05, tabular |
| Badge | 14px / 700, pill |
| Request ID / data (`.num`) | tabular figures, `letter-spacing:.02em`, Latin only |

Rules: no ALL-CAPS labels; sentence case; Bengali never letter-spaced;
EN letter-spacing −0.03em on display only (Direction D). Numerals: Bengali
০–৯ in Bengali copy; Latin only in Request IDs (`EXP-2026-XXXX`), phone
numbers as typed, and stat numerals paired with Bengali labels. BDT amounts
are formatted from one value (`fmtBDT`): ৳ + Bengali numerals in BN,
Latin numerals in EN.

## 3. Layout & breakpoints

- Container: `max-width:1200px`, gutters 18px mobile / 24px ≥1200px
  (`.container`, `.view` in `base.css` / `shell.css`).
- Breakpoints: **360 / 640 / 900 / 1200 / 1440** (Direction D §4). Media
  queries in the built CSS: `max-width:639px` (stacked tables, bottom
  sheets), `max-width:899px` (sidebar hidden → hamburger + bottom sheet,
  topbar 56px, crumbs hidden, theme toggle hidden from topbar — it lives in
  the mobile sheet), `min-width:900px` (two-column detail grid 8fr/4fr),
  `min-width:1200px` (24px gutters).
- Detail grid (`.detail-grid`, `views.css`): single column below 900px,
  `8fr 4fr` at ≥900px. Children have `min-width:0` (Batch M fix for the
  360px overflow).
- `.kv` definition list (`views.css`): `grid-template-columns:160px 1fr`,
  gap `4px 16px`, 15px; below 640px the label column narrows to `104px`
  with a 12px gap (Batch M fix).
- `.two-col`: single column below 900px, `1fr 1fr` at ≥900px.

## 4. Shell (`css/shell.css`)

- Sidebar: 264px, sticky, full height, `background:var(--surface)`,
  1px `--line` right border. Crest: 44px circle, `--deep` fill, ivory
  "সা". Nav rows: `min-height:48px`, 15px/600, 8px/12px padding,
  12px radius. Active item = 6px gold dot beneath the label
  (`::after`, centred, `bottom:2px`) — never an underline or background.
  Group labels: 13px/700 muted.
- Topbar: 64px (56px mobile), sticky, `background:var(--surface)`,
  1px `--line` bottom border, `gap:12px`, padding `0 16px` (12px mobile).
  Page title 20px (17px mobile), ellipsis; crumbs 14px muted, chevron
  `›` separated, hidden on mobile. The title wrapper has `min-width:0`
  and controls have `flex-shrink:0` (Batch M fix — long titles no longer
  push the row past 360px).
- Language segmented control (`.seg`): pill, 1px `--line-strong` border;
  active button forest fill, ivory text, 40px min-height (36px mobile).
- Icon buttons (`.icon-btn`): 44px circle, 1px `--line` border; bell count
  badge 20px min, `--danger` fill, white 12px/700 text.
- Role badge: 13px/700 pill, `--wash` fill, 1px `--line` border.
- User-menu panel: absolute, `min-width:260px`, 16px radius,
  `--shadow-sheet`, rows 44px min-height.
- One-Super-Admin banner (`.banner`): `--paper` fill, 1px `--gold-line`
  bottom border, 12px/20px padding, 15px.
- View: `padding:20px 18px 48px` (24px/24px/64px at ≥1200px).
- Login page: deep-forest field (`--deep`), ivory statement, one sheet
  `max-width:440px`, 20px radius, `--shadow-sheet`; brand crest 64px with
  1px `--gold-line` ring.

## 5. Buttons (`css/components.css`)

- Base (`.btn`): inline-flex, `min-height:48px`, padding `12px 20px`,
  pill radius, 15px/700, gap 8px.
- `.btn-primary`: forest fill, ivory text (dark: forest fill, `#102E27`
  text). Hover: `brightness(1.08)`.
- `.btn-secondary`: surface fill, ink-strong text, 1px `--line-strong`
  border. `.btn-danger`: `--danger` fill, white text. `.btn-ghost`:
  transparent. `.btn-sm`: 40px min-height, 14px. `.btn-block`: full width.
- Disabled: `opacity:.5`, `cursor:not-allowed`.
- Touch targets ≥44px everywhere (controls 48px, nav rows 48px as built,
  chips 44px), ≥8px between adjacent targets; no hover-only
  interaction.

## 6. Forms (`css/components.css`)

- `.field`: 16px bottom margin. `label`: block, 700, 15px, 6px bottom
  margin — visible label above every field, never placeholder-only.
- `.input` (input/select/textarea): `width:100%`, `min-height:48px`,
  padding `12px 14px`, 1px `--line-strong` border, 12px radius, 16px font.
  Focus: 2px `--moss` outline + 2px offset, `--moss` border.
  Invalid: `--danger` border; error text 14px `--danger` under the field.
- Hint: 14px muted, 4px top margin. Error summary: 1px `--danger`
  border, 12px radius, 12px/16px padding, 16px bottom margin.
- Focus (global, `base.css`): `:focus-visible { outline:2px solid
  var(--moss); outline-offset:2px }`; dark: `--gold-soft`. Never removed.
- Reduced motion (`base.css`): `prefers-reduced-motion:reduce` forces
  animation/transition durations to `0.01ms`.

## 7. Tables (`css/components.css`)

- `.table-wrap`: horizontal scroll container, 1px `--line` border,
  16px radius, surface fill.
- `table.tbl`: 100% width, 15px, `min-width:640px`, collapsed borders.
  Header: 14px/600 muted, left, `12px 16px` padding, sticky top, surface
  background. Cells: `12px 16px`, 1px `--line` row rules, 48px min row
  height, middle vertical alignment. Zebra: even rows `--wash`.
  Row click: `cursor:pointer` on `tr[data-href]`.
- Phones (≤639px, `.stack-cards`): table becomes stacked cards — thead
  hidden, each row a surface card (16px radius, 1px border, 12px bottom
  margin), cells flex label/value via `data-label` (`::before`, 700,
  muted, 14px).
- Pagination: flex, right-aligned, 12px gap, 14px; per-page select 44px
  min-height.

## 8. Badges, chips, filters

- `.badge`: inline-flex, gap 6px, 14px/700, pill, `--wash` fill,
  ink-strong text, `white-space:nowrap`; 6px dot (`currentColor`).
  No gold badges.
- `.chip`: 44px min-height, pill, 1px `--line-strong` border, surface
  fill, 14px/600; active (`aria-pressed="true"`): forest fill, ivory text.
- `.filters`: flex, wrap, 12px gap, 16px bottom margin. `.search-box`:
  flex 1, `min-width:220px`.
- Stat grid (`.stat-grid`): 2 columns mobile, 4 at ≥900px; 1px `--line`
  rules between stats (no boxes); `.stat` padding 20px, hover `--wash`.

## 9. Cards, lists, timeline

- `.card`: surface, 1px `--line` border, 16px radius, 20px padding,
  20px bottom margin. `h3` 12px bottom margin.
- `.list-row`: flex, 12px gap, `12px 0` padding, 1px `--line` bottom rule.
- Meridian timeline (`.meridian`): vertical 1px `--gold-line` at left 9px;
  nodes 19px circles, 2px `--line-strong` border, surface fill; done =
  forest fill + ✓; current = `--gold-line` border + 3px `--gold-soft`
  ring + 6px gold dot; label 700; time 14px muted.
- 999 disclaimer (`.disclaimer-999`): 1px `--gold-line` border, 4px left
  border, 12px radius, 12px/16px padding, 15px. Permanent on every
  expatriate screen.
- Demo badge (`.demo-badge`, `base.css`): 13px/700 pill, `--wash` fill,
  1px `--line` border, 6px gold dot prefix.

## 10. Modal, drawer, toast (`css/components.css`)

- Modal: fixed backdrop `rgba(11,26,21,.5)`, z-index 100; sheet
  `max-width:520px`, 20px radius (bottom sheet with top-only radius on
  mobile), 24px padding, `--shadow-sheet`, slides up 300ms
  (`--ease-product`). Actions: flex, right-aligned, 12px gap, wrap.
- Drawer (`.drawer`): fixed right, `min(480px,100%)` wide, full height,
  24px padding, slides in 300ms; on ≤639px it becomes a bottom sheet
  (`max-height:82vh`, top radius 20px).
- Mobile nav sheet (`.mobile-sheet`, `shell.css`): fixed bottom,
  `max-height:82vh`, 20px top radius, `12px 12px 28px` padding.
- Toasts (`#toasts`): fixed bottom-right (bottom-centre on mobile),
  `max-width:min(420px,calc(100vw - 32px))`, 8px gap; `.toast`: surface,
  1px `--line` border, 12px radius, `--shadow-sheet`, 12px/16px padding,
  rises 200ms; dismiss button 44px, 18px.
- Animations: `sheetUp` (translateY 40px → 0, 300ms), `drawerIn`
  (translateX 40px, 300ms), `toastIn` (translateY 8px, 200ms).

## 11. Navigation states

- Sidebar item hover: `--wash` background. Active: gold dot only.
- Topbar language segment: active = forest fill.
- Chips: active = forest fill.
- Table row hover: `--wash`.
- Stat link hover: `--wash`.
- Skip link (`.skip-link`, `base.css`): absolute, off-screen (`top:-48px`)
  until focused, then forest pill at `top:12px`. Screen-reader-only
  utility (`.sr-only`) uses the standard clip pattern.

## 12. Empty / loading / error states (`css/components.css`)

- `.empty`: 32px/16px padding, centred, muted text.
- `.skeleton`: `--wash` fill, 12px radius, 20px min-height, 8px bottom
  margin.
- `.error-box`: 1px `--danger` border, 16px radius, 20px padding, surface.
- Error summary: see §6. No illustration, no joke copy — plain sentence +
  one action.

## 13. Colour budget (per screen, Direction D §11)

- ≤2 forest fields per screen; gold = 1 line + ≤3 points per viewport.
- No green section backgrounds, no green cards, no gold-tinted cards, no
  decorative shapes. Green fills: buttons, progress fill, hero/footer
  fields only. Tables: 1px `--line` rules, `--wash` zebra.
- Gold/brass text below 32px: zero (gold `#C49A4A` on `--ground` is
  2.51:1 — never text on light; `--gold-soft` on forest is 7.25:1).
