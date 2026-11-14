# FUNCTIONAL_TEST_REPORT.md — Satanipara Community, DIRECTION D (artifact v1)

Date: 2026-11-14 | Method: headless Chromium 1248 over CDP, artifact served over
local HTTP (`http://127.0.0.1:8901/index.html`). Fresh browser per round;
round 3 (fresh `--user-data-dir`, fresh debug port, freshness assertions) is
authoritative. Full logs: `/tmp/qa-probe/run2.log`, `run3.log`.
Screenshots: `/tmp/qa-probe/shots/01–17`.

Conventions: PASS means the check was run and the observed value matched the
expectation. Anything not run is listed in §4, never claimed as passed.

## 1. Test cases

### (a) Homepage — desktop 1440×900

| ID | Check | Expected | Observed | Verdict |
|---|---|---|---|---|
| A1 | Home loads, hero present | Hero h1 "একটি এলাকা, একটি পরিবার।" | Same, Anek 800 | PASS |
| A2 | No horizontal overflow @1440 | `scrollWidth ≤ innerWidth` | 1440 ≤ 1440 | PASS |
| A3 | Header height desktop | 64px | 64px | PASS |
| A4 | Hero field colour | Deep forest `#102E27` | `rgb(16,46,39)` | PASS |
| A5 | Hero min-height ~92vh | ≥700px at 900px viewport | 1097px (content taller than the 880px cap — photo + meta row extend it) | PASS (note) |
| A6 | Meridian line | 1px gold | `1px \| rgb(196,154,74)`, container 7990px tall | PASS |
| A7 | Heritage nodes | 1999 present | 1 `.mnode`; "১৯৯৯" present (single verified milestone — intentional, QA_REPORT D10) | PASS |
| A8 | Home sections | ≥8 | 9 sections, kickers 01–09 | PASS |
| A9 | Footer slogan colour/size | Ivory, not gold <32px | `rgb(231,228,210) \| 16px` — ivory; dead gold rule at `index.html:346` overridden by `:347` | PASS (see D8) |
| A10 | No gold buttons | 0 `.btn` with gold bg | 0 | PASS |
| A11 | Primary button fill | Forest | `rgb(16,46,39)` | PASS |
| A12 | Ticker strip | Present above nav | Present, h=44, forest bg — see D1 (spec: 36px, ivory bg, dismissible) | PASS with gap D1 |
| A13 | Gold numeral ১৯৯৯ | Gold, ≥32px | Gold, 54px | PASS |
| A14 | Forest fields per page | ≤2 | Hero + footer only; expat band is white `band-light` | PASS |
| A15 | Gold-text audit (home) | No gold text <32px | NONE found | PASS |

### (a) Homepage — mobile 360×800

| ID | Check | Expected | Observed | Verdict |
|---|---|---|---|---|
| B1 | No horizontal overflow @360 | `scrollWidth ≤ 360` | 360 | PASS |
| B2 | Header height | 56px | 56px | PASS |
| B3 | Header single row | All children inside header bounds | Yes | PASS |
| B4 | Hero readable | h1 fits 360px | h1 width 320px | PASS |
| B5 | Hamburger opens menu | `#mmenu.open` | Opens; 16 controls | PASS |
| B6 | Menu content | Nav items + CTA + theme/language | 12 nav links, CTA pill, close button (right-side drawer, not bottom sheet — D6) | PASS with gap D6 |

### (b) BN/EN toggle

| ID | Check | Observed | Verdict |
|---|---|---|---|
| C1 | EN toggle | Hero → "One neighbourhood,one family.", `lang=en` | PASS |
| C2 | BN toggle back | Hero restored, `lang=bn` | PASS |

### (c) Light/dark toggle

| ID | Check | Observed | Verdict |
|---|---|---|---|
| D1 | Dark on | `data-theme=dark`, body bg `rgb(12,19,15)` | PASS |
| D2 | Meridian in dark | Stays gold `rgb(196,154,74)` | PASS |
| D3 | Dark screenshot | Readable, hero deepens, toast "ডার্ক মোড চালু" visible | PASS (viewport only) |
| D4 | Back to light | `data-theme=light` | PASS |

### (d) Expatriate wizard → Request ID → tracking

Inputs used: service `medicine` (ওষুধ সংগ্রহ), for whom `মা — সাতানীপাড়া`,
details `ওষুধ কিনতে হবে, আগামীকালের মধ্যে`, when `today`; applicant
`পরীক্ষা প্রবাসী`, phone `01700000000`, country `সৌদি আরব`, consent checked.

| ID | Check | Observed | Verdict |
|---|---|---|---|
| E0 | Wizard structure | 2 tabs (new/track), 4 panes | PASS |
| E0b | No-service-charge text | Present ("কোনো চার্জ নেই" / "সার্ভিস চার্জ: ০ টাকা") | PASS |
| E0c | Not-an-emergency-service notice | Present, ৯৯৯ ("এই সেবা সরকারি জরুরি সেবার (৯৯৯) বিকল্প নয়") | PASS |
| E1 | Step 1 submit → step 2 | `form2.on=true` | PASS |
| E2 | Step 2 submit → review with values | Review shows "পরীক্ষা প্রবাসী", service, details; no invalid fields | PASS |
| E3 | Submit → new Request ID | `EXP-2026-4298` (round 3; `EXP-2026-9250` round 2) | PASS |
| E4 | Success pane | Request ID + "অপেক্ষমাণ" note, toast "আবেদন জমা হয়েছে" | PASS |
| E4b | Success mini-timeline (spec §7.1) | **0 nodes** in `#expSuccess` | FAIL → D2 |
| E5 | Track-new → 4-node timeline | `tstep now \| todo \| todo \| todo` | PASS |
| E5b | First node current + expenses | First node `now` ✓; fresh request shows 0-taka empty state (not the "সার্ভিস চার্জ ০" total row — that row appears only when expenses exist; verified on demo tracking) | PASS (expectation corrected) |
| E5c | Status pill + next action | "অপেক্ষমাণ · Pending" + "পর্যালোচনা" text | PASS |
| E8 | Demo tracking `EXP-2026-1052` | Loads; expenses ওষুধ ৳৮৫০ + যাতায়াত ৳১২০ = "মোট (সার্ভিস চার্জ ০) ৳৯৭০"; steps done/done/now/todo with real notes | PASS |

Validation (negative path, round 3): step-2 submit with consent unchecked was
not re-run in round 3; round-1/2 evidence shows the agree-check blocks
progress (`agreeErr` shown). Not claimed as passed — see §4.

### (e) Demo login → dashboard

| ID | Check | Observed | Verdict |
|---|---|---|---|
| F1 | `01700000000` / `demo1234` | `#/dashboard`, greeting "স্বাগতম, নমুনা সদস্য" | PASS |
| F2 | New request on dashboard | `EXP-2026-4298` listed | PASS |

### (f) Blood donor search + consent

| ID | Check | Observed | Verdict |
|---|---|---|---|
| G0 | Fresh filter state | `donorGroup='all'` | PASS |
| G1 | All donors render | 6 `.drow` rows | PASS |
| G2 | Phones masked by default | `01•••` shown | PASS |
| G3 | O+ chip filter | 6 → 1 row; data has exactly 1 O+ donor | PASS |
| G4 | Consent tap reveals phone | `01••• •••421` + "সম্মতি মিলেছে" pill + toast | PASS |
| G5 | Emergency request flow | Tab "জরুরি রক্তের অনুরোধ" → form → submit → done panel with "জরুরি অবস্থায় হাসপাতালের ব্লাড ব্যাংক ও ৯৯৯-এ যোগাযোগ করুন" | PASS (wording is "অনুরোধ", not "আবেদন" — probe string corrected) |

### (g) Gallery lightbox

| ID | Check | Observed | Verdict |
|---|---|---|---|
| H1 | Click opens lightbox | `open=true`, caption "2 / 8" after navigation | PASS |
| H2 | ArrowRight advances | `assets/hero.jpg` → `assets/paddy.jpg` | PASS |
| H3 | Esc closes | `open=false` | PASS |

### (h) Organisation — constitution accordion

| ID | Check | Observed | Verdict |
|---|---|---|---|
| I1 | Articles render | 5 `.acc-btn` | PASS |
| I1b | First starts open | `aria-expanded=true` | PASS |
| I2 | 2nd expands on click | `aria-expanded=true` + parent `.open` | PASS |

### (i) Finance year filter

| ID | Check | Observed | Verdict |
|---|---|---|---|
| J0 | Default year | `finYear=2026` | PASS |
| J1 | 2026 ledger | 6 rows | PASS |
| J2 | Demo-labelled | নমুনা present (banner + column header "টাকা (নমুনা)") | PASS |
| J3 | Year filter 2025 | Ledger changes (সদস্য চাঁদা ৳১,৮৪,০০০→৳১,৬২,০০০; প্রবাসী অনুদান ৳২,৫৬,০০০→৳২,১০,০০০) | PASS |

### (j) Console / network

| ID | Check | Observed | Verdict |
|---|---|---|---|
| K1 | Console errors, correct flow | **0** (round 3, all flows) | PASS |
| K2 | Failed requests | **0** (no 4xx/5xx, no loading failures; all assets incl. fonts/images 200 over local HTTP) | PASS |
| K3 | Edge case: empty-draft `#submitReq` click | **1 uncaught TypeError** (`SVC[undefined]['bn']`, `index.html:1887`); request `EXP-2026-7364` created with `service: undefined` | FAIL → D3 (DOM-only reachability) |

### Extra routes

`#/directory #/news #/activities #/faq #/contact #/membership #/rationale`
all render content (29,096 chars of `main` text each — the SPA renders all
views in one document). PASS.

## 2. Font checks (detail)

| ID | Check | Observed | Verdict |
|---|---|---|---|
| F1 | `document.fonts.status` | `loaded` | PASS |
| F2 | Anek 800 `check('শ্রী')` | `true` | PASS |
| F3 | Anek 400 conjuncts check | `true` | PASS |
| F4 | Tiro italic 400 `check('শ্রী')` | `true` | PASS |
| F5 | Hero computed font | `"Anek Bangla", …`, weight 800 | PASS |
| F6 | Quote computed font | `Tiro Bangla, italic, 400` | PASS |
| F7 | Canvas width discrimination | Anek 800: 546.17px vs fallback 505.07px | PASS |
| F8 | Visual specimen screenshot | Conjuncts `ক্ষ ত্র ষ্ট জ্ঞ শ্র ফ্র ব্র হ্র ন্ত ণ্ড স্থ শ্রী` joined at 48px/800 and 17px/400; numerals ০–৯ correct; Tiro italic quote clean (`shots/02-font-specimen.png`) | PASS |

## 3. Round history (why round 3 governs)

- **Round 1** (fresh browser): A/B/C/D/F/H passed; E1 failed on a probe bug
  (textarea setter); E-section bypass then created a broken request, which
  caused 4 console errors in later renders. Those 4 errors are attributable
  to the bypass, not to user flows.
- **Round 2** (intended fresh, actually reused round 1's live page —
  `chrome.kill()` had not terminated the browser and hash-only navigations
  don't reload): inherited logged-in user, O+ filter, finYear 2025, broken
  request, toggled consent checkbox. Its E2/G1/G3/J3 failures are
  contamination artifacts, not artifact defects. Discarded except for
  pre-contamination checks.
- **Round 3** (fresh profile + fresh port + freshness assertions): all flows
  re-run correctly — raw tally 26 pass / 4 fail. Of the 4 fails, 2 were
  probe-expectation errors resolved in round 4 (E5b: fresh requests correctly
  show the 0-taka empty state; G5: wording is "অনুরোধ" not "আবেদন"), leaving
  2 real fails (A12b strip 44px, E4b no mini-timeline). Authoritative.
- **Round 4** (fresh browser): edge-case confirmation (D3), blood emergency
  tab end-to-end (PASS), demo-tracking expense total row (PASS),
  strip-dismiss investigation (no dismiss control — D1).
- **Round 5** (fresh browser): full-page home screenshot; Meridian line
  1px gold × 7990px; gold-text audit NONE <32px; 9 sections.

## 4. Not tested (do not claim as passed)

- Step-2 validation negative path in a fresh session (consent unchecked,
  bad phone, short details) — blocked-submit behaviour seen only in the
  contaminated round 2.
- Helper login + helper queue status-advance.
- Member registration flow; profile/my-requests pages beyond dashboard greeting.
- Directory search/filter, activities year filter, news/notice detail pages,
  FAQ accordion, contact form submit, membership page actions.
- `prefers-reduced-motion`, keyboard-only navigation, screen reader.
- Real-device mobile (emulation only); Safari/Firefox font rendering.
- Notification permission grant path (headless cannot grant).
