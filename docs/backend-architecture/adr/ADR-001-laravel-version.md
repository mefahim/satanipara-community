# ADR-001 — Laravel version (13)

| | |
|---|---|
| Status | **Confirmed** |
| Date | 2026-11-14 |
| Sources | Research Notes §1 (laravel.com/docs/13.x/releases, laravel.com/docs/13.x/upgrade — primary, checked 2026-11-14); Decision Sheet; Engineering Plan v1.1 (which specified Laravel 12 — superseded, see below) |

## Context

The project needs a backend framework for a modular monolith (per Engineering Plan v1.1 §1) serving a public website, an admin panel, and future mobile apps from one API and one database. The Engineering Plan v1.1 specified Laravel 12. The research pass (2026-11-14) established that Laravel 13 was released 17 March 2026 and that Laravel 12's bug-fix window had already ended. Starting a new project on a framework version that is already security-only would mean beginning with a forced upgrade on the horizon. The decision is which Laravel major to build on. Constraint to use: `laravel/framework ^13.0`. No patch version is quoted anywhere in this blueprint — the exact patch is resolved from Packagist at scaffold time.

## Options considered

1. **Laravel 13** (released 17 Mar 2026; PHP 8.3–8.5; bug fixes to Q3 2027; security fixes to 17 Mar 2028).
2. **Laravel 12** (released 24 Feb 2025; bug fixes ended 13 Aug 2026; security fixes until 24 Feb 2027). The version Engineering Plan v1.1 specified.
3. **Laravel 11** (security fixes ended 12 Mar 2026) — considered only to reject it; it is out of security support.
4. **A non-Laravel PHP framework, or a framework in another language.** Considered and rejected: the team's ecosystem, the Filament/Sanctum/Spatie integrations, and the existing engineering plan all assume Laravel; there is no evidence that another stack would serve this small community platform better, and switching would discard the plan's architecture.

## Advantages

- **Full support runway:** 18 months of bug fixes and 2 years of security fixes from release (Laravel's published policy). A new project starts with the longest available runway instead of inheriting a countdown.
- **Laravel 12 is already security-only:** choosing 12 would leave ~3 months of security support at the time of writing, with a major upgrade forced almost immediately.
- **First-party features useful to this project:** JSON:API resources, native vector search (PostgreSQL + pgvector), queue routing by class, `#[Authorize]`/`#[Middleware]` attributes, and the Laravel AI SDK — none of which is required on day one, but all of which are available without a framework change.
- **Ecosystem alignment:** Sanctum 4.x, Filament 5.x, and Spatie Permission v8 all declare Laravel 13 compatibility (Research Notes §§3–5), so the rest of the stack aligns on this major.
- **Cheap upgrade path if it were ever needed:** the Laravel 13 upgrade guide estimates ~10 minutes for a typical 12.x → 13.0 app — but starting on 13 avoids the upgrade entirely.

## Disadvantages

- **Newest major, shortest track record at the time of writing:** Laravel 13 was ~8 months old when checked. Minor issues in a new major are possible; the mitigation is the scaffold-time version check and the CI suite (Doc 10).
- **Patch versions move weekly:** no patch number can be quoted in the blueprint; the team must resolve it at scaffold time (Research Notes §9 item 1).
- **No LTS:** Laravel has no LTS major. Every major gets 18 months of bug fixes and 2 years of security fixes, so the project must plan a major upgrade roughly every two years. This is a property of the framework, not of this choice — Laravel 12 has the same policy with less runway left.

## Security implications

- Security fixes until 17 Mar 2028 (primary source). Starting on 12 would have meant security-only support ending 24 Feb 2027.
- Laravel 13 hardens defaults relevant to this project: CSRF middleware renamed `PreventRequestForgery` with origin-aware verification via `Sec-Fetch-Site`; cache defaults include `serializable_classes => false` (hardens against PHP deserialisation gadget chains if `APP_KEY` leaks); session serialisation defaults to JSON.
- No security disadvantage relative to Laravel 12: 13 is a superset for the features this project uses.

## Scalability implications

- None material at this scale. Laravel 13's queue routing by class and vector search are options for later growth, not requirements now. The framework is not the scaling bottleneck for a community platform of a few thousand users; the database and the hosting size are (see ADR-003, ADR-012).

## Maintenance implications

- A major-version upgrade will be needed when Laravel 14 (or the next major) becomes the supported path — roughly every 12–24 months under Laravel's annual release cadence. The upgrade is a planned maintenance task, recorded in the roadmap, not an emergency.
- Dependency constraints (`^13.0`) allow minor/patch updates without breaking changes (Laravel's policy: minor/patch releases must never contain breaking changes).

## Final recommendation

**Build on Laravel 13** (`laravel/framework ^13.0`), resolving the exact patch from Packagist at scaffold time.

## Reason for selection

Engineering Plan v1.1's Laravel 12 is superseded because its bug-fix window had already closed when the research was checked (13 Aug 2026), leaving only security fixes until 24 Feb 2027. Starting a new project on a security-only framework would force a major upgrade within months of launch. Laravel 13 gives the full support runway, aligns with the rest of the confirmed stack, and costs nothing extra. The divergence from the plan is explicit and reasoned, per the Decision Sheet.
