# Architecture Decision Records (ADRs) — Satanipara Community Phase 0

## Purpose

An ADR records one significant technical decision: what was decided, what else was considered, and why. The record exists so that a future team — or the same team in six months — can understand the reasoning without having to reconstruct it from chat messages, and can revisit the decision when its assumptions change. An ADR is a **record**, not a permission slip: writing an ADR does not authorise building anything. Implementation still needs the phase approval described in Doc 12.

## How to write an ADR

1. Copy the template below into a new file named `ADR-NNN-short-slug.md` (the next free number).
2. Fill in every section. A section that does not apply says so explicitly ("Not applicable — no security impact") rather than being left blank; a blank section reads as an unconsidered one.
3. Set the status honestly (see the vocabulary below). A decision that is recommended but not yet confirmed is **Recommended**, not **Confirmed**.
4. Date the record and name the sources it relies on (research notes, decision sheet, Engineering Plan v1.1 section, or a primary vendor page with the date it was checked).
5. When a decision changes, do **not** rewrite the old ADR in place. Write a new ADR that supersedes it, and update the old ADR's status to **Superseded** with a pointer to the new one. History is preserved; it is not edited.

## Template

```markdown
# ADR-NNN — Title

| | |
|---|---|
| Status | Confirmed / Recommended / Unresolved |
| Date | YYYY-MM-DD |
| Sources | … |

## Context
## Options considered
## Advantages
## Disadvantages
## Security implications
## Scalability implications
## Maintenance implications
## Final recommendation
## Reason for selection
```

## Status vocabulary

| Status | Meaning |
|---|---|
| **Confirmed** | Decided, with the evidence and the authority behind it recorded in the ADR. Implementation may proceed on this basis when its phase starts. |
| **Recommended** | The evidence favours this option, but a confirmation is still outstanding (a hosting decision, a client approval, a scaffold-time version check). It must not be treated as confirmed. |
| **Unresolved** | No recommendation can be made yet; the decision is open and the ADR records what is needed to resolve it. |
| **Superseded** | Replaced by a later ADR (named in the record). Retained for history only. |

## Index

| ADR | Title | Status |
|---|---|---|
| [ADR-001](ADR-001-laravel-version.md) | Laravel version (13) | **Confirmed** |
| [ADR-002](ADR-002-php-version.md) | PHP version (8.4 / 8.5) | **Confirmed** |
| [ADR-003](ADR-003-database.md) | Database (PostgreSQL, with MySQL alternative) | **Recommended** — pending hosting confirmation |
| [ADR-004](ADR-004-authentication.md) | Authentication (Sanctum) | **Confirmed** |
| [ADR-005](ADR-005-rbac-implementation.md) | RBAC implementation (Spatie Permission v8) | **Confirmed** |
| [ADR-006](ADR-006-api-architecture.md) | API architecture (REST /api/v1, API-first) | **Confirmed** |
| [ADR-007](ADR-007-media-storage.md) | Media storage (local first, S3-compatible later) | **Recommended** |
| [ADR-008](ADR-008-queue-driver.md) | Queue driver (database first) | **Recommended** |
| [ADR-009](ADR-009-cache-driver.md) | Cache driver (database first) | **Recommended** |
| [ADR-010](ADR-010-search-strategy.md) | Search strategy (Scout database engine first) | **Recommended** |
| [ADR-011](ADR-011-admin-frontend-strategy.md) | Admin frontend strategy (Filament 5) | **Confirmed** |
| [ADR-012](ADR-012-deployment-architecture.md) | Deployment architecture (single VPS, Docker, GitHub Actions) | **Recommended** — pending hosting/domain confirmation |
| [ADR-013](ADR-013-backup-strategy.md) | Backup strategy (spatie/laravel-backup v10, off-server, restore tests) | **Confirmed** |

## Notes on the statuses

- **Database (ADR-003) is Recommended, not Confirmed.** PostgreSQL is the lean, but the deciding constraint is hosting: PostgreSQL is the better default on a VPS; MySQL/MariaDB is the better choice if shared-hosting portability in Bangladesh becomes a requirement (Research Notes §6). The decision is confirmed when the hosting arrangement is confirmed.
- **Media, queue, cache, and search (ADR-007–ADR-010) are Recommended.** Each is a "start simple, upgrade when justified" decision. The recommendation is firm; the status is Recommended because the upgrade trigger (volume, latency, search quality) is a future measurement, and because the scaffold-time checks in Research Notes §9 have not yet been run.
- **Deployment (ADR-012) is Recommended** pending hosting and domain confirmation. The architecture is not in doubt; the account, the domain, and the server do not exist yet.
- **Everything else is Confirmed** on the evidence in the Research Notes (primary sources checked 2026-11-14) and the Decision Sheet.
- No ADR in this set is **Unresolved**. Open questions that are not architecture decisions (e.g. the public-tracking privacy boundary, the D11 wizard step count) are listed in Doc 07 §17 and Doc 08 §14, not as ADRs.
