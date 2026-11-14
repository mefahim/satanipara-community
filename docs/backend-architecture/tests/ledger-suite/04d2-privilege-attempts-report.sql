-- ============================================================================
-- Satanipara Community — Ledger / Trigger / Privilege test suite (Worker C)
-- File 04d2: privilege attempts AS THE REPORTING USER (Doc 10 T-LED-25)
-- ----------------------------------------------------------------------------
--   MYSQL_PWD='test-only-rep-pass' mariadb -u satanipara_report_test --force \
--     < 04d2-privilege-attempts-report.sql
--
-- Scope note: the reporting user gets SELECT only on the four finance
-- tables. It has NO access to users (names/phones), activity_log, or any
-- other table. In production the reporting user additionally gets
-- column-level SELECT on users (id, name, member_no only) — see
-- ../identities.sql; the scratch schema has no such columns, so the
-- column-level leg is a production-verification item, not a scratch item.
-- ============================================================================

USE satanipara_test_c;

SELECT '--- P-REP-01: reporting user SELECT on finance tables succeeds (expect SUCCESS) ---' AS test_case;
SELECT COUNT(*) AS ledger_rows_visible_to_report FROM ledger_entries;
SELECT COUNT(*) AS reversal_rows_visible_to_report FROM ledger_reversals;
SELECT COUNT(*) AS categories_visible_to_report FROM finance_categories;
SELECT COUNT(*) AS projects_visible_to_report FROM projects;
-- EXPECTED: all four SELECTs succeed.

SELECT '--- P-REP-02: reporting user SELECT outside finance scope refused (expect FAIL 1142 x3) ---' AS test_case;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM activity_log;
SELECT COUNT(*) FROM sequences;
-- EXPECTED: all three fail with ERROR 1142 (42000) SELECT command denied
-- to user 'satanipara_report_test'@'localhost' for table '<table>'.

SELECT '--- P-REP-03: reporting user writes refused (expect FAIL 1142 x2) ---' AS test_case;
INSERT INTO ledger_entries
  (entry_no, entry_date, kind, category_id, item_bn, amount, entered_by)
  VALUES ('LE-2026-0031','2026-01-31','income',1,'Report-user write attempt',1.00,11);
UPDATE ledger_entries SET amount=1.00 WHERE entry_no='LE-2026-0004';
-- EXPECTED: both fail with ERROR 1142 (42000) INSERT/UPDATE command denied
-- to user 'satanipara_report_test'@'localhost' for table 'ledger_entries'.
