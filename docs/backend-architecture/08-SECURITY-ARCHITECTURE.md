# 08 — Security Architecture

| | |
|---|---|
| Document | Satanipara Community — Phase 0 Backend Blueprint, Doc 08 |
| Status | **Planned** — planning only; no backend code exists yet |
| Sources | Decision Sheet (single source of truth); Audit Findings (37 features, validation rules, gaps); Research Notes (verified 2026-11-14); Engineering Plan v1.1 |
| Companion docs | Doc 07 (API Architecture), Doc 10 (Testing & Quality), Doc 11 (Deployment & Operations) |

> **The central statement of this document.** Laravel alone does not make this system secure. Laravel provides sound defaults (parameterised queries, CSRF protection, hashed passwords, an authorisation gate system), but security is demonstrated by implementation and testing in later phases — by the controls below being built, by the tests in Doc 10 passing, and by review — not by the choice of framework. Any claim that the system "is secure" before that evidence exists is false.

## 1. Threat model

### 1.1 What is protected

| Asset | Sensitivity | Why it matters |
|---|---|---|
| Member phone numbers | **High** | The login identifier; the primary contact channel. Exposure enables impersonation, harassment, and SIM-targeted fraud |
| Blood donor phone numbers | **Highest** | Health-adjacent personal data, disclosed only with per-request consent. Wrongful disclosure can endanger a donor and destroys trust in the organisation |
| Member profile data (name, area, country, family info) | **High** | Personal data of community members, including people living abroad (expatriates) |
| Expatriate request details (for whom, applicant, address context, expenses) | **High** | Describes vulnerable people (elderly parents, hospital patients) and their locations |
| Finance records | **High** | Organisational money; public trust depends on their integrity. Tampering is fraud |
| Admin credentials (Super Admin, Helpers) | **Highest** | Compromise gives full control of the platform, including the ability to publish false information and to read all personal data |
| Constitution, notices, published content | **Medium** | Integrity matters (a forged notice or altered constitution misleads the community); confidentiality is low because it is public by design |
| Backups | **High** | A backup contains the whole database. A leaked backup is a full data breach |
| Secrets (APP_KEY, database password, VAPID keys, push credentials) | **Highest** | Compromise of APP_KEY alone breaks encryption, signed URLs, and session integrity |

### 1.2 Threat actors (realistic for a small community platform)

| Actor | Capability | Likely goals |
|---|---|---|
| Opportunistic automated scanners | Bots probing for known Laravel/PHP vulnerabilities, exposed `.env`, admin panels, upload shells | Defacement, crypto-mining, spam relay, credential theft |
| Curious or malicious community member | A legitimate account; knows the community and its people | Reading another member's data, reading donor phones without consent, altering a request, embarrassing the organisation |
| Disgruntled helper or former admin | Holds or held valid credentials | Reading data beyond their role, altering finance or request records, deleting evidence |
| Targeted attacker | Time and skill; may phish an admin | Admin takeover, finance fraud, mass personal-data theft |
| Accidental insider | A well-meaning admin or helper | Publishing unverified data, deleting a record, misconfiguring a permission |

### 1.3 What is out of scope for this threat model

- Nation-state attackers and advanced persistent threats: the controls below are not designed for that adversary, and no claim is made against one.
- Physical security of the VPS provider's data centre (the provider's responsibility; see Doc 11).
- Security of members' own devices (a compromised member phone can leak that member's session; the system limits the blast radius by scoping tokens and by never storing other members' data on a device).

### 1.4 Security assumptions

1. The VPS host, its hypervisor, and its network are trusted to the extent described in Doc 11; the application does not defend against a compromised host.
2. Administrators use devices that are not shared and not compromised; admin sessions are treated as high-value.
3. The organisation supplies real data only with consent (per the prototype's standing rule: real names, photos, and statistics need individual consent before publication — Audit Findings §1.5).
4. No payment data ever enters this system (online payment is excluded from Phase 1), so PCI-style card-data controls are not required. If a payment gateway is ever added, this threat model must be revised first.

## 2. OWASP Top 10 — mapped to concrete controls

Each row names the risk, the concrete control in this system, and where it is verified. "Verified in" refers to Doc 10 test categories; nothing is claimed as verified now.

| # | OWASP risk | Control in this system | Verified in |
|---|---|---|---|
| A01 | Broken Access Control | Every endpoint policy-checked (Doc 07 §8.3). Spatie Permission v8 roles/permissions registered on the Gate; Filament `canAccessPanel()`/`can*()` hooks enforce the same rules in the admin panel. Helper boundary: helpers see expatriate requests only. Object-level policies: members see only their own records; donor phones only via the consent flow. Direct-object references are checked, never trusted (see §3.4). Default-deny: a route with no policy is unreachable until one is written | Authorisation tests (Doc 10 §5): every endpoint tested as anonymous, member, helper, Super Admin, and as another member |
| A02 | Cryptographic Failures | TLS everywhere (HTTPS + HSTS, §7). Phone numbers and beneficiary fields encrypted at rest (§6). Passwords hashed per the single policy in Doc 04 §5.1 (Argon2id m=19 MiB, t=2, p=1; bcrypt cost ≥12 fallback, >72-byte rejection); never plaintext — the prototype stored demo passwords in plaintext in the HTML file (Audit Findings §5.5) and that must never be repeated. Signed URLs for private files, short-lived (§6.3). Secrets in environment, never in git (§9). Old/weak TLS versions disabled; no mixed content | Security tests; deployment checklist (Doc 11) |
| A03 | Injection | Eloquent / parameterised queries everywhere; raw SQL only through parameter binding, never string concatenation (§3.1). No `eval`, no unserialising user input. Cache `serializable_classes=false` (Laravel 13 default) hardens against deserialisation gadget chains if APP_KEY leaks (Research Notes §1). Command execution with user input is forbidden; where a shell binary is needed (e.g. `mysqldump` via spatie/laravel-backup) it is invoked by the package with fixed arguments, never with user-supplied paths | Security tests: injection payloads against every input |
| A04 | Insecure Design | State machines enforced server-side (expatriate status transitions, finance publish/reverse, consent grant/revoke — Doc 07 §14). Business rules that the prototype faked in the browser (unique Request IDs, server timestamps, server-computed totals, assignment) are enforced by the server (Audit Findings §6). Rate limits on login, tracking, and public submission (Doc 07 §9). Threat modelling repeated at each phase; new features get a security review before merge | Design review per phase (Doc 12); state-machine tests |
| A05 | Security Misconfiguration | Secure defaults (§4): debug off in production, Telescope disabled in production, error pages generic, directory listing off, unused services closed, framework and packages patched (see §10). Environment-specific configuration reviewed at every deploy; staging mirrors production configuration (Doc 11) | CI configuration checks; deploy checklist |
| A06 | Vulnerable and Outdated Components | Pinned major versions with `^` constraints (Laravel ^13.0, Sanctum ^4.0, Filament ^5.0, Spatie Permission ^8.0 — Decision Sheet). Weekly dependency audit in CI (Doc 10 §8); security advisories triaged within one working day for critical severity; no package installed without a licence and maintenance check (see §10) | CI dependency audit |
| A07 | Identification and Authentication Failures | Sanctum 4.x (§5): cookie auth for the web SPA, tokens for mobile, with expiry and pruning. Login rate-limited with growing lockout (Doc 07 §9). No OTP in Phase 1 by scope — and therefore no OTP-bypass risk; password reset is Super Admin-only and audited. Session fixation protection (session regenerated on login). Password rules per the single policy in Doc 04 §5.1 (§5 item 2 of this document). No "remember me" token that survives password change without invalidation | Auth tests (Doc 10 §5) |
| A08 | Software and Data Integrity Failures | CI/CD only deploys from the organisation's GitHub repository through GitHub Actions (Doc 11); no direct file edits on the server. Backups are checksummed and restore-tested (Doc 11). Uploaded files are scanned (ClamAV) and never executed (§3.5). Dependency integrity via lockfiles (`composer.lock` committed; installs use `--no-dev` in production) | CI pipeline; backup verification |
| A09 | Security Logging and Monitoring Failures | Audit log for every privileged and sensitive action (§8): logins, logouts, password resets, role changes, request transitions, finance publish/reverse, consent grants and phone reveals, settings changes. Logs go to a durable store, are append-only, and are reviewed (Doc 11 monitoring). Failed logins logged without passwords. Alerting on defined patterns (Doc 11 §5) | Log review in QA; monitoring checks |
| A10 | Server-Side Request Forgery (SSRF) | The application makes no server-side requests to user-supplied URLs in Phase 1. If a future feature needs one (e.g. fetching a link preview), it must go through an allow-list and a private-IP blocklist — to be designed at that time, not assumed now. Webhook endpoints, if ever added, validate signatures and are rate-limited | Design review when the feature is proposed |

## 3. Attack-specific controls

### 3.1 SQL injection

- All database access goes through Eloquent or the query builder with parameter binding. Raw expressions (`whereRaw`, `DB::raw`) require a second reviewer's approval in code review and must bind every variable; a raw expression with string interpolation of user input is a blocking review finding.
- Database credentials grant only the permissions the application needs (no `SUPER` privilege, no `DROP`/`ALTER` on the application role in production — MySQL 8.4 uses granular privileges; the app user gets only the DML privileges it needs, per Doc 04 §5.7 / Doc 06 §8.2; the multi-user design is mandatory, not conditional). Canonical users (full matrix: Doc 06 §7.1): `satanipara_app` (the application — `SELECT, INSERT, UPDATE` on `ledger_entries`/`ledger_reversals`, **no `DELETE`** on those tables, no `UPDATE`/`DELETE` on `activity_log`, no DDL of any kind); `satanipara_migrate` (deploy pipeline only — holds DDL incl. `CREATE TRIGGER`, never in the app `.env`); `satanipara_backup` (`SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER` — read-only, for `mysqldump`); `satanipara_report` (`SELECT` only on the finance tables, created only when the Finance Auditor role is needed). The BEFORE UPDATE/DELETE triggers on the ledger tables fire for every database user, including root and the migration user, so no credential holder can bypass them by connecting directly.
- Error responses never include SQL (Doc 07 §3.2).

### 3.2 Cross-site scripting (XSS)

- Output is escaped by default (Blade `{{ }}` escaping; API JSON encoding). Unescaped output (`{!! !!}` or raw HTML fields) requires explicit justification and review.
- User-supplied HTML is not stored as HTML. Rich text, if ever needed, is stored as Markdown or as sanitised HTML through an allow-list sanitiser — to be chosen when the requirement arises; the default is plain text.
- Content Security Policy (CSP) headers are set (see §4.3). `HttpOnly` and `SameSite` flags are set on session cookies; the `Secure` flag is set in production.
- Filament/Livewire output follows the same escaping rules; custom Filament components are reviewed for unescaped output.

### 3.3 Cross-site request forgery (CSRF)

- Web routes use Laravel 13's `PreventRequestForgery` middleware (origin-aware, `Sec-Fetch-Site` — Research Notes §1). API token routes are not CSRF-protected by design (the bearer token is the credential) and must never accept a session cookie as an alternative credential.
- State-changing requests from the SPA include the CSRF token obtained from `/sanctum/csrf-cookie`.
- `SameSite=Lax` (or `Strict` where it does not break the login flow — to be confirmed at scaffold time) on the session cookie.

### 3.4 Insecure direct object references (IDOR) and broken access control

- Every `{id}` in a URL is resolved through a policy check, not merely an existence check. Listing endpoints scope the query to what the caller may see (e.g. a member's request list is filtered to their own user ID in the query itself, not filtered after fetching).
- Sequential numeric IDs are not relied on for secrecy; where an ID is guessable (expatriate Request IDs are sequential by year), the tracking endpoint returns only the Tier-S allowlist (Doc 04 §7.4 — the Request ID alone returns nothing; the 128-bit tracking secret is required) and rate-limits lookups (Doc 07 §9, §14.7 X2).
- The prototype's client-side auth guard (a JavaScript `state.user` check redirecting to `#/login`, Audit Findings §2.1) is not a control and is not reproduced. The server is the only enforcement point.

### 3.5 Mass assignment

- Models define explicit `$fillable` lists; `$guarded = []` is forbidden. Form Requests define the exact accepted fields; unknown fields are ignored, never stored.
- Sensitive fields (role, status, `verified`, `published_at`, money totals, `phone_hash`) are never mass-assignable from a request. Status changes go through the transition endpoints only (Doc 07 §14.7).

### 3.6 File-upload attacks and malicious media

- Uploads are accepted only at the documented endpoints (Doc 07 §11). Each endpoint declares its allowed MIME types and size limit; validation checks the file's actual content (MIME sniffing), not its extension.
- Rejected outright: executables (`.php`, `.exe`, `.sh`, `.bat`, `.js` as uploads), HTML files, SVG with embedded script, archives containing executables, and any file whose detected MIME does not match its declared type.
- **ClamAV scan** on every uploaded file before it is stored as available, per Engineering Plan v1.1. A file that fails the scan is quarantined (stored in a non-servable location or deleted) and the upload is rejected with a generic error; the scan event is logged.
- Stored filenames are server-generated (UUID + safe extension). The user-supplied filename is stored only as metadata, never used as a path.
- Uploaded files are stored outside the web root or on a disk that never executes files; the web server is configured to never execute PHP (or any script) from an upload directory.
- Image uploads are re-encoded (or at minimum re-processed through an image library) so embedded payloads in metadata are stripped; EXIF data is removed from published images.
- Private files are served only through a controller that checks the policy, then issues a signed, time-limited URL (Doc 07 §11).

### 3.7 Authentication attacks

- **Brute force / credential stuffing:** strict login rate limiting (5 attempts per 15 minutes per IP + phone, growing lockout — Doc 07 §9, Doc 04 §5.2). The login error message is identical whether the phone number exists or not, and whether the password or the phone was wrong.
- **Session hijacking:** session cookie `HttpOnly`, `Secure`, `SameSite`; session ID regenerated on login and on privilege change; idle and absolute session timeouts set per Doc 04 §5.4 (120 min member/helper idle, 30 min Super Admin idle, 12 h absolute). Concurrent-session policy to be confirmed in Sprint 1.
- **Token theft (mobile):** tokens are hashed at rest; the plaintext value exists only at creation. Tokens expire (Doc 07 §8.2) and are pruned. A compromised token's damage is limited by policies — a token never grants more than the user's permissions.
- **Password attacks:** passwords are stored only as hashes per the single policy in Doc 04 §5.1 — **Argon2id (m=19 MiB, t=2, p=1)**; bcrypt cost ≥12 as the fallback, with passwords over 72 bytes rejected (bcrypt truncation). There is no scaffold-time choice of algorithm: the policy is decided, not configured. Passwords are never logged, never returned by any endpoint, and never emailed.
- **No security questions, no OTP in Phase 1.** Both are out of scope; neither may be improvised at implementation time.

### 3.8 Privilege escalation

- Role assignment is Super Admin-only (`members.create` + `users.manage_roles` jointly, Doc 07 §14.12 AD4/AD5) and audited. A user cannot assign themselves a role; the API rejects any request body field that would change the caller's own role.
- The helper role is enforced by the same policy layer as everything else — there is no "helper mode" flag on the client that the server trusts.
- The self-lockout guard (a Super Admin cannot remove their own Super Admin role) is **mandatory** (decided Phase 0.1; Doc 04 §3.2, Doc 07 §17 item 6, AD5).
- Filament panel access is gated by `canAccessPanel()` in addition to the route middleware; a user with no panel permission receives a 403, not a filtered panel.

### 3.9 API abuse

- Rate limits per Doc 07 §9 on every endpoint family. Enumeration is slowed by rate limiting plus the non-disclosing 404 rule (§8.4 of Doc 07).
- Request size limits: JSON bodies capped (a few MB at most; exact value at scaffold time), uploads capped per endpoint. Oversized requests are rejected with `413` before processing.
- No endpoint returns unbounded data (Doc 07 §5). No endpoint allows arbitrary query construction (only whitelisted filters/sorts).

### 3.10 Sensitive-data exposure

- The API returns the minimum fields a caller needs (see the per-endpoint privacy notes in Doc 07 §14). List responses never include phone numbers, password hashes, tokens, or signed URLs.
- Phone numbers are masked in every log line (last 3 digits only, or fully redacted). Signed URLs are never logged. Tokens are never logged.
- Error messages do not leak whether a phone number is registered, whether an ID exists (where sensitive), or any internal detail.
- The public website never renders a real phone number, email address, or home address until the organisation has verified it and approved publication (prototype rule, Audit Findings §1.5).

### 3.11 Insecure configuration

- See §4 (secure defaults). Configuration is reviewed at every deploy; staging configuration mirrors production except for credentials and hostnames (Doc 11).

### 3.12 Dependency vulnerabilities

- See §10. A dependency with a known critical vulnerability is not deployed; if one is discovered in production, the fix is expedited and the exposure window is recorded.

### 3.13 Backup security

- Backups contain the full database, including encrypted phone columns. Backups are therefore as sensitive as the database itself: they are encrypted at rest on the off-server disk where the provider supports it, access to the backup disk is restricted to the deployment identity, and backup files are never emailed, never stored on a developer's laptop, and never included in a repository.
- The backup schedule and restore test are defined in Doc 11 §7. A backup that cannot be restored is worthless; the restore test is mandatory, not optional.

### 3.14 Secret management

- All secrets live in environment variables on the server (`.env` on the VPS, or the platform's secret store). **`.env` is never committed to git, never included in a backup, never pasted into chat, and never emailed.**
- Secrets are rotated when a person with access leaves the project, when a secret is suspected to have leaked, and on a schedule for the most sensitive ones (APP_KEY rotation requires a data migration plan for encrypted columns — it is not a casual operation and must be planned).
- Development and staging use different secrets from production. Production secrets are known only to the deployment identity and the Super Admin where the secret is theirs (e.g. their own password — which is never known to anyone else).

## 4. Secure defaults

- `APP_DEBUG=false` in staging and production. Debug mode in production is a critical finding.
- `APP_ENV=production` on the production host; the application behaves differently (error pages, logging, Telescope) based on this value, and the value is verified at deploy time.
- Laravel Telescope is development-only and is **never enabled in production** (Research Notes §8).
- Generic error pages: production errors return the standard error envelope (Doc 07 §3.2) with code `internal_error`; no stack trace, no query, no file path.
- Security headers on every response (see §4.3). Directory listing disabled. Server version banners suppressed.
- The application runs as a non-root user; file permissions follow least privilege (upload directories writable by the app user only; configuration files not writable by the web server user).
- Unused services and ports are closed on the VPS (Doc 11).

### 4.3 Security headers (to be set at the web-server or middleware layer)

| Header | Value / policy |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` (once HTTPS is confirmed working; preload only after a deliberate decision) |
| `Content-Security-Policy` | Restrictive default (`default-src 'self'`), with explicit allowances only for what the frontend needs (fonts, images from the app's own storage, the API origin). No `unsafe-inline`/`unsafe-eval` unless a named dependency requires it and the exception is documented |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` / `frame-ancestors` | `DENY` (or `SAMEORIGIN` only where the admin panel is intentionally framed — default DENY) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Disable camera, microphone, geolocation unless a feature needs them (none does in Phase 1) |

## 5. Authentication and session requirements (summary)

Full detail is in Doc 07 §8; this section states the security requirements that the implementation must satisfy:

1. Sanctum 4.x (`^4.0`); cookie auth for the first-party SPA, bearer tokens for the Flutter app; never tokens for the SPA.
2. Passwords: the single policy in Doc 04 §5.1 governs — minimum 12 characters for all accounts, 16 enforced for Super Admin; no composition rules; mandatory breach screening (HIBP k-anonymity + local ≥10,000 list + context blocklist); Argon2id (m=19 MiB, t=2, p=1), bcrypt cost ≥12 fallback; history 5; no expiry. Passwords are hashed; never logged or returned; changed only by the owner (with current-password confirmation) or by a Super Admin (audited).
3. Login: rate-limited with growing lockout; identical error for unknown phone and wrong password; failed attempts logged (without the password).
4. Sessions: database driver to start; regenerated on login; idle timeout per Doc 04 §5.4 (120 min member/helper, 30 min Super Admin idle; 12 h absolute); `HttpOnly`/`Secure`/`SameSite` cookies.
5. Tokens: hashed at rest, expiry configured, pruned daily, revocable per token and all-at-once; token values never appear in a list response.
6. No OTP in Phase 1 (scope decision). No self-service password reset by email in Phase 1 (no email provider confirmed). Password reset is Super Admin-only and audited.
7. Super Admin accounts: created only through the documented process; the initial Super Admin is created by the deployment process (seeded by a secure, one-time procedure), not by a public registration endpoint — public registration creates a *pending member application*, never an admin.

## 6. Encryption

### 6.1 In transit

- **HTTPS everywhere.** HTTP redirects to HTTPS. HSTS is enabled once HTTPS is confirmed (see §4.3). Certificates are Let's Encrypt with auto-renewal (Doc 11).
- The API, the web client, and the admin panel are all served over HTTPS. No endpoint is intentionally HTTP-only.
- Internal traffic (app → database, app → Redis when adopted) stays on the private network / loopback and is not exposed to the internet.

### 6.2 At rest

- **Encrypted columns:** phone numbers (members, donors, requesters, contacts) and beneficiary-identifying fields are stored encrypted using Laravel's encrypted casts (AES-256 via `APP_KEY`). The encryption is at the application layer so that a database dump alone does not expose phone numbers.
- **`phone_hash`:** alongside each encrypted phone column, a **HMAC-SHA256 hash** of the normalised phone number is stored (keyed with a dedicated hash key, separate from `APP_KEY` where the framework supports it). The hash is what uniqueness checks and lookups use — an encrypted value cannot be searched or deduplicated, so the hash is the lookup key. The hash is not reversible and is not displayed.
- **`endpoint_hash` / `fcm_token_hash`:** the same pattern (hash as lookup key for a value that cannot be searched in its stored form), but **unkeyed SHA-256**, not HMAC — endpoints and FCM tokens are high-entropy random bearer values, not enumerable like phone numbers, so no key is needed and none is introduced. `endpoint_hash` is a STORED generated column (the endpoint is stored in plaintext); `fcm_token_hash` is computed in application code from the plaintext token before encryption (the database only ever sees ciphertext, and Laravel's encryption is non-deterministic, so a generated column could never deduplicate). Both hashes are treated as sensitive: never displayed, never returned by an API, never logged (Doc 06 §§2.3–2.4).
- **What is not encrypted at the column level:** names, areas, and other fields that must be searchable and filterable are stored in plaintext but are still protected by access control and by the database not being publicly reachable. This is a deliberate trade-off: encrypting a field makes it unsearchable. If a future requirement demands encryption of names, the search design must change first.
- **Database-level encryption:** the VPS disk may additionally be encrypted at rest by the provider; that is a complement, not a substitute, for column encryption.
- **Backups:** see §3.13.

### 6.3 Signed URLs

- Private files are delivered by signed, time-limited URLs (Doc 07 §11). Recommended expiry: 15 minutes for highly sensitive files (receipts, proof-of-delivery photos), 60 minutes for less sensitive private files. The signature covers the file path and the expiry; tampering invalidates it.
- Signed URLs are generated per request, per user, after a policy check. They are never cached, never logged, and never embedded in a notification body.

## 7. Validation boundaries

- **The server is the only validation boundary.** Client-side validation (in the Next.js web client or the Flutter app) is a user-experience feature. Every rule is re-checked on the server, in a Form Request, before any state change.
- **Prototype rules re-validated server-side** (Doc 07 §7): names ≥2 characters, details/messages ≥10 characters, phone ≥10 digits (strengthened to Bangladesh mobile format in production), password ≥6 in the prototype → **the single policy in Doc 04 §5.1 in production (12 characters minimum, 16 enforced for Super Admin, no composition rules, mandatory breach screening, history of 5)**, hospital name ≥3 characters, consent checkbox required, profile updates validated (the prototype validated nothing).
- **Additional production rules:** maximum length on every string field; allowed-value enums enforced; numeric ranges enforced (amounts > 0, units 1–4); dates validated for plausibility (no future dates where a past date is required, end after start); file uploads validated by content (see §3.6).
- **Validation failures are safe:** a failed validation changes no state, creates no record, sends no notification, and returns 422 with per-field messages (Doc 07 §7).
- **Output encoding:** data is escaped on output (see §3.2). Validation on input does not replace escaping on output; both are required.

## 8. Authorization enforcement

- **Never trust client-side guards.** The prototype's route guard was a JavaScript check on an in-memory user object (Audit Findings §2.1). The backend enforces every rule; the frontend's role-based hiding is cosmetic.
- **Every endpoint has a policy.** A new endpoint without a policy does not ship. Code review checks this; the authorisation test suite (Doc 10 §5) proves it per endpoint and per role.
- **Fail closed.** If a permission is missing, undefined, or cannot be evaluated (e.g. the permission cache is unavailable), access is denied — never granted.
- **Permission cache:** Spatie caches permissions (default 24-hour expiry; flushed automatically on change — Research Notes §5). A permission change must take effect promptly; the implementation flushes the cache on every role/permission change and the behaviour is tested.
- **Admin panel parity:** Filament resources, pages, and widgets enforce the same permissions as the API. A helper opening the admin panel sees only the expatriate request resources; every other navigation item is hidden *and* its routes are denied.

## 9. Logging requirements

### 9.1 What is logged (audit log — persistent, append-only)

| Event | Fields recorded |
|---|---|
| Login success / failure | actor (phone hash, never the phone), IP, user agent, outcome, timestamp |
| Logout / logout-all | actor, timestamp |
| Password change / admin reset | actor, target user id, timestamp (never the password) |
| Role / permission change | actor, target, old value, new value, timestamp |
| Member approve / reject | actor, target, reason, timestamp |
| Expatriate request submit / assign / transition / cancel | actor, request id, from → to status, note, timestamp |
| Finance entry create / approve / publish / reverse | actor, entry id, action, reason (for reversal), timestamp |
| Content publish / unpublish | actor, content id, action, timestamp |
| Donor consent grant / revoke | donor id, request id, outcome, timestamp |
| Donor phone reveal | actor, donor id, request id, timestamp (the phone itself is never logged) |
| Settings change | actor, setting key, old → new value, timestamp |
| File upload / delete | actor, file id, action, timestamp |
| Failed authorisation (403) | actor, endpoint, target, timestamp — rate-limited logging so a flood does not fill the disk |

### 9.2 What is never logged

Passwords (plaintext or hash), tokens, signed URLs, full phone numbers, one-time codes (none exist in Phase 1), credit-card data (none exists), the contents of encrypted columns, or request bodies containing any of the above. Log lines are scrubbed of these values before writing.

### 9.3 Log handling

- Audit logs are stored in the database (append-only table) and are viewable only by Super Admins (`audit_logs.view`). There is no delete endpoint for audit logs.
- Application logs (errors, warnings) go to the configured log channel with rotation; they are monitored (Doc 11 §5) and retained per the retention rule in Doc 11.
- Logs are in UTC internally; displayed in Asia/Dhaka in the admin panel.

## 10. Dependency and supply-chain security

- Dependencies are declared with `^` major constraints and a committed `composer.lock` (and `package-lock.json` / `pnpm-lock.yaml` for the frontend). Production installs use the lockfile.
- A new package is adopted only after checking: licence (must be compatible — MIT/Apache-2.0/BSD preferred; GPL-licensed packages need a deliberate decision), maintenance (recent releases, responsive maintainer), and known vulnerabilities.
- Weekly automated dependency audit in CI (Doc 10 §8). Critical vulnerabilities: triage within one working day, patched or mitigated before the next deploy. High vulnerabilities: within one week unless a mitigation is in place.
- Packages that are abandoned, or that have no release in over a year, are flagged for replacement.
- No package is installed from an unverified source. No `curl | bash` installers on the server.

## 11. Production deployment security

- Deploys happen only through the CI/CD pipeline from the organisation's GitHub repository (Doc 11). Nobody edits code on the server; nobody uploads a ZIP to the server by hand.
- The production server accepts SSH only by key, only from authorised administrators, on a non-standard port where the provider allows it; password SSH login is disabled; root login is disabled.
- The firewall allows only 80/443 (web) and the SSH port from authorised sources; the database port is never exposed to the internet.
- `APP_DEBUG=false`, Telescope disabled, `.env` readable only by the application user, file permissions least-privilege.
- A pre-deploy backup is taken before every production deploy (Doc 11 §7).
- Rollback is a defined procedure (restore the previous release + the pre-deploy backup if data changed), not an improvisation.

## 12. Incident response (outline — to be detailed before go-live)

1. **Detect:** monitoring alerts (Doc 11 §5), a user report, or a failed audit-log review.
2. **Contain:** revoke the affected tokens/sessions, disable the affected account, block the offending IP, take the affected endpoint offline if needed. Preserve logs and backups — do not delete evidence.
3. **Assess:** what was accessed, for how long, by whom; which records are affected. Use the audit log and the access logs.
4. **Eradicate and recover:** patch the cause, rotate the affected secrets, restore from a known-good backup if data was altered, verify with the test suite.
5. **Notify:** the organisation's leadership, and the affected members where personal data was exposed. Notification is in Bengali, in plain language, stating what happened, what data was involved, and what the member should do.
6. **Learn:** a written incident note (what happened, root cause, fix, prevention) is filed and the relevant control in this document is updated.

> This outline is a starting point. A named incident contact and a practiced run-through are required before production go-live (Doc 12, Phase 9).

## 13. What "secure" means for this project — acceptance

Security is accepted when **all** of the following are true, and not before:

1. Every control in §2–§11 that applies to the phase is implemented.
2. The authorisation test matrix (Doc 10 §5) passes for every endpoint and every role.
3. The security test cases (injection, XSS, upload, IDOR, brute-force) pass.
4. A dependency audit is clean of critical vulnerabilities at release time.
5. The deployment checklist (Doc 11) is signed off, including `APP_DEBUG=false`, HTTPS/HSTS, and a tested backup restore.
6. The audit log is demonstrably recording the events in §9.1.

Until then the system is described as "in development" or "under security review" — never as "secure".

## 14. Open security decisions (for Sprint 1)

1. Concurrent-session policy (one session per user? multiple?).
2. Idle and absolute session timeout values. — **Decided (Phase 0.1):** 120 min member/helper idle, 30 min Super Admin idle, 12 h absolute (Doc 04 §5.4).
3. Mobile token expiry value. — **Decided (Phase 0.1):** 30 days (Doc 04 §5.4, Doc 07 §8.2).
4. Whether the CSP needs any `unsafe-inline` exception for a named dependency.
5. Whether the database application role is separated from the migration role. — **Decided (Phase 0.1):** two users, mandatory — `app` (DML only) and `migrate` (DDL) (ADR-003, Doc 04 §5.7, Doc 06 §8.2).
6. Log retention period (recommendation: audit logs retained for the life of the system; application logs 90 days — to be confirmed with the organisation).
7. The named incident contact and the notification wording for a data breach.
8. The public-tracking privacy boundary (shared with Doc 07 §17 item 1) — **decided as a mechanism (Phase 0.1):** Request ID + 128-bit tracking secret, POST only, Tier-S allowlist (Doc 04 §7.4, Doc 07 §8.3/X2 — canonical wording; full field table in Worker C `ALLOWLIST.md`). Open: AO-03 (tracking-secret validity after a terminal status, recommended 90 days) and AO-04 (Tier-S view: first name / beneficiary name?) — plus AO-18–AO-21 (B-only Tier-S fields held out of the allowlist).
