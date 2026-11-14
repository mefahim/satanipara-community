# Bengali search benchmark — test cases (queries list)

The 35 test cases run by `run_benchmark.py` (Phase 0.1 measured **35 cases, 133 timed queries, 133 count pairs** — see the correction note in `README.md`: the Phase 0.1 report E §3.3 said "37 cases", which is wrong; the runner defines 35 distinct case labels and the raw results contain 35).

Approach keys: `ngram_nl` = ngram FULLTEXT, NATURAL LANGUAGE MODE; `ngram_bool` = ngram FULLTEXT, BOOLEAN MODE; `default_ft` = default-parser FULLTEXT, NATURAL LANGUAGE MODE (on a duplicate copy of the table); `like_pct` = `LIKE '%term%'`; `like_prefix` = `LIKE 'term%'` on a B-tree index; `app_level` = Python substring scan over all rows (timings only, in `raw_results.json`).

**Reference counts** below are the measured MySQL **8.0.46** values from Phase 0.1 (`raw_results.json` in the Phase 0.1 work area). They are reference values for the 8.0.46 run, NOT expected values for an 8.4 run: on 8.4 the counts must be re-measured, and the pass criterion is the **relationship** stated per group (e.g. boolean == LIKE), not the absolute number. Timings are never a pass criterion at this scale — correctness (match sets) is.

## (a) Word matching — whole Bengali/English words

Expected: `ngram_bool` count == `LIKE` count, `default_ft` count == `LIKE` count. `ngram_nl` is expected to OVER-match (bigram union) — its count is recorded, not a pass criterion.

| Case | ngram_bool | LIKE %term% | ngram_nl | default_ft | LIKE prefix |
|---|---|---|---|---|---|
| `activities[বৃত্তি]` | 46 | 46 | 505 | — | — |
| `activities[রক্তদান]` | 66 | 66 | 600 | — | — |
| `activities[শীতবস্ত্র]` | 49 | 49 | 528 | — | — |
| `persons[Mohammad]` | 37 | 37 | 130 | 37 | — |
| `persons[চক্রবর্তী]` | 58 | 58 | 247 | 58 | — |
| `persons[মোহাম্মদ]` | 37 | 37 | 482 | 37 | — |
| `persons[রহিম]` | 33 | 33 | 289 | 33 | — |
| `persons[শিক্ষক]` | 0 | 0 | 175 | 0 | — |
| `posts_word[প্রশিক্ষণ]` | 316 | 316 | 1772 | 316 | — |
| `posts_word[বৃত্তি]` | 142 | 142 | 1705 | 142 | — |
| `posts_word[মসজিদ]` | 108 | 108 | 1569 | 108 | — |
| `posts_word[রক্তদান]` | 112 | 112 | 1800 | 112 | — |
| `posts_word[শীতবস্ত্র]` | 50 | 50 | 1800 | 50 | — |
| `posts_word[শ্রমিক]` | 58 | 58 | 1800 | 58 | — |

## (b) Partial matching — prefixes/fragments of a word, incl. the 1-character edge

Expected: `ngram_bool` count == `LIKE` count (boolean mode handles partials via the ngram phrase). `default_ft` is expected to return **0** (whitespace tokenisation cannot match a fragment). 1-character input `র`: NL returns 0 (shorter than ngram_token_size=2); boolean `র*` returns all rows — the application must require ≥2 characters or route 1-char input to the B-tree prefix path.

| Case | ngram_bool | LIKE %term% | ngram_nl | default_ft | LIKE prefix |
|---|---|---|---|---|---|
| `persons[মোহা]` | 37 | 37 | 341 | 0 | — |
| `posts_partial[বৃত্ত]` | 142 | 142 | 1660 | 0 | — |
| `posts_partial[র] (1-char edge)` | 1800 | 1800 | 0 | 0 | — |
| `posts_partial[রক]` | 704 | 704 | 704 | 0 | — |
| `posts_partial[রক্তদা]` | 282 | 282 | 1711 | 0 | — |
| `posts_partial[শীতব]` | 50 | 50 | 106 | 0 | — |

## (c) Prefix matching — true prefix / autocomplete

Expected: `LIKE 'term%'` (B-tree) returns only rows whose field STARTS with the term. `ngram_bool` with `term*` is expected to return MORE (substring anywhere — the wildcard is ignored for prefixes longer than the token size); that difference is the finding, not a failure of the runner. Do not implement autocomplete with `term*`.

| Case | ngram_bool | LIKE %term% | ngram_nl | default_ft | LIKE prefix |
|---|---|---|---|---|---|
| `persons_prefix[মোহাম্মদ] (LIKE 'term%')` | 37 | — | — | — | 37 |
| `posts_prefix[শিক্ষা] (LIKE 'term%')` | 792 | — | — | — | 60 |

## (d) Spelling variations — the same word spelled differently

Expected: each spelling returns ONLY its own rows under boolean / default / LIKE (no approach tolerates spelling variants). `ngram_nl` is expected to return ~all rows for every variant (no discrimination). Multi-word spaced forms (`রক্ত দান`, `শীত বস্ত্র`): boolean mode splits on space into separate optional terms, so its count is HIGHER than the literal-LIKE count — the application must add explicit `+` operators for AND semantics.

| Case | ngram_bool | LIKE %term% | ngram_nl | default_ft | LIKE prefix |
|---|---|---|---|---|---|
| `posts_spelling[মাদরাসা]` | 51 | 51 | 1800 | 51 | — |
| `posts_spelling[মাদ্রাসা]` | 38 | 38 | 1800 | 38 | — |
| `posts_spelling[রক্ত দান]` | 416 | 53 | 1800 | 53 | — |
| `posts_spelling[শাতানিপাড়া]` | 54 | 54 | 1800 | 54 | — |
| `posts_spelling[শীত বস্ত্র]` | 106 | 56 | 1800 | 56 | — |
| `posts_spelling[সাতানিপাড়া]` | 928 | 928 | 1800 | 928 | — |
| `posts_spelling[সাতানীপাড়া]` | 54 | 54 | 1800 | 54 | — |

## (e) Bengali + English mixed queries

Expected: `ngram_bool` count == `LIKE` count, except `SSC বৃত্তি` where LIKE searches the literal string (0 rows contain it verbatim) while boolean/default treat it as two terms (287) — a query-form difference, not an engine difference. The `the` case is INCONCLUSIVE: no row contains the word `the`, so it establishes nothing about stopwords.

| Case | ngram_bool | LIKE %term% | ngram_nl | default_ft | LIKE prefix |
|---|---|---|---|---|---|
| `posts_mixed[Blood Donation]` | 215 | 215 | 215 | 215 | — |
| `posts_mixed[SSC বৃত্তি]` | 287 | 0 | 1712 | 287 | — |
| `posts_mixed[Scholarship]` | 154 | 154 | 247 | 154 | — |
| `posts_mixed[the]` | 0 | 0 | 0 | 0 | — |

## (f) Relevance sorting — multi-word queries, top-5 + precision

Expected: boolean and default counts == AND-of-LIKE count (112 / 50). `ngram_nl` is expected to match ~all rows (1800). Top-20 precision is checked separately in the runner output (top_results): for `রক্তদান` NL top-20 contained only 8/20 genuinely matching rows.

| Case | ngram_bool | LIKE %term% | ngram_nl | default_ft | LIKE prefix |
|---|---|---|---|---|---|
| `posts_relevance[রক্তদান শিবির]` | 112 | 112 | 1800 | 112 | — |
| `posts_relevance[শীতবস্ত্র বিতরণ]` | 50 | 50 | 1800 | 106 | — |

## Notes on individual cases

- `persons[শিক্ষক]`: profession, not a name. The benchmark `persons` FULLTEXT index covers only `(name_bn, name_en)`, so boolean / default / LIKE correctly return **0**; ngram NL returns **175** (pure bigram noise). This is a test-design note, not an engine failure: the production `persons` index must also cover `profession_bn` / `area_bn` (Doc 06 §3.2). Doc 15 §9.2/§9.3 wrongly state this case returned 0 under every approach — corrected in Phase 0.1.1 (see `15-PHASE-0.1-REVIEW-AND-RESOLUTION.md` §21.1, Item 5, which records the corrected `persons[শিক্ষক]` NL count 175 and the §9 replacement in full. The CONSISTENCY.md reference previously cited here does not exist in this repo; C-13/C-14 in Doc 15 §10 are the restore-cadence and module→phase-map decisions, not this correction.)
- `posts_mixed[SSC বৃত্তি]`: LIKE-literal 0 vs boolean 287 — the LIKE form searches the literal string; boolean treats it as two terms. Compare boolean against AND-of-LIKE (287), not literal LIKE.
- `posts_relevance[শীতবস্ত্র বিতরণ]`: default_ft 106 vs LIKE-AND 50 — default-parser natural-language mode treats the two terms as an OR-ish union; boolean (50) is the exact figure.
- `posts_partial[র] (1-char edge)`: NL 0, boolean 1800 — both ngram modes are unusable for 1-character input; see group (b) note.
- `posts_mixed[the]`: inconclusive (no row contains `the`). Retained so a future run on real data can replace it with a genuine stopword test; do not cite it as a stopword finding.
