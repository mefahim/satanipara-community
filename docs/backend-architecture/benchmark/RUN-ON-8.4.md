# RUN-ON-8.4.md — running the Bengali search benchmark on MySQL 8.4

Step-by-step instructions for running the whole package against a
MySQL 8.4 server and recording the results. Read `README.md` first for
what the benchmark is and what the 8.0.46 results say.

> **Do not relabel 8.0.46 numbers as 8.4.** The 8.4 run produces its
> own `raw_results.json` / `raw_results.md`; keep them labelled with
> the measured version (the runner records it automatically) and file
> them separately from the 8.0.46 summary in `README.md`.

## 0. Prerequisites

- A MySQL **8.4 LTS** server you may drop/recreate a scratch database
  on. **Never run this against production or any database holding real
  data**: `schema.sql` runs `DROP DATABASE IF EXISTS bench`.
- The `mysql` command-line client on the machine running the benchmark
  (same major version as the server, or at least 8.x), with a user able
  to `CREATE`/`DROP` a database (e.g. `root` on a local install).
- Python 3 (no third-party packages needed — the runner drives the
  `mysql` CLI via `subprocess`; there is no Python MySQL driver
  dependency).
- A UTF-8-capable shell. If your shell locale is POSIX/C, pass
  `--default-character-set=utf8mb4` is already baked into the runner's
  `mysql` invocation — but any **manual** `mysql` CLI use must add it
  (or run `SET NAMES utf8mb4`), or Bengali query terms silently
  return 0 rows (UTF-8 bytes read as latin1 → mojibake term → no
  match). This trap is documented in the Phase 0.1 report §1.2.
- About 5 minutes and ~50 MB free (generated `seed.sql` ~1.8 MB;
  outputs ~100 KB).

## 1. Install / confirm MySQL 8.4

Any of these routes is fine; pick the one that matches the machine:

- **Ubuntu 24.04 / Debian:** MySQL 8.4 is available from the official
  MySQL APT repository (dev.mysql.com) — Ubuntu 24.04's own archives
  ship MySQL **8.0.x, not 8.4**, so `apt-get install mysql-server`
  alone gives you 8.0.46 (that is how the Phase 0.1 run ended up on
  8.0). Follow the MySQL APT Repository setup guide to add the 8.4
  repo first, then install `mysql-server`.
- **Docker:** `docker run --name mysql84 -e MYSQL_ROOT_PASSWORD=<pw> -p 3306:3306 -d mysql:8.4` (use a scratch password; this instance holds only synthetic data).
- **Production VPS / staging server:** use the already-provisioned
  8.4 instance; create a scratch database (do not reuse the
  application database).

Confirm the version before proceeding — the number you record must be
the number the server reports:

```sh
mysql -u root -p -e "SELECT VERSION();"
# expect: 8.4.x (e.g. 8.4.6). If it says 8.0.x, you are on the wrong server.
mysql -u root -p -e "SHOW PLUGINS SONAME LIKE '%ngram%'; SELECT @@ngram_token_size;"
# expect: ngram plugin ACTIVE; ngram_token_size 2 (the default — do not change it for the standard run)
```

`ngram_token_size` is a **startup-only** variable (read-only at
runtime). If a run ever needs a different value, set it in the server
config (`my.cnf`, `[mysqld]` section: `ngram_token_size=N`), restart,
and record the value — the standard run uses the default 2.

## 2. Get the package

```sh
git clone https://github.com/mefahim/satanipara-community.git   # or update your checkout
cd satanipara-community/docs/backend-architecture/benchmark
ls   # README.md  generate_dataset.py  schema.sql  queries.md  run_benchmark.py  RUN-ON-8.4.md
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

`seed.sql` is generated on demand and stays OUT of the repo (see
`README.md`).

## 4. Run the benchmark

Set the connection (password via environment, never on the command
line), and point the outputs somewhere labelled 8.4:

```sh
export MYSQL_HOST=localhost MYSQL_PORT=3306 MYSQL_USER=root
export MYSQL_PASSWORD='<your-mysql-password>'   # omit if the account has no password (local root socket auth)
mkdir -p /tmp/bench-8.4
python3 run_benchmark.py --out-dir /tmp/bench-8.4
```

What it does (same methodology as Phase 0.1): loads `schema.sql` +
`seed.sql` (dropping/recreating `bench`), builds the ngram FULLTEXT
and B-tree indexes in stages, counts matches per case/approach (133
count pairs), runs each of the 133 timed queries 3× in separate
sessions (median reported, server-side `SHOW PROFILES`), records
top-5 relevance samples, EXPLAIN plans, app-level full-scan timings,
pagination consistency, and a 100-row insert-maintenance check.
Runtime on the Phase 0.1 VM was ~5 seconds for the runner itself
(plus ~1 s to load the seed); allow a few minutes on slower hardware.

Expected console tail:

```
== 3. counting matches per case/approach ==
  counted 134 case/approach pairs
== 4. timed runs (3 reps, SHOW PROFILES) ==
  133 timed queries per rep
  rep 1: 133/133 durations captured
  rep 2: 133/133 durations captured
  rep 3: 133/133 durations captured
...
wrote /tmp/bench-8.4/raw_results.json
wrote /tmp/bench-8.4/raw_results.md
```

("134 case/approach pairs" in the console count includes the `rows`
row-count line; the case pairs are 133 — see `README.md`.)

If the run fails, check: wrong host/port/password; a server that is
not up; a locale/charset issue (see §0); or a pre-existing `bench`
database owned by another user (drop it first, or pass
`--database <other-scratch-name>` — the runner rewrites the
`USE bench` / `CREATE DATABASE bench` lines for the load).

## 5. Interpret the results

Open `/tmp/bench-8.4/raw_results.md`. Check in this order:

1. **Header / `raw_results.json` → `environment`:** confirm
   `mysql_version` starts with `8.4.` and `ngram_token_size` is 2.
   If it is not 8.4, the run is not an 8.4 run — do not file it as one.
2. **Counts (the pass criteria):** for every case in `queries.md`,
   `ngram_bool` count must equal the `LIKE` count (single-word cases
   and partials), and `default_ft` must equal `LIKE` for whole words
   and be 0 for partials. Compare against the 8.0.46 reference counts
   in `queries.md`: the counts should match exactly (same seed, same
   data) — any count difference between 8.0.46 and 8.4 for the same
   case is a real finding, not noise. Record it.
   - `ngram_nl` counts will be ~all rows for most Bengali queries —
     that is the known defect, not a regression.
   - `persons[শিক্ষক]`: boolean/LIKE/default 0, NL 175 (name-only
     index — expected; see `queries.md`).
   - `posts_mixed[SSC বৃত্তি]`: LIKE-literal 0 vs boolean 287 is a
     query-form difference (see `queries.md`), not a failure.
   - `posts_mixed[the]`: 0 everywhere — inconclusive, not a finding.
3. **Timings:** compare medians with the 8.0.46 summary in
   `README.md` **as orders of magnitude, not exact milliseconds**.
   Timings vary run to run (the 8.0.46 re-run on 2026-11-14 gave e.g.
   `posts_word[রক্তদান]` boolean 4.36 ms vs 4.35 ms originally, and
   the 100-row insert 39.1 ms vs 24.5 ms originally). A timing shift
   of <2× is noise at this scale. A systematic shift (e.g. boolean
   mode 10× slower on 8.4, or NL suddenly precise) is a finding —
   record it and re-run to confirm before claiming it.
4. **Pagination:** `overlap_between_pages` must be `[]` and
   `total_matching` 1800 for the `সাতানিপাড়া` NL probe.
5. **EXPLAIN:** `ngram` queries must show `type=fulltext`;
   `LIKE '%term%'` must show `type=ALL`; `LIKE 'term%'` must show
   `type=range` on the B-tree index.

## 6. What to record (and where)

File the 8.4 run as a dated, version-labelled artefact — do not
overwrite the 8.0.46 summary in `README.md` in place. Record:

- Server version string (`SELECT VERSION()`), `ngram_token_size`,
  host type (local / Docker / VPS), date, and who ran it.
- `raw_results.json` + `raw_results.md` (keep the pair together;
  the JSON is the machine-readable record).
- A short note answering, for the 8.4 run: (a) did every
  `ngram_bool` count equal its `LIKE` count? (b) did NL still
  over-match (~100% of rows)? (c) did any count differ from the
  8.0.46 reference counts in `queries.md`, and if so which case?
  (d) timing order-of-magnitude vs 8.0.46? (e) pagination overlap?
- Then update the blueprint pointers: Doc 15 §9 (add the 8.4 run to
  the re-test checklist as done, with the measured version and a link
  to the filed results), ADR-010 (same), and Doc 13 Q-13 (re-test on
  8.4: done / still open for the real-data snapshot).

Until step 6 is done, the 8.4 numbers are **unfiled** — the blueprint
still correctly says "measured on 8.0.46, 8.4 pending".

## 7. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `mysql: command not found` | Install the MySQL client (`mysql-client` / the server package) on the runner machine. |
| `Access denied for user 'root'@...` | Wrong password or user; check `MYSQL_PASSWORD` / the server's auth setup. Do not paste the password into chat or the repo. |
| `Can't connect to MySQL server` | Server not running, wrong host/port, or Docker port not published. Start it / fix `--host` / `--port`. |
| Bengali queries return 0 rows everywhere | Charset trap (see §0): the runner already passes `--default-character-set=utf8mb4`; if you ran SQL manually, add it or `SET NAMES utf8mb4`. |
| `DROP DATABASE` permission error | The MySQL user lacks DROP/CREATE; use a privileged user or a DBA-created empty database (then pass `--database <name>` — but note `schema.sql` still drops it). |
| `SHOW PROFILES` durations missing for some queries | Profiling history caps at 100 per session; the runner already chunks at 80. If you edited the runner, keep chunks ≤80. |
| Counts differ from `queries.md` on the same version | Re-check: same seed (default 20261114), same `seed.sql` md5, and that no earlier partial run left extra rows (the runner drops/recreates the DB, so re-run cleanly). If the difference persists on a clean re-run, it is a finding — record it, do not edit the data to match. |
| Timings much slower than 8.0.46 | Check server load, Docker memory limits, and that the indexes actually built (see the `index_build` section of the output; `rc` must be 0). Timing alone never fails the benchmark — counts do. |
