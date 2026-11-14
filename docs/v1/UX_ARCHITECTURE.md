# UX_ARCHITECTURE.md — Satanipara Community
Date: 2026-11-14 | Phase 2

## Audience map
| Audience | Top needs | Entry point |
|---|---|---|
| Local residents | Notices, events, services, directory | Home → News / Community |
| Expatriates | Request help for family, track status, costs | Home → Expatriate Support |
| Students | Scholarships, achievements, activities | Activities / News |
| Professionals | Directory, membership, networking | Community / Membership |
| Organization members | Committee, constitution, reports | Organization / Transparency |
| Blood donors | Register availability, be found | Blood Donor |
| Families requesting help | Simple request, clear cost, status | Expatriate Support |
| Administrators (Super Admin + Expatriate Helper) | Requests, members, reports | Membership → (admin preview link to existing dashboard demo noted, not rebuilt here) |

## Feature → page mapping
- Hero/identity → Home; stats (unverified → 'তথ্য হালনাগাদ হচ্ছে') → Home + Community
- Services → Home + Expatriate/Blood; activities → Activities; stories → Home + News
- Gallery → News/Gallery; transparency → Transparency; contact/emergency → Contact + footer + every emergency block
- Directory/search → Community; committee/history → Organization
- Login/profile/requests/notifications → Membership

## Information architecture principles
- Bengali-first; English toggle translates UI chrome + headings (full EN content where feasible, BN fallback noted).
- One clear objective per view; contextual next-step CTA at each section end.
- No dead buttons: every button navigates, filters, opens a dialog, or shows a state.
- States everywhere: loading (skeleton/spinner on simulated submit), empty, error (validation + simulated failure), success (Request ID, confirmations).
- Reduced motion: all reveal/animation disabled under prefers-reduced-motion.

## Homepage order (blueprint §4, 14 sections)
1 notice strip → 2 header/nav → 3 hero (identity, local imagery-led, CTAs: request help / learn about community / find donor) → 4 statistics (verified only; else 'updating') → 5 services → 6 featured activities → 7 activity gallery strip → 8 expatriate feature → 9 news/notices → 10 upcoming events → 11 community stories → 12 photo/video gallery → 13 transparency preview → 14 contact/emergency → footer.
