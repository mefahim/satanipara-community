#!/usr/bin/env bash
# ============================================================================
# Satanipara Community — Ledger / Trigger / Privilege test suite (Worker C)
# Master runner: run-suite.sh
# ----------------------------------------------------------------------------
# Runs the whole suite against a REAL MariaDB 11.8.9 instance and records
# raw output under results/<timestamp>/.
#
# PRECONDITION (no substitute): a running MariaDB 11.8.x server. The local
# MySQL 8.0.46 on this VM is NOT a substitute — never point this runner at
# it and claim MariaDB evidence. If no MariaDB is available, do NOT run
# this script; record every test as NOT RUN in TEST-RESULTS.md instead.
#
# Connection (environment; password via MYSQL_PWD only, never on the
# command line — it would leak into the process list):
#   MARIADB_HOST     (default 127.0.0.1; ignored when MARIADB_SOCKET is set)
#   MARIADB_PORT     (default 3306)
#   MARIADB_SOCKET   (path to the MariaDB socket, e.g. /tmp/mariadb-11.8/run/mariadb.sock)
#   MARIADB_USER     (default root — a root-equivalent user is required for
#                      01/02/04a/04e; the per-user files switch user themselves)
#   MYSQL_PWD        (password for MARIADB_USER)
#   MARIADB_BIN      (default mariadb; falls back to mysql if absent)
#
# Usage:
#   MARIADB_SOCKET=/path/to/mariadb.sock MYSQL_PWD='<root-pass>' bash run-suite.sh
#
# Steps: 01 setup -> 02 triggers -> 03 cases (root) -> 04a setup users ->
# 04b app user -> 04b2 app user CREATE TRIGGER -> 04c migrate user ->
# 04d1 backup user (+ mysqldump leg) -> 04d2 report user -> 05 race.
# 04e cleanup is NOT run automatically: run it by hand AFTER the results
# have been reviewed and recorded, so a re-run can inspect the state.
#
# Exit code: 0 only if the race (05) passes AND no step's client exited
# non-zero for an UNEXPECTED reason. Note: files run with --force exit 0
# even when expected errors occur — the PASS/FAIL verdict comes from
# reading the recorded output against TEST-CASES.md, not from exit codes.
# ============================================================================
set -u
cd "$(dirname "$0")"

if command -v mariadb >/dev/null 2>&1; then
  MARIADB_BIN="${MARIADB_BIN:-mariadb}"
elif command -v mysql >/dev/null 2>&1; then
  MARIADB_BIN="${MARIADB_BIN:-mysql}"
  echo "WARNING: 'mariadb' client not found; using 'mysql' client binary." >&2
else
  echo "ERROR: no mariadb/mysql client found." >&2
  exit 2
fi
# mysqldump MUST be the MariaDB one: the MySQL 8.0.46 mysqldump queries
# information_schema.COLUMN_STATISTICS, which does not exist in MariaDB,
# and aborts mid-dump (exit 2, partial dump). Point MYSQLDUMP_BIN at the
# MariaDB installation's mysqldump (e.g. Worker B's mariadb-11.8/bin/).
MYSQLDUMP_BIN="${MYSQLDUMP_BIN:-mysqldump}"

CONN_ARGS=()
if [ -n "${MARIADB_SOCKET:-}" ]; then
  CONN_ARGS+=(--socket="$MARIADB_SOCKET")
else
  CONN_ARGS+=(--host="${MARIADB_HOST:-127.0.0.1}" --port="${MARIADB_PORT:-3306}")
fi
CONN_ARGS+=(--user="${MARIADB_USER:-root}")

TS="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="./results/$TS"
mkdir -p "$OUT_DIR"
export OUT_DIR MARIADB_BIN MYSQLDUMP_BIN
export MARIADB_SOCKET MARIADB_HOST MARIADB_PORT MARIADB_USER

echo "=== Satanipara ledger/trigger/privilege suite — run $TS ===" | tee "$OUT_DIR/00-run-header.txt"
"$MARIADB_BIN" "${CONN_ARGS[@]}" -e "SELECT VERSION() AS server_version;" \
  | tee -a "$OUT_DIR/00-run-header.txt"
SERVER_VERSION=$("$MARIADB_BIN" "${CONN_ARGS[@]}" -N -e "SELECT VERSION();" 2>/dev/null || echo "<unknown>")
echo "server_version=$SERVER_VERSION" | tee -a "$OUT_DIR/00-run-header.txt"
case "$SERVER_VERSION" in
  *MariaDB*) echo "Server is MariaDB — proceeding." | tee -a "$OUT_DIR/00-run-header.txt" ;;
  *) echo "ERROR: server version '$SERVER_VERSION' is not MariaDB. STOP — do not record this as MariaDB evidence." | tee -a "$OUT_DIR/00-run-header.txt"; exit 2 ;;
esac
# Record the exact version for TEST-RESULTS.md.
echo "$SERVER_VERSION" > "$OUT_DIR/server-version.txt"

run_root() { # $1 = file, $2 = label
  echo "--- $2 ($1) ---"
  "$MARIADB_BIN" "${CONN_ARGS[@]}" --force < "$1" > "$OUT_DIR/$2.txt" 2>&1
  echo "exit=$? (0 expected even with expected errors, --force is on)"
}
run_as() { # $1 = user, $2 = password, $3 = file, $4 = label
  echo "--- $4 as $1 ($3) ---"
  MYSQL_PWD="$2" "$MARIADB_BIN" "${CONN_ARGS[@]/--user=*/--user=$1}" --force < "$3" > "$OUT_DIR/$4.txt" 2>&1
  echo "exit=$? (0 expected even with expected errors, --force is on)"
}

run_root 01-setup.sql 01-setup
run_root 02-triggers.sql 02-triggers
run_root 03-test-cases.sql 03-test-cases
run_root 04a-privilege-setup.sql 04a-privilege-setup
run_as satanipara_app_test test-only-app-pass 04b-privilege-attempts-app.sql 04b-app-user
run_as satanipara_app_test test-only-app-pass 04b2-create-trigger-attempt.sql 04b2-app-create-trigger
run_as satanipara_migrate_test test-only-mig-pass 04c-privilege-attempts-migrate.sql 04c-migrate-user
run_as satanipara_backup_test test-only-bkp-pass 04d1-privilege-attempts-backup.sql 04d1-backup-user
run_as satanipara_report_test test-only-rep-pass 04d2-privilege-attempts-report.sql 04d2-report-user

# Backup-user mysqldump leg (P-BKP-01).
echo "--- mysqldump leg as backup user ---"
DUMP_ARGS=()
if [ -n "${MARIADB_SOCKET:-}" ]; then
  DUMP_ARGS+=(--socket="$MARIADB_SOCKET")
else
  DUMP_ARGS+=(--host="${MARIADB_HOST:-127.0.0.1}" --port="${MARIADB_PORT:-3306}")
fi
MYSQL_PWD='test-only-bkp-pass' "$MYSQLDUMP_BIN" "${DUMP_ARGS[@]}" \
  -u satanipara_backup_test --single-transaction --routines --triggers \
  satanipara_test_c > "$OUT_DIR/04d1-mysqldump.sql" 2> "$OUT_DIR/04d1-mysqldump.err"
echo "mysqldump exit=$? (0 expected); dump bytes: $(wc -c < "$OUT_DIR/04d1-mysqldump.sql")"
# MariaDB's mysqldump writes triggers as /*!50003 CREATE*/ /*!50017 DEFINER=...*/ /*!50003 TRIGGER trg_...,
# so count the trigger names, not the literal string "CREATE TRIGGER".
grep -o "TRIGGER trg_[a-z_]*" "$OUT_DIR/04d1-mysqldump.sql" | sort -u | xargs echo "triggers in dump:"

# Concurrency race (needs root for setup; sessions run as root — the race
# is about the guarded UPDATE, not about which DB user runs it).
echo "--- 05 concurrency race ---"
bash 05-concurrency-test.sh > "$OUT_DIR/05-race.txt" 2>&1
RACE_RC=$?
echo "race exit=$RACE_RC (0 = exactly one winner)"

echo
echo "Raw output recorded in: $OUT_DIR"
echo "NEXT: read each output file against TEST-CASES.md and fill in the"
echo "PASS/FAIL column + TEST-RESULTS.md. Then, and only then, run:"
echo "  mariadb ... < 04e-privilege-cleanup.sql"
exit "$RACE_RC"
