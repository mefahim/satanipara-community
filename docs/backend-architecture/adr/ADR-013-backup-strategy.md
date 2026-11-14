# ADR-013 — Backup strategy (spatie/laravel-backup v10, off-server, restore tests)

| | |
|---|---|
| Status | **Confirmed** |
| Date | 2026-11-14 |
| Sources | Research Notes §7.5 (spatie.be/docs/laravel-backup/v10 — primary, "Taking backups", checked 2026-11-14); Decision Sheet; Engineering Plan v1.1 (RPO 24h / RTO 4h — agreed); Doc 11 §7 |

## Context

The platform's data — members, requests, donors, finance — is the organisation's data, and its loss would be irreplaceable (much of it exists nowhere else). The prototype had no backend and therefore no backup at all. The backup strategy must cover the database and the uploaded files, must survive the loss of the VPS itself, and must be proven by actually restoring — because untested backups are the common failure mode, and the package's own documentation says so.

## Options considered

1. **spatie/laravel-backup v10** — nightly `backup:run` (database + files) to local + one off-server S3-compatible disk, `backup:clean` on schedule, monthly automated restore check + quarterly full restore rehearsal (mandatory, documented).
2. **Manual `mysqldump` + `rsync` scripts** — workable, but hand-rolled: no cleanup, no health monitoring, no notifications, and the scripts themselves become unmaintained code.
3. **Provider-level snapshots only** (VPS snapshots) — useful for full-server recovery, but coarse (whole disk), provider-locked, and not a substitute for a restorable database + files backup.
4. **No backup to start, added "later"** — rejected outright. A system that has run without backups has already accepted data loss; "later" is when the loss happens.

## Advantages

- **One package, both halves:** a zipped archive of the database (via the native binary — `mysqldump` for MySQL) and the files, in a single command (`php artisan backup:run`, with `--only-db`, `--only-files`, `--only-to-disk=…` options).
- **Off-server by configuration:** the destination is one or more Laravel filesystem disks (`config/backup.php` → `destination.disks`). The package's own documentation warns, verbatim: "If you only use the local disk … and that disk crashes you will have nothing left but tears." The off-server disk is therefore mandatory in this ADR, not a nice-to-have.
- **Cleanup and health monitoring built in:** `backup:clean` prunes old backups; health monitoring and notifications are included.
- **Restorable with standard tools:** a backup is a zip containing a database dump and files — restorable with `mysql` and an unzip, even without the package.

## Disadvantages

- **Requires the native dump binary on `PATH`** (`mysqldump` — or `dump.dump_binary_path` per connection in the package config). If the binary is missing from the container image, backups silently fail — so the backup job's success is monitored and alerted (Doc 11 §5), not assumed. The app image must contain `mysqldump` (Phase 0.1, CK-13).
- **Not compatible with Windows servers** — irrelevant here (Ubuntu 24.04 LTS, ADR-012).
- **The package does not restore for you:** restore is a procedure (documented in the runbook, rehearsed quarterly — Doc 11 §7.3), not a button. The discipline is the team's, not the package's.
- **Backup contents are sensitive:** a backup contains the full database, including encrypted phone columns. It is as sensitive as the database itself (Doc 08 §3.13) and must be treated that way.

## Security implications

- Backups are encrypted at rest on the off-server disk where the provider supports it; access is restricted to the deployment identity; backup files are never emailed, never stored on a developer's laptop, and never committed to a repository.
- **`.env` is never in a backup.** An unencrypted `.env` in a backup would hand an attacker the APP_KEY and every credential.
- `storage/framework` (cache/views/sessions) is excluded — it is regenerable and only bloats the backup.
- The restore rehearsal is performed in a disposable environment, and the rehearsed data is wiped afterwards (Doc 11 §7.3).

## Scalability implications

- Nightly full backups are adequate at this scale. If the database grows large, the strategy is revisited (incremental backups, binary-log based point-in-time recovery) — that is a future ADR, not a day-one requirement. The RPO of 24 hours (Doc 11 §7.2) is the constraint that makes nightly full backups sufficient.

## Maintenance implications

- The schedule is: nightly `backup:run`, `backup:clean` on schedule, monthly automated restore-to-disposable-environment check, **quarterly full restore rehearsal (mandatory, documented)** — the result is recorded (date, backup used, duration, issues found) and a failed rehearsal is a high-priority incident (Doc 11 §7.3).
- Retention (decided Phase 0.1, Doc 06 §13): daily backups for 30 days, weekly for 12 weeks, monthly for 12 months.
- The package version is resolved at install time (v10 is the current major for Laravel 13; the exact patch is secondary/unverified — Research Notes §9 item 5). **Effective PHP floor is 8.4:** spatie/laravel-backup v10.4.0 requires `php ^8.4` (v10.3.3 allowed `^8.3`) — see ADR-002.

## Final recommendation

**spatie/laravel-backup v10, from day one: nightly backup of the database + uploaded files to local + one off-server S3-compatible disk, `backup:clean` on schedule, with a mandatory documented restore test (monthly automated check + quarterly full rehearsal). RPO 24h / RTO 4h (per Engineering Plan v1.1).**

## Reason for selection

It is the maintained, first-party-adjacent tool for exactly this job, it is what Engineering Plan v1.1's RPO/RTO assumes, and it makes the off-server copy — the part that actually saves the organisation when the VPS is lost — a configuration line rather than a separate project. The hand-rolled alternative would be less capable and less maintained; snapshots alone are not a database-restorable backup; and starting without backups is not an option that can be recommended to any organisation.
