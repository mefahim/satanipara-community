# ADR-014 — Database (MariaDB 11.8.9 LTS + InnoDB, Hostinger Shared Hosting)

| | |
|---|---|
| Status | **Confirmed** |
| Date | 2026-11-14 |
| Decided by | Fahim (confirmed decision, 2026-11-14) |
| Supersedes | ADR-003 (MySQL 8.4 LTS + InnoDB) — ADR-003's history is kept intact; its status becomes "Superseded by ADR-014". The PostgreSQL lean that ADR-003 superseded stays superseded. |
| Sources | MariaDB 11.8 documentation (mariadb.com/kb, mariadb.com/docs — cited per claim); laravel.com/docs/13.x (query builder, MariaDB support); `docs/server-setup/SERVER-FOUNDATION-REPORT.md` §2, §8 (server evidence, 2026-11-14); `docs/backend-architecture/16-MARIADB-ADDENDUM.md` (decision record) |

## Context

The platform is a relational databank and ledger: members and families, committee terms, annual activities, expatriate requests with a status workflow, a blood-donor registry, notices/news/gallery, and a transparent accounts ledger in BDT. It starts on Hostinger Shared Hosting (`us-bos-web1454.main-hosting.eu`), not on the single VPS the blueprint originally assumed. The choice is between MariaDB 11.8.9 (the engine the provisioned host actually provides — proven from the `127.0.0.1:3306` handshake banner) and provisioning an external MySQL 8.4 server. Both are adequate for the workload. The decision is made: **MariaDB 11.8.9 LTS with InnoDB**.

## Options considered

1. **MariaDB 11.8.9 LTS (InnoDB)** — the confirmed choice. GA 4 Jun 2025; community binaries to 4 Jun 2028; critical/security fixes as source releases for two further years (to 2030). The engine the host provides; Laravel 13's dedicated `mariadb` driver targets it.
2. **External MySQL 8.4 LTS server** — the ADR-003 choice, now unexecutable on the provisioned host. Would need a second host, a second bill, a network hop per query, and a database the team operates itself. Rejected: no blueprint requirement needs MySQL-only behaviour that would justify that cost.
3. **PostgreSQL (current major)** — the Phase 0 recommendation, superseded twice over (by ADR-003, then by this ADR). Adequate and in some dimensions stronger (see "Disadvantages"), but not chosen, and not available on this hosting plan.
4. **SQLite** — rejected for production: adequate for tests, not for a multi-user platform with concurrent writes.

## Advantages

- **It is the engine the host provides.** No second server, no network hop, no extra bill. The hosting-portability argument ADR-003 made for MySQL ("the only practical option on cheap shared hosting") now points at MariaDB, because MariaDB is what this cheap shared host provides.
- **InnoDB:** MVCC; clustered primary-key index favouring simple PK lookups; strong for read-heavy simple workloads; `FOR UPDATE SKIP LOCKED` (MariaDB ≥ 10.6) so the database queue driver works without double-claims; `CHECK` constraints enforced (since 10.2.1); STORED generated columns + unique indexes; `FULLTEXT` indexes on InnoDB; `SIGNAL SQLSTATE '45000'` in triggers.
- **Financial integrity is identical:** `DECIMAL(12,2)` / `NUMERIC(12,2)` give exact decimal arithmetic in either engine, provided the application uses `decimal` columns (never float) and `numeric(12,2)` consistently (Decision Sheet). The choice of database does not change money handling.
- **Foreign keys** work in both (InnoDB). Window functions and CTEs (MariaDB ≥ 10.2) cover the reporting this platform needs. `mariadb-dump` is a well-understood, one-binary logical backup operation.
- **JSON validation is automatic:** the `JSON` alias adds a `CHECK (JSON_VALID(column))` constraint by itself (since 10.4.3), so the blueprint's two JSON columns are validated without extra DDL.
- **Vector search is available, not unavailable.** Laravel 13.28+ supports native vector columns and similarity queries on MariaDB 11.7+ — ADR-003's "native vector search is unavailable" disadvantage does not survive the engine change. There is no Phase 1 use case; the option exists without an external service if one ever appears.
- **Laravel 13 has a dedicated `mariadb` driver** (since Laravel 11) with its own grammar — the framework treats MariaDB as a first-class target, not as a MySQL compatibility mode.

## Disadvantages (accepted limitations — record them, do not hide them)

- **No ngram full-text parser.** MariaDB has no equivalent of MySQL's ngram parser, so Bengali partial-word search via exact-boolean FULLTEXT is impossible; the default parser tokenises on word boundaries and `innodb_ft_min_token_size` defaults to 3, so terms under 3 characters are not indexed at all. The Phase 0.1 Bengali benchmark (ngram boolean == `LIKE` counts) does **not** transfer. The replacement is default-parser FULLTEXT + BOOLEAN MODE with `+term*` wildcards as an Eloquent model scope (NOT Scout), autocomplete via `LIKE 'term%'` on a B-tree, explicit ordering (never MATCH relevance), `LIKE '%term%'` fallback only for 1-char/mid-word cases (Doc 16 §3.4) — measured on MariaDB 11.8.9: 35 cases / 171 timed queries (`benchmark-mariadb/`). The tokens column is conditional on an explicit product decision (Awaiting Organisation). Meilisearch later only on the evidence trigger in ADR-010 — and it cannot be self-hosted on this host (loopback listeners blocked), so it would need external hosting and a new ADR.
- **No native JSON type.** `JSON` is a `LONGTEXT` alias. No JSON-path indexing, no multi-valued indexes. The blueprint never queries inside JSON, so nothing is lost in practice; a future JSON-path query needs a generated column + index and a new decision.
- **No functional indexes.** Indexes on expressions do not exist on MariaDB; a generated column must be indexed instead. No blueprint schema uses a functional index, so this is a documentation correction only.
- **Generated columns cannot carry `NOT NULL`.** `push_subscriptions.endpoint_hash` loses its `NOT NULL` and gains a `CHECK (endpoint_hash IS NOT NULL)` instead (Doc 16 §3.7).
- **CHECK violations raise error 4025, not MySQL's 3819.** Every test asserting 3819 must accept 4025 on MariaDB. MariaDB's `check_constraint_checks` session variable can also disable all CHECK enforcement for the current session — CHECKs are defence in depth; the triggers are the backstop.
- **DDL is not transactional.** Every DDL statement causes an implicit commit before and after it. MariaDB 10.6+ made DDL atomic (crash-safe per statement), which limits the damage, but a failed multi-statement migration still leaves a half-applied schema; there is no automatic rollback. Mitigation (mandatory, not advisory): one DDL statement per migration, idempotent migrations, pre-deploy backup as the only rollback, staging-first migration runs, post-deploy schema-drift check (Doc 11 §4.3, Doc 06 §10).
- **No partial unique indexes, no exclusion constraints, no deferrable constraints, no materialised views, no `FILTER` aggregates.** The two partial-index invariants in this blueprint (one current committee term; single-holder committee roles) are preserved with STORED generated columns + unique indexes (Doc 06 §§4.1–4.2, Phase 0.1 reconciliation §2.1–2.2). `FILTER` aggregates are rewritten as `SUM/COUNT(CASE WHEN …)`. No blueprint query uses a materialised view (the monthly finance summary is computed on read from published entries, not a view — Doc 06 §9.1, Phase 0.1 decision on M-08). **No `UNIQUE` index on a `TEXT`/`BLOB` column** (MariaDB rejects it without a prefix length, error 1170, as MySQL does; a prefix unique is not a substitute — it enforces uniqueness of the prefix, not the value). The two `TEXT` uniqueness invariants use `BINARY(32)` SHA-256 hash columns + unique indexes instead (Doc 06 §§2.3–2.4).
- **Shorter support runway than MySQL 8.4 LTS.** Community binaries end 4 Jun 2028 (MySQL 8.4's premier support runs to 30 Apr 2029). A MariaDB LTS upgrade (11.8 → 12.3 or the then-current LTS) must be planned before June 2028. MariaDB LTS upgrades are direct (no intermediate series required).
- **Server defaults differ and must be pinned, not assumed.** MariaDB 11.5+ defaults new tables to `utf8mb4_uca1400_ai_ci` (not `utf8mb4_0900_ai_ci`, not `utf8mb4_unicode_ci`), and its default `sql_mode` omits `ONLY_FULL_GROUP_BY` (MySQL 8.4 includes it). The blueprint pins `utf8mb4_unicode_ci` explicitly on every table and verifies the effective session `sql_mode` at scaffold (Doc 16 §6, V-COLL-01, V-SQL-01).
- **The four-database-user privilege model may not be fully implementable on shared hosting.** hPanel creates database-level users; per-table `REVOKE DELETE` grants need `GRANT OPTION` on the owner user, which is unproven until provisioning (Doc 16 §6, V-PRIV-01). The trigger layer enforces the ledger/audit rules regardless; the privilege layer is defence in depth that may be degraded on this host — to be recorded explicitly if the probe fails, never silently.
- **Physical backup and binary-log point-in-time recovery are unavailable on this host.** `mariadb-backup` needs datadir access and global privileges the account does not have. Logical `mariadb-dump` backups are the only method; RPO 24h / RTO 4h are unchanged and must be proven by the restore rehearsal.

## Security implications

- No material security difference between the two for this workload, provided both are configured correctly (least-privilege application role, no public database port, encrypted connections where the setup supports them).
- **Four database users are mandatory:** a `satanipara_migrate` user (DDL + DML, deploy only), a `satanipara_app` user (runtime DML only; no `ALTER/DROP/CREATE`; no `UPDATE`/`DELETE` on `activity_log`; no `DELETE` on `ledger_entries`), a `satanipara_backup` user (read-only + LOCK TABLES), and a `satanipara_report` user (read-only, provisioned only when the Finance Auditor role is needed). The application never connects as `root` or as `migrate` at runtime. This is what makes the append-only audit log and the immutable ledger enforceable at the database level (Doc 04 §5.7, Doc 06 §§7.1, 8.2). **Caveat (new):** whether hPanel permits the per-table revokes is unproven until provisioning (V-PRIV-01); the triggers fire for every user including root, so the trigger layer holds regardless.
- The database port is never exposed to the internet in either case (Doc 08 §11, Doc 11 §2).
- MariaDB 11.8.9's handshake reports `mysql_native_password` authentication; Laravel PDO connects with it. No legacy-auth workaround is needed, and no auth plugin change is introduced.

## Scalability implications

- Both handle this workload (a few thousand users, hundreds of requests, thousands of ledger rows) comfortably on the starting host.
- MariaDB's clustered primary-key index favours simple primary-key lookups. Neither engine is the bottleneck at this scale; the hosting size is (see ADR-012).
- If the platform ever needs vector/semantic search, Laravel 13 supports it natively on MariaDB 11.7+ — no external service is required for that feature (unlike on MySQL 8.4, where it needed one). No Phase 1 use case exists.

## Maintenance implications

- **MariaDB 11.8 LTS:** GA 4 Jun 2025; community binaries to 4 Jun 2028; critical/security fixes as source releases to 2030. Upgrade to the next LTS (11.8 → 12.3 or later) is direct, but must be planned before June 2028 — a shorter runway than MySQL 8.4 LTS, recorded as a cost of this decision.
- **Character set / collation (pinned):** `utf8mb4` / `utf8mb4_unicode_ci` on every table (Bengali requires `utf8mb4`; the collation is case- and accent-insensitive — `LIKE` searches are therefore case-insensitive, and unique comparisons ignore accents; neither affects the hex `phone_hash` values). Never rely on the server default (`utf8mb4_uca1400_ai_ci` on 11.5+). `sql_mode` must include `STRICT_TRANS_TABLES` and the scaffold must verify `ONLY_FULL_GROUP_BY` is in effect for the application connection.
- **Backups:** `mariadb-dump` is the tool spatie/laravel-backup shells out to for a `mariadb` connection (the binary must be on `PATH` on the host — verify at provisioning, V-BKP-01 — or `dump.dump_binary_path` set per connection). It is a one-binary, well-understood logical operation. `mariadb-backup` (physical) is not available on this host and is not used.
- **Connection pooling:** no PgBouncer equivalent is adopted. Laravel's default connection handling is sufficient at Phase 1 volume (500 concurrent users, Engineering Plan v1.1). No MariaDB pooler is introduced without a new ADR.
- **Driver:** `DB_CONNECTION=mariadb` (dedicated driver since Laravel 11). The `mysql` driver must not be pointed at this server.

## Final decision

**MariaDB 11.8.9 LTS with InnoDB — Confirmed, 2026-11-14, by Fahim.** ADR-003's MySQL 8.4 LTS is superseded as both engine and version pin. The Phase 0 "narrow lean" toward PostgreSQL stays superseded. The deciding fact is Fahim's confirmed decision, and the hosting question that used to decide it (Doc 13 Q-26) is closed in its new form: the host provides MariaDB 11.8.9, and the blueprint targets what the host provides.

## Reason for selection

The deciding constraint is Fahim's confirmed choice of MariaDB 11.8.9 as the production engine on the provisioned host. On the merits: MariaDB is the engine this shared host actually provides (so the cheap-hosting exit stays open — it is the host's own engine); it is a perfectly adequate database for this workload (same decimal integrity, same FKs for practical purposes, `CHECK` constraints, generated columns, triggers, `SKIP LOCKED`, adequate FULLTEXT for whole-word search, native vector support if ever wanted); and its LTS line gives a maintained runway to June 2028 with a direct upgrade path to the next LTS. The accepted costs are recorded above (no ngram parser — default-parser FULLTEXT + BOOLEAN MODE with `+term*` wildcards as a model scope replaces it; JSON as LONGTEXT; no functional indexes; generated-column `NOT NULL` replaced by CHECK; error 4025 not 3819; shorter support runway; privilege-model provability pending; no physical backup or binlog PITR on this host) and each has a named mitigation or verification gate in Doc 16 §6.
