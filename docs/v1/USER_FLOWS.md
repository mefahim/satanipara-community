# USER_FLOWS.md — Satanipara Community
Date: 2026-11-14 | Phase 2

All flows are simulated frontend-only (no backend). Every flow has success, empty, loading and error states.

## F1 — Expatriate support request (primary journey)
1. Discover: Home → "প্রবাসী সহায়তা" or nav → service categories (grocery, medicine, hospital, elderly support, home emergency, documents, general).
2. Read policy: no service charge; actual product cost + applicable transport borne by applicant; NOT a replacement for official emergency services (999 / hospital / ambulance).
3. Create: form — applicant name, mobile, country, family member in Satanipara, address, service category, details, preferred date, expense acknowledgement checkbox. Validation inline, Bengali messages.
4. Review: summary screen, edit back, confirm.
5. Submit: simulated processing → Request ID issued (format EXP-2026-XXXX, demo).
6. Track: status timeline Pending → Accepted → In Progress → Completed; expense details shown when available; simulated helper notification shown ("সহায়ককে জানানো হয়েছে").
7. Emergency path: if "home emergency" chosen, Emergency Response Team (3–5 members) contact block appears first, with the not-an-emergency-service warning.

## F2 — Blood donor search
1. Filter by blood group (A+/A−/B+/B−/O+/O−/AB+/AB−) + area + availability.
2. Results: group, area, last donation (demo), availability badge. Contact masked (01XXX-XXXXXX) until consent note acknowledged; "জরুরি রক্তের আবেদন" form for emergency requests (patient, hospital, group, units, contact) → confirmation with demo reference.
3. Empty state: "এই গ্রুপে এই এলাকায় এখন কোনো নমুনা দাতা নেই" + suggest widening filters.

## F3 — Community directory
1. Search by name/role/institution; filter by category (people: professionals/teachers/doctors/engineers/business/public servants/freedom fighters/students; institutions: educational/religious; places: roads/infrastructure/important locations).
2. Results as browsable list with detail view; empty state on no match.

## F4 — Member (login, NO OTP)
1. Login: mobile number + password (simulated; demo account shown on the page, e.g. 01XXXXXXXXX / demo1234 — clearly labelled demo). No OTP step anywhere.
2. Forgot password: message that Super Admin resets it (per Phase 1 simplification).
3. Profile: member info, expatriate profile, family members, edit form (simulated save), My Requests list (links to tracking), notifications list (incl. helper notification simulation).

## F5 — Annual activities
1. Browse by year (2023–2026 demo) + category filter → activity cards → detail view (purpose, date, beneficiaries shown as 'তথ্য হালনাগাদ হচ্ছে' where unverified, demo photos labelled).

## F6 — Financial transparency
1. Summary (income/expense/donations — demo-labelled figures, clearly marked নমুনা), project accounts list, annual reports by year → report detail → "PDF ডাউনলোড" simulated (generates a demo notice, no real file).

## F7 — News, notices & gallery
1. Tabs: খবর / নোটিশ / ইভেন্ট / চাকরি / শিক্ষার্থী অর্জন; filters by year + category; gallery grid → lightbox with keyboard nav (Esc close, arrows).

## F8 — First visit (30–60s test)
New visitor lands on Home → within 30–60s can find: main services, blood donor search, expatriate help, latest notice, contact/emergency. Verified in QA by walkthrough.
