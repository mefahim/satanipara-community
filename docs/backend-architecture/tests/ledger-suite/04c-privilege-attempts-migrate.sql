-- ============================================================================
-- Satanipara Community — Ledger / Trigger / Privilege test suite (Worker C)
-- File 04c: privilege attempts AS THE MIGRATION USER (Doc 10 T-LED-23)
-- ----------------------------------------------------------------------------
-- Run as the test migration user, with --force:
--
--   MYSQL_PWD='test-only-mig-pass' mariadb -u satanipara_migrate_test --force \
--     < 04c-privilege-attempts-migrate.sql
--
-- The migration user HOLDS delete/DDL privileges by design (deploy only).
-- These tests prove the TRIGGERS — not the privileges — are the backstop
-- for privileged users.
-- ============================================================================

USE satanipara_test_c;

SELECT '--- P-MIG-01: migration user DELETE stopped by trigger (expect FAIL 1644) ---' AS test_case;
DELETE FROM ledger_entries WHERE entry_no='LE-2026-0005';
SELECT entry_no, status FROM ledger_entries WHERE entry_no='LE-2026-0005';
-- EXPECTED: ERROR 1644 (45000) 'Ledger entries are never deleted; use a reversal.'
-- Row still present. (T-LED-23.)

SELECT '--- P-MIG-02: migration user DELETE of a reversal link row stopped by trigger (expect FAIL 1644) ---' AS test_case;
DELETE FROM ledger_reversals
  WHERE reversal_entry_id = (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0003');
SELECT COUNT(*) AS reversal_rows_after_mig_delete_attempt FROM ledger_reversals;
-- EXPECTED: ERROR 1644 (45000) 'Reversal records are never deleted.' COUNT stays 2.

SELECT '--- P-MIG-03: migration user CAN create/drop a trigger (expect SUCCESS — then restore) ---' AS test_case;
DELIMITER //
CREATE TRIGGER trg_tmp_probe_bi BEFORE INSERT ON ledger_entries FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'probe';
END //
DELIMITER ;
DROP TRIGGER trg_tmp_probe_bi;
SHOW TRIGGERS FROM satanipara_test_c;
-- EXPECTED: CREATE and DROP both succeed (the migration user holds TRIGGER by design), and
-- the probe trigger is dropped again immediately. This is the positive
-- control proving the 1142 denials in 04b are privilege denials, not a
-- broken trigger subsystem. It also proves why migration credentials must
-- never live in the app .env: this user CAN drop the ledger triggers, so
-- the drift check (Doc 10 T-LED-26) and code review are the controls.
