-- ============================================================================
-- Satanipara Community — Ledger / Trigger / Privilege test suite (Worker C)
-- File 04e: privilege-test cleanup (run as a root-equivalent user)
-- ----------------------------------------------------------------------------
--   mariadb -u root -p < 04e-privilege-cleanup.sql
-- Drops the four test users and the scratch database. Run this LAST, after
-- the results have been recorded in TEST-RESULTS.md.
-- ============================================================================

DROP USER IF EXISTS 'satanipara_app_test'@'localhost';
DROP USER IF EXISTS 'satanipara_migrate_test'@'localhost';
DROP USER IF EXISTS 'satanipara_backup_test'@'localhost';
DROP USER IF EXISTS 'satanipara_report_test'@'localhost';
DROP DATABASE IF EXISTS satanipara_test_c;
SELECT 'CLEANUP OK — test users and satanipara_test_c dropped' AS cleanup_status;
