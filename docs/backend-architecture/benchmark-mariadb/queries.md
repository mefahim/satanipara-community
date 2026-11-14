# Bengali search benchmark — test cases (queries list, MariaDB rebuild)

The 35 test cases run by `run_benchmark.py` (MariaDB 11.8.9 measured
**35 cases, 171 timed queries, 171 count pairs** — 2 more approaches per
case than Phase 0.1's 133, because MariaDB needs both the exact-word and
the wildcard boolean form measured, plus the tokens-column approach).

Approach keys: `ft_nl` = default-parser FULLTEXT, NATURAL LANGUAGE MODE;
`ft_bool` = same index, BOOLEAN MODE, exact words (`+a +b` for AND);
`ft_bool_wild` = same index, BOOLEAN MODE, wildcard (`term*` /
`+a* +b*`); `tokens_ft` = FULLTEXT over the precomputed `search_tokens`
column (see `tokenize.py`), BOOLEAN MODE, plain terms; `like_pct` =
`LIKE '%term%'`; `like_prefix` = `LIKE 'term%'` on a B-tree index;
`app_level` = Python substring scan over all rows (timings only, in
`raw_results.json`).

**Reference counts** below are the measured MariaDB **11.8.9** values
from run 3 (2026-11-14, `raw_results.json`). They are reference values
for that run, NOT expected values for a production re-run: on production
the counts must be re-measured, and the pass criterion is the
**relationship** stated per group (e.g. boolean == LIKE, or
wildcard == LIKE for word-prefixes), not the absolute number. Timings
are never a pass criterion at this scale — correctness (match sets) is.

There is NO `ngram_*` approach on MariaDB: MariaDB has no ngram parser
(`SHOW PLUGINS` lists no ngram plugin; `WITH PARSER ngram` is a syntax
error). The Phase 0.1 ngram columns therefore have no counterpart here;
the comparison is between the default parser in its two modes, the
wildcard form, the tokens column, LIKE, and the app-level scan.

## (a) Word matching — whole Bengali/English words

Expected: `ft_nl`, `ft_bool` and `ft_bool_wild` counts == `LIKE` count.
Unlike MySQL ngram NL, MariaDB default-parser NL is PRECISE for whole
words (it indexes whole words, not bigrams) — its count equals LIKE
here. `tokens_ft` is expected to be >= LIKE for compounds that also
occur spaced (`রক্তদান` 165 vs 112, `শীতবস্ত্র` 106 vs 50): the
de-spaced join token unifies the compound and spaced spellings. That is
a deliberate recall win, not a failure — see §(d) and 16-MARIADB-ADDENDUM.md §3.4.

| Case | ft_nl | ft_bool | ft_bool_wild | tokens_ft | LIKE %term% |
|---|---|---|---|---|---|
| `activities[বৃত্তি]` | 46 | 46 | 46 | 46 | 46 |
| `activities[রক্তদান]` | 66 | 66 | 66 | 66 | 66 |
| `activities[শীতবস্ত্র]` | 49 | 49 | 49 | 49 | 49 |
| `persons[Mohammad]` | 37 | 37 | 37 | 37 | 37 |
| `persons[চক্রবর্তী]` | 58 | 58 | 58 | 58 | 58 |
| `persons[মোহাম্মদ]` | 37 | 37 | 37 | 37 | 37 |
| `persons[রহিম]` | 33 | 33 | 33 | 33 | 33 |
| `persons[শিক্ষক]` | 0 | 0 | 0 | 0 | 0 |
| `posts_word[প্রশিক্ষণ]` | 316 | 316 | 316 | 316 | 316 |
| `posts_word[বৃত্তি]` | 142 | 142 | 142 | 142 | 142 |
| `posts_word[মসজিদ]` | 108 | 108 | 108 | 108 | 108 |
| `posts_word[রক্তদান]` | 112 | 112 | 112 | 165 | 112 |
| `posts_word[শীতবস্ত্র]` | 50 | 50 | 50 | 106 | 50 |
| `posts_word[শ্রমিক]` | 58 | 58 | 58 | 58 | 58 |

## (b) Partial matching — prefixes/fragments of a word, incl. the 1-character edge

Expected: `ft_bool_wild` count == `LIKE` count for fragments that are
word-prefixes (`রক্তদা` 282 = 282, `শীতব` 50 = 50, `বৃত্ত` 142 = 142,
`মোহা` 37 = 37). `ft_nl` and `ft_bool` (exact words) are expected to
return **0** — the default parser cannot match a fragment without the
wildcard. `tokens_ft` matches a fragment only if it is a precomputed
prefix token of length >= 3 (`রক্তদা` 332, `শীতব` 106, `বৃত্ত` 142,
`মোহা` 37); 2-character fragments return **0** through tokens
(`রক` 0 — the 2-character prefix tokens exist in the column but are
below `innodb_ft_min_token_size` = 3 and are not indexed).

`রক` is the case that separates prefix matching from substring
matching: `LIKE '%রক%'` = 704, `রক*` = 332. The 372-row difference is
rows whose only `রক` is MID-word — e.g. `প্রকাশ` (very common: "ফলাফল
প্রকাশ", "প্রতিবেদন প্রকাশ") and `পরিবারকে` — verified by listing the
rows. For a search box, the wildcard's 332 is the better answer: a user
typing `রক` wants `রক্তদান`, not `প্রকাশ`. 1-character input `র`:
NL/bool/tokens return 0; `র*` returns 332 (same 332 rows — in this
dataset every word starting with `র` in posts starts with `রক`;
verified: `রহ*` = 0, `রা*` = 0 in posts); LIKE returns all 1800 rows.
The application must require ≥ 2 characters per term and route
2-character terms to the wildcard path, never to tokens or NL.

| Case | ft_nl | ft_bool | ft_bool_wild | tokens_ft | LIKE %term% |
|---|---|---|---|---|---|
| `persons[মোহা]` | 0 | 0 | 37 | 37 | 37 |
| `posts_partial[বৃত্ত]` | 0 | 0 | 142 | 142 | 142 |
| `posts_partial[র] (1-char edge)` | 0 | 0 | 332 | 0 | 1800 |
| `posts_partial[রক]` | 0 | 0 | 332 | 0 | 704 |
| `posts_partial[রক্তদা]` | 0 | 0 | 282 | 332 | 282 |
| `posts_partial[শীতব]` | 0 | 0 | 50 | 106 | 50 |

Note `tokens_ft` for `রক্তদা` (332) and `শীতব` (106) is HIGHER than
LIKE: the tokens column also matches the spaced spellings (`রক্ত দান`,
`শীত বস্ত্র`) through the de-spaced join token. Same union as §(a).

## (c) Prefix matching — true prefix / autocomplete

Expected: `LIKE 'term%'` (B-tree) returns only rows whose field STARTS
with the term. `ft_bool_wild` with `term*` and `tokens_ft` with `term`
both return MORE (any word starting with the term, anywhere in the
field): `শিক্ষা*` / tokens `শিক্ষা` = 792 rows vs 60 for true prefix.
That difference is the finding, not a failure of the runner. Do not
implement autocomplete with `term*` or with the tokens column — use
`LIKE 'term%'` on the B-tree index (0.16–0.17 ms, exact).

| Case | ft_bool_wild | tokens_ft | LIKE prefix |
|---|---|---|---|
| `persons_prefix[মোহাম্মদ] (LIKE 'term%')` | 37 | 37 | 37 |
| `posts_prefix[শিক্ষা] (LIKE 'term%')` | 792 | 792 | 60 |

## (d) Spelling variations — the same word spelled differently

Expected: each spelling returns ONLY its own rows under every approach
(no approach tolerates spelling variants). `tokens_ft` unifies the
compound and spaced forms only: `রক্ত দান` → 165 (53 spaced + 112
compound) and `শীত বস্ত্র` → 106 (56 + 50). The genuine spelling
variants (`সাতানিপাড়া` 928 vs `শাতানিপাড়া` 54 vs `সাতানীপাড়া` 54;
`মাদ্রাসা` 38 vs `মাদরাসা` 51) stay disjoint under every approach.
Mitigation is application-side (a curated variant map emitted as extra
tokens), not a different index — see 16-MARIADB-ADDENDUM.md §3.4.

| Case | ft_nl | ft_bool | ft_bool_wild | tokens_ft | LIKE %term% |
|---|---|---|---|---|---|
| `posts_spelling[মাদরাসা]` | 38 | 38 | 38 | 38 | 38 |
| `posts_spelling[মাদরাসা]` | 51 | 51 | 51 | 51 | 51 |
| `posts_spelling[রক্ত দান]` | 53 | 53 | 53 | 165 | 53 |
| `posts_spelling[শাতানিপাড়া]` | 54 | 54 | 54 | 54 | 54 |
| `posts_spelling[শীত বস্ত্র]` | 56 | 56 | 56 | 106 | 56 |
| `posts_spelling[সাতানিপাড়া]` | 928 | 928 | 928 | 928 | 928 |
| `posts_spelling[সাতানীপাড়া]` | 54 | 54 | 54 | 54 | 54 |

## (e) Bengali + English mixed queries

Expected: `ft_bool` here uses `+` (AND) semantics, so its count is the
AND-of-LIKE count, NOT the Phase 0.1 boolean count — Phase 0.1's
`ngram_bool` for mixed queries used plain terms (OR semantics, 287 for
`SSC বৃত্তি`). On MariaDB: `SSC বৃত্তি` — NL (OR) = 287, `+SSC +বৃত্তি`
= 9, AND-of-LIKE = 9 (verified separately), LIKE-literal = 0. The 9 is
the correct AND answer (only 9 rows contain both `SSC` and `বৃত্তি`;
`SSC` alone matches 154 rows). `tokens_ft` agrees (9). The `the` case
is INCONCLUSIVE: no row contains the word `the`, so it establishes
nothing about stopwords — but the probe DOES establish the stopword
behaviour: `the` and `about` return 0 rows in BOTH modes (see §Notes).

| Case | ft_nl | ft_bool (+AND) | ft_bool_wild | tokens_ft | LIKE %term% (literal) |
|---|---|---|---|---|---|
| `posts_mixed[Blood Donation]` | 215 | 215 | 215 | 215 | 215 |
| `posts_mixed[SSC বৃত্তি]` | 287 | 9 | 9 | 9 | 0 |
| `posts_mixed[Scholarship]` | 154 | 154 | 154 | 154 | 154 |
| `posts_mixed[the]` | 0 | 0 | 0 | 0 | 0 |

## (f) Relevance sorting — multi-word queries, top-5 + precision

Expected: `ft_bool` / `ft_bool_wild` / `tokens_ft` counts == AND-of-LIKE
count (112 / 50). `ft_nl` is OR-ish: `শীতবস্ত্র বিতরণ` NL = 106 vs
AND 50 — NL must NOT be used for multi-word queries. (`রক্তদান শিবির`
NL = 112 only because, in this dataset, every row containing either
word contains both.) Top-5 relevance samples are in
`raw_results.json` (`top_results`): ft_nl and ft_bool_wild return the
same top-5 ids with the same scores (1.9055 / 2.7592); tokens_ft returns
the same ids with lower scores (1.6053 / 2.0000). **Caution on those
scores:** a direct re-query of the same data after the run returned
1.3213 for `রক্তদান শিবির` (all 112 rows tied) instead of 1.9055, and
a different top-5 id set — the score drifted as the background FTS
optimisation settled (see README.md). Do not treat the filed
scores as stable; within a match set all rows tie, so MATCH relevance
does not rank. NL top-20 precision
for `রক্তদান` is **20/20 genuine** (vs 8/20 for MySQL ngram NL in
Phase 0.1) — MariaDB NL ranks whole-word matches correctly.

| Case | ft_nl | ft_bool | ft_bool_wild | tokens_ft | LIKE %term% (AND) |
|---|---|---|---|---|---|
| `posts_relevance[রক্তদান শিবির]` | 112 | 112 | 112 | 112 | 112 |
| `posts_relevance[শীতবস্ত্র বিতরণ]` | 106 | 50 | 50 | 50 | 50 |

## Notes on individual cases

- `persons[শিক্ষক]`: profession, not a name. The benchmark `persons`
  FULLTEXT index covers only `(name_bn, name_en)`, so every approach
  correctly returns **0** — including NL (MariaDB NL is precise; the
  MySQL ngram NL value of 175 was bigram noise). This is a test-design
  note, not an engine failure: the production `persons` index must also
  cover `profession_bn` / `area_bn` (Doc 06 §3.2).
- `posts_mixed[SSC বৃত্তি]`: `ft_bool` 9 vs Phase 0.1 `ngram_bool` 287
  is a query-form difference (AND vs OR), not an engine difference —
  see §(e). Compare boolean against AND-of-LIKE (9), not literal LIKE.
- `posts_relevance[শীতবস্ত্র বিতরণ]`: NL 106 vs AND 50 — NL treats the
  two terms as an OR-ish union; boolean (50) is the exact figure.
- `posts_partial[র] (1-char edge)`: NL/bool/tokens 0, `র*` 332, LIKE
  1800 — no approach handles 1-character input usefully; see §(b).
- `posts_mixed[the]`: inconclusive (no row contains `the`). Retained
  so a future run on real data can replace it with a genuine stopword
  test; do not cite it as a stopword finding. The stopword finding
  comes from the probe instead: `the` and `about` return 0 rows in
  BOTH natural-language and boolean mode on InnoDB — the MariaDB KB
  line "stopwords … do not reflect in the search results unless IN
  BOOLEAN MODE is used" does NOT hold for InnoDB (it is MyISAM
  behaviour). A query of `+the +quick` returns 0 rows even though
  `quick` is indexed: a `+` on a stopword kills the whole query.
  The application must strip English stopwords (the 36-word default
  list) from `+`-terms before querying, or those searches silently
  return nothing.
- `posts_partial[রক]`: wildcard 332 vs LIKE 704 — prefix vs substring,
  see §(b). The 372-row gap is `প্রকাশ` / `পরিবারকে` rows.
- `posts_word[রক্তদান]` / `posts_spelling[রক্ত দান]` tokens 165:
  the tokens column deliberately unifies compound and spaced forms.
  If the product wants literal semantics, tokens is the wrong
  approach for single-word queries; if it wants "user means the same
  thing", 165 is the right answer. Decide explicitly — see 16-MARIADB-ADDENDUM.md §3.4.
