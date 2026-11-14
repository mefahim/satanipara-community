# DESIGN_RESEARCH.md — Satanipara Community
Date: 2026-11-14 | Phase 1

## 1. Design position (from blueprint + brief)
Premium, human-centred, culturally rooted community platform — not a generic NGO template. Bengali-first, editorial, warm, trustworthy. Local identity + human story + clear information + easy service + credibility.

## 2. Reference principles extracted (no design copied)
- **Editorial community sites / local-news design:** strong masthead identity, clear section rhythm, one hero story + supporting stories, generous whitespace, serif display headlines with sans body. Applied: homepage is a story-led sequence, not hero + identical card rows.
- **Government / civic service portals (e.g. GOV.UK pattern):** task-first navigation, plain language, status made visible, one thing per page. Applied: expatriate request is a stepped task (discover → form → review → submit → track), statuses in plain Bengali.
- **Membership / community platforms:** belonging cues (member stories, directory), trust cues (published reports, clear policies). Applied: transparency preview + stories + directory.
- **Blood-donation services:** privacy-first directory, consent-masked contact, emergency path separated from routine search. Applied: donor list shows blood group/area/availability only; contact revealed only after a consent note.
- **Financial transparency (charity reporting):** plain-language income/expense summaries, project accounts, downloadable annual reports. Applied: transparency section with demo-labelled figures and report list.

## 3. Bengali typography research (web, 2026-11-14)
- **Hind Siliguri** (Indian Type Foundry, Google Fonts, OFL, 5 weights 300–700, Latin+Bengali): best for UI/body — clean conjunct rendering, coordinated Latin/Bengali heights. Selected as primary UI font.
- **Noto Serif Bengali** (Google, OFL, 9 styles): selected for display headlines/editorial — ceremonial, readable serif for Bengali.
- **Noto Sans Bengali**: fallback if Hind Siliguri fails.
- Rules applied: Bengali body line-height 1.75–1.9 (matras/conjuncts need room); minimum Bengali body 15–16px; Bengali optically ~10–15% smaller than Latin at same px — size up Bengali slightly; test conjuncts ক্ষ, ত্র, ষ্ট, জ্ঞ, বাংলাদেশ, শিক্ষা; never use ANSI/Bijoy fonts; mark Bengali text lang="bn".
- Latin companion: **Manrope** (modern, warm, pairs well with Hind Siliguri).

## 4. Visual direction chosen
- Palette: Forest Green #173F35 (primary), Deep Forest #102E27 (dark surfaces), Warm Gold #C49A4A (accent, sparing), Ivory #F7F4EA (page ground). Supporting tints derived, never new hues.
- No repetitive gradients, no glassmorphism, no floating shapes, no generic SaaS dashboard. Varied editorial sections: full-bleed dark green story band, ivory directory, gold-rule dividers, asymmetric hero (headline left, framed image/crest right), numbered statistics row.
- Imagery: no real Satanipara photos exist in this phase — use typographic/crest-led art direction and clearly-labelled demo imagery (CSS/SVG compositions), never stock photos presented as real community photos.

## 5. Accessibility research applied
- WCAG 2.2 AA: contrast ≥4.5:1 body, ≥3:1 large text/UI; 44px minimum touch targets; visible focus; semantic landmarks; prefers-reduced-motion respected; skip link; labels on every form control; aria-live for status updates (request ID, notifications).

## 6. Limitations
- No real photography, no verified statistics, no user interviews in this phase — design is principle-led, not research-validated with real users. Real user testing is a future-phase recommendation.
