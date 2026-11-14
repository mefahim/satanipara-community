# ADR-006 — API architecture (REST /api/v1, API-first)

| | |
|---|---|
| Status | **Confirmed** |
| Date | 2026-11-14 |
| Sources | Decision Sheet; Engineering Plan v1.1 §1, §6–§7 (Laravel modular monolith + REST API; ~70 endpoints as a plan estimate; /api/v1 — agreed); Audit Findings (prototype has no API at all — §9 item 1); Doc 07 (API Architecture) |

## Context

Three clients must be served — the Next.js public website (M11), the Filament admin panel (M10), and the future Flutter apps (M12) — from one backend and one database. The prototype has no API, no server, and no persistence (0 `fetch(`, 0 `localStorage` — Audit Findings §6), and it duplicated the same data in several places (the demo request in four places, finance rows in two, gallery images in three — Audit Findings §4). The API architecture must prevent that duplication by construction: each fact is exposed once, by the backend, and every client renders it.

## Options considered

1. **REST, API-first, versioned `/api/v1`** — one Laravel backend; all clients are API clients.
2. **REST, but with server-rendered Blade pages for the public site** (API only for the mobile app). Less API surface, but two rendering paths and duplicated logic.
3. **GraphQL** — a single endpoint with client-selected fields. Flexible, but a larger system to secure, cache, and document, with no client requirement for it.
4. **JSON:API (Laravel 13's first-party JSON:API resources)** — a standardised REST dialect with relationship inclusion and sparse fieldsets. Considered as a *representation* within option 1, not as a separate architecture; the blueprint's envelope (`{"data","meta"}`) is the chosen representation for v1, and JSON:API resources remain available if a future client needs them.

## Advantages

- **One backend, one database, one source of truth.** An admin change appears everywhere immediately — the property Engineering Plan v1.1 §1 names as the reason for the modular monolith.
- **Clients are replaceable.** The website, the admin panel, and the apps can each be rebuilt or replaced without touching the backend, and a new client (e.g. a future partner integration) needs only API access.
- **Versioning is explicit and safe:** `/api/v1` in the path, a 12-month v1 support rule after v2, additive changes inside v1, breaking changes only in a new major (Doc 07 §2, §13).
- **Testable as a contract:** the OpenAPI specification generated from the code is validated against live responses in CI (Doc 07 §10, Doc 10 §3).
- **REST is the best-understood option** for the team, for the organisation's future developers, and for the tooling (rate limiting, caching, logging) — all of which assume HTTP verbs and resource URLs.

## Disadvantages

- **More upfront design work than server-rendered pages:** every screen needs an endpoint (or an endpoint that serves it), and the envelope, pagination, filtering, and error conventions must be defined before the first client is built. Doc 07 is that design work.
- **Over-fetching/under-fetching trade-offs:** a REST list endpoint returns a fixed shape; a client that needs a slightly different shape either accepts extra fields or needs a new endpoint (or a query parameter). This is manageable at 132 endpoints and is preferable to GraphQL's complexity at this scale.
- **Versioning is a commitment:** supporting v1 for 12 months after v2 means maintaining two versions in that window. The alternative (breaking clients silently) is worse.

## Security implications

- The API is the *only* enforcement point. Every endpoint is authenticated (unless explicitly public) and policy-checked (Doc 07 §8.3, Doc 08 §8). There is no "trusted client" — the web client is not trusted more than any other caller.
- The envelope discipline (no stack traces, no SQL, no internal paths in errors — Doc 07 §3.2) applies to every endpoint.
- Rate limiting, validation, and upload controls are enforced in middleware and Form Requests, not per controller (Doc 07 §§7, 9, 11).

## Scalability implications

- Stateless API (Sanctum tokens / sessions in the database) — the application tier can be scaled horizontally later without session affinity, if the deployment ever needs it. The single-VPS start (ADR-012) does not need it now.
- Cursor pagination for large public lists prevents the "fetch everything and filter in the browser" pattern the prototype used (Audit Findings §6).
- Caching of public reads (behind the cache driver, ADR-009) is possible per endpoint without changing clients.

## Maintenance implications

- The OpenAPI specification is generated from the code, so documentation cannot drift from implementation without CI failing (Doc 10 §9).
- The changelog and deprecation policy (Doc 07 §13) make API evolution a recorded process rather than a series of surprises for the frontend team.
- A future client (mobile, partner) is an additive effort, not a backend rewrite.

## Final recommendation

**REST, API-first, versioned as `/api/v1`, with the response/error envelopes, pagination, filtering, and conventions specified in Doc 07.** 132 endpoints (listed in Doc 07 §14; 7 wholly proposed, 0 with behaviour-level proposals outstanding — the plan's ~70 was a pre-inventory estimate). The Laravel 13 JSON:API resources are available as a future representation option but are not adopted for v1.

## Reason for selection

It is the architecture Engineering Plan v1.1 specified and the Decision Sheet agrees with, it matches the team's stack, it gives the single-source-of-truth property the prototype lacked, and it is the simplest architecture that serves three clients from one backend. GraphQL would add complexity for a flexibility no client has asked for; server-rendered pages would recreate the duplication the API exists to prevent.
