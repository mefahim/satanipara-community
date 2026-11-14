# REVERIFY_REPORT.md — Satanipara Community, DIRECTION D (artifact v1 + D1/D2/D3 fixes)

Date: 2026-11-14 | Re-verification QA engineer: independent verification (no edits made to the artifact, no artifacts created, nothing installed)
Artifact: `satanipara-community-direction-d` — 'Satanipara Community — Direction D' (web_static, v1)
Source verified: `~/workspace/ts-spaces/satanipara-community-direction-d/index.html`
(md5 `7d996757d1c345908c8f8aabcf4313be`, 210,073 B — up from 206,788 B at first QA, consistent with the fix landing)
Prior defects re-tested: D1 (strip 44px / forest bg / no dismiss), D2 (no mini-timeline on success pane), D3 (empty-draft submit throws TypeError + creates corrupt request) — see `QA_REPORT.md` §5.

## Verdict: ALL THREE FIXES PASS — D1 ✓, D2 ✓, D3 ✓. Regression spot-checks PASS. 0 console errors, 0 page errors, 0 failed requests across both re-verify sessions.

## 1. Method (what was actually run)

- Served the built artifact over local HTTP (`python3 -m http.server`, `http://127.0.0.1:8902/index.html`) and drove **headless Chromium 1248** over CDP with Node scripts (`/tmp/reverify/probe.mjs`, `/tmp/reverify/probe2.mjs`; raw JSON tallies `/tmp/reverify/results.json`, `/tmp/reverify/results2.json`).
- Fresh browser per round (fresh `--user-data-dir`, fresh debug port, freshness assertions: `state.user===null`, `donorGroup==='all'`, `lang==='bn'`, theme light). Viewport 1440×900 desktop.
- Screenshots: `/tmp/reverify/shots/rv-success.png`, `rv-strip-dark.png`, `rv-strip-dark2.png`.
- **Probe-bug disclosure (important):** round 1 produced 5 FAILs that were all probe errors, not artifact defects, and every one was re-run with corrected selectors in round 2 (fresh browser), where all passed:
  - D1e (dark strip height 0): round 1 used a wrong theme-toggle selector (`[data-theme-toggle]` — the real button is `#themeBtn`), so the theme never switched to dark, AND the strip was still `hidden=true` from the earlier dismiss click because hash-only navigation does not reload the page (same SPA contamination trap documented in `QA_REPORT.md` §1). Round 2 (fresh load + `#themeBtn`) passes.
  - R5/R6 (blood): round 1 counted `.drow` document-wide (29 rows — the SPA renders all views in one document) instead of scoping to `#donorResults`. Round 2 scoped correctly: 6 rows → 1 O+ row.
  - R7/R8 (lightbox): round 1 used non-existent selectors (`.g-item`, `.lightbox`); the real hooks are `[data-gal]` thumbs, `#lightbox.open`, `#lbImg`. Round 2 passes.
  - Round-1 results are cited only for the checks whose selectors were correct (D1 light, all D3, all D2, login, BN/EN). The five corrected checks rest on round 2.

## 2. D3 fix — incomplete expatriate draft submit (was: 1 TypeError + corrupt request)

| ID | Check | Observed | Verdict |
|---|---|---|---|
| D3a | Empty step-1 submit stays on step 1 | `form2 on=false` after clicking step-1 submit with all fields empty | PASS |
| D3b | Empty step-1 submit: 0 new console errors | errors before=0, after=0 | PASS |
| D3c | Empty step-1 submit: no request created | `Object.keys(state.requests).length` stayed 1 (the 1 pre-seeded demo request) | PASS |
| D3d | Original D3 repro — direct `#submitReq` click with empty draft: 0 new console errors | errors before=0, after=0 (was 1 uncaught TypeError `SVC[undefined]['bn']` at `index.html:1887`) | PASS |
| D3e | Same click: no request created | request count stayed 1 | PASS |
| D3f | Same click: inline validation shown | `#submitErr` `display=block`, text: "আবেদনটি অসম্পূর্ণ — আগের ধাপগুলো পূরণ করে আবার চেষ্টা করুন।" | PASS |
| D3g–h | Wizard reaches review with valid data (setup for D3i–l) | Step 1 (medicine, মা — সাতানীপাড়া, details ≥10 chars, today) → step 2 (পরীক্ষা প্রবাসী / 01700000000 / সৌদি আরব / consent checked) → review `on=true` | PASS |
| D3i | Review-step submit with a missing field: 0 new console errors | errors before=0, after=0 | PASS |
| D3j | Review-step submit with a missing field: no request created | count stayed 1 | PASS |
| D3k | Review-step submit with a missing field: inline validation shown | `#submitErr` `display=block`, same Bengali message as D3f | PASS |
| D3l | Review-step submit with a missing field: stays on review | `#expSuccess on=false` | PASS |
| D3m | Complete wizard normally → new Request ID | `EXP-2026-3047` | PASS |
| D3n | New request exists with a real service | `state.requests['EXP-2026-3047'] = {service:'medicine', status:0}` — no `service: undefined` | PASS |

Note on D3i–l: the UI cannot reach the review step with an incomplete draft (step-1/step-2 validation blocks first), so this leg was DOM-assisted — `draft.name` was blanked via JS while on the review step, then `#submitReq` was clicked. It exercises the same guard code path as D3d–f from the review state. The user-reachable negative paths (D3a–f) were driven purely by clicking.

## 3. D1 fix — announcement strip (was: 44px, forest bg, no dismiss)

| ID | Check | Observed | Verdict |
|---|---|---|---|
| D1a | Strip exactly 36px tall (light) | `h=36` | PASS |
| D1b | Forest text on ivory bg (light) | bg `rgb(247, 244, 234)` (ivory `#F7F4EA`), text `rgb(23, 63, 53)` (forest `#173F35`) | PASS |
| D1c | Dismiss button present | `#stripDismiss` exists | PASS |
| D1d | Dismiss (×) hides the strip (light) | Clicked `#stripDismiss` → `strip.hidden=true` | PASS |
| D1e | Strip exactly 36px tall (dark) | Fresh load, `#themeBtn` → `data-theme=dark`, strip `h=36`, `hidden=false` | PASS (round 2; round-1 FAIL was the probe bug described in §1) |
| D1f | Forest text on ivory bg (dark) | bg `rgb(247, 244, 234)`, text `rgb(23, 63, 53)` — ivory ground in both themes, per the fix's CSS comment | PASS (round 2) |
| D1g | Dismiss (×) hides the strip (dark) | Clicked `#stripDismiss` in dark theme → `hidden=true` | PASS (round 2) |

## 4. D2 fix — success-pane Meridian mini-timeline (was: 0 nodes)

After the normal wizard submit (`EXP-2026-3047`):

| ID | Check | Observed | Verdict |
|---|---|---|---|
| D2a | Success pane has a 4-node Meridian mini-timeline | `#expSuccess .tstep` count = 4 | PASS |
| D2b | Step 1 of 4 marked current (Pending) | Classes `tstep now \| tstep todo \| tstep todo \| tstep todo`; pane text contains "অপেক্ষমাণ" | PASS |
| D2c | Steps 2–4 are todo | Exact class sequence `tstep now \| tstep todo \| tstep todo \| tstep todo` | PASS |
| D2d | Tracking the new ID works | "Track" click → `#trSteps` 4 nodes, status pill "অপেক্ষমাণ · Pending", `trId=EXP-2026-3047` | PASS |

Screenshot: `/tmp/reverify/shots/rv-success.png`.

## 5. Regression spot-checks (previously passing)

| ID | Check | Observed | Verdict |
|---|---|---|---|
| R1 | Demo login `01700000000` / `demo1234` → dashboard | `hash=#/dashboard`, greeting "স্বাগতম, নমুনা সদস্য" present | PASS |
| R2 | New request listed on dashboard | Dashboard contains `EXP-2026-3047` | PASS |
| R3 | BN→EN toggle | Hero "একটি এলাকা,একটি পরিবার।" → "One neighbourhood,one family.", `lang=en` | PASS |
| R4 | EN→BN toggle back | Hero restored, `lang=bn` | PASS |
| R5 | Blood donor O+ filter | `#donorResults .drow`: 6 rows (all) → exactly 1 O+ row (মোঃ ইমরান হোসেন, O+, উত্তর পাড়া) | PASS (round 2; round-1 FAIL was the unscoped-selector probe bug, §1) |
| R6 | Consent reveal | Phone masked `01••• ••••••` before; after "সম্মতি চান" click → `01••• •••421 (সম্মতি পাওয়া গেছে — ডেমোতে আংশিক masked)` + pill "সম্মতি মিলেছে" | PASS (round 2) |
| R7 | Gallery lightbox opens | Clicked `#fullGallery [data-gal="0"]` → `#lightbox.open=true`, `#lbImg=assets/hero.jpg`, caption "… — 1 / 8" | PASS (round 2) |
| R8 | Gallery ArrowRight advances | `assets/hero.jpg` → `assets/paddy.jpg`, caption "2 / 8" | PASS (round 2) |
| R9 | Lightbox closes | Esc + close → `open=false` | PASS (round 2) |

## 6. Console / network tally (whole session, both rounds)

- **Round 1: 0 console errors, 0 page exceptions, 0 failed requests** (29 PASS / 5 FAIL — the 5 FAILs were probe-selector bugs, all re-run and passing in round 2).
- **Round 2: 0 console errors, 0 page exceptions, 0 failed requests** (12 PASS / 0 FAIL).
- Combined: **41 PASS / 0 genuine FAIL**. Nothing in either session produced a console error, including all three incomplete-submit attempts (D3).

## 7. What could NOT be verified

- Real-device phone check (tap gestures, true 360px device rendering) — desktop headless only, as in the first QA.
- Whether the strip dismiss persists across reloads (the fix hides it for the session via `hidden=true`; no persistence claim was made or tested).
- The other first-QA defects (D4–D11) were out of scope for this re-verify and were not re-checked.
- Fonts, dark-mode inner pages, and helper flow were not re-driven here (covered in the first QA; unchanged by this fix per the file diff in scope).
