-- ============================================================================
-- Satanipara Community — Ledger / Trigger / Privilege test suite (Worker C)
-- File 04a: privilege-test setup (run as a root-equivalent user)
-- ----------------------------------------------------------------------------
-- Creates the four identities as TEST users on the scratch database only,
-- with the exact grant sets from ../identities.sql (adapted to the scratch
-- database name). Passwords here are TEST-ONLY and are dropped by 04e.
--
--   mariadb -u root -p < 04a-privilege-setup.sql
--
-- MariaDB notes:
--   * There is no DENY in MariaDB/MySQL: a privilege granted at database
--     level cannot be subtracted at table level. That is why the app user
--     gets per-table grants, NOT a database-level grant with a REVOKE.
--   * TRUNCATE requires the DROP privilege; DROP TRIGGER requires TRIGGER.
-- ============================================================================

USE satanipara_test_c;

-- Clean slate (idempotent re-runs).
DROP USER IF EXISTS 'satanipara_app_test'@'localhost';
DROP USER IF EXISTS 'satanipara_migrate_test'@'localhost';
DROP USER IF EXISTS 'satanipara_backup_test'@'localhost';
DROP USER IF EXISTS 'satanipara_report_test'@'localhost';

-- (i) App runtime — DML on the ledger tables, NO delete, NO DDL.
CREATE USER 'satanipara_app_test'@'localhost' IDENTIFIED BY 'test-only-app-pass';
GRANT SELECT, INSERT, UPDATE ON satanipara_test_c.ledger_entries
  TO 'satanipara_app_test'@'localhost';
GRANT SELECT, INSERT, UPDATE ON satanipara_test_c.ledger_reversals
  TO 'satanipara_app_test'@'localhost';
GRANT SELECT, INSERT ON satanipara_test_c.activity_log
  TO 'satanipara_app_test'@'localhost';
GRANT SELECT, UPDATE ON satanipara_test_c.sequences
  TO 'satanipara_app_test'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON satanipara_test_c.users
  TO 'satanipara_app_test'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON satanipara_test_c.finance_categories
  TO 'satanipara_app_test'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON satanipara_test_c.projects
  TO 'satanipara_app_test'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON satanipara_test_c.activities
  TO 'satanipara_app_test'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON satanipara_test_c.media
  TO 'satanipara_app_test'@'localhost';

-- (ii) Migrations — full DDL + DML on the scratch database, deploy only.
CREATE USER 'satanipara_migrate_test'@'localhost' IDENTIFIED BY 'test-only-mig-pass';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, INDEX, REFERENCES,
  CREATE VIEW, SHOW VIEW, CREATE ROUTINE, ALTER ROUTINE, EVENT, TRIGGER,
  LOCK TABLES
  ON satanipara_test_c.* TO 'satanipara_migrate_test'@'localhost';

-- (iii) Backup — read-only + LOCK TABLES (mysqldump set).
CREATE USER 'satanipara_backup_test'@'localhost' IDENTIFIED BY 'test-only-bkp-pass';
GRANT SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER
  ON satanipara_test_c.* TO 'satanipara_backup_test'@'localhost';

-- (iv) Reporting — SELECT on the finance tables only (created only when the
-- Finance Auditor role is needed; here created to prove the scope).
CREATE USER 'satanipara_report_test'@'localhost' IDENTIFIED BY 'test-only-rep-pass';
GRANT SELECT ON satanipara_test_c.ledger_entries
  TO 'satanipara_report_test'@'localhost';
GRANT SELECT ON satanipara_test_c.ledger_reversals
  TO 'satanipara_report_test'@'localhost';
GRANT SELECT ON satanipara_test_c.finance_categories
  TO 'satanipara_report_test'@'localhost';
GRANT SELECT ON satanipara_test_c.projects
  TO 'satanipara_report_test'@'localhost';

FLUSH PRIVILEGES;

SHOW GRANTS FOR 'satanipara_app_test'@'localhost';
SHOW GRANTS FOR 'satanipara_migrate_test'@'localhost';
SHOW GRANTS FOR 'satanipara_backup_test'@'localhost';
SHOW GRANTS FOR 'satanipara_report_test'@'localhost';
SELECT 'PRIVILEGE SETUP OK' AS privilege_setup_status;
