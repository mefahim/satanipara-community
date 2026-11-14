# ADR-005 — RBAC implementation (Spatie Permission v8)

| | |
|---|---|
| Status | **Confirmed** |
| Date | 2026-11-14 |
| Sources | Research Notes §5 (spatie.be/docs/laravel-permission/v8/introduction — primary, checked 2026-11-14); Decision Sheet; Engineering Plan v1.1 (Spatie Permission — agreed) |

## Context

The system needs role-based access control. Phase 1 has only two admin roles (`super-admin`, `expatriate-helper`), plus `member` (a registered community user, not an admin role) and `public` (unauthenticated). Other roles (President, General Secretary, Treasurer, etc.) are deferred but may return. Permissions follow the `resource.action` convention (e.g. `members.view`, `expatriate.requests.assign`, `finance.approve`, `donors.view_contact`, `audit_logs.view`). The RBAC implementation must integrate with Laravel's Gate (so Filament's authorisation hooks can consume it) and must scale from 2 roles to more without a rewrite.

## Options considered

1. **Spatie Laravel Permission v8** (`^8.0`, MIT, PHP 8.3+, Laravel 12–13).
2. **Hand-rolled roles/permissions** (a `roles` table, a `permissions` table, and custom Gate definitions). Fully under the team's control.
3. **Filament Shield plugin** (community plugin wiring Spatie roles/permissions into Filament resources/pages/widgets). Considered as an addition, not as the RBAC implementation itself — and its version/maintenance is **not verified** (Research Notes §4), so it must be checked before adopting.
4. **Laravel's built-in Gates/Policies alone** (no package): permissions defined in code rather than in the database.

## Advantages

- **Gate-native:** all permissions are registered on Laravel's Gate, so checks use native `$user->can('...')` and Blade `@can('...')`. Filament's `canAccessPanel()` / `can*()` hooks consume exactly this.
- **Database-driven:** roles and permissions are database rows, so they can be managed without deploys (when the organisation wants a UI for it — not in Phase 1, Doc 09 §3.3).
- **Multiple guards, direct permissions, wildcard permissions** (`articles.*`), teams/multi-tenancy (optional, disabled by default), backed-enum support for role/permission names, and events on role/permission changes (an audit-logging hook).
- **Caching:** permissions/roles cached (default key `spatie.permission.cache`, 24-hour expiry), flushed automatically when permissions/roles change.
- **Proven at scale:** 134M+ installs reported on the Spatie docs page (2026-11-14); MIT licence.
- **Grows with the project:** for Phase 1's two roles the package is far larger than needed — that is the point. When the deferred roles return, the same package serves them without a migration.

## Disadvantages

- **Larger than Phase 1 needs.** Two roles could be implemented with a single column. The cost is a package dependency and a few tables for capability that Phase 1 does not use.
- **No admin UI, no audit log, no approval workflows.** Those are application features built on top (Doc 09 §3.3, Doc 08 §9). Adopting the package does not give the organisation a role-management screen.
- **Cache subtlety:** user-specific role assignments are kept in memory and do not trigger a cache flush; permission changes flush automatically. The implementation must flush the cache on every role/permission change and test that a change takes effect promptly (Doc 08 §8).
- **Filament Shield is unverified.** If the team wants Shield's Filament wiring, its version and maintenance must be checked first; it is not assumed to be available.

## Security implications

- Permissions are enforced in policies/gates on every endpoint (Doc 07 §8.3, Doc 08 §8). The package provides the mechanism; the application provides the rules. A missing permission check is an application bug, not a package bug — the authorisation test matrix (Doc 10 §5) is the control that catches it.
- Fail-closed: if a permission cannot be evaluated, access is denied.
- Direct permissions (assigned to a user, bypassing roles) are available but should be used sparingly and audited — they make the effective permission set harder to reason about.

## Scalability implications

- Permission caching (24-hour default, configurable store — Redis/Memcached recommended at scale) keeps the per-request cost low. At this scale the database cache store is sufficient.
- The teams feature (per-team roles) is available if the organisation ever needs scoped administration; it is disabled by default and is not a Phase 1 requirement.

## Maintenance implications

- A maintained, MIT-licensed package with a clear upgrade path (v8 requires PHP 8.3+ and Laravel 12/13). Upgrades follow the package's releases.
- Role/permission seeders are version-controlled; permission changes in production go through the deployment process (or, when a UI exists, through an audited admin action).

## MySQL 8.4 note (Phase 0.1)

Spatie Permission's migrations run on MySQL 8.4 (InnoDB `DYNAMIC` row format is the MySQL 8.4 default). If error 1071 ("Specified key was too long") appears at scaffold time, apply the vendor-documented fix and record it; the scaffold-time assertion is that the Spatie migration runs cleanly (Doc 15, CK-27).

## Final recommendation

**Spatie Laravel Permission v8 (`^8.0`).** Roles and permissions in the database, enforced through Laravel's Gate and policies, with the `resource.action` naming convention. Filament Shield is not adopted on the strength of this ADR — check its version and maintenance first if it is wanted.

## Reason for selection

The package is Gate-native (which is exactly what Filament's authorisation hooks consume), database-driven, cached, and proven — and it is the package Engineering Plan v1.1 specified. Hand-rolling RBAC would reproduce a subset of it with more risk and no benefit; Gates/Policies alone would put permissions in code, requiring a deploy for every permission change. The package's size relative to Phase 1's two roles is accepted deliberately: it is the cost of not rewriting access control when the deferred roles return.
