-- Satanipara Community — Bengali search benchmark schema.
-- Publishable package version (Phase 0.1.1). MySQL 8.4-compatible:
--   * InnoDB + utf8mb4 / utf8mb4_0900_ai_ci (unchanged — both exist in 8.4).
--   * ngram parser: built-in plugin, auto-loaded; ngram_token_size is a
--     startup-only variable (default 2) — it is NOT set here. If a run
--     needs a different token size, set it in the server config
--     (my.cnf: ngram_token_size=N under [mysqld]) and restart first.
--   * The FULLTEXT / B-tree indexes are created by run_benchmark.py in
--     stages (so baseline vs indexed sizes and build times are measured);
--     the equivalent DDL is listed in the comment block at the end of
--     this file for reference only — do NOT run it before the benchmark.
-- WARNING: DROP DATABASE IF EXISTS bench destroys the bench database.
-- Run only against a scratch database (default name: bench).
-- Mirrors the real Phase 0 schema (doc 06) in simplified form:
--   posts      ~ doc 06 §5.2 posts + §5.3 post_translations (title_bn/body_bn)
--   persons    ~ doc 06 §3.2 persons (name_bn/name_en, area, profession)
--   activities ~ doc 06 §5.1 activities (title_bn/body_bn, year, category)
-- All tables InnoDB + utf8mb4 (utf8mb4_0900_ai_ci), as the confirmed
-- MySQL 8.4 LTS + InnoDB decision requires.
-- Indexes are added by run_benchmark.py in stages so baseline vs indexed
-- sizes and build times can be measured.

DROP DATABASE IF EXISTS bench;
CREATE DATABASE bench CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE bench;

CREATE TABLE posts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  category VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  title_bn VARCHAR(255) NOT NULL,
  body_bn TEXT NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE persons (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name_bn VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NULL,
  area_bn VARCHAR(64) NOT NULL,
  area_en VARCHAR(64) NULL,
  profession_bn VARCHAR(64) NOT NULL,
  profession_en VARCHAR(64) NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE activities (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  year INT NOT NULL,
  category VARCHAR(32) NOT NULL,
  title_bn VARCHAR(255) NOT NULL,
  body_bn TEXT NOT NULL,
  beneficiary_count INT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Reference only — index DDL created by run_benchmark.py (do not pre-run):
--   ALTER TABLE posts ADD FULLTEXT INDEX ft_posts_ngram (title_bn, body_bn) WITH PARSER ngram;
--   ALTER TABLE persons ADD FULLTEXT INDEX ft_persons_ngram (name_bn, name_en) WITH PARSER ngram;
--   ALTER TABLE activities ADD FULLTEXT INDEX ft_activities_ngram (title_bn, body_bn) WITH PARSER ngram;
--   ALTER TABLE persons ADD INDEX idx_persons_name_bn (name_bn);
--   ALTER TABLE posts ADD INDEX idx_posts_title_bn (title_bn);
--   (default-parser copies posts_def / persons_def get a plain FULLTEXT index.)
