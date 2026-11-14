-- ============================================================================
-- Satanipara Community — Ledger / Trigger / Privilege test suite (Worker C)
-- File 05a: concurrent double-publish — one session's SQL (Doc 10 T-LED-07)
-- ----------------------------------------------------------------------------
-- Invoked TWICE, concurrently, by 05-concurrency-test.sh, each invocation
-- in its own mariadb client process (its own session/connection).
-- @approver and @race_entry are set via --init-command by the runner
-- (a different approver per session; a fresh, run-unique entry_no, because
-- a ledger row can never be deleted — not even by the runner — so the race
-- row must be new on every run).
--
-- The guarded publish is the atomic guard (Doc 06 §7.1):
--   1. SELECT ... FOR UPDATE takes the row lock inside a transaction.
--   2. UPDATE ... WHERE entry_no = ? AND status = 'draft' — exactly one
--      session can match the row. Whichever session commits first flips
--      the row to 'published'; the second session (blocked on the row lock
--      until the first commits, or arriving after the commit) finds no
--      row matching status='draft', so its UPDATE affects 0 rows — the
--      app translates 0 affected rows into 409.
-- The SELECT ... FOR UPDATE is additional serialisation; the WHERE clause
-- is what makes the outcome correct even without it.
--
-- No WHILE/barrier loop is used here: WHILE is only valid inside a stored
-- program, not in a batch file. The two client processes are launched
-- together by the shell script, which is simultaneous enough — the row
-- lock, not the launch timing, decides the winner.
-- ============================================================================

USE satanipara_test_c;

START TRANSACTION;
SELECT id, entry_no, status FROM ledger_entries
  WHERE entry_no = @race_entry AND status = 'draft' FOR UPDATE;
UPDATE ledger_entries
  SET status = 'published', approved_by = @approver,
      approved_at = NOW(), published_at = NOW()
  WHERE entry_no = @race_entry AND status = 'draft';
SELECT ROW_COUNT() AS publish_affected_rows, @approver AS approver_id;
COMMIT;

SELECT entry_no, status, approved_by FROM ledger_entries WHERE entry_no = @race_entry;
