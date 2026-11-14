# ADR-010 — Search strategy (Scout database engine first, BOOLEAN MODE)

| | |
|---|---|
| Status | **Recommended** |
| Date | 2026-11-14 (rewritten Phase 0.1 for MySQL 8.4 LTS; reproducibility package added Phase 0.1.1) |
| Sources | Research Notes §7.3 (laravel.com/docs/13.x/scout — primary for the driver list) and §6; Decision Sheet; Audit Findings §2.3 (prototype search was browser-side array filtering); Investigator E Bengali benchmark (Phase 0.1, measured on MySQL 8.0.46); Doc 15 §9 |

## Context

The platform needs server-side search over: the people directory (names, roles, areas), blood donors (names, areas), activities, news/notices/events/jobs, and FAQ. The prototype filtered arrays in the browser over hardcoded data (Audit Findings §6) — that does not scale and is not carried forward. Search must be server-side, paginated, and permission-aware (it never returns fields the caller may not see). The content is bilingual (Bengali + English), and **Bengali full-text quality was measured on MySQL 8.0.46 in Phase 0.1 (Investigator E)** — the recommendation below follows those measurements. Re-test on MySQL 8.4 is required before any performance claim (Doc 13 Q-13, Doc 15 §9).

## Options considered

1. **Laravel Scout with the `database` engine, in BOOLEAN MODE** (or plain `whereFullText` / `whereLike` Eloquent queries — `whereLike()` exists since Laravel 11.34 and emits `LIKE` on MySQL). **Scout's database engine defaults to natural-language mode; this project MUST use boolean mode** (see below) — the default must be overridden explicitly.
2. **Meilisearch** (self-hosted, single binary on port 7700; typo tolerance, faceting, geo, hybrid/vector search).
3. **Typesense** (similar to Meilisearch, C++).
4. **Algolia** (hosted/paid) — rejected: a paid hosted dependency for a small community platform with no demonstrated need.

## Measured basis (Phase 0.1, Investigator E — MySQL 8.0.46, synthetic dataset, 3,900 rows; 35 cases, 133 timed queries, 133 count pairs)

- **ngram `FULLTEXT` + BOOLEAN MODE is the recommended primary:** boolean counts identical to `LIKE '%term%'` in every single-word case.
- **NATURAL LANGUAGE MODE must NOT be the default:** it matched ~100% of rows (e.g. `রক্তদান` → 1800/1800, top-20 precision 8/20). Scout's database engine defaults to natural-language mode — boolean mode must be set explicitly if Scout is adopted.
- **Default-parser `FULLTEXT` is fastest (median 0.12–0.92 ms across the measured cases) but returns 0 rows for partials** — not usable as the primary for Bengali partial-name search.
- **`LIKE 'term%'` with a B-tree index is for prefix/autocomplete** (never `term*`).
- **Rules:** minimum 2 characters per term; escape boolean operators; split multi-word input with `+` AND operators. **Spelling variants are NOT tolerated by any approach** (boolean returns only the variant's own rows — the variant result sets are disjoint).
- **Index coverage:** the `persons` FULLTEXT index must add `profession_bn` / `area_bn` (a name-only index cannot answer `শিক্ষক`: boolean / default / LIKE return 0, NL returns 175 rows of bigram noise).
- 8.0 vs 8.4 ngram feature-set equivalence verified from the MySQL 8.4 manual §14.9.8; **no timings measured on 8.4 — re-run required** (Doc 15 §9 re-test checklist).

## Reproduction

The benchmark is reproducible from `docs/backend-architecture/benchmark/` (Phase 0.1.1): `generate_dataset.py` (deterministic synthetic dataset, seed 20261114), `schema.sql`, `queries.md` (the 35 cases), `run_benchmark.py` (connection parameters as arguments/env, records the server version in its output), `README.md` (the accurately labelled 8.0.46 results summary), and `RUN-ON-8.4.md` (step-by-step 8.4 run guide). The generated `seed.sql` (~1.8 MB) is produced on demand and is not committed. The package was verified end-to-end on MySQL 8.0.46 on 2026-11-14 (generator byte-identical to Phase 0.1; packaged runner reproduced all 133 count pairs exactly).

## Advantages

- **Scout `database` engine:** zero new infrastructure; no separate index to manage or keep in sync; adequate ranking for member/notice/activity search at thousands of rows; a clean additive swap to Meilisearch later behind the same Scout driver (not a rewrite).
- **Meilisearch:** typo tolerance, faceting, geo, hybrid/vector search — genuinely better search quality when it matters.
- **MySQL ngram `FULLTEXT` + BOOLEAN MODE (measured):** correct single-word recall matching `LIKE '%term%'`, with ranking, at this scale — stronger than the default parser for Bengali partial matching.

## Disadvantages

- **Database engine:** no typo tolerance, no faceting, and **no spelling-variant tolerance** (no approach tolerates spelling variants — this is a measured limit, not a configuration gap). Search quality for Bengali names is measured on 8.0.46 and must be re-tested on 8.4.
- **Scout default trap:** Scout's database engine defaults to natural-language mode, which is unusable as the default here (~100% row match). Boolean mode must be set explicitly; a code-review/CI check must prevent a silent revert to the default.
- **Meilisearch:** a second service to run, back up, and keep in sync — index drift (the index disagreeing with the database) is a real failure mode. It is a clean swap later, but it is not free.
- **Typesense:** same operational cost as Meilisearch with a smaller ecosystem in this stack.
- **Algolia:** paid, hosted, and an external dependency for data that includes personal information — the data-residency and cost questions alone rule it out for now.

## Security implications

- Search must be permission-aware: a search over donors must never return phone numbers; a search over members must be scoped to what the caller may see (Doc 07 §6). This is enforced in the query, not by filtering results afterwards.
- Search input is treated like any other input: parameterised, length-limited, and never interpolated into raw SQL (Doc 08 §3.1). Boolean-mode operators in user input are escaped (Doc 07 §6).
- If Meilisearch is adopted later, its API key must be server-side only, its dashboard must not be publicly exposed, and indexed data must respect the same visibility rules as the database.

## Scalability implications

- The database engine is adequate to thousands of rows — the entire expected dataset. The upgrade trigger is defined in advance: Meilisearch is added **only if** typo tolerance, faceting, or Bengali search quality demonstrably fails in an empirical test. "Search feels weak" is not a trigger; a failed test with real Bengali names/notices is.
- Scout queueing (`queue => true` in `config/scout.php`) keeps indexing off the web request path when a queued engine is adopted; it needs a queue driver configured first (ADR-008).

## Maintenance implications

- Database engine: no index to maintain, no sync to monitor. The cost is that search improvements require database work (FULLTEXT indexes, ngram parser choice — recorded in Doc 06 §3.2/§3.5/§5.1 and Doc 07 §6).
- Meilisearch (if adopted): the index must be rebuilt and verified as part of the backup/restore discipline; index drift must be monitored.

## Final recommendation

**Start with Scout's `database` engine in BOOLEAN MODE** (or plain `whereFullText` boolean / `whereLike` Eloquent queries where Scout adds nothing), on MySQL 8.4 LTS. Add Meilisearch later only if typo tolerance, faceting, or Bengali search quality demonstrably fails in an empirical test with real Bengali names and notices.

## Reason for selection

Zero new infrastructure for a dataset of thousands of rows, with a clean additive upgrade path behind the same Scout driver. Paying for a second search service — with its sync, backup, and drift risks — before search quality has been measured would be premature optimisation. The Bengali-quality question is now measured on MySQL 8.0.46 (Investigator E) and is a re-test on 8.4, not a claim to make.
