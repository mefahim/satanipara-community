# Design Skills — Installation Report (Phase 1)

**Project:** Satanipara Community website redesign
**Project directory:** `~/workspace/satanipara-community-website/redesign/`
**Date:** 2026-11-14 (Asia/Dhaka)
**Outcome: 4 of 4 skills installed and verified. Nothing failed to install.**

## 1. Environment

| Item | Value |
|---|---|
| Node | `v24.22.1` (expected v24.22.1 — matches) |
| npm | `10.9.4` |
| npx | `10.9.4` |
| Python | `Python 3.12.3` |
| Skills CLI | `skills` v1.8.1 (via `npx skills`) |
| Agent environment | **Muse, NOT Antigravity.** The directive's `-a antigravity` flag does not apply here. |
| Pre-existing skills | None — `npx skills list` (project) and `npx skills list -g` (global) both returned empty (`[]`) before installation. |

### Agent detection finding

`npx skills --help` shows `-a, --agent <agents>` ("Specify agents to install to (use `'*'` for all agents)") with default "last selected, else detected". There is **no `muse` agent** in the CLI's agent list, and no agent was detected in this environment. The first install was therefore attempted **with `-a` omitted entirely** — and it worked: the CLI installed to "all agents" (universal listing: Amp, Antigravity, Antigravity CLI, Cline, Codex +19 more) and symlinked the skill into the two agent directories that exist in this project (`.claude/skills/` → Claude Code, and Eve). The other ~50 agents were "skipped (project directory not found)" — that is expected, not a failure: those agent directories simply do not exist in this project. **No `-a` flag was needed for any of the four installs, and `-a '*'` was never required.** All four installs used the identical command shape (only `--skill` / repo changed).

Canonical install location for every skill: `.agents/skills/<skill>/` (real files). `.claude/skills/<skill>` are symlinks to the same directories. `agent/skills/<skill>/` directories also exist (created by the CLI's universal install).

Reproducibility: every install is recorded in `skills-lock.json` (version 2, with per-skill `source`, `sourceType: github`, `skillPath`, `computedHash`). A fresh checkout can be restored with `npx skills experimental_install`.

## 2. Source inspection (before installing)

All three source repos were inspected first (GitHub page via `browser.open`, `git ls-remote`, and read-only `curl` fetches of raw `SKILL.md` / `LICENSE` files). No untrusted script was executed; no credentials were involved (all repos public).

| Repo | Default branch HEAD (at inspection) | Stars | Notes |
|---|---|---|---|
| `anthropics/skills` | `2c5958e` (main), 62 commits | 194,267 | 20 skills found by CLI `--list`, incl. `frontend-design` and `webapp-testing` |
| `nextlevelbuilder/ui-ux-pro-max-skill` | `6ae86f6` (main), 296 commits | 149,220 | 7 skills found by CLI `--list`, incl. `ui-ux-pro-max`; skill lives at `.claude/skills/ui-ux-pro-max/SKILL.md` (the `src/ui-ux-pro-max/SKILL.md` path 404s) |
| `vercel-labs/agent-skills` | `1a2c79d` (main), 280 commits | 34,037 | 9 skills found by CLI `--list`, incl. `web-design-guidelines` |

Upstream `SKILL.md` sizes (raw fetch, `main` branch): `frontend-design` 9,390 bytes / 71 lines; `webapp-testing` 3,913 bytes / 95 lines; `web-design-guidelines` 1,231 bytes / 39 lines; `ui-ux-pro-max` 16,646 bytes / 217 lines.

## 3. Commands run (verbatim) and outcomes

Working directory for all commands: `~/workspace/satanipara-community-website/redesign/`

```bash
# Pre-checks
node --version            # v24.22.1
npm --version             # 10.9.4
python3 --version         # Python 3.12.3
npx skills --help         # skills 1.8.1 usage (see §1)
npx skills list           # "No project skills found."
npx skills list -g        # "No global skills found."
npx skills list --json    # []

# Catalogue checks (read-only, before installing)
npx skills add anthropics/skills --list
# -> "Found 20 skills", includes frontend-design, webapp-testing
npx skills add nextlevelbuilder/ui-ux-pro-max-skill --list
# -> "Found 7 skills", includes ui-ux-pro-max
npx skills add vercel-labs/agent-skills --list
# -> "Found 9 skills", includes web-design-guidelines
```

Installs — one at a time, each verified before the next (all exit 0, all with `-a` omitted):

```bash
npx skills add anthropics/skills --skill frontend-design -y
# -> "Installed 1 skill", "Installation complete", Done!
#    Security: Gen Safe, Socket 0 alerts, Snyk Low Risk

npx skills add anthropics/skills --skill webapp-testing -y
# -> "Installed 1 skill", "Installation complete", Done!
#    Security: Gen Safe, Socket 1 alert, Snyk Med Risk (see §5 note)

npx skills add nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max -y
# -> "Installed 1 skill", "Installation complete", Done!
#    Security: Gen Safe, Socket 0 alerts, Snyk Low Risk

npx skills add vercel-labs/agent-skills --skill web-design-guidelines -y
# -> "Installed 1 skill", "Installation complete", Done!
#    Security: Gen Safe, Socket 0 alerts, Snyk Low Risk
```

Note: `npx skills add <repo> --list --json` does **not** emit JSON (it prints the human list; `--json` on `add` requires `--yes` and the list path ignores it) — the plain `--list` output was used for catalogue checks instead. This cost one retry and is a CLI quirk, not an install problem.

## 4. Verification

Final `npx skills list` (project scope):

```
Project Skills

frontend-design       ~/workspace/satanipara-community-website/redesign/.agents/skills/frontend-design
  Agents: Claude Code, Eve  Source: anthropics/skills
ui-ux-pro-max         ~/workspace/satanipara-community-website/redesign/.agents/skills/ui-ux-pro-max
  Agents: Claude Code, Eve  Source: nextlevelbuilder/ui-ux-pro-max-skill
web-design-guidelines ~/workspace/satanipara-community-website/redesign/.agents/skills/web-design-guidelines
  Agents: Claude Code, Eve  Source: vercel-labs/agent-skills
webapp-testing        ~/workspace/satanipara-community-website/redesign/.agents/skills/webapp-testing
  Agents: Claude Code, Eve  Source: anthropics/skills
```

`npx skills list --json` confirms the same 4 entries, all `"scope": "project"`, `"status": "tracked"`, `sourceType: github`.

Each installed `SKILL.md` was diffed against the upstream `main`-branch copy fetched before installation: **all four are byte-identical** (`diff` produced no output).

### 4.1 frontend-design — ✅ VERIFIED INSTALLED

- **Source:** `anthropics/skills`, `skills/frontend-design/SKILL.md`
- **Installed path:** `.agents/skills/frontend-design/SKILL.md` (+ `LICENSE.txt`); symlink `.claude/skills/frontend-design`
- **License:** Apache License 2.0 — per-skill `LICENSE.txt` (9,390-byte SKILL.md; frontmatter: `license: Complete terms in LICENSE.txt`). Note: the repo has **no root `LICENSE` file** (GitHub license API also returns 404); the README states "Many skills in this repo are open source (Apache 2.0)". The per-skill Apache 2.0 text is what governs this skill.
- **Key rules (from SKILL.md):**
  - Act as a design-studio lead: every client gets a **distinct visual identity**, never a templated default; make deliberate, opinionated palette/type/layout choices and take aesthetic risk if justified.
  - **Ground the design in the subject matter** — industry, materials, vernacular of the real brief (here: a Bangladeshi community organisation, est. 1999, Forest Green + Gold + Ivory, bilingual BN/EN). If the brief lacks a subject, propose one and confirm.
  - Hero first: open with the most characteristic thing in the subject's world. Typography carries the personality — 1–2 families, clearly distinct if two; type scale per *The Elements of Typographic Style*; line lengths < 80 chars.
  - Avoid the recognised "generated page" tells: single-word accent in headlines, ALL-CAPS labels, numbered `01/02/03` markers unless the content is a real sequence, cream `#F4F1EA` + serif + terracotta default, near-black + acid accent, broadsheet hairlines, identical SaaS cards, tracked-out eyebrow + `A · B · C` meta strings, `→` on links.
  - **Two passes:** (1) brainstorm a compact token system (4–6 named hex colours, typefaces + roles, layout concept with ASCII wireframes, principles); review the plan against the brief and revise anything that reads like a generic default; (2) only then write code. Watch CSS selector specificity (type vs element selectors cancelling each other, e.g. `.section` vs `.cta` padding/margin).
  - Restraint: spend boldness in **one place**; one orchestrated motion moment max (no fade-slide-up on every section); responsive, visible keyboard focus, reduced-motion respected, accessible palettes; self-critique with screenshots where possible.

### 4.2 webapp-testing — ✅ VERIFIED INSTALLED

- **Source:** `anthropics/skills`, `skills/webapp-testing/SKILL.md`
- **Installed path:** `.agents/skills/webapp-testing/SKILL.md` (+ `LICENSE.txt`, `scripts/with_server.py`, `examples/{console_logging,element_discovery,static_html_automation}.py`); symlink `.claude/skills/webapp-testing`
- **License:** Apache License 2.0 — per-skill `LICENSE.txt` (same root-LICENSE caveat as frontend-design).
- **Key rules (from SKILL.md):**
  - Test local web apps with **native Python Playwright scripts** (`sync_playwright()`, headless Chromium, always `browser.close()`).
  - **Run helper scripts with `--help` first; use them as black boxes** — do not read their (large) source unless a custom solution is truly needed.
  - Decision tree: static HTML → read the file for selectors directly; dynamic app → if no server running, use `scripts/with_server.py` (supports multiple servers, e.g. `python scripts/with_server.py --server "npm run dev" --port 5173 -- python your_automation.py`); if a server is running, **reconnaissance-then-action**: `networkidle` → screenshot/DOM inspect → identify selectors → act.
  - **Common pitfall: never inspect the DOM before `page.wait_for_load_state('networkidle')` on dynamic apps.**
  - Descriptive selectors (`text=`, `role=`, CSS, IDs); explicit waits (`wait_for_selector` / `wait_for_timeout`).
- **⚠️ Runtime dependency NOT yet installed (see §5):** Python `playwright` package is missing (`ModuleNotFoundError: No module named 'playwright'`, not in `pip list`). Playwright browser binaries **are** already cached (`~/.cache/ms-playwright`: `chromium-1248`, `chromium_headless_shell-1248`, `ffmpeg-1013`), so `pip install playwright` should be enough and `playwright install` is probably unnecessary. Do this before the first test run.

### 4.3 ui-ux-pro-max — ✅ VERIFIED INSTALLED

- **Source:** `nextlevelbuilder/ui-ux-pro-max-skill`, `.claude/skills/ui-ux-pro-max/SKILL.md`
- **Installed path:** `.agents/skills/ui-ux-pro-max/` — `SKILL.md`, `references/{quick-reference.md, pro-rules.md}`, `scripts/{search.py, core.py, design_system.py, reasoning_contract.py, validate_data.py, tests/}`, `data/` (14 CSVs + JSONs, 3,063 data lines total); symlink `.claude/skills/ui-ux-pro-max`
- **License:** **MIT** — repo-root `LICENSE` (`Copyright (c) 2024 Next Level Builder`). Note: there is **no per-skill `LICENSE.txt`** inside the skill directory (the `LICENSE.txt` path 404s upstream); the repo-level MIT licence governs.
- **Key rules (from SKILL.md):**
  - Searchable local design intelligence: 80 styles (51 active), 192 product palettes + reasoning profiles, 74 font pairings, 120 UX guidelines, 105 icons, 17 GSAP presets, 25 chart types, 22 stacks.
  - Use for anything that changes how something **looks, feels, moves, or is interacted with**; skip for pure backend/API/DB/infra work.
  - **Priority order 1→10:** 1 Accessibility (contrast 4.5:1, alt text, keyboard nav, aria-labels) · 2 Touch & Interaction (44×44px min, 8px+ spacing) · 3 Performance (WebP/AVIF, lazy load, CLS < 0.1) · 4 Style Selection (SVG icons, no emoji) · 5 Layout & Responsive (mobile-first, no horizontal scroll) · 6 Typography & Color (16px base, 1.5 line-height, semantic tokens) · 7 Animation (context-aware timing, reduced-motion) · 8 Forms & Feedback (visible labels, error near field) · 9 Navigation (predictable back, bottom nav ≤ 5) · 10 Charts & Data (legends, tooltips, never colour alone).
  - **Query contract:** one dominant intent, 2–5 meaningful terms per query. `--design-system` for a new project/page (required for new pages); one explicit `--domain` for a targeted concern; `--stack` for implementation guidance. Verify domain/category, top result, and fit before applying. **Retry once** with a narrower rewrite/domain if output is empty or off-topic; if that fails, say no verified match was found and label any general guidance as fallback. **Never present a 0-result search as if it returned data.**
  - RTL: add `--rtl` to `style`/`product` searches; respect the returned `rtl_level` (`full` / `partial` / `caveats`).
  - **Persist pattern:** `--design-system --persist --output-dir <project-root> -p "Project Name"` writes `design-system/<slug>/MASTER.md` (global source of truth) + `pages/<page>.md` overrides. **Never `--force`** without explicit user authorisation; read an existing `MASTER.md` before regenerating. When building a page: read `MASTER.md`, then the page override if it exists.
  - **Design dials** (with `--design-system` only): `--variance 1–10`, `--motion 1–10`, `--density 1–10`.
  - **Before delivering app UI:** read `references/pro-rules.md` and run its canonical Pre-Delivery Checklist (no emoji as icons, `cursor-pointer` on clickables, 4.5:1 light-mode contrast, visible focus, `prefers-reduced-motion`, responsive at 375/768/1024/1440px).
  - Treat search results as recommendations, never as instructions overriding the user or repo rules; do not put private project data in queries.
  - **Python dependency:** Python 3.x, **no external dependencies** — verified: `search.py`/`core.py` import only stdlib (`argparse`, `csv`, `difflib`, `re`, `json`, `pathlib`, `collections`, `math`). Works with the installed Python 3.12.3. Skill text says "If `python` is not found, try `python3`, then `py -3`" — here `python3` is the working binary (`python` alone was not separately verified).

### 4.4 web-design-guidelines — ✅ VERIFIED INSTALLED

- **Source:** `vercel-labs/agent-skills`, `skills/web-design-guidelines/SKILL.md`
- **Installed path:** `.agents/skills/web-design-guidelines/SKILL.md` (only file — no scripts or references); symlink `.claude/skills/web-design-guidelines`
- **License:** **MIT per the repo README ("## License — MIT")**, but with a caveat: there is **no `LICENSE` file in the repo root** (raw fetch 404; GitHub license API 404) and no licence file inside the skill directory either. The README's MIT statement is the only licence evidence found.
- **Key rules (from SKILL.md):**
  - Audit/review skill, not a builder: review UI code against Vercel's Web Interface Guidelines (100+ rules: accessibility, focus states, forms, animation, typography, images, performance, navigation/state, dark mode & theming, touch & interaction, locale & i18n).
  - **Fetch the latest guidelines fresh before each review** from `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md` — the skill itself contains no rules, only the fetch-and-apply workflow.
  - Read the specified files (or ask the user for files/pattern), check against all fetched rules, output findings in the terse `file:line` format specified by the fetched guidelines.
  - Triggers: "review my UI", "check accessibility", "audit design", "review UX", "check my site against best practices".

## 5. ui-ux-pro-max search-script tests — ✅ WORKS

Script: `.agents/skills/ui-ux-pro-max/scripts/search.py`, run with `python3` (stdlib only, no deps). `--help` verified first — domains: `style, color, chart, landing, product, ux, typography, icons, gsap, react, web, google-fonts`; stacks include `nextjs, react, html-tailwind, laravel, flutter` etc.; flags `--design-system, --persist, --page, --output-dir, --force, --variance/--motion/--density 1–10, --json, --full, --max-results 1–20, --rtl`.

| # | Command | Result |
|---|---|---|
| Q1 | `python3 …/scripts/search.py "editorial Bengali typography" --domain typography` | ✅ 3 results from `typography.csv`: ① "Bold Typography Mobile (Inter Poster)" — Inter + Playfair Display italic + JetBrains Mono, editorial/poster keywords; ② "News Editorial" — Newsreader + Roboto; ③ "Magazine Style" — Libre Bodoni + Public Sans. **Caveat:** matched on "editorial" only — **no Bengali font appears in the typography domain**; all three pairings are Latin-only. Do not use these pairings for Bengali text without a Bengali companion font. |
| Q2 | `python3 …/scripts/search.py "community nonprofit platform warm trustworthy" --design-system -p "Satanipara Community"` | ✅ Full design system generated (exit 0): Pattern "Hero + Features + CTA" (hero, value prop, 3–5 features, CTA, footer; sticky + bottom CTA); Style "Minimalism & Swiss Style"; colours blue `#2563EB` / cyan `#0891B2` / amber CTA `#D97706` on `#F8FAFC`; typography Outfit / Work Sans; plus key effects, anti-patterns and pre-delivery checklist. **Caveat: this is a generic recommendation — it does NOT know the project's Forest Green + Gold + Ivory brand.** The generated palette must be overridden with the real brand tokens before use; treat Q2 output as structure/pattern input, not as final colours. |
| Q3 | `python3 …/scripts/search.py "nonprofit homepage layout" --domain landing` | ⚠️ **0 results** ("No matches… Retry with broader/different keywords"). Per the skill's own contract this was retried once (see Q3-retry), not presented as data. |
| Q3-retry | `python3 …/scripts/search.py "community landing page" --domain landing` | ✅ 3 results from `landing.csv`: ① **"Community/Forum Landing"** (`community-forum-landing`) — Hero (community value prop) > Popular topics/categories > Active members showcase > Join CTA; warm/welcoming colour strategy, member photos, topic badges in brand colours, show member/activity counts only when current/verified/dated; ② "Pricing Page + CTA"; ③ "AI Personalization Landing". Result ① is directly applicable to the Satanipara home page structure. |
| Q4 (extra) | `python3 …/scripts/search.py "Bengali" --domain google-fonts --max-results 5` | ✅ 5 results from `google-fonts.csv` (10 Bengali rows exist in the DB): ① Noto Serif Bengali (variable 100–900, bengali/latin/latin-ext), ② Noto Sans Bengali (variable 100–900), ③ Atma, ④ Mina, (+ 5th cut off in capture). Corrects the Q1 caveat: Bengali fonts **are** in the local database, but only reachable via `--domain google-fonts`, not via `--domain typography`. For this bilingual site, query `google-fonts` explicitly for Bengali pairings (candidates: Noto Serif Bengali for display, Noto Sans Bengali / Hind Siliguri / Anek Bangla for UI/body — also present in the CSV). |

**Search-script verdict:** works end-to-end on real project queries (exit 0 every run). Two honest limits found: (a) the `landing` domain has no "nonprofit" row — wording matters, retry with "community"; (b) generated design systems are generic and must be brand-overridden (Forest Green + Gold + Ivory), and typography-domain results ignore Bengali script — use the `google-fonts` domain for Bengali fonts.

## 6. What could NOT be installed — and why

**Nothing. All 4 skills installed and verified.**

Items that are *not* install failures but must be recorded:

1. **`-a antigravity` does not apply in Muse.** The CLI has no `muse` agent target; omitting `-a` installed cleanly to all agents (universal + Claude Code/Eve symlinks). If a future run targets Antigravity specifically, `-a antigravity` is a valid CLI value — it was simply unnecessary here.
2. **webapp-testing's runtime dependency is missing:** Python `playwright` is not installed in this VM (`ModuleNotFoundError`). The skill itself is installed and verified; its scripts cannot run until `pip install playwright` is done (browser binaries are already cached, so `playwright install` is likely unnecessary). This is a setup step for first use, not an install failure.
3. **Licence-file gaps (documentation, not blockers):** anthropics/skills has no repo-root `LICENSE` (per-skill Apache 2.0 `LICENSE.txt` files exist and were verified); vercel-labs/agent-skills states MIT in its README but ships no `LICENSE` file anywhere (root or skill dir); ui-ux-pro-max ships MIT only at repo root, no per-skill licence file. All three are permissive licences; no action needed, but the gaps are recorded here rather than assumed away.
4. **webapp-testing Snyk "Med Risk / 1 alert"** in the CLI's security assessment (vs Low Risk for the other three). The CLI links details to `https://skills.sh/anthropics/skills`; the alert was not investigated further — worth a glance before running its Playwright scripts in a sensitive context, but it did not block installation.
5. **CLI quirk:** `add --list --json` does not produce JSON (see §3). Cosmetic only.

## 7. How each verified skill should be invoked during the redesign

Read the installed `SKILL.md` at the path given before each use (Muse loads skills by name/description match; the paths below are the project copies).

| Phase / task | Skill | How to invoke |
|---|---|---|
| Visual direction, art direction, distinctive identity for the new site (hero, palette, type, layout) — **first**, before building | `frontend-design` (`.agents/skills/frontend-design/SKILL.md`) | Follow its two-pass process: draft the token system (4–6 named hex colours from the real brand — Forest Green + Gold + Ivory — typefaces + roles, layout ASCII wireframes, principles), review the plan against the brief, revise anything generic, then build. Keep the subject matter (community org, est. 1999, BN/EN, all ages) as the source of visual choices. |
| Coherent product-wide system: pattern + style + palette + typography + effects + anti-patterns; per-page overrides | `ui-ux-pro-max` (`.agents/skills/ui-ux-pro-max/SKILL.md`) | `python3 .agents/skills/ui-ux-pro-max/scripts/search.py "<product> <industry> <keywords>" --design-system -p "Satanipara Community"`; persist with `--persist --output-dir <project-root>` to create `design-system/satanipara-community/MASTER.md` (+ `pages/<page>.md` overrides). **Then override the generated palette with the real brand tokens** and add Bengali fonts via `--domain google-fonts` queries (e.g. `"Bengali" --domain google-fonts`). Supplement with `--domain ux/style/color/typography/landing/icons` and `--stack nextjs` (or the actual stack) as needed. Before delivery, run `references/pro-rules.md` pre-delivery checklist. |
| Accessibility / UX / best-practice audit of built pages (review pass, not build pass) | `web-design-guidelines` (`.agents/skills/web-design-guidelines/SKILL.md`) | Fetch fresh rules from `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md` before each review, pass the built files/pattern, output findings as `file:line`. Use after each build batch, before visual QA sign-off. |
| Functional testing of the built prototype: flows (expatriate request → Request ID, blood search, login, tracking), console errors, screenshots, responsive checks | `webapp-testing` (`.agents/skills/webapp-testing/SKILL.md`) | First run `pip install playwright` (see §5). Then write Python Playwright scripts per the skill's decision tree; use `scripts/with_server.py --help` to manage the dev server lifecycle. Reconnaissance-then-action: `networkidle` → screenshot/DOM → selectors → actions. Examples in `examples/`. |

Suggested order for the redesign: **ui-ux-pro-max `--design-system`** (structure + system, brand-overridden) → **frontend-design** (distinctive art direction on top of the system) → build → **web-design-guidelines** audit → **webapp-testing** functional pass (after `pip install playwright`).

## 8. Files created by this task

- `~/workspace/satanipara-community-website/redesign/DESIGN_SKILLS_INSTALLATION_REPORT.md` (this file)
- `~/workspace/satanipara-community-website/redesign/skills-lock.json` (created by the Skills CLI; reproducibility record for all 4 skills)
- `~/workspace/satanipara-community-website/redesign/.agents/skills/{frontend-design,webapp-testing,ui-ux-pro-max,web-design-guidelines}/` (installed skills; real files)
- `~/workspace/satanipara-community-website/redesign/.claude/skills/{…}/` (symlinks to the above)
- `~/workspace/satanipara-community-website/redesign/agent/skills/{…}/` (CLI universal-install copies)

Note: `CREATIVE_DIRECTION.md`, `DESIGN_REFERENCE_RESEARCH.md`, `TYPOGRAPHY_RESEARCH.md`, `VISUAL_DIRECTION_COMPARISON.md` also exist in this directory but were **not** created by this task — they appeared during this session from concurrent work by the parent orchestrator/other agents. This task did not read, modify, or rely on them.

## 9. Open items for the parent agent

1. `pip install playwright` before the first webapp-testing run (browser binaries already cached).
2. Decide the Bengali font pairing for the redesign (candidates surfaced by the search DB: Noto Serif Bengali display + Noto Sans Bengali / Hind Siliguri body) — the typography domain alone will not surface Bengali fonts.
3. Brand override: any `--design-system` output must be re-tokenised to Forest Green + Gold + Ivory; the generator's default blue/amber palette is generic.
4. Optional: glance at the webapp-testing Snyk "Med Risk / 1 alert" detail at `https://skills.sh/anthropics/skills` before running its scripts.
