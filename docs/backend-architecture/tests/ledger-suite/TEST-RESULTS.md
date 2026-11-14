# TEST RESULTS — Ledger / Trigger / Privilege Suite (Worker C)

| | |
|---|---|
| Date | 2026-11-14 (Asia/Dhaka) |
| MariaDB server | **`11.8.9-MariaDB`** (Worker B's instance: `~/workspace/satanipara-mariadb/work-b/mariadb-11.8/`, socket `work-b/run/mariadb.sock`, port 3307; `SELECT VERSION()` = `11.8.9-MariaDB`) |
| Client binaries | Worker B's MariaDB 11.8.9 `mariadb` + `mysqldump` (the system MySQL 8.0.46 `mysql` client was used only for the first, superseded run) |
| Database | Scratch database `satanipara_test_c` (created and dropped in-session; no production or repo data touched) |
| How run | `bash run-suite.sh` (final run `tests/results/20261114-134651/`); cases run with `--force` so expected errors are visible inline |
| Raw output | `tests/results/20261114-134651/` (all 11 step outputs + mysqldump + race logs). First run `tests/results/20261114-134413/` is kept for the audit trail (see §3). |

## 1. Verdict: 43 / 43 PASS

| Group | Cases | Result |
|---|---|---|
| Ledger cases L-01…L-17 (incl. L-05b, L-08b, L-10b, L-13b) | 23 | **23 PASS** |
| Privilege cases P-APP / P-MIG / P-BKP / P-REP | 18 | **18 PASS** |
| Concurrency race R-01 | 1 | **PASS** (session B won, 1 row; session A lost, 0 rows) |
| Drift check D-01 (triggers + named CHECKs exist) | 1 | **PASS** (7 triggers, 5 named CHECKs) |
| **Total** | **43** | **43 PASS, 0 FAIL** |

Per-case PASS/FAIL is filled in `tests/TEST-CASES.md` (every case row reads
PASS). This file records the evidence behind that column.

## 2. What was proven, with the exact evidence

- **T5 executed for the first time anywhere** (`trg_ledger_reversals_bi`,
  BEFORE INSERT on `ledger_reversals`). All four branches proven:
  draft original → 1644 "Only a published ledger entry can be reversed."
  (L-11); already-reversed original → 1644, status branch (L-08);
  still-published original with a link row → 1644 "This ledger entry
  already has a reversal." (L-08b); reversal entry as original → 1644
  "A reversal entry cannot itself be reversed." (L-11b); nonexistent
  original → 1644 "Reversal original entry does not exist." (L-11c —
  the trigger fires BEFORE the FK check, so 1644, not 1452, as
  predicted). Happy path: link insert for a published, unreversed,
  non-reversal original succeeds (L-06, L-08b first insert, L-10b).
- **T1 full-column form** (Doc 10 T-LED-12): all 13 single-column
  changes on a published row refused with 1644; the clean flip (only
  `status` + `updated_at`) succeeds (L-05, L-05b).
- **Canonical 4 transitions only**: draft→draft edit (L-01), draft→
  published with dual control (L-02), draft→discarded with `entry_no`
  retained and reuse refused 1062 (L-04), published→reversed (L-05b,
  L-06). Every other transition refused: draft→reversed, published→
  draft, published→discarded (L-15); reversed/discarded rows immutable
  for UPDATE and DELETE (L-07, L-09); draft identity columns immutable
  (L-14).
- **Reversal link-row immutability** (T3/T4): six UPDATE attempts and
  one DELETE refused 1644; the one-time `approved_by` fill succeeds
  (L-10, L-10b).
- **CHECKs**: all five named CHECKs fire with their names in the error
  message — but with the **MariaDB error code 4025 (23000), not MySQL's
  3819 (HY000)** (see §4, finding M-1). Invalid ENUM `status` is caught
  by `chk_ledger_status` as 4025, not by ENUM truncation 1265 (L-13).
- **Privileges**: app user DELETE/TRUNCATE/DROP TRIGGER/ALTER/CREATE
  TRIGGER refused 1142 (P-APP-02/04/05/05b); app user cannot
  UPDATE/DELETE `activity_log` (P-APP-06) or delete link rows (P-APP-07);
  app user legitimate flows succeed (P-APP-01); published UPDATE as app
  user stopped by the trigger 1644, not the privilege (P-APP-03 —
  proves the two layers are independent). Migration user DELETE stopped
  by the trigger 1644 (P-MIG-01/02); migration user CAN create/drop a
  trigger (P-MIG-03, positive control). Backup user: `mysqldump`
  succeeds (exit 0, 28,322 bytes, all 7 triggers in the dump), all
  writes/DDL refused 1142 (P-BKP-01…04). Reporting user: SELECT on the
  four finance tables succeeds; SELECT on `users`/`activity_log`/
  `sequences` and all writes refused 1142 (P-REP-01…03).
- **Race** (R-01): two sessions, approvers 22 and 44, guarded publish
  on the same draft — session B affected 1 row, session A 0 rows;
  final row `published`, `approved_by 44`, one `approved_at`. Exactly
  one winner.
- **Final state** (L-17): 13 ledger rows, 2 reversal rows, all
  statuses/amounts/approvers exactly as specified; LE-2026-0002 is a
  permanent discarded gap; LE-2026-0013…0016 were never inserted.

## 3. Runs and the two things the first run caught

Two full runs were made. The first run (`results/20261114-134413/`)
failed in two places, both fixed before the final run — neither was a
trigger/privilege failure:

1. **The 1901 finding (see §4, M-2).** The first run's `01-setup.sql`
   used the blueprint's `ON DELETE SET NULL` on the `approved_by` FKs.
   MariaDB rejected the whole `ledger_entries` / `ledger_reversals`
   CREATE TABLE with `ERROR 1901 … cannot be used in the CHECK clause
   of chk_ledger_dual_control` — so no ledger tables existed and every
   downstream step failed with 1146. Root cause isolated with 14
   minimal tables (T1–T14, §4): a CHECK may not reference a column
   whose FK uses `ON DELETE SET NULL`. Fix applied: both `approved_by`
   FKs changed to `ON DELETE RESTRICT` (documented in `01-setup.sql`).
   The final run's setup has 0 errors.
2. **L-05 approved_at leg was racy.** The first run's sweep attempt
   `approved_at=NOW()` succeeded spuriously: the insert and the update
   fell in the same second, so `NEW.approved_at <=> OLD.approved_at`
   was true and the flip was legitimately allowed — the trigger was
   right, the test was wrong, and L-05b was vacuous (0 rows affected).
   Fix applied: the attempt now uses a fixed timestamp
   `'2026-01-01 00:00:00'`. Final run: all 13 sweep legs fail 1644
   and L-05b flips the row.
3. **mysqldump binary.** The first run used the system MySQL 8.0.46
   `mysqldump`, which queries `information_schema.COLUMN_STATISTICS`
   (absent in MariaDB) and aborted mid-dump (exit 2, partial 1,546-byte
   dump, 0 triggers). Fix: `run-suite.sh` gained a `MYSQLDUMP_BIN`
   variable; the final run used Worker B's MariaDB 11.8.9 `mysqldump`
   (exit 0, 28,322 bytes, all 7 triggers present).

## 4. MariaDB-specific findings (vs the MySQL 8.4 design)

- **M-1 — CHECK violations are error 4025 (23000) on MariaDB, not 3819
  (HY000).** Every named CHECK fires and names itself in the message
  (`CONSTRAINT chk_ledger_dual_control failed for
  satanipara_test_c.ledger_entries`), but the code differs from MySQL.
  **Doc 10's error-code legend and T-LED-27/28 must be corrected for
  MariaDB** (3819 is MySQL-only). Any application code or test that
  matches on 3819 will silently miss CHECK violations on MariaDB.
- **M-2 — CHECK + `ON DELETE SET NULL` FK = ERROR 1901.** A CHECK
  constraint may not reference a column whose foreign key uses
  `ON DELETE SET NULL` (proven by isolation tables T6/T9/T10/T11;
  the same CHECK passes with `ON DELETE RESTRICT`, T12/T13, and the
  single-column CHECKs coexist with the SET NULL FK, T14). The
  blueprint's `fk_ledger_approved_by` / `fk_reversal_approved_by`
  (`ON DELETE SET NULL`, Doc 06 §7.1/§7.2) are therefore
  **un-creatable together with the dual-control CHECKs on MariaDB**.
  Reconciliation adopted (one-word change, CHECKs preserved): both FKs
  use `ON DELETE RESTRICT`. Justification: users are soft-deleted /
  anonymised, never hard-deleted (Doc 06 §11), so a hard delete of an
  approver must fail (1452) rather than silently null out the approval
  on a published entry. Fallback if the team insists on SET NULL: drop
  the two dual-control CHECKs and enforce dual control on INSERT with
  a BEFORE INSERT trigger instead (T1 already enforces it on UPDATE).
  **Doc 06 §7.1/§7.2 must record this reconciliation.**
- **M-3 — Invalid ENUM values are caught by the CHECK, not by ENUM
  truncation.** `status='approved'` produced 4025
  `chk_ledger_status`, not MySQL-style 1265. The named CHECK is the
  error the operator sees — good (the CHECK is the second layer the
  blueprint wanted, and on MariaDB it is the first visible one).
- **M-4 — MariaDB adds implicit `json_valid` CHECKs on JSON columns.**
  `information_schema.CHECK_CONSTRAINTS` lists `json_valid(before)` /
  `json_valid(after)` on `activity_log` in addition to the five named
  CHECKs. Harmless; the drift check (D-01) must match on the named
  CHECKs, not on an exact count.
- **M-5 — `SIGNAL SQLSTATE '45000'` works in triggers as expected**
  (error 1644, same as MySQL). `SELECT … INTO` with no matching row
  in T5 leaves the variable NULL with warning 1329 only — the `IS NULL`
  branch works as designed (L-11c proves it).
- **M-6 — Trigger-file ownership warning (ERROR 35, benign).** Every
  trigger creation on Worker B's instance printed `Warning: Can't copy
  ownership for file './satanipara_test_c/<table>.TRG-' (Errcode: 1
  "Operation not permitted")` — 4× in file 02, 1× in 04c. The triggers
  were still created (SHOW TRIGGERS lists all 7; the dump contains all
  7; all 1644s fire). This is a property of Worker B's scratch
  datadir/filesystem, not of the triggers. On the production Hostinger
  MariaDB this warning should not appear; if it does, verify with
  SHOW TRIGGERS rather than treating it as a failure.
- **M-7 — Tooling mismatch.** The MySQL 8.0.46 `mysqldump` cannot dump
  a MariaDB server (missing `COLUMN_STATISTICS`); the MySQL 8.0.46
  `mysql` client works against MariaDB for ordinary SQL but is not the
  right client to certify with. All MariaDB work must use MariaDB
  binaries (Worker B's `mariadb-11.8/bin/`).

## 5. What is still Unverified (honest list)

- **The production migrations.** This suite proves the design on a
  minimal schema (stubs for `users`/`finance_categories`/`projects`/
  `activities`/`media`). It does NOT prove the real 48-table migration
  set, the Laravel models, or the F3/F4/F6 service flows (dual control
  as "who clicked", guarded-update 409s, audit rows in the same
  transaction, entry-number allocation from `sequences` under
  concurrency). Those belong to scaffold + Laravel feature tests
  (Doc 10 T-LED-02/07/09/10/17/18 — APP legs).
- **The four production identities.** `identities.sql` (prepared,
  not applied — no production database or credentials exist yet) is
  verified only in its scratch form (test users, files 04a–04d2). The
  production grants must be verified after Fahim provisions the
  database, including the reporting user's column-level SELECT on
  `users` (hPanel cannot express it; see `hpanel-db-setup.md`).
- **Hostinger's MariaDB specifically.** The evidence here is MariaDB
  11.8.9 on this VM (Worker B's binary install). Hostinger's managed
  MariaDB 11.8.9 should behave identically for these features, but the
  suite should be re-run one more time against the provisioned
  database (same files, same runner) before the docs claim production
  enforcement — a 10-minute job once credentials exist.
- **T5 under a true concurrent double-insert.** The unique key
  `uk_one_reversal_per_original` is the atomic guard and is proven by
  L-08b at the statement level; a two-session simultaneous-insert race
  on `ledger_reversals` was not run (T5's `COUNT(*)` checks cannot see
  uncommitted rows — the unique key, not T5, decides that race, by
  design).

## 6. Cleanup — verified

After the final run, `tests/04e-privilege-cleanup.sql` was executed:
`CLEANUP OK — test users and satanipara_test_c dropped`, confirmed by
`SHOW DATABASES LIKE 'satanipara_test_c'` (empty) and
`SELECT user FROM mysql.user WHERE user LIKE 'satanipara%_test'`
(empty). No scratch artefacts remain on Worker B's MariaDB. The
isolation database `iso_test` was also dropped.
