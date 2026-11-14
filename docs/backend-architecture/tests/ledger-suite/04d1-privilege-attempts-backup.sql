-- ============================================================================
-- Satanipara Community — Ledger / Trigger / Privilege test suite (Worker C)
-- File 04d1: privilege attempts AS THE BACKUP USER (Doc 10 T-LED-24)
-- ----------------------------------------------------------------------------
--   MYSQL_PWD='test-only-bkp-pass' mariadb -u satanipara_backup_test --force \
--     < 04d1-privilege-attempts-backup.sql
-- Plus, from the shell (dump leg P-BKP-01):
--   MYSQL_PWD='test-only-bkp-pass' mysqldump -u satanipara_backup_test \
--     --single-transaction --routines --triggers satanipara_test_c > /tmp/dump.sql
--   (expect exit 0 and a dump containing the ledger tables AND the triggers)
-- ============================================================================

USE satanipara_test_c;

SELECT '--- P-BKP-02: backup user SELECT succeeds (expect SUCCESS) ---' AS test_case;
SELECT COUNT(*) AS ledger_rows_visible_to_backup FROM ledger_entries;
SELECT COUNT(*) AS reversal_rows_visible_to_backup FROM ledger_reversals;
-- EXPECTED: SELECTs succeed (13 and 2 after file 03).

SELECT '--- P-BKP-03: backup user writes refused (expect FAIL 1142 x3) ---' AS test_case;
INSERT INTO ledger_entries
  (entry_no, entry_date, kind, category_id, item_bn, amount, entered_by)
  VALUES ('LE-2026-0030','2026-01-30','income',1,'Backup-user write attempt',1.00,11);
UPDATE ledger_entries SET amount=1.00 WHERE entry_no='LE-2026-0004';
DELETE FROM ledger_entries WHERE entry_no='LE-2026-0004';
-- EXPECTED: all three fail with ERROR 1142 (42000) INSERT/UPDATE/DELETE
-- command denied to user 'satanipara_backup_test'@'localhost' for table 'ledger_entries'.

SELECT '--- P-BKP-04: backup user DDL refused (expect FAIL 1142) ---' AS test_case;
ALTER TABLE ledger_entries ADD COLUMN bkp_col VARCHAR(10) NULL;
-- EXPECTED: ERROR 1142 (42000) ALTER command denied to user
-- 'satanipara_backup_test'@'localhost' for table 'ledger_entries'.
