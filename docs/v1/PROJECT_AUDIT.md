# PROJECT_AUDIT.md — Satanipara Community Full Website Prototype
Date: 2026-11-14 | Phase 0

## 1. Environment
- VM: Linux, Muse subagent session; no live-browser control in this session (text fetch/search only; visual QA via artifact builder probe + parent-agent browser check).
- Skills available: web_deploy_visual_verification (custom, read 2026-11-14), documents, image-search, shopping, etc. No pre-installed premium UI/UX design skill; see SKILL_AUDIT.md.
- No backend work in this phase (HTML/CSS/JS prototype only). No VPS deploy, no push, no client send.

## 2. Source specification
- `~/workspace/user/files/Satanipara_UIUX_Blueprint_0_cm1i.pdf` (78 KB) — primary product/UX spec. Note: text extraction from the PDF is partially garbled (Bengali glyphs); key content recovered: vision (digital meeting place for Satanipara people; official presence + databank + service gateway + expatriate link + transparency), design principles (local identity + human story + clear info + easy service + trust), brand colours #173F35 / #102E27 / #C49A4A / #F7F4EA, Bangla-first with equal-care English, 14-section homepage order, expatriate journey, blood-donor privacy, no fabricated statistics (show 'তথ্য হালনাগাদ হচ্ছে' where unverified), WCAG 2.2 AA target, phases 0–8. Ambiguities logged in ASSUMPTIONS.md.
- Master Execution Prompt (parent conversation, 2026-11-14) — 16 sections; superseded in part by standing decisions below.

## 3. Standing decisions that supersede the prompt
- Phase 1 admin roles: ONLY Super Admin + Expatriate Helper (প্রবাসী সহায়ক). NO OTP anywhere; simulated login = mobile number + password; Super Admin resets forgotten passwords. New expatriate requests trigger a simulated browser notification to helpers. Prompt §5I "OTP login interface" is superseded.
- DEMO data only, marked নমুনা/Demo. Never invent real people, phone numbers, statistics, donor info, financial records.

## 4. Existing work — DO NOT OVERWRITE
| Item | Location | Status |
|---|---|---|
| Demo artifact 'satanipara-community' (main demo) | hosted artifact (existing) | Built + verified 2026-11-14; phone-feedback fixes applied; DEMO data |
| Demo artifact 'satanipara-community-dashboard' (admin panel) | hosted artifact (existing) | Built + verified 2026-11-14; 9-module admin, EXP-2026-1052 flow |
| Engineering plan v1.1 (19-page PDF) | `~/workspace/your_files/satanipara-community-engineering-plan/` | Delivered 2026-11-14 |
| Role permissions PDF v2.0 (5 pages) | `~/workspace/your_files/satanipara-community-role-permissions/` | Delivered 2026-11-14; 2-role Phase 1 scope |
| Design Brief PDF (31 pages) | `~/workspace/your_files/satanipara-community-design-brief-ai-agent/` | Delivered 2026-11-14; for ANOTHER AI agent's full-site design |
| Quotation draft v2.0 (MD) | `~/workspace/your_files/satanipara-quotation-draft-2026-11-14.md` | Draft, NOT sent; prices not final |

## 5. New work in this run
- Docs: `~/workspace/satanipara-community-website/docs/` (this file + DESIGN_RESEARCH, SKILL_AUDIT, SITEMAP, USER_FLOWS, UX_ARCHITECTURE, DESIGN_SYSTEM, QA_REPORT, PROJECT_PROGRESS, ASSUMPTIONS).
- New artifact (separate from the two existing demos): 'Satanipara Community — Full Website Prototype', slug `satanipara-community-full-site`, kind web_static.
- No existing file was modified or overwritten in this phase.

## 6. Gaps / risks found in audit
- No verified real community statistics, no real photos of Satanipara, no real committee/donor/financial data — all prototype content must be labelled demo or shown as 'updating'.
- Blueprint PDF text extraction is lossy; design decisions cross-checked against the Master Prompt and the 31-page Design Brief summary in memory.
- Visual QA in this session is limited to the artifact builder's probe; a real phone check by Fahim is still needed (see QA_REPORT.md).
