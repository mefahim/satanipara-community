-- ============================================================================
-- Satanipara Community — Ledger / Trigger / Privilege test suite (Worker C)
-- File 02: trigger definitions T1–T5 + audit triggers A1–A2
-- ----------------------------------------------------------------------------
-- T1–T4: proven on MySQL 8.0.46 (Phase 0.1.1 Worker B TEST-LOG.md).
-- T1 here is the FULL-COLUMN form required by Doc 10 T-LED-12: the tested
-- 8.0.46 form compared only id/entry_no/amount/entered_by/approved_by in
-- the published branch. This form whitelists the flip: the published ->
-- reversed update succeeds ONLY if NEW equals OLD on every column except
-- `status` and `updated_at`. T3 likewise compares every column including
-- reason_en and updated_at (the 8.0.46 form already compared all columns
-- present in its minimal table; this form adds reason_en / updated_at).
--
-- T5: FIRST EXECUTION. Specified in Phase 0.1.1 Worker B FINDINGS.md §5,
-- never executed anywhere before this suite (Doc 10 T-LED-13). It is
-- defence in depth behind the service checks (F6, 409) and the unique key
-- uk_one_reversal_per_original (1062): the unique key is the atomic guard
-- under concurrency; T5's COUNT(*) checks cannot see uncommitted rows of
-- other transactions, so a concurrent double-insert is still stopped by
-- the unique key, not by T5. Both layers must pass.
--
-- A1/A2: Doc 06 §8.2 second layer for the append-only audit log.
--
-- All triggers raise SQLSTATE '45000' (MariaDB error 1644). Created by the
-- migration user in production, never by the app user.
--
-- Run as a root-equivalent user AFTER 01-setup.sql:
--   mariadb -u root -p < 02-triggers.sql
-- ============================================================================

USE satanipara_test_c;

DELIMITER //

-- --- T1: BEFORE UPDATE on ledger_entries — the ledger state machine ---------
CREATE TRIGGER trg_ledger_entries_bu
BEFORE UPDATE ON ledger_entries FOR EACH ROW
BEGIN
  IF OLD.status = 'reversed' OR OLD.status = 'discarded' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Reversed or discarded ledger entries are immutable.';
  ELSEIF OLD.status = 'published' THEN
    -- Only the published -> reversed flip, with every other column
    -- unchanged except updated_at.
    IF NOT (
      NEW.status = 'reversed'
      AND NEW.id <=> OLD.id
      AND NEW.entry_no <=> OLD.entry_no
      AND NEW.entry_date <=> OLD.entry_date
      AND NEW.kind <=> OLD.kind
      AND NEW.category_id <=> OLD.category_id
      AND NEW.project_id <=> OLD.project_id
      AND NEW.activity_id <=> OLD.activity_id
      AND NEW.item_bn <=> OLD.item_bn
      AND NEW.item_en <=> OLD.item_en
      AND NEW.amount <=> OLD.amount
      AND NEW.payee_bn <=> OLD.payee_bn
      AND NEW.note_bn <=> OLD.note_bn
      AND NEW.voucher_media_id <=> OLD.voucher_media_id
      AND NEW.donor_name_bn <=> OLD.donor_name_bn
      AND NEW.donor_name_consented <=> OLD.donor_name_consented
      AND NEW.entered_by <=> OLD.entered_by
      AND NEW.approved_by <=> OLD.approved_by
      AND NEW.approved_at <=> OLD.approved_at
      AND NEW.published_at <=> OLD.published_at
      AND NEW.rejected_by <=> OLD.rejected_by
      AND NEW.rejected_at <=> OLD.rejected_at
      AND NEW.rejection_reason <=> OLD.rejection_reason
      AND NEW.discarded_by <=> OLD.discarded_by
      AND NEW.discarded_at <=> OLD.discarded_at
      AND NEW.discard_reason <=> OLD.discard_reason
      AND NEW.created_at <=> OLD.created_at
    ) THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Published ledger entries are immutable; only the published -> reversed status change is permitted.';
    END IF;
  ELSEIF OLD.status = 'draft' THEN
    IF NEW.id <> OLD.id OR NEW.entry_no <> OLD.entry_no
       OR NEW.entered_by <> OLD.entered_by THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ledger entry id, entry_no and entered_by are immutable.';
    END IF;
    IF NEW.status NOT IN ('draft','published','discarded') THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid ledger status transition from draft.';
    END IF;
    IF NEW.status = 'published'
       AND (NEW.approved_by IS NULL OR NEW.approved_by = OLD.entered_by) THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Publishing requires an approver different from the enterer.';
    END IF;
  END IF;
END //

-- --- T2: BEFORE DELETE on ledger_entries — no delete, ever, for anyone -----
CREATE TRIGGER trg_ledger_entries_bd
BEFORE DELETE ON ledger_entries FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Ledger entries are never deleted; use a reversal.';
END //

-- --- T3: BEFORE UPDATE on ledger_reversals — one-time approval fill only ---
CREATE TRIGGER trg_ledger_reversals_bu
BEFORE UPDATE ON ledger_reversals FOR EACH ROW
BEGIN
  IF NOT (
    OLD.approved_by IS NULL
    AND NEW.approved_by IS NOT NULL
    AND NEW.id <=> OLD.id
    AND NEW.ledger_entry_id <=> OLD.ledger_entry_id
    AND NEW.reversal_entry_id <=> OLD.reversal_entry_id
    AND NEW.reason_bn <=> OLD.reason_bn
    AND NEW.reason_en <=> OLD.reason_en
    AND NEW.created_by <=> OLD.created_by
    AND NEW.created_at <=> OLD.created_at
    -- updated_at is the only other column allowed to change (it is
    -- maintained by the ON UPDATE CURRENT_TIMESTAMP clause).
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Reversal records are immutable; only the one-time approval (approved_by) may be filled.';
  END IF;
END //

-- --- T4: BEFORE DELETE on ledger_reversals — no delete, ever ----------------
CREATE TRIGGER trg_ledger_reversals_bd
BEFORE DELETE ON ledger_reversals FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Reversal records are never deleted.';
END //

-- --- T5: BEFORE INSERT on ledger_reversals — FIRST EXECUTION ---------------
-- Rejects the link row unless ALL of these hold:
--   (a) the referenced original entry exists;
--   (b) the original is currently 'published';
--   (c) the original is not already the original of another reversal row;
--   (d) the original is not itself a reversal entry (i.e. it never appears
--       as reversal_entry_id in any row).
-- Notes for the MariaDB run:
--   * SELECT ... INTO with no matching row leaves the variable NULL and
--     raises warning 1329 (not an error) — the IS NULL check below is the
--     intended path for case (a). If the run shows 1329 as an error, the
--     trigger must be rewritten with a COUNT(*) existence check instead.
--   * A BEFORE INSERT trigger fires BEFORE the foreign-key check, so a
--     nonexistent original is expected to fail here with 1644, not 1452.
--     Record whichever code the run actually produces.
--   * The COUNT(*) checks in (c)/(d) are defence in depth only; under a
--     concurrent double-insert the UNIQUE key uk_one_reversal_per_original
--     (error 1062) is the atomic guard.
CREATE TRIGGER trg_ledger_reversals_bi
BEFORE INSERT ON ledger_reversals FOR EACH ROW
BEGIN
  DECLARE v_status VARCHAR(20);
  DECLARE v_already_reversed INT;
  DECLARE v_is_reversal_entry INT;

  SELECT status INTO v_status
    FROM ledger_entries WHERE id = NEW.ledger_entry_id;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Reversal original entry does not exist.';
  ELSEIF v_status <> 'published' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Only a published ledger entry can be reversed.';
  END IF;

  SELECT COUNT(*) INTO v_already_reversed
    FROM ledger_reversals WHERE ledger_entry_id = NEW.ledger_entry_id;
  IF v_already_reversed > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'This ledger entry already has a reversal.';
  END IF;

  SELECT COUNT(*) INTO v_is_reversal_entry
    FROM ledger_reversals WHERE reversal_entry_id = NEW.ledger_entry_id;
  IF v_is_reversal_entry > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'A reversal entry cannot itself be reversed.';
  END IF;
END //

-- --- A1: BEFORE UPDATE on activity_log — append-only, second layer ----------
CREATE TRIGGER trg_activity_log_bu
BEFORE UPDATE ON activity_log FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Audit log rows are never updated.';
END //

-- --- A2: BEFORE DELETE on activity_log — append-only, second layer ----------
CREATE TRIGGER trg_activity_log_bd
BEFORE DELETE ON activity_log FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Audit log rows are never deleted.';
END //

DELIMITER ;

SELECT 'TRIGGERS OK' AS trigger_status;
SHOW TRIGGERS FROM satanipara_test_c;
SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, ACTION_TIMING
  FROM information_schema.TRIGGERS
  WHERE TRIGGER_SCHEMA = 'satanipara_test_c' ORDER BY TRIGGER_NAME;
SELECT CONSTRAINT_NAME, TABLE_NAME, CHECK_CLAUSE
  FROM information_schema.CHECK_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = 'satanipara_test_c' ORDER BY TABLE_NAME, CONSTRAINT_NAME;
