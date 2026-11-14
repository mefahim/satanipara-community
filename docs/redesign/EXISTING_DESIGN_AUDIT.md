# EXISTING_DESIGN_AUDIT.md — Satanipara Community Full Website Prototype (v1)
**Phase 0 audit for the redesign — 2026-11-14**
**Audited file:** `~/workspace/your_files/satanipara-community-full-website-prototype/satanipara-community-full-website-prototype.html`
**Method:** structure extracted with grep/Python from the file (24.5 MB, 1,376 lines — 21 embedded base64 images dominate the size; ~127,600 chars of HTML/CSS/JS once images are stripped). The file was **not** read whole and **not** modified. Cross-checked against the v1 docs in `~/workspace/satanipara-community-website/docs/` (PROJECT_AUDIT, DESIGN_SYSTEM, SITEMAP, USER_FLOWS, UX_ARCHITECTURE, QA_REPORT, ASSUMPTIONS, PROJECT_PROGRESS, DESIGN_RESEARCH, SKILL_AUDIT).

**Scope reminder (standing):** demo data only — no real people, phones, statistics or finance invented. Admin roles: Super Admin + Expatriate Helper only. No OTP. Simulated login = mobile + password. No backend. This audit is a **functional** reference for the rebuild; v1 is **not** a visual reference.

---

## 0. File at a glance

| Fact | Value (measured) |
|---|---|
| Total size | 24,540,111 bytes / 1,376 lines |
| HTML/CSS/JS without images | ~127,600 chars |
| CSS | ~16,200 chars, single `<style>` block |
| JS | ~61,300 chars, 2 `<script>` blocks (i18n+theme in block 1; data+render+flows in block 2) |
| Images | 21 `<img>`/data occurrences, but only **3 distinct images** (reused 8×, 7×, 6×) |
| i18n keys | ~262 BN / ~270 EN in `I18N` dict (chrome + UI strings only) |
| JS functions | 35 named functions (`route`, `applyLang`, `t`, `setTheme`, `render*`, `trackRequest`, `showLb`, `toast`, …) |
| Inline `style="…"` attributes | **98** |
| `href="#"` dead links | 0; all 66 internal links are `href="#/…"` hash routes |
| Console errors (v1 QA probe) | 0; no horizontal overflow at 360 px (per QA_REPORT.md) |

---

## 1. Route / view inventory

Single-page app, hash routing, 10 views, one shared header/footer. `ROUTES = ["home","community","organization","activities","expatriate","blood","news","transparency","membership","contact"]`. Unknown hash falls back to `home`. `route()` toggles `.active` on `.view` sections, sets `aria-current="page"` on the matching nav links, scrolls to top, re-runs reveal, and focuses `#main`.

| # | Route | BN title (h1) | Contents (measured) |
|---|---|---|---|
| 1 | `#/home` | সাতানীপাড়া কমিউনিটি | Urgent-notice strip, header, hero (h1 + tagline + 3 CTAs + slogan strip + illustrated image + caption), stats row, **8 bands** (see §3.2) |
| 2 | `#/community` | কমিউনিটি প্রোফাইল | Directory: text search (`#dirSearch`), category chips (`#dirCats`, 11 categories incl. institutions/places), area select, result count, grid, empty state, reset; 16 demo entries |
| 3 | `#/organization` | সাতানীপাড়া সমাজ কল্যাণ সংঘ | History (1999), mission/vision, constitution summary (6 points), achievements (3), executive committee (6, demo names), advisory council (3), former presidents/GS (4) |
| 4 | `#/activities` | বার্ষিক কার্যক্রম | Year filter 2023–2026, 9 category chips, count, grid, empty state, reset; 10 demo activities; detail dialog via `openDlg` |
| 5 | `#/expatriate` | প্রবাসী সহায়তা সেবা | 7 service categories, policy blocks (no service charge / not an emergency-service replacement / Emergency Response Team 3–5), request form → review → submit → success + Request ID, tracking box, "track my request" / "new request" |
| 6 | `#/blood` | রক্তদাতা খুঁজুন | 8 blood-group chips, area select, availability-only checkbox, consent checkbox gating phone reveal, donor count, grid, empty state; 9 demo donors; emergency blood-request form → demo reference |
| 7 | `#/news` | সংবাদ, নোটিশ ও গ্যালারি | Tabs: news / notice / event / job / student achievement; year + category filters; 10 demo items; gallery grid (6 items) + lightbox |
| 8 | `#/transparency` | আর্থিক স্বচ্ছতা | Demo-labelled summary (income ৳ ৪,৮৫,০০০ / expense ৳ ৪,৩২,৫০০ / donations ৳ ১,৯০,০০০), 4-row project ledger, 3 annual reports (2023–2025) with detail + simulated PDF download |
| 9 | `#/membership` | সদস্য এলাকা | Login (mobile + password, demo 01700000000 / demo1234), forgot-password note (Super Admin resets), registration form, member dashboard: profile, expatriate profile, family info, My Requests, notifications (3 demo), profile edit form |
| 10 | `#/contact` | যোগাযোগ | Emergency block (999 ×3: ambulance/police/fire + not-a-replacement warning), office card (masked phone 01XXX-XXXXXX, office@example.org demo, Sat–Thu 9–5), contact form → success note (states message is not sent anywhere) |

**Global chrome (every view):** urgent-notice strip → sticky header (crest "সা" + brand + 10-item nav + EN/বাং toggle + 🌙/☀️ theme toggle + ☰ hamburger ≤900 px) → breadcrumbs on all 9 inner views → footer (brand, quick links, services, emergency note, demo-content disclaimer, © 2026).

---

## 2. What is working

Verified from code (and, where noted, from the v1 live probe in QA_REPORT.md).

### 2.1 Routing & navigation
- 10 hash routes, all reachable from header nav, mobile nav, footer, breadcrumbs and in-page CTAs; no dead links (`href="#"` count = 0).
- `aria-current="page"` on active nav item; `main` receives focus on route change; skip link present (off-screen until focus — standard pattern, flagged as "occluded" by the v1 audit tool but not a defect).
- Mobile hamburger toggles `.open`, swaps ☰/✕, sets `aria-expanded`, and closes on link tap.

### 2.2 Language switching (BN/EN)
- `I18N` dict: ~262 BN keys, ~270 EN keys. `t(k)` falls back BN → key. `applyLang()` swaps `document.documentElement.lang`, all `[data-i18n]` text, all `[data-i18n-ph]` placeholders (3), the toggle label (EN/বাং), then re-renders all JS content via `renderAll()`.
- Live-probe verified BN→EN→BN (QA_REPORT.md). **Limitation:** only chrome/UI strings are translated; JS data arrays (directory, activities, news, donors, gallery, reports) are Bengali-only — in EN mode their names/descriptions stay Bengali while labels/buttons switch. Long-form copy has EN summaries only in places (ASSUMPTIONS.md #7).

### 2.3 Theme switching (light/dark)
- `setTheme()` toggles `data-theme` on `<html>`; button shows 🌙/☀️; auto-dark on load if `prefers-color-scheme: dark` matches. Full dark palette defined (bg #0E2420, surface #143029, card #173A31, text #F0EBDA, muted #B9C6BB, line #2E554A, gold links #D9B96A).
- **Gaps:** no persistence — `localStorage`/`sessionStorage` count is 0, so theme **and** language reset on every reload. Images do not adapt to dark mode (same 3 illustrations).

### 2.4 Expatriate request flow (F1) — the primary journey, fully wired
- 7 service categories (`EXP_CATS`); choosing "বাড়ির জরুরি প্রয়োজন" unhides the Emergency Response Team block (`#ertBox`) with the not-an-emergency-service warning.
- Form fields: name, mobile, country, family member, address, service category, preferred date (optional), details, expense-acknowledgement checkbox. Inline validation: name ≥2 chars, mobile ≥11 digits (`digitsOk`), country/family ≥2, address ≥4, category required, details ≥10 chars, ack required; errors mark the label `.field-error` + show per-field messages (`setErr`, 22 `.err-msg` elements); a toast lists the problem on failed submit.
- Submit shows a spinner + "জমা হচ্ছে… / Submitting…" with the button disabled (simulated processing), then a **review step** (`#expReview`, `#revTable`, back/edit + confirm), then success (`#expSuccess`) with a generated Request ID `EXP-2026-XXXX` (random number), auto-fills the tracking box and runs `trackRequest()`.
- **Helper notification:** an 8-second toast "🔔 নতুন অনুরোধ! … প্রবাসী সহায়কদের কাছে বিজ্ঞপ্তি পাঠানো হয়েছে (নমুনা ব্রাউজার নোটিফিকেশন)" — the simulated browser notification to Expatriate Helpers required by the Phase 1 scope.
- **Tracking:** `trackRequest()` looks up `REQUESTS` (seeded demo IDs EXP-2026-1052 status 3/Completed with expense table ৳850 medicine + ৳120 transport + ৳0 service charge; EXP-2026-1047 status 2/In Progress), renders a 4-step timeline (Pending → Accepted → In Progress → Completed) with current-step marker, helper name, family member, expense ledger, and note. Unknown ID → "not found" box naming both demo IDs. Live-probe verified for EXP-2026-1052.
- **Not driven end-to-end in the v1 probe:** the full fill → review → submit → new Request ID sequence (code-checked only; probe hit Bengali-label ambiguity). Rebuild must drive it in QA.

### 2.5 Blood donor search (F2) — privacy model works
- Filters: 8 blood-group chips (`#bloodGroups`), area select (উত্তরপাড়া/মধ্যপাড়া/দক্ষিণপাড়া), availability-only checkbox; result count ("N জন দাতা পাওয়া গেছে (নমুনা)"); empty state ("এই গ্রুপে এই এলাকায় এখন কোনো নমুনা দাতা নেই" + widen-filters hint); 9 demo donors with group/area/last-donation/availability badge.
- **Consent gating works:** phone shows as `01XXX-XXXXXX` until `#consentBox` is checked ("আমি বুঝেছি — দাতার নম্বর শুধুমাত্র রক্তের প্রয়োজনে ব্যবহার করব…"); when checked, the masked demo number (`017XX-XXXX01` etc., labelled "নমুনা নম্বর") is revealed. Re-render on consent change.
- Emergency blood-request form (patient, hospital, group, units, contact) with inline validation → success + demo reference (`#bloodRef`) + toast.

### 2.6 Directory, activities, news, gallery, transparency
- **Directory (F3):** 16 demo entries across 11 categories (professional, teacher, doctor, engineer, business, govt, freedom fighter, student, institution, religious, place); name/role/institution search + category chips + area filter + count + empty state + reset. Detail view via dialog.
- **Activities (F5):** 10 demo activities, year filter 2023–2026, 9 category chips, count, empty state, reset; detail dialog (`openDlg`, native `<dialog>`, close button).
- **News (F7):** 5 tabs with `role="tab"`/`aria-selected`; year + category filters; 10 demo items; gallery grid (6 items) → **lightbox** (`<dialog id="lightbox">`, prev/next buttons, counter "(n/6)", caption, Esc closes natively, ArrowLeft/ArrowRight navigate via a `keydown` handler — **arrow-key nav was code-checked only, not driven in the v1 probe**).
- **Transparency (F6):** demo-labelled summary cards, 4-row project ledger (income/expense/status), 3 annual reports with detail view and simulated PDF download (generates a demo notice, no real file).

### 2.7 Membership / login (F4) — no OTP, as scoped
- Login: mobile (≥11 digits) + password (non-empty), inline errors. **Demo credentials 01700000000 / demo1234** open the dashboard (`#authZone` hidden, `#dashZone` shown, toast "লগইন সফল হয়েছে (নমুনা)"); wrong credentials show `#loginErr`. Logout returns to the login form. Live-probe verified.
- Forgot password: message that the Super Admin resets it (per Phase 1 simplification — no OTP anywhere in the file).
- Registration form (name, mobile, address, member type) → success state. Dashboard: profile card, expatriate profile, family info, **My Requests** (renders all `REQUESTS` keys as links; clicking one jumps to `#/expatriate`, auto-fills the tracking box and runs tracking), notifications list (3 demo items incl. the EXP-2026-1052 completion notice), profile-edit form (name, country, address, blood group) → simulated save confirmation.
- **Note:** login state is in-memory only (no persistence — reload logs the user out; see §5).

### 2.8 Forms & validation (general)
- 6 forms: `expForm`, `bloodForm`, `contactForm`, `loginForm`, `regForm`, `editForm`. All use `preventDefault`, per-field `setErr` (label gets `.field-error`), Bengali error strings with EN equivalents in the i18n dict, and success states. Contact form success explicitly states the message is not sent anywhere in the prototype.
- All buttons do something: every button navigates, filters, opens a dialog/lightbox, or shows a state (per UX_ARCHITECTURE.md "no dead buttons" — confirmed: no `href="#"`, no unbound buttons found).

### 2.9 States, feedback & accessibility
- Toast system (`#toasts`, `aria-live="polite"`, 6 s default, 8 s for the helper notification); empty states on all four filtered lists; simulated loading spinner on expatriate submit; success/error states on every flow.
- `prefers-reduced-motion` respected (reveal animation disabled); `:focus-visible` 3 px gold outline; 44 px minimum touch targets (`button, [role=button], select, summary, input:not([type=checkbox]) {min-height:44px}`); `aria-live` ×10; labelled controls; `lang` attribute switches with language.
- Reveal-on-scroll via `IntersectionObserver` (`.reveal` → `.play`, `rise` 0.6 s animation), re-initialised per route; falls back to showing content if the API is missing.

### 2.10 Demo labelling
- "নমুনা" appears 207×; `.demo-tag` pill (gold bg, "নমুনা"/"DEMO") used 14× statically + 12× via `demoTag()` in JS renders; unverified statistics show "তথ্য হালনাগাদ হচ্ছে" (4×); footer carries a demo-content disclaimer. No real person, phone, statistic or financial figure is presented as real.

---

## 3. What is visually weak

Evidence-based, from the code. (v1 was built as a functional prototype; the rebuild's job is to make it look as good as it works.)

### W1. Only 3 distinct images, recycled 21 times — the single biggest visual weakness
- The file embeds 3 base64 images (∼1.0 MB, ∼1.4 MB, ∼1.0 MB) reused 8×, 7× and 6×. The same rural-scene illustration is the hero image, the story-band image, and a gallery item; the same volunteer-delivery image illustrates the expatriate band, several of the 10 activities, and gallery items; the same gathering image recurs across activities and the gallery.
- Consequences: the 6-item gallery shows only 3 distinct pictures; the 10 activity cards share images so different events look identical; home and inner views repeat the same visuals. A visitor scrolling the site sees the same 3 pictures everywhere. **Rebuild must not fix this by inventing photos** — it needs real Satanipara photos (with consent) or a deliberate typographic/crest-led art direction that does not pretend 3 illustrations are a photo library. Until real photos exist, image slots should be designed as distinct compositions (colour blocks, patterns, crest motifs, maps) rather than the same picture re-captioned.

### W2. Every section is the same template: kicker + h2 + gold rule + card grid
- Measured repetition: `.gold-rule` 20×, `.kicker` 19×, `.card` 40×, `.grid` 15×, `.grid-3` 12×, `.badge` 18×. Nearly every band opens with the identical sequence — small uppercase Latin kicker → serif h2 → 64 px gold rule → a 2/3/4-column grid of white/paper cards.
- The 8 home bands differ only in background (`band` / `band-soft` / `band-dark`) and column count. There is no editorial variation: no full-bleed image band, no pull-quote, no numbered feature list, no asymmetric layout except the hero. The `.stagger` editorial-offset class exists in CSS but is applied to only **1 element** in the whole file, and is disabled below 900 px.
- The design system (DESIGN_SYSTEM.md) promised "asymmetric hero (7/5 split); editorial offsets (staggered cards, pull quotes)" — the hero is a 1.05fr/0.95fr grid (near-symmetric), and pull quotes do not exist in the file.

### W3. The 14-section homepage plan was compressed to 9 blocks, with awkward pairings
- Blueprint/UX_ARCHITECTURE.md specified 14 homepage sections. The build has hero + stats + 8 bands. Merged away: the **activity gallery strip** (no separate section — gallery only appears as band 6), **news/notices as its own section** (the latest-news list is stuffed inside the blood-donor band, band 3, under the same h2 "এক ব্যাগ রক্ত, একটি জীবন" — news and blood donation share one band and one heading, which reads as a mistake), and **upcoming events + community stories** merged into a single band ("আসন্ন অনুষ্ঠান ও আমাদের গল্প").
- The stats row — the trust anchor of a community homepage — contains **zero numbers**: all 4 cells read "তথ্য হালনাগাদ হচ্ছে" (correct per the no-fabrication rule, but visually it is four identical placeholder cells with a gold top border; it looks unfinished rather than intentional).

### W4. Typography: one voice everywhere, and smaller than the design system specified
- All headings (h1, h2, h3) use the same family (`--font-display`, Noto Serif Bengali) at the same weights (800/700/700); there is no display-vs-section-vs-card hierarchy beyond size. Card titles, dialog titles, stat numbers and buttons all share the same few sizes.
- Sizes run smaller than DESIGN_SYSTEM.md: hero h1 is `clamp(2.1rem,5.6vw,3.5rem)` vs specified `clamp(2.4rem,6vw,4.2rem)`; generic h1 `clamp(1.9rem,5vw,3.2rem)`; section h2 `clamp(1.45rem,3.4vw,2.15rem)` vs specified `clamp(1.6rem,3vw,2.2rem)`. The hero therefore reads as a large section heading, not a display moment.
- Body line-height 1.8 is correct for Bengali, but the type scale is flat: ~30 distinct `font-size` declarations cluster at .68–1.3rem with no clear stepped scale (spec listed 12/13/15/16/18/20/24/32/40/56 px). The `.kicker` (uppercase Latin, letter-spacing .14em) is the only typographic device that varies — and it is used 19×, so it stops signalling anything.

### W5. Gold is overused — it stops being an accent
- DESIGN_SYSTEM.md: "Gold = sparing accent: rules, badges, active states, never large backgrounds or gradients." Measured: gold rule 20×, gold kicker 19×, gold demo-tag pills, gold stat top border, gold buttons (`.btn-gold` 12×), gold badges (`.badge-wait`), gold crest ring, gold focus outline, gold link colour in dark mode. Gold appears in every single band. The demo-tag pill is gold on every card, so "নমুনা" shouts louder than the content it labels.
- Related: the dark bands (`band-dark`, 2 on home) use the same deep green + gold pairing as the header/footer, so dark sections do not feel distinct from chrome.

### W6. Spacing is ad-hoc: 98 inline styles, no consistent rhythm
- 98 `style="…"` attributes carry one-off `margin-top:8/10/12/14/16/18/20/22/28/30/32/36px`, `padding-top:22px` (repeated on every inner view's first band), `max-width:70ch/72ch`, `flex:0 1 180/200/220px`, etc. The spacing scale in DESIGN_SYSTEM.md (`--space-1`…`--space-9`) was never implemented as CSS variables — spacing lives in inline styles and scattered rules.
- Section padding is only two values (`.band` 56 px, `.band.tight` 36 px) mixed inconsistently on home (bands 0–4 use 56 px, bands 5–7 use 36 px with no visual logic — the gallery and transparency-preview bands get the tight treatment while services get the roomy one). Container is 1200 px, not the specified 1180 px.

### W7. Design-system drift (spec vs built)
| Token | Specified (DESIGN_SYSTEM.md) | Built (measured) |
|---|---|---|
| Container | 1180 px | 1200 px (`.wrap`) |
| Breakpoints | 360 / 640 / 900 / 1180 / 1440 | 480 / 520 / 560 / 800 / 900 / 1080 (no 360, 640, 1180, 1440) |
| Hero h1 | clamp(2.4rem, 6vw, 4.2rem) | clamp(2.1rem, 5.6vw, 3.5rem) |
| Section h2 | clamp(1.6rem, 3vw, 2.2rem) | clamp(1.45rem, 3.4vw, 2.15rem) |
| Radius | 10 px / 16 px | 6 px / 14 px (`--radius`/`--radius-lg`) |
| Shadow | 0 1px 2px + 0 8px 24px rgba(16,46,39,.08) | 0 10px 30px rgba(16,46,39,.10) — heavier, single layer |
| Reveal | translateY 12 px + fade, 320 ms | `rise` 0.6 s animation (nearly double) |
| Spacing scale | `--space-1`…`--space-9` | not implemented; inline styles instead |
| Grid | 12-col desktop / 8-col tablet / 4-col mobile | simple 2/3/4-col grids, no 12-col system |

### W8. Cards are visually identical regardless of content type
- One `.card` style (paper bg, 1 px line border, radius 14 px, shadow on hover only) serves 40 instances: service cards, donor cards, activity cards, news items, report cards, profile cards, committee lists, ledger tables. A donor card, a financial report card and a committee-member row look the same; content type is signalled only by the text inside. The service cards (`.svc-card`, 6 on home) are the only differentiated card — a 52 px icon tile in `--soft` — and even those share one icon style (emoji glyphs: 🏅, 📍, 🚑…; no consistent icon set).
- Emoji are used as the entire icon system (hero CTAs have none; service icons, emergency block, achievements, toasts all use emoji). In dark mode the service icon colour flips forest→gold, but emoji glyphs do not, so icon colour is inconsistent across themes.

### W9. Colour: only two hues + neutrals, and dark mode is a variable swap, not a design
- Palette is forest/deep/gold + ivory/paper neutrals — no secondary hue anywhere (the status badges add green/red/blue-green tints, but only inside pills). Large flat areas of ivory/paper dominate; the only saturated colour on most views is the gold rule and the green header/footer.
- Dark mode redefines variables but does not re-art-direct: images, emoji, gold rules and the crest are identical; `--card` #173A31 on `--bg` #0E2420 is low-contrast against `--surface` #143029, so cards barely separate from the page in dark mode. Hardcoded light colours remain in places (e.g. `#F5F1DE` headings, `#231A05` demo-tag text, `rgba(255,255,255,.35)` spinner) — the dark theme was not audited for stray light values.

### W10. Minor visual/UX nits (evidence in code)
- The urgent-notice strip is plain text with a "দেখুন" link; it competes with the header rather than reading as an alert.
- The crest is a text glyph "সা" in a bordered circle (46 px) — no logo mark; the brand lockup is text-only in header and footer.
- The lightbox `<dialog>` has no backdrop styling in CSS (relies on the UA default `::backdrop`), and its image has no max-height constraint in the markup — a tall image can overflow the viewport height.
- The detail dialog (`#detailDlg`) and lightbox share no common dialog styling.
- `h3` inside the dashboard greeting reads "স্বাগতম, নমুনা সদস্য নমুনা প্রোফাইল" — the demo name concatenation reads awkwardly.
- News dates are all the literal string "নমুনা তারিখ" (demo date) — correct labelling, but every news item shows the same placeholder date, which looks like a bug rather than a label.

---

## 4. What should be preserved (functionality / business logic)

Everything in this section is **working behaviour the rebuild must not lose**. It is the functional contract, independent of how v1 looks.

### 4.1 Flows (must keep, end-to-end)
1. **F1 Expatriate request** — discover (home/nav) → 7 service categories → policy read (no service charge; actual cost + transport borne by applicant; NOT an emergency-service replacement; Emergency Response Team 3–5) → form (9 fields, §2.4 validation rules) → review screen with edit-back → simulated submit (spinner + "জমা হচ্ছে…", button disabled) → success with generated `EXP-2026-XXXX` Request ID → auto-track → **helper-notification toast** (8 s, "নতুন অনুরোধ! … সহায়কদের কাছে বিজ্ঞপ্তি পাঠানো হয়েছে") → 4-step status timeline + expense ledger (service charge always ৳ ০) + helper name + family member + note.
2. **F1b Tracking (standalone)** — enter any Request ID → timeline + expenses; seeded demo IDs **EXP-2026-1052** (Completed, expenses ৳850 + ৳120 + ৳0) and **EXP-2026-1047** (In Progress); unknown ID → not-found message naming both demo IDs.
3. **F1c Emergency path** — choosing "বাড়ির জরুরি প্রয়োজন" reveals the Emergency Response Team block **before** the form, with the not-a-replacement warning.
4. **F2 Blood donor search** — 8-group chips + area + availability-only → count + results (group badge, area, last donation, availability badge) + empty state; **consent checkbox gates phone reveal** (masked `01XXX-XXXXXX` → masked demo number + "(নমুনা নম্বর)" label); emergency blood-request form (5 fields) → demo reference + toast.
5. **F3 Directory** — text search + 11 category chips + area filter + count + empty state + reset; 16 demo entries; detail dialog.
6. **F4 Member login (NO OTP)** — mobile + password, inline validation; **demo 01700000000 / demo1234** → dashboard; wrong credentials → error; logout; forgot-password note (Super Admin resets — no OTP anywhere); registration form → success; dashboard: profile, expatriate profile, family info, **My Requests** (links jump to tracking), notifications (3 demo), profile edit → simulated save.
7. **F5 Activities** — year 2023–2026 + 9 category filters + count + empty state + reset; detail dialog.
8. **F6 Transparency** — demo-labelled summary (income/expense/donations) + project ledger (4 rows) + annual reports (3) with detail + simulated PDF download.
9. **F7 News & gallery** — 5 tabs (news/notice/event/job/student achievement) + year/category filters; gallery (6 items) + lightbox with prev/next, counter, caption, Esc close, ArrowLeft/ArrowRight nav.
10. **F8 First visit** — within 30–60 s a new visitor can find services, blood search, expatriate help, latest notice, contact/emergency (home CTAs + notice strip + footer emergency block).

### 4.2 Global behaviours
- 10 hash routes, fallback to home, `aria-current`, focus-to-`#main` on route change, scroll-to-top.
- BN/EN toggle (chrome + UI strings, ~262/270 keys, `lang` attribute switch, fallback to BN); theme toggle (light/dark + auto-dark from `prefers-color-scheme`).
- Mobile hamburger ≤900 px (44 px targets, `aria-expanded`, closes on tap).
- Skip link, `:focus-visible` gold outline, 44 px touch targets, `aria-live` toasts, `prefers-reduced-motion`, labelled controls, `role="tab"`/`aria-selected` on news tabs.
- Demo labelling: "নমুনা" pill on demo content, "তথ্য হালনাগাদ হচ্ছে" for unverified statistics, demo figures labelled on transparency, footer disclaimer, contact form stating messages are not sent.
- No dead buttons/links; empty states on all four filtered lists; inline validation with Bengali messages on all 6 forms.

### 4.3 Data inventory (demo content the rebuild re-uses or replaces 1:1)
- Directory 16 entries / 11 categories; activities 10 / 9 categories; news 10 / 5 tabs; gallery 6; donors 9 / 8 groups; reports 3; committee 6 + advisory 3 + former 4; achievements 3; notifications 3; seeded requests 2 (EXP-2026-1052, EXP-2026-1047); service categories 7; transparency figures (income ৳ ৪,৮৫,০০০ / expense ৳ ৪,৩২,৫০০ / donations ৳ ১,৯০,০০০; project ledger 4 rows).

---

## 5. What should be redesigned

| Area | Redesign direction (visual only — function stays per §4) |
|---|---|
| **Imagery** | Replace the 3-image recycling with a real art-direction system: distinct compositions per slot (crest/pattern/colour-field/map motifs) until real photos exist; never re-caption the same picture as different content. Gallery and activity cards must not share identical images. |
| **Homepage structure** | Restore the 14-section rhythm from the blueprint: separate news/notices section (do not nest it inside the blood band), separate activity-gallery strip, separate upcoming-events and community-stories sections; give the stats row an intentional "updating" design instead of four identical placeholder cells. |
| **Section system** | Break the kicker + h2 + gold-rule + card-grid monotony: varied section templates (full-bleed image band, pull-quote, numbered list, asymmetric 7/5, editorial stagger that actually ships, dark feature band). Retire the gold rule as the default section opener. |
| **Typography** | Real hierarchy: display hero size per the design system (up to 4.2 rem), stepped scale, distinct card/dialog/stat type styles; reduce kicker usage to true section labels; consider a second display treatment for Bengali headlines so h1/h2/h3 do not all read identically. |
| **Colour** | Gold back to a sparing accent (rules/badges/active states only); introduce a considered secondary use (e.g. soft tints per content type) so cards for donors vs reports vs committee are distinguishable; re-art-direct dark mode (card/page separation, image treatment, no stray hardcoded light colours). |
| **Cards** | Content-type card variants (donor, activity, news, report, committee, profile) instead of one universal `.card`; consistent icon set to replace emoji-as-icons. |
| **Spacing** | Implement the spacing scale as real tokens; delete the 98 inline styles; consistent section padding with a reason for tight vs roomy. |
| **Header/brand** | Proper crest/logo mark (the "সা" text circle is a placeholder); urgent-notice strip designed as an alert, not a text line; nav hierarchy for 10 items (consider grouping — 10 top-level items is a lot). |
| **Dialogs/lightbox** | One dialog system: styled `::backdrop`, max-height/max-width constraints, shared close behaviour, focus handling; lightbox caption/counter styling. |
| **Design tokens** | Reconcile tokens with DESIGN_SYSTEM.md (container 1180, breakpoints 360/640/900/1180/1440, radius 10/16, shadow, reveal 320 ms) or formally revise the spec — do not silently drift again. |

---

## 6. What needs functional improvement

(Behaviour gaps found in code — not visual. All are additions to, not replacements of, §4.)

1. **Persist theme + language + login.** `localStorage`/`sessionStorage` are never used: theme, language and login state all reset on reload. A user who picks dark mode or EN, or logs in, loses it on refresh. Persist all three (login as a demo session flag only — still no backend, no real auth).
2. **Drive the two un-probed flows in QA.** Full expatriate form-fill → review → submit → new Request ID, and lightbox arrow-key navigation, were code-checked only in v1 (QA_REPORT.md). The rebuild's QA must drive both end-to-end (and the "track my request" deep-link from My Requests).
3. **Complete the EN layer.** JS-rendered data (directory, activities, news, donors, gallery, reports) is Bengali-only in EN mode. Either translate the demo data arrays or show an explicit EN summary per item; do not leave EN users reading Bengali descriptions under English labels. (Per ASSUMPTIONS.md #7, confirm the EN depth wanted with Fahim/client.)
4. **Review-screen validation edge.** The expatriate review step renders submitted values via `esc()` — keep that escaping in the rebuild (XSS hygiene), and keep the "edit back" path working from review.
5. **Request-ID generation.** Current IDs are random (`EXP-2026-` + random number) and are not stored beyond the session — a newly created ID works for tracking only until reload (it is added to `REQUESTS` in memory). Decide: keep in-memory (document it) or persist to `localStorage` so a new request survives a reload. Do not invent a backend.
6. **Donor data depth.** 9 donors across 3 areas × 8 groups is thin — several group/area combinations are empty by construction. Either seed more demo donors or make the empty state smarter (suggest the nearest group/area). Keep numbers masked and consent-gated.
7. **News dates.** All news items carry the literal string "নমুনা তারিখ". Give demo items distinct demo dates (labelled নমুনা) so the list does not look broken.
8. **Accessibility polish.** Add a real focus trap/return-focus for the detail dialog and lightbox (native `<dialog>` helps, but return-focus to the opener is not implemented); give the lightbox image a `max-height`; add `aria-describedby` where the consent checkbox gates content; verify the skip link is reachable/visible on focus in the rebuild's QA.
9. **Performance.** 24.5 MB single file is dominated by 3 base64 images (~3.4 MB of image data, duplicated by reuse). The rebuild should not inline multi-MB base64 images repeatedly — use each image once, compress, or (preferably) use the new art-direction system from §5.
10. **Admin preview link.** The prototype references the existing `satanipara-community-dashboard` demo for admin preview rather than rebuilding it (ASSUMPTIONS.md #8). Confirm that link is acceptable and wire it explicitly in the rebuild (currently only noted in docs, not linked in the file).

---

## 7. Functionality-preservation checklist (rebuild must not lose)

Tick each item in rebuild QA. "Kept" means the behaviour exists and was driven, not just present in code.

### Routes & chrome
- [ ] 10 hash routes, all reachable; unknown hash → home
- [ ] Header nav (10 items) + mobile hamburger ≤900 px + footer links + breadcrumbs on inner views
- [ ] Skip link, focus-visible outline, 44 px touch targets, `aria-current` on active nav
- [ ] Urgent-notice strip on every view; footer emergency note + demo disclaimer

### Language & theme
- [ ] BN/EN toggle translates chrome + UI strings; `lang` attribute switches; BN fallback
- [ ] Theme toggle light/dark + auto-dark from `prefers-color-scheme`
- [ ] (New) theme + language persisted across reload

### Expatriate (F1)
- [ ] 7 service categories; emergency category reveals ERT block first
- [ ] Form: 9 fields, inline validation rules (§2.4), ack checkbox required
- [ ] Review screen with edit-back; simulated submit (spinner + "জমা হচ্ছে…", button disabled)
- [ ] Success with generated `EXP-2026-XXXX`; auto-track; helper-notification toast (8 s)
- [ ] Tracking: 4-step timeline + expense ledger (service charge ৳ ০) for EXP-2026-1052 (Completed) and EXP-2026-1047 (In Progress); unknown ID → not-found message naming both demo IDs
- [ ] Policy text intact: no service charge; actual cost + transport borne by applicant; NOT an emergency-service replacement; ERT 3–5

### Blood donor (F2)
- [ ] 8-group chips + area + availability-only filters; count; empty state
- [ ] Consent checkbox gates phone reveal (masked `01XXX-XXXXXX` → masked demo number + "(নমুনা নম্বর)")
- [ ] Emergency blood-request form (5 fields) → demo reference + toast

### Directory / activities / news / gallery / transparency
- [ ] Directory: search + 11 category chips + area filter + count + empty state + reset; 16 entries; detail dialog
- [ ] Activities: year 2023–2026 + 9 category filters + count + empty state + reset; 10 items; detail dialog
- [ ] News: 5 tabs + year/category filters; 10 items
- [ ] Gallery: 6 items; lightbox with prev/next, counter, caption, Esc + arrow-key nav
- [ ] Transparency: demo-labelled summary + 4-row project ledger + 3 annual reports + simulated PDF download

### Membership (F4)
- [ ] Login mobile + password (no OTP anywhere); demo **01700000000 / demo1234** opens dashboard; wrong credentials → error
- [ ] Forgot-password note: Super Admin resets
- [ ] Registration form → success; dashboard: profile, expatriate profile, family info, My Requests (links deep-link to tracking), notifications (3), profile edit → simulated save
- [ ] Logout returns to login

### Forms, states, labelling
- [ ] All 6 forms validate inline with Bengali messages; all buttons do something (no dead controls)
- [ ] Toasts (`aria-live`), empty states, loading spinner on submit, success states
- [ ] Demo labelling: "নমুনা" pills, "তথ্য হালনাগাদ হচ্ছে" for unverified stats, demo figures labelled, contact form states messages are not sent
- [ ] `prefers-reduced-motion` respected; no console errors; no horizontal overflow at 360 px

---

## 8. Sources

- `~/workspace/your_files/satanipara-community-full-website-prototype/satanipara-community-full-website-prototype.html` (24,540,111 bytes; analysed by extraction, not read whole)
- `~/workspace/satanipara-community-website/docs/` — PROJECT_AUDIT.md, DESIGN_SYSTEM.md, SITEMAP.md, USER_FLOWS.md, UX_ARCHITECTURE.md, QA_REPORT.md, ASSUMPTIONS.md, PROJECT_PROGRESS.md, DESIGN_RESEARCH.md, SKILL_AUDIT.md (all read 2026-11-14)
- Standing scope: 2 admin roles only (Super Admin + Expatriate Helper), NO OTP, simulated login mobile+password, no backend, demo data only.

*No existing artifact or v1 doc was edited in this audit.*
