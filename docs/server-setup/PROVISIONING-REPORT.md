# Database Provisioning Report — Satanipara Community

**Date:** 2026-11-14 (evening, Asia/Dhaka)
**Server:** Hostinger shared `us-bos-web1454`, `satanipara.asf.run`
**Database server:** MariaDB **11.8.9-MariaDB-log** at `127.0.0.1:3306`
**App:** Laravel 13.42.0 + PHP 8.4.27 (`/opt/alt/php84/usr/bin/php`)
**Status:** **Provisioned and verified — with four owner actions still open (see §8).**
No passwords are recorded in this document. Usernames and the database name
alone are not secrets; every password lives only in the secure vault.

---

## 1. What Fahim provisioned (hPanel, 2026-11-14)

| Item | Value |
|---|---|
| Database | **`u263467780_satina6para86`** — note the spelling: `satina6para86`, not `satanipara`. Use it exactly; do not "correct" it. |
| Database user (main) | `u263467780_satina6para86` (host part `127.0.0.1`) |
| MySQL host for the app | `127.0.0.1`, port 3306 |

`identities.sql` and `hpanel-db-setup.md` have been updated to these names
(they previously assumed `u263467780_satanipara`). The local generator
(`generate-identities.py`, Worker C work folder) was updated the same way.

## 2. Verification of the provisioned database (Step 1 — VERIFIED)

Run over SSH with the MariaDB client, 2026-11-14 ~20:30 Dhaka:

| Check | Result |
|---|---|
| Database exists | Yes — `u263467780_satina6para86` present |
| Tables in the database | **0** (empty, as provisioned) |
| `SELECT VERSION()` | `11.8.9-MariaDB-log` |
| Server charset / collation | `utf8mb4` / `utf8mb4_unicode_ci` |
| `@@sql_mode` (server default session) | `NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION` — no `STRICT_TRANS_TABLES`, no `ONLY_FULL_GROUP_BY` (see §4: Laravel's strict mode supplies both on the app connection) |
| `@@innodb_ft_min_token_size` | `3` (matches the local 11.8.9 benchmark) |
| `@@innodb_snapshot_isolation` | `1` (ON — the 11.8 default) |
| Main user grants | `USAGE on *.*` (MAX_USER_CONNECTIONS 75, MAX_STATEMENT_TIME 120) + `ALL PRIVILEGES on u263467780_satina6para86.*` only |
| `CREATE DATABASE` as main user | **DENIED — ERROR 1044 (42000)** (probe created nothing; verified by the error) |
| `CREATE USER` as main user | **DENIED — ERROR 1227 (42000)** (probe created nothing) |
| `SELECT` on `mysql.user` | **DENIED — ERROR 1142 (42000)** |

Consequence: **no database user can be created from SSH or the application.**
The four least-privilege identities can only be created in hPanel +
phpMyAdmin (see §8, action 1). The same two denials block the
production re-runs that need a scratch database (see §6).

## 3. The four identities (Step 2 — PREPARED, NOT CREATED)

| # | Username (adapted) | Intended use | State |
|---|---|---|---|
| 1 | `u263467780_satina6para86_app` | Laravel runtime (`.env` `DB_USERNAME`) — the only user the app ever connects as | **Not created** — needs hPanel + phpMyAdmin (see §8.1). Per-table grants need the migrations run first. |
| 2 | `u263467780_satina6para86_mig` | Deploy pipeline only (DDL + DML on this DB only). Never in `.env`. | **Not created** — needs hPanel + phpMyAdmin. |
| 3 | `u263467780_satina6para86_bkp` | Backup (`SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER`) | **Not created** — needs hPanel + phpMyAdmin. |
| 4 | `u263467780_satina6para86_rep` | Finance Auditor read-only (4 finance tables + column-level `users`) | **Must not exist yet** — create only when the Finance Auditor role is actually needed. |

Exact grants: `docs/backend-architecture/identities.sql` (adapted).

**Host correction (2026-11-14):** the identities originally used
`@'localhost'`. That is wrong for this host: in MariaDB `localhost` means
the Unix socket only, and the Laravel app connects over TCP `127.0.0.1`
(proven by the main user's grants, §2). A `'localhost'` `_app` user could
not log in from the app. All four identities now use `@'127.0.0.1'` in
`identities.sql`, `hpanel-db-setup.md`, and the local generator.
Exact hPanel + phpMyAdmin steps: `docs/backend-architecture/hpanel-db-setup.md`
(adapted; its §4 phpMyAdmin step is the only way to apply the grants).

## 4. Laravel switched to MariaDB (Step 3 — VERIFIED, with 2 fixes)

`.env` backup first: `~/backups/satanipara/.env.sqlite.20261114-2030` and
`~/satanipara-app/.env.sqlite.bak` (mode 600 preserved). Then switched:

```
DB_CONNECTION=mariadb
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=u263467780_satina6para86
DB_USERNAME=u263467780_satina6para86
DB_PASSWORD=<vault only — never written here>
```

**Temporary deviation (flagged, not hidden):** the runtime user is the main
user, which has `ALL PRIVILEGES` on this one database — not the least-privilege
`_app` user. This stands only until action §8.1 is done, then `.env` switches
to `_app`. The app never had, and must never get, the `_mig` user.

Verification (PHP 8.4 CLI — the default `php` is 8.1.34 and cannot run this
app; always use `/opt/alt/php84/usr/bin/php`):

| Check | Result |
|---|---|
| `php artisan db:show` | MariaDB 11.8.9, mariadb, `u263467780_satina6para86`, 127.0.0.1:3306, 0 tables |
| `php artisan migrate:status` | `ERROR: Migration table not found` — expected; no migrations have run |
| Session `@@sql_mode` (app connection) | `ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION` — Laravel strict mode works (V-SQL-01 resolved for the app connection) |
| `https://satanipara.asf.run/health` | 200, `{"status":"ok",...,"laravel":"13.42.0","php":"8.4.27"}` |
| Homepage `https://satanipara.asf.run/` | 200 |
| `config('app.timezone')` / session `time_zone` | `Asia/Dhaka` / `+06:00` (see fixes below) |

**Fix 1 — DB session timezone (found and fixed 2026-11-14):** adding
`'timezone' => env('DB_TIMEZONE', 'Asia/Dhaka')` to the `mariadb`
connection broke every DB query with `SQLSTATE[HY000] 1298 Unknown or
incorrect time zone: 'Asia/Dhaka'` — this host's MariaDB has no time-zone
tables loaded, so named zones are unavailable. Fixed by using the numeric
offset `'Asia/Dhaka'` → `'+06:00'` (Asia/Dhaka is UTC+06:00 year-round, no
DST). `config/database.php` line 78 now reads
`'timezone' => env('DB_TIMEZONE', '+06:00')`. Verified: session
`time_zone = +06:00`, queries work.

**Fix 2 — app timezone (found and fixed 2026-11-14):** `config/app.php`
hardcoded `'timezone' => 'UTC'`, so the `.env` value `APP_TIMEZONE=Asia/Dhaka`
was ignored and the app ran on UTC. Fixed to
`'timezone' => env('APP_TIMEZONE', 'Asia/Dhaka')` (line 68). Verified:
`config('app.timezone') = Asia/Dhaka`.

## 5. Ledger / trigger re-run on the provisioned database (Step 4 — PARTIAL)

The acceptance suite (`docs/backend-architecture/tests/ledger-suite/`) was
adapted to the provisioned database (scratch-database name replaced; the
`DROP/CREATE DATABASE` lines removed — the suite cannot create databases
here) and run as the main user. **23 of 43 checks ran; the other 19 need the
four identities and could not run.**

| File | Result |
|---|---|
| `01-setup.sql` | Exit 0, **0 errors** — 9 tables created (incl. `ledger_entries`, `ledger_reversals`, `activity_log`, `sequences` + stubs) |
| `02-triggers.sql` | Exit 0, **0 errors** — **7 triggers** created (`trg_ledger_entries_bu/bd`, `trg_ledger_reversals_bi/bu/bd`, `trg_activity_log_bu/bd`) |
| `03-test-cases.sql` | Exit 0 — `ERROR 1644` × **43**, `ERROR 4025` × **5**, `ERROR 1062` × **1**, total 49, **0 other errors** — exactly the expected counts |
| L-17 final state | **Exact match**: 13 ledger rows (LE-2026-0001 reversed/1200.00, LE-2026-0002 discarded/500.00, LE-2026-0003 published/−1200.00, LE-2026-0005 published/750.00, LE-2026-0012 reversed/2000.00, …), 2 reversal rows, LE-2026-0002 a permanent gap |
| `05` double-publish race | **PASS twice** — first run: row `LE-R202611141440` published by approver 22; second run: session A 1 row, session B 0 rows, `RACE RESULT: PASS — exactly one winner`, exit 0 |
| Privilege cases `04a–04e` (19 checks) | **NOT RUN** — they need `CREATE USER`, which is denied here. They run only after §8.1. |
| Cleanup | All 9 test tables dropped (two attempts — the first failed on FK order, error 1451, then dropped with `FOREIGN_KEY_CHECKS=0`). **Verified afterwards: 0 tables, 0 triggers** — the database is exactly as provisioned (empty). |

## 6. Probes (Step 4, continued)

| Probe | Status |
|---|---|
| **U-03** per-table `REVOKE DELETE` provability (V-PRIV-01) | **BLOCKED** — the test revokes from the `_app` user, which does not exist yet. Runs after §8.1. |
| **U-05** backup + restore rehearsal with triggers (V-BKP-02) | **PARTIAL** — dump leg VERIFIED (see §7): `mariadb-dump` exit 0, 28,305 bytes, all 7 triggers in the dump, `Dump completed`. Restore leg **BLOCKED** — no scratch database can be created (no `CREATE DATABASE`); it also needs the migrated schema with triggers. Runs after migrations + §8.2. |
| **U-08** full migration suite (V-SCHEMA-01) | **BLOCKED** — migrations need Fahim's separate approval of the migration plan (§8.4). Nothing was migrated. |
| Bengali search production re-run (V-SEARCH-01) | **BLOCKED** — the runner needs its own scratch database (`bench`), which cannot be created here. Runs after §8.2. The local MariaDB 11.8.9 numbers (35 cases / 171 queries) stand; no production numbers are claimed. |
| **M-1 / M-2** (CHECK error 4025; `approved_by` FKs `ON DELETE RESTRICT`) | Re-confirmed on the provisioned server by the 03 run (4025 × 5, no 3819). |

## 7. Backups + scheduler (Step 5 — VERIFIED, with 2 honest limits)

| Item | Result |
|---|---|
| `mariadb-dump` manual test | Exit 0, `~/backups/satanipara/satanipara-db-20261114-2045.sql`, 28,305 bytes, 7 triggers, `Dump completed on 2026-11-14 14:42:03`, no errors |
| Backup tool | **spatie/laravel-backup ^10.4** installed with PHP 8.4 + Composer 2.9.8 (blueprint tool, Doc 11 §7.1). First attempt failed on a wrong flag (`--no-dev` does not exist for `composer require` in 2.9.8); retried without it. `config/backup.php` published. |
| `php artisan backup:run --only-db` | **Backup completed!** — `db-dumps/mariadb-u263467780_satina6para86.sql` (1,098 bytes, empty DB) zipped to `storage/app/private/Satanipara Community/2026-11-14-20-46-03.zip` (516 B) on disk `local` |
| Schedule (`routes/console.php`) | `backup:run --only-db` daily 02:00; `backup:clean` daily 03:00 — both listed by `schedule:list` |
| Retention (blueprint 30d / 12w / 12m) | Set in `config/backup.php`: daily 30, weekly 12, monthly 12 |
| `.env` backup | `~/backups/satanipara/.env.sqlite.20261114-2030` (mode 600) — `.env` is never inside a database backup (blueprint rule) |

**Limit 1 — local disk only (flagged):** the blueprint mandates an off-server
S3-compatible copy; only `local` is configured. That needs Fahim's S3
choice + credentials — see §8.3. Until then, a disk failure would lose the
backups; this is recorded, not hidden.

**Limit 2 — backup runs as the main user:** `backup:run` currently dumps as
the main database user, not `_bkp` (which does not exist yet). Switches to
`_bkp` after §8.1.

**hPanel cron (Fahim must add — it cannot be added over SSH):**
hPanel → Advanced → Cron Jobs → Common Settings "Once Per Minute", command:

```
cd /home/u263467780/satanipara-app && /opt/alt/php84/usr/bin/php artisan schedule:run >> /dev/null 2>&1
```

## 8. What still needs Fahim (REQUIRES OWNER ACTION)

1. **Create the four database users** — hPanel → MySQL Databases, then
   phpMyAdmin → SQL with `identities.sql` (adapted names). Steps:
   `docs/backend-architecture/hpanel-db-setup.md`. Usernames:
   `u263467780_satina6para86_app`, `_mig`, `_bkp`, `_rep` (create `_rep`
   only when the Finance Auditor role is needed). Passwords: generate
   ≥32 random characters each, straight into the **secure vault — never
   chat**. After step 4 is applied: switch `.env` `DB_USERNAME` to
   `_app`, switch the backup job to `_bkp`, then re-run the privilege
   suite (19 checks) + probe U-03.
2. **Create a scratch database for verification** — hPanel → MySQL
   Databases, e.g. `u263467780_bench` (any name; the benchmark runner
   drops/recreates it). Needed for: the Bengali search production
   re-run, the U-05 restore rehearsal, and any future scratch work.
   It must never hold real data and can be deleted after the re-runs.
3. **Off-server backup destination** — choose the S3-compatible provider
   + bucket + credentials (vault only), so the backup job gets its
   mandatory second copy. Until then backups are local-only (§7 limit 1).
4. **Approve the migration plan** — this report is the basis. Only after
   approval: verified backup → migrations (13-step order, Doc 06 §10)
   with the `_mig` user → provisioning probes U-03/U-05/U-08 → production
   re-runs. **No migration has run; no schema exists.**

## 9. Welcome-page mobile fix (additional step — VERIFIED)

Fahim's phone screenshot showed the stock Laravel welcome hero's giant
"Laravel" wordmark and big "13" clipped at the right edge on mobile.
Cause confirmed in `resources/views/welcome.blade.php`: the "13" artwork
(line 153) is a **fixed `w-[438px]` SVG with `max-w-none`** inside a card
that is at most 335px wide on phones — ~94px of it is cut off at the right
edge. The built CSS asset is fine (`app-CZFi4ycj.css`, 200) — this was
not missing CSS.

Minimal fix (placeholder only — no new homepage, no rebuild, no new
Tailwind classes): a `<style>` block before `</head>` in `welcome.blade.php`:

- `html, body { overflow-x: hidden; }` — no page-level horizontal scroll.
- Below the `lg` breakpoint (1023px): the "13" SVG
  (`svg[viewBox="0 0 440 392"]`) becomes `width: 100%`, `margin-left: 0`,
  `margin-top: -4.5rem` (proportional to the 438px original's −6.6rem);
  the wordmark SVG gets `max-width: 100%`.
- Desktop unchanged (media query only).

Verification: `view:clear` run; homepage 200 (36,433 bytes) with the
`<style>` block present in the served HTML (confirmed from the VM);
CSS asset 200; `/health` 200; `db:show` still healthy; `schedule:list`
still shows both tasks. A 360px pixel screenshot could not be captured
from this VM (the headless shell cannot reach the site:
`ERR_TUNNEL_CONNECTION_FAILED`, while curl works) — **Fahim's phone
check remains the final visual proof** for this fix.

## 10. Files changed on the server (not in the repo)

| File | Change |
|---|---|
| `.env` | sqlite → MariaDB (backed up first, §4) |
| `config/database.php` | Added `'timezone' => env('DB_TIMEZONE', '+06:00')` to the `mariadb` connection (line 78) |
| `config/app.php` | `'timezone' => 'UTC'` → `env('APP_TIMEZONE', 'Asia/Dhaka')` (line 68) |
| `resources/views/welcome.blade.php` | Mobile `<style>` fix before `</head>` (§9) |
| `routes/console.php` | Two `Schedule::command(...)` lines appended (backup 02:00, clean 03:00) |
| `composer.json` / `composer.lock` / `vendor/` | spatie/laravel-backup ^10.4 installed |
| `config/backup.php` | Published; retention set to 30 / 12 / 12 |
| `~/backups/satanipara/` | `.env.sqlite.20261114-2030`, `satanipara-db-20261114-2045.sql` (test-data dump) |
| `storage/app/private/Satanipara Community/` | `2026-11-14-20-46-03.zip` (first `backup:run` output) |

No dashboard, no modules, no migrations, no changes to the Direction D
public website, no DNS changes. No production schema was created or
modified — the database is empty (0 tables, 0 triggers, verified after
cleanup).
