# RUN-ON-PRODUCTION.md — running the Bengali search benchmark on the production MariaDB 11.8.9

Step-by-step instructions for running the whole package against the
production MariaDB 11.8.9 instance (Hostinger shared hosting,
satanipara.asf.run) and recording the results. Read `README.md` first
for what the benchmark is and what the local 11.8.9 run says.

> **Do not relabel local numbers as production numbers.** The
> production run produces its own `raw_results.json` /
> `raw_results.md`; keep them labelled with the measured version and
> the host, and file them separately from the local summary in
> `README.md`. The local run and the production run are on the SAME
> server version (11.8.9) — the re-run is still required, because
> production differs in config (buffer pool, `innodb_ft_min_token_size`
> if the host changed it, stopword table, collation defaults) and in
> data volume.

## 0. Prerequisites

- Access to the production MariaDB **11.8.9** server with a user that
  may `CREATE`/`DROP` a scratch database. **Never run this against the
  application database or any database holding real data**:
  `schema.sql` runs `DROP DATABASE IF EXISTS bench`.
- The `mariadb` (or `mysql`) command-line client on the machine running
  the benchmark, with a user able to `CREATE`/`DROP` a database.
  If the client is the MariaDB one, `MDB_CLIENT=mariadb`; if only the
  MySQL client is installed it also works as a client (`MDB_CLIENT=mysql`).
- Python 3 (no third-party packages needed — the runner drives the
  client CLI via `subprocess`; there is no Python MySQL driver
  dependency). `tokenize.py` uses only the standard library.
- A UTF-8-capable shell. The runner already passes
  `--default-character-set=utf8mb4`; any **manual** client use must add
  it (or run `SET NAMES utf8mb4`), or Bengali query terms silently
  return 0 rows (UTF-8 bytes read as latin1 → mojibake term → no
  match).
- About 10 minutes and ~100 MB free on the runner machine
  (generated `seed.sql` ~1.8 MB; outputs ~60 KB; the tokens backfill
  is the slow part — see §4).
- **Hostinger shared-hosting limits that affect this run:** no
  `INSTALL PLUGIN` (so no Mroonga — see 16-MARIADB-ADDENDUM.md §3.4), no server
  config changes (`innodb_ft_min_token_size` cannot be lowered from
  3, the stopword list cannot be changed), no `SUPER` for
  `SET GLOBAL innodb_ft_aux_table` (the tokenisation-evidence section
  will fail gracefully — the runner does not abort on it; record the
  gap). If any step needs a privilege the hosting user lacks, stop
  and record it as PENDING rather than working around it.

## 1. Confirm the production version first

```sh
mariadb -u <user> -p -h <host> -e "SELECT VERSION();"
# expect: 11.8.9-MariaDB. If it says anything else, STOP — you are on
# the wrong server, and the numbers you record would not be 11.8.9 numbers.
mariadb -u <user> -p -h <host> -e "SHOW VARIABLES LIKE 'innodb_ft_min_token_size'; \
  SHOW VARIABLES LIKE 'ft_min_word_len'; \
  SHOW VARIABLES LIKE 'innodb_ft_enable_stopword'; \
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.INNODB_FT_DEFAULT_STOPWORD;"
# expect: min_token 3, ft_min_word_len 4, stopword ON, 36 rows.
# If min_token is not 3, the 2-character behaviour in queries.md
# changes — record the actual value and re-read README.md (true index cost).
```

Also confirm the default collation the host uses, for the record:

```sh
mariadb -u <user> -p -h <host> -e "SELECT @@character_set_server, @@collation_server;"
# The benchmark schema sets utf8mb4 / utf8mb4_0900_ai_ci explicitly,
# so the server default does not change the benchmark — but the
# APPLICATION's tables will use the server default unless their
# migrations set a collation, so write the value down.
```

## 2. Get the package

```sh
git clone https://github.com/mefahim/satanipara-community.git   # or update your checkout
cd satanipara-community/docs/backend-architecture/benchmark
ls   # README.md  generate_dataset.py  schema.sql  queries.md
     # run_benchmark.py  tokenize.py  RUN-ON-PRODUCTION.md
```

## 3. Generate the dataset (on demand — never committed)

```sh
python3 generate_dataset.py
# seed.sql written: posts=1800 persons=1500 activities=600 total=3900
```

Verify determinism (optional but cheap): run it a second time and
compare — the file must be byte-identical (md5
`b2164ed52f58e36d3954a42cebacad40` at the defaults):

```sh
md5sum seed.sql
python3 generate_dataset.py
md5sum seed.sql
grep -c '^INSERT' seed.sql   # expect 3900 (1800 posts + 1500 persons + 600 activities)
```

`seed.sql` is generated on demand and stays OUT of the repo.

## 4. Run the benchmark

Set the connection (password via environment, never on the command
line), and point the outputs somewhere labelled production:

```sh
export MDB_CLIENT=mariadb MDB_HOST=<production-host> MDB_PORT=3306
export MDB_USER=<user> MDB_PASSWORD=<password> MDB_DATABASE=bench
mkdir -p /tmp/bench-prod-11.8.9
cd /tmp/bench-prod-11.8.9
cp <package-dir>/generate_dataset.py <package-dir>/schema.sql \
   <package-dir>/tokenize.py <package-dir>/run_benchmark.py .
python3 generate_dataset.py
python3 -u run_benchmark.py > benchmark-prod.log 2>&1
# note: MDB_DATADIR is NOT set on shared hosting (no datadir access),
# so the true-FTS-size section will record "unavailable" — that is
# expected; INFORMATION_SCHEMA INDEX_LENGTH is not a substitute.
```

What it does (same methodology as the local run): loads `schema.sql` +
`seed.sql` (dropping/recreating `bench`), builds the default-parser
FULLTEXT and B-tree indexes in stages, builds the `search_tokens`
column and its FULLTEXT index, counts matches per case/approach (171
count pairs), runs each of the 171 timed queries 3× in separate
sessions (median reported, server-side `SHOW PROFILES`), records
top-5 relevance samples, EXPLAIN plans, app-level full-scan timings,
pagination consistency, and a 100-row insert-maintenance check.

Runtime on the local VM was ~3 minutes, dominated by the seed load
and the tokens backfill (3,900 single-row UPDATEs, ~80 s on the local
VM — each autocommit statement costs a fsync; on shared hosting this
may be faster or slower, it is not a pass criterion). Allow 10 minutes.

Expected console tail:

```
== 3. counting matches per case/approach ==
  counted 172 case/approach pairs
== 4. timed runs (3 reps, SHOW PROFILES) ==
  171 timed queries per rep
  rep 1: 171/171 durations captured
  rep 2: 171/171 durations captured
  rep 3: 171/171 durations captured
...
wrote raw_results.json
wrote raw_results.md
```

("172 case/approach pairs" in the console count includes the `rows`
row-count line; the case pairs are 171.)

If the run fails, check: wrong host/port/password; a server that is
not up; a locale/charset issue (see §0); a pre-existing `bench`
database owned by another user (drop it first, or pass
`MDB_DATABASE=<other-scratch-name>` — the runner rewrites nothing
else; `schema.sql` still drops that database); or a missing privilege
(`SET GLOBAL innodb_ft_aux_table` needs SUPER — see §0; the runner
keeps going, but the tokenisation-evidence section will be empty).

## 5. Interpret the results

Open `raw_results.md`. Check in this order:

1. **Header / `raw_results.json` → `environment`:** confirm
   `version` is `11.8.9-MariaDB` and `seed_md5` is
   `b2164ed52f58e36d3954a42cebacad40`. If it is not 11.8.9, the run is
   not a production 11.8.9 run — do not file it as one.
2. **Counts (the pass criteria):** for every case in `queries.md`,
   the counts must match the local 11.8.9 reference counts EXACTLY
   (same seed, same data, same version). Any count difference between
   the local run and the production run for the same case is a real
   finding — most likely a config difference (`innodb_ft_min_token_size`,
   stopword table) — record it, find the config cause, do not edit the
   data to match. In particular:
   - `ft_bool_wild` count must equal the `LIKE` count for every
     word-prefix case (`রক্তদা` 282, `শীতব` 50, `বৃত্ত` 142,
     `মোহা` 37) and every whole-word case.
   - `tokens_ft` for `রক্তদা` must be 332 and for `রক` must be 0
     (2-char tokens unindexed at min_token 3).
   - `ft_nl` for `শীতবস্ত্র বিতরণ` must be 106 (OR union) vs
     boolean 50 — if NL suddenly returns 50, something changed.
   - `persons[শিক্ষক]`: 0 under every approach.
   - `posts_mixed[SSC বৃত্তি]`: NL 287, boolean (+AND) 9, LIKE-literal 0.
   - `posts_mixed[the]`: 0 everywhere — inconclusive, not a finding.
3. **Timings:** compare medians with the local summary in `README.md`
   **as orders of magnitude, not exact milliseconds**. A timing shift
   of <2× is noise at this scale (and shared-hosting neighbours add
   variance). A systematic shift (e.g. boolean mode 10× slower, or a
   query that was 0.3 ms locally taking 100 ms) is a finding — record
   it and re-run to confirm before claiming it.
4. **Pagination:** `overlap_between_pages` must be `[]` and
   `total_matching` 928 for both the NL and the boolean-wildcard
   `সাতানিপাড়া` probes.
5. **EXPLAIN:** FT queries must show `type=fulltext`;
   `LIKE '%term%'` must show `type=ALL`; `LIKE 'term%'` must show
   `type=range` on the B-tree index.
6. **Probe section:** `probe` counts in `raw_results.json` must match
   the local ones (whole-word 2, `রক্তদা*` 2, `রক*` 3, exact `রক` 0,
   stopwords 0 in both modes, `+the +quick` 0, phrase 2). If the
   probe differs, the server's parser/stopword config differs — that
   is the first place to look for any count difference in §5.2.

## 6. What to record (and where)

File the production run as a dated, version- and host-labelled
artefact — do not overwrite the local summary in `README.md` in place.
Record:

- Server version string (`SELECT VERSION()`), `innodb_ft_min_token_size`,
  `ft_min_word_len`, stopword enabled + row count, server character
  set / collation defaults, host type (Hostinger shared), date, and
  who ran it.
- `raw_results.json` + `raw_results.md` (keep the pair together;
  the JSON is the machine-readable record) + `benchmark-prod.log`.
- A short note answering, for the production run: (a) did every
  `ft_bool_wild` count equal its `LIKE` count for word-prefix cases?
  (b) did NL still over-match multi-word queries (106 vs 50)?
  (c) did any count differ from the local 11.8.9 reference counts in
  `queries.md`, and if so which case and what config explains it?
  (d) timing order-of-magnitude vs local? (e) pagination overlap?
  (f) did the tokenisation-evidence section run (SUPER available?)
  or is it PENDING?
- Then update the blueprint pointers: Doc 15 §9 (add the production
  run to the re-test checklist as done, with the measured version and
  a link to the filed results), ADR-010 (same), and Doc 13 Q-13
  (re-test on production MariaDB 11.8.9: done / still open for the
  real-data snapshot).

Until step 6 is done, the production numbers are **unfiled** — the
blueprint still correctly says "measured locally on 11.8.9, production
re-test pending".

## 7. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `mariadb: command not found` | Install the MariaDB/MySQL client on the runner machine. |
| `Access denied for user ...` | Wrong password or user; check `MDB_PASSWORD` / the hosting panel. Do not paste the password into chat or the repo. |
| `Can't connect to MariaDB server` | Server not running, wrong host/port, or the hosting firewall. Start it / fix `MDB_HOST` / `MDB_PORT`. |
| Bengali queries return 0 rows everywhere | Charset trap (see §0): the runner already passes `--default-character-set=utf8mb4`; if you ran SQL manually, add it or `SET NAMES utf8mb4`. |
| `DROP DATABASE` permission error | The hosting user lacks DROP/CREATE; use a DBA-created empty database (then pass `MDB_DATABASE=<name>` — but note `schema.sql` still drops it). |
| `SHOW PROFILES` durations missing for some queries | Profiling history caps at 100 per session; the runner already chunks at 80 unique SQLs. If you edited the runner, keep chunks ≤80 and remember MariaDB strips `/* */` comments from profiled text — do not use comments to disambiguate identical SQLs (see README, run 2). |
| Counts differ from `queries.md` on the same version | Re-check: same seed (default 20261114), same `seed.sql` md5, and that no earlier partial run left extra rows (the runner drops/recreates the DB, so re-run cleanly). If the difference persists on a clean re-run, check `innodb_ft_min_token_size` and the stopword table first — then record it as a finding, do not edit the data to match. |
| Timings much slower than the local run | Check server load and shared-hosting neighbours. Timing alone never fails the benchmark — counts do. |
| `SET GLOBAL innodb_ft_aux_table` fails (SUPER) | Expected on shared hosting. The tokenisation-evidence section will be empty; record it as PENDING, not as a failure. |
| Tokens backfill very slow | Expected: one UPDATE per row in autocommit, each costing a fsync (~30 ms on the local VM). It is a one-off migration cost, not query latency. For the production backfill of REAL data, batch it in transactions (see `../16-MARIADB-ADDENDUM.md` §3.4). |
