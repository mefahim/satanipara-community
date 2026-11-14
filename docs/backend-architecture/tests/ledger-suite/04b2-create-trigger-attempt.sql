-- ============================================================================
-- Satanipara Community — Ledger / Trigger / Privilege test suite (Worker C)
-- File 04b2: app-user CREATE TRIGGER denial (Doc 10 T-LED-21, third leg)
-- ----------------------------------------------------------------------------
-- Run as the test app user, with --force. The DELIMITER block is required
-- so the multi-statement trigger body reaches the server as one statement
-- and is refused there with 1142 (rather than failing in the client).
--
--   MYSQL_PWD='test-only-app-pass' mariadb -u satanipara_app_test --force \
--     < 04b2-create-trigger-attempt.sql
-- ============================================================================

USE satanipara_test_c;

SELECT '--- P-APP-05b: app user CREATE TRIGGER refused (expect FAIL 1142) ---' AS test_case;
DELIMITER //
CREATE TRIGGER trg_evil_bi BEFORE INSERT ON ledger_entries FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'evil';
END //
DELIMITER ;
SHOW TRIGGERS FROM satanipara_test_c;
-- EXPECTED: ERROR 1142 (42000) TRIGGER command denied to user
-- 'satanipara_app_test'@'localhost' for table 'ledger_entries'.
-- No trigger named trg_evil_bi exists afterwards.
