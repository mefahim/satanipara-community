# DESIGN_REFERENCE_RESEARCH.md — Satanipara Community redesign, Phase 2

Date: 2026-11-14 | Status: research only — no build, no artifact edits.
Scope: premium editorial websites, international cultural organisations, premium
community platforms, modern civic digital services, humanitarian / nonprofit sites,
modern digital publications. Principles are extracted, not copied: no layout, copy,
colour scheme, logo, or component is lifted from any named site.

> The v1 prototype's visual direction is REJECTED and is not used as a reference
> anywhere in this document. All content in the eventual build is DEMO only —
> no real people, statistics, or financial figures are invented.

## Method

- Web research on 2026-11-14 via search + source reading (see Sources at the end).
- Each reference is used for ONE transferable principle, stated in its own words.
- A principle only enters the direction if it also serves this project's audience:
  ordinary Bangladeshi local residents + expatriates, Bengali-first, large buttons,
  simple copy, low-literacy and older users, mostly phones, often slow connections.

## Named references and what was taken from each

### 1. Editorial / premium publications — Monocle, NYT Magazine, The Guardian, WIRED, The Verge
- **Principle — typography is the hierarchy.** Large serif display headlines,
  generous whitespace, and hairline rules do the structuring work; colour does not
  have to. One decisive image per spread, not a wall of thumbnails.
- **Principle — the page reads like a curated essay, not a pitch.** Pacing comes
  from alternating long-form blocks, pull quotes, and full-bleed images — not from
  adding more cards.
- **Principle — restraint is the luxury signal.** Off-white paper ground, ink text,
  ONE warm accent used at most twice per spread. No shadows, no rounded-card grids,
  no gradient CTAs. (Monocle-derived design-system notes state this explicitly:
  borders + whitespace do the work, never shadows.)
- **What NOT to copy:** the broadsheet density and multi-column article lists of
  NYT / Guardian homepages; our users need one clear next step per screen, not a
  newsroom front page. Do not copy masthead styling, serif choices, or the
  dark-hero habit of some magazine sites — our hero stays light/ivory.

### 2. International cultural organisations — ICOMOS (icomos.org, redesigned 2025), Liberation Route Europe / Europe Remembers, Kanopi arts-and-culture practice
- **Principle — the agenda is the homepage.** For a cultural institution the most
  visited thing is what is happening next; events/activities are published by the
  organisation's own team and kept visibly current. A dead agenda kills trust.
- **Principle — multilingual is architecture, not a bolt-on.** Language switching
  is designed into navigation and content structure from the start (BN first here,
  EN as a real second layer, not machine-translated chrome).
- **Principle — governance is visible.** Committee, roles, and accountability are
  shown plainly; a cultural body does not communicate like a shop, and accuracy
  matters more than salesmanship.
- **What NOT to copy:** ICOMOS-style professional-portal density (news feed +
  map + project pages at once); our audience needs the same credibility with a
  fraction of the information density. Do not copy institutional navy/grey
  palettes — our identity stays forest/ivory/gold.

### 3. Premium community platforms — charity: water, World Central Kitchen, Mercy Corps, BRAC-adjacent humanitarian practice
- **Principle — transparency is architecture, not a disclaimer.** charity: water's
  100%-model is the spine of the whole experience, with a project map and photos
  proving where money went. For Satanipara this translates to: financial
  transparency and request-status tracking are first-class pages, not footnotes —
  but with DEMO figures clearly labelled নমুনা until real figures exist.
- **Principle — one person beats a page of statistics.** "People give to people":
  a single named story (with consent) + one photo does more than "we served
  5,000 families". Story first, number second — and never invent the person.
- **Principle — real photography or none.** Authentic photos of the actual
  community outperform stock every time; stock photos of smiling volunteers read
  as stock. Until real Satanipara photos with consent exist, use typographic /
  crest-led art direction and clearly-labelled demo imagery — never present a
  stock photo as a real community photo.
- **What NOT to copy:** donation-flow optimisation and urgency framing (countdown
  language, "give today" pressure). This is a community platform, not a
  fundraising funnel; the equivalent "one clear action" here is "request help"
  and "track my request", stated calmly.

### 4. Modern civic digital services — GOV.UK Design System & Service Manual, CivicPlus / US local-government practice, WCAG 2.1/2.2 AA
- **Principle — start from tasks, not the org chart.** The homepage's most
  requested tasks appear as plain links, not behind a carousel or news feed.
  For us: "সাহায্যের আবেদন করুন", "আবেদন ট্র্যাক করুন", "রক্তদাতা খুঁজুন",
  "নোটিশ দেখুন".
- **Principle — plain language is a design decision.** Short sentences, active
  voice, no jargon, reading level a stressed or low-literacy reader can follow.
  Lead with the answer or the action, then the background.
- **Principle — one thing per page in task flows.** The expatriate-support form
  and the tracking flow are broken into short steps with one question each;
  error messages say exactly what to do ("আপনার মোবাইল নম্বর লিখুন"), never
  "Invalid input".
- **Principle — consistency is an accessibility feature.** One button style per
  action type, navigation in the same place on every page, no decorative elements
  in critical flows, no icon-only buttons, no colour-alone meaning.
- **Principle — design for weak connections and old phones.** Mobile-first,
  44×44px minimum touch targets, text that survives 200% zoom, fast load
  (images ≤ ~300 kB, system fallbacks, no heavy webfont payload).
- **What NOT to copy:** GOV.UK's deliberately plain, almost unbranded visual
  language. Civic clarity is borrowed; civic dullness is not — this site must
  still feel like a proud community identity, not a government form.

### 5. Premium community / membership — Parthenon Club, WeAre Foundation
- **Principle — belonging is the product.** Membership identity (a card, a
  certificate, a visible role) and a clear "how to join / how to get help"
  path matter more than feature lists.
- **Principle — video and faces carry the welcome.** WeAre's hero uses close-up
  video of real people from many walks of life to say "this is for everyone".
  Transferable only once real community footage exists; until then, do not fake
  it with stock video.
- **What NOT to copy:** selective/exclusive membership framing (€50 fee,
  admissions committee, "premium international membership"). Satanipara is an
  open neighbourhood community — the tone is welcoming, never gated or elite.

## Cross-cutting principles (the distilled set)

| # | Principle | Where it came from |
|---|-----------|--------------------|
| P1 | Typography carries hierarchy; colour is restrained | Editorial |
| P2 | Whitespace + hairline rules structure; no shadows, no card-wall | Editorial / Monocle |
| P3 | One decisive image per section; real photos or none | Editorial + nonprofit |
| P4 | One clear action per screen; tasks first, org chart never | Civic (GOV.UK) |
| P5 | Plain Bengali, short sentences, one question per form step | Civic + nonprofit |
| P6 | Story first (one person, with consent), number second, never invented | Nonprofit |
| P7 | Transparency as architecture: accounts + request status are first-class | charity: water |
| P8 | Agenda/activities visibly current; a stale date destroys trust | Cultural institutions |
| P9 | Mobile-first, 44px targets, 200% zoom, weak-connection tolerant | Civic / WCAG |
| P10 | Multilingual designed in, BN first, EN real | Cultural institutions |
| P11 | Warmth comes from language + people, not from decoration | Community culture |
| P12 | One accent, used sparingly; the ground stays ivory/paper | Editorial luxury |

## What NOT to do (anti-patterns, from across the research)

- Every section a forest-green card with a gold button (the rejected v1 habit).
  Green becomes wallpaper; nothing is emphasised, and contrast/text legibility
  suffers on small phones.
- Card-wall homepages: 6–9 equal cards in a grid. Users cannot tell what matters.
- Stock-photo "community": generic smiling groups presented as Satanipara people.
- Newsroom-density homepages, carousels, auto-playing video, ticker-as-hero.
- Dark heroes, gradient CTAs, glassmorphism, decorative illustration as a
  substitute for real content.
- Fundraising urgency language, donation-pressure patterns, or exclusive/club
  framing.
- Bengali set in all-caps / letter-spaced uppercase (breaks the মাত্রা headline
  stroke), or Bengali body below 15px, or line-height below 1.7.

## Sources consulted (2026-11-14)

- Editorial & luxury design guide — jawadiftikhar.com/website-design-styles/editorial-luxury
- Editorial website templates — webflow.com/list/editorial; magazine examples — reallygooddesigns.com
- Monocle editorial design-system notes — github.com/sonhaicoder/web-taste-skill (monocle-editorial.md); github.com/ilya-makarov-dev/Reframe (editorial-monocle/DESIGN.md); design archetypes — github.com/steph-ux/web-design-enhancer
- ICOMOS redesign (2025) — facebook.com ICOMOS post, 2026-04-08; cultural-institution practice — kernweb.be/en/website-for-culture; Kanopi — kanopi.com/arts-culture
- Nonprofit guides — riot-agency.com (nonprofit web design guide); elevationweb.org (50 best nonprofit websites 2026); sharpguyswebdesign.com; devwerkz.com; imagexmedia.com; wandr.studio/blog/nonprofit-website-examples; azurodigital.com
- charity: water case material — michellemurvai.com; charlyagency.com; culturecompass.redbirdgroup.co
- Civic — civicplus.com (Inside the Digital Request, Part 3); getweys.com/blog/government-website-design-guide; govpilot.com; pageperson.org (GOV.UK cognitive accessibility); playbook.somerset.gov.uk (WCAG 2.2 overview)
