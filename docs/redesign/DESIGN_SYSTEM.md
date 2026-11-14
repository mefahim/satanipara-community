# DESIGN_SYSTEM.md — Satanipara Community REDESIGN (Phase 4)

Date: 2026-11-14 | Status: build-ready tokens + rules for the new artifact.
Supersedes: v1 `docs/DESIGN_SYSTEM.md` (visual reference only — do not copy it).
Sources: `CREATIVE_DIRECTION.md`, `TYPOGRAPHY_RESEARCH.md`, `EXISTING_DESIGN_AUDIT.md`,
`DESIGN_SKILLS_INSTALLATION_REPORT.md`, installed skills `frontend-design`,
`ui-ux-pro-max` (incl. `references/pro-rules.md`), `web-design-guidelines`, `webapp-testing`.

## 0. Direction in one line

**A Bengali civic broadsheet — "Ivory paper, forest ink, one gold rule."**
Modern Civic Luxury = structure/tasks; Contemporary Bengali Editorial = type/pacing;
Human-Centered Community Culture = photography/voice. B wins on structure, A wins
on type, C never overrides a task flow.

**Honest tension, recorded:** the installed `frontend-design` skill warns that
cream + serif + broadsheet hairlines is a common generated-page default. Here it
is NOT a default — it is pinned by the brief itself (Bengali civic broadsheet,
est. 1999, Forest Green/Gold/Ivory) and made specific by: the Tiro Bangla +
Anek Bangla pairing, gold used only as a thin rule, task-first civic structure
(request/tracking/transparency as first-class pages), Bengali-first plain copy,
and the anti-wallpaper rule. If a screen could belong to any charity/newsroom/
startup, it has drifted and must be reworked.

## 1. Design tokens (CSS variables — single source of truth)

```css
:root{
  --forest:#173F35; --deep:#102E27; --moss:#2F6B4F; --sage:#8AA899;
  --mist:#E9EFEA; --gold:#C49A4A; --gold-soft:#E4C98F; --brass:#9A7B2E;
  --ivory:#F7F4EA; --paper:#FFFDF6; --ink:#1E2A25; --muted:#5A6B62;
  --line:#E2DCCB; --danger:#9B2C2C; --ok:#2F6B4F;
  --radius:10px; --radius-lg:16px;
  --space-1:4px; --space-2:8px; --space-3:16px; --space-4:24px;
  --space-5:32px; --space-6:48px; --space-7:64px; --space-8:96px;
  --container:1180px; --gutter:24px;
  --font-display:'Tiro Bangla','Noto Serif Bengali',serif;
  --font-ui:'Anek Bangla','Noto Sans Bengali','Hind Siliguri',sans-serif;
  --font-en:'Manrope','Anek Bangla',sans-serif;
  --motion-fast:180ms; --motion-med:320ms;
}
[data-theme="dark"]{
  --ivory:#102E27; --paper:#14382D; --ink:#F2EFE3; --muted:#B9C9BE;
  --line:#2A4A3E; --mist:#1B3A2F; --forest:#E9EFEA; /* ink flips, gold rules stay gold */
}
```

**Hard rules:** no section may be a forest-green card with a gold button
(anti-wallpaper rule). Green surfaces limited to: primary buttons, the footer,
at most ONE dark band per page. Gold = thin rules / kickers / active states /
large display numerals only; small gold text uses `--brass` (gold #C49A4A fails
small-text contrast on ivory). No gradients, no glass, no shadows as decoration
(hairlines + whitespace separate). No hardcoded hex outside tokens — dark mode
must be a token swap with no stray light colours (v1 defect).

## 2. Typography (pending screenshot QA — see §7)

- **Display (BN):** Tiro Bangla 400 (+ true italic for quotes/kickers only).
  Hero `clamp(2.6rem,7vw,4.4rem)`, lh 1.25; section `clamp(1.7rem,3.4vw,2.4rem)`,
  lh 1.35. Size-led hierarchy — NEVER fake-bold Tiro (no 700), never fake-italic
  Anek. Below ~28px, display switches to the fallback serif.
- **UI + body (BN):** Anek Bangla variable 100–800. Body 400 @ 17px, lh 1.8;
  labels 600 @ 15px; buttons 600–700 @ 16px. Bengali body never below 15px;
  Bengali ~10% larger than Latin at the same level. Never letter-space Bengali,
  never uppercase-transform Bengali.
- **English:** Manrope variable 200–800 (headings 700, body 400 @ 16px, lh 1.65).
  `lang="bn"` on Bengali blocks, `lang="en"` on English runs.
- **Numerals:** Bengali ০–৯ in Bengali copy; Latin only in Request IDs
  (EXP-2026-XXXX) and phone numbers as typed.
- **Runner-up (auto-adopt if QA fails, no layout change):** Noto Serif Bengali
  700 display + Noto Sans Bengali UI/body, Manrope unchanged.
- **QA must check:** conjuncts `ক্ষ ত্র ষ্ট জ্ঞ শ্র ফ্র ব্র হ্র ন্ত ণ্ড স্থ`,
  `শ্রী`, numerals `০১২৩৪৫৬৭৮৯`, mixed BN/EN line, no synthetic bold/italic
  in computed styles, fallback with Google Fonts blocked.

## 3. Type scale (Bengali-first)

| Role | Size | Weight | LH |
|---|---|---|---|
| Hero display | clamp(2.6rem,7vw,4.4rem) | 400 (Tiro) | 1.25 |
| Page title | clamp(2rem,4.5vw,3rem) | 400 (Tiro) | 1.3 |
| Section title | clamp(1.7rem,3.4vw,2.4rem) | 400 (Tiro) | 1.35 |
| Subsection | 1.25rem | 600 (Anek) | 1.5 |
| Body | 17px | 400 (Anek) | 1.8 |
| Small / caption | 14–15px | 400–500 | 1.6 |
| Button / label | 15–16px | 600–700 | 1.5 |

Line length < 80 chars; serif body slightly longer measure allowed.

## 4. Layout & grid

- 12-col desktop (container 1180px, 24px gutters), 8-col tablet, 4-col mobile.
  Breakpoints: 360 / 640 / 900 / 1180 / 1440 (v1 drift corrected).
- Below 900px: single calm column in reading order.
- Sections alternate by rhythm, not colour: ivory → paper → ivory, hairline
  rule + kicker marking each section. Rhythm from type size and image
  placement, not paint.
- **Masthead, not app bar:** crest + serif wordmark, BN/EN toggle, one primary
  action (সাহায্যের আবেদন). Mobile header ≤56px, single row. Nav: হোম,
  আমাদের সম্পর্কে, কার্যক্রম, প্রবাসী সহায়তা, রক্তদাতা, নোটিশ, হিসাব, যোগাযোগ
  (plus directory/organization/activities deep pages via footer + in-page links).
- Hero: one statement, one image, max two actions (primary = request help,
  quiet link = track request). No carousel, no ticker touching the hero.

## 5. Components

- **Buttons:** primary = forest fill, ivory text, radius 10, min-height 48px;
  secondary = 1px forest outline on paper; quiet = text link with gold
  underline on hover/focus. No gold buttons as default. Same label through a
  whole flow (button "আবেদন জমা দিন" → toast "আবেদন জমা হয়েছে").
- **Forms:** 48px controls, visible `<label>` above every field, error text
  directly under the field + error summary focused on submit (pro-rules),
  inline Bengali validation, all 6 v1 forms preserved.
- **Status:** Pending / Accepted / In Progress / Completed as a 4-step timeline
  with text + icon, never colour alone. Success = moss, error = danger.
- **Cards:** paper surface, 1px hairline border, radius 10/16 — NOT the
  dominant pattern; use editorial rows, ledgers/tables, timelines and
  asymmetric grids so no page is a wall of identical cards.
- **Tables/ledger:** transparency as a plain ledger (mist striping), demo-labelled.
- **Gallery:** one decisive image per section; lightbox with Esc + arrow keys.
- **Notifications:** simulated browser-notification toast + bell badge for
  helpers on new expatriate requests (8s toast in v1, preserved).
- **States (every interactive element):** hover, focus (visible outline),
  active, loading, empty ("তথ্য হালনাগাদ হচ্ছে" / plain empty copy), error,
  success. Disabled = visibly non-interactive.
- **Icons:** inline SVG, one stroke width (1.5–2px), no emoji as icons.
- **Motion:** fade/rise 180–320ms on reveal only; ONE orchestrated page-load
  moment max; motion answers user actions; `prefers-reduced-motion` disables
  all non-essential motion; no parallax on task screens.

## 6. Pages & compositions (Phases 5–6)

Each module gets a distinct-but-consistent template; homepage sections use
varied compositions (editorial feature, asymmetric grid, ledger, timeline,
story spread) — never the v1 kicker + h2 + gold-rule + card-grid repeated.
Homepage (16 beats, §Phase 5): announcement strip, masthead, immersive hero,
editorial story, stats integrated into layout (zero invented numbers — unverified
= "তথ্য হালনাগাদ হচ্ছে"), service discovery, expatriate feature, impact
stories, activities, news, events, gallery, transparency teaser, closing dark
band, footer. All §Phase 6 pages: Community Profile, People & Professionals,
Educational/Religious Institutions, Infrastructure, Organization History,
Constitution, Executive Committee, Advisory Council, Former Leaders, Annual
Activities + details, Expatriate Support / Request (multi-step) / Tracking,
Blood Donor Directory + Emergency Request, News, Notices, Events, Job
Circulars, Photo/Video Gallery, Financial Transparency, Annual Reports,
Membership / Login / Registration / Member Dashboard / Profile / My Requests,
Contact, FAQ, Privacy Policy. Every page: clear user objective, breadcrumb,
related links, empty/error/success states.

## 7. Accessibility & QA gates (ui-ux-pro-max priority 1–10 + pro-rules checklist)

- Contrast ≥4.5:1 body text both themes; focus visible everywhere; keyboard
  nav incl. lightbox/modal; semantic HTML; `aria-hidden` on decorative icons;
  screen-reader focus order = visual order; touch targets ≥44px (48px controls);
  375/768/1024/1440px checks; reduced-motion + dark-mode contrast checked
  independently, never inferred.
- Typography screenshot QA (Chrome + Safari + Android, 360px + 1280px) before
  the font decision is final — see §2. If Tiro/Anek fails, runner-up swap.
- "Three green blocks" check on every page; plain-language read-aloud of every
  task screen; real-photo gate (no photo ships as community without consent +
  caption; demo imagery labelled নমুনা).
- Functional QA (webapp-testing, Playwright after `pip install playwright`):
  full expatriate form → new Request ID end-to-end, lightbox arrow keys,
  demo login → dashboard, donor phone reveal, all filters, console 0 errors,
  no horizontal overflow at 360px.

## 8. What changed vs v1 (audit-driven)

- 3 recycled images → one decisive, demo-labelled image per section; gallery
  no longer repeats the same 3 pictures.
- Template repetition (`.gold-rule` 20×, `.card` 40×) → varied editorial
  compositions; `.stagger` used deliberately, not once.
- 9-block homepage → full 16-beat homepage; news/events/stories separated.
- Flat type → stepped Tiro/Anek scale; hero at spec size.
- Gold everywhere → gold as thin rule only; brass for small gold text.
- 98 inline styles → tokens only; container/breakpoints/radius/motion
  corrected to spec; dark mode token-swapped, no hardcoded light colours.
- No persistence → localStorage for theme, language, login session (demo).
- EN chrome-only → EN translates chrome + key headings; data arrays translated
  where feasible, otherwise clearly marked BN-only demo content.
