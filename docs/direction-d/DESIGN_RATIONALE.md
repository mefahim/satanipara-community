# DESIGN_RATIONALE.md — Satanipara Community, DIRECTION D

Date: 2026-11-14 | Companion to `DESIGN_SYSTEM.md` (tokens + components).
Direction D: **"One gold line, from 1999 to your request today."**

## 1. Typography

The broadsheet made serif display the brand. D inverts the choice: **display is
sans** (Anek Bangla 700/800; Inter for English), because the brief's second
ingredient is Apple-grade product UI, and Apple's voice is confident grotesque
type at large sizes with tight leading — not editorial serif. Serif survives in
exactly one voice, the pull quote, so the page never reads as a newspaper.
Hierarchy is carried by size and weight alone: hero 88px max / section 40px /
body 17px Bengali, with Bengali leading at 1.8 (Bengali needs air; Latin sits
at 1.65). No letter-spacing on Bengali ever; English display tightens to
-0.03em. No ALL-CAPS labels and no single-word accent in headlines — both are
frontend-design default tells, and neither is needed when the whole statement
is set at 88px. Stat numerals are tabular so ledger columns align; Request IDs
stay Latin and tabular so they can be copied and read aloud without ambiguity.

## 2. Visual hierarchy

One thing is loud — the deep-forest hero field with monumental ivory type —
and one thing is precious — the 1px gold Meridian descending from it. Everything
else is deliberately quiet: cool-white ground, neutral hairlines, one sans
family, forest buttons. The hierarchy is therefore *spatial*, not decorative:
the eye goes hero → Meridian nodes → tasks, because the gold line literally
leads it there. Sections are told apart by composition (full-bleed image,
numeral row, split list, dark band, search-first, scroll rail, mosaic, ledger),
never by paint — no section gets a background colour just to mark "new
section". Colour is budgeted like a material: two forest fields per page, one
gold line, ivory capped at 30% and confined to story sections. This is what
makes the direction premium in the Apple sense: restraint you can count.

## 3. Layout

A 12-column grid (1200px, 24px gutters) with **asymmetric offsets** — story
sections start at column 2–3, service sheets centre on 8 columns, stats span
full width — so no two consecutive sections share a span and the page never
settles into the identical-card-grid rhythm that marks a generated page. The
homepage's 13 beats each get their own composition (see DESIGN_SYSTEM §4.2);
the Meridian is the only repeating structural device, and it earns repetition
because it is also the product's status line. Mobile is a single reading column
below 900px, header capped at 56px in one row, ticker parked above the nav so
it can never touch the hero.

## 4. Interaction decisions

Product UI, not pages about a product: the expatriate flow is a sheet with a
4-step progress track, autosaved drafts, blur-validation, and a focusable error
summary (ui-ux-pro-max quick-reference rules, applied as cited). The tracking
page reuses the Meridian as a live status line — the site's metaphor and its
function are the same object, which is the strongest kind of design decision.
Motion is one orchestrated hero moment (600ms: line draws, lines rise) plus
motion that answers actions (sheet up, step slide, progress fill); exits run
at 60–70% of enters; everything is interruptible and fully disabled under
`prefers-reduced-motion`. The nav's backdrop blur is the single sanctioned
blur — functional, on the sticky bar only; no glass anywhere else.

## 5. Broadsheet vs Direction D

| Axis | Broadsheet (rejected) | Direction D |
|---|---|---|
| Ground | Ivory `#F7F4EA` always, paper `#FFFDF6` surfaces | Cool white `#FBFBF8` ground; ivory reserved for story sections only (≤30%) |
| Type role | Tiro serif display is the brand; sans is quiet body | Sans display (Anek 700/800) is the brand; serif demoted to pull quotes only |
| Colour use | Forest as ink/structure; gold as thin rules everywhere a section breaks | Forest as two large fields (hero + footer/service band); gold as ONE continuous line + ≤3 point accents per viewport |
| Section rhythm | Ivory → paper → ivory, hairline + kicker marks each section | Rhythm from composition, not paint: 13 distinct homepage compositions, no repeated card grid |
| Imagery treatment | One decisive image per section, crest-led typographic fallbacks | Images full-bleed / edge-to-edge, never inside rounded cards; mosaic gallery; story image overlapped by an ivory panel |
| Nav | Masthead: crest + serif wordmark, gold underline on active item | Frosted app bar (blur only here), 64px/56px, gold *dot* under active link, menu as a bottom sheet on mobile |
| Devices | Dateline, ledger, gold rules, numbered 1-2-3-4 steps | The Meridian: one gold line that is both the 1999→today timeline and the request status line |
| Motion | Fade/rise 180–320ms reveals | One 600ms orchestrated hero moment + action-answering motion only |
| Buttons | Forest fill primary (same) | Forest fill primary (same) — but gold buttons banned in both; D additionally bans gold underlines on quiet links |

## 6. What was deliberately NOT used — and why

- **Serif display headlines.** The broadsheet's signature; repeating it would
  make D a re-skin, not a new direction. Sans display is also the Apple
  ingredient the brief asks for.
- **Ivory-always ground.** Cream + serif + broadsheet is frontend-design's
  first listed generated-page default. D keeps ivory as a *material* (story
  paper), not as the air the site breathes.
- **Gold rules between sections / gold underlines / gold buttons.** Gold spent
  everywhere is gold spent nowhere. One line, budgeted, is memorable; a rule
  under every heading is wallpaper.
- **Numbered 01/02/03 markers.** Only used where content is truly a sequence
  (the 4-step form, the dated timeline). Decorative numbering on services or
  features is a default tell.
- **Tracked-out ALL-CAPS eyebrows above every heading.** Replaced by a single
  15px/600 forest sentence where a section needs an introduction — most
  sections need none.
- **Single-word accent in headlines.** Emphasis by size and placement, not by
  colouring one word gold or italic.
- **Arrow-appended links ("→").** Links end at the word; the chevron inside
  service rows is a 44px touch target, not punctuation.
- **Identical rounded card grids, soft shadows, gradients, glassmorphism.**
  Banned outright. The only shadows are the sheet and the nav; the only radii
  are product surfaces (12/16/20px) and pills.
- **Monospace data labels.** A frontend-design default tell; D uses tabular
  sans numerals for IDs and figures.
- **Middle-dot meta strings ("A · B · C").** Metadata is written as sentences
  or ruled rows.
- **Purple "Vibrant & Block-based" palette and Cormorant serif** returned by
  the ui-ux-pro-max `--design-system` search: rejected — they contradict the
  brief's Forest/Gold/Ivory and the no-card rule. Only its social-proof
  ordering and pre-delivery checklist were kept.
- **Brass small text.** The broadsheet claimed `#9A7B2E` as a readable gold
  for small text; measured contrast on ivory is **3.64:1 — it fails 4.5:1**.
  D bans gold/brass text below 32px entirely; gold text on forest uses
  `#E4C98F` (7.25:1).

## 7. Self-critique (frontend-design two-pass review)

- *Risk: the dark hero field could read as "near-black background with one
  bright accent" (default #2).* Mitigation: the field is forest `#102E27`,
  not near-black; the accent is a 1px line, not a bright colour field; and the
  page below it is light — the dark is a stage, not a theme.
- *Risk: the Meridian could become decoration if heritage nodes are thin.*
  Mitigation: nodes must carry dated, real content (1999 → today); if real
  dates are unavailable, the home page shows only the nodes that exist and the
  tracking page carries the line alone. An empty timeline is worse than none.
- *Risk: asymmetric offsets could confuse older first-time users.* Mitigation:
  asymmetry is desktop-only; below 900px everything is one calm column in
  reading order, and task screens never use offsets — the request sheet is
  always centred.
- *Risk: sans display at 88px in Bengali may render conjuncts poorly in some
  fonts.* Mitigation: typography screenshot QA (conjuncts, numerals, mixed
  BN/EN) is a build gate before the font choice is final; the scale, not the
  family, is fixed here.
- *Removed one accessory (Chanel's rule):* an early draft gave the hero a
  second gold device — a gold ring around the crest. Cut: the Meridian alone
  carries the gold.

## 8. Open questions (for the parent / typography researcher / Fahim)

1. **Font family:** this scale assumes Anek Bangla 700/800 for display. If the
   typography researcher picks a different Bengali sans (or finds Anek's heavy
   weights render conjuncts poorly at 88px), the scale stands but the family
   and the 88px cap must be re-verified with screenshots.
2. **Meridian heritage content:** which dated milestones (1999 → today) may be
   shown? No dates are invented — if fewer than 3 verified milestones exist,
   the home-page Meridian shows only what is verified.
3. **Second forest field on the home page:** hero + footer is the default; the
   expatriate dark band would be a third field if the footer stays dark. Is
   the expatriate band allowed to *replace* the footer field on that page, or
   should the home page keep hero + footer and put the expatriate sheet on
   white? (System currently specifies replacement, never a third field.)
4. **Ticker content and ownership:** one message, dismissible, above the nav —
   who writes it and how often does it change? If it cannot be kept current,
   it should be removed rather than left stale.
5. **Real photography:** the story/gallery compositions assume consented real
   photos exist or will exist; until then demo imagery stays labelled নমুনা.
   No photo decision is made here.
