# ADR-010 — Search strategy (default-parser FULLTEXT + BOOLEAN MODE with `term*` wildcards, as a model scope)

| | |
|---|---|
| Status | **Recommended** |
| Date | 2026-11-14 (rewritten Phase 0.1 for MySQL 8.4 LTS; reproducibility package added Phase 0.1.1; **recommendation rewritten 2026-11-14 for MariaDB 11.8.9** — see 16-MARIADB-ADDENDUM.md) |
| Sources | Research Notes §7.3 (laravel.com/docs/13.x/scout — primary for the driver list) and §6; Decision Sheet; Audit Findings §2.3 (prototype search was browser-side array filtering); Investigator E Bengali benchmark (Phase 0.1, measured on MySQL 8.0.46 — MySQL only, does not transfer to MariaDB); MariaDB 11.8.9 Bengali benchmark (2026-11-14, measured on 11.8.9 — `benchmark-mariadb/`, 35 cases / 171 timed queries); Doc 15 §9; 16-MARIADB-ADDENDUM.md |

> **MariaDB note (2026-11-14):** the recommendation below was rewritten for MariaDB 11.8.9. The earlier recommendation (ngram FULLTEXT + BOOLEAN MODE) was measured on MySQL and cannot be implemented on MariaDB 11.8.9, which has no ngram parser. This ADR remains the record of both measurements; the production search approach is the MariaDB one below, decided in 16-MARIADB-ADDENDUM.md §3.4.

## Context

The platform needs server-side search over: the people directory (names, roles, areas), blood donors (names, areas), activities, news/notices/events/jobs, and FAQ. The prototype filtered arrays in the browser over hardcoded data (Audit Findings §6) — that does not scale and is not carried forward. Search must be server-side, paginated, and permission-aware (it never returns fields the caller may not see). The content is bilingual (Bengali + English), and **Bengali full-text quality was measured on MariaDB 11.8.9 in 2026-11-14 (35 cases / 171 timed queries, `benchmark-mariadb/`)** — the recommendation below follows those measurements. Re-validation on the production MariaDB 11.8.9 + a real-data snapshot is required before any performance claim (Doc 13 Q-13, Doc 15 §9 as amended by 16-MARIADB-ADDENDUM.md).

## Options considered

1. **Default-parser FULLTEXT + BOOLEAN MODE with `term*` wildcards, as an Eloquent model scope (NOT Scout)** — the adopted approach, measured on MariaDB 11.8.9 (see "Measured basis" below).
2. **Laravel Scout with the `database` engine, in BOOLEAN MODE** — REJECTED for MariaDB. Scout cannot express the adopted `+term*` query shape through its documented API: it passes the raw user query through and never synthesises `+` or `*`, so partial/prefix matching is impossible through Scout unless the application rewrites the query string before calling `search()` — at which point Scout adds nothing over a model scope. Scout also defaults to natural-language mode, ORs the full-text clause with LIKE clauses on every searchable column that has no attribute, does NOT create FULLTEXT indexes, and its relevance ordering is Postgres-only. Scout may still be used later for a Meilisearch/Typesense driver, which is a different decision.
3. **`LIKE '%term%'` as primary** — REJECTED. Correct for whole words but a full scan (`EXPLAIN type=ALL`); the slowest queries in the MariaDB run are LIKEs, mid-word substring matching is a precision bug for prefix search, and it degrades linearly with table size. Kept only as a fallback for 1-character queries and true mid-word substring search, if ever needed.
4. **Meilisearch** (self-hosted, single binary on port 7700; typo tolerance, faceting, geo, hybrid/vector search) — cannot be self-hosted on this host (loopback TCP listeners blocked); external hosting would be a new decision with a new cost.
5. **Typesense** (similar to Meilisearch, C++).
6. **Algolia** (hosted/paid) — rejected: a paid hosted dependency for a small community platform with no demonstrated need.
7. **MySQL ngram `FULLTEXT` + BOOLEAN MODE (measured on MySQL only)** — NOT AVAILABLE on MariaDB 11.8.9 (no ngram parser; `WITH PARSER ngram` is a syntax error). Recorded here as the superseded MySQL measurement only.
8. **Mroonga** — evaluated on MariaDB 11.8.9, REJECTED for production: it is a separate storage engine (no transactions, no foreign keys), would need a synced search-replica table, and needs `INSTALL PLUGIN`, which shared hosting does not grant. Revisit only if the project moves to a self-managed server AND prefix/partial recall beyond the wildcard path is demonstrably needed.
9. **App-level full scan (Python substring scan)** — REJECTED: correct by construction but loads every row per search, with no index and no ranking.

## Measured basis (MariaDB 11.8.9, 2026-11-14 — synthetic dataset, 3,900 rows; 35 cases, 171 timed queries, 171 count pairs; `benchmark-mariadb/`)

- **Default-parser FULLTEXT + BOOLEAN MODE with `term*` wildcards is the adopted primary:** whole words exact (112=112, 142=142, 37=37); word-prefix fragments exact vs LIKE (`রক্তদা` 282=282, `শীতব` 50=50, `বৃত্ত` 142=142, `মোহা` 37=37); multi-word AND exact (`শীতবস্ত্র বিতরণ` 50=50; `SSC বৃত্তি` AND 9=9); more precise than LIKE for short fragments (`রক*` 332 vs LIKE 704 — the 372-row gap is mid-word rows a user typing `রক` does not want). Timings 0.11–3.17 ms (median 0.36 ms).
- **NATURAL LANGUAGE MODE must NOT be the default:** usable for single whole words only (whole words exact; top-20 precision 20/20 genuine). Multi-word is OR-ish (`শীতবস্ত্র বিতরণ` 106 vs AND 50) and partials return 0.
- **Exact-boolean `+term` (no wildcard) is correct but narrow:** whole words only; partials return 0. Use only when the input is known to be complete words.
- **Stopwords apply in BOOLEAN MODE too on InnoDB 11.8.9** (measured — this contradicts the MariaDB KB line that describes MyISAM behaviour): `the` and `about` return 0 rows in both modes; `+the +quick` returns 0 rows even though `quick` is indexed. Stopwords must be stripped from `+`-terms. No Bengali word is a stopword.
- **Minimum token: 3 characters (InnoDB).** A standalone 2-character word is NOT in the index. The `*` wildcard is the exception: `রক*` expands against indexed tokens starting with `রক`.
- **Do NOT order by MATCH relevance.** All rows in a match set tie on relevance, and the score drifted after index builds (1.9055 → 1.3213 for the same query/data). Order explicitly instead.
- **`LIKE 'term%'` with a B-tree index is for prefix/autocomplete** (never `term*` for this): exact true-prefix semantics and the fastest measured queries (0.16–0.17 ms, `EXPLAIN type=range`, Using index).
- **Tokens column (`search_tokens`): CONDITIONAL — Awaiting Organisation.** It is the only approach unifying compound and spaced spellings (`রক্তদান` 165 = 112 + 53), but it costs ~7× the main FULLTEXT index, must be maintained by the application on every write, and 2-character fragments still return 0 through it. Adopt ONLY on an explicit product decision; either way it is an addition to the wildcard path, never a replacement.
- **Rules:** minimum 2 characters per term; strip English stopwords from `+`-terms; escape boolean operators; split multi-word input with `+` AND operators and `*` wildcards. **Spelling variants are NOT tolerated by any approach** (variant result sets are disjoint — e.g. `সাতানিপাড়া` / `শাতানিপাড়া` / `সাতানীপাড়া`; `মাদ্রাসা` / `মাদরাসা`). Transliteration (Latin query `roktodan`) finds nothing. Do not claim "fuzzy search" anywhere.
- **Index coverage:** the `persons` FULLTEXT index must cover `profession_bn` / `area_bn` in addition to names (a name-only index cannot answer `শিক্ষক`: it correctly returns 0 under every approach on MariaDB).
- **Pagination is consistent** in both modes (LIMIT 10 OFFSET 0/10/20, zero overlap, total 928 — not 1,800 as ngram NL gave on MySQL).

## Measured basis (Phase 0.1, Investigator E — MySQL 8.0.46, synthetic dataset, 3,900 rows; 35 cases, 133 timed queries, 133 count pairs; MySQL only — does not transfer to MariaDB)

- **ngram `FULLTEXT` + BOOLEAN MODE was the recommended primary on MySQL:** boolean counts identical to `LIKE '%term%'` in every single-word case. (Not implementable on MariaDB 11.8.9 — see 16-MARIADB-ADDENDUM.md.)
- **NATURAL LANGUAGE MODE must NOT be the default:** on MySQL it matched ~100% of rows (e.g. `রক্তদান` → 1800/1800, top-20 precision 8/20).
- **Default-parser `FULLTEXT` is fastest (median 0.12–0.92 ms across the measured cases) but returns 0 rows for partials** — not usable as the primary for Bengali partial-name search on MySQL; on MariaDB the wildcard path restores partial matching.
- 8.0 vs 8.4 ngram feature-set equivalence was verified from the MySQL 8.4 manual §14.9.8; **no timings measured on 8.4 — and no ngram measurement is possible on MariaDB 11.8.9, which has no ngram parser** (Doc 15 §9 re-test checklist as amended by 16-MARIADB-ADDENDUM.md).

## Reproduction

The MariaDB benchmark is reproducible from `docs/backend-architecture/benchmark-mariadb/` (2026-11-14): `generate_dataset.py` (deterministic synthetic dataset, seed 20261114 — byte-identical to the Phase 0.1 MySQL dataset), `schema.sql`, `queries.md` (the 35 cases), `run_benchmark.py`, `tokenize.py`, `README.md`, `RUN-ON-PRODUCTION.md`, and the filed run-3 results (`raw_results.json` / `raw_results.md`). The generated `seed.sql` (~1.8 MB) is produced on demand and is not committed. The MySQL benchmark is preserved intact as the historical record in `docs/backend-architecture/benchmark/` (Phase 0.1.1): `generate_dataset.py`, `schema.sql`, `queries.md` (the 35 cases), `run_benchmark.py`, `README.md`, and `RUN-ON-8.4.md` (MySQL run record — superseded for production). The MySQL package was verified end-to-end on MySQL 8.0.46 on 2026-11-14 (generator byte-identical to Phase 0.1; packaged runner reproduced all 133 count pairs exactly).

## Advantages

- **Model-scope search:** zero new infrastructure; no separate index to manage or keep in sync; the `+term*` query shape is expressible through `whereFullText(..., ['mode' => 'boolean'])`; a clean additive swap to Meilisearch later behind the Scout driver (not a rewrite) if a hosted engine is ever adopted.
- **Meilisearch:** typo tolerance, faceting, geo, hybrid/vector search — genuinely better search quality when it matters.
- **MariaDB default-parser FULLTEXT + BOOLEAN MODE with `term*` (measured):** exact whole words, exact word-prefix fragments, AND-correct multi-word queries, more precise than LIKE for short fragments — using only stock MariaDB features available on shared hosting (no plugin, no config change, no external service), at the cost of one small FT index (0.66 MB on 1,800 posts) unless tokens are added deliberately.

## Disadvantages

- **Database engine:** no typo tolerance, no faceting, and **no spelling-variant tolerance** (no approach tolerates spelling variants — this is a measured limit, not a configuration gap). Search quality for Bengali names is measured on MariaDB 11.8.9 and must be re-validated on production + a real-data snapshot (Doc 13 Q-13).
- **Scout default trap (if Scout were used):** Scout's database engine defaults to natural-language mode, which is unusable as the default here. This ADR does not adopt Scout's database engine, so the trap is avoided by construction.
- **Meilisearch:** a second service to run, back up, and keep in sync — index drift (the index disagreeing with the database) is a real failure mode. It is a clean swap later, but it is not free. Self-hosting is impossible on this host.
- **Typesense:** same operational cost as Meilisearch with a smaller ecosystem in this stack.
- **Algolia:** paid, hosted, and an external dependency for data that includes personal information — the data-residency and cost questions alone rule it out for now.

## Security implications

- Search must be permission-aware: a search over donors must never return phone numbers; a search over members must be scoped to what the caller may see (Doc 07 §6). This is enforced in the query, not by filtering results afterwards.
- Search input is treated like any other input: parameterised, length-limited, and never interpolated into raw SQL (Doc 08 §3.1). Boolean-mode operators in user input are escaped; all terms are bound as parameters (Doc 07 §6).
- If Meilisearch is adopted later, its API key must be server-side only, its dashboard must not be publicly exposed, and indexed data must respect the same visibility rules as the database.

## Scalability implications

- The database engine is adequate to thousands of rows — the entire expected dataset. The upgrade trigger is defined in advance: Meilisearch is added **only if** typo tolerance, faceting, or Bengali search quality demonstrably fails in an empirical test. "Search feels weak" is not a trigger; a failed test with real Bengali names/notices is.
- The MariaDB verdicts rest on match sets at 3,900 rows; re-measure at the real row counts (and again at 10×) — the timing order-of-magnitude and the tokens storage cost must be re-confirmed at scale (`benchmark-mariadb/README.md` §9).
- Scout queueing (`queue => true` in `config/scout.php`) keeps indexing off the web request path when a queued engine is adopted; it needs a queue driver configured first (ADR-008).

## Maintenance implications

- Database engine: one FULLTEXT index per searchable table to maintain (plus B-tree indexes on autocomplete fields; a `search_tokens` column + FULLTEXT index only if the product decision adopts it). The cost is that search improvements require database work (FULLTEXT indexes — on MariaDB the parser choice is the default parser only, no ngram; recorded in Doc 06 §3.2/§3.5/§5.1 and Doc 07 §6, as amended by 16-MARIADB-ADDENDUM.md).
- Meilisearch (if adopted): the index must be rebuilt and verified as part of the backup/restore discipline; index drift must be monitored.

## Final recommendation

**Start with default-parser FULLTEXT + BOOLEAN MODE with `+term*` wildcards, implemented as an Eloquent model scope (NOT Scout's database engine), on MariaDB 11.8.9** — with `LIKE 'term%'` on a B-tree for autocomplete, explicit ordering (never MATCH relevance), stopwords stripped from `+`-terms, terms ≥ 2 characters, and `LIKE '%term%'` fallback only for 1-character input and true mid-word substring search. The `search_tokens` column is adopted ONLY on an explicit product decision (Awaiting Organisation). Add Meilisearch later only if typo tolerance, faceting, or Bengali search quality demonstrably fails in an empirical test with real Bengali names and notices.

## Reason for selection

Zero new infrastructure for a dataset of thousands of rows, with a clean additive upgrade path behind the same Scout driver if a hosted engine is ever adopted. Paying for a second search service — with its sync, backup, and drift risks — before search quality has been measured would be premature optimisation. The Bengali-quality question is now measured on MariaDB 11.8.9 (35 cases / 171 timed queries, `benchmark-mariadb/`) and is a production re-validation, not a claim to make.
