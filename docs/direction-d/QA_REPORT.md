# QA_REPORT.md — Satanipara Community, DIRECTION D (artifact v1)

Date: 2026-11-14 | QA engineer: independent verification (no edits made to the artifact)
Artifact: `satanipara-community-direction-d` — 'Satanipara Community — Direction D' (web_static, v1)
Design intent: `DESIGN_SYSTEM.md` + `DESIGN_RATIONALE.md` in this folder
('The Meridian' single gold line, dark forest hero, cool-white ground, Anek Bangla
weight-led type, Tiro italic quotes only, max two forest fields per page,
no gold buttons / gradients / glassmorphism).

## Verdict: PASS WITH GAPS

Everything functional passes on a fresh browser with **0 console errors and
0 failed requests**. The fonts — the key outstanding item — are **verified
rendered** (see §3). The gaps are 11 low/trivial design-intent deviations
and one low-severity robustness edge case (§5). No defect blocks use.

## 1. Method (what was actually run)

- Served the built artifact over local HTTP (`python3 -m http.server`,
  `http://127.0.0.1:8901/index.html`) and drove **headless Chromium 1248**
  over CDP with Node scripts (`/tmp/qa-probe/probe*.mjs`, logs
  `/tmp/qa-probe/run2.log`, `run3.log`).
- Viewport checks at 1440×900 (desktop) and 360×800 (mobile); full-page
  home screenshot 1440×9587; screenshots inspected visually
  (`/tmp/qa-probe/shots/01–17`).
- **Contamination note (important):** rounds 1–2 accidentally shared one
  Chrome page session (`chrome.kill()` did not terminate the browser, and
  hash-only navigations do not reload the page), so round 2 inherited round 1's
  in-memory state (logged-in user, O+ donor filter, finYear 2025, a broken
  request, a toggled checkbox). Round 3 re-ran every flow on a guaranteed-fresh
  browser (fresh `--user-data-dir`, fresh debug port, freshness assertions:
  `state.user===null`, `donorGroup==='all'`, `lang==='bn'`, year 2026).
  **Round-3 results are authoritative.** Round 1–2 results are cited only
  where they ran before any contamination (desktop/mobile header, fonts,
  toggles, lightbox) or where round 3/4 re-confirmed them.
- Probe bugs found and fixed during QA (not artifact defects): textarea value
  setter, accordion first item starts open, Bengali ৯৯৯ vs Latin 999,
  "অনুরোধ" vs "আবেদন" wording, dead gold CSS rule on the footer slogan.
  Each is marked in the functional report.

## 2. Per-flow results

| # | Flow | Result | Evidence |
|---|---|---|---|
| (a) | Homepage desktop 1440 | PASS | Hero deep forest `rgb(16,46,39)`, h1 Anek 800, hero-in 1097px; 9 sections; no overflow (`scrollW=1440`); header 64px; Meridian 1px gold, 7990px tall, 1 node; footer slogan ivory 16px; 0 gold buttons; gold-text audit: NONE <32px |
| (a) | Homepage mobile 360 | PASS | No overflow (`scrollW=360`); header 56px single row, all children inside bounds; h1 width 320px; hamburger opens menu (16 controls); screenshot clean |
| (b) | BN/EN toggle | PASS | Hero BN "একটি এলাকা,একটি পরিবার।" → EN "One neighbourhood,one family.", `lang=en`; back to BN restores text + `lang=bn` |
| (c) | Light/dark toggle | PASS | `data-theme` light↔dark; dark ground `rgb(12,19,15)`; Meridian stays gold in dark; dark viewport screenshot verified readable |
| (d) | Expatriate wizard → Request ID → tracking | PASS | Step 1 (medicine, মা, details ≥10 chars) → step 2 (name/phone/country + consent) → review shows entered values → submit → new ID `EXP-2026-4298`; tracking: 4 nodes (`now/todo/todo/todo`), status pill "অপেক্ষমাণ · Pending", 0-taka empty state; demo `EXP-2026-1052` → ledger ৳970 with "মোট (সার্ভিস চার্জ ০)"; no-service-charge + not-an-emergency-service (৯৯৯) notices present |
| (e) | Demo login → dashboard | PASS | `01700000000` / `demo1234` → `#/dashboard`, greeting "স্বাগতম, নমুনা সদস্য", new request listed on dashboard |
| (f) | Blood donor search + consent | PASS | 6 rows, phones masked `01•••`; O+ chip → exactly 1 O+ donor; consent tap → `01••• •••421` + "সম্মতি মিলেছে" pill; emergency tab → form → done panel with ৯৯৯ note ("হাসপাতালের ব্লাড ব্যাংক ও ৯৯৯-এ যোগাযোগ করুন") |
| (g) | Gallery lightbox + arrow keys | PASS | Click opens (`open=true`); ArrowRight `assets/hero.jpg` → `assets/paddy.jpg` (caption "2 / 8"); Esc closes |
| (h) | Constitution accordion | PASS | 5 articles; first starts open; 2nd expands on click (`aria-expanded=true` + parent `.open`) |
| (i) | Finance year filter | PASS | 2026 default, 6 rows; 2025 → different ledger (৳১,৮৪,০০০→৳১,৬২,০০০ etc.); all figures demo-labelled (নমুনা) |
| (j) | Console errors | PASS | **0 console errors, 0 page errors, 0 failed requests** across the full correct-flow session (round 3, fresh browser). See §4 for the one edge-case exception |
| — | Extra routes | PASS | `#/directory #/news #/activities #/faq #/contact #/membership #/rationale` all render content (>200 chars each) |

## 3. Font verdict: VERIFIED RENDERED

**Anek Bangla and Tiro Bangla both rendered — verified from live rendering,
not code inspection.**

Evidence (headless Chromium 1248, Linux):
- `document.fonts.status === 'loaded'`; all 5 self-hosted faces `loaded`:
  Anek Bangla 100–900 (Bengali + Latin woff2), Tiro Bangla italic 400
  (Bengali + Latin), Manrope 400–800.
- `document.fonts.check('800 48px "Anek Bangla"', 'শ্রী') === true`;
  `check('400 17px "Anek Bangla"', 'ক্ষ ত্র ষ্ট জ্ঞ শ্র ফ্র') === true`;
  `check('italic 400 32px "Tiro Bangla"', 'শ্রী') === true`.
- Computed styles: hero h1 `font-family: "Anek Bangla", …` weight 800;
  body Anek Bangla; pull-quote `Tiro Bangla, italic, 400`.
- Canvas width discrimination: conjunct string measures 546.17px in Anek 800
  vs 505.07px in generic sans-serif (different face genuinely in use).
- **Visual:** injected specimen overlay (runtime-only, not in the artifact)
  screenshot `shots/02-font-specimen.png` — at 48px/800, all of
  `ক্ষ ত্র ষ্ট জ্ঞ শ্র ফ্র ব্র হ্র ন্ত ণ্ড স্থ শ্রী` render as clean joined
  shapes (ra-phala শ্র/ফ্র/ত্র formed below-base, no visible hasant +
  separate letters); at 17px/400, "শ্রমিকের শ্রেণিকক্ষে ফ্রি প্রযুক্তি —
  ০১২৩৪৫৬৭৮৯ — শ্রীযুক্ত রফিকুল" is clean with all Bengali numerals correct;
  Tiro italic quote "শ্রীযুক্ত অতিথি, শ্রমের মর্যাদা — ফ্রি নয়।" renders
  correctly in true italic serif.
- Fonts are self-hosted woff2 under `assets/fonts/` — no Google Fonts
  dependency at runtime. Fallback stacks present
  (`'Anek Bangla','Noto Sans Bengali','Hind Siliguri',sans-serif`).

Not verified: Safari / Android Chrome / Firefox rendering; real-device
rendering (see §6).

## 4. Console-error evidence

- Correct-flow session (round 3, fresh browser, all flows (a)–(j)):
  **0 console errors, 0 page exceptions, 0 failed requests.**
- 4 errors seen in rounds 1–2 were traced to a QA-probe bypass (clicking
  `#submitReq` with an empty draft), not to the normal flows; see defect D3.
  No error occurs in any user-reachable flow.

## 5. Defects (found, not fixed — fixing is the parent's job)

| ID | Severity | View / element | Observed |
|---|---|---|---|
| D1 | Low | Announcement strip (all pages) | Spec §4.2#1: "36px strip, forest text on ivory, dismissible". Built: **44px** tall, **forest background** with light text, and **no dismiss control** (markup `index.html:509–520` has only notice text, link, and the BN/EN toggle). |
| D2 | Low | Expatriate success pane `#expSuccess` | Spec §7.1: success shows "the Meridian mini-timeline showing step 1 of 4 complete". Built: **0 timeline nodes** in the pane — Request ID + Pending note only. (Tracking page itself is correct.) |
| D3 | Low | Expatriate submit, edge case | Clicking `#submitReq` with an empty draft (only reachable via DOM/JS — the button is hidden until step 3) throws **1 uncaught TypeError** (`SVC[undefined]['bn']`, `index.html:1887`) and creates a request with `service: undefined` (confirmed: `EXP-2026-7364`, no `service` key). Any later `SVC[service]` lookup on that request (dashboard render, `doTrack`) throws. Normal wizard flow never produces this state. Fix suggestion: guard `submitReq` against an empty/incomplete draft. |
| D4 | Low | Hero (§4.2#3) | Spec: right column (cols 9–12) holds live data — next event + open request count. Built: **no right column**; hero-meta is a bottom strip of three value props (শিক্ষা·ঐক্য / no service charge / transparent accounts). |
| D5 | Low | Homepage kickers + service rows | Spec/rationale bans decorative numbering ("Numbered 01/02/03 markers… only used where content is truly a sequence"). Built: kickers numbered **01–09** on all 9 homepage sections, and service rows numbered **01–06**. |
| D6 | Low | Mobile menu `#mmenu` | Spec §6: "full-screen sheet sliding up from the bottom". Built: **right-side drawer** (~85% width). Works correctly (opens, 12 items, CTA present). |
| D7 | Low | Desktop nav bar (§6) | Spec: nav right holds BN/EN toggle + theme toggle + primary CTA pill "সাহায্যের আবেদন". Built: **BN/EN toggle lives in the strip** above the nav, and there is **no CTA pill in the nav** (hero carries the CTA; nav has bell, theme, login/dashboard). Functionally equivalent, layout differs from spec. |
| D8 | Trivial | Footer slogan CSS (`index.html:346–347`) | Dead rule: line 346 sets gold (`--gold-on-forest`) on `.foot-slogan`, overridden by line 347 ivory `#E7E4D2`. Live render is compliant (ivory 16px, gold audit clean), but the dead gold rule invites a regression. |
| D9 | Trivial | Finance → annual reports sidebar | Report item title wraps awkwardly ("বার্ষিক প্রতিবেদন ২০২৬" over 3 lines with the `.txt` pill sitting mid-flow). Cosmetic only. |
| D10 | Info | Home Meridian nodes | Only **1 node (1999)** on the home timeline. Per the documented decision (only the verified 1999 milestone is dated), this is intentional, not a defect. |
| D11 | Info | Wizard step count | `DESIGN_SYSTEM.md` §7.1 describes **4 steps**; the built wizard has **3 panes** (form 1 → form 2 → review) + success. Task brief says 3-step. Doc/build mismatch to confirm, not a functional defect. |

## 6. What could NOT be verified

- Real-device phone check (tap gestures, true 360px device rendering) —
  mobile verified only in headless emulation.
- Font rendering in Safari / Android Chrome / Firefox (Chromium-on-Linux only).
- Full-page dark-mode screenshot (viewport dark capture verified; dark inner
  sections checked via token values only, not pixels).
- Home-page segments y≈4600–9587 not eyeballed (Meridian continuity there
  rests on the DOM measurement: 1px gold line, 7990px tall, plus visual
  confirmation in the top two segments).
- `prefers-reduced-motion` behaviour; keyboard-only / screen-reader pass.
- Helper login (`01700000001`/`helper1234`) and helper queue status-advance
  (only member login driven).
- Browser Notification permission flow (not grantable in headless) — the
  in-app notification card (auto-dismiss 5.2s) was verified instead.
- Whether demo photos carry real consent — all images are labelled নমুনা/Demo;
  no real photo is claimed.

## 7. Design-intent audit (summary)

| Intent | Verdict |
|---|---|
| The Meridian: one continuous 1px gold line | ✓ 1px gold, 7990px tall on home, visible in screenshots; same line is the tracking timeline (4 nodes, done/now/todo) |
| Dark forest hero, cool-white ground | ✓ hero `rgb(16,46,39)`; ground `#FBFBF8` |
| Anek Bangla weight-led type, Tiro italic quotes only | ✓ verified rendered (§3); quote is Tiro italic 400 |
| Max two forest fields per page | ✓ home: hero + footer only (expat band is `band-light`, white) |
| No gold buttons / gradients / glassmorphism | ✓ 0 gold-bg buttons; no gold text <32px anywhere on home; only gradients are a gallery caption scrim and a skeleton shimmer (functional, not decorative gold) |
| Header 64px desktop / 56px mobile single row | ✓ measured 64 / 56 |
| No horizontal overflow at 360px | ✓ `scrollW=360` |
| No invented figures | ✓ unverified stats read "তথ্য হালনাগাদ হচ্ছে"; finance all demo-labelled; heritage rows state dates are unverified |

## 8. Files produced by this QA

- This report, `FUNCTIONAL_TEST_REPORT.md`, `PROJECT_PROGRESS.md`,
  `ASSUMPTIONS.md` — in `~/workspace/satanipara-community-website/direction-d/`
- Probe scripts + logs + screenshots (ephemeral, not deliverables):
  `/tmp/qa-probe/probe*.mjs`, `run2.log`, `run3.log`, `shots/01–17`
