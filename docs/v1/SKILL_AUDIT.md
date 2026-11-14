# SKILL_AUDIT.md — Satanipara Community
Date: 2026-11-14 | Phase 1

## Skills discovered (web/GitHub search, 2026-11-14)
| Skill | Source | Stars (reported) | Licence | Verdict |
|---|---|---|---|---|
| ui-ux-pro-max | nextlevelbuilder/ui-ux-pro-max-skill (GitHub) | ~125–146k | MIT / Apache-2.0 | Useful data library (192 rules, 79 styles, palettes, font pairings, design-system generator). NOT installed — install would run third-party code via `npx skills add`; not verified in this environment, and its guidance is generic, not Bengali/community-specific. Principles applied from its documented approach only. |
| frontend-design (Anthropic) | anthropics/skills (GitHub) | ~188k (whole repo) | Apache-2.0 | Official skill: distinctive, intentional visual design, anti-slop. NOT installed (Claude Code skill format; this environment uses Muse skills). Principles applied: bold decisions, no generic AI aesthetic. |
| taste-skill / design-taste-frontend | Leonxlnx/taste-skill (GitHub) | ~84–111k | MIT | Good-taste guardrails (brief inference, variance/motion/density dials). NOT installed — same unverified-install reason. |
| web-design-guidelines (Vercel) | vercel-labs/agent-skills (GitHub) | ~34k (whole repo) | (repo licence) | Fast UI review checklist. NOT installed; review principles applied manually in QA. |
| uizze / ui-design, anti-ui-slop | uizze/uizze (GitHub) | — | MIT / Apache-2.0 | Real-screen references (800k screens), MCP optional. NOT installed — paid MCP upsell; free skill install unverified here. |
| claude-design-skills (6 skills) | Gustavosilveira23/claude-design-skills (GitHub) | — | — | UX researcher/strategist/visual/design-system/motion/Figma bundle. NOT installed — Claude Code oriented, install via npx/git clone unverified in this env. |
| awesome-claude-ui-armory | ezra-y/awesome-claude-ui-armory (GitHub) | — | MIT | Curated index only (links, no code). Used as discovery source. |
| web_deploy_visual_verification | ~/workspace/custom-skills/web_deploy_visual_verification/SKILL.md | local, trusted | — | **SELECTED & USED.** Existing local skill: rebuild assets, check live DOM, scope CSS, state unverified items. Read in full before QA (Phase 7–8). |
| documents skill | /opt/muse/skills/documents/SKILL.md | system | — | Used for doc deliverables. |

## Selected skills
1. `web_deploy_visual_verification` — installed, used for QA.
2. Principles (not code) from `frontend-design`, `ui-ux-pro-max`, `taste-skill`, `web-design-guidelines` — applied as design judgement, no code installed.

## Installation status
- **Nothing installed from GitHub in this run.** No `npx skills add`, no git clone, no script executed from any discovered repo. Reason: the task forbids unverified GitHub skill installation; the discovered skills are Claude Code/Codex-oriented, their installers were not verified in this environment, and none is Bengali- or community-specific enough to justify the risk. This is a documented limitation, not a gap in the build — the build uses the local verification skill plus the project's own design system (DESIGN_SYSTEM.md).

## Limitations
- No agent skill in this environment specialises in Bengali typography, community platforms, or WCAG auditing; those were covered by targeted web research (DESIGN_RESEARCH.md) and manual QA.
- If Fahim wants, a future step can install `ui-ux-pro-max` or Anthropic `frontend-design` via the supported `custom_connector_setup` workflow after verifying the installer — needs his word first.
