# DESIGN_SYSTEM.md — Satanipara Community, DIRECTION D
## "One gold line, from 1999 to your request today"

Date: 2026-11-14 | Status: direction-D token system + component rules (design only — no build).
Client: Satanipara Somaj Kallyan Sangha (est. 1999). Brand: Satanipara Community.
Tagline: একটি এলাকা, একটি পরিবার. Slogan: শিক্ষা • ঐক্য • শান্তি • প্রগতি.
Audience: ordinary Bangladeshi local residents + expatriates; Bengali-first.
All content DEMO only — no real people, stats, or finance invented.

Direction D is a deliberate break from the rejected broadsheet direction
(`../redesign/CREATIVE_DIRECTION.md`): no ivory-always ground, no serif display,
no hairline-rule-everywhere, no masthead, no dateline/ledger devices.
Synthesis: (a) international award-winning editorial design, (b) Apple-inspired
premium product UI, (c) modern community-platform function, (d) Bengali identity.
Identity colours kept: Forest Green `#173F35`, Gold `#C49A4A`, Ivory `#F7F4EA` —
redistributed, not repeated.

---

## 1. The one memorable idea — The Meridian

**One continuous 1px gold line runs down the page, and it does two real jobs.**

1. **Heritage timeline.** On the home page it descends from the hero and carries
   the community's story from 1999 to today: dated nodes (founding, first school
   support, first expatriate programme, today). It is a timeline because the
   content *is* a sequence — the one place numbered/dated markers are earned.
2. **Service status line.** On the expatriate tracking page the same line becomes
   the request timeline: Pending → Accepted → In Progress → Completed, with the
   gold line filling downward as the request advances. One line, one meaning:
   *where this community — and your request — stands in time.*

**What stays quiet around it:** white ground, one sans family for display and
body, neutral hairlines for every other separation, no other gold anywhere near
it. The Meridian is the only gold line on the page. If a mockup shows a second
gold rule, a gold button, or a gold underline, one of them is wrong.

**Hero staging (the Meridian's origin):** the hero is a full-bleed deep-forest
field (`--deep #102E27`, min-height 92vh desktop / auto on mobile). The Meridian
starts at the hero's baseline and drops from it. Monumental Bengali sans type in
ivory (`একটি এলাকা, একটি পরিবার` at hero scale), one supporting line, two actions
max. The hero is the site's one dark field; the rest of the page is light.

---

## 2. Colour — distribution, not decoration

### 2.1 Tokens

```css
:root{
  /* Identity (unchanged) */
  --forest:#173F35; --gold:#C49A4A; --ivory:#F7F4EA;
  /* Field greens — used as large surfaces, never as scattered fills */
  --deep:#102E27;      /* hero field, footer field */
  --abyss:#0B1A15;     /* hero field in dark mode */
  --pine:#1E4A3C;      /* pressed / hover on forest, progress fill */
  --moss:#2F6B4F;      /* links on light, success, focus ring */
  /* Gold — line and point only, never a field, never small text */
  --gold-soft:#E4C98F; /* gold text on forest only (7.25:1), large numerals */
  --gold-line:#C49A4A; /* the Meridian, 1px */
  /* Grounds */
  --ground:#FBFBF8;    /* page ground, light mode — cool white, NOT ivory */
  --surface:#FFFFFF;   /* product sheets, form sheets, search surfaces */
  --paper:#F7F4EA;     /* ivory reserved: story/feature sections ONLY */
  --wash:#F0F2EF;      /* neutral tint for alternating service rows */
  /* Ink */
  --ink:#1E2A25;       /* body text on light */
  --ink-strong:#102E27;/* display text on light */
  --muted:#5A6B62;     /* secondary text on light (5.45:1 on --ground) */
  --line:#E3E6E1;      /* neutral hairline (no warm tint, no gold) */
  --line-strong:#C9CFC9;
  /* Status */
  --ok:#2F6B4F; --danger:#9B2C2C; --warn:#8A5A00; --info:#2F6B4F;
  /* Shape / motion */
  --radius-sm:12px; --radius-md:16px; --radius-lg:20px; --radius-pill:999px;
  --shadow-sheet:0 8px 30px rgba(16,46,39,.12);
  --shadow-lift:0 2px 10px rgba(16,46,39,.08);
  --ease-product:cubic-bezier(.32,.72,0,1);
  --dur-fast:200ms; --dur-med:300ms; --dur-slow:500ms;
}
[data-theme="dark"]{
  --ground:#0E1F1A; --surface:#14261F; --surface-2:#1B322A;
  --paper:#122019;      /* ivory becomes a deep green-ink paper, never light */
  --wash:#16281F;
  --ink:#F2EFE3; --ink-strong:#FBFBF8; --muted:#B9C9BE; /* 9.89:1 on --ground */
  --line:#2A4A3E; --line-strong:#3D5C4E;
  --forest:#E9EFEA;     /* forest flips to light ink for text on dark */
  --deep:#0B1A15; --gold-line:#C49A4A; /* gold on dark ground: 6.56:1 */
  --shadow-sheet:0 12px 40px rgba(0,0,0,.45);
}
```

### 2.2 Measured contrast (computed, not claimed)

| Pair | Ratio | Verdict |
|---|---|---|
| `--ink #1E2A25` on `--ground #FBFBF8` | 14.33:1 | Body ✓ |
| `--muted #5A6B62` on `--ground #FBFBF8` | 5.45:1 | Secondary ✓ |
| `--forest #173F35` on `--ground #FBFBF8` | 11.26:1 | Display / links ✓ |
| `--moss #2F6B4F` on `--ground #FBFBF8` | 6.07:1 | Links, success ✓ |
| `--ivory #F7F4EA` on `--forest #173F35` | 10.61:1 | Button text ✓ |
| `--gold-soft #E4C98F` on `--forest #173F35` | 7.25:1 | Gold text on forest ✓ |
| `--gold #C49A4A` on `--forest #173F35` | 4.49:1 | Large text/UI only, borderline — never body |
| `--gold #C49A4A` on `--ground #FBFBF8` | 2.51:1 | **Never text on light** |
| `--brass #9A7B2E` on `--ivory #F7F4EA` | 3.64:1 | **Fails 4.5:1 — brass small text is banned in D** (the broadsheet's brass claim does not hold) |
| `--muted #B9C9BE` on dark `--ground #0E1F1A` | 9.89:1 | Dark secondary ✓ |
| `--gold #C49A4A` on dark `--ground #0E1F1A` | 6.56:1 | Meridian + large numerals in dark ✓ |

**Rule that follows:** gold is never body or small text, in either theme. Gold
appears as a 1px line, a 6px status dot, or a ≥32px numeral. Small gold-coloured
text does not exist in this system.

### 2.3 Colour budget — per page, enforced

| Surface | Light-mode budget | Where |
|---|---|---|
| Deep-forest field (`--deep`) | **Max 2 per page**: hero + footer, OR hero + one service band | Hero, footer; the expatriate band may replace the footer field on that page, never add a third |
| Ivory (`--paper`) | **Max 30% of page area**, story sections only | Feature story, one history section |
| Gold | **1 line (the Meridian) + ≤3 point accents per viewport** (status dot, active nav dot, one large numeral) | Meridian, tracking nodes, active states |
| White / `--ground` | The default — ≥60% of every page | Everything else |
| Green fills | Buttons, progress fill, and the hero/footer fields only — never a content card, never a section background | See §2.4 |

### 2.4 What green and gold may never do

- No green section backgrounds between white sections (no alternating paint).
- No gold buttons, gold button outlines, or gold gradients — the primary button
  is forest fill, always.
- No green cards, no gold-tinted cards, no tinted "feature" tiles.
- No decorative green shapes, blobs, or patterns. The only green shapes on the
  site are the hero field, the footer field, and the Meridian's nodes.

---

## 3. Typography

The typography researcher's eventual family choice governs the *families*; this
scale governs the *roles, sizes, weights, and leading* and stands regardless of
which family is chosen. Direction D's structural choice: **display is sans, not
serif.** Serif is demoted to a single voice — the pull quote — and never sets a
headline. (Broadsheet: Tiro serif display. D: Anek Bangla 700/800 display /
Inter 700/800 for English; Tiro appears only as italic quote text, max once per
story page.)

| Role | Size | Weight | Leading | Notes |
|---|---|---|---|---|
| Hero statement | `clamp(3rem, 8vw, 5.5rem)` | 800 | 1.15 | BN sans; EN `letter-spacing:-0.03em`; BN never letter-spaced |
| Page title | `clamp(2.25rem, 5vw, 3.5rem)` | 700 | 1.20 | |
| Section title | `clamp(1.75rem, 3.5vw, 2.5rem)` | 700 | 1.25 | Sentence case, never ALL-CAPS |
| Subsection | 20px | 700 | 1.40 | |
| Body (BN) | 17px | 400 | 1.80 | Bengali never below 15px |
| Body (EN) | 16px | 400 | 1.65 | |
| Small / caption | 14px | 500 | 1.60 | |
| Label / nav / button | 15–16px | 600 | 1.50 | Buttons 600 |
| Stat numeral | `clamp(2.5rem, 6vw, 4rem)` | 800 | 1.05 | Tabular numerals; label beneath in 14px muted |
| Request ID / data | 20–28px, 700 | — | 1.30 | Latin only, tabular, generous tracking 0.02em |

- Line length < 72 characters for body (tighter than the broadsheet's 80 —
  product UI reads narrower); display lines break on meaning, never mid-phrase.
- No single-word accent in headlines (no italic/coloured word). Emphasis comes
  from size, weight, and placement — the whole statement carries, or it doesn't.
- No ALL-CAPS labels anywhere (no tracked-out eyebrows). Section introductions
  are a 15px/600 forest sentence, not a kicker label.
- Numerals: Bengali ০–৯ in Bengali copy; Latin only in Request IDs
  (EXP-2026-XXXX), phone numbers as typed, and stat numerals paired with
  Bengali labels (tabular figures keep columns aligned).
- Never fake-bold or fake-italic; below ~28px, display weight steps down to 700.

---

## 4. Layout system

### 4.1 Grid & containers

- 12-column grid, container **1200px**, gutters **24px desktop / 16px mobile**.
- Breakpoints: **360 / 640 / 900 / 1200 / 1440**. Mobile-first; below 900px a
  single column in reading order.
- **Asymmetric offsets (the anti-template rule):** desktop sections do not all
  start at column 1. Story sections start at column 2–3 with a 7-column measure;
  service interfaces sit in a centred 8-column sheet; stats span full width.
  No two consecutive homepage sections share the same column span.
- Section padding: **96px vertical desktop / 64px mobile**; service interfaces
  use denser **48px/32px** rhythm (product surfaces breathe less than stories).
- Spacing scale (4pt base): `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128px`.
  Section gaps are 96px; inside a service sheet, gaps are 16–24px.

### 4.2 Homepage — one composition per section (never a repeated card grid)

| # | Section | Composition (desktop) | Mobile |
|---|---|---|---|
| 1 | Announcement strip | 36px strip *above* the nav, forest text on ivory, dismissible; scrolls away, never touches the hero | Same, single line, truncates |
| 2 | Nav | Sticky frosted bar (see §6) | 56px single row (see §6) |
| 3 | Hero — "product stage" | Full-bleed `--deep` field, 92vh; left-aligned monumental sans statement (cols 1–8); right column (9–12) holds a live miniature: next event + open request count as quiet product data; Meridian starts at hero baseline | Field stacks; statement first, data as a horizontal row beneath; min-height auto |
| 4 | Storytelling | Full-bleed image, ivory `--paper` panel overlapping its lower-left third with the story in 20px/700 + body; one image, one story | Image 16:10, panel below it, no overlap |
| 5 | Stats | Single horizontal row of 4 giant numerals separated by 1px neutral rules — no cards, no boxes; unverified figures read "তথ্য হালনাগাদ হচ্ছে", never invented | 2×2, rules only between rows |
| 6 | Service discovery | Two-column split: left = the 4 tasks as large 56px rows (icon + name + one-line plain description + chevron), right = the Meridian's first heritage nodes (1999 → today) | Rows stack; heritage nodes follow |
| 7 | Expatriate | Dark `--deep` band (the page's second forest field): white product sheet (radius 20px, `--shadow-sheet`) floating centred, 8 cols — the request form's first step visible inline as a teaser, "আবেদন শুরু করুন" opens the full flow | Sheet full-width, radius 16px |
| 8 | Blood donor | Search-first interface: a 56px search field *is* the section header area; filter chips below; results as rows (see §7) | Search full-width, chips scroll horizontally |
| 9 | Activities / events | Horizontal scroll rail of event panels (snap, 320px wide, image-top) — the only horizontal-scroll element on the page; year archive as a Meridian branch | Rail scrolls natively, snap |
| 10 | Stories | One large feature (image + person, consented) left, 3 compact text stories right as ruled rows | Feature, then rows |
| 11 | Gallery | Asymmetric mosaic: one large 8-col image, two 4-col, one full-width — no uniform grid, no repeated image | Single column, same order |
| 12 | Transparency | Ledger table with one large total row; the single gold use here is the Meridian dot beside the current year | Table scrolls horizontally inside its sheet, sticky first column |
| 13 | Closing + footer | `--deep` footer field with the giant wordmark "সাতানীপাড়া" at 96px/800 in 12% ivory, links in 3 columns, slogan as the final line | Wordmark 48px, links stack |

### 4.3 Inner pages

Every inner page: breadcrumb (14px, muted, chevron-separated), page title,
one-line plain purpose sentence, then the page's own composition. Deep pages
(directory, organisation, history, constitution, committee, reports, member
dashboard) share the *sheet* pattern (§7) but never the same internal layout
twice in a row — directory is an index list, history is the Meridian, finance
is a ledger, committee is a ruled roster.

---

## 5. Motion

- **One orchestrated moment, max — the hero load (600ms total):** the Meridian
  draws downward (`scaleY 0→1`, 700ms, `--ease-product`); headline lines rise
  24px→0 and fade in, staggered 60ms; the right-column data fades last. Then
  stillness. No scroll-reveal choreography on any other section.
- **Motion that answers actions only:** sheet slides up 300ms on open; step
  transitions slide 24px horizontally, 300ms; toggles and switches animate
  200ms; progress fill animates 500ms on status change; toast rises 200ms.
- **Timing rules (ui-ux-pro-max quick-reference):** exits run at 60–70% of
  enter duration; list stagger 40ms per item, max 5 items; all animation
  interruptible — a tap cancels an in-progress animation immediately.
- **Easing:** `--ease-product: cubic-bezier(.32,.72,0,1)` (spring-like, Apple
  register) for entrances; `ease-out` for exits. Never linear, never a single
  duration for everything.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` disables the
  hero sequence, stagger, and parallax entirely; state changes become instant
  with no fade. No infinite animation, no parallax on task screens, no
  auto-playing carousel anywhere.

---

## 6. Navigation

- **Desktop bar:** 64px, sticky, `background: color-mix(in srgb, var(--ground) 82%, transparent)` + `backdrop-filter: blur(12px)` + 1px `--line` bottom
  border. Backdrop blur is allowed *only* here — it is functional (content
  passes beneath a sticky bar), never decoration on cards or sheets.
- **Contents (left → right):** crest 32px + wordmark "সাতানীপাড়া কমিউনিটি"
  (Anek 700, 18px) · centre links: হোম, আমাদের সম্পর্কে, কার্যক্রম, প্রবাসী
  সহায়তা, রক্তদাতা, নোটিশ, হিসাব, যোগাযোগ (15px/600) · right: BN/EN toggle
  (segmented pill), theme toggle (icon + label), primary CTA pill "সাহায্যের
  আবেদন" (forest fill, ivory text, 44px).
- **Active state:** a 6px gold dot *beneath* the active link (the only gold in
  the nav), never an underline, never a gold background.
- **Mobile (≤900px): 56px, single row, no exceptions:** crest + wordmark
  (truncated) · language toggle · menu button. The CTA and theme toggle move
  *inside* the menu sheet. Tapping the menu opens a full-screen sheet sliding
  up from the bottom (300ms, `--ease-product`): 8 nav items as 56px rows,
  then the CTA pill full-width, then theme/language rows. Esc / swipe-down /
  backdrop tap closes; focus is trapped while open and returns to the menu
  button on close.
- **Announcement ticker:** 36px strip *above* the nav (scrolls away with the
  page), forest text on ivory, one message, dismiss button (44px). It never
  touches the hero: the sticky nav sits between ticker and hero at all times,
  and the hero begins ≥48px below the nav.
- **Breadcrumbs** on inner pages (14px muted, chevron separators, current page
  in `--ink`, not a link). **Back behaviour** is predictable: browser back
  preserves scroll and form drafts (autosaved, §7).

---

## 7. Service interfaces as product UI

Design rule: a service screen reads like a product screen — one task, one
sheet, generous spacing, visible progress, plain-language feedback. No
editorial flourishes inside a form.

### 7.1 Expatriate request — multi-step sheet

- **Container:** white `--surface` sheet, radius 20px, `--shadow-sheet`, max
  720px, centred inside the dark `--deep` band on the landing section; on its
  own page, the sheet sits on `--ground` with 48px top clearance.
- **Steps (4, true sequence — numbered markers earned here):** 1 Applicant →
  2 Need & details → 3 Documents/contact → 4 Review & submit. Progress: a
  2px neutral track with a forest fill (animated 500ms), step names in 14px/600
  above the track, current step in `--forest`, completed steps show a check.
  Back is always available; drafts autosave to localStorage on every change
  (ui-ux-pro-max `form-autosave`); leaving with unsaved changes asks once.
- **Fields:** 48px controls, radius 12px, 1px `--line-strong` border, visible
  `<label>` above every field (never placeholder-only), helper text in 14px
  muted beneath, `autocomplete` + semantic `inputmode` (tel/email) so the
  correct mobile keyboard appears. Focus: 2px `--moss` outline + 2px offset,
  never removed.
- **Validation:** on blur, not keystroke; error text directly under the field
  in `--danger` 14px stating cause + fix ("ফোন নম্বরটি ১১ সংখ্যার হতে হবে —
  ০১ দিয়ে শুরু করুন"); on failed submit, a focusable error summary at the top
  links to each invalid field and focus moves to it (`error-summary`,
  `focus-management`).
- **Review step:** a plain read-only summary (label/value rows, ruled) with an
  "Edit" link per group — read-only is visually distinct from disabled.
- **Submit:** primary pill, same label through the flow ("আবেদন জমা দিন" →
  toast "আবেদন জমা হয়েছে"). Success replaces the sheet: a large Request ID
  (28px/700, Latin, tabular), a copy button, and the Meridian mini-timeline
  showing step 1 of 4 complete. No confetti, no illustration.

### 7.2 Tracking timeline — the Meridian as product

- Vertical gold line, 4 nodes: Pending / Accepted / In Progress / Completed.
  Node states: completed = filled forest circle + check; current = gold ring
  with pulsing dot (motion stops under reduced-motion) + "চলমান" label;
  upcoming = hollow neutral circle. Status is *never colour alone* — every
  node carries text + icon. Timestamps beneath each completed node; the current
  node's expected next action is written in plain Bengali ("সহায়ক দলের
  পর্যালোচনায় আছে — সাধারণত ২৪ ঘণ্টার মধ্যে জানানো হয়"). `aria-live="polite"`
  announces status changes. Expenses, if any, list as ruled rows under the
  timeline (actual cost + transport, borne by applicant — no service charge,
  stated once in plain text).

### 7.3 Blood-donor search — search-first product

- A 56px search field (radius 999px, `--surface`, `--shadow-lift`) with a
  magnifier icon and a clear button; filter chips beneath (blood group, area):
  pill chips, 44px, forest fill when active, neutral outline when not.
- Results are **rows, not cards**: donor name (16px/600) · group badge (pill,
  forest text on `--wash`, 14px/700 — never a coloured disc alone) · area ·
  last-donation note · a 44px "ফোন দেখুন" button. Phone numbers stay masked
  until the donor's consent action; revealing requires a tap and shows the
  number with a "consent given" note. Empty state: "এই গ্রুপে এখন কোনো দাতা
  পাওয়া যায়নি — নিকটস্থ গ্রুপ দেখুন" + a button to widen the search.
- Emergency request is a separate, clearly-marked action ("জরুরি রক্তের
  আবেদন") — it opens a short form, not the directory, and states plainly that
  this is a community request channel, not an ambulance service.

### 7.4 Directory, organisation, finance — product surfaces

- **Directory (people/professionals/institutions):** an index list — sticky
  section letters (Bengali initials) on the left rail, rows with name, role,
  area, and one action. Search at top, 48px. No avatars as decoration; initials
  in a 40px neutral circle only where a photo is absent.
- **Organisation (committee/council/leaders):** a ruled roster — name, role,
  term — with the current committee distinguished by a forest left-border
  (3px) on its rows, not by a coloured card.
- **Finance:** a ledger table — date, description, in/out, balance — with
  zebra rows in `--wash`, a sticky header, and one large total row (28px/800
  numerals). Annual reports download as ruled rows with file size and year.
  All figures demo-labelled until real accounts exist; empty ledgers say
  "তথ্য হালনাগাদ হচ্ছে", never show invented totals.

---

## 8. Components

### 8.1 Buttons

| Variant | Style | Use |
|---|---|---|
| Primary | Forest fill `#173F35`, ivory text, pill 999px, min-height 48px, padding 0 28px, 600/16px | The one action per screen |
| Secondary | 1px `--line-strong` border, `--ink` text, pill, 48px | The second action |
| Quiet | Text only, `--forest`, 600; hover/focus adds a 2px forest underline (never gold, never an arrow) | Tertiary links |
| Destructive | `--danger` text + 1px danger border, pill | Cancel/delete, visually separated from primary |
| Icon-only | 44×44px, `aria-label` required, never icon alone without a label | Toggles, close, clear |

Hover: 200ms background shift (`--forest` → `--pine`); active: scale .98;
disabled: 40% opacity + `not-allowed`, never clickable-looking. Loading:
spinner replaces label, button stays the same width (no layout shift).

### 8.2 Forms, badges, tables, toasts

- **Forms:** §7.1. Selects and date inputs match the 48px/12px control spec.
  Switches: iOS-style 52×32px track, forest when on, with a visible label.
- **Badges:** pill, 14px/700, forest text on `--wash`; status badges pair text
  with a 6px dot (never colour alone). No gold badges.
- **Tables:** 15px body, 14px/600 header in muted, 1px `--line` row rules,
  `--wash` zebra, sticky header on long tables, 48px row minimum on touch.
- **Toasts:** bottom-centre on mobile, bottom-right on desktop; `--surface`,
  radius 12px, `--shadow-sheet`, icon + one sentence, same verb as the action
  ("আবেদন জমা হয়েছে"), auto-dismiss 5s, `role="status"`, dismiss button 44px.
  Browser-notification permission is requested only after a helper enables it
  in settings — never on first visit.
- **Empty states:** plain sentence + one action ("তথ্য হালনাগাদ হচ্ছে" or
  "এখনো কোনো আবেদন নেই — প্রথম আবেদনটি করুন"). No illustration, no joke.
- **Loading states:** skeleton rows in `--wash` with reserved space (CLS < 0.1),
  never a spinner alone on a blank page; content fades in 200ms when ready.
- **Error states:** cause + fix in plain Bengali, retry action present, error
  summary focusable (§7.1). **Success states:** confirmation + the artefact
  (Request ID, receipt) + next step, in that order.

### 8.3 Imagery

- One decisive image per section; real community photos with consent and a
  caption (place/date); until real photos exist, clearly-labelled demo imagery
  (নমুনা) or crest-led typographic compositions. No stock "community", no clip
  art, no decorative illustration substituting for content.
- Images are full-bleed or edge-to-edge inside their composition — never inside
  a rounded card with a shadow. Aspect ratios: hero-adjacent 16:10, story 4:3,
  gallery mosaic per §4.2. `loading="lazy"` below the fold; width/height set
  (no layout shift); `alt` text in Bengali describing the scene, empty `alt`
  for purely decorative images (`aria-hidden`).
- Dark mode never auto-inverts images; a 4% black overlay may be added only
  where caption text sits on a photo.

---

## 9. Dark mode

Token swap only (§2.1) — no separate design. Rules: the hero field deepens
(`--deep` → `--abyss #0B1A15`); the Meridian stays gold (6.56:1 on dark ground);
ivory `--paper` becomes deep green-ink `#122019`, never a light surface;
shadows deepen; focus ring becomes `--gold-soft` on dark. Contrast is re-checked
per theme, never inferred from light mode. Images are not inverted.

---

## 10. Accessibility (non-negotiable)

- Contrast ≥4.5:1 for all body text in both themes (measured table §2.2);
  ≥3:1 for large text and UI components.
- Visible focus everywhere: 2px `--moss` outline + 2px offset on light,
  `--gold-soft` on dark; focus is never obscured by the sticky nav or ticker
  (WCAG 2.2 `focus-not-obscured` — sticky bars reserve space, sheets return
  focus on close).
- Touch targets ≥44px (controls 48px, nav rows 56px, chips 44px), ≥8px between
  adjacent targets; no hover-only interaction.
- Keyboard: full tab order = visual order; skip link first; Esc closes
  sheets/menus/lightbox; arrow keys navigate gallery and step flows; every
  interactive element reachable and operable without a pointer.
- Screen readers: semantic HTML (`header/nav/main/footer`, `h1` once per page),
  `aria-hidden` on decorative icons, `aria-live` for toasts and timeline
  updates, labelled form controls, status never conveyed by colour alone.
- Motion: `prefers-reduced-motion` disables the hero sequence and all
  non-essential animation (§5).
- Language: `lang="bn"` on Bengali blocks, `lang="en"` on English runs;
  numerals per §3. Zoom is never disabled; layout holds at 200% zoom and at
  360px width with no horizontal scroll.

---

## 11. Breakpoints & QA gates

- **Breakpoints:** 360 / 640 / 900 / 1200 / 1440. Checks at 360, 768, 1024,
  1440px in both themes.
- **Gates:** (1) Phone-first: hero, Meridian, and all four task entries
  readable/tappable at 360px before desktop polish. (2) Colour-budget audit:
  count forest fields (≤2) and gold occurrences (1 line + ≤3 points/viewport)
  on every page. (3) Gold-text audit: zero gold/brass text below 32px.
  (4) Typography screenshot QA: conjuncts, numerals, mixed BN/EN, no synthetic
  bold/italic. (5) Plain-language read-aloud of every task screen.
  (6) Real-photo gate: no photo ships as community without consent + caption;
  demo imagery stays labelled নমুনা. (7) Console 0 errors; no horizontal
  overflow at 360px; CLS < 0.1.

---

## 12. Sources applied (ui-ux-pro-max search, 2026-11-14)

Search script run by full path
(`redesign/.agents/skills/ui-ux-pro-max/scripts/search.py`, python3):

| Query | Result | Use in D |
|---|---|---|
| `"community platform membership services Bengali" --design-system` | Pattern "Hero + Testimonials + CTA"; style "Vibrant & Block-based" (purple `#7C3AED`); type Cormorant/Crimson Pro | **Mostly rejected** — purple palette and block style contradict the brief's Forest/Gold/Ivory and the no-card rule. Kept only: social-proof-before-CTA ordering and the pre-delivery checklist (no emoji icons, visible focus, reduced-motion, 375/768/1024/1440 checks) |
| `"minimal premium product interface" --domain style` | Minimalism & Swiss Style: grid-based, spacious, single accent, no shadows/gradients, low a11y risk | **Adopted as structural spine** — grid discipline, single accent (the Meridian), no decoration |
| `"community membership platform" --domain product` | Membership/Community: Social Proof-Focused + Conversion landing; Q&A Community: Minimalism + Flat, clean white + gold reputation accents | **Partially adopted** — social proof after hero (stories §4.2 #10); clean-white ground with gold used sparingly echoes D's distribution |
| `"clean sans serif large type" --domain typography` | "Bold Typography Mobile (Inter Poster)": type-as-hero, 12px labels → 72px hero statement, tight tracking | **Adopted, adapted to Bengali** — type-as-hero at 88px max, tight EN tracking, no BN tracking |
| `"deep green gold premium" --domain color` | Luxury/Premium Brand: warm stone `#FAFAF9` ground, near-black + gold `#A16207` accent | **Adapted** — warm near-white ground kept (`--ground #FBFBF8`); near-black replaced by forest as the dark field; gold kept as accent, never as text |
| `references/quick-reference.md` (read on demand) | `multi-step-progress`, `form-autosave`, `inline-validation`, `error-clarity`, `error-summary`, `focus-management`, `escape-routes`, `focus-not-obscured`, `spring-physics`, `exit-faster-than-enter`, `stagger-sequence`, `interruptible`, `nav-hierarchy`, `back-behavior`, `deep-linking`, `touch-friendly-input` | Applied in §§5–7 as cited |

`frontend-design` skill applied: one memorable element (the Meridian), boldness
spent in one place (hero field + line), two-pass plan-then-review (this document
is the plan; the rationale's self-critique is the review), and its default-tell
list avoided — see `DESIGN_RATIONALE.md` §4.
