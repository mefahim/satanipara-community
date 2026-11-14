# ADR-003 — Database (PostgreSQL, with MySQL alternative)

| | |
|---|---|
| Status | **Recommended** — pending hosting confirmation |
| Date | 2026-11-14 |
| Sources | Research Notes §6 (laravel.com/docs/13.x/database — primary for support floors; secondary lifecycle summaries for version/EOL dates, to be re-verified at postgresql.org/docs and dev.mysql.com/doc before writing dates into the build); Decision Sheet; Engineering Plan v1.1 (which specified PostgreSQL 16 — version superseded, see below) |

## Context

The platform is a relational databank and ledger: members and families, committee terms, annual activities, expatriate requests with a status workflow, a blood-donor registry, notices/news/gallery, and a transparent accounts ledger in BDT. It starts on a single VPS. The choice is between PostgreSQL and MySQL/MariaDB (LTS). Both are adequate for the workload; the decision turns on which constraint matters more — the features PostgreSQL enables, or portability to cheap shared hosting in Bangladesh, where MySQL is ubiquitous and PostgreSQL is rarely offered.

## Options considered

1. **PostgreSQL** (current major at scaffold time; PostgreSQL 18 was current when checked, supported until 14 Nov 2030 per secondary sources — re-verify before asserting dates).
2. **MySQL LTS** (8.4, or 9.7 LTS released 21 Apr 2026 per secondary sources — re-verify). MySQL 8.0 reached community EOL 30 Apr 2026 and is not an option.
3. **MariaDB LTS** (11.4/11.8/12.3 per secondary sources). A MySQL-compatible alternative with the same hosting advantage.
4. **SQLite** — rejected for production: adequate for tests, not for a multi-user platform with concurrent writes.

## Advantages

- **PostgreSQL:** Laravel 13's vector search is PostgreSQL-only (requires `pgvector`); native full-text search (`tsvector`/`tsquery`, GIN indexes, ranking) is stronger and more configurable than MySQL's; JSONB is binary, GIN-indexable across the whole document, with rich operators; **transactional DDL** (a failed migration rolls back cleanly — MySQL DDL is not transactional and can leave partial schema changes); window functions, CTEs (including recursive), `FILTER` aggregates, materialised views.
- **MySQL/MariaDB:** ubiquitous on cheap Bangladeshi shared/cPanel hosting with phpMyAdmin; every cheap host offers it; simpler operational story if the site ever has to leave the VPS; InnoDB is strong for read-heavy simple workloads.
- **Both:** identical `DECIMAL(p,s)` semantics — financial integrity is the same in either, provided the application uses `decimal` columns and never floats. Foreign keys work in both (InnoDB).

## Disadvantages

- **PostgreSQL:** rarely offered on cheap shared hosting in Bangladesh — choosing it ties the project to the VPS (or a managed database) for the foreseeable future. One major release per year (5-year support each) means major upgrades are more frequent than MySQL LTS, though `pg_upgrade` or dump/restore handles them.
- **MySQL:** choosing it closes the door on Laravel 13 vector search permanently; native full-text search is less configurable (notably weaker stemming/language handling); DDL is not transactional; no materialised views, no `FILTER` aggregates.
- **Both:** Bengali full-text search quality is **unverified** in both (Research Notes §6, §9 item 7) — PostgreSQL has no built-in Bengali dictionary, and MySQL's n-gram parser behaviour for Bengali is untested. Neither database can be claimed to search Bengali well until an empirical test with real Bengali names and notices is run. `pg_trgm` trigram search is a likely PostgreSQL fallback; it is not verified here.

## Security implications

- No material security difference between the two for this workload, provided both are configured correctly (least-privilege application role, no public database port, encrypted connections where the setup supports them).
- PostgreSQL's transactional DDL is a safety advantage during deploys: a failed migration cannot leave a half-applied schema behind.
- The database port is never exposed to the internet in either case (Doc 08 §11, Doc 11 §2).

## Scalability implications

- Both handle this workload (a few thousand users, hundreds of requests, thousands of ledger rows) comfortably on the starting VPS.
- PostgreSQL's MVCC (readers never block writers) is better under mixed read/write load; MySQL's clustered primary-key index favours simple primary-key lookups. Neither difference decides this project.
- If the platform ever needs vector/semantic search, only PostgreSQL supports Laravel's native implementation; with MySQL that feature would need an external service.

## Maintenance implications

- **PostgreSQL:** one major per year, 5-year support each; upgrades via `pg_upgrade` or dump/restore; extensions (`pgvector`, `pg_trgm`) via `CREATE EXTENSION`.
- **MySQL LTS:** 8-year lifecycle (5 premier + 3 extended, Oracle policy); majors are rarer but bigger jumps; upgrade via in-place or dump/restore.
- **Both:** `pg_dump` / `mysqldump` are the tools spatie/laravel-backup shells out to; both are one-binary, well understood operations (Research Notes §7.5).

## Final recommendation

**PostgreSQL — narrowly, and only because the project starts on a single VPS where hosting availability is not a constraint.** The deciding constraint is recorded here: **VPS → PostgreSQL; shared-hosting portability requirement → MySQL/MariaDB LTS.** If the hosting requirement changes before scaffold, the decision changes with it and this ADR is superseded, not silently ignored.

## Reason for selection

The tipping factors, in order: (1) Laravel 13's vector search is PostgreSQL-only, so MySQL closes that door permanently; (2) native full-text search is stronger without an extra service; (3) JSONB and transactional DDL reduce the two most common "we'll regret this later" risks in a databank/ledger application. The counterweight is real — MySQL is the only practical option on cheap shared hosting in Bangladesh — but it does not apply while the project runs on its own VPS. The choice is deliberately presented as a lean with a recorded deciding constraint, not as a foregone conclusion. Engineering Plan v1.1's PostgreSQL 16 is superseded as a version pin: the project uses the current major at scaffold time, verified against postgresql.org.
