# ASSUMPTIONS.md — Satanipara Community, DIRECTION D (QA)

Date: 2026-11-14. Assumptions made during QA of artifact v1, and what would
change the verdict if wrong. Nothing here is a claim about the client or the
real community — all content in the artifact is demo data.

## Environment assumptions

1. **Local HTTP ≈ hosted artifact.** The artifact was served from its own
   directory over `http://127.0.0.1:8901/`. Assumed equivalent to the hosted
   artifact (same files, same relative paths). If the hosted copy serves
   different files, results do not transfer.
2. **Headless Chromium ≈ real browsers.** Rendering, layout, fonts, and
   interactions were verified in headless Chromium 1248 on Linux. Assumed
   representative for Chrome/Edge on desktop; Safari, Firefox, Android
   Chrome, and real devices may differ (especially Bengali shaping).
3. **Viewport emulation ≈ real phone.** 360×800 emulation with
   `deviceScaleFactor: 1` stands in for a real phone. Tap gestures, real
   touch targets, and OS font fallback were not tested.
4. **No persistence.** Verified in code: the artifact makes **no**
   `localStorage`/`sessionStorage` use — all state is in-memory per page
   load. A page reload resets login, filters, drafts, and requests.
   (This is also why rounds 1–2 contaminated each other: hash-only
   navigations do not reload the page, so in-memory state survived
   across probe rounds that shared one browser.)

## Content assumptions

5. **All data is demo.** Names, stats, finance figures, donor entries,
   committee lists, and images are labelled নমুনা/Demo in the artifact.
   QA checked labelling and honesty (no invented figures presented as real),
   not the truth of any demo value.
6. **Single verified milestone.** Only the 1999 founding is treated as a
   verified heritage date (per `DESIGN_RATIONALE.md` §8 Q2 and the
   artifact's own rationale view). The single-node home timeline is
   therefore treated as intentional, not a gap.
7. **Bengali-first, demo credentials.** Flows were driven in Bengali with
   the documented demo login (`01700000000` / `demo1234`). English was
   checked only for the homepage hero + `lang` attribute, not end-to-end.

## Scope assumptions

8. **Task brief governs step count.** The brief says "3-step wizard"; the
   built wizard has 3 panes. `DESIGN_SYSTEM.md` §7.1 describes 4 steps.
   QA treats this as a doc/build mismatch to confirm (D11), not a failure.
9. **Transient toasts/notifications are not layout defects.** Toasts and the
   in-app notification card auto-dismiss (~5s) and may briefly overlap
   content in screenshots; that overlap was not counted as a defect.
10. **Screenshots are evidence, not the product.** Screenshots in
    `/tmp/qa-probe/shots/` are ephemeral working material; the durable
    evidence is the measured values recorded in `QA_REPORT.md` and
    `FUNCTIONAL_TEST_REPORT.md`.
