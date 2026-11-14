# ADR-004 — Authentication (Sanctum)

| | |
|---|---|
| Status | **Confirmed** |
| Date | 2026-11-14 |
| Sources | Research Notes §3 (laravel.com/docs/13.x/sanctum — primary, checked 2026-11-14); Decision Sheet; Engineering Plan v1.1 (Sanctum — agreed) |

## Context

The platform has two first-party clients: the Next.js public website (a single-page application on the same top-level domain) and the future Flutter mobile app (M12). Both authenticate against the same Laravel API. The project needs an authentication system that covers both without introducing an OAuth2 server the project does not need. No third-party developers need delegated access in Phase 1.

## Options considered

1. **Laravel Sanctum 4.x** (`^4.0`) — cookie authentication for the SPA, personal access tokens for the mobile app.
2. **Laravel Passport** (full OAuth2 authorisation server: authorisation codes, PKCE, client credentials, refresh tokens, scopes, `/oauth/*` endpoints, RSA-signed tokens, its own tables). The full OAuth2 option.
3. **Laravel Fortify** — a headless backend for registration/login/password-reset/email-verification/2FA. Not a token system; it can sit alongside Sanctum but does not replace it.
4. **Custom token/JWT implementation** — rejected: it would re-implement what Sanctum already provides, with more room for error and no framework support.

## Advantages

- **Two modes, deliberately separate, matching the two clients exactly:** cookie auth (with CSRF protection and session auth) for the first-party SPA; personal access tokens for the mobile app. The Sanctum documentation's own rule is followed: API tokens are not used to authenticate the first-party SPA.
- **Featherweight:** one table (`personal_access_tokens`), tokens stored SHA-256 hashed, plaintext shown once at creation, revocation by deleting a row.
- **Abilities/scopes** on tokens where they add value, checked with `tokenCan()` — with the explicit understanding that for SPA requests `tokenCan()` always returns true, so real authorisation still belongs in policies/gates (Doc 07 §8.3).
- **Token expiry is configurable** (global `expiration` or per-token), with `sanctum:prune-expired` for cleanup.
- **First-party, maintained, and aligned** with Laravel 13 (Sanctum 4.x declares `illuminate/* ^11.0|^12.0|^13.0`).

## Disadvantages

- **No refresh-token flow, no per-device session list, no "log out everywhere" in Sanctum itself.** These must be designed around: logout deletes the current token; "log out of all devices" deletes all of the user's tokens (and invalidates the session for web). This is specified in Doc 07 §8.2.
- **No server-side token introspection endpoint.** Revocation is a database delete; there is no introspection API for an external party — which is fine, because there is no external party in Phase 1.
- **Not an OAuth2 server.** If third-party developers ever need delegated access, Sanctum cannot provide it and Passport (or equivalent) would be needed. That is a future decision, not a Phase 1 requirement.
- **SPA and API must share the same top-level domain** for cookie authentication (different subdomains allowed). If the website ever moves to a different top-level domain, the web auth mode must be revisited.

## Security implications

- Cookie mode gives CSRF protection, session auth, and protection against credential leakage via XSS — the reasons the Sanctum documentation recommends it for first-party SPAs.
- Tokens are hashed at rest; the plaintext value exists only at creation. Tokens never expire by default in Sanctum, so **this deployment configures an expiry** (Doc 07 §8.2) — relying on the default would leave tokens valid indefinitely.
- Abilities are not a substitute for policies. A token with a broad ability does not bypass the policy layer.
- Session fixation is mitigated by regenerating the session on login (Doc 08 §5).

## Scalability implications

- Negligible at this scale. Token validation is a single indexed database lookup; session storage is on the database driver to start (ADR-009) and moves with the cache/session decision if Redis is adopted.

## Maintenance implications

- Minimal: one package, one table, framework-maintained. Upgrades follow Laravel's release cadence.
- If Passport is ever adopted, it is an additive decision (a new auth server alongside the API), not a rewrite of the existing Sanctum flows — but it is a materially larger system to secure and maintain, so the trigger for it (a real third-party developer requirement) must be genuine.

## Final recommendation

**Laravel Sanctum 4.x (`^4.0`): cookie authentication for the first-party web SPA, personal access tokens for the Flutter app.** No refresh-token flow is built in Phase 1; the gaps are designed around as specified in Doc 07 §8.2. Passport is explicitly out of scope unless third-party developers need delegated OAuth2 access.

## Reason for selection

All clients are first-party (the organisation's own website and its own app). Sanctum is the documented, first-party answer for exactly that shape, and it is what Engineering Plan v1.1 specified. Passport would add an OAuth2 server — authorisation codes, consent screens, client registration, RSA keys — for a need that does not exist, and its cost (to secure, maintain, and explain) is disproportionate. A custom token system would be strictly worse than the maintained first-party package.

> Phase 0.1 note: no database dependency — verified 2026-11-14 (the MySQL 8.4 switch does not affect this ADR; the MariaDB 11.8.9 standard likewise does not — see 16-MARIADB-ADDENDUM.md).
