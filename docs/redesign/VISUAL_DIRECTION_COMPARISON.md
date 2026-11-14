# VISUAL_DIRECTION_COMPARISON.md — Satanipara Community redesign, Phase 2

Date: 2026-11-14 | Status: research only — no build.
Scoring: 1–5 per criterion (5 = strongest). Scores are judgement calls from the
Phase 2 research, not user testing; the build QA phase must validate them with
real users on phones. Criteria are weighted equally here because no single
criterion may dominate a community site — warmth without trust, or trust without
usability, both fail.

## The three directions

- **A — Contemporary Bengali Editorial.** Editorial typography, large photo
  compositions, magazine layouts. Serif display, generous whitespace, story-led
  sections, pull quotes, feature openers.
- **B — Modern Civic Luxury.** Sophisticated forest green, warm ivory, muted gold,
  architectural grids, premium institutional identity. Calm, consistent, official;
  tasks first; transparency visible.
- **C — Human-Centered Community Culture.** Authentic community photography, warm
  welcoming language, cultural storytelling, organic layouts. People first,
  celebration of local life, softer and more informal.

## Score table

| Criterion | A Editorial | B Civic Luxury | C Community Culture |
|---|---:|---:|---:|
| Bengali typography fit | 5 | 4 | 3 |
| Community warmth | 3 | 3 | 5 |
| Institutional trust | 4 | 5 | 3 |
| Usability for low-literacy / older users | 2 | 5 | 3 |
| Distinctiveness | 5 | 4 | 3 |
| Mobile fit | 3 | 5 | 3 |
| **Total /30** | **22** | **26** | **20** |

## Why each score

### Bengali typography fit
- **A 5:** Editorial direction is *built* on typography; Bengali's মাত্রা headline
  stroke and conjuncts become the visual signature instead of decoration. Serif
  display (Tiro / Noto Serif Bengali) at large sizes is where Bengali looks most
  distinguished.
- **B 4:** Civic luxury also needs strong type, but its voice is the system and
  the grid; typography serves clarity first, expression second.
- **C 3:** Culture direction leans on photography and voice; type is a supporting
  player, so Bengali typography gets less room to be distinctive.

### Community warmth
- **A 3:** Editorial is confident and intelligent, but can feel distant —
  a magazine about a community rather than a community speaking.
- **B 3:** Civic luxury is calm and respectful, but institutional by nature;
  warmth must be deliberately added through language, not assumed.
- **C 5:** Warmth is the whole point: real faces, first-person stories,
  welcoming copy ("আমাদের এলাকার মানুষের জন্য একটি পরিবার").

### Institutional trust
- **A 4:** A well-made editorial page signals care and competence, but a
  magazine voice can feel like marketing if the facts (accounts, committee,
  request status) are not given equal weight.
- **B 5:** Trust is B's core job: visible governance, transparent accounts,
  consistent components, calm palette. A 27-year-old sangha (est. 1999) needs
  this register most.
- **C 3:** Warmth alone does not prove accountability; without B's structure,
  C can read as informal to the point of unserious for financial transparency.

### Usability for low-literacy / older users
- **A 2:** Magazine layouts are the weakest here: multi-column spreads, small
  captions, pull quotes, and dense article lists punish scanning and small
  phones. Editorial pacing must be *tamed* for this audience.
- **B 5:** GOV.UK-style civic design exists for exactly this user: one action
  per screen, plain language, large targets, predictable navigation, no
  decoration in task flows.
- **C 3:** Friendly language helps, but organic/asymmetric layouts hurt
  predictability — an older user should never have to hunt for the button.

### Distinctiveness
- **A 5:** A Bengali editorial broadsheet is genuinely distinctive; almost no
  Bangladeshi community site looks like this. The most memorable direction.
- **B 4:** Civic luxury is distinctive *in this context* (most local sites are
  either garish or bare), but the genre itself is familiar from government and
  bank sites.
- **C 3:** Warm community storytelling is the most common nonprofit look;
  without a strong typographic or grid signature it blends into every other
  charity site.

### Mobile fit
- **A 3:** Editorial spreads collapse awkwardly: large images + long headlines
  + pull quotes need careful single-column re-choreography, or the phone version
  becomes a long scroll of oversized type.
- **B 5:** Architectural grid + one-column task flows are natively mobile;
  the system is designed phone-first.
- **C 3:** Photography-led organic layouts are fragile on phones (cropping,
  overlapping text, uneven rhythm) and heavy on slow connections.

## Verdict

No direction wins alone. **B scores highest (26/30)** because trust and
usability are non-negotiable for this audience, but B alone would be calm to
the point of cold, and would waste the one thing that makes this site
memorable — Bengali editorial typography. **A is the voice, B is the spine,
C is the heart** — see CREATIVE_DIRECTION.md for the cohesive combination
and its visual signature.

The combination is not a random mix: each direction owns specific, non-overlapping
territory (B = structure + tasks + trust surfaces; A = typography + pacing +
hero/story sections; C = photography + language + story content), so no screen
tries to be all three at once. The scoring also sets the QA priorities: the
biggest risks are A's mobile collapse and low-literacy weakness, so the build
must prove the single-column phone flow and the plain-language task screens
first — not the desktop hero.
