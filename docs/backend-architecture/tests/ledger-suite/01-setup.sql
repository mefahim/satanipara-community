-- ============================================================================
-- Satanipara Community — Ledger / Trigger / Privilege test suite (Worker C)
-- File 01: setup — minimal schema on MariaDB 11.8.9 semantics
-- ----------------------------------------------------------------------------
-- Source of truth: Doc 06 §§7.1, 7.2, 8.2, 12 as reconciled in Phase 0.1.1
-- (Worker B FINDINGS.md §5 / TEST-LOG.md, MySQL 8.0.46 run).
--
-- MariaDB 11.8.9 reconciliations applied here (vs the MySQL 8.4 blueprint):
--   * Collation utf8mb4_unicode_ci — utf8mb4_0900_ai_ci does NOT exist
--     in MariaDB (SERVER-FOUNDATION-REPORT §8.2).
--   * JSON columns are a LONGTEXT alias in MariaDB (activity_log.before /
--     .after are declared JSON; MariaDB stores them as LONGTEXT and
--     validates less strictly than MySQL — Laravel handles the type).
--   * CHECK constraints are enforced in MariaDB since 10.2.1; named
--     constraints are used (never auto-generated names).
--   * ENUM, DECIMAL(12,2), SIGNAL SQLSTATE '45000', BEFORE UPDATE/DELETE/
--     INSERT triggers, and the <==> null-safe operator are all supported
--     in MariaDB 11.8 (first execution of this suite confirms SIGNAL).
--
-- Deliberate minimal-scope deviation (documented, not hidden):
--   * Only the tables this suite exercises are created. Foreign keys to
--     users / finance_categories / projects / activities / media point at
--     minimal stub tables (id only) created below, so the FKs are REAL,
--     not omitted. The full 47-table schema is a scaffold concern, not
--     a ledger-test concern.
--   * No seed data beyond what each test case inserts itself.
--
-- Run as a root-equivalent user:
--   mariadb -u root -p < 01-setup.sql
-- or via the runner: bash run-suite.sh
-- ============================================================================

SELECT VERSION() AS mariadb_version;

DROP DATABASE IF EXISTS satanipara_test_c;
CREATE DATABASE satanipara_test_c
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE satanipara_test_c;

-- --- Minimal stubs so the production FKs are real ---------------------------
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name_bn VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE finance_categories (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name_bn VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE projects (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name_bn VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE activities (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title_bn VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE media (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  path VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

-- Stub users referenced by the tests: 11 = enterer A, 22 = approver B,
-- 33 = enterer C, 44 = approver D.
INSERT INTO users (id, name_bn) VALUES
  (11, 'Enterer A'), (22, 'Approver B'), (33, 'Enterer C'), (44, 'Approver D');
INSERT INTO finance_categories (id, name_bn) VALUES (1, 'Member subscription');
INSERT INTO projects (id, name_bn) VALUES (1, 'Scholarship fund');
INSERT INTO activities (id, title_bn) VALUES (1, 'Annual activity 2026');
INSERT INTO media (id, path) VALUES (1, 'vouchers/le-2026-0001.jpg');

-- --- sequences: per-year counters for LE- / EXP- / BLD- numbers (Doc 06 §12)
CREATE TABLE sequences (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  scope VARCHAR(50) NOT NULL,
  year SMALLINT NOT NULL,
  next_value BIGINT NOT NULL DEFAULT 1,
  UNIQUE KEY uk_sequences_scope_year (scope, year),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
             ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO sequences (scope, year, next_value) VALUES ('LE', 2026, 1);

-- --- ledger_entries (Doc 06 §7.1, full field list) --------------------------
CREATE TABLE ledger_entries (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  entry_no VARCHAR(20) NOT NULL,
  entry_date DATE NOT NULL,
  kind VARCHAR(20) NOT NULL,
  category_id BIGINT NOT NULL,
  project_id BIGINT NULL,
  activity_id BIGINT NULL,
  item_bn VARCHAR(255) NOT NULL,
  item_en VARCHAR(255) NULL,
  amount DECIMAL(12,2) NOT NULL,
  payee_bn VARCHAR(255) NULL,
  note_bn TEXT NULL,
  voucher_media_id BIGINT NULL,
  donor_name_bn VARCHAR(255) NULL,
  donor_name_consented BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  entered_by BIGINT NOT NULL,
  approved_by BIGINT NULL,
  approved_at TIMESTAMP NULL,
  published_at TIMESTAMP NULL,
  rejected_by BIGINT NULL,
  rejected_at TIMESTAMP NULL,
  rejection_reason TEXT NULL,
  discarded_by BIGINT NULL,
  discarded_at TIMESTAMP NULL,
  discard_reason TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
             ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_ledger_entries_entry_no (entry_no),
  CONSTRAINT chk_ledger_amount_nonzero CHECK (amount <> 0),
  CONSTRAINT chk_ledger_status
    CHECK (status IN ('draft','published','reversed','discarded')),
  CONSTRAINT chk_ledger_dual_control
    CHECK (approved_by IS NULL OR approved_by <> entered_by),
  CONSTRAINT chk_ledger_kind
    CHECK (kind IN ('income','expense','donation')),
  CONSTRAINT fk_ledger_category
    FOREIGN KEY (category_id) REFERENCES finance_categories (id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_ledger_project
    FOREIGN KEY (project_id) REFERENCES projects (id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_ledger_activity
    FOREIGN KEY (activity_id) REFERENCES activities (id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_ledger_voucher
    FOREIGN KEY (voucher_media_id) REFERENCES media (id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_ledger_entered_by
    FOREIGN KEY (entered_by) REFERENCES users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_ledger_approved_by
    -- MariaDB 11.8.9 RULE (proven by isolation tests, Worker C TEST-RESULTS.md
    -- §2): a CHECK constraint may NOT reference a column whose foreign key
    -- uses ON DELETE SET NULL (ERROR 1901) — in either creation order, and
    -- whether the CHECK or the FK is added first. The blueprint's
    -- ON DELETE SET NULL here would make chk_ledger_dual_control
    -- un-creatable. RESTRICT is the reconciled action: users are
    -- soft-deleted / anonymised, never hard-deleted (Doc 06 §11), so a
    -- hard delete of an approver MUST fail rather than silently null out
    -- the approval on a published entry. If the build team insists on
    -- SET NULL, the fallback is to drop the CHECK and enforce dual
    -- control on INSERT with a BEFORE INSERT trigger instead.
    FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_ledger_rejected_by
    FOREIGN KEY (rejected_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_ledger_discarded_by
    FOREIGN KEY (discarded_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- --- ledger_reversals (Doc 06 §7.2) -----------------------------------------
CREATE TABLE ledger_reversals (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ledger_entry_id BIGINT NOT NULL,
  reversal_entry_id BIGINT NOT NULL,
  reason_bn TEXT NOT NULL,
  reason_en TEXT NULL,
  created_by BIGINT NOT NULL,
  approved_by BIGINT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
             ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_reversal_entry_id (reversal_entry_id),
  UNIQUE KEY uk_one_reversal_per_original (ledger_entry_id),
  CONSTRAINT chk_reversal_dual_control
    CHECK (approved_by IS NULL OR approved_by <> created_by),
  CONSTRAINT fk_reversal_original
    FOREIGN KEY (ledger_entry_id) REFERENCES ledger_entries (id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_reversal_entry
    FOREIGN KEY (reversal_entry_id) REFERENCES ledger_entries (id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_reversal_created_by
    FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_reversal_approved_by
    -- Same MariaDB 1901 rule as fk_ledger_approved_by above: ON DELETE
    -- RESTRICT, not SET NULL, so chk_reversal_dual_control can exist.
    FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- --- activity_log (Doc 06 §8.2, minimal — append-only audit) ----------------
CREATE TABLE activity_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  actor_id BIGINT NULL,
  actor_role VARCHAR(50) NULL,
  action VARCHAR(100) NOT NULL,
  subject_type VARCHAR(100) NULL,
  subject_id BIGINT NULL,
  `before` JSON NULL,
  `after` JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_actor
    FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_activity_actor (actor_id),
  INDEX idx_activity_action (action),
  INDEX idx_activity_subject (subject_type, subject_id),
  INDEX idx_activity_created (created_at)
) ENGINE=InnoDB;

SELECT 'SETUP OK — satanipara_test_c created' AS setup_status;
SHOW TABLES FROM satanipara_test_c;
