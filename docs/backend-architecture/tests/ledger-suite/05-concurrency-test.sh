#!/usr/bin/env bash
# ============================================================================
# Satanipara Community — Ledger / Trigger / Privilege test suite (Worker C)
# File 05: concurrent double-publish race (Doc 10 T-LED-07)
# ----------------------------------------------------------------------------
# Two sessions attempt to publish the same draft simultaneously.
# EXPECTED: exactly one session's guarded UPDATE affects 1 row (winner);
# the other affects 0 rows (loser -> the app returns 409). The row ends
# 'published' with exactly one approved_by / approved_at.
# DB-level scope: this proves the guarded UPDATE is atomic. The app-level
# legs of T-LED-07 (one 200 + one 409 at the API, exactly one audit row)
# belong to the Laravel feature test.
#
# Connection: uses the same MARIADB_* environment as run-suite.sh
# (MARIADB_HOST / MARIADB_PORT / MARIADB_SOCKET / MARIADB_USER /
#  MYSQL_PWD). The runner (run-suite.sh) calls this script; it can also
# be run standalone after files 01–03 have been executed:
#
#   MARIADB_SOCKET=/path/to/mariadb.sock MYSQL_PWD='<root-pass>' \
#     bash 05-concurrency-test.sh
#
# Exit code: 0 if exactly one winner, 1 otherwise.
# ============================================================================
set -u
cd "$(dirname "$0")"

MARIADB_BIN="${MARIADB_BIN:-mariadb}"
# Build the connection arguments from the environment. Prefer socket when set.
CONN_ARGS=()
if [ -n "${MARIADB_SOCKET:-}" ]; then
  CONN_ARGS+=(--socket="$MARIADB_SOCKET")
else
  CONN_ARGS+=(--host="${MARIADB_HOST:-127.0.0.1}" --port="${MARIADB_PORT:-3306}")
fi
CONN_ARGS+=(--user="${MARIADB_USER:-root}")
# Password comes from MYSQL_PWD in the environment (never on the command line).

OUT_DIR="${OUT_DIR:-./results}"
mkdir -p "$OUT_DIR"
A_OUT="$OUT_DIR/05-session-a.txt"
B_OUT="$OUT_DIR/05-session-b.txt"

# --- Setup: fresh draft row (root session) ---------------------------------
# Run-unique entry_no: a ledger row can never be deleted (T2 fires for
# every user including root), so the race row must be new on every run.
# Format LE-R<yyyymmddHHMM> fits VARCHAR(20); it is a test row only — the
# production LE-2026-NNNN sequence is allocated from `sequences`, not here.
RACE_ENTRY_NO="LE-R$(date +%Y%m%d%H%M)"
"$MARIADB_BIN" "${CONN_ARGS[@]}" --force <<SQL
USE satanipara_test_c;
INSERT INTO ledger_entries
  (entry_no, entry_date, kind, category_id, item_bn, amount, entered_by)
  VALUES ('$RACE_ENTRY_NO','2026-01-21','income',1,'Race test draft',100.00,11);
SELECT 'RACE SETUP OK — draft $RACE_ENTRY_NO created' AS setup;
SQL

# --- Launch both sessions concurrently (different approvers) ----------------
"$MARIADB_BIN" "${CONN_ARGS[@]}" --init-command="SET @approver := 22, @race_entry := '$RACE_ENTRY_NO';" \
  < 05a-publish-session.sql > "$A_OUT" 2>&1 &
PID_A=$!
"$MARIADB_BIN" "${CONN_ARGS[@]}" --init-command="SET @approver := 44, @race_entry := '$RACE_ENTRY_NO';" \
  < 05a-publish-session.sql > "$B_OUT" 2>&1 &
PID_B=$!

wait "$PID_A"; RC_A=$?
wait "$PID_B"; RC_B=$?

echo "Session A (approver 22) exit: $RC_A — see $A_OUT"
echo "Session B (approver 44) exit: $RC_B — see $B_OUT"

# --- Verdict: exactly one winner -------------------------------------------
A_ROWS=$(grep -A1 'publish_affected_rows' "$A_OUT" | tail -1 | awk '{print $1}')
B_ROWS=$(grep -A1 'publish_affected_rows' "$B_OUT" | tail -1 | awk '{print $1}')
echo "Session A affected rows: ${A_ROWS:-<unparsed>}"
echo "Session B affected rows: ${B_ROWS:-<unparsed>}"

"$MARIADB_BIN" "${CONN_ARGS[@]}" --force <<SQL
USE satanipara_test_c;
SELECT entry_no, status, approved_by, approved_at FROM ledger_entries
  WHERE entry_no = '$RACE_ENTRY_NO';
-- Informational only: the DB-level race writes no activity_log row (there
-- is no app layer here), so this count is expected to be 0. The "exactly
-- one publish audit row" leg of T-LED-07 belongs to the Laravel feature
-- test, not to this DB-level race.
SELECT COUNT(*) AS publish_audit_rows_written_by_db_race FROM activity_log
  WHERE subject_type = 'ledger_entries'
    AND subject_id = (SELECT id FROM ledger_entries WHERE entry_no = '$RACE_ENTRY_NO')
    AND action = 'finance.entries.publish';
SQL

TOTAL=$(( ${A_ROWS:-0} + ${B_ROWS:-0} ))
if [ "$TOTAL" -eq 1 ] && { [ "${A_ROWS:-0}" -eq 1 ] || [ "${B_ROWS:-0}" -eq 1 ]; }; then
  echo "RACE RESULT: PASS — exactly one winner (total affected rows = 1)."
  exit 0
else
  echo "RACE RESULT: FAIL — expected total affected rows = 1, got $TOTAL."
  exit 1
fi
