-- ============================================================================
-- Satanipara Community — Ledger / Trigger / Privilege test suite (Worker C)
-- File 03: executable test cases L-01 … L-17
-- ----------------------------------------------------------------------------
-- Run AFTER 01-setup.sql and 02-triggers.sql, with --force so that the
-- EXPECTED errors do not abort the run (every expected failure is visible
-- inline, exactly as in Phase 0.1.1 Worker B TEST-LOG.md):
--
--   mariadb -u root -p --force < 03-test-cases.sql > 03-output.txt 2>&1
--
-- or via the runner: bash run-suite.sh
--
-- Row plan (by entry_no; all id references use subqueries, so the file is
-- independent of AUTO_INCREMENT order):
--   LE-2026-0001  draft -> published -> reversed (main happy path)
--   LE-2026-0002  draft -> discard path + discarded immutability
--   LE-2026-0003  reversal entry for LE-2026-0001 (amount -1200)
--   LE-2026-0004  draft, stays draft (T5 "original is a draft")
--   LE-2026-0005  published (T5 success-case original; stays published)
--   LE-2026-0006  draft reversal entry for LE-2026-0005
--   LE-2026-0007  draft (identity-column immutability)
--   LE-2026-0008  draft (invalid transition draft -> reversed)
--   LE-2026-0009  draft (second-reversal attempt entry, original reversed)
--   LE-2026-0010  published (reversal CHECK test original)
--   LE-2026-0011  draft (reversal CHECK test reversal entry)
--   LE-2026-0012  published (L-05 full-column sweep target)
--   LE-2026-0017  draft (second-reversal attempt entry, original published)
-- Stub users: 11 = enterer A, 22 = approver B, 33 = enterer C, 44 = approver D.
-- ============================================================================

USE satanipara_test_c;

-- Extra stubs for the L-05 column sweep (valid FK targets to swap to).
INSERT INTO finance_categories (id, name_bn) VALUES (2, 'Donation');
INSERT INTO projects (id, name_bn) VALUES (2, 'Medical fund');
INSERT INTO activities (id, title_bn) VALUES (2, 'Winter clothing 2026');
INSERT INTO media (id, path) VALUES (2, 'vouchers/other.jpg');

-- ============================ L-01 ==========================================
SELECT '--- L-01: draft field edit allowed (expect SUCCESS) ---' AS test_case;
INSERT INTO ledger_entries
  (entry_no, entry_date, kind, category_id, item_bn, amount, entered_by)
  VALUES ('LE-2026-0001','2026-01-05','income',1,'Member subscription',1000.00,11);
UPDATE ledger_entries SET amount = 1200.00, item_bn = 'Member subscription (corrected)'
  WHERE entry_no = 'LE-2026-0001';
SELECT entry_no, status, amount, item_bn FROM ledger_entries WHERE entry_no='LE-2026-0001';
-- EXPECTED: UPDATE succeeds; row shows draft / 1200.00 / corrected item_bn.

-- ============================ L-02 ==========================================
SELECT '--- L-02: draft -> published, dual control (expect SUCCESS) ---' AS test_case;
UPDATE ledger_entries
  SET status='published', approved_by=22,
      approved_at=NOW(), published_at=NOW()
  WHERE entry_no='LE-2026-0001' AND status='draft';
SELECT entry_no, status, entered_by, approved_by FROM ledger_entries WHERE entry_no='LE-2026-0001';
-- EXPECTED: UPDATE succeeds (1 row affected); published / entered_by 11 / approved_by 22.

-- ============================ L-03 ==========================================
SELECT '--- L-03: draft -> published, approver = enterer (expect FAIL 1644) ---' AS test_case;
INSERT INTO ledger_entries
  (entry_no, entry_date, kind, category_id, item_bn, amount, entered_by)
  VALUES ('LE-2026-0002','2026-01-06','donation',1,'One-off donation',500.00,11);
UPDATE ledger_entries SET status='published', approved_by=11
  WHERE entry_no='LE-2026-0002' AND status='draft';
SELECT entry_no, status, approved_by FROM ledger_entries WHERE entry_no='LE-2026-0002';
-- EXPECTED: ERROR 1644 (45000) 'Publishing requires an approver different from the enterer.'
-- Row stays draft, approved_by NULL. (The CHECK chk_ledger_dual_control
-- would also reject it — the trigger fires first.)

-- ============================ L-04 ==========================================
SELECT '--- L-04: draft -> discarded, entry_no retained, never reused (expect SUCCESS then FAIL 1062) ---' AS test_case;
UPDATE ledger_entries
  SET status='discarded', discarded_by=22, discarded_at=NOW(),
      discard_reason='Entered in error, duplicate of LE-2026-0001'
  WHERE entry_no='LE-2026-0002' AND status='draft';
SELECT entry_no, status, discarded_by, discard_reason FROM ledger_entries WHERE entry_no='LE-2026-0002';
INSERT INTO ledger_entries
  (entry_no, entry_date, kind, category_id, item_bn, amount, entered_by)
  VALUES ('LE-2026-0002','2026-01-07','donation',1,'Attempted reuse of discarded number',100.00,11);
SELECT entry_no, status FROM ledger_entries WHERE entry_no='LE-2026-0002';
-- EXPECTED: discard UPDATE succeeds; discarded_by 22, reason stored, row
-- still present with entry_no LE-2026-0002. The re-INSERT fails:
-- ERROR 1062 (23000) Duplicate entry 'LE-2026-0002' for key 'uk_ledger_entries_entry_no'.

-- ============================ L-05 ==========================================
-- T-LED-12: published-branch compares EVERY column (full-column T1).
SELECT '--- L-05: published -> reversed with one other column changed (expect FAIL 1644, x13) ---' AS test_case;
INSERT INTO ledger_entries
  (entry_no, entry_date, kind, category_id, project_id, activity_id, item_bn, amount,
   payee_bn, note_bn, voucher_media_id, donor_name_bn, entered_by, approved_by,
   approved_at, published_at, status)
  VALUES ('LE-2026-0012','2026-01-08','income',1,1,1,'Project donation',2000.00,
   'Donor X','Note','1','Donor X',11,22,NOW(),NOW(),'published');
UPDATE ledger_entries SET status='reversed', amount=2001.00 WHERE entry_no='LE-2026-0012';
UPDATE ledger_entries SET status='reversed', entry_date='2026-02-01' WHERE entry_no='LE-2026-0012';
UPDATE ledger_entries SET status='reversed', kind='expense' WHERE entry_no='LE-2026-0012';
UPDATE ledger_entries SET status='reversed', category_id=2 WHERE entry_no='LE-2026-0012';
UPDATE ledger_entries SET status='reversed', project_id=2 WHERE entry_no='LE-2026-0012';
UPDATE ledger_entries SET status='reversed', activity_id=2 WHERE entry_no='LE-2026-0012';
UPDATE ledger_entries SET status='reversed', item_bn='Changed item' WHERE entry_no='LE-2026-0012';
UPDATE ledger_entries SET status='reversed', payee_bn='Someone else' WHERE entry_no='LE-2026-0012';
UPDATE ledger_entries SET status='reversed', note_bn='Changed note' WHERE entry_no='LE-2026-0012';
UPDATE ledger_entries SET status='reversed', voucher_media_id=2 WHERE entry_no='LE-2026-0012';
UPDATE ledger_entries SET status='reversed', donor_name_bn='Other donor' WHERE entry_no='LE-2026-0012';
UPDATE ledger_entries SET status='reversed', approved_by=33 WHERE entry_no='LE-2026-0012';
UPDATE ledger_entries SET status='reversed', approved_at='2026-01-01 00:00:00' WHERE entry_no='LE-2026-0012';
-- (Fixed timestamp, NOT NOW(): the insert set approved_at=NOW(), and a
-- NOW() here could fall in the same second, making NEW.approved_at equal
-- OLD.approved_at — the flip would then legitimately succeed and the leg
-- would be vacuous. First run 20261114-134556 proved exactly that.)
SELECT entry_no, status, amount FROM ledger_entries WHERE entry_no='LE-2026-0012';
-- EXPECTED: all 13 UPDATEs fail with ERROR 1644 (45000)
-- 'Published ledger entries are immutable; only the published -> reversed status change is permitted.'
-- Row stays published / 2000.00.
SELECT '--- L-05b: published -> reversed, ONLY status changed (expect SUCCESS) ---' AS test_case;
SELECT entry_no, status, amount, item_bn, approved_by, updated_at
  FROM ledger_entries WHERE entry_no='LE-2026-0012';
UPDATE ledger_entries SET status='reversed' WHERE entry_no='LE-2026-0012' AND status='published';
SELECT entry_no, status, amount, item_bn, approved_by, updated_at
  FROM ledger_entries WHERE entry_no='LE-2026-0012';
-- EXPECTED: UPDATE succeeds (1 row affected). Only status (published ->
-- reversed) and updated_at differ between the two SELECTs; every other
-- column is byte-identical.

-- ============================ L-06 ==========================================
SELECT '--- L-06: published -> reversed via the approved-reversal path (expect SUCCESS) ---' AS test_case;
INSERT INTO ledger_entries
  (entry_no, entry_date, kind, category_id, item_bn, amount, entered_by)
  VALUES ('LE-2026-0003','2026-01-09','income',1,'Reversal of LE-2026-0001',-1200.00,33);
UPDATE ledger_entries SET status='published', approved_by=44,
      approved_at=NOW(), published_at=NOW()
  WHERE entry_no='LE-2026-0003' AND status='draft';
INSERT INTO ledger_reversals (ledger_entry_id, reversal_entry_id, reason_bn, created_by)
  VALUES ((SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0001'),
          (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0003'),
          'Wrong amount entered on the original entry', 33);
SELECT ledger_entry_id, reversal_entry_id, approved_by FROM ledger_reversals
  WHERE reversal_entry_id = (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0003');
UPDATE ledger_reversals SET approved_by=44
  WHERE reversal_entry_id = (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0003');
UPDATE ledger_entries SET status='reversed' WHERE entry_no='LE-2026-0001' AND status='published';
SELECT entry_no, status FROM ledger_entries WHERE entry_no IN ('LE-2026-0001','LE-2026-0003');
SELECT ledger_entry_id, reversal_entry_id, approved_by FROM ledger_reversals
  WHERE reversal_entry_id = (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0003');
-- EXPECTED: all four statements succeed. Original LE-2026-0001 is 'reversed',
-- reversal entry LE-2026-0003 is 'published', link row approved_by 44.

-- ============================ L-07 ==========================================
SELECT '--- L-07: reversed-row immutability (expect FAIL 1644 x3) ---' AS test_case;
UPDATE ledger_entries SET amount = 1.00 WHERE entry_no = 'LE-2026-0001';
UPDATE ledger_entries SET status = 'published' WHERE entry_no = 'LE-2026-0001';
DELETE FROM ledger_entries WHERE entry_no = 'LE-2026-0001';
SELECT entry_no, status, amount FROM ledger_entries WHERE entry_no='LE-2026-0001';
-- EXPECTED: UPDATE amount -> 1644 'Reversed or discarded ledger entries are immutable.'
-- UPDATE status -> same 1644. DELETE -> 1644 'Ledger entries are never deleted; use a reversal.'
-- Row unchanged: reversed / 1200.00.

-- ============================ L-08 ==========================================
SELECT '--- L-08: second reversal of an ALREADY-REVERSED original (expect FAIL 1644, status branch) ---' AS test_case;
INSERT INTO ledger_entries
  (entry_no, entry_date, kind, category_id, item_bn, amount, entered_by)
  VALUES ('LE-2026-0009','2026-01-10','income',1,'Second reversal attempt entry',-1200.00,33);
INSERT INTO ledger_reversals (ledger_entry_id, reversal_entry_id, reason_bn, created_by)
  VALUES ((SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0001'),
          (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0009'),
          'Second attempt to reverse the same original', 33);
SELECT COUNT(*) AS reversal_rows_for_original_0001 FROM ledger_reversals
  WHERE ledger_entry_id = (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0001');
-- EXPECTED: the link-row INSERT fails with ERROR 1644 (45000)
-- 'Only a published ledger entry can be reversed.' (T5 checks the original's
-- status BEFORE the already-reversed check, so a reversed original fails
-- on the status branch. COUNT stays 1.)
SELECT '--- L-08b: second reversal of a STILL-PUBLISHED original with a link row (expect FAIL 1644, already-reversed branch) ---' AS test_case;
INSERT INTO ledger_entries
  (entry_no, entry_date, kind, category_id, item_bn, amount, entered_by, approved_by,
   approved_at, published_at, status)
  VALUES ('LE-2026-0005','2026-01-11','income',1,'Entry to be reversed (T5 success case)',750.00,11,22,NOW(),NOW(),'published');
INSERT INTO ledger_entries
  (entry_no, entry_date, kind, category_id, item_bn, amount, entered_by)
  VALUES ('LE-2026-0006','2026-01-11','income',1,'Reversal of LE-2026-0005',-750.00,33);
INSERT INTO ledger_reversals (ledger_entry_id, reversal_entry_id, reason_bn, created_by)
  VALUES ((SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0005'),
          (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0006'),
          'Duplicate entry, reversing', 33);
INSERT INTO ledger_entries
  (entry_no, entry_date, kind, category_id, item_bn, amount, entered_by)
  VALUES ('LE-2026-0017','2026-01-11','income',1,'Second reversal attempt while original still published',-750.00,33);
INSERT INTO ledger_reversals (ledger_entry_id, reversal_entry_id, reason_bn, created_by)
  VALUES ((SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0005'),
          (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0017'),
          'Second attempt while original still published', 33);
SELECT COUNT(*) AS reversal_rows_for_original_0005 FROM ledger_reversals
  WHERE ledger_entry_id = (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0005');
-- EXPECTED: the first link-row INSERT succeeds (T5: original LE-2026-0005 is
-- published, unreversed, not a reversal entry). The second link-row INSERT
-- fails with ERROR 1644 (45000) 'This ledger entry already has a reversal.'
-- This is the F6-then-F6-again state (link row exists, original still
-- published). COUNT stays 1. The unique key uk_one_reversal_per_original
-- (1062) is the backstop under a concurrent double-insert.

-- ============================ L-09 ==========================================
SELECT '--- L-09: discarded-row immutability (expect FAIL 1644 x3) ---' AS test_case;
UPDATE ledger_entries SET amount=1.00 WHERE entry_no='LE-2026-0002';
UPDATE ledger_entries SET status='draft' WHERE entry_no='LE-2026-0002';
DELETE FROM ledger_entries WHERE entry_no='LE-2026-0002';
SELECT entry_no, status, amount FROM ledger_entries WHERE entry_no='LE-2026-0002';
-- EXPECTED: both UPDATEs -> 1644 'Reversed or discarded ledger entries are immutable.';
-- DELETE -> 1644 'Ledger entries are never deleted; use a reversal.'
-- Row unchanged: discarded / 500.00.

-- ============================ L-10 ==========================================
SELECT '--- L-10: reversal link-row immutability (expect FAIL 1644 x6) ---' AS test_case;
UPDATE ledger_reversals SET reason_bn='Changed reason'
  WHERE reversal_entry_id = (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0003');
UPDATE ledger_reversals SET reason_en='Changed reason'
  WHERE reversal_entry_id = (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0003');
UPDATE ledger_reversals SET created_by=11
  WHERE reversal_entry_id = (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0003');
UPDATE ledger_reversals SET ledger_entry_id=(SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0012')
  WHERE reversal_entry_id = (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0003');
UPDATE ledger_reversals SET reversal_entry_id=(SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0006')
  WHERE reversal_entry_id = (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0003');
UPDATE ledger_reversals SET approved_by=22
  WHERE reversal_entry_id = (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0003');
DELETE FROM ledger_reversals
  WHERE reversal_entry_id = (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0003');
SELECT ledger_entry_id, reversal_entry_id, reason_bn, created_by, approved_by
  FROM ledger_reversals
  WHERE reversal_entry_id = (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0003');
-- EXPECTED: all six UPDATEs fail with 1644
-- 'Reversal records are immutable; only the one-time approval (approved_by) may be filled.'
-- (the approved_by=22 attempt fails because approved_by is already filled, 44),
-- and the DELETE fails with 1644 'Reversal records are never deleted.'
-- Link row intact: approved_by 44.
SELECT '--- L-10b: one-time approved_by fill on a fresh link row (expect SUCCESS) ---' AS test_case;
UPDATE ledger_reversals SET approved_by=44
  WHERE reversal_entry_id = (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0006');
SELECT ledger_entry_id, reversal_entry_id, approved_by FROM ledger_reversals
  WHERE reversal_entry_id = (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0006');
-- EXPECTED: the fill succeeds; link row for LE-2026-0005 shows approved_by 44.

-- ============================ L-11 ==========================================
SELECT '--- L-11: T5 rejects reversal of a draft original (expect FAIL 1644) ---' AS test_case;
INSERT INTO ledger_entries
  (entry_no, entry_date, kind, category_id, item_bn, amount, entered_by)
  VALUES ('LE-2026-0004','2026-01-12','income',1,'Draft, must not be reversible',300.00,11);
INSERT INTO ledger_reversals (ledger_entry_id, reversal_entry_id, reason_bn, created_by)
  VALUES ((SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0004'),
          (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0006'),
          'Attempt to reverse a draft', 33);
-- EXPECTED: ERROR 1644 (45000) 'Only a published ledger entry can be reversed.'
-- (The reversal_entry_id reuse would also fail the unique key, but T5 fires first.)
SELECT '--- L-11b: T5 rejects reversal of a reversal entry (expect FAIL 1644) ---' AS test_case;
INSERT INTO ledger_reversals (ledger_entry_id, reversal_entry_id, reason_bn, created_by)
  VALUES ((SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0003'),
          (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0006'),
          'Attempt to reverse the reversal entry itself', 33);
-- EXPECTED: ERROR 1644 (45000) 'A reversal entry cannot itself be reversed.'
-- (LE-2026-0003 is published AND is reversal_entry_id of link row 1.)
SELECT '--- L-11c: T5 rejects a nonexistent original (expect FAIL 1644, record actual code) ---' AS test_case;
INSERT INTO ledger_reversals (ledger_entry_id, reversal_entry_id, reason_bn, created_by)
  VALUES (9999,
          (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0006'),
          'Attempt to reverse a nonexistent entry', 33);
-- EXPECTED: ERROR 1644 (45000) 'Reversal original entry does not exist.'
-- (BEFORE INSERT trigger fires before the FK check. If the run instead
-- shows ERROR 1452 (23000) FK violation, record that — it means the FK
-- fired first on this MariaDB version, and the T5 (a) branch is unproven.)

-- ============================ L-12 ==========================================
SELECT '--- L-12: direct published UPDATE / DELETE refused, privileged user (expect FAIL 1644) ---' AS test_case;
UPDATE ledger_entries SET amount = 9999.00 WHERE entry_no = 'LE-2026-0005';
UPDATE ledger_entries SET payee_bn = 'Tampered' WHERE entry_no = 'LE-2026-0005';
DELETE FROM ledger_entries WHERE entry_no = 'LE-2026-0005';
SELECT entry_no, status, amount, payee_bn FROM ledger_entries WHERE entry_no='LE-2026-0005';
-- EXPECTED: both UPDATEs -> 1644 'Published ledger entries are immutable...';
-- DELETE -> 1644 'Ledger entries are never deleted; use a reversal.'
-- (This file runs as root/migration user: the trigger, not the privilege,
-- is the backstop. The app-user 1142 equivalents are in 04b.)
-- Row unchanged: published / 750.00 / payee_bn NULL.

-- ============================ L-13 ==========================================
SELECT '--- L-13: CHECK violations (expect FAIL 4025) ---' AS test_case;
INSERT INTO ledger_entries
  (entry_no, entry_date, kind, category_id, item_bn, amount, entered_by, approved_by, status)
  VALUES ('LE-2026-0013','2026-01-13','income',1,'Self-approved insert',100.00,11,11,'published');
INSERT INTO ledger_entries
  (entry_no, entry_date, kind, category_id, item_bn, amount, entered_by)
  VALUES ('LE-2026-0014','2026-01-13','income',1,'Zero amount',0.00,11);
INSERT INTO ledger_entries
  (entry_no, entry_date, kind, category_id, item_bn, amount, entered_by)
  VALUES ('LE-2026-0015','2026-01-13','gift',1,'Invalid kind',100.00,11);
INSERT INTO ledger_entries
  (entry_no, entry_date, kind, category_id, item_bn, amount, entered_by, status)
  VALUES ('LE-2026-0016','2026-01-13','income',1,'Invalid status',100.00,11,'approved');
SELECT COUNT(*) AS rows_le_0013_to_0016 FROM ledger_entries
  WHERE entry_no IN ('LE-2026-0013','LE-2026-0014','LE-2026-0015','LE-2026-0016');
-- EXPECTED:
--   approved_by = entered_by -> ERROR 4025 (23000) Check constraint 'chk_ledger_dual_control' is violated.
--   amount = 0               -> ERROR 4025 (23000) Check constraint 'chk_ledger_amount_nonzero' is violated.
--   kind = 'gift'            -> ERROR 4025 (23000) Check constraint 'chk_ledger_kind' is violated.
--   status = 'approved'      -> ERROR 4025 (23000) Check constraint 'chk_ledger_status' is violated (MariaDB: invalid ENUM caught by the CHECK, not by truncation 1265).
--                               (ENUM rejects the value before the CHECK is reached;
--                               chk_ledger_status is the second layer). Record the actual code.
-- COUNT = 0.
SELECT '--- L-13b: reversal dual-control CHECK (expect FAIL 4025) ---' AS test_case;
INSERT INTO ledger_entries
  (entry_no, entry_date, kind, category_id, item_bn, amount, entered_by, approved_by,
   approved_at, published_at, status)
  VALUES ('LE-2026-0010','2026-01-14','income',1,'Published original for CHECK test',400.00,11,22,NOW(),NOW(),'published');
INSERT INTO ledger_entries
  (entry_no, entry_date, kind, category_id, item_bn, amount, entered_by)
  VALUES ('LE-2026-0011','2026-01-14','income',1,'Reversal entry for CHECK test',-400.00,33);
INSERT INTO ledger_reversals (ledger_entry_id, reversal_entry_id, reason_bn, created_by, approved_by)
  VALUES ((SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0010'),
          (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0011'),
          'Self-approved reversal link', 33, 33);
SELECT COUNT(*) AS self_approved_links FROM ledger_reversals
  WHERE reversal_entry_id = (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0011');
-- EXPECTED: the link-row INSERT fails with ERROR 4025 (23000)
-- Check constraint 'chk_reversal_dual_control' is violated.
-- (T5 passes first — original LE-2026-0010 is published and unreversed — then the
-- CHECK fires. COUNT = 0.)

-- ============================ L-14 ==========================================
SELECT '--- L-14: draft identity columns immutable (expect FAIL 1644 x3) ---' AS test_case;
INSERT INTO ledger_entries
  (entry_no, entry_date, kind, category_id, item_bn, amount, entered_by)
  VALUES ('LE-2026-0007','2026-01-15','expense',1,'Identity test draft',-50.00,11);
UPDATE ledger_entries SET entry_no='LE-2099-9999' WHERE entry_no='LE-2026-0007';
UPDATE ledger_entries SET entered_by=99 WHERE entry_no='LE-2026-0007';
UPDATE ledger_entries SET id=999 WHERE entry_no='LE-2026-0007';
SELECT entry_no, entered_by, id FROM ledger_entries WHERE entry_no='LE-2026-0007';
-- EXPECTED: all three UPDATEs -> 1644 'Ledger entry id, entry_no and entered_by are immutable.'
-- Row unchanged. (entered_by=99 would also fail the FK, but the trigger fires first.)

-- ============================ L-15 ==========================================
SELECT '--- L-15: invalid status transitions (expect FAIL 1644 x3) ---' AS test_case;
INSERT INTO ledger_entries
  (entry_no, entry_date, kind, category_id, item_bn, amount, entered_by)
  VALUES ('LE-2026-0008','2026-01-16','income',1,'Invalid transition draft',100.00,11);
UPDATE ledger_entries SET status='reversed' WHERE entry_no='LE-2026-0008';
UPDATE ledger_entries SET status='draft' WHERE entry_no='LE-2026-0005';
UPDATE ledger_entries SET status='discarded' WHERE entry_no='LE-2026-0005';
SELECT entry_no, status FROM ledger_entries WHERE entry_no IN ('LE-2026-0008','LE-2026-0005');
-- EXPECTED: draft -> reversed -> 1644 'Invalid ledger status transition from draft.'
-- published -> draft and published -> discarded -> 1644
-- 'Published ledger entries are immutable; only the published -> reversed status change is permitted.'
-- Rows unchanged: LE-2026-0008 draft, LE-2026-0005 published.

-- ============================ L-16 ==========================================
SELECT '--- L-16: audit log append-only as privileged user (expect INSERT ok, UPDATE/DELETE FAIL 1644) ---' AS test_case;
INSERT INTO activity_log (actor_id, actor_role, action, subject_type, subject_id, `after`)
  VALUES (22, 'Super Admin', 'finance.entries.publish', 'ledger_entries',
          (SELECT id FROM ledger_entries WHERE entry_no='LE-2026-0001'), '{"status":"published"}');
UPDATE activity_log SET action='finance.entries.forged' WHERE id=1;
DELETE FROM activity_log WHERE id=1;
SELECT id, action FROM activity_log WHERE id=1;
-- EXPECTED: INSERT succeeds. UPDATE -> 1644 'Audit log rows are never updated.'
-- DELETE -> 1644 'Audit log rows are never deleted.' Row intact.
-- (App-user equivalents — 1142 privilege denials — are in 04b.)

-- ============================ L-17 ==========================================
SELECT '--- L-17: final state — entry_no sequence, discarded numbers stay gaps ---' AS test_case;
SELECT entry_no, status, amount, entered_by, approved_by FROM ledger_entries ORDER BY entry_no;
SELECT COUNT(*) AS total_ledger_rows FROM ledger_entries;
SELECT COUNT(*) AS total_reversal_rows FROM ledger_reversals;
SELECT entry_no AS gap_check FROM ledger_entries WHERE entry_no='LE-2026-0002';
-- EXPECTED final state (by entry_no):
--   LE-2026-0001 reversed  1200.00 entered 11 approved 22
--   LE-2026-0002 discarded  500.00 entered 11 approved NULL
--   LE-2026-0003 published -1200.00 entered 33 approved 44
--   LE-2026-0004 draft       300.00 entered 11
--   LE-2026-0005 published   750.00 entered 11 approved 22
--   LE-2026-0006 draft      -750.00 entered 33
--   LE-2026-0007 draft       -50.00 entered 11
--   LE-2026-0008 draft       100.00 entered 11
--   LE-2026-0009 draft     -1200.00 entered 33
--   LE-2026-0010 published   400.00 entered 11 approved 22
--   LE-2026-0011 draft      -400.00 entered 33
--   LE-2026-0012 reversed  2000.00 entered 11 approved 22
--   LE-2026-0017 draft      -750.00 entered 33
--   total ledger rows 13; total reversal rows 2 (originals LE-2026-0001 and LE-2026-0005).
--   LE-2026-0002 is a permanent gap in the live sequence (discarded, never reused).
--   LE-2026-0013/0014/0015/0016 were never inserted (all four CHECK/ENUM attempts failed).
