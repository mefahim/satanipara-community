# ADR-003 — Database (MySQL 8.4 LTS + InnoDB)

| | |
|---|---|
| Status | **Confirmed** |
| Date | 2026-11-14 (supersedes the 2026-11-14 "Recommended — PostgreSQL, narrow lean" version) |
| Decided by | Fahim (confirmed decision, Phase 0.1) |
| Sources | MySQL 8.4 Reference Manual (dev.mysql.com/doc/refman/8.4); laravel.com/docs/13.x/database (MySQL 5.7+ floor — MySQL 8.4 far exceeds it); Decision Sheet (as updated Phase 0.1); Engineering Plan v1.1 (which specified PostgreSQL 16 — version and engine superseded, see below); Investigator A MySQL Reconciliation (Phase 0.1, `~/workspace/satanipara-phase0-1/A-mysql-reconciliation.md`) |

## Context

The platform is a relational databank and ledger: members and families, committee terms, annual activities, expatriate requests with a status workflow, a blood-donor registry, notices/news/gallery, and a transparent accounts ledger in BDT. It starts on a single VPS. The choice is between MySQL 8.4 LTS (InnoDB) and PostgreSQL (current major). Both are adequate for the workload. The decision is made: **MySQL 8.4 LTS with InnoDB**.

## Options considered

1. **MySQL 8.4 LTS (InnoDB)** — the confirmed choice. GA 30 Apr 2024; Premier support to 30 Apr 2029; Extended support to 30 Apr 2032 (Oracle Lifetime Support Policy, 5 + 3 years). The next LTS is 9.7 (GA 21 Apr 2026); upgrade is 8.4 → 9.7 only (skipping an LTS series is not supported).
2. **PostgreSQL (current major at scaffold time)** — the Phase 0 recommendation, now superseded. Adequate and in some dimensions stronger (see "Disadvantages"), but not chosen.
3. **MariaDB LTS** — not chosen. A MySQL-compatible alternative with the same hosting advantage, but a different engine with its own versioning and behaviour; the project standardises on MySQL 8.4 LTS, not on "MySQL-compatible". Do not substitute MariaDB without a new ADR.
4. **SQLite** — rejected for production: adequate for tests, not for a multi-user platform with concurrent writes.

## Advantages

- **MySQL 8.4 LTS:** ubiquitous on cheap Bangladeshi shared/cPanel hosting with phpMyAdmin — the project keeps the cheap-hosting exit open even though it starts on a VPS; every cheap host offers it. LTS line: 8-year lifecycle (5 premier + 3 extended), majors rarer but bigger jumps; in-place upgrade within a series.
- **InnoDB:** MVCC; clustered primary-key index favouring simple PK lookups; strong for read-heavy simple workloads; `FOR UPDATE SKIP LOCKED` (MySQL ≥ 8.0.1) so the database queue driver works without double-claims; `CHECK` constraints enforced (since 8.0.16); generated columns + functional indexes; `FULLTEXT` indexes on InnoDB.
- **Financial integrity is identical:** `DECIMAL(12,2)` / `NUMERIC(12,2)` give exact decimal arithmetic in either engine, provided the application uses `decimal` columns (never float) and `numeric(12,2)` consistently (Decision Sheet). The choice of database does not change money handling.
- **Foreign keys** work in both (InnoDB). Window functions and CTEs (including recursive) are supported since MySQL 8.0 and cover the reporting this platform needs. `mysqldump` is a well-understood, one-binary operation.

## Disadvantages (accepted limitations — record them, do not hide them)

- **Laravel 13 native vector search is unavailable.** `vector()` columns and `whereVectorSimilarTo()` require PostgreSQL's vector extension. There is no Phase 1 use case; if semantic search is ever wanted, it needs an external service and a new ADR.
- **Native full-text search is less configurable** than PostgreSQL's native search (notably weaker stemming/language handling; no built-in Bengali dictionary). Bengali search quality was measured on MySQL 8.0.46 in Phase 0.1 (Investigator E): ngram `FULLTEXT` + BOOLEAN MODE is the recommended primary; re-test on MySQL 8.4 is required before any performance claim (Doc 13 Q-13, ADR-010, Doc 15 §9). Meilisearch later only on the evidence trigger in ADR-010.
- **DDL is not transactional.** Every DDL statement causes an implicit commit before and after it. A failed multi-statement migration leaves a half-applied schema; there is no automatic rollback. Mitigation (mandatory, not advisory): one DDL statement per migration, idempotent migrations, pre-deploy backup as the only rollback, staging-first migration runs, post-deploy schema-drift check (Doc 11 §4.3, Doc 06 §10).
- **No partial unique indexes, no exclusion constraints, no deferrable constraints, no materialised views, no `FILTER` aggregates.** The two partial-index invariants in this blueprint (one current committee term; single-holder committee roles) are preserved with STORED generated columns + unique indexes (Doc 06 §§4.1–4.2, Phase 0.1 reconciliation §2.1–2.2). `FILTER` aggregates are rewritten as `SUM/COUNT(CASE WHEN …)`. No blueprint query uses a materialised view (the monthly finance summary is computed on read from published entries, not a view — Doc 06 §9.1, Phase 0.1 decision on M-08). **No `UNIQUE` index on a `TEXT`/`BLOB` column** (MySQL rejects it without a prefix length, error 1170; a prefix unique is not a substitute — it enforces uniqueness of the prefix, not the value). The two `TEXT` uniqueness invariants use `BINARY(32)` SHA-256 hash columns + unique indexes instead (Doc 06 §§2.3–2.4).
- **No `JSONB`.** The two JSON columns (`media.variants`, `activity_log.before`/`after`) use MySQL `JSON`. JSON-path queries, if ever needed, require a generated column + index per path.

## Security implications

- No material security difference between the two for this workload, provided both are configured correctly (least-privilege application role, no public database port, encrypted connections where the setup supports them).
- **Four database users are mandatory:** a `satanipara_migrate` user (DDL + DML, deploy only), a `satanipara_app` user (runtime DML only; no `ALTER/DROP/CREATE`; no `UPDATE`/`DELETE` on `activity_log`; no `DELETE` on `ledger_entries`), a `satanipara_backup` user (read-only + LOCK TABLES), and a `satanipara_report` user (read-only, provisioned only when the Finance Auditor role is needed). The application never connects as `root` or as `migrate` at runtime. This is what makes the append-only audit log and the immutable ledger enforceable at the database level on MySQL (Doc 04 §5.7, Doc 06 §§7.1, 8.2).
- The database port is never exposed to the internet in either case (Doc 08 §11, Doc 11 §2).
- MySQL 8.4 defaults to `caching_sha2_password` authentication; `mysql_native_password` is disabled by default. Database users are created with the default plugin; no legacy auth plugin is enabled to accommodate an old client.

## Scalability implications

- Both handle this workload (a few thousand users, hundreds of requests, thousands of ledger rows) comfortably on the starting VPS.
- MySQL's clustered primary-key index favours simple primary-key lookups. Neither engine is the bottleneck at this scale; the hosting size is (see ADR-012).
- If the platform ever needs vector/semantic search, only PostgreSQL supports Laravel's native implementation; with MySQL that feature would need an external service.

## Maintenance implications

- **MySQL 8.4 LTS:** 8-year lifecycle (5 premier + 3 extended, Oracle policy); upgrade via in-place upgrade within the series, or dump/restore to the next LTS (8.4 → 9.7; skipping a series is not supported).
- **Character set / collation (pinned):** `utf8mb4` / `utf8mb4_0900_ai_ci` on every table (Bengali requires `utf8mb4`; the collation is case- and accent-insensitive — `LIKE` searches are therefore case-insensitive, and unique comparisons ignore accents; neither affects the hex `phone_hash` values). `sql_mode` must include `STRICT_TRANS_TABLES`.
- **Backups:** `mysqldump` is the tool spatie/laravel-backup shells out to (the binary must be on `PATH` in the app image, or `dump.dump_binary_path` set per connection). It is a one-binary, well-understood operation (Research Notes §7.5).
- **Connection pooling:** no PgBouncer equivalent is adopted. Laravel's default connection handling is sufficient at Phase 1 volume (500 concurrent users, Engineering Plan v1.1). No MySQL pooler is introduced without a new ADR.

## Final decision

**MySQL 8.4 LTS with InnoDB — Confirmed, 2026-11-14, by Fahim.** Engineering Plan v1.1's PostgreSQL 16 is superseded as both engine and version pin. The Phase 0 "narrow lean" toward PostgreSQL is superseded, not silently ignored: the deciding fact is Fahim's confirmed decision, and the hosting-portability question that used to decide it (Doc 13 Q-26) is closed.

## Reason for selection

The deciding constraint is Fahim's confirmed choice of MySQL 8.4 LTS as the project standard. On the merits: MySQL is the only practical option on cheap shared hosting in Bangladesh (so the cheap-hosting exit stays open even while the project starts on a VPS); it is a perfectly adequate database for this workload (same decimal integrity, same FKs for practical purposes, adequate FTS at this scale, `CHECK` constraints, generated columns, `FULLTEXT`); and its LTS lifecycle (8 years) means fewer major upgrades than PostgreSQL's one-major-per-year cadence. The accepted costs are recorded above (no native vector search; weaker FTS configurability; non-transactional DDL; no partial indexes / JSONB) and each has a named mitigation in the blueprint.
