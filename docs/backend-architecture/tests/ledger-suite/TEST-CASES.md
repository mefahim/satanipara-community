# Ledger / Trigger / Privilege Test Cases — Register (Worker C)

Executable files: `tests/01-setup.sql`, `tests/02-triggers.sql`,
`tests/03-test-cases.sql`, `tests/04a…04e`, `tests/05a` + `05-concurrency-test.sh`.
Runner: `tests/run-suite.sh` (records raw output under `tests/results/<timestamp>/`).

**Status: RUN — 43 / 43 PASS on MariaDB 11.8.9** (final run
`tests/results/20261114-134651/`; evidence in `TEST-RESULTS.md`).
The PASS/FAIL column below was filled only from that actual execution.
Error-code legend: 1644 = trigger `SIGNAL SQLSTATE '45000'`; 4025 = CHECK violation on MariaDB (MySQL uses 3819 for the same thing); 1062 = duplicate key;
1142 = privilege denied; 1452 = FK violation; 1265 = ENUM truncation on MySQL (on MariaDB the named CHECK fires instead — see L-13).

## Ledger cases (file 03, run as root/migration user, `--force`)

| ID | Test | Setup (SQL) | Execution (SQL) | Expected result | PASS/FAIL |
|---|---|---|---|---|---|
| L-01 | Draft field edit allowed | `INSERT LE-2026-0001 draft, amount 1000.00, entered_by 11` | `UPDATE SET amount=1200.00, item_bn='…(corrected)' WHERE entry_no='LE-2026-0001'` | Success; row `draft / 1200.00` | PASS |
| L-02 | Draft → published, dual control | L-01 row | `UPDATE SET status='published', approved_by=22, approved_at/published_at=NOW() WHERE entry_no='LE-2026-0001' AND status='draft'` | Success (1 row); `published / entered 11 / approved 22` | PASS |
| L-03 | Draft → published, approver = enterer | `INSERT LE-2026-0002 draft, entered_by 11` | `UPDATE SET status='published', approved_by=11 WHERE entry_no='LE-2026-0002'` | `ERROR 1644 (45000)` "Publishing requires an approver different from the enterer." Row stays `draft`, `approved_by NULL` | PASS |
| L-04 | Draft → discarded; entry_no retained, never reused | L-03 row | `UPDATE SET status='discarded', discarded_by=22, discard_reason='Entered in error, duplicate of LE-2026-0001' WHERE entry_no='LE-2026-0002'`; then `INSERT` a new row with the same `entry_no` | Discard succeeds, row present with reason. Re-INSERT: `ERROR 1062 (23000)` duplicate `uk_ledger_entries_entry_no` | PASS |
| L-05 | Published → reversed, one other column changed (×13) | `INSERT LE-2026-0012` directly as `published` (entered 11, approved 22) | `UPDATE SET status='reversed'` + one changed column, repeated for `amount`, `entry_date`, `kind`, `category_id`, `project_id`, `activity_id`, `item_bn`, `payee_bn`, `note_bn`, `voucher_media_id`, `donor_name_bn`, `approved_by`, `approved_at` | All 13 fail `ERROR 1644 (45000)` "Published ledger entries are immutable…". Row stays `published / 2000.00` | PASS |
| L-05b | Published → reversed, only status changed | L-05 row | `UPDATE SET status='reversed' WHERE entry_no='LE-2026-0012' AND status='published'` | Success (1 row). Only `status` and `updated_at` differ from the before-SELECT | PASS |
| L-06 | Published → reversed via approved-reversal path | `INSERT LE-2026-0003` (reversal entry, −1200.00, entered 33) → publish with `approved_by=44`; `INSERT INTO ledger_reversals (original LE-2026-0001, reversal LE-2026-0003, created_by 33)` | `UPDATE ledger_reversals SET approved_by=44 …`; `UPDATE ledger_entries SET status='reversed' WHERE entry_no='LE-2026-0001'` | All succeed. Original `reversed`, reversal entry `published`, link row `approved_by 44` | PASS |
| L-07 | Reversed-row immutability | L-06 final state | `UPDATE amount=1.00`, `UPDATE status='published'`, `DELETE` on LE-2026-0001 | `1644` "Reversed or discarded ledger entries are immutable." (×2); `1644` "Ledger entries are never deleted…" (delete). Row unchanged `reversed / 1200.00` | PASS |
| L-08 | Second reversal, original already reversed | L-06 final state; `INSERT LE-2026-0009` (draft reversal entry) | `INSERT INTO ledger_reversals (original LE-2026-0001, reversal LE-2026-0009, created_by 33)` | `ERROR 1644 (45000)` "Only a published ledger entry can be reversed." (T5 status branch fires first.) Link count for the original stays 1 | PASS |
| L-08b | Second reversal, original still published with a link row | `INSERT LE-2026-0005` directly as `published`; `INSERT LE-2026-0006` draft; link row (0005 ← 0006) | `INSERT LE-2026-0017` draft; `INSERT INTO ledger_reversals (original LE-2026-0005, reversal LE-2026-0017, created_by 33)` | First link INSERT succeeds. Second fails `ERROR 1644 (45000)` "This ledger entry already has a reversal." Count stays 1 (unique key `uk_one_reversal_per_original` is the concurrent backstop) | PASS |
| L-09 | Discarded-row immutability | L-04 final state | `UPDATE amount=1.00`, `UPDATE status='draft'`, `DELETE` on LE-2026-0002 | `1644` "Reversed or discarded…" (×2); `1644` "Ledger entries are never deleted…" Row unchanged `discarded / 500.00` | PASS |
| L-10 | Reversal link-row immutability | Link row for LE-2026-0001 (approved 44) | `UPDATE` each of `reason_bn`, `reason_en`, `created_by`, `ledger_entry_id`, `reversal_entry_id`, `approved_by` (=22); `DELETE` the link row | All six UPDATEs `1644` "Reversal records are immutable; only the one-time approval (approved_by) may be filled."; DELETE `1644` "Reversal records are never deleted." Row intact | PASS |
| L-10b | One-time `approved_by` fill | Link row for LE-2026-0005 (`approved_by NULL`) | `UPDATE ledger_reversals SET approved_by=44 WHERE reversal_entry_id=(LE-2026-0006)` | Success; link row shows `approved_by 44` | PASS |
| L-11 | T5: reversal of a draft original | `INSERT LE-2026-0004` draft | `INSERT INTO ledger_reversals (original LE-2026-0004, reversal LE-2026-0006, created_by 33)` | `ERROR 1644 (45000)` "Only a published ledger entry can be reversed." | PASS |
| L-11b | T5: reversal of a reversal entry | LE-2026-0003 is `published` and is itself a `reversal_entry_id` | `INSERT INTO ledger_reversals (original LE-2026-0003, reversal LE-2026-0006, created_by 33)` | `ERROR 1644 (45000)` "A reversal entry cannot itself be reversed." | PASS |
| L-11c | T5: nonexistent original | — | `INSERT INTO ledger_reversals (ledger_entry_id=9999, reversal LE-2026-0006, created_by 33)` | `ERROR 1644 (45000)` "Reversal original entry does not exist." — record the ACTUAL code: if the run shows `1452 (23000)` instead, the FK fired before T5 and branch (a) is unproven | PASS |
| L-12 | Direct published UPDATE/DELETE, privileged user | LE-2026-0005 `published` | `UPDATE amount=9999.00`; `UPDATE payee_bn='Tampered'`; `DELETE` on LE-2026-0005 | `1644` (×2 UPDATEs); `1644` (DELETE). Row unchanged `published / 750.00 / payee_bn NULL` | PASS |
| L-13 | CHECK violations | — | `INSERT` (a) `approved_by=entered_by=11, status='published'`; (b) `amount=0.00`; (c) `kind='gift'`; (d) `status='approved'` | (a) `4025 chk_ledger_dual_control`; (b) `4025 chk_ledger_amount_nonzero`; (c) `4025 chk_ledger_kind`; (d) `4025 chk_ledger_status` (MariaDB converts the invalid ENUM value so the named CHECK fires — NOT 1265 as first drafted). Zero rows inserted | PASS |
| L-13b | Reversal dual-control CHECK | `INSERT LE-2026-0010` published; `INSERT LE-2026-0011` draft | `INSERT INTO ledger_reversals (original LE-2026-0010, reversal LE-2026-0011, created_by 33, approved_by 33)` | ERROR 4025 (23000) CONSTRAINT chk_reversal_dual_control failed (T5 passes first; the CHECK fires second.) Count 0 | PASS |
| L-14 | Draft identity columns immutable | `INSERT LE-2026-0007` draft | `UPDATE entry_no='LE-2099-9999'`; `UPDATE entered_by=99`; `UPDATE id=999` | All three `1644` "Ledger entry id, entry_no and entered_by are immutable." Row unchanged | PASS |
| L-15 | Invalid status transitions | `INSERT LE-2026-0008` draft; LE-2026-0005 `published` | `UPDATE status='reversed'` on the draft; `UPDATE status='draft'` and `UPDATE status='discarded'` on the published row | Draft→reversed: `1644` "Invalid ledger status transition from draft." Published→draft/discarded: `1644` "Published ledger entries are immutable…" Rows unchanged | PASS |
| L-16 | Audit log append-only, privileged user | — | `INSERT INTO activity_log (actor 22, action 'finance.entries.publish', …)`; `UPDATE action='finance.entries.forged'`; `DELETE` the row | INSERT succeeds. UPDATE `1644` "Audit log rows are never updated." DELETE `1644` "Audit log rows are never deleted." Row intact | PASS |
| L-17 | Final state / sequence gaps | Whole file 03 | `SELECT entry_no, status, amount, entered_by, approved_by ORDER BY entry_no`; counts | 13 ledger rows, 2 reversal rows; LE-2026-0002 `discarded` (permanent gap, never reused); LE-2026-0013…0016 absent (all four inserts failed) | PASS |

## Privilege cases (files 04a–04e; Doc 10 T-LED-19–25)

| ID | Test | Setup | Execution (as) | Expected result | PASS/FAIL |
|---|---|---|---|---|---|
| P-APP-01 | App user legitimate flows succeed (T-LED-22) | 04a grants | `satanipara_app_test`: INSERT draft LE-2026-0020 → UPDATE amount → guarded publish (`approved_by=22`) | All succeed; row `published / 275.00` | PASS |
| P-APP-02 | App user DELETE refused (T-LED-19) | P-APP-01 row + draft LE-2026-0004 | `satanipara_app_test`: `DELETE` on LE-2026-0020 (published) and LE-2026-0004 (draft) | Both `ERROR 1142 (42000)` "DELETE command denied … for table 'ledger_entries'". Rows present | PASS |
| P-APP-03 | App user published UPDATE stopped by trigger | LE-2026-0005 published | `satanipara_app_test`: `UPDATE amount=5.00` | `ERROR 1644 (45000)` (privilege allows it; trigger stops it). Row `750.00` | PASS |
| P-APP-04 | App user TRUNCATE refused (T-LED-20) | — | `satanipara_app_test`: `TRUNCATE TABLE ledger_entries` | `ERROR 1142 (42000)` "DROP command denied …". Row count unchanged | PASS |
| P-APP-05 | App user DDL refused (T-LED-21) | — | `satanipara_app_test`: `DROP TRIGGER trg_ledger_entries_bd`; `ALTER TABLE … ADD COLUMN evil_col` | Both `ERROR 1142 (42000)` (TRIGGER / ALTER denied) | PASS |
| P-APP-05b | App user CREATE TRIGGER refused (T-LED-21) | — | `satanipara_app_test` (04b2): `CREATE TRIGGER trg_evil_bi …` | `ERROR 1142 (42000)` "TRIGGER command denied …". No `trg_evil_bi` afterwards | PASS |
| P-APP-06 | App user cannot UPDATE/DELETE audit log | L-16 row (id 1) | `satanipara_app_test`: INSERT audit row (succeeds); `UPDATE action=…`; `DELETE` it | INSERT succeeds; UPDATE/DELETE `ERROR 1142 (42000)` for `activity_log`. Row intact | PASS |
| P-APP-07 | App user cannot DELETE a reversal link row | Link row for LE-2026-0001 | `satanipara_app_test`: `DELETE FROM ledger_reversals …` | `ERROR 1142 (42000)` for `ledger_reversals`. Count stays 2 | PASS |
| P-MIG-01 | Migration user DELETE stopped by trigger (T-LED-23) | LE-2026-0005 published | `satanipara_migrate_test`: `DELETE` on LE-2026-0005 | `ERROR 1644 (45000)` (trigger, not privilege). Row present | PASS |
| P-MIG-02 | Migration user link-row DELETE stopped by trigger | Link row for LE-2026-0001 | `satanipara_migrate_test`: `DELETE FROM ledger_reversals …` | `ERROR 1644 (45000)` "Reversal records are never deleted." Count stays 2 | PASS |
| P-MIG-03 | Migration user CAN create/drop a trigger (positive control) | — | `satanipara_migrate_test`: `CREATE TRIGGER trg_tmp_probe_bi …` then `DROP TRIGGER trg_tmp_probe_bi` | Both succeed; probe trigger gone afterwards. Proves the 1142s in 04b are privilege denials, not a broken trigger subsystem | PASS |
| P-BKP-01 | Backup user mysqldump succeeds (T-LED-24) | — | Shell: `mysqldump -u satanipara_backup_test --single-transaction --routines --triggers satanipara_test_c` | Exit 0; dump contains the ledger tables AND the trigger definitions (`CREATE TRIGGER` count ≥ 7) | PASS |
| P-BKP-02 | Backup user SELECT succeeds | — | `satanipara_backup_test`: `SELECT COUNT(*)` on both ledger tables | Succeeds (13 and 2) | PASS |
| P-BKP-03 | Backup user writes refused | — | `satanipara_backup_test`: INSERT / UPDATE / DELETE on `ledger_entries` | All three `ERROR 1142 (42000)` | PASS |
| P-BKP-04 | Backup user DDL refused | — | `satanipara_backup_test`: `ALTER TABLE ledger_entries ADD COLUMN bkp_col` | `ERROR 1142 (42000)` ALTER denied | PASS |
| P-REP-01 | Reporting user SELECT on finance tables succeeds (T-LED-25) | — | `satanipara_report_test`: `SELECT COUNT(*)` on `ledger_entries`, `ledger_reversals`, `finance_categories`, `projects` | All four succeed | PASS |
| P-REP-02 | Reporting user SELECT outside finance scope refused | — | `satanipara_report_test`: `SELECT COUNT(*)` on `users`, `activity_log`, `sequences` | All three `ERROR 1142 (42000)` SELECT denied | PASS |
| P-REP-03 | Reporting user writes refused | — | `satanipara_report_test`: INSERT / UPDATE on `ledger_entries` | Both `ERROR 1142 (42000)` | PASS |

## Concurrency case (file 05; Doc 10 T-LED-07, DB leg)

| ID | Test | Setup | Execution | Expected result | PASS/FAIL |
|---|---|---|---|---|---|
| R-01 | Concurrent double-publish: exactly one wins | Fresh draft row with a run-unique `entry_no` (a ledger row can never be deleted, so the row must be new each run) | Two `mariadb` sessions in parallel, each: `START TRANSACTION; SELECT … FOR UPDATE; UPDATE … SET status='published', approved_by=<22 or 44> WHERE entry_no=? AND status='draft'; COMMIT;` | Exactly one session reports `publish_affected_rows = 1`, the other `0` (total = 1). Final row `published` with exactly one `approved_by`/`approved_at`. Exit 0 | PASS |

## Drift check (Doc 10 T-LED-26; runs inside file 02)

| ID | Test | Expected result | PASS/FAIL |
|---|---|---|---|
| D-01 | All triggers + named CHECKs exist after setup | `information_schema.TRIGGERS` lists `trg_ledger_entries_bu/bd`, `trg_ledger_reversals_bu/bd/bi`, `trg_activity_log_bu/bd` (7 triggers); `information_schema.CHECK_CONSTRAINTS` lists `chk_ledger_amount_nonzero`, `chk_ledger_status`, `chk_ledger_dual_control`, `chk_ledger_kind`, `chk_reversal_dual_control` | PASS |

**Case count:** 23 ledger cases (L-01…L-17 incl. L-05b, L-08b, L-10b, L-13b) + 18 privilege cases + 1 concurrency case + 1 drift check = **43 checks**. All 43 PASS on MariaDB 11.8.9 (final run `tests/results/20261114-134651/`; see `TEST-RESULTS.md`).
