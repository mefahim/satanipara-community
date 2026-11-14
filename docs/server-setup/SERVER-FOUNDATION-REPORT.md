# Satanipara Community — Server Foundation Report

**Project:** Satanipara Community (Satanipara Somaj Kallyan Sangha, est. 1999)
**Domain:** https://satanipara.asf.run
**Phase:** Phase 1 — Server Infrastructure Preparation (foundation only)
**Date:** 2026-11-14
**Server:** 82.197.83.14 (Hostinger shared hosting, host `us-bos-web1454.main-hosting.eu`)
**Status labels used in this document:** VERIFIED / NOT VERIFIED / BLOCKED / REQUIRES OWNER ACTION

> Scope: this report covers server discovery, compatibility validation, directory
> architecture, database readiness, security foundation, the Laravel 13 application
> foundation, the frontend toolchain, and acceptance tests. No admin dashboard and
> no member / finance / service modules were built. No credentials or secrets are
> included in this document.

## 1. Server environment inventory — VERIFIED

| Item | Finding |
|---|---|
| Operating system | CloudLinux (LVE kernel 4.18.0-553.157.1.lve.el8.x86_64), x86_64 |
| Host | `us-bos-web1454.main-hosting.eu` (Hostinger shared hosting) |
| SSH user | `u263467780`, no root, no `sudo` (command not found) |
| Home | `/home/u263467780` |
| Web server | LiteSpeed (PHP runs as `litespeed` SAPI; CDN edge `hcdn` in front) |
| Disk | Shared 21 TB filesystem, 11 TB available (account quota not visible from SSH — see §10) |
| Memory | Host total 515 GB (shared; per-account LVE limits not visible from SSH) |
| Git | 2.43.7 |
| Tools | `unzip`, `curl`, `wget`, `tar`, `rsync`, `sqlite3` 3.26.0, `python3` |
| Cron (SSH) | No `crontab` binary — cron is available only through the hPanel "Cron Jobs" screen |
| SSH keys | `~/.ssh/` contains only `known_hosts`; no key pair, no `authorized_keys` yet |
| Existing sites | 14 other domains under `~/domains/` — none touched by this work |

## 2. Actual versions — VERIFIED

| Component | Version | How verified |
|---|---|---|
| PHP (CLI, default) | 8.1.34 (`/usr/bin/php`) | `php -v` |
| PHP (project CLI) | **8.4.27** (`/opt/alt/php84/usr/bin/php`) | `php -v` |
| PHP (web, before) | 8.3.36 | `X-Powered-By` header + probe file |
| PHP (web, now) | **8.4.27** | `.htaccess` handler test + `/health` JSON |
| PHP (also available) | 8.5.12 (`/opt/alt/php85`), 8.2, 8.3, 8.1–7.0, 5.2–5.6 | directory listing |
| PHP extensions (8.4) | All 19 checked present: ctype, curl, dom, fileinfo, filter, hash, mbstring, openssl, pcre, pdo, session, tokenizer, xml, bcmath, gd, intl (ICU 71.1), zip, pdo_mysql, redis, pcntl, plus opcache, imagick, memcached, soap, exif | `php -m` + extension probe |
| PHP extension gap | `sodium` is **absent** on PHP 8.4/8.5, **present** on PHP 8.3 | `php -m` per version |
| Composer | 2.9.8 (`/usr/local/bin/composer`), works with PHP 8.4 | `composer --version` |
| Node.js | **24.22.3**, npm **11.19.1** (`source /opt/alt/alt-nodejs24/enable`) | `node --version`, `npm --version` |
| Node.js (also) | 20.20.2 / npm 10.8.2 (`alt-nodejs20`) | same |
| Database client | MariaDB client 11.8.9 (`mysql`, `mysqldump`, `mariadb`) | `mysql --version` |
| Database server | **MariaDB 11.8.9** (`11.8.9-MariaDB-log`, `mysql_native_password`) listening on `127.0.0.1:3306` | TCP handshake banner, no login attempted |
| Laravel | **13.42.0** | `artisan --version`, `composer.lock` |
| Tailwind CSS | v4 (`@tailwindcss/vite ^4.0.0`, `tailwindcss ^4.0.0`) | `package.json` |
| Vite | 8.0.0 (`laravel-vite-plugin ^3.1`) | `package.json` |

## 3. Hosting restrictions — VERIFIED

- **No root / sudo.** All work is inside the account home directory.
- **No system package installation.** No `apt`, no global installs; only user-space tools
  (CloudLinux PHP/Node selectors, Composer, npm) were used.
- **No SSH `crontab`.** Scheduled tasks must be created in hPanel → Cron Jobs.
  Exact command for the owner is in §9.
- **Loopback TCP listeners are blocked.** A PHP built-in server process starts and
  reports "Server running", but TCP connections to `127.0.0.1:<port>` are refused
  (verified with `php -S`, `curl`, and `/dev/tcp`). Consequence: `php artisan serve`
  cannot be used for testing on this host; testing is done through LiteSpeed +
  the real domain. Queue workers (`artisan queue:work`) do not listen on TCP and
  are unaffected. No Redis server is provided on shared hosting (the `redis`
  PHP extension exists but there is no server to connect to) — queue/cache use
  the database/file drivers (see §5).
- **PHP version is selectable per directory** via CloudLinux `.htaccess` handler:
  `AddHandler application/x-httpd-alt-php84___lsphp .php` switches the web PHP
  from 8.3.36 to 8.4.27 (verified live). The hosting panel default for this
  domain was PHP 8.3.
- **Disk quota** is not visible from SSH (`quota` not installed); the hPanel
  shows the account quota.

## 4. Directory architecture — VERIFIED

```
/home/u263467780/
├── satanipara-app/                 # Laravel 13 application (private, NOT web-accessible)
│   ├── app/ bootstrap/ config/ database/ resources/ routes/ storage/ vendor/
│   ├── .env                        # mode 600, outside the document root
│   └── public/                     # the ONLY web-exposed directory
│       ├── index.php
│       ├── .htaccess               # Laravel rewrites + PHP 8.4 handler line
│       └── build/                  # compiled Vite assets
└── domains/satanipara.asf.run/
    ├── DO_NOT_UPLOAD_HERE          # host marker, untouched
    ├── default.php.preserved       # Hostinger "Coming soon" placeholder, MOVED not deleted
    └── public_html -> /home/u263467780/satanipara-app/public   # symlink (verified working)
```

- The document root is a symlink to `satanipara-app/public`; LiteSpeed follows
  symlinks (verified: a test symlink outside the docroot served PHP 8.4.27 with
  HTTP 200 before the swap).
- The Laravel source, `.env`, `vendor/`, `storage/` and `database/` live outside
  the document root. Only `public/` is exposed.
- The whole Laravel project was **not** copied into `public_html`.
- No other domain directory was modified.

## 5. Security configuration — VERIFIED

- `.env` permissions `600` (owner read/write only); all other files `644`,
  directories `755`; **no `777` permissions** anywhere in the application
  (the only `777` entry reported by `find` is the `public/storage` symlink
  itself, which is a symlink, not a directory).
- `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://satanipara.asf.run`.
- `APP_KEY` generated by `composer create-project` and present in the server
  `.env` only (never printed, never committed).
- Session: `SESSION_DRIVER=file`, `SESSION_SECURE_COOKIE=true`,
  `SESSION_HTTP_ONLY=true`, `SESSION_SAME_SITE=lax`.
- Logging: `LOG_CHANNEL=stack`, `LOG_LEVEL=warning`; a test warning was written
  to `storage/logs/laravel.log` and verified (no secrets in logs).
- HTTPS: verified — `http://` 301-redirects to `https://`, which returns 200;
  `Content-Security-Policy: upgrade-insecure-requests` is sent by the edge.
- Private-file inaccessibility (live, via the domain):
  `/.env` → 403, `/composer.json` → 404, `/artisan` → 404,
  `/routes/web.php` → 404, `/storage/.env` → 403.
- Timezone `Asia/Dhaka`; locale `bn` with fallback `en`.
- **SSH key authentication: NOT VERIFIED / REQUIRES OWNER ACTION** — no key pair
  exists yet. Recommended: the owner generates an ed25519 key pair on their own
  machine and adds the public key to `~/.ssh/authorized_keys` (or hPanel →
  SSH Access). Password login currently works.
- **Backups: NOT VERIFIED** — no backup job exists yet for this application.
  `~/backups/` is used by other projects on the account. A backup job
  (database dump + `storage/` + `.env` copy to `~/backups/`) must be set up
  once the database exists (see §9).

## 6. Laravel installation status — VERIFIED

- `composer create-project laravel/laravel:^13.0 satanipara-app` completed;
  **Laravel 13.42.0**, `composer.json` valid, all platform requirements pass on
  PHP 8.4.27 (`composer check-platform-reqs`: every extension `success`).
- The missing `sodium` extension on PHP 8.4 is a **non-issue for the base
  install**: no installed package requires it. If a future package requires
  `ext-sodium`, fall back to PHP 8.3 (which has it) or check the CloudLinux
  PHP selector for an 8.4 sodium option.
- `vendor/` 111 MB, 37 packages, autoloader OK.
- `.env` hardened for production (see §5). `APP_KEY` present.
- `php artisan storage:link` done (`public/storage` → `storage/app/public`).
- Health endpoints: `GET /health` returns
  `{"status":"ok","app":"Satanipara Community","laravel":"13.42.0","php":"8.4.27",...}`;
  Laravel's built-in `GET /up` returns "Application up" (200).
- Default routes: `/`, `/health`, `/up`, `storage/{path}` only — no modules built.
- Automated tests: `php artisan test` — **2 passed** (skeleton Unit + Feature
  example tests). No application tests exist yet; they belong to Phase 1
  development.
- Database for now: `DB_CONNECTION=sqlite` with `database/database.sqlite`
  present (foundation + tests only). **Production will use MariaDB once
  provisioned — see §8.**
- Interim drivers (until the MariaDB database exists): `SESSION_DRIVER=file`,
  `CACHE_STORE=file`, `QUEUE_CONNECTION=sync`. The blueprint's database queue /
  database cache drivers activate when the database is provisioned.

## 7. Domain and HTTPS verification — VERIFIED

- DNS: `satanipara.asf.run` resolves (via the Hostinger CDN edge).
- `http://satanipara.asf.run/` → **301 to https**.
- `https://satanipara.asf.run/` → **200**, Laravel welcome page, `lang="bn"`,
  title "Satanipara Community".
- `https://satanipara.asf.run/health` → **200**, JSON as in §6.
- `https://satanipara.asf.run/up` → **200**, "Application up".
- Web PHP is 8.4.27 (via `/health` JSON and the earlier probe).
- The Hostinger "Coming soon" placeholder was preserved
  (`default.php.preserved`), not deleted.

## 8. Database readiness — REQUIRES OWNER ACTION

### 8.1 What the server actually provides — VERIFIED

- The database server reachable at `127.0.0.1:3306` is **MariaDB 11.8.9**,
  **not MySQL 8.4**. This was determined from the server's handshake banner
  without logging in. No database, user, or password for this project exists
  yet (none was created; none was guessed).

### 8.2 Consequence: deviation from the confirmed blueprint decision

The Phase 0.1 blueprint confirms **MySQL 8.4 LTS + InnoDB**. This host
provides **MariaDB 11.8.9**. Laravel 13 supports MariaDB 10.3+, so the
application runs, but the following blueprint items need a documented
reconciliation before Phase 1 development:

| Blueprint item | MySQL 8.4 assumption | MariaDB 11.8.9 reality |
|---|---|---|
| Bengali full-text search | `ngram` FULLTEXT + BOOLEAN MODE, benchmarked on MySQL 8.0.46 | MariaDB has **no ngram parser**; default full-text parser with `ft_min_word_len=4` behaves differently. The benchmark recommendation does **not** transfer. Search must be re-validated on MariaDB (LIKE-based search or an external index). |
| JSON columns | Native `JSON` type with validation | MariaDB stores `JSON` as a `LONGTEXT` alias; Laravel works, but JSON validation differs. |
| Collation | `utf8mb4_0900_ai_ci` (MySQL 8 default) | Not available in MariaDB — use `utf8mb4_unicode_ci`. |
| Generated columns / CHECK constraints | Used for hash columns and ledger guards | Supported in MariaDB 11.8 (generated columns since 10.2.1, CHECK since 10.2.1). |
| `BINARY(32)` SHA-256 hash columns | `UNHEX(SHA2(...,256))` | Supported (`SHA2()` exists in MariaDB). |
| Storage engine | InnoDB | MariaDB uses InnoDB (default engine). |
| Strict mode | `STRICT_TRANS_TABLES` etc. | MariaDB default includes strict mode; Laravel also enforces it via config. |

**Decision required from Fahim (REQUIRES OWNER ACTION):** accept MariaDB
11.8.9 on this host (with the search-strategy and collation notes above
recorded as a blueprint addendum), or provision an external MySQL 8.4
server. The foundation does not depend on this choice — Laravel runs on
either — but Phase 1 migrations must target one of them.

### 8.3 Proposed database configuration (to apply once the database exists)

- Engine InnoDB, charset `utf8mb4`, collation `utf8mb4_unicode_ci`
  (MariaDB) or `utf8mb4_0900_ai_ci` (MySQL 8.4, if that path is chosen).
- Strict SQL mode on; timezone `Asia/Dhaka` (`APP_TIMEZONE` already set).
- Least-privilege users, separate identities:
  application runtime / migrations / backup / reporting.
- Database name suggestion: `u263467780_satanipara`
  (Hostinger prefixes database/user names with the account name).

### 8.4 Exact owner instructions (hPanel)

1. hPanel → Databases → MySQL Databases → create database
   `u263467780_satanipara`.
2. In the same screen create four users (strong, distinct passwords — store
   them in the password manager, do not send them in chat):
   `u263467780_satanipara_app` (SELECT, INSERT, UPDATE, DELETE on the
   database), `u263467780_satanipara_mig` (same + CREATE, ALTER, INDEX, DROP,
   REFERENCES), `u263467780_satanipara_bkp` (SELECT, LOCK TABLES),
   `u263467780_satanipara_rep` (SELECT only).
3. Add all four users to the database with those privileges.
4. Confirm the MySQL host shown in hPanel (expected `localhost`) and send
   the database name + usernames (passwords only through the secure vault)
   so the server `.env` can be switched from sqlite to MariaDB.
5. hPanel → Advanced → Cron Jobs → add:
   `cd /home/u263467780/satanipara-app && /opt/alt/php84/usr/bin/php artisan schedule:run >> /dev/null 2>&1`
   running every minute (only after the database is live).

**Database connectivity: NOT VERIFIED** — no credentials exist yet, so no
connection was attempted. **No migrations were run against any production
database. No benchmark scripts were run against production.**

## 9. Tailwind readiness — VERIFIED

- Node.js 24.22.3 + npm 11.19.1 available on the server
  (`source /opt/alt/alt-nodejs24/enable`).
- `npm install` completed on the server: **101 packages added**.
- The skeleton ships Tailwind CSS v4 (`@tailwindcss/vite`, `tailwindcss ^4`),
  Vite 8, `laravel-vite-plugin ^3.1` — no second CSS framework installed.
- **`npm run build` on the server: BLOCKED by the hosting account's
  process/thread cap (LVE).** Evidence: Node 24 aborts at startup
  (`uv_thread_create` assertion, exit 134); Node 20 cannot fork
  (`fork system call failed: Resource temporarily unavailable`); Vite 8's
  Rollup (tokio) panics with `OS can't spawn worker thread: Resource
  temporarily unavailable (os error 11)`. An earlier orphaned build attempt
  was found still running and was removed; the failures reproduce with a
  free process table. `node --version` and `npm install` work — only the
  multi-threaded build step is affected.
- **Workaround applied (verified):** the identical inputs were built locally
  (Node 24.22.1, `vite build` in 3.4 s) and the compiled `public/build/`
  directory was uploaded to the server with `scp`. All assets verified over
  HTTPS: `app-*.css` 200, `app-*.js` 200, `manifest.json` 200.
  One caveat: the local build's `@source` globs for the framework pagination
  views and compiled views pointed at empty stub directories, so pagination
  classes were not scanned into this foundation CSS. The canonical build
  procedure for Phase 1 is therefore: build in CI or on a developer machine
  with the full tree, deploy `public/build/` as compiled assets. **Do not
  rely on running `npm run build` on this shared host.**
- A follow-on gotcha, fixed: `scp` created `public/build` as mode `770` /
  files as `640`, which LiteSpeed (serving static files as another user)
  could not read — assets returned Laravel 404s until the modes were set to
  `755` / `644`. Any future upload must use `755` / `644` for web-served
  files.
- Filament custom theme: **NOT VERIFIED** — Filament is not installed yet
  (Phase 1 development).

## 10. Test results

| Test | Result |
|---|---|
| `composer validate` | PASS — `./composer.json is valid` |
| `composer check-platform-reqs` (PHP 8.4.27) | PASS — all extensions `success` |
| `php artisan test` (skeleton) | PASS — 2 passed (Unit + Feature example) |
| `php artisan about` | PASS — Laravel 13.42.0, PHP 8.4.27, production, debug off |
| `GET /` via domain | PASS — 200, Laravel welcome, `lang="bn"` |
| `GET /health` via domain | PASS — 200, correct JSON |
| `GET /up` via domain | PASS — 200, "Application up" |
| `/.env` via domain | PASS — 403 (blocked) |
| `/composer.json`, `/artisan`, `/routes/web.php` via domain | PASS — 404 |
| `/storage/.env` via domain | PASS — 403 (blocked) |
| Symlink docroot test | PASS — external target served as PHP 8.4.27, 200 |
| PHP version switch via `.htaccess` | PASS — 8.3.36 → 8.4.27, default page stayed 200 |
| Logging | PASS — test warning written to `storage/logs/laravel.log` |
| `npm install` (101 packages) | PASS |
| `npm run build` on the server (Vite + Tailwind v4) | BLOCKED — LVE thread cap (see §9); completed locally + uploaded — PASS (all assets HTTP 200) |
| Database connectivity | NOT VERIFIED — no database/credentials yet (§8) |
| `php artisan serve` loopback test | NOT VERIFIED — loopback TCP listeners blocked by the host (§3); tested via LiteSpeed instead |
| Existing websites intact | VERIFIED — only `satanipara.asf.run` was touched; the placeholder was preserved, not deleted; all other `~/domains/*` untouched |

## 11. Unresolved issues

1. **Database engine deviation (MariaDB 11.8.9 vs confirmed MySQL 8.4)** —
   REQUIRES OWNER ACTION: Fahim decides (accept MariaDB + record addendum,
   or external MySQL 8.4). Blocks Phase 1 migrations, not the foundation.
2. **No database / credentials yet** — REQUIRES OWNER ACTION: create the
   database + four users in hPanel (§8.4), then the server `.env` switches
   from sqlite to MariaDB.
3. **SSH key authentication not set up** — REQUIRES OWNER ACTION: owner adds
   a public key to `~/.ssh/authorized_keys` (password login works meanwhile).
4. **No backup job yet** — REQUIRES OWNER ACTION once the database exists
   (database dump + `storage/` + `.env` copy into `~/backups/`).
5. **No cron job yet** — REQUIRES OWNER ACTION: add the hPanel cron in §8.4
   once the database is live.
6. **Disk quota not visible from SSH** — NOT VERIFIED: check hPanel for the
   account quota before large uploads.
7. **Filament not installed** — NOT VERIFIED: Phase 1 development
   (Filament 5 + Spatie Permission 8 + Sanctum on Laravel 13 / PHP 8.4).
8. **`sodium` absent on PHP 8.4/8.5** — VERIFIED non-issue for the base
   install; re-check if a future package requires `ext-sodium` (PHP 8.3 has it).
9. **Bengali search strategy** — NOT VERIFIED on MariaDB: the MySQL ngram
   benchmark does not transfer; re-validate before implementing search.
10. **Vite build cannot run on this shared host** — BLOCKED: the LVE
    process/thread cap aborts Node's thread creation (see §9). Assets must
    be built in CI or on a developer machine and deployed as compiled
    `public/build/` files (mode `755`/`644`). This is a permanent constraint
    of this hosting account, not a transient failure.

## 12. Exact next steps

1. **Fahim:** decide MariaDB 11.8.9 vs external MySQL 8.4 (§8.2).
2. **Fahim:** create the database + four users in hPanel (§8.4) and share
   access through the secure vault.
3. Agent: switch server `.env` from sqlite to MariaDB, run
   `php artisan migrate --force`, verify connectivity and the health endpoint.
4. **Fahim:** add an SSH public key (§5) and the hPanel cron job (§8.4).
5. Agent: set up the backup job once the database exists.
6. Only then: Phase 1 development (Filament 5, Spatie Permission 8, Sanctum,
   M1 Identity & Membership) on a separate approval.
7. Asset workflow: build frontend assets in CI / on a developer machine and
   deploy `public/build/` (see §9 item 10) — never `npm run build` on the
   shared host.
