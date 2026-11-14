# CREATIVE_DIRECTION.md — Satanipara Community redesign, Phase 2

Date: 2026-11-14 | Status: direction + principles only — no build, no artifact edits.
Client: Satanipara Somaj Kallyan Sangha (est. 1999). Brand: Satanipara Community.
Tagline: একটি এলাকা, একটি পরিবার. Slogan: শিক্ষা • ঐক্য • শান্তি • প্রগতি.
Audience: ordinary Bangladeshi local residents + expatriates; Bengali-first,
large buttons, simple copy. All content DEMO only — no real people, stats, or
finance invented. The v1 prototype's visual direction is REJECTED and is not a
reference for this direction.

## Chosen direction (one sentence)

**A Bengali civic broadsheet: Modern Civic Luxury as the spine, Contemporary
Bengali Editorial as the voice, Human-Centered Community Culture as the heart.**

## Visual signature — "Ivory paper, forest ink, one gold rule"

The site should read at a glance like a well-printed Bengali broadsheet that
happens to be a working civic service — not like a dashboard, not like a
magazine cover, not like a charity appeal.

- **Ground:** ivory/paper, always. `#F7F4EA` ivory page ground, `#FFFDF6` paper
  for reading surfaces. Light throughout; the hero is light, never dark.
- **Ink:** forest green used as *ink and structure*, not as fill. Headlines,
  rules, navigation, and one deep-green band per page at most (footer, or a
  single closing band — never both plus green cards).
- **Accent:** gold used as a *thin line*, never as a field. A 2px gold rule
  under a kicker, a gold underline on the active nav item, a gold numeral.
  No gold buttons as the default, no gold backgrounds, no gold gradients.
- **Type:** large Bengali serif display (see TYPOGRAPHY_RESEARCH.md) against
  quiet sans body — the contrast *is* the brand. One display moment per
  screen; everything else steps back.
- **Photography:** one decisive image per section, real community photos with
  consent when they exist; until then, crest-led typographic compositions and
  clearly-labelled demo imagery. Never stock presented as real.
- **Structure:** an architectural 12-column grid on desktop that collapses to a
  single calm column on phones; hairline rules and whitespace do the separating,
  not shadows or rounded card-walls.

## Who owns what (so the combination stays cohesive, not a random mix)

| Territory | Owning direction | What it decides |
|---|---|---|
| Page structure, grid, navigation, task flows, forms, status tracking, transparency pages | B — Civic Luxury | One action per screen; predictable nav; 44px targets; plain language |
| Typography, hero, story/feature sections, pacing, pull quotes, section rhythm | A — Editorial | Serif display; whitespace; one image per spread; story-led order |
| Photography, voice, story content, welcome language, cultural detail | C — Community Culture | Real faces (consented); warm plain Bengali; people-first stories |
| Colour, tokens, components, motion | Shared system (below) | No direction may invent its own palette or button |

Rule: if a screen needs two directions at once, B wins on structure and A wins
on type. C never overrides a task flow — the expatriate request form is civic
even when the story page next to it is warm.

## Refined palette (identity colours kept, supporting shades added)

Identity (unchanged): Forest Green `#173F35`, Gold `#C49A4A`, Ivory `#F7F4EA`.

| Token | Value | Use |
|---|---|---|
| `--forest` | `#173F35` | Headlines on ivory, primary button, nav ink |
| `--deep` | `#102E27` | Footer / the one dark band per page, hero overlay only if a photo demands it |
| `--moss` | `#2F6B4F` | Secondary green: links-on-light, success, small labels — never a card fill |
| `--sage` | `#8AA899` | Hairlines on dark, subtle decorative rule, never body text on light |
| `--mist` | `#E9EFEA` | The *only* pale-green surface allowed: thin dividers / table striping, not cards |
| `--gold` | `#C49A4A` | Thin rules, kickers, active states, large display numerals only |
| `--gold-soft` | `#E4C98F` | Kicker background tint (text on it must be forest, never gold-on-gold) |
| `--brass` | `#9A7B2E` | Gold's readable cousin: small gold-coloured *text* (gold `#C49A4A` fails small-text contrast on ivory) |
| `--ivory` | `#F7F4EA` | Page ground |
| `--paper` | `#FFFDF6` | Reading surfaces, form sheets |
| `--ink` | `#1E2A25` | Body text |
| `--muted` | `#5A6B62` | Secondary text, captions |
| `--line` | `#E2DCCB` | Hairline borders |
| `--danger` | `#9B2C2C` | Errors only |
| `--ok` | `#2F6B4F` | Completed status |

**Anti-wallpaper rule (hard):** no section may be a forest-green card containing
a gold button by default. Green surfaces are limited to: primary buttons,
the footer, and at most one dark band per page. Everything else is ivory/paper
with forest *ink*. If a mockup shows three green blocks in a row, it is wrong.

Contrast notes (to be re-checked in build QA): ink on ivory ~13:1; ivory on
forest ~9.8:1; gold `#C49A4A` on forest ~4.6:1 — large text / UI only, never
small body; brass `#9A7B2E` for small gold text on ivory.

## Layout principles

1. **Broadsheet grid, phone column.** 12-col desktop (1180px container,
   24px gutters), 8-col tablet, 4-col mobile; below 900px everything is one
   column in reading order — no side-by-side that reflows confusingly.
2. **Masthead, not app bar.** Slim top bar: crest + "সাতানীপাড়া কমিউনিটি" in
   serif, BN/EN toggle, one primary action ("সাহায্যের আবেদন"). ≤56px tall on
   mobile, single row. Navigation: Home, Our Cappers-equivalent sections —
   for this site: হোম, আমাদের সম্পর্কে, কার্যক্রম, প্রবাসী সহায়তা, রক্তদাতা,
   নোটিশ, হিসাব, যোগাযোগ (final IA to be confirmed in the build brief; no
   invented labels beyond the known modules).
3. **Hero: one statement, one image, two actions max.** Large serif tagline
   ("একটি এলাকা, একটি পরিবার"), one supporting line, primary action
   (request help) + quiet text link (track request). No carousel, no ticker
   touching the hero, no auto-playing video.
4. **Sections alternate by rhythm, not by colour.** Ivory → paper → ivory,
   with a hairline rule and a kicker ("আমাদের কাজ", "প্রবাসী সহায়তা") marking
   each section. The *only* colour change is the single dark band (footer or
   closing call) — rhythm comes from type size and image placement, not paint.
5. **Story-led, task-led — in that order on the home page, never mixed on one
   screen.** Home: welcome story → tasks → activities → transparency teaser →
   closing band. Task screens (request form, tracking, blood search): civic
   only — no editorial flourishes inside a form.
6. **Editorial devices, used sparingly:** one pull quote per story page; one
   full-bleed image per feature; numbered "how it works" steps (1-2-3-4) for
   the expatriate flow; year-based activity archive (since 1999) as a timeline,
   not a card grid.

## Navigation & interaction principles

- Predictable: same nav position, same button styles, same labels on every page.
- Tasks first: the four most-used tasks are plain links on the home page, above
  any news feed.
- Large targets: 48px form controls, 44px minimum touch targets, generous
  spacing between adjacent links.
- Plain Bengali labels; English toggle translates chrome + key headings.
- Motion: fade/rise 180–320ms on reveal only; disabled under
  `prefers-reduced-motion`; no infinite animation, no parallax on task screens.
- Dark mode (if kept): ivory → deep green-ink ground, paper → dark surface,
  gold rules stay gold; contrast re-checked, never auto-inverted images.

## Imagery & storytelling rules

- Real community photography with consent, captioned with place/date context;
  until real photos exist, crest + typographic compositions and demo-labelled
  imagery only.
- One person, one story: feature stories lead with a person (consented, named
  only with permission), then the wider picture; numbers second, demo-labelled.
- No stock "community", no clip art, no decorative illustration substituting
  for content. Empty states say so plainly ("তথ্য হালনাগাদ হচ্ছে") rather than
  showing invented figures.
- Financial transparency: accounts shown as a plain ledger/table with
  demo labels, downloadable (simulated) annual reports — never as marketing
  graphics with invented totals.

## Voice (Bengali-first copy)

- Warm, plain, direct. Short sentences. Active voice. "আপনার পাশে আছি" rather
  than institutional abstraction.
- Slogan used as a section sign-off / footer line, not shouted on every screen.
- No jargon, no English loanwords where a plain Bengali word exists, no
  fundraising urgency, no "exclusive" language.
- Numbers: Bengali numerals (০–৯) in Bengali copy; Latin numerals only inside
  Request IDs (e.g. EXP-2026-XXXX) and phone numbers as the user typed them.

## What this direction is NOT

- Not the v1 prototype (green cards + gold buttons throughout) — explicitly rejected.
- Not a newsroom homepage, not a charity appeal, not a government form, not a
  startup landing page. If a screen could belong to any of those, it has drifted.
- Not "premium" by decoration: no shadows, no gradients, no glass, no gold
  fields. Premium here = paper, ink, one gold rule, and type set beautifully.

## Build QA gates this direction implies

1. Phone-first check: single-column flow, hero, and all four task entries
   readable and tappable at 360px before any desktop polish.
2. Screenshot check of the typography system (see TYPOGRAPHY_RESEARCH.md) —
   conjuncts, numerals, mixed BN/EN — before the font decision is final.
3. "Three green blocks" check on every mockup: at most one dark band per page.
4. Plain-language check: every task screen read aloud in Bengali; any sentence
   a first-time older user would stumble on is rewritten.
5. Real-photo gate: no photo ships as "community" without consent + caption;
   demo imagery stays labelled নমুনা.
