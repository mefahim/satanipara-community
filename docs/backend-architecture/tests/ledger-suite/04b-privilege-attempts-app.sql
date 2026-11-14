-- ============================================================================
-- Satanipara Community — Ledger / Trigger / Privilege test suite (Worker C)
-- File 04b: privilege attempts AS THE APP USER (Doc 10 T-LED-19–22)
-- ----------------------------------------------------------------------------
-- Run as the test app user, with --force:
--
--   MYSQL_PWD='test-only-app-pass' mariadb -u satanipara_app_test --force \
--     < 04b-privilege-attempts-app.sql
--
-- or via the runner: bash run-suite.sh
-- ============================================================================

USE satanipara_test_c;

SELECT '--- P-APP-01: app user legitimate flows succeed (expect SUCCESS x3) ---' AS test_case;
INSERT INTO ledger_entries
  (entry_no, entry_date, kind, category_id, item_bn, amount, entered_by)
  VALUES ('LE-2026-0020','2026-01-20','income',1,'App-user draft insert',250.00,11);
UPDATE ledger_entries SET amount=275.00 WHERE entry_no='LE-2026-0020';
UPDATE ledger_entries SET status='published', approved_by=22,
      approved_at=NOW(), published_at=NOW()
  WHERE entry_no='LE-2026-0020' AND status='draft';
SELECT entry_no, status, amount FROM ledger_entries WHERE entry_no='LE-2026-0020';
-- EXPECTED: all three succeed; row published / 275.00.
-- (Proves the grants are sufficient for the legitimate flows, T-LED-22.)

SELECT '--- P-APP-02: app user DELETE refused, draft and published (expect FAIL 1142 x2) ---' AS test_case;
DELETE FROM ledger_entries WHERE entry_no='LE-2026-0020';
DELETE FROM ledger_entries WHERE entry_no='LE-2026-0004';
SELECT entry_no, status FROM ledger_entries WHERE entry_no IN ('LE-2026-0020','LE-2026-0004');
-- EXPECTED: both fail with ERROR 1142 (42000)
-- DELETE command denied to user 'satanipara_app_test'@'localhost' for table 'ledger_entries'.
-- Both rows still present (T-LED-19).

SELECT '--- P-APP-03: app user direct published UPDATE stopped by trigger (expect FAIL 1644) ---' AS test_case;
UPDATE ledger_entries SET amount=5.00 WHERE entry_no='LE-2026-0005';
SELECT entry_no, status, amount FROM ledger_entries WHERE entry_no='LE-2026-0005';
-- EXPECTED: ERROR 1644 (45000) 'Published ledger entries are immutable...'
-- The privilege ALLOWS the UPDATE; the trigger stops it. The two layers
-- are independent, as designed. Row unchanged: published / 750.00.

SELECT '--- P-APP-04: app user TRUNCATE refused (expect FAIL 1142) ---' AS test_case;
TRUNCATE TABLE ledger_entries;
SELECT COUNT(*) AS ledger_rows_after_truncate_attempt FROM ledger_entries;
-- EXPECTED: ERROR 1142 (42000) DROP command denied to user
-- 'satanipara_app_test'@'localhost' for table 'ledger_entries'.
-- (MariaDB requires DROP for TRUNCATE; triggers do not fire on TRUNCATE,
-- so the privilege is the only defence — T-LED-20.)

SELECT '--- P-APP-05: app user DDL refused (expect FAIL 1142 x2 here; CREATE TRIGGER in 04b2) ---' AS test_case;
DROP TRIGGER trg_ledger_entries_bd;
ALTER TABLE ledger_entries ADD COLUMN evil_col VARCHAR(10) NULL;
SHOW TRIGGERS FROM satanipara_test_c;
-- EXPECTED: both fail with ERROR 1142 (42000):
-- TRIGGER command denied ... / ALTER command denied to user
-- 'satanipara_app_test'@'localhost' for table 'ledger_entries'. (T-LED-21.)
-- The CREATE TRIGGER denial is tested separately in 04b2-create-trigger-attempt.sql,
-- because a multi-statement trigger body needs DELIMITER handling the --force
-- batch run cannot express inline here.

SELECT '--- P-APP-06: app user cannot UPDATE/DELETE the audit log (expect FAIL 1142 x2) ---' AS test_case;
INSERT INTO activity_log (actor_id, actor_role, action, subject_type, subject_id)
  VALUES (11, 'Member', 'finance.entries.create', 'ledger_entries',
          (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0020'));
UPDATE activity_log SET action='finance.entries.forged' WHERE id=2;
DELETE FROM activity_log WHERE id=2;
SELECT id, action FROM activity_log WHERE id=2;
-- EXPECTED: INSERT succeeds (app user has SELECT, INSERT on activity_log).
-- UPDATE and DELETE fail with ERROR 1142 (42000)
-- UPDATE/DELETE command denied to user 'satanipara_app_test'@'localhost'
-- for table 'activity_log'. Row intact.
-- (Note: id=2 assumes L-16 inserted id=1 first; if the id differs, adjust
-- the WHERE clause to the row just inserted and record the actual id.)

SELECT '--- P-APP-07: app user cannot DELETE a reversal link row (expect FAIL 1142) ---' AS test_case;
DELETE FROM ledger_reversals
  WHERE reversal_entry_id = (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0003');
SELECT COUNT(*) AS reversal_rows_after_app_delete_attempt FROM ledger_reversals;
-- EXPECTED: ERROR 1142 (42000) DELETE command denied ... for table 'ledger_reversals'.
-- COUNT stays 2.
