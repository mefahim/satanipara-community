# ADR-010 — Search strategy (Scout database engine first)

| | |
|---|---|
| Status | **Recommended** |
| Date | 2026-11-14 |
| Sources | Research Notes §7.3 (laravel.com/docs/13.x/scout — primary for the driver list) and §6 (PostgreSQL vs MySQL full-text); Decision Sheet; Audit Findings §2.3 (prototype search was browser-side array filtering) |

## Context

The platform needs server-side search over: the people directory (names, roles, areas), blood donors (names, areas), activities, news/notices/events/jobs, and FAQ. The prototype filtered arrays in the browser over hardcoded data (Audit Findings §6) — that does not scale and is not carried forward. Search must be server-side, paginated, and permission-aware (it never returns fields the caller may not see). The content is bilingual (Bengali + English), and **Bengali full-text quality is unverified in every option considered** (Research Notes §6, §9 item 7).

## Options considered

1. **Laravel Scout with the `database` engine** (or plain `whereFullText` / `whereLike` Eloquent queries — `whereLike()` exists since Laravel 11.34 and emits `LIKE` on MySQL, `ILIKE` on PostgreSQL).
2. **Meilisearch** (self-hosted, single binary on port 7700; typo tolerance, faceting, geo, hybrid/vector search).
3. **Typesense** (similar to Meilisearch, C++).
4. **Algolia** (hosted/paid) — rejected: a paid hosted dependency for a small community platform with no demonstrated need.
5. **PostgreSQL native full-text directly** (`tsvector`/`tsquery` + GIN, `ts_rank`, phrase matching) without Scout — a subset of option 1; the difference is whether the Scout abstraction is used.

## Advantages

- **Scout `database` engine:** zero new infrastructure; no separate index to manage or keep in sync; adequate ranking for member/notice/activity search at thousands of rows; a clean additive swap to Meilisearch later behind the same Scout driver (not a rewrite).
- **Meilisearch:** typo tolerance, faceting, geo, hybrid/vector search — genuinely better search quality when it matters.
- **PostgreSQL native FTS (under option 1 or 5):** configurable dictionaries/stemming, ranking, phrase matching; stronger than MySQL's `FULLTEXT` (which is simpler and less configurable, notably weaker on stemming/language handling).

## Disadvantages

- **Database engine:** no typo tolerance, no faceting, weaker Bengali handling. Search quality for Bengali names is unproven and must be tested empirically before any claim is made.
- **Meilisearch:** a second service to run, back up, and keep in sync — index drift (the index disagreeing with the database) is a real failure mode. It is a clean swap later, but it is not free.
- **Typesense:** same operational cost as Meilisearch with a smaller ecosystem in this stack.
- **Algolia:** paid, hosted, and an external dependency for data that includes personal information — the data-residency and cost questions alone rule it out for now.

## Security implications

- Search must be permission-aware: a search over donors must never return phone numbers; a search over members must be scoped to what the caller may see (Doc 07 §6). This is enforced in the query, not by filtering results afterwards.
- Search input is treated like any other input: parameterised, length-limited, and never interpolated into raw SQL (Doc 08 §3.1).
- If Meilisearch is adopted later, its API key must be server-side only, its dashboard must not be publicly exposed, and indexed data must respect the same visibility rules as the database.

## Scalability implications

- The database engine is adequate to thousands of rows — the entire expected dataset. The upgrade trigger is defined in advance: Meilisearch is added **only if** typo tolerance, faceting, or Bengali search quality demonstrably fails in an empirical test. "Search feels weak" is not a trigger; a failed test with real Bengali names/notices is.
- Scout queueing (`queue => true` in `config/scout.php`) keeps indexing off the web request path when a queued engine is adopted; it needs a queue driver configured first (ADR-008).

## Maintenance implications

- Database engine: no index to maintain, no sync to monitor. The cost is that search improvements require database work (indexes, `pg_trgm` trigram indexes as a likely fallback — not verified here, Research Notes §6).
- Meilisearch (if adopted): the index must be rebuilt and verified as part of the backup/restore discipline; index drift must be monitored.

## Final recommendation

**Start with Scout's `database` engine** (or plain `whereFullText`/`whereLike` Eloquent queries where Scout adds nothing), on whichever database is chosen (ADR-003). Add Meilisearch later only if typo tolerance, faceting, or Bengali search quality demonstrably fails in an empirical test with real Bengali names and notices.

## Reason for selection

Zero new infrastructure for a dataset of thousands of rows, with a clean additive upgrade path behind the same Scout driver. Paying for a second search service — with its sync, backup, and drift risks — before search quality has been measured would be premature optimisation. The Bengali-quality question is explicitly unresolved and is a test to run, not a claim to make.
