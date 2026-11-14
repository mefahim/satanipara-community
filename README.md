# Satanipara Community

**Satanipara Somaj Kallyan Sangha (সাতানীপাড়া সমাজকল্যাণ সংঘ) — est. 1999**

Digital brand: **Satanipara Community**
Tagline: **একটি এলাকা, একটি পরিবার** (One area, one family)
Slogan: **শিক্ষা • ঐক্য • শান্তি • প্রগতি** (Education • Unity • Peace • Progress)

A premium, Bengali-first digital community platform prototype — website first, mobile app later.
All content in this repository is **DEMO data only**: demo names, demo figures, demo photos
(clearly labelled "নমুনা ছবি · Demo image"). No real community statistics, personal
information, or financial records are in here. Real data must replace the demo content
before any public launch.

**Live site (GitHub Pages):** https://mefahim.github.io/satanipara-community/

---

## What is live

`index.html` is **Direction D** — the current design direction. Open it (or the Pages
URL above) and you get the full prototype: home, community directory, organization,
activities, expatriate support, blood donors, news/notices/events, gallery, financial
transparency, membership, contact, FAQ and privacy — 18 views in one file, with
Bangla/English toggle and light/dark theme. The site **always opens in light theme
by default**, even in a dark-preferring browser; the theme button switches manually
for that session.

`alternatives/` holds the two earlier directions, preserved untouched for comparison:

| File | Direction | In short |
| --- | --- | --- |
| `index.html` | **Direction D** (current) | "The Meridian" — editorial + Apple-inspired premium product UI |
| `alternatives/satanipara-editorial-redesign.html` | Editorial redesign | "Ivory paper, forest ink, one gold rule" — Bengali civic broadsheet |
| `alternatives/satanipara-v1-prototype.html` | v1 prototype | First full-site prototype (Hind Siliguri + Noto Serif Bengali) |

## The design sense — Direction D, in full

Direction D was built to feel like three things at once: an international
award-winning editorial website, an Apple-inspired premium digital product, and a
distinctly Bengali community platform. The one memorable idea is **The Meridian**:
a single continuous 1px gold line that is both the home-page heritage timeline
(only the verified 1999 founding milestone — nothing invented) and the live status
line of an expatriate request (Pending → Accepted → In Progress → Completed).
It starts at the baseline of a full-bleed deep-forest hero field (`#102E27`, ~92vh).
It is the **only** gold line on the page.

- **Ground:** cool-white `#FBFBF8` (≥60% of every page); ivory is rationed to ≤30%
  (story sections only). The hero goes dark instead of light. At most two large
  forest fields per page (hero + footer).
- **Colour budget:** gold = one line + at most 3 point accents per viewport.
  No gold buttons, no gradients, no glassmorphism (except the sticky-nav backdrop
  blur), no excessive cards, no decorative shapes. Gold/brass text is banned
  below 32px — measured brass `#9A7B2E` on ivory is only 3.64:1 contrast
  (gold on forest uses `#E4C98F`, 7.25:1).
- **Typography:** Anek Bangla (variable) is the single workhorse — display, UI
  and body, with hierarchy built by **weight and width, not size** (hero 800
  condensed, titles 700, body 400 at 17px/1.85). Tiro Bangla survives only as
  italic pull-quotes. Manrope for English. Fonts are self-hosted WOFF2 (no
  Google Fonts dependency at runtime); conjuncts (শ্র/ফ্র etc.) were verified
  rendered in headless Chromium on Linux. Fallback: Noto Sans/Serif Bengali.
- **Layout:** every section has its own composition — asymmetric grids, editorial
  storytelling, numbered service index, ledger tables, timeline, pull-quotes —
  never the generic "centered hero + three identical cards" formula. 9
  differently-composed sections on the home page.
- **Mobile (the part that was fixed three times from real phone screenshots):**
  text and photos share a consistent **18px side gutter** at 360px — nothing
  clipped at the edges, no horizontal overflow. Photos are shown **whole** on
  phones (natural ratio, `object-fit: contain` below 860px); an earlier
  `object-fit: cover` treatment had sliced them to 22–34% of their width.
  Mobile header is a single slim row (max 56px).
- **Interaction:** hash routing, BN/EN toggle, light/dark toggle, search and
  filters, tabs, accordions, gallery lightbox (arrow keys + Escape), forms with
  inline validation, notifications UI, loading/empty/error/success states.
  Motion is subtle and respects `prefers-reduced-motion`.

### How the three versions differ

- **v1** — functional-first: 10 views, 14-section home, green cards with gold
  buttons, Hind Siliguri + Noto Serif Bengali. Rejected as a final visual
  direction, kept as the functional reference.
- **Editorial redesign** — the broadsheet: ivory-always ground, serif-led Tiro
  display, gold rules everywhere, 11 views, 16-beat home page. Also not approved.
- **Direction D (this one)** — the synthesis above: sans-led type, cool-white
  ground, dark hero, one gold line, product-like service interfaces.

## Pages & flows (Direction D)

- **Home** — hero, story (1999), heritage timeline, services, expatriate
  support, blood donation, activities & news, community stories, gallery,
  financial transparency, footer.
- **Community Profile / Directory** — search + filters over people,
  professionals, institutions and infrastructure (demo entries).
- **Organization** — history, constitution (accordion), executive committee,
  advisory council, former leaders.
- **Annual Activities** — year + category filters, activity detail pages.
- **Expatriate Support** — 3-step wizard (service → details → review) →
  submission → Request ID (`EXP-2026-XXXX`) → Meridian tracking timeline +
  expense ledger. **No service charge** — the applicant pays the actual cost
  of goods + transport only. An Emergency Response Team of 3–5 people handles
  urgent cases. **This is NOT a replacement for official emergency services
  (call 999 first).**
- **Blood Donor** — blood-group + area filters, consent-gated phone numbers
  (masked until the donor consents), emergency blood request.
- **News / Notices / Events / Jobs** — category + year filters.
- **Photo & Video Gallery** — lightbox with keyboard navigation.
- **Financial Transparency** — income/expense, project accounts, annual
  reports (demo figures, clearly labelled).
- **Membership** — simulated login with **mobile number + password only
  (no OTP)**. Demo login: `01700000000` / `demo1234`. Member dashboard,
  profile, my requests, notifications.
- **Contact, FAQ, Privacy** — contact info, emergency numbers, FAQ accordion.

### Standing decisions (Phase 1 scope)

- Only **2 admin roles**: Super Admin (everything + user creation) and
  Expatriate Helper (expatriate requests only). President/GS/Treasurer and
  other roles are deferred to a later phase.
- **No OTP** anywhere — simple mobile + password login; Super Admin resets
  forgotten passwords.
- New expatriate requests trigger a browser notification to Super Admin and
  all Helpers (simulated in this prototype).
- No backend, database, payment, or real OTP in this phase — this is a
  static HTML/CSS/JS prototype. Real development (Laravel + PostgreSQL +
  Next.js + Flutter) is a separate, later phase.

## How to run locally

No build step, no dependencies. Any of these works:

```bash
# just open it
open index.html
# or serve it
python3 -m http.server 8000
# then visit http://localhost:8000/
```

## How to update later (so nothing breaks)

1. **Small content/design change:** edit the live artifact
   (`satanipara-community-direction-d`) or edit `index.html` directly, then
   commit. Keep the Meridian rules in `docs/direction-d/DESIGN_SYSTEM.md`
   in mind: one gold line, ≤3 gold accents per viewport, no gold buttons,
   18px mobile gutters, photos whole on phones.
2. **Bigger redesign:** export the updated artifact (it produces a single
   `.html` file), replace `index.html` with the fresh export, and verify the
   light-default init is still there — the theme init must unconditionally
   call `setTheme("light")` on first load and must not follow
   `prefers-color-scheme`.
3. **Docs in the same commit:** every change gets a matching doc update in
   `docs/` — Direction D changes go in `docs/direction-d/PROJECT_PROGRESS.md`
   (and `DESIGN_SYSTEM.md` / `DESIGN_RATIONALE.md` if a rule changed);
   alternative versions get their own `alternatives/` file replaced, never
   edited in place as the live one.
4. **Before every push:** check the changed pages at 360px in both themes
   with real rendered screenshots (not just by reading CSS) — the padding
   and photo-crop regressions in this project were both caught on a real
   phone after CSS-only checks had "passed". Confirm 0 console errors.
5. **Push:** commit to `main`; GitHub Pages (main branch, root) publishes
   automatically within a minute or two.

## Documentation

- `docs/direction-d/` — Direction D: `DESIGN_RATIONALE.md` (typography,
  hierarchy, layout, interaction decisions + comparison with the broadsheet),
  `DESIGN_SYSTEM.md` (tokens, type scale, colour budget, motion, dark mode),
  `FONT_COMPARISON.md` + `FONT_COMPARISON.html` (8 Bengali faces compared),
  `QA_REPORT.md`, `FUNCTIONAL_TEST_REPORT.md`, `REVERIFY_REPORT.md`,
  `PROJECT_PROGRESS.md`, `ASSUMPTIONS.md`.
- `docs/redesign/` — the editorial (broadsheet) redesign: creative direction,
  reference research, direction comparison, typography research + specimen,
  design system, existing-design audit, final review, QA reports.
- `docs/v1/` — the v1 prototype: project audit, design research, skill audit,
  sitemap, user flows, UX architecture, design system, QA report.

## Status

Prototype — **not approved as final, not a public launch**. The client
(Satanipara Somaj Kallyan Sangha) has not yet given a Design OK, and all
content is demo data. Verified on 2026-11-14: 0 console errors, all main
flows driven live (wizard → new Request ID, tracking, demo login, donor
consent, lightbox, BN/EN, light/dark). Still unverified: real-device phone
check beyond emulation, Safari/Firefox/Android font rendering, full-page
dark-mode pixels, reduced-motion/keyboard/screen-reader pass.
