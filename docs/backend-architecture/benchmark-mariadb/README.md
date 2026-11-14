# Bengali search benchmark — reproducibility package (MariaDB rebuild)

Satanipara Community backend blueprint, `docs/backend-architecture/benchmark/`
(MariaDB rebuild of the Phase 0.1 MySQL package). The scripts in this
directory re-run the Bengali full-text benchmark against a local
MariaDB server — and, crucially, re-measure it on the production
MariaDB 11.8.9.

## What this is

A benchmark of Bengali search approaches on **MariaDB 11.8.9**, on a
**synthetic** dataset (no real organisation data — every name, notice
and activity is generated; see `generate_dataset.py`). It compares, for
the same queries:

| Approach | SQL pattern |
|---|---|
| `ft_nl` | `FULLTEXT (cols)` default parser, `NATURAL LANGUAGE MODE` |
| `ft_bool` | Same index, `BOOLEAN MODE`, exact words (`+a +b` for AND) |
| `ft_bool_wild` | Same index, `BOOLEAN MODE`, wildcard (`term*` / `+a* +b*`) |
| `tokens_ft` | `FULLTEXT (search_tokens)` over a precomputed token column (see `tokenize.py`), `BOOLEAN MODE`, plain terms |
| `like_pct` | `title_bn LIKE '%term%' OR body_bn LIKE '%term%'` (full scan) |
| `like_prefix` | `name_bn LIKE 'term%'` / `title_bn LIKE 'term%'` (B-tree index) |
| `app_level` | Python substring scan over all rows (one-time load, then per-query) |

There is NO ngram approach on MariaDB. MariaDB has no ngram parser:
`SHOW PLUGINS` lists no ngram plugin, and
`FULLTEXT (cols) WITH PARSER ngram` is a syntax error. The Phase 0.1
recommendation (ngram FULLTEXT + BOOLEAN MODE) therefore does not
transfer at all — this package is the from-scratch rebuild.

Test cases: **35 cases, 171 timed queries, 171 count pairs** — see
`queries.md` for the full list with measured counts and
expected-behaviour notes. (Phase 0.1 measured 35 cases / 133 timed
queries; this rebuild has 171 because each case is measured under both
boolean forms plus the tokens column.)

## Results summary — accurately labelled: MariaDB 11.8.9, run 3

All numbers below were measured on **11.8.9-MariaDB** (official generic
Linux binary tarball, user-space install, port 3307, socket) on
2026-11-14, on the synthetic 3,900-row dataset (`posts` 1,800;
`persons` 1,500; `activities` 600; generator seed 20261114,
`seed.sql` md5 `b2164ed52f58e36d3954a42cebacad40` — byte-identical to the
Phase 0.1 dataset). Server config for the run:
`innodb_ft_min_token_size` 3, `ft_min_word_len` 4, stopwords enabled
(36-word default list), `innodb_buffer_pool_size` 64 MB (small test
config — timings are for relative comparison only, not production
latency promises). **No number in this package was measured on any
other server.** Do not relabel them.

- **Recommendation (see 16-MARIADB-ADDENDUM.md §3.4 for the recorded decision):
  default-parser FULLTEXT + BOOLEAN MODE with `term*` wildcards as
  the primary search** (`+w1* +w2*` for multi-word). Wildcard counts
  matched `LIKE '%term%'` exactly for every word-prefix fragment
  (`রক্তদা` 282 = 282, `শীতব` 50 = 50, `বৃত্ত` 142 = 142,
  `মোহা` 37 = 37) and for every whole word (112 = 112, 142 = 142,
  37 = 37). It is also MORE precise than LIKE for short fragments:
  `রক*` returns 332 rows vs LIKE's 704 — the 372-row gap is rows
  whose only `রক` is mid-word (`প্রকাশ`, `পরিবারকে`), which a user
  typing `রক` does not want.
- **NATURAL LANGUAGE MODE is precise for single whole words on
  MariaDB** (`রক্তদান` 112 = 112; NL top-20 precision 20/20 genuine,
  vs 8/20 for MySQL ngram NL) — the ngram NL disaster does not exist
  here. **But NL must still NOT be the default for multi-word
  queries**: it is OR-ish (`শীতবস্ত্র বিতরণ` NL 106 vs AND 50).
  Use NL only for single-word queries, or not at all.
- **Exact-word boolean (`+term`, no wildcard)** is exact for whole
  words (112 = 112) and returns **0 for any partial word** — it is
  the correct form only when the application knows the input is a
  complete word. It must not be the as-you-type path.
- **The tokens column (`search_tokens` + FULLTEXT) is the only
  approach that unifies compound and spaced spellings** (`রক্তদান`
  165 = 112 compound + 53 spaced `রক্ত দান`; `শীতবস্ত্র` 106 = 50 +
  56). It matches partials of length >= 3 (`রক্তদা` 332,
  `শীতব` 106) but returns **0 for 2-character fragments** (`রক` 0 —
  2-char prefix tokens are below `innodb_ft_min_token_size` = 3 and
  are not indexed). Its price is storage: the tokens text averages
  7,068 bytes/row on posts (vs 882 bytes of title+body text), the
  tokens FT index is 4.52 MB on posts vs 0.66 MB for the main FT
  index, and the tokens column must be maintained by the application
  on every write. Verdict: adopt tokens ONLY if the
  compound-vs-spaced unification is wanted; the wildcard path already
  covers partial matching without it. See 16-MARIADB-ADDENDUM.md §3.4 (tokens column: conditional, Awaiting Organisation).
- **`LIKE '%term%'`** is correct for whole words but a full table
  scan (`EXPLAIN: type=ALL`); at 3,900 rows it measures 0.09–6.15 ms
  (the slowest LIKEs are the no-match ones, which cannot short-circuit
  on `LIMIT 20`). It is also the only approach that does mid-word
  substring matching — which is a bug, not a feature, for prefix
  search (see `রক` above).
- **Prefix/autocomplete = `LIKE 'term%'` on a B-tree index**
  (0.16–0.17 ms, exact: `শিক্ষা` 60 rows). Never `term*` in boolean
  mode and never the tokens column for autocomplete: both return 792
  rows for `শিক্ষা` (any word starting with it, anywhere in the field).
- **Spelling variants are NOT tolerated by any approach**
  (`সাতানিপাড়া` 928 vs `শাতানিপাড়া` 54 vs `সাতানীপাড়া` 54 — three
  disjoint result sets; `মাদ্রাসা` 38 vs `মাদরাসা` 51). Mitigation is
  application-side (a curated variant map emitted as extra tokens),
  not a different index.
- **Stopwords bite in boolean mode too.** The MariaDB KB says
  stopwords "do not reflect in the search results unless IN BOOLEAN
  MODE is used" — on InnoDB 11.8.9 that is wrong: `the` and `about`
  return 0 rows in BOTH modes, and `+the +quick` returns 0 rows even
  though `quick` is indexed. The application must strip the 36-word
  English stopword list from `+`-terms (or a search for an English
  stopword silently returns nothing).
- **1–2 character queries need explicit routing.** 1-char: NL/bool/
  tokens 0 rows, `র*` 332, LIKE 1800 — none of them useful. 2-char:
  only the wildcard path works (`রক*` 332); tokens returns 0.
  Require ≥ 2 characters per term; route 2-char terms to `term*`.
- **Timings at this scale** (median of 3 runs, server-side
  SHOW PROFILES): FT approaches 0.11–3.17 ms, LIKE 0.09–6.15 ms,
  LIKE-prefix 0.16–0.17 ms, app-level 0.27–0.96 ms per query after a
  17–29 ms load. The slowest FT queries are the common-term ones
  (`সাতানিপাড়া*` 3.17 ms, 928 rows). Everything is fast in absolute
  terms at 3,900 rows; the differences are about scaling behaviour
  and correctness, not latency.
- **Index cost is NOT what INFORMATION_SCHEMA says.** `INDEX_LENGTH`
  for posts stayed 262,144 bytes after adding two FULLTEXT indexes —
  InnoDB FT data lives in hidden auxiliary tables (`FTS_*_INDEX_*.ibd`
  files), which `INDEX_LENGTH` excludes. Measured from the datadir
  filesystem: posts FT total 5.51 MB (main 0.66 MB + tokens 4.52 MB +
  0.33 MB aux tables) against 1.59 MB of text; persons 3.19 MB
  (main 0.44 MB + tokens 2.42 MB); activities 1.74 MB (main 0.48 MB +
  tokens 0.93 MB). The tokens column itself adds 24.6 MB of table
  data on posts (12.7 MB of token text). Phase 0.1's "index cost is
  small" claim, which used `INDEX_LENGTH`, understated the true FT
  cost on both servers — this package measures it properly.
- **Pagination verified consistent** (`সাতানিপাড়া`, NL and
  boolean-wildcard, `LIMIT 10 OFFSET 0/10/20`, zero overlap, total
  928 in both modes — not 1,800 as ngram NL gave on MySQL).
- **Insert maintenance is small for multi-row writes:** 100-row
  multi-row INSERT 35.9 ms (main FT only) / 47.8 ms (with tokens).
  Single-statement writes on this VM cost ~30 ms each in autocommit
  (measured: 100 changing UPDATEs 3,250 ms autocommit vs 219 ms in
  one transaction) — that is a property of this VM's fsync latency,
  not of the indexes; it is also why the seed load (~73 s) and the
  tokens backfill (~80 s for 3,900 single-row UPDATEs) took so long
  here. Production backfills must be batched / transactional.
- **Known dataset/index limit:** the benchmark `persons` FULLTEXT
  index covers names only, so `শিক্ষক` (a profession) returns 0 under
  every approach (MariaDB NL included — 0, not the MySQL ngram NL
  175). The production index must also cover `profession_bn` /
  `area_bn` (Doc 06 §3.2).

Full measured results: `raw_results.json` / `raw_results.md` in this
directory. The recommendation, rejected approaches, and re-test checklist
are recorded in `../16-MARIADB-ADDENDUM.md` §3.4 (the worker findings
paper behind this package is not published in the repo).

## MariaDB 10.11 vs 11.8 — no version gap in this work

The benchmark ran on **11.8.9, the exact production version** — there
is no 10.11-vs-11.8 gap to account for. (The apt fallback to 10.11 was
not needed: the official 11.8.9 generic tarball downloaded and ran
user-space.) For the record, the findings that would also hold on
10.11: default-parser FULLTEXT, boolean `*`, `innodb_ft_min_token_size`
= 3 and the 36-word stopword list are all long-standing MariaDB
behaviour, unchanged between 10.11 and 11.8. What was verified to be
11.8.9-specific: `utf8mb4_0900_ai_ci` exists as a collation (ID 255)
and a table created with it stores Bengali correctly — do not assume
that on 10.11 (its `utf8mb4` default is `utf8mb4_uca1400_ai_ci`).

## Files in this package

| File | What it is |
|---|---|
| `README.md` | This file. |
| `generate_dataset.py` | Synthetic dataset generator (deterministic, seed 20261114 by default; 1,800 posts + 1,500 persons + 600 activities = 3,900 rows). Writes `seed.sql` **on demand** — generated datasets stay OUT of the repo. Byte-identical output to the Phase 0.1 generator (`seed.sql` md5 `b2164ed52f58e36d3954a42cebacad40`). |
| `schema.sql` | Benchmark schema (MariaDB 11.8.9; InnoDB + `utf8mb4` / `utf8mb4_0900_ai_ci` — verified present on 11.8.9). Creates the scratch database `bench`. Indexes are created by the runner in stages. |
| `tokenize.py` | The application-level tokeniser for the `tokens_ft` approach (word + prefixes ≥ 2 chars + de-spaced adjacent joins). Standalone-runnable for a demo. |
| `queries.md` | The 35 test cases with measured MariaDB 11.8.9 counts and expected-behaviour notes. |
| `run_benchmark.py` | The runner. Loads schema + seed, builds indexes in stages, counts matches per case/approach (171 count pairs), runs each of the 171 timed queries 3× (median, server-side `SHOW PROFILES`), records top-5 relevance samples, EXPLAIN plans, app-level timings, pagination consistency, insert maintenance, tokenisation evidence, and true FTS index sizes. |
| `RUN-ON-PRODUCTION.md` | Step-by-step instructions for re-running this exact package on the production MariaDB 11.8.9 (Hostinger) instance. |
| `raw_results.json` / `raw_results.md` | Measured results of run 3 (2026-11-14, MariaDB 11.8.9). Regenerated by running the benchmark; do not hand-edit. |
| `count_debug.sql`, `tokens.sql` | Intermediate artefacts regenerated by the runner (count queries; the 3,900 token-populate UPDATEs). |

## How the run was obtained (so it can be reproduced)

Path (a) from the task — official MariaDB 11.8 generic binary tarball,
user-space, no root, no apt, no Docker:

```sh
# download (427 MB)
curl -L -o mariadb-11.8.9-linux-systemd-x86_64.tar.gz \
  https://archive.mariadb.org/mariadb-11.8.9/bintar-linux-systemd-x86_64/mariadb-11.8.9-linux-systemd-x86_64.tar.gz
# sha256: 32f8871a2aa38b36aa418b7f4abc6fc0c6ef1ba5a45798cacb2afa52c8a6113b
tar xzf mariadb-11.8.9-linux-systemd-x86_64.tar.gz -C mariadb-11.8 --strip-components=1
./mariadb-11.8/scripts/mariadb-install-db --defaults-file=$PWD/my.cnf \
  --basedir=$PWD/mariadb-11.8 --datadir=$PWD/data \
  --auth-root-authentication-method=normal --skip-test-db
setsid nohup ./mariadb-11.8/bin/mariadbd-safe --defaults-file=$PWD/my.cnf \
  > run/mariadbd-safe.log 2>&1 < /dev/null &
./mariadb-11.8/bin/mariadb -S $PWD/run/mariadb.sock -u root -e "SELECT VERSION();"
# 11.8.9-MariaDB
```

Server config (`my.cnf`, in the work area, not in this package):
port 3307 (the MySQL 8.0.46 server on this VM owns 3306 — the benchmark
must never be pointed at 3306), socket under `run/`, datadir under
`data/`, `user=root`, `innodb_buffer_pool_size=64M`,
`innodb_ft_min_token_size=3`, `ft_min_word_len=4`,
`character-set-server=utf8mb4`, `collation-server=utf8mb4_unicode_ci`.
Two gotchas found while setting it up, recorded so the next person
does not re-discover them: (1) `mariadbd-safe` defaults to
`user=mysql` and fails to write its error log into a root-owned
directory — set `user=root` in `[mysqld]`; (2) a server started from a
shell that later exits can receive a clean shutdown ("initiated by:
unknown") — start it detached with `setsid nohup … &` (that is what
survived; the first start died exactly when its parent exec session
ended).

## Runner quirks found during the runs (documented, not hidden)

- Run 1 (2026-11-14 13:45): environment + probe sections were empty
  (the runner connected to the not-yet-created `bench` database) and 2
  of 171 timings were missing (two cases share one identical SQL
  string; SHOW PROFILES cannot tell them apart). Counts and all other
  sections were valid. Fixed, re-ran.
- Run 2 (13:52): all counts/probe/FTS sizes correct, but 0/171
  timings captured — the fix (a trailing `/* label */` comment per
  query) does not work because **MariaDB strips `/* */` comments from
  the text SHOW PROFILES reports**. Fixed by measuring each distinct
  SQL once and assigning its duration to every label sharing it.
- Run 3 (13:56–14:00): **the filed run — 35 cases, 171 count pairs, 171/171
  timings in all 3 reps.** Two runner bugs from run 1/2 remain visible
  in the runner's own history (see `git log` in the work area, not the
  repo) and in this section; the filed numbers are all from run 3.
- The tokeniser had its own bug, caught by the run-1 numbers: an
  early version stripped trailing combining marks from prefixes,
  which deleted the token `রক্তদা` (the exact text typed after 6
  keystrokes of `রক্তদান`) and made `tokens_ft` return 0 for it. A
  probe proved MariaDB indexes tokens ending in hasant (`রক্`) and
  vowel signs (`রক্তদা`, `শিক্ষা`) — the stripping was removed and
  run 3 measures the fixed tokeniser (`রক্তদা` tokens = 332).
