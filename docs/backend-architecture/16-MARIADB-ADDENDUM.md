# 16 — MariaDB Addendum (MariaDB 11.8.9 is the production database engine)

| | |
|---|---|
| **Document** | Satanipara Community — Phase 0 Backend Blueprint, doc 16 (addendum) |
| **Status** | **Confirmed** — owner decision, 2026-11-14 (see §1) |
| **Decided by** | Fahim (confirmed decision, 2026-11-14) |
| **Supersedes** | ADR-003's engine decision (MySQL 8.4 LTS + InnoDB) and Doc 13 Q-26's answer; see ADR-014. The MySQL history is kept intact in ADR-003 — this addendum records the change, it does not rewrite the history. |
| **Sources** | `docs/server-setup/SERVER-FOUNDATION-REPORT.md` §2, §8 (server evidence, 2026-11-14); MariaDB 11.8 documentation (mariadb.com/kb, mariadb.com/docs — cited per claim in §2 and §3); laravel.com/docs/13.x (Laravel 13 MariaDB support); the per-table reconciliation behind §§3–4 (working paper; the decisions are recorded in this addendum) |
| **Companion docs** | `adr/ADR-014-mariadb-11-8-9.md` (new ADR); `adr/ADR-003-database.md` (superseded — history kept); `benchmark-mariadb/` (MariaDB 11.8.9 Bengali-search benchmark, 35 cases / 171 timed queries); `tests/ledger-suite/` (ledger/trigger/privilege suite, 43/43 PASS on MariaDB 11.8.9) |
| **Scope** | This addendum changes the database engine only. It does not change the product scope (Phase 1 = Super Admin + Expatriate Helper only, no OTP), the hosting decision beyond the engine, or any security/finance rule (§4). |

---

## 1. The decision

**MariaDB 11.8.9 on Hostinger Shared Hosting IS the production database engine for Satanipara Community.** It supersedes the confirmed MySQL 8.4 LTS decision (ADR-003, Doc 13 Q-26, Doc 15 §10 C-1).

| Item | Detail |
|---|---|
| **Decided by** | Fahim, 2026-11-14 (confirmed owner decision) |
| **Engine** | MariaDB 11.8.9 (`11.8.9-MariaDB-log`), LTS series |
| **Where** | Hostinger shared hosting, host `us-bos-web1454.main-hosting.eu`, server `82.197.83.14`, database reachable at `127.0.0.1:3306` |
| **How verified** | TCP handshake banner, no login attempted (Server Foundation Report §2, §8.1). No database, user, or password exists yet. |
| **Application** | Laravel 13.42.0 + PHP 8.4.27, live at https://satanipara.asf.run/ (foundation only; no modules built) |

## 2. Rationale and evidence

1. **No MySQL 8.4 exists on this hosting plan.** The server reachable at `127.0.0.1:3306` is MariaDB 11.8.9 by its own handshake banner. There is no MySQL 8.4 server to connect to, so the MySQL decision cannot be executed on the provisioned host.
2. **Laravel 13 supports MariaDB.** Laravel's query-builder documentation states full-text where clauses are supported by MariaDB, MySQL and PostgreSQL, and vector similarity clauses are supported on MariaDB 11.7 or later; Laravel has shipped a dedicated `mariadb` driver since Laravel 11. MariaDB 11.8.9 exceeds every Laravel 13 floor (MariaDB 10.3+ for JSON where clauses).
   - Sources: https://laravel.com/framework/docs/13.x/queries (whereFullText on MariaDB; whereVectorSimilarTo on MariaDB 11.7+); https://mariadb.org/laravel-13-now-supports-mariadb-vector-natively/ (dedicated `mariadb` driver since Laravel 11; `DB_CONNECTION=mariadb`).
3. **The cheap-hosting argument in ADR-003 now points at MariaDB, not MySQL.** ADR-003 chose MySQL partly because "MySQL is the only practical option on cheap shared hosting in Bangladesh". The host actually provisioned for this project provides MariaDB — so the hosting-portability reasoning now favours the engine the host provides.
4. **The rejected alternative was considered and not chosen:** provisioning an external MySQL 8.4 server (a second host, a second bill, a network hop for every query, and a database the team would have to operate). Nothing in the blueprint requires MySQL-only behaviour that would justify that cost — the reconciliation (this addendum §3) finds no requirement that MariaDB 11.8.9 cannot meet.

## 3. What changes

### 3.1 Engine, version, lifecycle

| Item | Before (MySQL 8.4 LTS) | Now (MariaDB 11.8.9) |
|---|---|---|
| Engine + version | MySQL 8.4 LTS + InnoDB | MariaDB 11.8.9 + InnoDB (default engine) |
| Community support window | Premier to 30 Apr 2029, extended to 30 Apr 2032 (ADR-003) | Community binaries to **4 Jun 2028**; critical/security fixes as source releases for two further years (to 2030). Sources: https://mariadb.org/still-on-mariadb-10-6-why-your-next-upgrade-is-a-security-decision/ (11.8 LTS: GA 4 Jun 2025, community EOL 4 Jun 2028 / 2030, latest 11.8.9); https://www.itechtics.com/eol/mariadb/ |
| Consequence | 8-year runway | **Shorter runway — a real trade-off, recorded not hidden.** The project must plan a MariaDB LTS upgrade (11.8 → 12.3 or the then-current LTS) before June 2028. The upgrade is a future maintenance task, recorded in the roadmap; it is not a Phase 1 blocker. MariaDB LTS upgrades are direct (no intermediate series required — same source). |
| Storage engine | InnoDB | InnoDB (unchanged — MariaDB's default engine). |

### 3.2 Collation — `utf8mb4_0900_ai_ci` → `utf8mb4_unicode_ci` (pinned explicitly)

- **MariaDB 11.8 does not reliably provide `utf8mb4_0900_ai_ci` by that name.** That collation is MySQL 8.0's UCA-9.0.0 default; MariaDB defines its own utf8mb4 collations (`utf8mb4_general_ci`, `utf8mb4_unicode_ci`, and from 11.5 the UCA-14.0.0 `utf8mb4_uca1400_ai_ci` default). Secondary sources conflict on whether 11.4.5+ accepts `utf8mb4_0900_ai_ci` as an alias for replication purposes, so the blueprint does **not** rely on it: **the pinned collation is `utf8mb4_unicode_ci` on every table**, set explicitly in `config/database.php` and in every migration, never left to the server default.
- **Why explicit pinning matters:** MariaDB 11.5+ defaults new tables to `utf8mb4_uca1400_ai_ci`. A table created without an explicit collation would carry the server default, and a dump of it fails to import into MySQL with `ERROR 1273 (Unknown collation: 'utf8mb4_uca1400_ai_ci')` — the reverse-direction failure is proven (DreamHost test, MariaDB 11.8 → MySQL 8.4).
- **Behaviour difference, accepted:** `utf8mb4_unicode_ci` is UCA 4.0.0-based; `utf8mb4_0900_ai_ci` is UCA 9.0.0-based. Both are case- and accent-insensitive. Bengali sorting/comparison differences between UCA 4.0.0 and 9.0.0 are minor at this scale; no blueprint query depends on UCA-version-specific ordering. If a future query does, it is a new decision, not a silent change.
- **Resolved 2026-11-14 (U-01):** `utf8mb4_0900_ai_ci` **does exist** on MariaDB 11.8.9 — `SHOW COLLATION LIKE 'utf8mb4_0900_ai_ci'` returns one row (ID 255), and a table created with it stores and matches Bengali correctly (measured on a local MariaDB 11.8.9, same version as production; see §6). The pin to `utf8mb4_unicode_ci` stands regardless — it is the explicit, portable choice, never the server default.
- Sources: https://mariadb.com/docs/release-notes/community-server/about/compatibility-and-differences/replication-compatibility-between-mariadb-and-mysql.md; https://www.dreamhost.com/guides/mysql-vps/mysql-or-mariadb/; https://github.com/mariadb/skills/commit/21070ed247d2093bb3acc02f92303775e7b20eef (11.5+ default collation `uca1400_ai_ci`).

### 3.3 JSON — native type → `LONGTEXT` alias (no DDL change, behaviour change)

- **MariaDB has no native binary JSON type.** `JSON` is an alias for `LONGTEXT COLLATE utf8mb4_bin`. The blueprint's two JSON columns (`media.variants`, `activity_log.before`/`after`) keep their `$table->json()` migrations — Laravel's `mariadb` driver handles them — but the stored form is text, not binary.
- **What improves:** since MariaDB 10.4.3 the `JSON` alias automatically adds a `CHECK (JSON_VALID(column))` constraint, so invalid JSON text cannot be stored. The blueprint gets JSON validation it did not have to write.
- **What is lost:** no native JSON-path indexing (MySQL functional indexes / multi-valued indexes do not exist on MariaDB — see §3.7). The blueprint never queries inside JSON (variants and audit payloads are opaque; the application decodes them in PHP), so nothing is lost in practice. If a JSON-path query is ever needed, it goes through a generated column + index — a new decision, not a silent change.
- **Dump/restore note:** a `mariadb-dump` of a `JSON` column writes it as `longtext ... CHECK (json_valid(...))`. Restoring into MySQL would silently load it as LONGTEXT, not JSON — the engines are not dump-interchangeable for JSON columns.
- Source: https://mariadb.com/kb/en/json-data-type/ ("`JSON` is an alias for `LONGTEXT COLLATE utf8mb4_bin`"; "This constraint is automatically included for types using the `JSON` alias"); https://www.skeema.io/blog/2023/05/10/mysql-vs-mariadb-schema/ (no multi-valued indexes on MariaDB).

### 3.4 Search strategy — replaced (the largest change)

The MySQL benchmark recommendation **does not transfer**. This is the single largest consequence of the engine change, and it is stated plainly:

| Item | MySQL 8.4 design (superseded) | MariaDB 11.8.9 reality |
|---|---|---|
| Parser | `ngram` FULLTEXT parser (`WITH PARSER ngram`) | **No ngram parser exists in MariaDB.** Only the default (word-boundary) parser, plus Mroonga (not available on this host). Source: https://totara.help/14/docs/full-text-search-in-mariadb ("MariaDB does not support the Ngram plugin"); https://mariadb.com/docs/server/ha-and-performance/optimization-and-tuning/optimization-and-indexes/full-text-indexes/full-text-index-overview.md |
| Partial-word matching | ngram boolean matched partials (`মোহা` → 37/37) | **Gone from FULLTEXT alone.** The default parser tokenises on word boundaries; a partial word returns 0 rows via exact-boolean FULLTEXT. Prefix matching is restored by the `term*` wildcard (see the adopted approach below). |
| Minimum term length | ngram token size 2 (benchmark rule: minimum 2 characters per term) | InnoDB `innodb_ft_min_token_size` default **3**; words under 3 characters are not indexed at all (measured: a standalone 2-character word is absent from the index). The token-size variables are server settings the account cannot change on shared hosting. Source: same full-text overview ("Words less than 4 (MyISAM) or 3 (InnoDB) characters in length will not be stored in the fulltext index"). |
| BOOLEAN MODE | ngram boolean, `+`/`-`/`*` operators | **Still available** with the same operators (`ft_boolean_syntax + -><()~*:""&|`). Natural-language mode is still the default and still must not be the default. |
| Measured evidence | 35 cases / 133 queries on MySQL 8.0.46, ngram boolean == `LIKE '%term%'` counts | **Measured on MariaDB 11.8.9: 35 cases / 171 timed queries** (`benchmark-mariadb/`, local MariaDB 11.8.9 — the exact production version). No number from the MySQL benchmark may be quoted as a MariaDB result. |
| Meilisearch later | Clean swap; self-hosted binary on port 7700 | **Cannot run on this host.** Loopback TCP listeners are blocked on the shared host (Server Foundation Report §3), so a self-hosted Meilisearch/Typesense process cannot listen. External hosted search would be a new decision with a new cost. |

**Adopted approach (measured on MariaDB 11.8.9 — Worker B's recommendation, §8): default-parser FULLTEXT + BOOLEAN MODE with `term*` wildcards, implemented as an Eloquent model scope (NOT Scout).**

Exact query construction (all terms bound as parameters, never concatenated raw user input into SQL):

1. **Normalise the input:** trim; split on whitespace; drop empty terms; drop terms that are English stopwords (the 36-word default list — otherwise a `+the` term silently returns 0 rows, because stopwords apply in BOOLEAN MODE too on InnoDB 11.8.9, measured); require every remaining term to be ≥ 2 characters — if any term is 1 character, either reject the search with a "type at least 2 characters" message or route the whole query to the LIKE fallback.
2. **Multi-word query → `+w1* +w2* …`** (boolean, each term required AND prefix-wildcarded). Single-word query → `w*`. SQL: `WHERE MATCH(title_bn, body_bn) AGAINST('+রক্তদান* +শিবির*' IN BOOLEAN MODE)`. In Laravel: `->whereFullText(['title_bn','body_bn'], '+রক্তদান* +শিবির*', ['mode' => 'boolean'])`. Measured: whole words exact, word-prefix fragments exact vs LIKE, multi-word AND exact (50 = 50; 9 = 9).
3. **Autocomplete → `LIKE 'term%'` on a B-tree index** on the field being completed (0.16–0.17 ms measured, exact true-prefix semantics). Never `term*` or tokens for autocomplete.
4. **Ranking: do NOT order by MATCH relevance.** All rows in a match set tie on relevance, and the score drifted after index builds (1.9055 → 1.3213 for the same query/data). Order explicitly instead (e.g. title-matches first, then newest first) — and verify the ordering reads sensibly on real data.
5. **Fallbacks:** 1-character input and (if ever needed) true mid-word substring search → `LIKE '%term%'`. Everything else goes through (2).
6. **Indexes to create (migrations):** `FULLTEXT (title_bn, body_bn)` on the searchable content tables (default parser — **no `WITH PARSER ngram`**; it is a syntax error on MariaDB); `FULLTEXT (name_bn, name_en, profession_bn, area_bn)` on the directory tables (the benchmark index covered names only, and `শিক্ষক` correctly returned 0 — production must include profession/area, Doc 06 §3.2). Plus B-tree indexes on the autocomplete fields (`name_bn`, `title_bn`).
7. **Tokens column: CONDITIONAL on an explicit product decision — Awaiting Organisation.** A precomputed `search_tokens` column is the only approach that unifies compound and spaced spellings (`রক্তদান` finds both `রক্তদান` and `রক্ত দান`: 165 rows vs 112), but it costs ~7× the main FULLTEXT index and must be maintained by the application on every write, and 2-character fragments still return 0 through it. Adopt it ONLY if the product explicitly wants compound/spaced unification; if the product wants literal semantics, skip tokens entirely. Either way tokens is an ADDITION to the wildcard path, never a replacement. If adopted, use the filed `benchmark-mariadb/tokenize.py` verbatim (its combining-mark rule is load-bearing) and backfill in transactions.
8. **What Scout is for in this plan:** nothing, for now. Do NOT adopt Scout's database engine as the search implementation — it cannot express the `+term*` query shape through its documented API (it passes the raw user query through and defaults to natural-language mode). Implement the shape above as a model scope using `whereFullText(..., ['mode' => 'boolean'])` (or `whereRaw` with bound parameters). Scout may still be used later for a Meilisearch/Typesense driver, which is a different decision.
9. **Spelling variants are NOT tolerated by any approach** (measured: `সাতানিপাড়া` / `শাতানিপাড়া` / `সাতানীপাড়া` return disjoint sets; likewise `মাদ্রাসা` / `মাদরাসা`). The only fix is application-side (a curated variant map emitted as extra tokens) — future work, needs the real variant list. Do not claim "fuzzy search" anywhere. Transliteration (Latin query `roktodan`) likewise finds nothing — same remedy, same status.

- The existing FULLTEXT indexes (Doc 06 §§3.2/3.5/5.1) are kept with the **default parser** as the boolean-wildcard search above, not as ngram indexes. They must not be described as ngram indexes anywhere.
- The denormalised `persons.profession_bn` / `area_bn` search snapshots are kept — they are what let a search answer profession/area queries without a join.
- **Production re-run required before launch:** re-run `benchmark-mariadb/` on the production MariaDB 11.8.9 (`RUN-ON-PRODUCTION.md`). Pass criterion: every count equals the local 11.8.9 reference count in `benchmark-mariadb/queries.md` for the same case. Doc 13 Q-13 stays open until then, plus a real-data snapshot re-run and a scale check (see `benchmark-mariadb/README.md` §9).

### 3.5 Backup tooling — `mysqldump` → `mariadb-dump` (logical only)

- **The dump binary is `mariadb-dump`.** Since MariaDB 11.0 the `mysqldump` name is a deprecated symlink (removed entirely from MariaDB's official Docker image). spatie/laravel-backup uses the MariaDB dumper (`mariadb-dump`) when the connection driver is `mariadb` (spatie/laravel-backup PR #1903; spatie/db-dumper MariaDB dumper).
  - Sources: https://www.cloudhim.com/backups-storage/mysqldump-deprecated-mariadb-dump-backup-script-fix; https://www.dvdheiden.nl/posts/mysql-maria-db-driver-vs-laravel-backup; https://github.com/spatie/laravel-backup/pull/1903.
- **Correction to the task brief's wording:** `mariadb-backup` is **not** the replacement for `mysqldump`. It is a different tool — a physical (file-copy) backup that needs `RELOAD`/`PROCESS`/`LOCK TABLES`/`BACKUP_ADMIN` global privileges **and** read access to the server datadir (`/var/lib/mysql`). Neither exists on this shared host (no root/sudo, home-directory confinement — Server Foundation Report §3). **Physical backups and binary-log point-in-time recovery are ruled out on this host; logical `mariadb-dump` backups are the only backup method.** RPO 24h / RTO 4h are unchanged — a nightly logical dump of a database this size fits both, and the restore rehearsal must prove it.
- **Verified 2026-11-14 (U-04, resolved):** the `mariadb-dump` binary **is present on the host** at `/usr/bin/mariadb-dump` (client 11.8.9-MariaDB — coordinator SSH probe, 2026-11-14). The foundation report's client list (`mysql`, `mysqldump`, `mariadb`) did not name it; it exists anyway. If a deploy-time `PATH` differs, set `dump.dump_binary_path` per connection (spatie config) — and record which one was used.
- **Restore note:** `mariadb-dump` output since May 2024 starts with a `/*!999999\- enable the sandbox mode */` line; restore with the `mariadb` client (present on the host), not the MySQL client. Source: https://todisco.de/en/blog/mariadb-mysql-backup-restore-docker.
- **Trigger DEFINER gotcha (Unverified):** dumps carry trigger definitions with their `DEFINER` clause; restoring as a different user can fail if the definer does not exist. The restore rehearsal must restore a dump **including the ledger/audit triggers** and prove it works on this host (test V-BKP-02).

### 3.6 Driver and connection configuration

- **`DB_CONNECTION=mariadb`, not `mysql`.** Laravel ships a dedicated `mariadb` driver since Laravel 11, with its own grammar; the `mysql` driver appears to work against a MariaDB server but emits MySQL-specific SQL (vector indexes, JSON paths, `uuid()` columns all differ). The server `.env` switch (sqlite → MariaDB) must use `mariadb`.
  - Source: https://mariadb.org/laravel-13-now-supports-mariadb-vector-natively/ ("Use the `mariadb` driver, not `mysql`").
- **Charset/collation pinned in `config/database.php`:** `charset utf8mb4`, `collation utf8mb4_unicode_ci` (§3.2). The `mariadb` connection's `strict` mode stays on; the scaffold must verify the effective session `sql_mode` includes `ONLY_FULL_GROUP_BY` (MariaDB's server default does **not** include it, unlike MySQL 8.4 — see §3.8).
- **Authentication:** the server banner reports `mysql_native_password`. Laravel PDO connects with it; no auth-plugin change is needed. (MySQL 8.4's `caching_sha2_password` default does not apply here.)

### 3.7 Generated columns, functional indexes, CHECK constraints, triggers

- **Generated columns: unchanged in design.** MariaDB supports STORED (PERSISTENT) generated columns and unique indexes on them since 10.2.1, with the same deterministic-expression rules (no subqueries, no stored functions, no non-deterministic functions in indexed/PERSISTENT columns). The blueprint's three generated columns (`committee_terms.is_current_key`, `committee_members.single_holder_key`, `constitution_versions.is_current_key`) use only `IF`/`CONCAT` over same-row columns — compatible as written.
  - Source: https://docs.w3cub.com/mariadb/virtual-columns/index; https://mariadb.com/kb/en/constraint/.
- **One real DDL change:** `push_subscriptions.endpoint_hash` is defined as `BINARY(32) GENERATED ALWAYS AS (UNHEX(SHA2(endpoint, 256))) STORED NOT NULL`. **MariaDB does not permit `NOT NULL` (or `NULL`) on a generated column.** The `NOT NULL` must be dropped and replaced with a named check: `CONSTRAINT chk_endpoint_hash_not_null CHECK (endpoint_hash IS NOT NULL)`.
  - Sources: https://www.skeema.io/blog/2023/05/10/mysql-vs-mariadb-schema/ ("MariaDB doesn't permit this syntax, but you can use a `CHECK` constraint to get the same effect"); http://wp.mariadb.com/resources/white-papers/bridging-the-gap-mysql-to-mariadb-migration-guide/.
- **Functional indexes: do not exist on MariaDB.** Doc 05 §3 and ADR-003 say "generated columns + functional indexes" — the "functional indexes" half is wrong on MariaDB and must be deleted wherever it appears. No blueprint schema uses a functional index (the designs all use generated columns), so this is a documentation correction only, not a schema change.
  - Source: https://ai-plugins.mariadb.org/tutorials/diagnose-a-slow-query/ ("No functional indexes. MariaDB has no expression index; you index a generated column instead.").
- **CHECK constraints: enforced identically** (since MariaDB 10.2.1), including named constraints. Two differences: (a) a CHECK violation raises MariaDB error **4025** (`ER_CONSTRAINT_FAILED`), not MySQL error **3819** — every test asserting 3819 (Doc 10 T-LED-27/28/29/30) must accept 4025 on MariaDB; (b) MariaDB's `check_constraint_checks` session variable can disable **all** CHECK enforcement for the current session — any user can set it for their own session, so CHECKs alone are not a backstop against a compromised credential; the triggers are (see §4).
  - Sources: https://mariadb.com/kb/en/constraint/ ("You can disable all constraint expression checks by setting the variable `check_constraint_checks` to `OFF`"); https://www.skeema.io/blog/2023/05/10/mysql-vs-mariadb-schema/ (3819 vs 4025).
- **Triggers + `SIGNAL SQLSTATE '45000'`: identical.** MariaDB supports BEFORE UPDATE/DELETE triggers and `SIGNAL SQLSTATE '45000'` with `MESSAGE_TEXT` (error 1644), firing for every database user including root. The ledger/audit trigger designs (T1–T4) transfer unchanged. `TRUNCATE` still fires no trigger on either engine and is still closed by the app user having no `DROP` privilege.
  - Source: https://docs4.w3cub.com/mariadb/trigger-overview/; https://runebook.dev/en/docs/mariadb/trigger-overview/index.

### 3.8 `sql_mode` — one behavioural difference to probe, not assume

- MariaDB's default `sql_mode` is `STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION` — it does **not** include `ONLY_FULL_GROUP_BY`, which MySQL 8.4 enables by default. A grouped finance-summary query that MySQL 8.4 would reject (non-aggregated column outside `GROUP BY`) runs on MariaDB and returns an arbitrary value. The blueprint's reporting queries must be written as if `ONLY_FULL_GROUP_BY` were on, and the scaffold must verify the effective session mode (test V-SQL-01).
  - Source: https://www.arcodash.com/connectors/mariadb/ ("MariaDB's default sql_mode does not include ONLY_FULL_GROUP_BY, so a query that selects an ungrouped column runs on MariaDB and is rejected by MySQL 8.4").

### 3.9 DDL — mitigation unchanged

- MariaDB 10.6+ made DDL **atomic (crash-safe per statement)**, but DDL is still **not transactional**: every DDL statement still causes an implicit commit and a failed multi-statement migration still leaves a half-applied schema. The blueprint's mitigation (one DDL statement per migration, idempotent migrations, pre-deploy backup as the only rollback, staging-first runs, post-deploy drift check) stands unchanged.
  - Source: http://wp.mariadb.com/resources/blog/announcing-mariadb-server-10-6-1-beta/ ("Commands of the Data Definition Language (DDL) are atomic operations with MariaDB Server 10.6").

### 3.10 What the migration order keeps, and one count gap it surfaces

- The 13-step migration order (Doc 06 §10, Doc 15 §10 C-23) is engine-neutral and unchanged: framework tables → `sequences` → identity → reference data → community → media → organisation → activities/content → services → finance → system → deferred self-references → seeders.
- **Count gap surfaced (not caused) by this reconciliation — RESOLVED 2026-11-14:** the `sequences` counter table (Doc 06 §7.1, §10 step 1) had **no table definition anywhere** in Doc 06 or `diagrams/ERD.md` and was not in the 47-application-table count. It is now **defined as the 48th application table** (Doc 06 §7.5: `id`, `scope`, `year`, `next_value`, `UNIQUE(scope, year)`; allocation `SELECT … FOR UPDATE`). Counts are therefore **48 application / 50 defined / 58 physical** everywhere. This is a pre-existing-gap correction, not a MariaDB change. Its MariaDB behaviour (`SELECT … FOR UPDATE` on InnoDB) is compatible; only its definition/count was missing.

---

## 4. What does NOT change

Nothing in this section is weakened, reworded, or silently dropped. Each item states how MariaDB enforces it and where the proof lives (full preservation analysis: this addendum §3).

| Requirement (unchanged) | MariaDB enforcement | Proof |
|---|---|---|
| **Laravel 13, PHP 8.4** | Unchanged. Live versions already verified: Laravel 13.42.0, PHP 8.4.27 (Server Foundation Report §2, §6). | — |
| **Dual control** (approver ≠ enterer; approver ≠ reversal creator) | **Identical.** Named CHECKs enforced (error code 4025, not 3819 — §3.7) + service layer + triggers. | Doc 10 T-LED-08/27/30 re-run on MariaDB (V-LED-01). |
| **Ledger canonical 4 transitions** (`draft→draft`, `draft→published`, `draft→discarded`, `published→reversed`) **+ reversal-never-reversible + one-reversal-per-original** | **Identical.** BEFORE UPDATE/DELETE triggers (T1–T4) + unique `uk_one_reversal_per_original` + service guards. The T5 BEFORE INSERT trigger on `ledger_reversals` was **EXECUTED 2026-11-14 on MariaDB 11.8.9** — all four branches proven, 43/43 suite PASS (`tests/ledger-suite/TEST-RESULTS.md` §2). Doc 10 T-LED-13 is updated accordingly. | Doc 10 T-LED-01–17 on MariaDB 11.8.9 (V-LED-01). |
| **Argon2id password policy** (m=19 MiB, t=2, p=1; bcrypt fallback) | **Identical.** PHP-level (`password_hash`), not a database feature. | Existing password-policy tests, unchanged. |
| **128-bit tracking secrets** (`random_bytes(16)`, SHA-256 hash storage, Request ID never a credential) | **Identical.** PHP-generated; the hash column is a plain `varchar`. | Existing tracking tests, unchanged. |
| **Append-only audit log + four-database-user model** | **Triggers identical; privilege layer UNVERIFIED on this hosting.** The BEFORE UPDATE/DELETE triggers on `activity_log` fire for every user including root, so the trigger layer is intact. Whether hPanel permits the per-table `REVOKE DELETE` grants (app user: no `DELETE` on `ledger_entries`/`ledger_reversals`/`activity_log`; no DDL) is **not yet proven** — hPanel creates database-level users, and per-table revokes need `GRANT OPTION` on the owner user. If the probe (§6, V-PRIV-01) fails, the docs must record "privilege layer not implemented on this hosting; trigger layer is the enforcement" — explicitly, never silently. Compensating controls already in the design: triggers (cannot be disabled per-session), post-deploy drift check (Doc 10 T-LED-26), no UPDATE/DELETE code paths on `activity_log` (code-review gate). | V-PRIV-01 at provisioning; Doc 10 T-LED-19/20/21/23/24 re-run on MariaDB. |
| **Money `numeric(12,2)`, never float** | **Identical.** `DECIMAL`/`NUMERIC` exact arithmetic is the same on both engines. | Schema tests, unchanged. |
| **Retention** (three-tier backup 30d/12w/12m; audit log permanent; RPO 24h / RTO 4h) | **Identical.** No period is re-invented; the backup tool name changes only (§3.5). | Restore rehearsal (V-BKP-02). |
| **Phase 1 scope** (Super Admin + Expatriate Helper only; no OTP) | **Identical.** | — |
| **48 application tables / 50 defined / 58 physical** | **Corrected count** — `sequences` is defined as the 48th application table (Doc 06 §7.5; see §3.10). Pre-existing-gap correction, not a MariaDB change. | Doc 06 §1.4, §7.5; ERD. |

**No requirement was found that MariaDB 11.8.9 cannot preserve.** If the provisioning probes in §6 contradict that, this addendum must be revised — the contradiction is reported, not absorbed.

---

## 5. Decision-status table

| # | Sub-decision | Status | Authority / location |
|---|---|---|---|
| D-1 | Production engine is MariaDB 11.8.9 on Hostinger Shared Hosting | **Confirmed** | Fahim, 2026-11-14 (§1) |
| D-2 | MySQL 8.4 LTS decision superseded (ADR-003 → ADR-014) | **Confirmed** | Fahim, 2026-11-14; ADR-014 |
| D-3 | Laravel 13.42.0 + PHP 8.4.27 (live, verified) | **Confirmed** | Server Foundation Report §2, §6 |
| D-4 | Collation pinned: `utf8mb4` / `utf8mb4_unicode_ci`, explicit everywhere | **Recommended** | This addendum §3.2 (consequence of D-1) |
| D-5 | JSON accepted as LONGTEXT alias (validation via auto `JSON_VALID` CHECK) | **Recommended** | This addendum §3.3 |
| D-6 | Search primary is default-parser FULLTEXT + BOOLEAN MODE with `+term*` wildcards as a model scope (NOT Scout); autocomplete via `LIKE 'term%'` on a B-tree; explicit ordering (never MATCH relevance); `LIKE '%term%'` fallback only for 1-char/mid-word cases; tokens column conditional on explicit product decision (Awaiting Organisation) | **Confirmed** (measured on MariaDB 11.8.9) | This addendum §3.4; ADR-010 |
| D-7 | MariaDB search benchmark measured on local 11.8.9 (35 cases / 171 timed queries, `benchmark-mariadb/`); production re-run required before launch | **Confirmed** (local) / **Awaiting production re-run** | This addendum §3.4; Doc 13 Q-13 stays open |
| D-8 | Backup binary is `mariadb-dump` (spatie MariaDB dumper); physical backup + binlog PITR ruled out on this host | **Recommended** | This addendum §3.5 |
| D-9 | `DB_CONNECTION=mariadb` (dedicated driver, not `mysql`) | **Recommended** | This addendum §3.6 |
| D-10 | `endpoint_hash`: drop `NOT NULL` on the generated column, add `CHECK (endpoint_hash IS NOT NULL)` | **Recommended** | This addendum §3.7 |
| D-11 | CHECK-violation error code is 4025 on MariaDB (tests asserting 3819 updated) | **Recommended** | This addendum §3.7 |
| D-12 | Four-database-user model kept as designed; per-table REVOKE provability on hPanel | **Recommended** (design) / **Awaiting provisioning probe** (implementability) | This addendum §4; test V-PRIV-01 |
| D-13 | RPO 24h / RTO 4h; three-tier retention; restore cadence (monthly check + quarterly rehearsal) | **Confirmed** (unchanged) | Doc 06 §13; Doc 15 §10 C-13 |
| D-14 | MariaDB LTS upgrade planned before community-binary EOL 4 Jun 2028 (11.8 → next LTS) | **Recommended** | This addendum §3.1 |
| D-15 | Vector search: now available natively on MariaDB 11.7+ via Laravel 13 — future option only, no Phase 1 use case | **Recommended** (not adopted) | This addendum §7; ADR-014 |
| D-16 | External hosted search (Meilisearch/Algolia) if LIKE-based search ever fails empirically | **Awaiting Organisation** (future, evidence-triggered only) | ADR-010 trigger, unchanged in principle; self-hosting ruled out (§3.4) |
| D-17 | Revisit MySQL 8.4 if the project ever leaves shared hosting | **Awaiting Organisation** (no trigger now) | — |
| D-18 | `sequences` table defined as the 48th application table (Doc 06 §7.5); counts 48 / 50 / 58 everywhere | **Confirmed** (pre-existing-gap correction, §3.10) | This addendum §3.10; Doc 06 §7.5 |

---

## 6. Verification gates (must pass before Phase 1 migrations run)

These are the MariaDB replacements for Doc 10 T-LED-14 ("re-run on MySQL 8.4"). Until they pass, no doc may claim MariaDB enforcement.

| # | Gate | Exact test |
|---|---|---|
| V-LED-01 | Ledger + audit suite on MariaDB 11.8.9 | **PASSED 2026-11-14 (local MariaDB 11.8.9): 43/43 checks PASS** (`tests/ledger-suite/TEST-RESULTS.md`). T5 (T-LED-13) EXECUTED — all four branches proven. CHECK violations are 4025, not 3819 (T-LED-27/28/29/30 updated); both `approved_by` FKs use `ON DELETE RESTRICT` (M-2). Remaining: re-run once against the provisioned database (Doc 10 T-LED-14, as replaced). |
| V-COLL-01 | Collation reality check | **RESOLVED 2026-11-14 (U-01):** on local MariaDB 11.8.9, `SHOW COLLATION LIKE 'utf8mb4_0900_ai_ci'` returns one row (ID 255) — the collation EXISTS. The `utf8mb4_unicode_ci` pin stands either way. |
| V-SQL-01 | Session `sql_mode` probe | **Measured 2026-11-14 on local MariaDB 11.8.9 (U-02, local-default evidence):** `@@sql_mode = STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION` — `ONLY_FULL_GROUP_BY` is **absent** from the server default, as expected. Reporting queries must therefore be written as if `ONLY_FULL_GROUP_BY` were on. The production probe (effective session mode for the app connection) still stands as a scaffold gate. |
| V-BKP-01 | Dump binary presence | **RESOLVED 2026-11-14 (U-04):** `/usr/bin/mariadb-dump` present on the host (client 11.8.9-MariaDB — coordinator SSH probe). |
| V-BKP-02 | Backup + restore rehearsal with triggers | `backup:run --only-db`, then restore into a scratch database with the `mariadb` client and verify: all tables, all four ledger triggers, all named CHECKs, and the ledger totals all present. A DEFINER failure here is a finding, not a workaround to hide. |
| V-PRIV-01 | Per-table REVOKE provability | As the owner DB user: `REVOKE DELETE ON <db>.ledger_entries FROM '<app>'@'<host>';` (and the matching revokes for `ledger_reversals`/`activity_log`, and the `TRIGGER` grant for the migrate user). Success or failure is recorded verbatim; failure triggers the §4 fallback wording. |
| V-SCHEMA-01 | Full migration suite on MariaDB | Run the whole migration suite twice against MariaDB 11.8.9 (second run a no-op); assert the Spatie migrations run clean (no error 1071), the three generated-column uniques enforce, the `endpoint_hash` CHECK form creates, and `SHOW CREATE TABLE` shows `utf8mb4_unicode_ci` on every table. |
| V-SEARCH-01 | MariaDB search benchmark | **MEASURED 2026-11-14 (U-09, resolved locally):** 35 cases / 171 timed queries on local MariaDB 11.8.9 (`benchmark-mariadb/`, filed run 3). Remaining: production re-run (`benchmark-mariadb/RUN-ON-PRODUCTION.md`), real-data snapshot, scale check. |
| V-LOCK-01 | Concurrency (sequences + queue) | Concurrent `SELECT … FOR UPDATE` sequence allocation (no duplicate numbers under concurrency) and concurrent `FOR UPDATE SKIP LOCKED` job claims (no double-claim). **Measured 2026-11-14 on local MariaDB 11.8.9 (U-07, local-default evidence):** `@@innodb_snapshot_isolation = 1` (ON) — the 11.8 default, as expected. If a concurrency test behaves differently from the MySQL expectation, that default is the first suspect. The production value still stands as a scaffold check. |

---

### Measured evidence (2026-11-14, local MariaDB 11.8.9 — the exact production version)

| Probe | Result |
|---|---|
| `SELECT VERSION()` | `11.8.9-MariaDB` |
| `SELECT @@sql_mode` | `STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION` (no `ONLY_FULL_GROUP_BY`) |
| `SELECT @@innodb_snapshot_isolation` | `1` (ON — the 11.8 default) |
| `SELECT @@collation_server` | `utf8mb4_unicode_ci` |
| `SHOW COLLATION LIKE 'utf8mb4_0900_ai_ci'` | 1 row, ID 255 — the collation EXISTS on 11.8.9 (U-01 resolved; pin stands) |
| `SELECT @@innodb_ft_min_token_size` | `3` |
| F-02 generated-column test | `CREATE TABLE … endpoint_hash BINARY(32) GENERATED ALWAYS AS (UNHEX(SHA2(endpoint,256))) STORED NOT NULL` → **ERROR 1064** (syntax error near `NOT NULL`) — the blueprint form **fails** on MariaDB 11.8.9, as predicted. The CHECK form (`STORED`, plus `CONSTRAINT chk_endpoint_hash_not_null CHECK (endpoint_hash IS NOT NULL)`) creates cleanly; an inserted row has a non-NULL 32-byte hash. **F-02 VERIFIED.** |
| `mariadb-dump` on the host | `/usr/bin/mariadb-dump`, client 11.8.9-MariaDB (U-04 resolved — coordinator SSH probe) |
| T5 trigger (Doc 10 T-LED-13) | EXECUTED on MariaDB 11.8.9, all four branches proven (U-06 resolved) |
| Bengali search benchmark | 35 cases / 171 timed queries on MariaDB 11.8.9 (U-09 resolved locally) |

Still Unverified (provisioning probes): U-03 per-table revokes on shared hosting, U-05 restore rehearsal with triggers, U-08 full migration suite, and the production re-runs (search, ledger suite, identities as applied).

## 7. Notes the blueprint gets wrong on MariaDB (corrections applied in this addendum)

- **ADR-001 / ADR-003 / Doc 05 §2.4, §3: "Laravel 13 native vector search is unavailable / PostgreSQL-only."** False on MariaDB 11.8. Laravel 13.28+ supports vector columns and `whereVectorSimilarTo` on MariaDB 11.7+ natively (MariaDB's own `VECTOR` type). No Phase 1 use case exists, so nothing is adopted — but the disadvantage must be corrected, not repeated. Sources: https://laravel.com/framework/docs/13.x/queries ("Vector similarity clauses are currently supported on PostgreSQL … and MariaDB 11.7 or later"); https://mariadb.org/laravel-13-now-supports-mariadb-vector-natively/.
- **Doc 05 §3 / ADR-003: "generated columns + functional indexes".** MariaDB has no functional indexes (§3.7). Delete the phrase wherever it appears.
- **Doc 11 §2.2–§2.3 / ADR-012: "MySQL 8.4 LTS" as the `db` container, Ubuntu 24.04 + Docker Compose + Nginx.** The live host is Hostinger shared (CloudLinux, LiteSpeed, no Docker, no root — Server Foundation Report §3). Status note added to Doc 11 §§2.2–2.3 and ADR-012 (2026-11-14): the current deployment is Hostinger shared hosting per the Server Foundation Report; the Docker/VPS model is a future migration target, not current.

---

## 8. References

- Server Foundation Report: `docs/server-setup/SERVER-FOUNDATION-REPORT.md` §§2, 3, 8, 9, 11.
- Compatibility reconciliation: this addendum §3 (finding-by-finding) and `adr/ADR-014-mariadb-11-8-9.md`.
- Findings: the reconciliation behind §§3–4 (working paper; decisions recorded here).
- New ADR: `adr/ADR-014-mariadb-11-8-9.md` (published with this addendum).
- ADR-003 supersession: applied in `adr/ADR-003-database.md` (status row + verbatim supersession note after the header table).
- MariaDB JSON data type: https://mariadb.com/kb/en/json-data-type/
- MariaDB full-text index overview: https://mariadb.com/docs/server/ha-and-performance/optimization-and-tuning/optimization-and-indexes/full-text-indexes/full-text-index-overview.md
- MariaDB generated columns / CHECK constraints: https://mariadb.com/kb/en/constraint/ and https://docs.w3cub.com/mariadb/virtual-columns/index
- MariaDB unique indexes (multiple NULLs): https://mariadb.com/kb/en/getting-started-with-indexes/
- Laravel 13 query builder (whereFullText on MariaDB; vector on MariaDB 11.7+): https://laravel.com/framework/docs/13.x/queries

*End of doc 16 (addendum). It changes the engine only. Every requirement in §4 stands as written; every verification gate in §6 must pass before Phase 1 migrations run against MariaDB.*
