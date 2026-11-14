# 01 — Repository Audit (Published)

**Source:** `~/workspace/satanipara-phase0/audit-findings.md` (Phase 0 forensic audit, 2026-11-14,
Asia/Dhaka). This document condenses that audit into the published record. Where detail is omitted here,
the audit findings file is the authority.
**Repo audited:** [mefahim/satanipara-community](https://github.com/mefahim/satanipara-community),
branch `main`, HEAD `6792f5e` ("Add v1 prototype alternative", 2026-11-14 16:42). Working tree clean at
time of audit. Live site: https://mefahim.github.io/satanipara-community/ (GitHub Pages, `main`, root;
not re-verified live by the audit — this audit is of the repo contents only).
**Method:** `index.html` parsed by line/grep/Python extraction (headings, `id=` attributes, hash routes,
`<form>` elements, JS `const` data arrays, function names, error strings); the two `alternatives/*.html`
files compared the same way; `README.md` read in full; all 31 docs files under `docs/` read. The ~13 MB
`index.html` was not read end-to-end as prose; its structure was extracted programmatically. Base64 image
payloads were counted, not decoded. No repo files were modified by the audit.

> **Status summary.** The prototype is **Implemented (simulated)** as a static demonstration. The backend
> is **Not yet implemented** — there is no API, no database, no auth server, no file storage, no email/SMS,
> and no payment anywhere in the repository. Everything in §5–§6 of this document is demo data.

---

## 1. Repository inventory

### 1.1 File tree (excluding `.git/`)

| Path | Size | Lines | What it is |
|---|---|---|---|
| `index.html` | 12,957,887 bytes (~12.4 MiB) | 2,051 | **Direction D — the live/current prototype.** Single self-contained HTML file. 21 embedded `data:image/jpeg` base64 images, 5 self-hosted WOFF2 font faces, 2 `<style>` blocks (~450 KB CSS), 1 `<script>` block (~7.25 MB of the file is script + embedded images). No external JS/CSS dependencies, no Google Fonts link, no `fetch(`, no `localStorage`/`sessionStorage` (0 occurrences of each). |
| `README.md` | 10,471 bytes | 185 | Repo guide: brand, live direction, three-direction comparison table, pages & flows, standing Phase 1 decisions, run/update instructions, docs index, status ("Prototype — not approved as final, not a public launch"). |
| `alternatives/satanipara-editorial-redesign.html` | 5,723,454 bytes | 1,552 | Editorial (broadsheet) redesign — superseded direction, preserved untouched. 5 embedded images, Google Fonts links (2), 0 `localStorage`. |
| `alternatives/satanipara-v1-prototype.html` | 24,540,111 bytes | 1,376 | v1 prototype — first full-site prototype, superseded, preserved untouched. 21 embedded images, Google Fonts links (2). |
| `docs/direction-d/` (8 files) | ~101 KB | ~1,447 | `DESIGN_SYSTEM.md`, `DESIGN_RATIONALE.md`, `FONT_COMPARISON.md` + `.html`, `QA_REPORT.md`, `FUNCTIONAL_TEST_REPORT.md`, `REVERIFY_REPORT.md`, `PROJECT_PROGRESS.md`, `ASSUMPTIONS.md`. |
| `docs/redesign/` (13 files) | ~160 KB | ~1,900 | Editorial direction: creative direction, reference research, typography research + specimen, design system, `EXISTING_DESIGN_AUDIT.md` (the richest v1 feature inventory in the repo), final review, functional + responsive QA, direction comparison, skills-installation report. |
| `docs/v1/` (10 files) | ~33 KB | ~300 | First prototype: project audit, design research, skill audit, sitemap (10 routes), user flows, UX architecture, design system, QA report, progress, assumptions. |

**Totals:** 3 HTML files (~43.2 MB combined, dominated by embedded base64 JPEGs), 1 README, 31 docs
files (~368 KB, 37,087 words, 9,076 lines). **No backend code, no package manifest, no database schema,
no migrations, no API spec, no tests, no CI, no `.env`, no images folder, no `assets/` folder.** The live
prototype's fonts/images are embedded in `index.html` itself (the QA reports refer to `assets/hero.jpg`
etc. in the *artifact* build, which is not how the repo file stores them). The git history contains
exactly **one commit** (`6792f5e`); there is no incremental history.

### 1.2 Source material referenced by the repo but not in it

The 78 KB `Satanipara_UIUX_Blueprint_0_cm1i.pdf` (cited as the primary spec in
`docs/v1/PROJECT_AUDIT.md`), the 19-page Engineering Plan v1.1, the role-permissions PDF v2.0, the
31-page design brief, and the quotation draft are all referenced as delivered under
`~/workspace/your_files/…` but are **not present in this repository**. The hosted 9-module admin demo
artifact (`satanipara-community-dashboard`) is likewise outside this repo. The backend team must not
assume any of these are in version control.

---

## 2. Active direction: Direction D, and the alternatives

### 2.1 Direction D (`index.html`) — current

Direction D is live. README: *"Direction D — 'The Meridian' — editorial + Apple-inspired premium
product UI."* Signature idea: a single continuous 1px gold line that is both the home heritage timeline
(only the verified 1999 founding milestone) and the live status line of an expatriate request
(Pending → Accepted → In Progress → Completed). Ground cool-white `#FBFBF8` (≥60% of every page),
dark-forest hero `#102E27` (~92vh), gold = one line + ≤3 point accents per viewport, no gold
buttons/gradients/glassmorphism. Typography: Anek Bangla variable (display/UI/body, hierarchy by
weight/width), Tiro Bangla italic pull-quotes only, Manrope for English; 5 self-hosted WOFF2 faces, no
Google Fonts at runtime. Mobile: 18px side gutters at 360px, photos whole (`object-fit: contain`
≤860px), single slim header row (max 56px). The site **always opens in light theme** (`initTheme()`
unconditionally calls `setTheme("light")`; OS `prefers-color-scheme` is not followed); theme toggle is
session-only.

**Design tokens (govern the frontend; the backend must not change them):** Deep Forest `#102E27`,
Forest `#173F35`, Warm Gold `#C49A4A`, Cool White `#FBFBF8` (ground), Ivory `#F7F4EA` (story only).
Type: Anek Bangla variable (workhorse), Tiro Bangla italic (pull-quotes only), Manrope (EN/numerals).

### 2.2 Alternatives comparison

| | v1 prototype | Editorial redesign | Direction D (live) |
|---|---|---|---|
| File | `alternatives/satanipara-v1-prototype.html` (24.5 MB, 1,376 lines) | `alternatives/satanipara-editorial-redesign.html` (5.7 MB, 1,552 lines) | `index.html` (13.0 MB, 2,051 lines) |
| Views | 10 (`data-view`: home, community, organization, activities, expatriate, blood, news, transparency, membership, contact) | 11 (`id="view-…"`: home, community, organization, activities, expatriate, blood, news, transparency, membership, contact, privacy) | **18** (`id="view-…"`: home, directory, organization, activities, activity, expatriate, blood, news, finance, membership, login, dashboard, profile, my-requests, contact, faq, privacy, rationale) |
| Visual identity | Functional-first; 14-section home; green cards + gold buttons; Hind Siliguri + Noto Serif Bengali | "Ivory paper, forest ink, one gold rule" — Bengali civic broadsheet; ivory-always ground; serif-led Tiro display; gold rules everywhere; 11 views, 16-beat home | "The Meridian"; sans-led; cool-white ground, dark hero, one gold line; Anek Bangla workhorse; 9 differently-composed home sections |
| Fonts at runtime | Google Fonts (2 links) | Google Fonts (2 links) | Self-hosted WOFF2, 0 Google Fonts links |
| Expatriate wizard | Single form → review → submit → Request ID; seeded `EXP-2026-1052` (status 3, Completed) + `EXP-2026-1047` (status 2) | Multi-step + review table + simulated submit spinner → new ID `EXP-2026-5646` (probe); seeded `EXP-2026-1052` (status 3) + `EXP-2026-1047` (status 2) | **3-step wizard** (service/details → personal info → review) + success pane; seeded `EXP-2026-1052` only (status 2, In Progress); new IDs random `EXP-2026-1000…9999` |
| Directory data | Generic demo entries | Generic "নমুনা পেশাজীবী ১" style entries (numbered placeholders) + `DIR_CATS` 11 categories incl. student/institution/religious/place | 10 named demo entries (see §5.1) |
| Donors | Demo donors | 9+ numbered demo donors, phones `017XX-XXXX01` style | 6 named demo donors, masked phones `01••• •••421` style |
| Finance | Reports list; ledger not present as `LEDGER` const | `LEDGER` project accounts: 4 projects (Scholarship ৳125,000/118,500; Winter clothing ৳90,000/87,500; Medical fund ৳150,000/132,000; Humanitarian fund ৳120,000/94,500) + `REPORTS` 2023–2025 | `FINANCE` year ledger 2024–2026 only (see §5.4); **no separate project-accounts table** — project accounts exist only in the editorial alternative, not in Direction D |
| Membership extras in alternatives, absent/changed in D | v1: forgot-password button + message ("Super Admin resets"), expatriate profile + family info on dashboard, 3 demo notifications | Editorial: profile table incl. blood group + country, 3 notifications, ERT reveal on emergency category, detail `<dialog>` for activities | D: **no forgot-password UI at all** (0 matches for "forgot"); profile edit is name/phone/area/country/family only; notifications start empty and are only created in-session |
| Status | "Rejected as a final visual direction, kept as the functional reference" (README) | "Also not approved" (README) | Current; still "not approved as final, not a public launch" (README Status) |

**Cross-file inconsistency to note:** the same demo request `EXP-2026-1052` is seeded in all three
directions with different statuses (D: status 2 In Progress; editorial and v1: status 3 Completed) and
different helper names. Editorial/v1 additionally seed a second request `EXP-2026-1047` (status 2) that
does not exist in Direction D. The three files disagree about the demo request's state; the backend must
not treat any of them as a source of truth.

### 2.3 Standing decisions recorded in the repo (README + all three `ASSUMPTIONS.md`)

- Only **2 admin roles in Phase 1**: Super Admin (everything + user creation) and Expatriate Helper
  (expatriate requests only). President/GS/Treasurer and other roles deferred.
- **No OTP anywhere** — simple mobile + password login; Super Admin resets forgotten passwords. (Note:
  Direction D has no forgot-password UI at all; v1/editorial have only the note, no reset flow.)
- New expatriate requests trigger a **browser notification** to Super Admin and all Helpers (simulated
  in the prototype).
- **No service charge** on expatriate support — applicant pays actual cost of goods + transport only.
  Emergency Response Team of **3–5** people. The service is **NOT a replacement for official emergency
  services — call 999 first**.
- No backend, database, payment, or real OTP in this phase — static HTML/CSS/JS prototype only. Real
  development (Laravel + MariaDB 11.8.9 + Next.js + Flutter) is a separate, later phase.
- All content is DEMO; real stats/photos/committee/finance need client approval and (for people)
  individual consent before publication. Where no verified figure exists, the prototype shows
  "তথ্য হালনাগাদ হচ্ছে" ("information being updated") instead of inventing a number.

---

## 3. Direction D anatomy (`index.html`)

### 3.1 Routing — 18 hash views

Router: `const ROUTES=["home","directory","organization","activities","activity","expatriate","blood",
"news","finance","membership","login","dashboard","profile","my-requests","contact","faq","privacy",
"rationale"]`; `currentRoute()` parses `location.hash` (`#/home` default; unknown route → `home`; query
string after `?` stripped except for activity detail). `showView()` toggles `.view.active`, marks
`[data-route]` nav links active (with `activity` mapping to `activities`), scrolls to top, closes the
mobile menu. `hashchange` listener drives it. Auth guard in `showView()`: `dashboard`/`profile`/
`my-requests` without `state.user` redirect to `#/login`; `login` with a user redirects to
`#/dashboard`. **This guard is client-side only** (in-memory `state.user`).

| Hash | View (`id`) | Heading (BN) |
|---|---|---|
| `#/home` | `view-home` | একটি এলাকা, একটি পরিবার। |
| `#/directory` | `view-directory` | কমিউনিটি ডিরেক্টরি |
| `#/organization` | `view-organization` | সাতানীপাড়া সমাজ কল্যাণ সংঘ |
| `#/activities` | `view-activities` | বার্ষিক কার্যক্রম |
| `#/activity?id=a1…a6` | `view-activity` | (activity title, rendered by `renderActivityDetail()`) |
| `#/expatriate` | `view-expatriate` | প্রবাসী সহায়তা |
| `#/blood` | `view-blood` | রক্তদাতা ডিরেক্টরি |
| `#/news` | `view-news` | সংবাদ, নোটিশ ও গ্যালারি |
| `#/finance` | `view-finance` | আর্থিক স্বচ্ছতা |
| `#/membership` | `view-membership` | পরিবারের অংশ হোন |
| `#/login` | `view-login` | সদস্য লগইন |
| `#/dashboard` | `view-dashboard` | স্বাগতম (dynamic) |
| `#/profile` | `view-profile` | আমার প্রোফাইল |
| `#/my-requests` | `view-my-requests` | আমার আবেদনসমূহ |
| `#/contact` | `view-contact` | যোগাযোগ করুন |
| `#/faq` | `view-faq` | সাধারণ প্রশ্নোত্তর |
| `#/privacy` | `view-privacy` | গোপনীয়তা নীতি |
| `#/rationale` | `view-rationale` | Direction D — Design Rationale |

There is no `#/admin`, no `#/transparency` (v1/editorial name — in D it is `#/finance`), no
`#/community` (in D it is `#/directory`).

### 3.2 Home (`#/home`) — 9 numbered sections (§01–§09)

1. **Hero** (§00, unnumbered): dark forest `#102E27` ~92vh; crest "সা"; "EST. 1999 · সাতানীপাড়া সমাজ
   কল্যাণ সংঘ"; H1 "একটি এলাকা, একটি পরিবার।"; CTAs "প্রবাসী সহায়তা চান" (`#/expatriate`) and
   "কমিউনিটি ডিরেক্টরি" (`#/directory`); hero image (base64, captioned "নমুনা ছবি · Demo image — প্রকৃত
   এলাকার ছবি নয়"); bottom strip of 3 value props (শিক্ষা · ঐক্য / শান্তি · প্রগতি; "কোনো সার্ভিস চার্জ
   নেই"; "সম্পূর্ণ স্বচ্ছ হিসাব"). QA defect D4: the design system specified a live-data right column
   (next event + open request count); built hero has no right column.
2. **§01 Our story** (`#storyT`): 1999 founding paragraph + pull-quote (Tiro italic, labelled
   "(নমুনা উদ্ধৃতি)" — sample quote from "সম্প্রদায়ের একজন প্রবীণ সদস্য", unnamed) + demo image.
3. **§02 Community at a glance** (`#statT`): "সংখ্যায় সাতানীপাড়া" — only two hard facts shown:
   **1999** (founding year) and **3–5 জন** (Emergency Response Team). Member/family counts and
   expatriate counts are explicitly NOT numbers: both read "তথ্য হালনাগাদ হচ্ছে — … যাচাই শেষে প্রকাশ করা
   হবে।" (honesty placeholder, by design).
4. **§03 Heritage timeline — The Meridian** (`#herT`): single 1px gold line, 1 dated node only —
   **1999 সংঘের প্রতিষ্ঠা** ("এটিই আমাদের একমাত্র যাচাইকৃত মাইলফলক"); three undated era blocks
   ("প্রথম যুগ / ভিত গড়ার বছরগুলো", "মধ্য যুগ / সেবার বিস্তার", "আজ / ডিজিটাল প্ল্যাটফর্ম"). QA D10
   records the single node as intentional, not a defect.
5. **§04 Services** (`#svcT`): 6 numbered rows 01–06 (Expatriate Support, Blood Donor Search, Community
   Directory, Annual Activities, Financial Transparency, Membership). QA D5: numbering is itself a spec
   deviation (rationale bans decorative numbering except for true sequences).
6. **§05 Expatriate service** (`#expT`): pitch + 4-step "how it works" (Apply → Get Request ID, e.g.
   `EXP-2026-1052` → Helper assigned → Full expense account) + CTAs "আবেদন শুরু করুন" / "আবেদন ট্র্যাক
   করুন" + 999 disclaimer ("এই সেবা সরকারি জরুরি সেবার (৯৯৯) বিকল্প নয়") + demo image.
7. **§06 Blood donation** (`#bloodT`): all 8 blood-group chips (A+/A−/B+/B−/O+/O−/AB+/AB−) as links
   that set `state.pendingGroup` and jump to `#/blood` with that group pre-selected; CTA to full donor
   view + emergency request.
8. **§07 Activities & news** (`#actT`): feed `#homeFeed` rendered by `renderHome()` = first 2
   `ACTIVITIES` + first 2 `NEWS` (via `edRow()`), "সব কার্যক্রম" link.
9. **§08 Gallery** (`#galT`): `#homeGallery` (subset of `GALLERY`), "সম্পূর্ণ গ্যালারি" → `#/news`
   gallery tab.
10. **§09 Transparency** (`#finT`): `#homeLedger` — first rows of `FINANCE["2026"]` as a mini ledger
    table + "পূর্ণ আর্থিক প্রতিবেদন" link + "সব অঙ্ক নমুনা/Demo" note.

Plus: dismissible announcement strip (`.strip`, `#stripDismiss` — "New notice: Annual general
meeting…", QA D1: built 44px forest-bg vs spec 36px ivory; fixed in re-verify round per
`REVERIFY_REPORT.md`), footer with 3 link columns (সেবা / সংগঠন / সাহায্য) + brand + demo disclaimer.

### 3.3 Global components

- **Header/nav:** desktop nav (`#mainNav`, 8 items: Home, Directory, Organization, Activities,
  Expatriate Support, Blood Donor, News, Finance) + bell (`#notifBtn` + badge `#notifBadge`) + theme
  button (`#themeBtn`) + login/dashboard button (`#navLoginBtn` / `#navDashBtn`, toggled by
  `setAuthUI()`). QA D7: BN/EN toggle lives in the announcement strip above the nav, not in the nav;
  there is no CTA pill in the nav. **Mobile menu** (`#mmenu`, `#burger`, `#mmenuClose`, `#mmenuScrim`):
  12 items + login/dashboard; QA D6: built as a right-side drawer (~85% width) vs spec full-screen
  bottom sheet. Works (opens, closes on link/scrim).
- **Language toggle** (`#langBn` / `#langEn`): `state.lang` (`"bn"` default). `applyLang()` swaps every
  `[data-i18n]` element from the `EN` dictionary (400 `data-i18n` attributes) and `[data-i18n-ph]`
  placeholders, caching Bengali originals in `bnCache`/`bnPhCache`; sets
  `document.documentElement.lang` and `body.en` class; then calls `renderAll()`. Limitation (documented
  in redesign docs, same in D): chrome/headings/UI translate; **demo data entries stay in their stored
  language** — `DIRECTORY`/`DONORS` etc. carry both `bn`/`en` fields and render per language, but free
  text such as activity bodies is per-entry bilingual objects, not a translation system.
- **Theme toggle** (`#themeBtn`): `setTheme("light"|"dark")` sets
  `document.documentElement[data-theme]`; `initTheme()` forces light on every load; toggle is
  session-only (no persistence — reload resets to light). Toast confirms ("লাইট মোড চালু" / "ডার্ক মোড
  চালু"). Dark ground `rgb(12,19,15)` per QA.
- **Toast** (`#toast`, `toast(msg)`): single toast, auto-hides after 3,600 ms.
- **Notifications** (`#notifBtn`, `#notifPanel`, `#notifList`, `#notifClear`, `#notifBadge`):
  `state.notifs` array (in-memory, starts empty). `pushNotif(title,body)` unshifts
  `{title, body, time: new Date()}` and re-renders; badge shows count (capped "9+"); empty state "এখনো
  কোনো নোটিফিকেশন নেই।"; Clear button empties the list. `browserNotify(title,body)` additionally fires
  a real `Notification` **only if permission is already granted**, and always renders a temporary in-app
  card (auto-dismiss ~5.2 s). QA notes the permission flow itself is not grantable/testable in headless.
- **Search / filters:** directory (`#dirSearch` text + `#dirFilter` category select, 260 ms skeleton
  delay); donors (`#donorSearch` text + `#groupChips` blood-group buttons); activities (year +
  category selects — rendered by `renderActivities()`; year options derived from data: 2026/2025/2024);
  finance (`#finYear` 2026/2025/2024 + `#finType` all/income/expense/donation); news (5 tabs, no text
  search).
- **Lightbox** (`#lightbox`, `#lbImg`, `#lbCap`, `#lbClose`, `#lbPrev`, `#lbNext`): `openLightbox(i)`
  sets `state.galList=GALLERY`, `galIdx`; `updateLb()` sets image/alt/caption "`<caption> — N / 8`";
  `lbStep(±1)` wraps around; click on backdrop closes; `keydown` ArrowLeft/ArrowRight navigate **only
  while open**; Escape closes (per QA R9; note the `keydown` handler in the file as extracted checks
  arrows but the close-on-Esc path is via the close button/Escape handling verified in QA — see §7).
  Gallery images are the same 8 base64 JPEGs everywhere.
- **Accordions** (`bindAccordions`, `accHTML`): constitution (`#constAcc`) and FAQ (`#faqAcc`); first
  item starts open (`aria-expanded=true` + `.open`).
- **Skeleton/loading state:** directory search renders 3 `<div class="skel">` placeholders for 260 ms
  before results (`renderDirectory()` uses `setTimeout(…,260)`). No other loading state exists in D.
  (The editorial alternative has a simulated submit spinner; D does not.)
- **Activity detail** (`renderActivityDetail()`): reads `?id=` from the hash (`#/activity?id=a1`,
  default `a1`, unknown id → first activity); fills `#adTitle`, `#adMeta`, `#adImg`, `#adBody` from the
  matching `ACTIVITIES` entry. No separate data fetch — same array.
- **Finance report download** (`downloadReport(y)`): builds a plain-text summary from `FINANCE[y]` and
  triggers a Blob download named `satanipara-annual-summary-<year>-demo.txt`, headed "SAMPLE / DEMO"
  with "All figures are demo data. Real audited accounts will be published after verification." The
  finance view itself states "ডেমোতে PDF তৈরি হয় না" (no PDF is generated in the demo).
- **Dashboard KPIs** (`renderDashboard()`): `#kpiReq` (request count), `#kpiActive` (status 1–2),
  `#kpiDone` (status 3), `#dashActivity` (first 4 requests). Helper view: `#helperPanel` +
  `#helperQueue` listing **all** `state.requests` with an "Advance status →" button (`data-advance`) per
  request while `status<3`; advancing increments `status`, fills a generic step note if the note is "—"
  ("সহায়ক আপডেট দিয়েছেন (ডেমো)"), pushes a notification, re-renders. Member view: `myReqs()` (own
  `mine:true` requests) **plus the seeded `EXP-2026-1052` always appended** — i.e. every logged-in
  member sees the demo request in their list (see §6).

### 3.4 Forms in Direction D (8 forms; all `novalidate`, all client-side only)

| Form | Fields (ids) | Validation (code) | On success (code) |
|---|---|---|---|
| `#expForm1` (wizard step 1) | `#fService` (select: 7 services), `#fForWhom` (text), `#fDetails` (textarea), `#fWhen` (select: urgent/today/tomorrow/week) | `fForWhom` length >1; `fDetails` length ≥10. Fail → `.invalid` class on the `.field`, error text shown; stays on step 1. | Saves `draft`, `wizardStep(2)`, scrolls to step 2. |
| `#expForm2` (wizard step 2) | `#fName`, `#fPhone` (tel), `#fCountry`, `#fAgree` (checkbox) | `fName` >1; `fPhone` via `phoneOk()` (digits ≥10 after stripping non-digits); `fCountry` >1; `#fAgree` must be checked (`#agreeErr` shown otherwise). | Builds `#reviewBody` (service/for/details/when/applicant/contact), `wizardStep(3)`. Note above the form: "ডেমোতে কোনো তথ্য সার্ভারে যায় না।" |
| (review pane `#expReview`) | `#backTo2`, `#submitReq` | Submit guard: `draft` must have service (in `SVC`), forWhom, details, name, phone, country — else `#submitErr` shown ("আবেদনটি অসম্পূর্ণ — আগের ধাপগুলো পূরণ করে আবার চেষ্টা করুন।") and no request is created. (This guard is the D3 fix; before it, an empty draft threw `TypeError: SVC[undefined]['bn']` and created a corrupt request — see §7.) | Creates `state.requests[id]`, id = `"EXP-2026-" + (1000 + random 0–8999)`; `status:0`, `created:"2026-11-14"`, `mine:true`, step notes `["আবেদন জমা পড়েছে (ডেমো)","—","—","—"]`, `expenses:[]`; shows `#expSuccess` with `#newReqId` + 4-node Meridian mini-timeline (D2 fix); `pushNotif` + `browserNotify` ("নতুন প্রবাসী আবেদন"); toast "আবেদন জমা হয়েছে — <id>". `#trackNew` jumps to tracking; `#anotherReq` resets both forms and returns to step 1. |
| `#trackForm` (expatriate tab 2) | `#trackInput` (text, placeholder `EXP-2026-1052`, uppercase styling) | `doTrack()`: uppercases/trims; unknown id → `#trackField.invalid`, `#trackResult` hidden, error "এই ID-তে কোনো আবেদন পাওয়া যায়নি। ID ঠিকমতো লিখুন (যেমন: EXP-2026-1052)।" | Shows `#trackResult`: `#trId`, status pill `#trStatus` ("<step BN> · <step EN>", class `ok`/`warn`), `#trMeta` (service · for · applicant), `#trSteps` 4-node Meridian timeline with per-step notes, `#trExpenses` ledger table + total row "মোট (সার্ভিস চার্জ ০)". Demo button `data-track-demo` loads `EXP-2026-1052`. |
| `#bloodForm` (emergency blood request) | `#bfGroup` (select, 8 groups), `#bfUnits` (select: 1/2/3/4+ bags), `#bfHospital` (text), `#bfContact` (tel) | `bfHospital` length >2; `bfContact` via `phoneOk()` (≥10 digits). | `#bloodDone` shown ("অনুরোধ পাঠানো হয়েছে (ডেমো)। মিল গ্রুপের দাতারা নোটিফিকেশন পেয়েছেন।"), `pushNotif` ("জরুরি রক্তের অনুরোধ", group + "দাতাদের জানানো হয়েছে।"), toast "অনুরোধ পাঠানো হয়েছে (ডেমো)". No request record is created; no donor is actually contacted. |
| `#regForm` (membership) | `#rName`, `#rPhone` (tel), `#rPass` (password), `#rArea`, `#rType` (select: resident/expat/student), `#rDonor` (checkbox: also list as blood donor) | `rName` >1; `rPhone` `phoneOk()`; `rPass` length ≥6; `rArea` >1. | Toast "নিবন্ধন সম্পন্ন (ডেমো) — এখন ডেমো লগইন দিয়ে ঢুকুন", `pushNotif` ("নিবন্ধন সম্পন্ন", "স্বাগতম! আপনার সদস্য আবেদন গৃহীত হয়েছে (ডেমো)।"), redirects to `#/login`. **Nothing is stored** — the new "account" cannot log in; only the two hardcoded `USERS` can. `#rDonor` is read but does nothing (no donor is added). |
| `#loginForm` | `#liPhone` (tel), `#liPass` (password) | No `fieldValid` call on submit; lookup in `USERS` only. Wrong phone/password → `#liPass` field marked `.invalid`, error "মোবাইল নম্বর বা পাসওয়ার্ড মেলেনি। ডেমো তথ্য ব্যবহার করুন।" Button shows "যাচাই হচ্ছে…" / "Checking…" and is disabled for a simulated 450 ms delay. | `state.user = {phone, ...u}`; `setAuthUI()`; welcome notification; toast "লগইন সফল"; redirect `#/dashboard`. Demo credentials are printed on the login view itself. |
| `#profileForm` | `#pName`, `#pPhone`, `#pArea`, `#pCountry`, `#pFamily` (textarea) | **No validation at all** (submit handler only copies name to the header/avatar). | Toast "প্রোফাইল আপডেট হয়েছে (ডেমো — সংরক্ষিত নয়)"; updates `#profNameView`/`#profAvatar` in-memory only. `fillProfile()` pre-fills from `state.user`; `pCountry`/`pFamily` are never pre-filled from anywhere (no source data). |
| `#contactForm` | `#cName`, `#cPhone` (tel), `#cMsg` (textarea) | `cName` >1; `cPhone` `phoneOk()`; `cMsg` length ≥10. | `#contactDone` shown ("বার্তা গৃহীত হয়েছে (ডেমো) — ধন্যবাদ!"), toast "বার্তা পাঠানো হয়েছে (ডেমো)". Message goes nowhere. |

**Error-message mechanism (all forms):** forms carry `novalidate` (native browser validation disabled);
`fieldValid(input, ok)` toggles `.invalid` on the closest `.field`, which reveals the sibling
`<p class="err-msg">` (Bengali text in markup, English via `data-i18n`). Exactly **one** HTML `required`
attribute exists in the whole file; all enforcement is the JS length/digit checks above.
`phoneOk(v)` = `(v||"").replace(/[^0-9]/g,"").length>=10` — i.e. any 10 digits pass (no `01…` prefix
check, no Bangladesh format check). Password rule is length-only (≥6, registration) and login has no
length rule at all. There is no email field anywhere in Direction D.

**Validation rules as coded (summary):**

| Rule | Where | Exact check in code |
|---|---|---|
| Name / free text required | `fForWhom`, `fName`, `fCountry`, `rName`, `rArea`, `cName` | `.value.trim().length > 1` (2+ characters; a 1-character name fails) |
| Details / message minimum | `fDetails`, `cMsg` | `.trim().length >= 10` |
| Phone | `fPhone`, `rPhone`, `cPhone`, `bfContact` | `phoneOk(v)`: digits-only length ≥ 10 after stripping non-digits. No `01` prefix, no length cap, no format check. `liPhone` (login) has no `phoneOk` check at all. |
| Password (registration) | `rPass` | `.length >= 6` (no complexity rule). Login password has no length rule. |
| Hospital name | `bfHospital` | `.trim().length > 2` |
| Consent checkbox | `fAgree` (wizard step 2) | Must be checked; `#agreeErr` shown otherwise. `rDonor` (registration) is optional and has no effect. |
| Service selected | `fService` | No validation — a `<select>` always has a value; the submit guard additionally checks `SVC[draft.service]` exists. |
| Request ID format | `trackInput` | No format validation — any string is uppercased/trimmed and looked up; unknown → "not found" error. |
| Profile form | `#profileForm` | **No validation at all.** |

**Error behaviour as coded:** errors appear only on submit (or, for login, after the fake 450 ms delay).
No inline "live" validation, no per-keystroke validation, no server round-trip error (there is no
server), no rate-limit/lockout message, no duplicate-phone error (registration never checks duplicates —
it stores nothing). Success feedback is always a toast and/or a shown `#…Done` panel.

**Empty states as coded:**

| Situation | Empty-state text (BN) |
|---|---|
| Directory, no matches | "কিছু পাওয়া যায়নি" / "অন্য নাম বা বিভাগ দিয়ে চেষ্টা করুন।" |
| Donors, no matches for group/search | "এই গ্রুপে দাতা পাওয়া যায়নি" / "জরুরি অনুরোধ পাঠান — দাতাদের নোটিফিকেশন যাবে।" |
| Finance filter, no rows of that type | "এই ধরনে কোনো এন্ট্রি নেই।" |
| Notifications, none | "এখনো কোনো নোটিফিকেশন নেই।" |
| Dashboard activity, none | "এখনো কোনো কার্যকলাপ নেই।" (unreachable in practice — the seeded demo request always populates it) |
| New request expenses | "কাজ শেষ হলে খরচের হিসাব এখানে আসবে। এখন পর্যন্ত: ০ টাকা।" |
| Tracking, unknown ID | Error message above, result panel hidden |
| Home stats (member/expatriate counts) | "তথ্য হালনাগাদ হচ্ছে — … যাচাই শেষে প্রকাশ করা হবে।" (honesty placeholder, not an error) |

### 3.5 Data layer (Direction D, in-file JS)

`const state={lang:"bn",user:null,requests:{},notifs:[],donorGroup:"all",donorConsentAsked:{},galList:[],
galIdx:0,pendingTrack:null,pendingGroup:null}` — all in-memory; reload wipes everything (login, filters,
drafts, submitted requests, notifications, consent). Constants: `SVC` (7 services, BN/EN), `STEPS`
(4 statuses: Pending/Accepted/In Progress/Completed), `USERS` (2 demo accounts), `DIRECTORY` (10),
`COMMITTEE` (5), `ADVISORY` (3), `FORMER` (2), `CONSTITUTION` (5), `FACTS` (5 FAQ), `ACTIVITIES` (6,
each with a full base64 JPEG), `NEWS` (2), `NOTICES` (2), `EVENTS` (2), `JOBS` (1), `GALLERY` (8,
base64 JPEGs), `FINANCE` (3 years), `DONORS` (6), `GROUPS` (9 incl. "all"), `EN` (UI-string dictionary,
~400 keys via `data-i18n`). Render functions: `renderAll`, `renderHome`, `renderDirectory`,
`renderActivities`, `renderActivityDetail`, `renderNews`, `renderFinance`, `renderGroupChips`,
`renderDonors`, `renderDashboard`, `renderMyRequests`, `fillProfile`, `renderNotifs`, `personRows`,
`accHTML`, `edRow`. No `fetch`, no XHR, no API base URL, no endpoints.

---

## 4. Feature audit table (all 37 features)

Status key: **Implemented** = works end-to-end in the prototype (within its simulated limits).
**Simulated** = UI + in-memory behaviour present, but no persistence, no server, no real side effect.
**Partial** = present but materially incomplete vs its own UI promise. **Absent** = named in the brief/task
or in an alternative version but not present in Direction D (or not present anywhere in the repo).
"Data source" is literal: where the rendered content comes from in `index.html`.

| # | Feature | Status (Direction D) | Data source / what is hardcoded | What must become dynamic | Backend functionality needed (as implied by the prototype) | Database entities needed (as implied) | Permissions / access |
|---|---|---|---|---|---|---|---|
| 1 | Home | Implemented (simulated data) | Inline HTML (§01–§09) + `ACTIVITIES.slice(0,2)`, `NEWS.slice(0,2)`, `GALLERY`, `FINANCE["2026"]` for feed/gallery/ledger strips | Hero copy, story, timeline nodes, service list, stats, feed, gallery, ledger | CMS-managed home sections; stats aggregation; feed assembly | Page sections / settings; activities; news; gallery items; finance rows | Public |
| 2 | Community Profile / Directory (overview) | Partial | `#/directory` is search+filter only; no separate "community profile" overview page in D (v1 had `#/community` with overview + directory). Closest overview is Home §02 stats ("তথ্য হালনাগাদ হচ্ছে") | Real member/family/expatriate counts, area profile | Stats aggregation (counts by area/status, with "updating" state when unverified) | Members (aggregates); areas | Public (aggregates only; no personal data) |
| 3 | People Directory | Simulated | `DIRECTORY` (10 entries, §5.1); search matches BN+EN name/role/area; category filter `all/teacher/doctor/professional/business/institution/place`; 260 ms skeleton; empty state "কিছু পাওয়া যায়নি / অন্য নাম বা বিভাগ দিয়ে চেষ্টা করুন।" | All entries; categories; areas; contact visibility rules | Search + filter API; add/edit/remove entries; approval before publishing (real data needs consent) | Directory entries (person/institution/place), categories, areas | Public to view; create/edit restricted to admin (prototype has no directory admin UI at all) |
| 4 | Professionals Directory | Partial (subset of #3) | Same `DIRECTORY` array; `teacher` (2), `doctor` (1), `professional` (2: civil engineer, advocate), `business` (1) — no separate "professionals" view, tab, or filter label; professionals only distinguishable via the shared category filter | Separate professional listing/filter, profession taxonomy, credentials | Same as #3 + profession taxonomy | Same as #3 (profession field) | Public to view |
| 5 | Institutions | Partial (subset of #3) | Same array; `institution` (3: High School, Jame Mosque, Community Clinic), `place` (1: Historic Banyan Tree Square). No institution detail page, no hours/services/contact fields | Institution profiles (type, services, hours, contact, location) | Institution CRUD + detail view | Institutions (subtype: school/mosque/clinic/…) | Public to view |
| 6 | Community Infrastructure | Absent in D | No infrastructure listing, map, or facilities section exists in `index.html` (no map — 0 `<iframe>`, no map library; the word "map" occurs only inside JS `.map()` calls). Only "places" are the 2 directory entries above (mosque, banyan square) | Entire feature: facilities/infrastructure catalogue, locations, status | New module: infrastructure records + (if wanted) map | Infrastructure/facility records | Public to view |
| 7 | Organization History | Simulated | Inline HTML in `#/organization` ("org-history" tab): 1999 founding paragraph + Mission + Vision + "সালভিত্তিক বিস্তারিত ইতিহাস নথি যাচাই শেষে এখানে যুক্ত হবে — কোনো তথ্য অনুমান করে লেখা হয়নি।" Home §03 Meridian has the same single 1999 node. No other dates exist anywhere | Year-by-year history entries (only after document verification) | History/timeline CMS (dated milestones, verification flag) | Timeline milestones (date, title, body, verified flag) | Public to view; edit admin-only |
| 8 | Constitution | Simulated | `CONSTITUTION` (5 articles, §5.3), rendered as accordion `#constAcc` (first open). Labelled "(নমুনা সারসংক্ষেপ) — পূর্ণ গঠনতন্ত্র অফিস থেকে সংগ্রহযোগ্য।" — the prototype itself says this is a summary, not the constitution | Full constitution text (articles/clauses), versioning, downloadable document | Document management (versioned constitution, file upload/download) | Constitution versions / articles; documents | Public to view summary; full text per org decision |
| 9 | Executive Committee | Simulated | `COMMITTEE` (5 demo people, §5.3), rendered by `personRows()` with "নমুনা" pill; tabs `#org-committee` | Real committee (roles, terms, photos, contact rules) | Committee management (terms, roles, succession) | Committee memberships (person, role, term start/end) | Public to view; edit admin-only |
| 10 | Advisory Council | Simulated | `ADVISORY` (3 demo people, §5.3), same renderer | Real advisers | Same as #9 | Same as #9 (role = adviser) | Public to view |
| 11 | Former Leaders | Simulated | `FORMER` (2 demo people, §5.3; one has `t:"1999 — "` with open-ended term, the other `t:""`) | Real former leaders with complete terms | Same as #9 + historical terms | Same as #9 (status = former, term range) | Public to view |
| 12 | Annual Activities | Simulated | `ACTIVITIES` (6 entries a1–a6, §5.2); `#/activities` renders via `renderActivities()` with year filter (2026/2025/2024) + category filter (options in markup — categories are NOT stored per activity in D; the filter exists in the UI but activity objects have no `cat` field — see §7) | All activities with year, category, date, images, body | Activity CRUD; year/category filtering; archive | Activities (year, category, date, title, body, images) | Public to view; create/edit admin-only |
| 13 | Activity Details | Simulated | `#/activity?id=aX` via `renderActivityDetail()` (title/meta/image/body from the same `ACTIVITIES` entry; unknown id → a1). No comments, no attendance, no related activities | Rich detail (gallery, participants, outcomes, related) | Activity detail endpoint (same entity as #12) | Same as #12 | Public |
| 14 | Expatriate Support (service pages/wizard) | Simulated | 3-step wizard `#expForm1` → `#expForm2` → `#expReview` → `#expSuccess` (§3.4); services `SVC` (7: grocery, medicine, hospital, elderly, home, document, general); urgency `#fWhen` (urgent/today/tomorrow/week); policy copy inline (no charge, 999 disclaimer, ERT 3–5). **Doc/build mismatch D11:** `DESIGN_SYSTEM.md` §7.1 describes 4 steps; built wizard has 3 panes + success | Real request intake, assignment, fulfilment workflow | Request intake + assignment + status workflow + expense recording + notifications | Expatriate requests (service, for-whom, details, when, applicant, phone, country, status, helper, step notes, expenses, created date) | Public to submit (no login required in prototype — wizard is reachable logged-out); own requests visible after login; helpers see queue |
| 15 | Expatriate Requests (list/queue) | Partial | Helper queue `#helperQueue` (dashboard, helper login only) lists all `state.requests`; member "My Requests" `#/my-requests` lists own + seeded demo. No admin list, no search/filter/pagination, no assignment UI (no way to assign a helper — status only advances) | Request queue with search, filter by status/service, assignment to a helper, notes | Request list/queue APIs; assignment; status transitions with audit trail | Same as #14 + assignments + status history | Helper: all requests. Member: own only. Super Admin: all (no Super Admin UI exists in prototype) |
| 16 | Request Tracking | Simulated | `doTrack()` + `#trackResult` (§3.4); 4 statuses `STEPS`; seeded `EXP-2026-1052` (status 2, expenses ৳970); new requests get random IDs and empty expenses | Real lookup by ID (public, no login), accurate status + expense ledger | Public tracking lookup by Request ID; status/expense history | Same as #14 (status history, expense lines) | Public by Request ID (anyone with the ID can view — privacy implication to confirm: prototype exposes applicant name/area in `#trMeta`) |
| 17 | Emergency Response | Partial | Copy only: ERT "3–5 জন" mentioned on Home §02/§05 and FAQ; 999 disclaimer everywhere; blood emergency form exists (§3.4 `#bloodForm`) but there is **no expatriate-emergency request path** in D (the editorial alternative reveals an ERT box on the emergency category; D's wizard has no emergency category — `SVC` has `home: "বাড়ির জরুরি কাজ"` as the closest). No ERT roster, no escalation, no phone numbers (contact page: "প্রকৃত ফোন/ইমেইল যাচাই শেষে প্রকাশিত হবে — ডেমোতে কোনো নমুনা নম্বর দেওয়া হয়নি।") | ERT roster, on-call rotation, escalation rules, emergency contact channel | Emergency flagging on requests; ERT alerting; escalation | ERT members / on-call roster; emergency flags on requests | Public to request help; ERT membership admin-managed |
| 18 | Blood Donor Directory | Simulated | `DONORS` (6, §5.2); `#/blood` donors tab: text search (`#donorSearch`, name/area), group chips (`#groupChips`, 9 incl. All), availability pill (Available/Unavailable), last-donation text; empty state "এই গ্রুপে দাতা পাওয়া যায়নি" | Real donor registry with verified availability/last-donation, area taxonomy | Donor search/filter; availability management; consent workflow | Donors (name, blood group, area, last donation, availability, phone — masked, consent status) | Public to search (names/areas visible; phones masked); phone reveal only via consent flow |
| 19 | Blood Donation Requests | Simulated | `#bloodForm` (§3.4) + `#bloodDone` confirmation; pushes a notification; **creates no record, contacts no donor**. Donor consent: per-donor "সম্মতি চান" button → instantly sets `state.donorConsentAsked[name]=true` and reveals the partially-masked number (`01••• •••421`) with pill "সম্মতি মিলেছে" — consent is simulated by the requester's own click, not by the donor | Real emergency request → notify matching donors → donor consents (donor-side action) → reveal number to requester; request tracking | Blood-request intake; donor matching + notification; donor consent action; request lifecycle | Blood requests (group, units, hospital, contact, status); donor consents (donor, request, granted/revoked, timestamp) | Public to submit; donors act on own consent; phones never public without consent |
| 20 | News | Simulated | `NEWS` (2 items, §5.2), rendered by `renderNews()` → `#newsList` via `edRow()`; tab in `#/news`; also feeds Home §07. No detail page (rows link to `#/news` itself), no author, no images | Real news publishing (author, date, body, images, detail page) | News CRUD + publishing workflow | News articles (date, tag, title, body, author, status) | Public to view; publish admin-only |
| 21 | Notices | Simulated | `NOTICES` (2 items), same renderer/tab; announcement strip also carries one notice ("বার্ষিক সাধারণ সভা…"). No detail page, no expiry, no priority | Real notices with dates/expiry/priority, detail view | Notice CRUD | Notices (same shape as news + expiry/priority) | Public to view; publish admin-only |
| 22 | Events | Simulated | `EVENTS` (2 items: winter blood camp, annual sports & cultural programme), same renderer/tab. No date/time/venue fields beyond prose, no RSVP, no calendar | Real events (date/time/venue, registration) | Event CRUD (+ optional RSVP) | Events (date/time, venue, body) | Public to view; manage admin-only |
| 23 | Jobs | Simulated | `JOBS` (1 item: "স্থানীয় প্রতিষ্ঠানে নিয়োগ বিজ্ঞপ্তি (নমুনা)"), same renderer/tab. Body says "প্রকৃত বিজ্ঞপ্তি যাচাই করে প্রকাশিত হয়।" No employer, deadline, apply link | Real job circulars (employer, deadline, details, application route) | Job CRUD with verification flag | Job circulars (employer, deadline, body, verified flag) | Public to view; publish admin-only (verified only) |
| 24 | Photo Gallery | Simulated | `GALLERY` (8 base64 JPEGs with BN/EN captions, `wide:true` on 2, §5.5); `#fullGallery` + `#homeGallery`; lightbox (§3.3). Captions all "(নমুনা ছবি)". No albums, no upload, no metadata beyond caption | Real photo library (albums, captions, consent, upload) | Media library (upload, albums, captions, consent flags) | Gallery items (image, caption BN/EN, album, consent, order) | Public to view; upload admin-only |
| 25 | Video Gallery | Absent (placeholder) | Tab exists (`data-galtype="video"`); clicking it hides `#fullGallery` and shows `#videoNote`: "ভিডিও গ্যালারি শীঘ্রই আসছে — ডেমোতে ভিডিও আপলোড করা হয়নি। প্রকৃত ভিডিও সংঘের অনুমতি নিয়ে যুক্ত হবে।" 0 `<video>`, 0 `<iframe>`, 0 YouTube references in the file | Entire feature: video records, embeds/uploads, consent | Video library (same as #24 + video handling) | Video items (source, caption, consent) | Public to view; upload admin-only |
| 26 | Financial Transparency | Simulated | `#/finance`: year + type filters over `FINANCE` (§5.4); totals row "মোট উদ্বৃত্ত (নমুনা)"; annual-report buttons (`.txt` download, §3.3); home §09 mini-ledger. Banner: "এই পেজের সব অঙ্ক নমুনা/Demo। … এখানে কোনো প্রকৃত আর্থিক তথ্য নেই।" | Real audited accounts, monthly + annual reporting, receipts | Finance ledger + reporting; audit trail; published reports | Ledger entries (year, item, kind income/expense/donation, amount); reports | Public to view published figures; entry admin-only (treasurer/Super Admin) |
| 27 | Income / Expense | Simulated (subset of #26) | Same `FINANCE` rows: `k:"income"\|"expense"\|"donation"`; filter `#finType` (all/income/expense/donation); computed total = sum of filtered rows (2026: ৳320,000; 2025: ৳296,000; 2024: ৳155,000 — computed from the demo rows, see §5.4). No dates, no payee, no receipt, no category beyond the 3 kinds | Dated transactions with payee, category, receipt, approval | Transaction ledger with dates/categories/receipts | Transactions (date, item, kind, category, amount, payee, receipt) | Public to view summaries; entry admin-only |
| 28 | Project Accounts | Absent in D | **No project-accounts table in Direction D.** The finance view has only the year ledger + annual reports. (The editorial alternative has `LEDGER`: 4 projects with budget/spent/status — §2.2. v1's `REPORTS` mention project accounts in prose only.) | Entire feature in D: per-project budget vs spent vs status | Project accounting | Projects (name, budget, spent, status) + linked transactions | Public to view; manage admin-only |
| 29 | Annual Reports | Partial | Report buttons for 2026/2025/2024 in `#reportList`, each downloads a generated `.txt` summary (`downloadReport()`); labelled "নিরীক্ষিত সারসংক্ষেপ (নমুনা)" in the UI but the file itself says SAMPLE/DEMO and "Real audited accounts will be published after verification." No PDF ("ডেমোতে PDF তৈরি হয় না"), no report detail view | Real audited annual reports (PDF + summary, versioned by year) | Report publishing (file upload + metadata) | Annual reports (year, title, file, audited flag) | Public to download published reports |
| 30 | Membership Registration | Simulated | `#regForm` (§3.4): name/phone/password/area/type/donor-opt-in. Success toast + redirect to login. **Nothing is stored and the new account cannot log in** (only `USERS` can). No approval step, no member ID, no dues/subscription handling (the word "চাঁদা" appears only as a finance income line, not as a membership fee flow) | Real registration: unique phone, hashed password, member ID, approval, dues | Registration + approval workflow; member records; password hashing | Members (name, phone, password hash, area, type, donor opt-in, status, member ID, joined date) | Public to apply; approval admin-only (Super Admin creates users per Phase 1 scope — see §6) |
| 31 | Member Login | Simulated | `#loginForm` (§3.4) vs hardcoded `USERS` (2 accounts, plaintext passwords in the file — §5.5). 450 ms fake delay. No OTP (by design), no "remember me", no forgot-password flow in D, no lockout, no session (in-memory only; reload logs out) | Real auth: hashed passwords, sessions, password reset by Super Admin, lockout/rate-limit | Auth (login/logout/session, password reset) | Users / credentials (phone, password hash, role) | Members + helpers |
| 32 | Member Dashboard | Simulated | `#/dashboard` (§3.3): greeting, role line, 3 KPIs, recent activity (≤4), helper panel + queue for helpers. Member sees own requests + seeded demo request; helper sees all requests. No admin dashboard exists (no Super Admin view anywhere) | Real dashboard (own data, notifications, quick actions); separate Super Admin dashboard | Dashboard aggregation per role | (Aggregates over requests/notifications/members) | Member: own. Helper: request queue. Super Admin: absent — to be built |
| 33 | Member Profile | Simulated | `#/profile`: view (`#profAvatar`, `#profNameView`, `#profMetaView`) + `#profileForm` (§3.4). Pre-fill only name/phone/area from `USERS`; country/family have no source. Save is in-memory only. No expatriate profile / family-members section in D (v1 had both; D dropped them) | Real profile (incl. expatriate/family info per v1), edit with persistence, photo | Profile CRUD | Member profile (name, phone, area, country, family info) | Own profile only (member edits self; admin views/manages) |
| 34 | Member Notifications | Simulated | In-memory `state.notifs` (§3.3): created by login, registration, request submit, blood request, consent, helper advance. Bell + panel + badge + Clear. **Starts empty on every load**; no history, no per-user delivery, no push, no email/SMS. `browserNotify()` fires a real Notification only if permission already granted | Real notifications: persistent, per-user, triggered by request events, delivered to helpers (browser notification per Phase 1 scope) | Notification service (create/list/clear, per-user, event-triggered) | Notifications (user, title, body, time, read flag) | Own notifications only; helpers receive request alerts |
| 35 | Contact | Simulated | `#/contact`: `#contactForm` (§3.4) + info panel — address "সংঘ কার্যালয়, সাতানীপাড়া (নমুনা ঠিকানা)", hours "প্রতিদিন সকাল ৯টা — রাত ৮টা (নমুনা)", emergency "জাতীয় জরুরি সেবা: 999", and "প্রকৃত ফোন/ইমেইল যাচাই শেষে প্রকাশিত হবে — ডেমোতে কোনো নমুনা নম্বর দেওয়া হয়নি।" No map, no email address, no phone number anywhere in D | Real contact details, office info, map, message inbox | Contact-message inbox (receive/list/reply) | Contact messages (name, phone, message, time, status) | Public to send; inbox admin-only |
| 36 | FAQ | Simulated | `FACTS` (5 Q&A, §5.3) as accordion `#faqAcc`. Covers: service charge (0), donor number/consent, OTP (none), emergency (call 999), where accounts are published. No search, no categories, no admin editing | Managed FAQ (categories, search) | FAQ CRUD | FAQ entries (question, answer, order) | Public to view |
| 37 | Privacy Policy | Simulated (static text) | `#/privacy`: 4 numbered principles, inline HTML (no data array): (1) no disclosure without consent; (2) minimal collection, "এই ডেমো সংস্করণে কোনো তথ্যই সার্ভারে সংরক্ষিত হয় না"; (3) role-based access — "অ্যাডমিন অ্যাক্সেস মাত্র দুটি ভূমিকায় সীমিত — Super Admin ও Expatriate Helper। Helper শুধু প্রবাসী আবেদন দেখতে ও আপডেট করতে পারেন।"; (4) right to correct/delete via office application. No consent log, no data-export/delete flow | Full privacy policy + consent records + data rights handling (access/correction/deletion requests) | Consent + data-rights workflows | Consents; data requests (type, status) | Public to read; rights requests by members |

**Feature count:** 37 audited items. In Direction D: Implemented/simulated end-to-end (within prototype
limits): ~24; Partial: 9 (#2, #4, #5, #12-category-filter, #15, #17, #29, #33-family/expat profile —
the audit counts eight named items plus the category-filter sub-item); Absent: 4 (#6 infrastructure,
#25 video gallery, #28 project accounts in D, #32 Super Admin dashboard — plus no forgot-password flow,
no map, no payment/dues flow anywhere).

### 4.1 Cross-cutting observations from the table

- **No admin surface exists in Direction D.** The only privileged view is the helper queue inside the
  member dashboard. There is no Super Admin login, no user creation UI, no member management, no content
  management, no finance entry, no report upload — despite the standing Phase 1 scope saying Super Admin
  "creates users" and "resets passwords". All of that is backend/admin-panel work with no prototype
  counterpart.
- **No login is required to submit anything.** Expatriate wizard, tracking, blood emergency request,
  contact form, and registration are all reachable logged-out. Only dashboard/profile/my-requests are
  guarded (client-side).
- **Tracking is public by Request ID** (`doTrack` needs no auth) and exposes applicant name + area in
  `#trMeta` — a privacy decision the backend must confirm, not assume.
- **Every list is tiny and unpaginated** (max 10 rows). No pagination, sorting, or server-side search
  exists anywhere in the prototype.

---

## 5. Duplicated components and repeated content across views

All of the following are literal duplications inside `index.html` (same data rendered in two or more
places, or the same UI pattern re-implemented per view). A backend should source each once.

1. **Seeded demo request `EXP-2026-1052` rendered in 4 places:** (a) Home §05 "how it works" step 2 as
   the example ID; (b) expatriate tracking demo button (`data-track-demo`) + placeholder text;
   (c) member dashboard activity list (appended to every member's list in `renderDashboard()`); (d) My
   Requests list (appended in `renderMyRequests()`). Same object (`state.requests["EXP-2026-1052"]`)
   drives (b)–(d).
2. **Finance 2026 rows rendered twice:** `#/finance` ledger (`renderFinance()`) and Home §09
   `#homeLedger` (first rows of `FINANCE["2026"]`).
3. **Activities + News rendered twice:** full lists on `#/activities` / `#/news`, and a combined feed on
   Home §07 (`renderHome()`: `ACTIVITIES.slice(0,2)` + `NEWS.slice(0,2)` via the shared `edRow()`
   helper).
4. **Gallery images rendered twice:** `#homeGallery` (subset) and `#fullGallery` on `#/news`; the
   lightbox reuses the same `GALLERY` array a third time. The same 8 base64 JPEGs also appear in the
   home hero/story/expatriate/activity images — 21 `data:image/jpeg` occurrences total in the file, with
   several images reused across sections (QA notes the hero image reused as lightbox item 1,
   `assets/hero.jpg` → caption "1 / 8", and the paddy image as item 2).
5. **Blood-group chips rendered twice:** Home §06 (8 group links that pre-select the group on `#/blood`)
   and `#/blood` `#groupChips` (rendered by `renderGroupChips()` from the same `GROUPS` array).
6. **Organization content rendered twice:** Home §03 Meridian timeline (1999 node + era blocks) vs
   `#/organization` history tab (same 1999 paragraph + Mission/Vision, inline HTML in both places —
   not shared data).
7. **Constitution/FAQ accordion pattern duplicated:** `accHTML()` + `bindAccordions()` serve both
   `#constAcc` (5 articles) and `#faqAcc` (5 Q&A) — shared code, separate data (good), but the same
   "first item open" behaviour in both.
8. **Person rows:** `personRows()` renders `COMMITTEE`, `ADVISORY`, and `FORMER` identically (avatar
   initial + name + role + "নমুনা" pill) — one component, three lists.
9. **News/notices/events/jobs rows:** all four lists render through the same `edRow()` helper (date +
   title + body + tag) into `#newsList` / `#noticeList` / `#eventList` / `#jobList`.
10. **Service catalogue repeated:** the 7 `SVC` services appear in (a) the wizard `#fService` select,
    (b) Home §04 service row 01, (c) Home §05 pitch, (d) tracking `#trMeta`, (e) dashboard/helper queue
    labels — all from the one `SVC` object (good), but the *policy copy* (no charge / 999 / ERT 3–5) is
    re-typed as inline HTML in Home §05, the wizard step-2 note, the FAQ, and the privacy view.
11. **Demo disclaimers repeated verbatim in many places:** "সব এন্ট্রি নমুনা/Demo", "সব অঙ্ক নমুনা/Demo",
    "নমুনা ছবি · Demo image — প্রকৃত এলাকার ছবি নয়" (on every captioned image), "তথ্য হালনাগাদ হচ্ছে"
    (Home §02 twice + organization history).
12. **1999 founding fact** appears in: hero ("EST. 1999"), Home §02 stat, Home §03 timeline,
    organization history, footer/brand subline, and the rationale view.
13. **Across the three HTML files:** the same demo request `EXP-2026-1052` (medicine ৳850 + transport
    ৳120 = ৳970, service charge 0) is seeded in **all three** directions, with different statuses (D:
    status 2 In Progress; editorial: status 3 Completed; v1: status 3 Completed) and different helper
    names. Editorial/v1 additionally seed a second request `EXP-2026-1047` (status 2) that **does not
    exist in Direction D**.

**Backend consequence:** each duplicated item must have exactly one source of truth in the backend
(one settings/content record, one ledger, one request record, one media library), with every view
reading from it. The prototype's re-typed policy copy and re-typed 1999 fact are the clearest examples:
in the backend they become single managed content records, not per-view text.

---

## 6. Demo-data catalogue summary (ALL DEMO — none of this is real)

Counts of "নমুনা": 108 occurrences in `index.html`; "Demo": 41; "demo" (lowercase): 79 — labelling is
pervasive, not incidental. Images: 21 embedded base64 JPEGs in `index.html` (6 activity images + 8
gallery + hero/story/expatriate/other section images, with reuse); 5 in the editorial file; 21 in v1.
No image has a real-world source, licence, or consent record in the repo.

### 6.1 Directory — `DIRECTORY` (10 entries)

| # | Name (BN) | Role / description | Category | Area |
|---|---|---|---|---|
| 1 | মোঃ আব্দুল করিম (নমুনা) | প্রধান শিক্ষক, সাতানীপাড়া সরকারি প্রাথমিক বিদ্যালয় | teacher | মধ্য পাড়া |
| 2 | ডাঃ ফারহানা ইয়াসমিন (নমুনা) | এমবিবিএস চিকিৎসক, উপজেলা স্বাস্থ্য কমপ্লেক্স | doctor | দক্ষিণ পাড়া |
| 3 | ইঞ্জিনিয়ার তানভীর হাসান (নমুনা) | সিভিল ইঞ্জিনিয়ার | professional | উত্তর পাড়া |
| 4 | মোসাঃ রুমানা বেগম (নমুনা) | সহকারী শিক্ষক | teacher | পূর্ব পাড়া |
| 5 | মোঃ শফিকুল ইসলাম (নমুনা) | ব্যবসায়ী — মুদি ও কৃষি উপকরণ | business | বাজার পাড়া |
| 6 | অ্যাডভোকেট নুসরাত জাহান (নমুনা) | আইনজীবী | professional | মধ্য পাড়া |
| 7 | সাতানীপাড়া উচ্চ বিদ্যালয় (নমুনা) | শিক্ষা প্রতিষ্ঠান | institution | মধ্য পাড়া |
| 8 | সাতানীপাড়া জামে মসজিদ (নমুনা) | ধর্মীয় প্রতিষ্ঠান | institution | মধ্য পাড়া |
| 9 | কমিউনিটি ক্লিনিক (নমুনা) | স্বাস্থ্য সেবা কেন্দ্র | institution | দক্ষিণ পাড়া |
| 10 | ঐতিহাসিক পুরনো বটতলা (নমুনা) | গুরুত্বপূর্ণ স্থান — সাপ্তাহিক হাট বসে | place | বাজার পাড়া |

Areas used: উত্তর/মধ্য/দক্ষিণ/পূর্ব/বাজার পাড়া. Every entry carries a BN+EN name/role/area. No phone,
email, or address fields exist on any directory entry.

### 6.2 Activities, news, donors, gallery (Direction D)

**Activities — `ACTIVITIES` (6):** a1 2026 মার্চ ২০২৬ মেধাবী শিক্ষার্থী বৃত্তি প্রদান; a2 2026 জানুয়ারি
২০২৬ স্বেচ্ছায় রক্তদান শিবির; a3 2025 ডিসেম্বর ২০২৫ শীতবস্ত্র বিতরণ; a4 2025 জুলাই ২০২৫ বৃক্ষরোপণ
কর্মসূচি; a5 2025 মে ২০২৫ বিনামূল্যে চিকিৎসা শিবির; a6 2024 আগস্ট ২০২৪ বন্যাদুর্গতদের ত্রাণ সহায়তা.
Each has a 1–2 sentence BN+EN body ending "(নমুনা বিবরণ)" and its own embedded base64 JPEG. No category
field is stored (see §7).

**News — `NEWS` (2):** "সংঘের নতুন ডিজিটাল প্ল্যাটফর্ম চালু" (নভেম্বর ২০২৬); "শিক্ষার্থীদের সাফল্য:
বোর্ড পরীক্ষায় উজ্জ্বল ফল" (অক্টোবর ২০২৬). **Notices — `NOTICES` (2):** "বার্ষিক সাধারণ সভা অনুষ্ঠিত
হবে" (নভেম্বর ২০২৬); "সদস্য তথ্য হালনাগাদের আহ্বান" (নভেম্বর ২০২৬). **Events — `EVENTS` (2):**
"শীতকালীন রক্তদান শিবির" (ডিসেম্বর ২০২৬, সংঘ কার্যালয় প্রাঙ্গণ); "বার্ষিক ক্রীড়া ও সাংস্কৃতিক
অনুষ্ঠান" (ডিসেম্বর ২০২৬). **Jobs — `JOBS` (1):** "স্থানীয় প্রতিষ্ঠানে নিয়োগ বিজ্ঞপ্তি (নমুনা)"
(নভেম্বর ২০২৬).

**Blood donors — `DONORS` (6):**

| Name (নমুনা) | Group | Area | Last donation | Available | Masked phone |
|---|---|---|---|---|---|
| মোঃ ইমরান হোসেন | O+ | উত্তর পাড়া | ৩ মাস আগে | yes | 01••• •••421 |
| মোসাঃ শারমিন সুলতানা | B+ | মধ্য পাড়া | ৫ মাস আগে | yes | 01••• •••877 |
| মোঃ রাকিবুল ইসলাম | A+ | দক্ষিণ পাড়া | ২ মাস আগে | yes | 01••• •••103 |
| মোঃ তৌহিদুল ইসলাম | O− | পূর্ব পাড়া | ৬ মাস আগে | no | 01••• •••556 |
| মোসাঃ নাজনীন আক্তার | AB+ | বাজার পাড়া | ৪ মাস আগে | yes | 01••• •••290 |
| মোঃ সাকিব হাসান | B− | উত্তর পাড়া | ১ বছর আগে | yes | 01••• •••764 |

Only 6 of 8 blood groups have a donor (A− and AB− have none — the empty state "এই গ্রুপে দাতা পাওয়া
যায়নি" is reachable). Unavailable donors have their consent button disabled.

**Gallery — `GALLERY` (8, all "(নমুনা ছবি)"):** 1. সবুজ ধানক্ষেতে এলাকার মানুষ (`wide:true`); 2.
ফসলের মাঠ ও গ্রামের বাড়ি; 3. নৌকায় নদী পারাপার; 4. শ্রেণিকক্ষে পাঠ; 5. রক্তদান শিবির; 6. গ্রামের
হাট-বাজার (`wide:true`); 7. মেঠো পথে প্রতিদিনের যাতায়াত; 8. এলাকার একজন প্রবীণ. All 8 are base64
JPEGs embedded in the file (not real photos of the area — captioned as such).

### 6.3 Organization + FAQ (Direction D)

**Committee — `COMMITTEE` (5, all "(নমুনা)"):** মোঃ হাবিবুর রহমান — সভাপতি (President); মোঃ সেলিম
উদ্দিন — সাধারণ সম্পাদক (General Secretary); মোসাঃ শারমিন আক্তার — কোষাধ্যক্ষ (Treasurer); মোঃ
রফিকুল ইসলাম — সাংগঠনিক সম্পাদক (Organising Secretary); মোঃ জাহিদ হোসেন — প্রবাসী বিষয়ক সম্পাদক
(Expatriate Affairs Secretary).
**Advisory — `ADVISORY` (3):** আলহাজ্ব মোঃ নূরুল ইসলাম — প্রধান উপদেষ্টা (Chief Adviser); বীর
মুক্তিযোদ্ধা মোঃ আবুল কাশেম — উপদেষ্টা; অধ্যাপক ড. মাহমুদা খাতুন — উপদেষ্টা.
**Former leaders — `FORMER` (2):** মরহুম মোঃ আবদুস সাত্তার — প্রতিষ্ঠাতা সভাপতি (Founding President),
term "1999 — " (open); মোঃ ইউনুস আলী — সাবেক সাধারণ সম্পাদক (Former General Secretary), term "" (blank).
**Constitution — `CONSTITUTION` (5 articles, sample summaries):** ধারা ১ নাম ও লক্ষ্য; ধারা ২ সদস্যপদ;
ধারা ৩ কমিটি ও নির্বাচন; ধারা ৪ অর্থ ও নিরীক্ষা; ধারা ৫ তথ্যের গোপনীয়তা.
**FAQ — `FACTS` (5):** service charge (শূন্য/zero); how to get a donor's number (consent only); login
OTP (none — "না। শুধু মোবাইল নম্বর ও পাসওয়ার্ড"); emergency (call 999 first; ERT 3–5, not a
government-service replacement); where accounts are published (finance page).

### 6.4 Finance — `FINANCE` (Direction D, all DEMO ৳)

| Year | Item | Kind | Amount (৳) |
|---|---|---|---|
| 2026 | সদস্য চাঁদা (Member subscriptions) | income | 184,000 |
| 2026 | প্রবাসী অনুদান (Expatriate donations) | donation | 256,000 |
| 2026 | শিক্ষা বৃত্তি ব্যয় (Scholarship expenses) | expense | −142,000 |
| 2026 | রক্তদান ও স্বাস্থ্য শিবির (Blood & health camps) | expense | −68,000 |
| 2026 | বিশেষ অনুদান (ত্রাণ) (Special donation, relief) | donation | 90,000 |
| **2026 total (computed by `renderFinance()`)** | | | **320,000** |
| 2025 | সদস্য চাঁদা | income | 162,000 |
| 2025 | প্রবাসী অনুদান | donation | 210,000 |
| 2025 | শীতবস্ত্র কর্মসূচি (Winter clothing) | expense | −54,000 |
| 2025 | বৃক্ষরোপণ (Tree plantation) | expense | −22,000 |
| **2025 total** | | | **296,000** |
| 2024 | সদস্য চাঁদা | income | 148,000 |
| 2024 | বন্যা ত্রাণ তহবিল (Flood relief fund) | donation | 175,000 |
| 2024 | ত্রাণ বিতরণ ব্যয় (Relief distribution) | expense | −168,000 |
| **2024 total** | | | **155,000** |

Totals recomputed from the listed rows (2026: 184,000+256,000−142,000−68,000+90,000 = 320,000;
2025: 296,000; 2024: 155,000). No dates, payees, receipts, or sub-categories. Annual-report buttons
exist for 2026/2025/2024 (`.txt` download only). **Editorial alternative only** — project accounts
`LEDGER`: শিক্ষাবৃত্তি প্রকল্প ৳125,000 budget / ৳118,500 spent / চলমান; শীতবস্ত্র প্রকল্প
৳90,000/৳87,500/সম্পন্ন; চিকিৎসা সহায়তা তহবিল ৳150,000/৳132,000/চলমান; মানবিক সহায়তা তহবিল
৳120,000/৳94,500/চলমান. These figures do not exist in Direction D.

### 6.5 Expatriate demo request + demo accounts (DEMO — must never be carried into a real system)

**Seeded request `EXP-2026-1052`** (in `index.html`, `state.requests["EXP-2026-1052"]`): service
`medicine` (ওষুধ সংগ্রহ); for whom "মা — উত্তর পাড়া (নমুনা)"; applicant "প্রবাসী সদস্য, সৌদি আরব
(নমুনা)"; status **2 (In Progress)** of 4; created "2026-11-10"; step notes BN: ["১০ নভেম্বর আবেদন জমা
পড়েছে", "সহায়ক মোঃ রফিকুল (নমুনা) গ্রহণ করেছেন", "ওষুধ সংগ্রহ করে বাড়ি পৌঁছে দেওয়া হচ্ছে", "—"];
expenses: ওষুধ (প্রেসক্রিপশন অনুযায়ী) ৳850 + যাতায়াত ভাড়া ৳120 = **মোট ৳970, সার্ভিস চার্জ ৳০**.
(Editorial/v1 seed the same ID with status 3 Completed and a second request `EXP-2026-1047`, status 2.
Editorial probe created `EXP-2026-5646`; Direction D QA probe created `EXP-2026-4298` — both were
in-memory only and are not in the repo.)
**Services `SVC` (7):** grocery বাজার-সদাই; medicine ওষুধ সংগ্রহ; hospital হাসপাতাল সহায়তা; elderly
বয়স্ক অভিভাবকের যত্ন; home বাড়ির জরুরি কাজ; document নথি সংগ্রহ; general সাধারণ সহায়তা.
**Statuses `STEPS` (4):** 0 Pending (অপেক্ষমাণ), 1 Accepted (গৃহীত), 2 In Progress (চলমান),
3 Completed (সম্পন্ন).

**Demo accounts — `USERS` (plaintext passwords in the source file; DEMO ONLY):**

| Phone | Password | Role | Name | Area |
|---|---|---|---|---|
| `01700000000` | `demo1234` | member | নমুনা সদস্য / Sample Member | উত্তর পাড়া |
| `01700000001` | `helper1234` | helper | মোঃ রফিকুল ইসলাম (নমুনা সহায়ক) / Md. Rafiqul Islam (sample helper) | মধ্য পাড়া |

Both are printed on the login view itself ("ডেমো তথ্য ব্যবহার করুন"). There is **no Super Admin demo
account** in any of the three HTML files.

### 6.6 Other hardcoded values

Brand: "সাতানীপাড়া সমাজ কল্যাণ সংঘ", est. **1999**; tagline "একটি এলাকা, একটি পরিবার"; slogan
"শিক্ষা • ঐক্য • শান্তি • প্রগতি"; ERT **3–5** people; emergency number **999**; office hours "প্রতিদিন
সকাল ৯টা — রাত ৮টা (নমুনা)"; address "সংঘ কার্যালয়, সাতানীপাড়া (নমুনা ঠিকানা)". Home stats: only
1999 and 3–5 are numbers; member/family and expatriate counts are "তথ্য হালনাগাদ হচ্ছে" placeholders.

---

## 7. Simulated-vs-real table

All state lives in `const state={…}` in memory. There is no persistence, no server, no network call of
any kind (0 `fetch(`, 0 XHR, 0 `localStorage`/`sessionStorage`). A page reload resets: login, language
(back to BN), theme (back to light), filters, drafts, submitted requests, notifications, donor consent,
and the announcement-strip dismissal.

| Simulated feature (Direction D) | How it is faked in code | What a real backend must replace it with |
|---|---|---|
| Login `01700000000`/`demo1234` (member) and `01700000001`/`helper1234` (helper) | `USERS` object with plaintext passwords; `setTimeout(…,450)` fake "Checking…"; `state.user` in memory | Real auth: hashed passwords, server session/token, role enforcement server-side; demo accounts deleted; Super Admin password-reset flow (named in scope, absent from D) |
| Registration (`#regForm`) | Validates, toasts, redirects to login; stores nothing; the new "member" cannot log in | Member creation + approval workflow + unique-phone check + member ID; Super Admin creates users per Phase 1 scope (no UI for this exists yet) |
| Expatriate request submission | Random ID `EXP-2026-(1000–9999)` (collision possible — no uniqueness check against existing IDs); `state.requests[id]` in memory; `created:"2026-11-14"` hardcoded for every new request (not today's date) | Persistent requests with server-generated unique IDs, real creation timestamps, assignment, status history, expense lines with receipts |
| Request tracking | `doTrack()` looks up the in-memory object only; only the seeded ID and IDs created in the same page session resolve | Persistent lookup by ID; public tracking with a defined privacy boundary (what a non-logged-in visitor may see) |
| Helper status advance ("পরবর্তী ধাপে নিন →") | `status++` in memory; fills generic note "সহায়ক আপডেট দিয়েছেন (ডেমো)"; no assignment, no actor recorded, no timestamp | Status transitions with actor, timestamp, note, and audit trail; assignment of a helper to a request |
| Helper notification on new request | `pushNotif()` (in-memory list) + `browserNotify()` (real `Notification` only if permission already granted; otherwise a temporary in-app card). The toast text claims helpers were notified: "সহায়কদের কাছে নোটিফিকেশন পাঠানো হয়েছে (ডেমো)" | Server-side event → persistent notifications to Super Admin + all Helpers (browser/push/in-app per Phase 1 scope); delivery receipts |
| Donor consent ("সম্মতি চান") | Requester's own click sets `state.donorConsentAsked[name]=true` and reveals the number instantly; no donor is involved | Donor-side consent action (donor receives the request and grants/revokes); consent records with timestamps; number revealed only after grant |
| Emergency blood request | Shows `#bloodDone`, pushes a notification, toasts; creates no record and notifies no donor | Blood-request record + matching-donor notification + consent flow + request lifecycle |
| Notifications (bell/panel/badge) | In-memory array, starts empty every load; badge count is session-only | Persistent per-user notifications with read/unread state |
| Profile edit | Copies name to the header in memory; toast says "(ডেমো — সংরক্ষিত নয়)" | Persistent profile update (own profile; validation server-side) |
| Contact message | Shows `#contactDone`; message goes nowhere | Contact-message inbox (store, list, reply, status) |
| Finance report download | Generates a `.txt` from the hardcoded `FINANCE` array in the browser; labelled SAMPLE/DEMO | Published audited reports (real files, versioned by year); PDF per the prototype's own note that "ডেমোতে PDF তৈরি হয় না" |
| Directory/donor/activity/news search & filters | Array `.filter()` in the browser over hardcoded data; directory adds a fake 260 ms skeleton delay | Server-side search/filter/pagination over real records |
| Language/theme persistence | Session-only by construction (no storage at all); `initTheme()` forces light on every load | Persisted user/site preferences (or an explicit decision to keep session-only) |
| Lightbox / accordions / tabs / toasts | Fully client-side, real interaction code (not fake) — but operating on demo content only | Same interactions fed by real media/content APIs |
| "No service charge / 999 / ERT 3–5" policy copy | Inline HTML text in several places | Policy content managed as site content (single source, not re-typed per view) |

Features simulated in the **alternatives but differing from D**: editorial/v1 have a simulated submit
spinner on the expatriate form (D has none); v1/editorial have a forgot-password *note* ("Super Admin
resets it", no flow); v1 dashboard includes expatriate profile + family info and 3 pre-seeded demo
notifications (D starts with zero notifications and has no expatriate/family profile sections).

---

## 8. Incomplete items (incl. QA defects D1–D11)

Evidence from `index.html` and the repo's own QA reports (`docs/direction-d/QA_REPORT.md` defects
D1–D11, `REVERIFY_REPORT.md`, `FUNCTIONAL_TEST_REPORT.md` §4 "Not tested").

1. **Video gallery — placeholder only** (§4 #25): tab exists, shows "ভিডিও গ্যালারি শীঘ্রই আসছে". No
   video data, player, or embed anywhere.
2. **Project accounts — absent in Direction D** (§4 #28): exists only in the editorial alternative's
   `LEDGER`. Finance has year ledger + annual reports only.
3. **Community infrastructure — absent** (§4 #6): no listing, no map, no facilities data.
4. **Super Admin — entirely absent:** no login, no dashboard, no user creation, no password reset, no
   content/finance/member management UI in any of the three HTML files, despite the standing scope
   assigning Super Admin user creation and password resets.
5. **Forgot password — absent in D:** 0 matches for "forgot" in `index.html`. (v1/editorial have only a
   note that Super Admin resets it; no flow.)
6. **Registration creates no account** (§4 #30): the registrant cannot log in afterwards; `#rDonor`
   opt-in adds no donor.
7. **Activity category filter has no data behind it:** the `#/activities` UI offers year + category
   filters, but `ACTIVITIES` objects carry no category field, so category filtering cannot work as
   labelled. (Editorial/v1 store `c`/`cat` per activity; D dropped it.)
8. **Profile: country/family have no source:** `fillProfile()` pre-fills name/phone/area only;
   `#pCountry`/`#pFamily` are blank with no stored value to load; save is in-memory only.
9. **Member dashboard "My Requests" always includes the seeded demo request** for every member
   (`renderMyRequests()` appends `EXP-2026-1052` unconditionally; `renderDashboard()` does the same) —
   a member with no requests still sees one request.
10. **Random Request IDs can collide:** `"EXP-2026-" + (1000 + Math.floor(Math.random()*9000))` with no
    check against existing IDs; `created` is hardcoded `"2026-11-14"` for every new request.
11. **QA defects D1–D11 (`docs/direction-d/QA_REPORT.md` §5):**

    | ID | Defect | Status per repo |
    |---|---|---|
    | D1 | Announcement strip 44px forest-bg, no dismiss (spec 36px ivory) | Fixed per `REVERIFY_REPORT.md` |
    | D2 | Success pane had 0 timeline nodes | Fixed per `REVERIFY_REPORT.md` |
    | D3 | Submit-with-empty-draft threw 1 uncaught `TypeError` (`SVC[undefined]['bn']`) and created a corrupt request `EXP-2026-7364` with no `service` key, which then broke dashboard/tracking renders | Fixed by the submit guard per `REVERIFY_REPORT.md` — the guard is present in the repo file |
    | D4 | Hero has no live-data right column (spec: next event + open request count) | Open — frontend gap; backend must supply the live data (next event, open request count) for the rebuilt hero |
    | D5 | Decorative numbering 01–09 / 01–06 against the rationale ban | Open — frontend/design decision, not a backend change |
    | D6 | Mobile menu is a right drawer, not the spec'd bottom sheet | Open — frontend/design decision |
    | D7 | BN/EN toggle in the strip, no CTA pill in nav | Open — frontend/design decision |
    | D8 | Dead gold CSS rule on `.foot-slogan` (line ~346 overridden by line ~347) | Open — frontend CSS cleanup |
    | D9 | Annual-report title wraps awkwardly with the `.txt` pill mid-flow | Open — frontend/layout |
    | D10 | Single-node (1999) timeline | Intentional, not a defect |
    | D11 | **Wizard is 3 panes + success vs `DESIGN_SYSTEM.md` §7.1 describing 4 steps — doc/build mismatch to confirm** | **Open — unresolved. See document 13, Q-01. Do not resolve by guessing.** |

12. **Lightbox Escape handling:** QA R9 records Esc closing the lightbox as PASS in the probe; in the
    repo file the extracted `keydown` handler covers ArrowLeft/ArrowRight while open — the Esc path is
    not visible in the extracted handler text, so a backend re-implementation should not assume Esc
    handling from code reading alone (treat as probe-verified, code-unconfirmed in this audit).
13. **No real contact details:** contact page states no real phone/email exists in the demo; no map
    (0 `<iframe>`).
14. **No payment/dues flow:** "চাঁদা" (subscription) appears only as a finance income line; there is no
    dues payment, no member-fee collection, no receipt.
15. **Unverified per the repo's own QA** (`QA_REPORT.md` §6 + `FUNCTIONAL_TEST_REPORT.md` §4 +
    `ASSUMPTIONS.md`): real-device phone check (tap gestures, true 360px rendering); Safari/Firefox/
    Android font rendering (Chromium-on-Linux only); full-page dark-mode screenshot (viewport only);
    home segments y≈4600–9587 not eyeballed; reduced-motion/keyboard/screen-reader pass; Browser
    Notification permission flow (not grantable in headless); strip-dismiss persistence across reloads
    (no persistence exists to test); EN checked only for homepage hero + `lang` attribute, not
    end-to-end. The editorial redesign additionally notes: dark-mode pixel check not separately
    captured; Google Fonts could not load in the audit sandbox (fallback fonts in captures).
16. **Editorial/v1-only gaps carried in their docs:** v1 probe never drove the full expatriate form-fill
    sequence or lightbox arrow keys end-to-end (later closed in the editorial probe); editorial
    dark-mode screenshot not taken; both alternatives are session-only (no `localStorage` per platform
    rules, noted as a known deviation in `redesign/ASSUMPTIONS.md` #6).

---

## 9. Gaps — what the prototype does NOT cover that the future platform will need

These are items with **no counterpart at all** in `index.html` (and, where noted, nowhere in the repo).
They are gaps relative to the prototype's own scope statements and the task's feature list — not new
feature proposals.

1. **Any backend at all:** no API, no database, no auth server, no file storage, no email/SMS, no
   payment. The repo contains zero server-side files.
2. **Admin panel:** Super Admin dashboard, user creation/management, member approval, content management
   (news/notices/events/jobs/activities/FAQ), finance entry, report upload, donor/member moderation —
   none exists in any prototype. The separate hosted artifact `satanipara-community-dashboard` (9-module
   admin demo) is referenced in `docs/v1/PROJECT_AUDIT.md` §4 but is **not in this repo**.
3. **Real data onboarding:** real member/family/expatriate counts (currently "তথ্য হালনাগাদ হচ্ছে"),
   real committee/advisory/former-leader lists, real donor registry with consent, real finance records
   and audited reports, real photos with consent, real constitution text (prototype is a 5-article
   sample summary), year-by-year history beyond 1999.
4. **Identity & access:** password hashing, sessions, password reset (Super Admin), account
   lockout/rate limiting, role enforcement server-side (helper vs member vs Super Admin), audit logging.
   The prototype's auth guard is client-side only.
5. **Notifications infrastructure:** persistent, per-user, event-driven notifications (new request →
   Super Admin + Helpers via browser notification is a standing Phase 1 requirement with only a
   simulated toast in the prototype).
6. **Donor consent as a donor-side action:** the prototype's consent is a button the *requester* clicks.
   A real flow needs donor accounts/notifications and grant/revoke records.
7. **Blood-request lifecycle:** matching, donor notification, fulfilment status, history — the prototype
   only shows a confirmation panel.
8. **Expatriate-request operations:** helper assignment, status history with actor + timestamp, expense
   lines with receipts/photos, proof-of-delivery (the Home §05 copy promises "ছবিসহ আপডেট" — photo
   updates — which no prototype implements).
9. **Finance operations:** dated transactions, payees, categories, receipts, approvals, monthly
   reporting, project accounts (absent in D), audited PDF reports.
10. **Media management:** photo/video upload, albums, consent flags, captions — the prototype has only
    embedded base64 demo images (21 in D) with no upload path. Video is a placeholder.
11. **Content workflows:** draft/review/publish, expiry for notices, verification flag for job
    circulars, scheduling for events — all prototype content is published unconditionally.
12. **Infrastructure/places:** no map, no facility records, no location data.
13. **Membership operations:** member IDs, approval, dues/subscription handling, voting rights
    (mentioned in membership copy: "ভোটাধিকারসহ সব সুবিধা" — no voting feature exists), expatriate
    profile + family info (present in v1, dropped in D).
14. **Data rights & privacy operations:** consent records, access/correction/deletion request handling
    (privacy view promises the right; no flow exists), data export.
15. **Source material not in the repo:** the 78 KB `Satanipara_UIUX_Blueprint_0_cm1i.pdf`, the 19-page
    engineering plan, the role-permissions PDF v2.0, the 31-page design brief, and the quotation draft —
    all referenced as delivered under `~/workspace/your_files/…` but not present in this repository.
    The dashboard demo artifact is likewise outside this repo.
16. **Non-functional items with no prototype counterpart:** backups, hosting/annual-cost decisions,
    support duration, real-device testing, accessibility pass (keyboard/screen-reader/reduced-motion
    beyond the CSS token), Safari/Firefox/Android verification.

---

## 10. Audit trail

- Files inspected: `README.md` (full), `index.html` (programmatic extraction: routes, ids, forms, JS
  constants, functions, error strings, counts), `alternatives/satanipara-editorial-redesign.html` +
  `alternatives/satanipara-v1-prototype.html` (same extraction, compared), all 31 files under
  `docs/direction-d/` (8), `docs/redesign/` (13), `docs/v1/` (10) — headings for all, full text for
  QA/assumptions/progress/sitemap/audit/user-flow reports.
- Counts verified by extraction: 18 Direction D routes/views; 8 forms; 400 `data-i18n` attributes; 21
  embedded images in `index.html`; 0 `fetch(`/`localStorage`/`sessionStorage`; 108 "নমুনা" + 41 "Demo"
  in `index.html`; 37 features audited in §4.
- Finance totals in §6.4 were recomputed from the listed rows (2026: 184,000+256,000−142,000−68,000+
  90,000 = 320,000; 2025: 296,000; 2024: 155,000). Request `EXP-2026-1052` total 850+120 = 970,
  service charge 0, as coded.
- Where this audit could not establish something from the repo (e.g. the Esc key handler text, the exact
  category-filter behaviour), it is flagged in §8 rather than asserted.
- No repo files were modified. The findings file (`~/workspace/satanipara-phase0/audit-findings.md`) is
  the source of this published audit; this document is its condensation.
