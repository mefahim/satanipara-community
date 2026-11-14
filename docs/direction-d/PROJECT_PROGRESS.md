# PROJECT_PROGRESS.md — Satanipara Community, DIRECTION D

Date: 2026-11-14 | Artifact: `satanipara-community-direction-d` (web_static, v1)

## Phase 0 — Design system + rationale (done, before this QA)

- Done: `DESIGN_SYSTEM.md` (tokens, Meridian, colour budget, type scale,
  layout, motion, nav, service interfaces, dark mode, a11y, QA gates) and
  `DESIGN_RATIONALE.md` (sans-led inversion of the broadsheet, self-critique,
  open questions) in this folder.
- Done: `FONT_COMPARISON.md` (+ `FONT_COMPARISON.html`) — provisional
  recommendation: Anek Bangla workhorse, Tiro Bangla italic quotes only,
  Manrope for English. Status at that point: **provisional, no rendered
  screenshot** — explicitly deferred to build QA.
- Files: `DESIGN_SYSTEM.md`, `DESIGN_RATIONALE.md`, `FONT_COMPARISON.md`,
  `FONT_COMPARISON.html`.
- Decisions: 'The Meridian' as the single memorable device; cool-white ground
  (ivory reserved for story sections); gold as 1px line + ≤3 point accents;
  forest fields max 2/page; no gold buttons/gradients/glassmorphism;
  decorative numbering banned; only verified 1999 milestone dated.

## Phase 1 — Build v1 (done, by builder — not this QA)

- Done: single-file `index.html` (206,788 B) + `assets/` (7 images,
  5 self-hosted woff2) in `~/workspace/ts-spaces/satanipara-community-direction-d/`,
  published as artifact v1. Hash routing, BN/EN i18n, light/dark themes,
  3-step expatriate wizard + Meridian tracking, demo login, blood-donor
  consent flow, gallery lightbox, constitution accordion, finance filters,
  notification simulation.
- Files: artifact `index.html`, `space.json`, `assets/*` (builder-owned;
  not edited by QA).

## Phase 2 — Independent QA (done, this task)

- Done: read `web_deploy_visual_verification` skill and followed it
  (live-DOM checks, visual screenshots, stated unverified items).
- Done: 5 headless-Chromium CDP probe rounds on the built artifact over
  local HTTP — desktop 1440, mobile 360, full-page home (1440×9587),
  font specimen overlay, all 10 assigned flows end-to-end.
- Done: font rendering verified from live rendering (computed fonts,
  `document.fonts.check`, canvas discrimination, specimen screenshot).
- Done: design-intent audit against `DESIGN_SYSTEM.md` / `DESIGN_RATIONALE.md`.
- Files: `QA_REPORT.md`, `FUNCTIONAL_TEST_REPORT.md`, `PROJECT_PROGRESS.md`
  (this file), `ASSUMPTIONS.md`. Probe scripts/logs/screenshots in
  `/tmp/qa-probe/` (ephemeral working material, not deliverables).
- Tests: 26 pass / 2 real fail in the authoritative fresh-browser round
  (plus 2 probe-expectation errors corrected in follow-up rounds);
  **0 console errors, 0 failed requests** in the correct-flow session.
- Decisions: round 3 (fresh browser) governs — rounds 1–2 shared one Chrome
  page session and are only cited where uncontaminated; the font choice
  (Anek Bangla + Tiro Bangla italic) is now **verified rendered**, closing
  the provisional status from `FONT_COMPARISON.md` for Chromium-on-Linux.
- Issues: 11 items, all low/trivial/info — see `QA_REPORT.md` §5
  (D1 strip 44px/forest/not dismissible; D2 no mini-timeline on success;
  D3 empty-draft submit throws + corrupt request; D4 no hero right-column
  live data; D5 decorative 01–09/01–06 numbering; D6 drawer vs bottom
  sheet; D7 nav contents differ from spec; D8 dead gold CSS rule;
  D9 finance sidebar wrap; D10 single Meridian node — intentional;
  D11 wizard is 3 steps vs spec's 4 — doc mismatch).
- Limitations: no real-device check; fonts verified in Chromium-on-Linux
  only; dark-mode full-page pixels, reduced-motion, keyboard/screen-reader,
  helper flow, and several secondary pages not driven (see `QA_REPORT.md` §6
  and `FUNCTIONAL_TEST_REPORT.md` §4).

## Phase 3 — Mobile left-padding fix (done, 2026-11-14, after Fahim's phone screenshot)

- Trigger: Fahim's phone screenshot (360px, dark mode) showed excessive left padding on the homepage — the expatriate-service band's text sat ~102px in from the left edge.
- Root cause: 20px page gutter + 52px Meridian clearance + 30px band padding stacked at 360px, while the Meridian rail itself sits at the viewport edge — so the gold line read as a left border and the text looked pushed far right.
- Changed: homepage bands now use ~36px text inset at 360px (gutter + reduced Meridian clearance + reduced band padding); the Meridian rail alignment and all content/flows untouched. Fix applied to the `satanipara-community-direction-d` artifact and verified live there.
- Deliverable re-exported: `Satanipara_Community_Direction_D_Muse.html` refreshed from the fresh artifact export — md5 `0772fab0b818ec678ffdc1e89bb06089`, size 12,956,546 bytes, identical to `satanipara-community-direction-d.html` (verified with md5sum). Previous deliverable md5 was `a8e4492c3c52a886f8c6178ad2c837ec`.
- Files: `~/workspace/your_files/satanipara-community-direction-d/Satanipara_Community_Direction_D_Muse.html`, `PROJECT_PROGRESS.md` (this file).

## Next

1. Parent fixes (or explicitly accepts) defects D1–D9, D11 — D3 first
   (guard `submitReq` against an empty draft), then D1/D2/D4/D5.
2. Re-QA after fixes: fresh-browser re-run of the affected flows only
   (strip, success pane, hero, numbering, menu, nav) + console-error tally.
3. Fahim phone check (real 360px device, tap gestures, hamburger, dark mode
   on inner pages) before any client show.
4. Remaining open design questions from `DESIGN_RATIONALE.md` §8 still stand
   (heritage milestones beyond 1999, ticker ownership, real photography).
5. No new build, no artifact edit, no install was done by QA.

## Phase 4 — Clipping regression fix (done, 2026-11-14, after Fahim's second phone screenshot)

- Trigger: Fahim's follow-up phone screenshots (light mode, 360px) showed home text starting at x=0 and clipping at the left edge — sections 01 (আমাদের গল্প) and 06 (রক্তদান) headlines/body cut off, e.g. "মাটির গন্ধ" rendered as "াটির গন্ধ".
- Root cause: the Phase 3 fix's `.mpad{padding-left:0}` rule at ≤640px overrode `.wrap`'s 18px gutter, so home text started at x=0 and clipped; fixed to `padding-left:18px`.
- Visual verification done: real rendered screenshots at 360px, light + dark, all home sections + views eyeballed; DOM metrics — min text inset 18px, no horizontal overflow, 0 console errors.
- Deliverable re-exported: `Satanipara_Community_Direction_D_Muse.html` refreshed from the fresh artifact export — md5 `d229bccb9bb7be93f9f3b67db41a8963`, size 12,956,671 bytes, identical to `satanipara-community-direction-d.html` (verified with md5sum; export: 13 inlined assets, 0 unresolved). Previous deliverable md5 was `0772fab0b818ec678ffdc1e89bb06089`.
- Files: `~/workspace/your_files/satanipara-community-direction-d/Satanipara_Community_Direction_D_Muse.html`, `PROJECT_PROGRESS.md` (this file).

## Phase 5 — Phone photo-crop fix (done, 2026-11-14, after Fahim's phone screenshots)

- Trigger: Fahim's phone screenshots (light mode, 360px) showed home photos cropped at the edges — e.g. the story portrait and the blood-donation group photo cut off on the right, so faces/figures were sliced.
- Root cause: HTML height attributes acted as a fixed pixel height, so `object-fit:cover` sliced photos to only 22–34% visible width at 360px.
- Fix: ≤860px block with `img height:auto` + `object-fit:contain`, `.ph-full` for inline-styled photos, gallery tiles switched to contain.
- Verification: every image fully visible at 360px in both themes, 0 console errors.
- Deliverable re-exported: `Satanipara_Community_Direction_D_Muse.html` refreshed from the fresh artifact export — md5 `16aad90d036945475d7baa673ce32076`, size 12,957,839 bytes, identical to `satanipara-community-direction-d.html` (verified with md5sum; export: 13 inlined assets, 0 unresolved). Previous deliverable md5 was `d229bccb9bb7be93f9f3b67db41a8963`.
- Files: `~/workspace/your_files/satanipara-community-direction-d/Satanipara_Community_Direction_D_Muse.html`, `PROJECT_PROGRESS.md` (this file).
