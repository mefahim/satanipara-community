# FUNCTIONAL_TEST_REPORT.md — Editorial Redesign
Date: 2026-11-14 | Method: live probe driving on the built artifact (phone
viewport). Every flow below was actually driven, not code-read.

## Driven and passed
1. **Expatriate request end-to-end (the v1 un-probed gap — now closed):**
   filled all 8 fields + category select (ওষুধ সংগ্রহ) + consent checkbox →
   review table showed every value correctly → confirm → simulated submit
   (spinner) → success with NEW Request ID **EXP-2026-5646** → auto-tracking
   rendered step 1 of 4 → helper-notification toast shown ("নতুন অনুরোধ! …
   সহায়কদের কাছে বিজ্ঞপ্তি পাঠানো হয়েছে").
2. **Tracking:** EXP-2026-1052 → 4-step timeline (all complete) + expense
   ledger ৳৮৫০ ওষুধ + ৳১২০ যাতায়াত + ৳০ সেবা ফি = মোট ৳৯৭০.
3. **Demo login:** 01700000000 / demo1234 → dashboard rendered: profile table
   (নমুনা সদস্য, O+, সৌদি আরব (নমুনা)…), 3 notifications, My Requests listing
   all requests incl. the newly created one, profile-edit form.
4. **Blood donor consent gate:** numbers masked (01XXX-XXXXXX) before consent;
   after ticking the consent checkbox, masked demo numbers revealed
   (017XX-XXXX01 (নমুনা নম্বর) etc.) — screenshot-verified.
5. **Gallery lightbox (v1's second un-probed gap — now closed):** opened item
   2/6 with caption; ArrowRight advanced to item 3; Esc handling via native
   dialog. Styled backdrop + max-height verified in screenshot.
6. **Language toggle:** BN → EN switched chrome + hero ("One neighbourhood,
   one family"); nav rebuilt in English.
7. **Navigation:** mobile hamburger menu opens; footer/nav links route to all
   views; audit aria snapshot confirms all 10 primary nav links + footer.

## Present and code-verified (not separately driven this run)
Directory search/chips/area filter, activities year/category filters + detail
dialog, news tabs + year/category filters, transparency ledger totals +
simulated report download (Blob .txt), emergency blood-request form →
reference, registration form, contact form, profile edit save, ERT reveal on
the emergency category, unknown-ID tracking message, form validation messages.

## Console / errors
0 console errors across audit and all probe sessions.
