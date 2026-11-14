# ASSUMPTIONS.md — Satanipara Community EDITORIAL REDESIGN

Date: 2026-11-14. Everything below is an assumption or open question, not a
verified fact. No real community information was invented; all prototype
content is DEMO, labelled নমুনা/Demo.

## Standing decisions (from Fahim — treated as fact, not assumption)
- Admin: only 2 roles (Super Admin + Expatriate Helper). NO OTP; simulated
  login is mobile + password (demo 01700000000/demo1234).
- No service charge on expatriate support; actual cost + transport borne by
  the applicant; service is NOT an emergency-service/ambulance replacement;
  Emergency Response Team 3–5.
- No backend, no database, no real OTP, no mobile apps, no Next.js migration.
  HTML/CSS/JS prototype only. No VPS deploy, push, or client send.

## Assumptions made in this redesign
1. **Imagery:** no real community photos were supplied. All imagery is
   clearly-marked demo imagery / typographic compositions — never presented
   as real Satanipara residents. Real consented photos must replace it
   before any public launch.
2. **Statistics:** where no verified figure exists, the prototype shows
   "তথ্য হালনাগাদ হচ্ছে" rather than a number. Any figure shown is demo
   and labelled as such.
3. **People/committee/finance:** all names, committee members, donor entries
   and ledger figures are demo placeholders. Real data needs the
   organisation's approval + each person's consent before publication.
4. **Typography:** Tiro Bangla + Anek Bangla adopted as primary, pending the
   rendered-screenshot QA check (শ্র/ফ্র conjuncts, numerals, mixed BN/EN).
   If it fails, the documented runner-up (Noto Serif/Sans Bengali) applies
   with no layout change.
5. **Navigation labels:** IA follows the directive's §Phase 6 page list;
   masthead shows the 8 most-used sections, the rest via footer/in-page links.
6. **Persistence:** design system assumed localStorage for theme/language/
   login — the static build is actually session-only (platform rules). This
   is a known deviation, not a design choice; a real build should persist
   these preferences.
7. **Dark mode:** token-defined and toggling, but no separate dark-mode
   screenshot capture was taken in this run — visual dark-mode QA is open.
8. **Fonts in audit captures:** Google Fonts could not load in the audit
   sandbox (egress lockdown), so QA captures show fallback Bengali fonts.
   The published page loads the real faces; final font verdict needs a
   real-browser pass.

## Open questions for Fahim / the organisation
- Real statistics, photos (with consent), committee list, financial reports?
- Confirm the chosen direction ("Ivory paper, forest ink, one gold rule")
  and the Tiro/Anek typography once seen on a real phone browser.
- Design OK before quotation / Phase-1 scope confirmation? (per standing flow)
