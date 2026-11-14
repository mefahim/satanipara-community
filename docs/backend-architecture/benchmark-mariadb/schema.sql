-- Satanipara Community — Bengali search benchmark schema (MariaDB rebuild).
-- Mirrors the real Phase 0 schema (doc 06) in simplified form:
--   posts      ~ doc 06 §5.2 posts + §5.3 post_translations (title_bn/body_bn)
--   persons    ~ doc 06 §3.2 persons (name_bn/name_en, area, profession)
--   activities ~ doc 06 §5.1 activities (title_bn/body_bn, year, category)
-- All tables InnoDB + utf8mb4 (utf8mb4_0900_ai_ci).
-- MariaDB note (verified on 11.8.9, 2026-11-14): utf8mb4_0900_ai_ci EXISTS
-- in MariaDB 11.8.9 (INFORMATION_SCHEMA.COLLATIONS, ID 255) and a table
-- created with it stores and matches Bengali text correctly, so the
-- Phase 0.1 MySQL schema loads unchanged on MariaDB 11.8.9. There is NO
-- ngram parser on MariaDB: indexes are the default parser only, added
-- by run_benchmark.py in stages so baseline vs indexed sizes and build
-- times can be measured. The `search_tokens` column used by the
-- tokens_ft approach is added by the runner, not here.

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
