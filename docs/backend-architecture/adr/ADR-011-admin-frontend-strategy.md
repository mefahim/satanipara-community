# ADR-011 — Admin frontend strategy (Filament 5)

| | |
|---|---|
| Status | **Confirmed** |
| Date | 2026-11-14 |
| Sources | Research Notes §4 (filamentphp.com/docs/5.x/introduction and /5.x/upgrade-guide — primary, checked 2026-11-14); Decision Sheet; Engineering Plan v1.1 (Filament admin — agreed; Filament 3 in the plan is superseded by Filament 5, see below) |

## Context

The system needs an admin panel (M10) for the Super Admin and the Expatriate Helpers: member approval, the expatriate request queue, finance entry/approval/publishing, content publishing, donor management, audit logs, and settings (Doc 09). The panel must enforce the same permissions as the API, must be built quickly relative to a bespoke admin SPA, and must not become a second, separate application with its own auth and data access.

## Options considered

1. **Filament 5.x** (`^5.0`, MIT; PHP 8.2+, Laravel 11.28+, Livewire 4+, Tailwind 4.1+).
2. **A bespoke admin SPA** (e.g. React/Next.js) consuming the API. Full design control, but a second application to build, secure, and maintain — including its own auth, routing, and permission handling.
3. **Filament 4.x** — considered only to reject it: Filament 5's headline change over v4 is Livewire 4 support, and v5 has no additional breaking API changes over v4 (per the Filament team); there is no reason to start on the older major.
4. **A Blade-only custom admin** — rejected: it would reproduce what Filament provides (tables, forms, filters, pagination, notifications, widgets) by hand.

## Advantages

- **Server-Driven UI (SDUI):** interfaces are defined declaratively in PHP (structured config objects) and rendered to HTML by the server; most features need no custom JavaScript.
- **Complete kit:** panel builder, tables (filtering, sorting, pagination), schemas, forms (validated inputs), infolists, actions (button + modal + logic), notifications, widgets (stats, charts, tables), and support utilities — the exact building blocks Doc 09's modules need.
- **Multiple panels** per app (e.g. an internal admin panel and a member/customer portal) if ever needed; components can also be embedded in ordinary Blade views without adopting the whole panel.
- **Authorisation hooks:** `canAccessPanel()` and per-resource `can*()` hooks, plus panel `auth` guard configuration — the mechanism by which the Spatie permission model (ADR-005) is enforced in the panel.
- **Testing:** core packages are unit-tested; Filament provides test utilities compatible with Pest or PHPUnit.
- **Licence and cost:** MIT; the core is free and open-source (only some add-on plugins are paid).
- **Laravel 13 compatibility** is declared (`filament/support` requires `illuminate/* ^11.28 || ^12.0 || ^13.0`, Packagist-derived, Oct 2026).

## Disadvantages

- **No built-in role/permission system of its own.** Access control is via Laravel gates/policies and Filament's hooks — which is the design (ADR-005 provides the roles), but it means the panel does not give the organisation a role-management UI by itself.
- **Community plugins are not guaranteed** for quality, security, or compatibility (Filament's own documentation warns this). Each plugin must be reviewed (code, docs, feedback) before installing. The **Filament Shield** plugin (which wires Spatie roles/permissions into Filament) is specifically **not verified** — check before adopting (Research Notes §4).
- **Tailwind 4.1+** is required when compiling a custom theme or standalone CSS; panels using pre-compiled CSS do not need a local Tailwind build. A custom theme is a build-time decision, not a day-one requirement.
- **Livewire 4** is a dependency (Filament 5's headline change). The team must be comfortable with Livewire's server-driven model; a team expecting a pure client-side SPA will find the mental model different.

## Security implications

- The panel is behind the same Sanctum session authentication as the web SPA (Doc 07 §8.1) — there is no separate dashboard password and no separate credential store.
- Panel access is gated by `canAccessPanel()` **in addition to** the route middleware and the API policies. A helper opening the panel sees only expatriate operations; every other resource's routes are denied, not merely hidden (Doc 08 §8, Doc 09 §2).
- Filament's notification and widget systems must not leak data across roles: a widget's query is scoped to the signed-in user exactly as an API list endpoint is.

## Scalability implications

- None material at this scale. Filament is a server-rendered admin panel for a handful of administrators; its load is trivial compared with the public site.
- If the admin user count ever grows large, the panel's queries are the same scoped Eloquent queries the API uses, and the same indexes serve both.

## Maintenance implications

- Filament is a maintained first-party-style ecosystem (the core team ships it); upgrades follow its releases. The v5 upgrade guide is the reference for the Livewire 4 move.
- Customisations should override semantic CSS classes (e.g. `.fi-btn`) rather than forking templates, so upgrades do not break the panel's styling.
- The panel's behaviour is specified in Doc 09; Filament component choices (which table, which form field) are implementation decisions for Phase 8, not architecture decisions.

## Final recommendation

**Filament 5.x (`^5.0`) as the admin panel**, installed with `composer require filament/filament:"^5.0"` and `php artisan filament:install --panels`, with access control via Laravel gates/policies (Spatie Permission, ADR-005) and Filament's `canAccessPanel()`/`can*()` hooks. Filament Shield is not adopted on the strength of this ADR.

## Reason for selection

It is the fastest path to a complete, maintainable admin panel that enforces the same permission model as the API, it is what Engineering Plan v1.1 specified (updated from Filament 3 to Filament 5, per the Decision Sheet's divergence rule — Filament 5 is the current major and the plan's version is superseded), and it avoids building and securing a second SPA for a handful of administrators. A bespoke admin SPA would cost more, duplicate the auth and permission work, and deliver no capability the organisation asked for.
