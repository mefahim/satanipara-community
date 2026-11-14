# SITEMAP.md — Satanipara Community
Date: 2026-11-14 | Phase 2

Single-page-app prototype: client-side views (hash routing), one shared header/footer, BN/EN + light/dark toggles on every view.

## Views (routes)
1. `#/home` — হোম (editorial homepage, §5A: 14 sections)
2. `#/community` — কমিউনিটি প্রোফাইল (overview, directory search/filter: people, institutions, places)
3. `#/organization` — সংগঠন (history 1999, mission/vision, constitution summary, executive committee, advisory council, former presidents/GS, members, achievements)
4. `#/activities` — বার্ষিক কার্যক্রম (year archive 2023–2026 demo, categories: scholarship, education, winter clothing, blood donation, medical camp, tree plantation, national celebrations, humanitarian, disaster relief; activity detail)
5. `#/expatriate` — প্রবাসী সহায়তা (service discovery, request form → review → submit → Request ID → tracking timeline; policy: no service charge, actual cost + transport borne by applicant; NOT an emergency-service replacement; Emergency Response Team 3–5)
6. `#/blood` — রক্তদাতা (donor directory, blood-group + area filters, availability, last donation; emergency blood request; consent-masked contact)
7. `#/news` — খবর, নোটিশ ও গ্যালারি (news, notices, events, jobs, student achievements, photo/video gallery; year + category filters; lightbox)
8. `#/transparency` — আর্থিক স্বচ্ছতা (income/expense summary, donations, project accounts, annual reports, PDF download simulated)
9. `#/membership` — সদস্যপদ (register, simulated login mobile+password — NO OTP, member profile, expatriate profile, family info, my requests, notifications, profile edit)
10. `#/contact` — যোগাযোগ ও জরুরি তথ্য (contact, emergency numbers, office, map placeholder)

## Navigation architecture
- Top bar: emergency notice strip (urgent notice) → header: crest + brand, primary nav (Home, Community, Organization, Activities, Expatriate Support, Blood Donor, News, Transparency, Membership), language toggle BN/EN, theme toggle, mobile hamburger (≤900px, full menu, 44px targets).
- Footer: brand, quick links, services, emergency note, demo-content disclaimer.
- Breadcrumbs on all inner views; contextual CTAs at section ends (e.g. activity → request help; donor → emergency request).
- Search: global directory search on Community view; per-module filters (blood group, year, category).

## Page inventory (all built in this phase)
10 views listed above; every view reachable from nav, footer, or in-page CTA — no dead links.
