# Ledger / Trigger / Privilege Test Suite — README (Worker C)

## What this is

The executable acceptance suite for the Satanipara finance ledger on
**MariaDB 11.8.9**: the four canonical status transitions, triggers
T1–T5 (T5 executed here for the first time anywhere), CHECKs, the
four-identity privilege model, and the concurrent double-publish race.
Sources: Doc 06 §§7.1–7.2, 8.2, 12; Doc 08 §3.1; Doc 10 §4.4.1
(T-LED-01–28); Doc 15 §4/§9; ADR-003; Phase 0.1.1 Worker B `TEST-LOG.md`
(MySQL 8.0.46 run — the mechanism proof this suite re-proves on MariaDB).

## Status: RUN — 43 / 43 PASS on MariaDB 11.8.9

Executed 2026-11-14 against Worker B's MariaDB 11.8.9
(`SELECT VERSION()` = `11.8.9-MariaDB`). Final run:
`results/20261114-134651/`. Per-case results in `TEST-CASES.md`
(every case row reads PASS) and `TEST-RESULTS.md`. The first run
(`results/20261114-134413/`) caught two real issues — a MariaDB 1901
rejection (CHECK + `ON DELETE SET NULL` FK) and a racy timestamp leg
in L-05 — both fixed before the final run; see `TEST-RESULTS.md`
§3–§4. To re-run (e.g. against the provisioned Hostinger database),
follow "How to run" below and record the new run in `TEST-RESULTS.md`.

## Files

| File | Contents |
|---|---|
| `01-setup.sql` | Scratch DB `satanipara_test_c`: stub `users`/`finance_categories`/`projects`/`activities`/`media` (so the FKs are real), `sequences`, full-field `ledger_entries`, `ledger_reversals`, `activity_log`. MariaDB collation `utf8mb4_unicode_ci`. |
| `02-triggers.sql` | T1 (full-column form, T-LED-12), T2, T3 (full-column incl. `reason_en`), T4, **T5** (first execution), A1/A2 (audit log). Ends with the drift check (T-LED-26). |
| `03-test-cases.sql` | Cases L-01…L-17. Run with `--force`. |
| `04a-privilege-setup.sql` | Creates the four TEST users on the scratch DB (root). |
| `04b-privilege-attempts-app.sql` | Cases P-APP-01…07 as the app user. |
| `04b2-create-trigger-attempt.sql` | P-APP-05b: app-user CREATE TRIGGER denial. |
| `04c-privilege-attempts-migrate.sql` | Cases P-MIG-01…03 as the migration user. |
| `04d1-privilege-attempts-backup.sql` | Cases P-BKP-02…04 as the backup user. |
| `04d2-privilege-attempts-report.sql` | Cases P-REP-01…03 as the reporting user. |
| `04d-readme.sql` | Pointer file (04d is split into 04d1/04d2). |
| `04e-privilege-cleanup.sql` | Drops the four test users + scratch DB (root, run LAST). |
| `05a-publish-session.sql` | One race session (guarded publish). |
| `05-concurrency-test.sh` | Case R-01: launches two race sessions in parallel. |
| `run-suite.sh` | Master runner: 01 → 02 → 03 → 04a → 04b → 04b2 → 04c → 04d1 → 04d2 → mysqldump leg → 05. Records everything under `results/<timestamp>/`. |
| `TEST-CASES.md` | The case register (name, setup, execution, expected result, PASS/FAIL column). |

## How to run (once a MariaDB 11.8.x is available)

```bash
# 1. Get the connection details from Worker B
#    (socket path or host/port + a root-equivalent user).
# 2. From this directory:
MARIADB_BIN=/path/to/mariadb-11.8/bin/mariadb \
MYSQLDUMP_BIN=/path/to/mariadb-11.8/bin/mysqldump \
MARIADB_SOCKET=/path/to/mariadb.sock bash run-suite.sh
#    — or, with TCP:
MARIADB_BIN=... MYSQLDUMP_BIN=... MARIADB_HOST=127.0.0.1 MARIADB_PORT=3306 bash run-suite.sh
#    (MYSQLDUMP_BIN must be the MariaDB mysqldump: the MySQL 8.0.46 one
#    queries information_schema.COLUMN_STATISTICS, which MariaDB lacks,
#    and aborts mid-dump.)
```

The runner refuses to proceed unless `SELECT VERSION()` contains
`MariaDB`. It records the exact server version in
`results/<timestamp>/server-version.txt` — copy that version string into
`TEST-RESULTS.md`.

Individual steps (same order, same `--force` where noted):

```bash
mariadb -u root -p < 01-setup.sql
mariadb -u root -p < 02-triggers.sql
mariadb -u root -p --force < 03-test-cases.sql
mariadb -u root -p < 04a-privilege-setup.sql
MYSQL_PWD='test-only-app-pass' mariadb -u satanipara_app_test --force < 04b-privilege-attempts-app.sql
MYSQL_PWD='test-only-app-pass' mariadb -u satanipara_app_test --force < 04b2-create-trigger-attempt.sql
MYSQL_PWD='test-only-mig-pass' mariadb -u satanipara_migrate_test --force < 04c-privilege-attempts-migrate.sql
MYSQL_PWD='test-only-bkp-pass' mariadb -u satanipara_backup_test --force < 04d1-privilege-attempts-backup.sql
MYSQL_PWD='test-only-rep-pass' mariadb -u satanipara_report_test --force < 04d2-privilege-attempts-report.sql
MYSQL_PWD='test-only-bkp-pass' mysqldump -u satanipara_backup_test --single-transaction --routines --triggers satanipara_test_c > dump.sql
bash 05-concurrency-test.sh
# After recording results:
mariadb -u root -p < 04e-privilege-cleanup.sql
```

Test-only passwords (`test-only-*-pass`) are scratch-only and are dropped
by 04e. They are not production credentials and must never be reused
for the real users.

## How to record results

1. For each case in `TEST-CASES.md`, compare the recorded output with the
   Expected result column and mark PASS or FAIL. Paste the exact error
   line (code + message) for every FAIL.
2. Copy the version string from `results/<timestamp>/server-version.txt`
   into `TEST-RESULTS.md` and fill in the per-case table there.
3. Two cases have deliberately open expectations — record the ACTUAL
   code, do not force the expected one:
   - **L-11c**: T5 vs FK ordering for a nonexistent original (1644 vs 1452).
   - **L-13 (d)**: invalid ENUM status caught by `chk_ledger_status` as 4025 (MariaDB), not by ENUM truncation 1265.
4. If any case FAILs, do not edit the expected result to match the run.
   Record the failure, and note whether the trigger, the CHECK, the
   privilege, or the expectation is wrong.

## MariaDB notes the runner must confirm on first execution

- `SIGNAL SQLSTATE '45000'` inside triggers → error 1644 (assumed from
  MariaDB docs; first execution is the proof).
- `SELECT … INTO` with no matching row in T5 leaves the variable NULL
  with warning 1329 (not an error) — the `IS NULL` branch is the
  intended path. If 1329 surfaces as an error, T5 must be rewritten
  with a `COUNT(*)` existence check.
- Named CHECK constraints appear by name in 4025 messages (MariaDB; MySQL uses 3819).
- `information_schema.CHECK_CONSTRAINTS` exists (drift check D-01).
