# RESPONSIVE_QA_REPORT.md — Editorial Redesign
Date: 2026-11-14 | Method: artifact audit (desktop 1440 + phone 390 captures,
full-page) + live probe driving on the phone viewport.

## Results
- Audit verdict: PASS (second run). Console errors: 0. Broken images: 0.
  Horizontal overflow at phone width: 0px (scroll_width = viewport 390).
- First audit found and this build fixed:
  1. Mobile hero text clipped at the left edge — root cause: `.hero` padding
     shorthand overrode `.wrap` horizontal padding. Fixed (padding-top/bottom
     only); re-capture confirms inset matches the header.
  2. Gallery tile blank in full-page capture — lazy-loaded image below the
     fold. Fixed: gallery images load eagerly; all 6 tiles render.
  3. Desktop date text truncated in activity/news rows — date column widened
     (110px → 172px) and wrapping allowed.
  4. Skip link flagged occluded — replaced off-screen positioning with the
     clip-based visually-hidden pattern (visible on focus). Second audit:
     unreachable_controls empty on desktop and mobile.
- Phone header: single row ≤56px content row — crest, one-line serif
  wordmark, EN toggle, theme icon, hamburger (verified in probe screenshots).
- Layouts: below 900px everything collapses to one column in reading order;
  dateline 2×2; tasks stack; entries 1-col at ≤560px; forms single column.
- Dark mode: token-swapped palette defined; audit captured light (declared
  scheme light; page also follows prefers-color-scheme on load + manual
  toggle). Dark-mode pixel check was not separately captured in this run.
- Reduced motion: `prefers-reduced-motion` disables reveal/animations in CSS.
