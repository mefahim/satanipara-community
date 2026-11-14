# 11 — Deployment & Operations

| | |
|---|---|
| Document | Satanipara Community — Phase 0 Backend Blueprint, Doc 11 |
| Status | **Planned** — planning only; no infrastructure exists yet |
| Sources | Decision Sheet (single source of truth); Audit Findings; Research Notes (verified 2026-11-14); Engineering Plan v1.1 |
| Companion docs | Doc 08 (Security Architecture), Doc 10 (Testing & Quality), Doc 12 (Development Roadmap) |

> **Status discipline.** No server has been provisioned for this project and no deploy has happened. The hosting sizes below are the Engineering Plan v1.1 starting sizes, repeated as **plan estimates**, not as purchases or commitments. Nothing in this document describes a live system.

## 1. Environments

| Environment | Purpose | Data | Who can access it |
|---|---|---|---|
| **Local** | Day-to-day development on a developer's machine | Disposable, factory-generated test data; never real member data | Developers only |
| **Staging** | A production copy used for integration testing, UAT, and release rehearsal | Demo data (clearly labelled) plus test accounts; never real member data until the organisation explicitly approves a data-migration rehearsal | Developers + named client testers (2–3, per Doc 10 §10) |
| **Production** | The live system the community uses | Real data, with consent (per Decision Sheet) | The community (public parts) + Super Admin + Helpers |

**Rules:**

1. **Staging is a production copy.** Same operating system, same container images, same configuration (except hostnames and secrets), same database engine and version. A bug that appears only in production because staging differed is a process failure.
2. **No feature reaches production without staging.** Every release is deployed to staging first, verified there (automated suite + UAT where the phase requires it), and only then promoted to production with manual approval.
3. **No real data on staging by default.** Staging data is demo/test data. Real data is used on staging only for a specific, approved migration rehearsal, and is wiped afterwards.
4. **No development on production.** No code edits, no direct database edits, no `tinker` writes on production. Emergency fixes go through the same pipeline (fast-tracked, not bypassed).
5. **Environment parity in configuration:** configuration differences between environments are limited to hostnames, credentials, and feature flags that are explicitly documented. There is no "works on staging" setting that is silently different in production.

## 2. Hosting

### 2.1 Starting size (plan estimate)

Per Engineering Plan v1.1, the starting size for a **single VPS** is:

- **4 vCPU / 8 GB RAM / 80 GB SSD.**

This is a starting size for a small community platform (a few thousand users), not a capacity guarantee. It is reviewed at each phase: if the load test (Doc 10 §8) shows the VPS is undersized, the size is increased before go-live, and the change is recorded. The organisation is not asked to pay for a larger server on speculation.

### 2.2 Operating system and runtime


> **Status note (2026-11-14):** the current deployment is **Hostinger shared hosting** per `docs/server-setup/SERVER-FOUNDATION-REPORT.md` (LiteSpeed, no Docker, no root, MariaDB 11.8.9) — not the single-VPS Docker Compose model described in this section. The Docker/VPS model below is a **future migration target**, not current. The database line is corrected by 16-MARIADB-ADDENDUM.md; the hosting-architecture re-decision is pending (see ADR-012).

- **Ubuntu 24.04 LTS** (per Engineering Plan v1.1). Long-term support, security updates enabled, automatic security updates configured for the OS packages.
- **PHP 8.4 or 8.5** (per Decision Sheet; floor 8.3, never 8.2 — EOL 31 Dec 2026). The exact version is pinned at scaffold time and recorded.
- **MySQL 8.4 LTS** — pinned (verify the lifecycle at dev.mysql.com at scaffold time; do not assert a patch number here). The database runs on the same VPS to start.
- **Nginx** as the web server / reverse proxy, terminating TLS.
- **Docker Compose** orchestrating the services below (per Engineering Plan v1.1).

### 2.3 Containers (Docker Compose)


> **Status note (2026-11-14):** there is **no `db` container on the live host** — the database is the Hostinger shared-host MariaDB 11.8.9 service, provisioned in hPanel (see the Server Foundation Report §8). The Compose table below describes the future VPS migration target, not the current deployment.

| Service | Image / role | Notes |
|---|---|---|
| `app` | PHP-FPM + Laravel application | Serves the API and the Filament panel; runs migrations on deploy (see §4) |
| `worker` | Same image, queue worker process | Runs `queue:work` under Supervisor/systemd-equivalent supervision; never `queue:listen` in production (Research Notes §7.1) |
| `scheduler` | Same image, scheduler process | Runs `schedule:run` every minute (backup, prune-expired tokens, queue cleanup, notification pruning) |
| `db` | MySQL 8.4 LTS | Data volume persisted on the host SSD; backups per §6 |
| `redis` | Redis | **Only when adopted** (per Decision Sheet: database queue/cache to start; Redis + Horizon v5 only when latency/volume justifies it). The Compose file includes it commented out, not running |
| `nginx` | Nginx | TLS termination, static-asset serving, reverse proxy to `app` |

- **Database users (provisioned at scaffold, recorded in the runbook, never in git):** `satanipara_app` (application runtime), `satanipara_migrate` (deploy pipeline only — migrations and trigger creation), `satanipara_backup` (nightly `mysqldump` via the MariaDB client), `satanipara_report` (`SELECT`-only, created only when the Finance Auditor role is needed). Full per-table grants: Doc 06 §7.1 / Doc 08 §3.1. The migration user's credentials are held only by the deploy pipeline; the application container never has them at runtime. The post-deploy smoke test asserts the four ledger triggers exist (schema-drift check).

- One image, three roles (`app`/`worker`/`scheduler`) — the same build is deployed everywhere, so a bug cannot exist in one role and not the others.
- Container logs go to the host's log collection (see §5); a container that exits is restarted automatically, and repeated restarts alert.
- **The Next.js public website** (M11) is a separate deployment concern: it may run on the same VPS (as a Node service or a static export behind Nginx) or on the organisation's chosen hosting. The decision is recorded at the start of the website phase (Doc 12, Phase 7); this document does not decide it. Whichever is chosen, the website talks to the API over HTTPS and never to the database.

## 3. Domain and SSL

- **Domain:** an organisation-owned domain (the organisation registers and owns it; the developer never registers the organisation's domain in the developer's own name). The exact domain is not stated in this blueprint — it is the organisation's to supply. Until it is supplied, staging uses a staging subdomain/hostname.
- **DNS:** the organisation (or its authorised delegate) controls DNS. Changes are made by written request and verified after propagation.
- **SSL:** **Let's Encrypt** certificates with auto-renewal (certbot or the equivalent for the chosen setup), renewed well before expiry with alerting on renewal failure. HTTPS is mandatory; HTTP redirects to HTTPS; HSTS is enabled once HTTPS is confirmed (Doc 08 §4.3).
- **Cloudflare free tier:** recommended as the CDN/DNS layer per Engineering Plan v1.1 (DDoS protection, caching of public assets, DNS management). It is optional — the system must work correctly without it, and enabling it must not break the API (notably: the real client IP must still reach the application for rate limiting — the trusted-proxy configuration must be set correctly if Cloudflare is used).

## 4. CI/CD pipeline (GitHub Actions)

Per Engineering Plan v1.1 (GitHub Actions CI/CD). The pipeline:

```
Pull request → gates (§4.1) → merge to main → staging auto-deploy → UAT → manual approval → pre-deploy backup → production deploy → smoke tests → monitor
```

### 4.1 Gates on every pull request (must all pass)

1. Pint (style).
2. Larastan (static analysis).
3. Unit + feature + API contract tests on MariaDB 11.8.9.
4. Authorisation matrix completeness (Doc 10 §5).
5. Coverage ≥ 80% of business logic.
6. Dependency audit (no critical vulnerabilities).
7. Frontend build verification (Next.js build; Filament panel build).
8. OpenAPI specification matches the implemented routes.

A pull request that fails any gate does not merge. No gate is skipped by a developer; only the pipeline configuration (owned by the team lead) can change a gate, and the change is recorded.

### 4.2 Staging deploy (automatic)

- On merge to `main`, after the gates pass, staging deploys automatically.
- The staging deploy runs migrations, clears caches, restarts the worker and scheduler, and runs a smoke-test suite (login, public home, tracking, donor search, finance ledger).
- A failed staging deploy blocks the release and alerts the team; production is never deployed from a commit that failed on staging.

### 4.3 Production deploy (manual approval only)

- A production deploy is triggered by a named person approving the release in GitHub Actions. Approval requires: the staging deploy succeeded, the smoke tests passed, the UAT sign-off for the phase exists (Doc 10 §10), and the pre-deploy backup (§6) completed.
- The production deploy: takes the pre-deploy backup, deploys the new image, runs migrations, clears caches, restarts the worker/scheduler, and runs the same smoke tests against production.
- **Migrations:** run automatically as part of the deploy. DDL is not transactional on MariaDB 11.8.9: a failed migration does NOT roll back automatically — one DDL statement per migration, idempotent migrations, and the pre-deploy backup is the only rollback (Doc 06 §10, ADR-003 as superseded by 16-MARIADB-ADDENDUM.md). A migration that fails stops the deploy.
- **Rollback:** the previous release is kept available (previous image + previous code). If the smoke tests fail after a production deploy, the deploy is rolled back to the previous release; if data changed, the pre-deploy backup is restored following the restore procedure (§6). Rollback is rehearsed, not improvised.

## 5. Secrets

- Production secrets live in the server's environment (`.env` on the VPS, readable only by the application user) or in the platform's secret store. The rules in Doc 08 §3.14 apply in full: **`.env` is never in git, never in a backup, never pasted into chat, never emailed.**
- Staging and production use different secrets. Development uses local-only secrets.
- The CI/CD pipeline holds deployment credentials as GitHub Actions secrets; they are never printed in logs.
- Secret rotation: on staff departure, on suspected leak, and on schedule for the most sensitive secrets (APP_KEY rotation requires a migration plan for encrypted columns — Doc 08 §3.14).

## 6. Monitoring

| Check | Frequency | Alert condition |
|---|---|---|
| Uptime (health endpoint: database, queue, cache, storage) | Every 5 minutes | Any failure, or latency above the threshold for two consecutive checks |
| Error rate (5xx responses) | Continuous | Above the baseline for 10 minutes |
| Error tracking (Sentry-style) | Continuous | Any new exception type in production |
| Queue | Every 5 minutes | Failed jobs > 0; queue depth growing for 15 minutes; worker not running |
| Disk usage | Every 15 minutes | Above 80%; above 90% is critical |
| Certificate expiry | Daily | Expiry within 14 days (renewal should have happened automatically) |
| Backup success | Daily (after the nightly run) | Backup failed, or backup size changed by an implausible amount |
| Audit-log anomalies | Daily review | Unusual patterns (many failed logins, many 403s from one account, a phone-reveal spike) |

- **Monthly health report:** a short written report (uptime, error counts, queue health, backup status, dependency audit result) produced monthly for the organisation. It is a plain-language summary, not a log dump.
- **Alerting:** alerts go to a named channel/person (to be confirmed before go-live — the on-call contact is an open decision, Doc 12 Phase 9). An alert nobody reads is not monitoring.
- **Log retention:** application logs 90 days (proposed — confirm in Sprint 1, Doc 08 §14 item 6); audit logs retained for the life of the system.

## 7. Backup and disaster recovery

Per Engineering Plan v1.1 (RPO 24h / RTO 4h) and Research Notes §7.5 (spatie/laravel-backup v10).

### 7.1 Backup policy

- **Tool:** `spatie/laravel-backup` v10 (resolve the exact version at install time; use the package's current major for Laravel 13).
- **Schedule:** nightly `backup:run` — database (`mysqldump`) + uploaded files (`storage/app/public` and the private disk).
- **Destinations:** **local disk + one off-server S3-compatible disk.** The package's own documentation warns that a local-only backup is worthless if the disk fails ("If you only use the local disk … and that disk crashes you will have nothing left but tears" — Research Notes §7.5). The off-server copy is mandatory, not optional.
- **Cleanup:** `backup:clean` on schedule (retention: daily backups for 30 days, weekly for 12 weeks, monthly for 12 months — decided Phase 0.1, Doc 06 §13).
- **Exclusions:** `storage/framework` (cache/views/sessions) is excluded. `.env` is **never** in a backup.
- **Encryption:** backups are encrypted at rest on the off-server disk where the provider supports it; access is restricted to the deployment identity (Doc 08 §3.13).

### 7.2 Recovery objectives

| Objective | Value | Meaning |
|---|---|---|
| **RPO (Recovery Point Objective)** | **24 hours** | At most 24 hours of data can be lost — i.e. the nightly backup is the recovery point |
| **RTO (Recovery Time Objective)** | **4 hours** | The system is restored and serving traffic within 4 hours of a disaster being declared |

These are the Engineering Plan v1.1 objectives, repeated here as plan objectives. They are achievable with a nightly backup and a documented restore procedure; they are not a guarantee of a specific incident's outcome.

### 7.3 Restore rehearsal

- **Quarterly restore rehearsal (mandatory, documented).** Every quarter, the latest backup is restored to a disposable environment and verified: the application boots, logins work, a request can be tracked, the ledger totals match, and the file count matches. The result is recorded (date, backup used, duration, issues found). A rehearsal that fails is a high-priority incident, not a note for later.
- The monthly restore test required by the Decision Sheet (spatie/laravel-backup, monthly restore test) is satisfied by the quarterly rehearsal plus a monthly automated restore-to-disposable-environment check; the cadence is: monthly automated restore check + quarterly full restore rehearsal, mandatory, documented (Doc 06 §13).

### 7.4 Disaster scenarios (outline)

| Scenario | Response |
|---|---|
| Accidental deletion of a record | Restore the record from the audit log / soft-delete (preferred); restore from backup only if the record is hard-deleted |
| Database corruption | Restore the latest backup to a fresh database; verify totals; switch over |
| Full VPS loss | Provision a replacement VPS from the documented setup, restore the latest off-server backup, re-point DNS, verify with smoke tests |
| Compromised admin account | Revoke tokens/sessions, disable the account, rotate affected secrets, review the audit log, restore altered data from backup if needed (Doc 08 §12) |
| Ransomware / encryption of the VPS | Do not pay. Rebuild from the documented setup and the off-server backup (which the attacker cannot reach if its credentials are separate) |

## 8. Release process and change control

- **Releases are versioned** (semantic versioning for the application; the API version is separate — Doc 07 §2). Every release has a changelog entry: date, version, changes, migration notes, and the phase it belongs to.
- **New features arrive as written Change Requests.** A Change Request states: what is wanted, why, which module it affects, what it costs in time (estimate), and what it changes in this blueprint. It is approved in writing by the organisation (through Fahim as the delivery lead) before work starts. Work that is not in an approved Change Request does not ship.
- **No silent scope changes.** If a build reveals that a requirement is wrong or incomplete, the correction is a Change Request, not a quiet edit. The blueprint is updated to match the approved change.
- **Emergency fixes:** a production bug that affects availability, security, or data integrity may be fixed on a fast track (fix → tests → staging smoke → production with approval), but the fix is still recorded as a Change Request afterwards, and the regression test is added (Doc 10 §3).

## 9. Support and warranty model

- **Defect-fix warranty: 30 days after go-live** (per Engineering Plan v1.1). Defects — behaviour that contradicts this blueprint or the phase's acceptance criteria — are fixed at no additional charge within the warranty period. The warranty covers defects, not new features and not changes the organisation requests after go-live (those are Change Requests).
- **Severity and response:** critical (system down, data loss, security breach) — immediate triage; high (a core workflow broken) — within one working day; medium/low — scheduled into the next maintenance window. Exact response times are agreed in writing before go-live.
- **Optional maintenance contract:** after the warranty period, the organisation may enter a maintenance contract (monitoring, updates, backups, small fixes). **No prices are stated in this blueprint** (per Decision Sheet: no prices anywhere in the blueprint; the quotation is separate).
- **Support channel:** a single named channel (to be confirmed before go-live) for the organisation to report issues. Issues are tracked in the project's issue tracker with a severity and a status; nothing is tracked by chat message alone.

## 10. Handover checklist

To be completed at the end of the programme (Phase 9, Doc 12). Every item must be checked before handover is signed off.

- [ ] **Source code** in the organisation's GitHub repository (organisation-owned, not a personal account), with the full history, the README, and this blueprint.
- [ ] **Full access transfer:** GitHub repository ownership/admin, VPS root/SSH access, domain registrar access, DNS access, SSL/Cloudflare access, backup-disk access, and the admin (Super Admin) account — all in the organisation's hands, with the credentials recorded in the organisation's own secure store (not in chat, not in email).
- [ ] **Documentation:** this blueprint (updated to as-built), the API OpenAPI specification, the runbook (deploy, backup/restore, common incidents), and the monthly health-report template.
- [ ] **Admin training session + recording:** a live walkthrough for the Super Admin(s) covering the dashboard modules (Doc 09), member approval, password resets, finance publish/reverse, and reading the audit log. The session is recorded and the recording is handed over.
- [ ] **Helper training:** a short walkthrough for Expatriate Helpers covering the queue, status transitions, and expense entry.
- [ ] **Developer access revocation process:** a written procedure — when the delivery team's access ends, every credential they held is rotated (SSH keys removed, GitHub access removed, API tokens revoked, backup-disk credentials rotated), and the rotation is verified and recorded. The procedure is executed at handover and the record is signed by both sides.
- [ ] **Data handover:** confirmation that all real data in the system belongs to the organisation, that demo data has been removed, and that the organisation holds a current backup.
- [ ] **Support/warranty terms** in writing (see §9), with the named support channel and the named incident contact.

## 11. Open operations decisions (for Sprint 1 / Phase 9)

1. Whether the Next.js public website runs on the same VPS or on separate hosting.
2. The on-call / incident contact and the alert channel.
3. Backup retention periods (daily/weekly/monthly). — **Decided (Phase 0.1):** daily 30 days / weekly 12 weeks / monthly 12 months (Doc 06 §12).
4. Log retention period (shared with Doc 08 §14 item 6).
5. The exact restore-rehearsal cadence split — **Decided (Phase 0.1):** monthly automated check + quarterly full rehearsal (Doc 06 §13); the runbook adoption is DB-3 (Doc 06 §16).
6. The organisation's domain name and DNS delegate.
7. Whether Cloudflare is enabled, and the trusted-proxy configuration if it is.
