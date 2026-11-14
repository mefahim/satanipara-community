#!/usr/bin/env python3
"""
Satanipara Community — Bengali search benchmark runner.
Drives the local MySQL CLI (no Python MySQL driver available in this VM).

What it measures (all against SYNTHETIC data — see generate_dataset.py):
  (a) Bengali word matching      (b) partial matching   (c) prefix matching
  (d) spelling variations        (e) Bengali+English    (f) relevance sorting
  (g) pagination                 (h) response time      (i) index size/maintenance

Approaches compared (all MySQL-compatible, no extra service):
  ngram_nl    FULLTEXT WITH PARSER ngram, NATURAL LANGUAGE MODE
  ngram_bool  FULLTEXT WITH PARSER ngram, BOOLEAN MODE (+term, term*)
  default_ft  FULLTEXT with the default parser, NATURAL LANGUAGE MODE
  like_pct    LIKE '%term%' (no index usable — full scan)
  like_prefix LIKE 'term%' (B-tree index usable)
  app_level   Python substring scan over all rows (one-time load, then per-query)

Timing: server-side durations from SHOW PROFILES, each query run 3x in
separate sessions, median reported. App-level timings are Python-side
perf_counter medians of 3 runs.

Writes raw_results.json and raw_results.md (plus count_debug.sql) to the
output directory (default: next to this script).
Publishable package version (Phase 0.1.1): connection parameters are
arguments / environment variables (no hard-coded user, host, or database);
paths resolve relative to this script, not the working directory; the
server version and ngram_token_size are recorded in the output; the
database name is honoured in schema.sql / seed.sql at load time.
Usage: python3 run_benchmark.py [--host localhost] [--port 3306]
       [--user root] [--database bench] [--bench-dir .] [--out-dir .]
Environment (used when the matching argument is not given):
  MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE.
  The password is passed to the mysql client via the MYSQL_PWD
  environment variable, never on the command line. If no password is
  given, the client connects without one (as the Phase 0.1 run did,
  as root over the local socket).
WARNING: the run drops and recreates the database (schema.sql).
Run only against a scratch database on a non-production server.
"""
import argparse
import json
import os
import subprocess
import sys
import time
from statistics import median

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def build_mysql_cmd(args):
    """mysql CLI invocation; password via MYSQL_PWD env, never argv."""
    cmd = ["mysql", "-h", args.host, "-P", str(args.port), "-u", args.user,
           "--batch", "--skip-column-names", "--raw",
           "--default-character-set=utf8mb4"]
    return cmd


def parse_args(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--host", default=os.environ.get("MYSQL_HOST", "localhost"))
    ap.add_argument("--port", type=int,
                    default=int(os.environ.get("MYSQL_PORT", "3306")))
    ap.add_argument("--user", default=os.environ.get("MYSQL_USER", "root"))
    ap.add_argument("--password", default=os.environ.get("MYSQL_PASSWORD", ""),
                    help="or set MYSQL_PASSWORD / MYSQL_PWD in the environment")
    ap.add_argument("--database", default=os.environ.get("MYSQL_DATABASE", "bench"))
    ap.add_argument("--bench-dir", default=SCRIPT_DIR,
                    help="directory holding schema.sql and seed.sql (default: script dir)")
    ap.add_argument("--out-dir", default=None,
                    help="where raw_results.json/.md and count_debug.sql go (default: bench-dir)")
    ap.add_argument("--schema-file", default="schema.sql")
    ap.add_argument("--seed-file", default="seed.sql")
    return ap.parse_args(argv)


ARGS = parse_args()
MYSQL = build_mysql_cmd(ARGS)
DATABASE = ARGS.database
BENCH_DIR = ARGS.bench_dir
OUT_DIR = ARGS.out_dir or ARGS.bench_dir
OUT_JSON = os.path.join(OUT_DIR, "raw_results.json")
OUT_MD = os.path.join(OUT_DIR, "raw_results.md")
COUNT_DEBUG = os.path.join(OUT_DIR, "count_debug.sql")


def run_mysql(sql, db=DATABASE, timeout=300):
    """Run SQL script in one mysql invocation; return (stdout, stderr, rc)."""
    args = MYSQL + ([db] if db else [])
    env = dict(os.environ)
    if ARGS.password:
        env["MYSQL_PWD"] = ARGS.password
    p = subprocess.run(args, input=sql, capture_output=True, text=True,
                       encoding="utf-8", timeout=timeout, env=env)
    return p.stdout, p.stderr, p.returncode


def load_sql_file(name):
    """Read a benchmark SQL file, honouring --database for the bench DB."""
    path = os.path.join(BENCH_DIR, name)
    with open(path, encoding="utf-8") as fh:
        sql = fh.read()
    if DATABASE != "bench":
        sql = sql.replace("DATABASE bench", f"DATABASE {DATABASE}")
        sql = sql.replace("USE bench;", f"USE {DATABASE};")
    return sql


def sql_str(s):
    return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"


def table_sizes(tables="posts, persons, activities"):
    run_mysql(f"ANALYZE TABLE {tables};")
    out, err, rc = run_mysql(
        "SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH "
        f"FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='{DATABASE}' "
        "ORDER BY TABLE_NAME;")
    sizes = {}
    for line in out.strip().split("\n"):
        if not line.strip():
            continue
        name, rows, dl, il = line.split("\t")
        sizes[name] = {"rows": int(rows), "data_length": int(dl),
                       "index_length": int(il)}
    return sizes


def timed_alter(sql, label, results):
    t0 = time.perf_counter()
    out, err, rc = run_mysql(sql)
    dt = (time.perf_counter() - t0) * 1000
    results["index_build"][label] = {"ms": round(dt, 1), "rc": rc,
                                     "stderr": err.strip()[:300]}
    print(f"  ALTER {label}: {dt:.1f} ms (rc={rc})")
    if rc != 0:
        print(f"    STDERR: {err[:500]}")
    return rc


def profile_run(queries):
    """Run queries in one session with profiling; return {label: duration_ms}."""
    script = ["SET profiling_history_size=100;", "SET profiling=1;"]
    for q in queries:
        script.append(q["sql"])
    script.append("SHOW PROFILES;")
    out, err, rc = run_mysql("\n".join(script))
    if rc != 0:
        raise RuntimeError(f"profile run failed rc={rc}: {err[:500]}")
    by_sql = {}
    for q in queries:
        norm = " ".join(q["sql"].split()).rstrip(";")
        if norm in by_sql:
            print(f"  WARNING: duplicate timed SQL for {q['label']} "
                  f"and {by_sql[norm]} — durations will collide")
        by_sql[norm] = q["label"]
    durations = {}
    for line in out.strip().split("\n"):
        parts = line.split("\t")
        if len(parts) < 3:
            continue
        try:
            dur = float(parts[1])
        except ValueError:
            continue
        qtext = " ".join(parts[2].strip().split())
        label = by_sql.get(qtext)
        if label:
            durations[label] = dur * 1000.0
    missing = [q["label"] for q in queries if q["label"] not in durations]
    if missing:
        print(f"  WARNING: no profile row for: {missing}")
        print("  SHOW PROFILES raw output (first 2000 chars):")
        print(out[:2000])
    return durations


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    results = {"index_build": {}, "counts": {}, "timings_ms": {},
               "top_results": {}, "explain": {}, "app_level": {},
               "pagination": {}, "insert_maintenance": {}, "notes": []}

    # ---- 0. environment (recorded in the output — never assume the version)
    print("== 0. environment ==")
    out, err, rc = run_mysql("SELECT VERSION();", db=None)
    version = out.strip()
    out2, _, _ = run_mysql(
        "SELECT @@ngram_token_size, @@character_set_server, "
        "@@collation_server;", db=None)
    print(f"  MySQL version: {version}")
    print(f"  ngram_token_size, charset, collation: {out2.strip()}")
    results["environment"] = {
        "mysql_version": version,
        "ngram_token_size_charset_collation": out2.strip(),
        "database": DATABASE, "host": ARGS.host, "port": ARGS.port,
        "user": ARGS.user,
        "note": "All numbers in this file were measured on the server above. "
                "Do NOT relabel them as another MySQL version."}

    # ---- 1. schema + seed -------------------------------------------------
    print("== 1. loading schema + seed ==")
    for f in (ARGS.schema_file, ARGS.seed_file):
        sql = load_sql_file(f)
        t0 = time.perf_counter()
        out, err, rc = run_mysql(sql, db=None)
        print(f"  {f}: {(time.perf_counter()-t0)*1000:.0f} ms rc={rc}")
        if rc != 0:
            print(err[:2000]); sys.exit(1)
    out, err, rc = run_mysql("SELECT (SELECT COUNT(*) FROM posts) p, "
                             "(SELECT COUNT(*) FROM persons) pe, "
                             "(SELECT COUNT(*) FROM activities) a;")
    print("  row counts (posts, persons, activities):", out.strip())
    results["counts"]["rows"] = out.strip()
    results["sizes_baseline"] = table_sizes()
    print("  baseline sizes:", json.dumps(results["sizes_baseline"]))

    # ---- 2. indexes --------------------------------------------------------
    print("== 2. building indexes ==")
    timed_alter("ALTER TABLE posts ADD FULLTEXT INDEX ft_posts_ngram "
                "(title_bn, body_bn) WITH PARSER ngram;", "posts_ngram_ft", results)
    timed_alter("ALTER TABLE persons ADD FULLTEXT INDEX ft_persons_ngram "
                "(name_bn, name_en) WITH PARSER ngram;", "persons_ngram_ft", results)
    timed_alter("ALTER TABLE activities ADD FULLTEXT INDEX ft_activities_ngram "
                "(title_bn, body_bn) WITH PARSER ngram;", "activities_ngram_ft", results)
    timed_alter("ALTER TABLE persons ADD INDEX idx_persons_name_bn (name_bn);",
                "persons_name_btree", results)
    timed_alter("ALTER TABLE posts ADD INDEX idx_posts_title_bn (title_bn);",
                "posts_title_btree", results)
    # default-parser copies (so MATCH is unambiguous per parser)
    t0 = time.perf_counter()
    out, err, rc = run_mysql(
        "CREATE TABLE posts_def LIKE posts;"
        "INSERT INTO posts_def SELECT * FROM posts;"
        "ALTER TABLE posts_def ADD FULLTEXT INDEX ft_posts_def (title_bn, body_bn);"
        "CREATE TABLE persons_def LIKE persons;"
        "INSERT INTO persons_def SELECT * FROM persons;"
        "ALTER TABLE persons_def ADD FULLTEXT INDEX ft_persons_def (name_bn, name_en);")
    print(f"  default-parser copies: {(time.perf_counter()-t0)*1000:.1f} ms rc={rc}")
    if rc != 0:
        print(err[:1000]); sys.exit(1)
    # drop the ngram/btree indexes from the copies so sizes stay comparable
    run_mysql("ALTER TABLE posts_def DROP INDEX ft_posts_ngram, DROP INDEX idx_posts_title_bn;"
              "ALTER TABLE persons_def DROP INDEX ft_persons_ngram, DROP INDEX idx_persons_name_bn;")
    results["sizes_indexed"] = table_sizes(
        "posts, persons, activities, posts_def, persons_def")
    print("  indexed sizes:", json.dumps(results["sizes_indexed"]))

    # ---- 3. test cases ------------------------------------------------------
    # Each case: label, group, and per-approach SQL (LIMIT 20, realistic API page).
    # LIKE variants search title+body (posts) or name (persons).
    def nl(table, cols, term):
        return (f"SELECT id, MATCH({cols}) AGAINST({sql_str(term)} IN NATURAL LANGUAGE MODE) AS rel "
                f"FROM {table} WHERE MATCH({cols}) AGAINST({sql_str(term)} IN NATURAL LANGUAGE MODE) "
                f"ORDER BY rel DESC LIMIT 20;")

    def bl(table, cols, term):
        return (f"SELECT id, MATCH({cols}) AGAINST({sql_str(term)} IN BOOLEAN MODE) AS rel "
                f"FROM {table} WHERE MATCH({cols}) AGAINST({sql_str(term)} IN BOOLEAN MODE) "
                f"ORDER BY rel DESC LIMIT 20;")

    def like_pct(table, cond):
        return f"SELECT id FROM {table} WHERE {cond} LIMIT 20;"

    cases = []
    # --- posts: word matching
    for term in ["রক্তদান", "বৃত্তি", "শীতবস্ত্র", "মসজিদ", "প্রশিক্ষণ", "শ্রমিক"]:
        cases.append({"label": f"posts_word[{term}]", "group": "a_word",
                      "ngram_nl": nl("posts", "title_bn, body_bn", term),
                      "ngram_bool": bl("posts", "title_bn, body_bn", term),
                      "default_ft": nl("posts_def", "title_bn, body_bn", term),
                      "like_pct": like_pct("posts", f"title_bn LIKE '%{term}%' OR body_bn LIKE '%{term}%'"),
                      "app_term": term, "app_table": "posts"})
    # --- posts: partial matching
    for term in ["রক্তদা", "শীতব", "বৃত্ত", "রক"]:
        cases.append({"label": f"posts_partial[{term}]", "group": "b_partial",
                      "ngram_nl": nl("posts", "title_bn, body_bn", term),
                      "ngram_bool": bl("posts", "title_bn, body_bn", term + "*"),
                      "default_ft": nl("posts_def", "title_bn, body_bn", term),
                      "like_pct": like_pct("posts", f"title_bn LIKE '%{term}%' OR body_bn LIKE '%{term}%'"),
                      "app_term": term, "app_table": "posts"})
    # --- edge: 1-char query
    cases.append({"label": "posts_partial[র] (1-char edge)", "group": "b_partial",
                  "ngram_nl": nl("posts", "title_bn, body_bn", "র"),
                  "ngram_bool": bl("posts", "title_bn, body_bn", "র*"),
                  "default_ft": nl("posts_def", "title_bn, body_bn", "র"),
                  "like_pct": like_pct("posts", "title_bn LIKE '%র%' OR body_bn LIKE '%র%'"),
                  "app_term": "র", "app_table": "posts"})
    # --- posts: spelling variations
    for term in ["সাতানিপাড়া", "শাতানিপাড়া", "সাতানীপাড়া", "মাদ্রাসা",
                 "মাদরাসা", "রক্ত দান", "শীত বস্ত্র"]:
        cases.append({"label": f"posts_spelling[{term}]", "group": "d_spelling",
                      "ngram_nl": nl("posts", "title_bn, body_bn", term),
                      "ngram_bool": bl("posts", "title_bn, body_bn", term),
                      "default_ft": nl("posts_def", "title_bn, body_bn", term),
                      "like_pct": like_pct("posts", f"title_bn LIKE '%{term}%' OR body_bn LIKE '%{term}%'"),
                      "app_term": term, "app_table": "posts"})
    # --- posts: mixed Bengali+English
    for term in ["Blood Donation", "SSC বৃত্তি", "Scholarship", "the"]:
        cases.append({"label": f"posts_mixed[{term}]", "group": "e_mixed",
                      "ngram_nl": nl("posts", "title_bn, body_bn", term),
                      "ngram_bool": bl("posts", "title_bn, body_bn", term),
                      "default_ft": nl("posts_def", "title_bn, body_bn", term),
                      "like_pct": like_pct("posts", f"title_bn LIKE '%{term}%' OR body_bn LIKE '%{term}%'"),
                      "app_term": term, "app_table": "posts"})
    # --- posts: multi-term relevance (also recorded for top-results)
    for term in ["রক্তদান শিবির", "শীতবস্ত্র বিতরণ"]:
        cases.append({"label": f"posts_relevance[{term}]", "group": "f_relevance",
                      "ngram_nl": nl("posts", "title_bn, body_bn", term),
                      "ngram_bool": bl("posts", "title_bn, body_bn",
                                       " ".join("+" + w for w in term.split())),
                      "default_ft": nl("posts_def", "title_bn, body_bn", term),
                      "like_pct": like_pct("posts", " AND ".join(
                          f"(title_bn LIKE '%{w}%' OR body_bn LIKE '%{w}%')" for w in term.split())),
                      "app_term": term, "app_table": "posts"})
    # --- persons: names
    for term in ["মোহাম্মদ", "রহিম", "চক্রবর্তী", "শিক্ষক", "Mohammad", "মোহা"]:
        grp = "a_word" if term not in ("মোহা",) else "b_partial"
        if term == "Mohammad":
            grp = "e_mixed"
        cases.append({"label": f"persons[{term}]", "group": grp,
                      "ngram_nl": nl("persons", "name_bn, name_en", term),
                      "ngram_bool": bl("persons", "name_bn, name_en", term),
                      "default_ft": nl("persons_def", "name_bn, name_en", term),
                      "like_pct": like_pct("persons", f"name_bn LIKE '%{term}%' OR name_en LIKE '%{term}%'"),
                      "app_term": term, "app_table": "persons"})
    # --- persons: prefix matching on title/name via B-tree
    cases.append({"label": "persons_prefix[মোহাম্মদ] (LIKE 'term%')", "group": "c_prefix",
                  "ngram_bool": bl("persons", "name_bn, name_en", "মোহাম্মদ*"),
                  "like_prefix": like_pct("persons", "name_bn LIKE 'মোহাম্মদ%'"),
                  "app_term": "মোহাম্মদ", "app_table": "persons"})
    cases.append({"label": "posts_prefix[শিক্ষা] (LIKE 'term%')", "group": "c_prefix",
                  "ngram_bool": bl("posts", "title_bn, body_bn", "শিক্ষা*"),
                  "like_prefix": like_pct("posts", "title_bn LIKE 'শিক্ষা%'"),
                  "app_term": "শিক্ষা", "app_table": "posts"})
    # --- activities
    for term in ["বৃত্তি", "শীতবস্ত্র", "রক্তদান"]:
        cases.append({"label": f"activities[{term}]", "group": "a_word",
                      "ngram_nl": nl("activities", "title_bn, body_bn", term),
                      "ngram_bool": bl("activities", "title_bn, body_bn", term),
                      "like_pct": like_pct("activities", f"title_bn LIKE '%{term}%' OR body_bn LIKE '%{term}%'"),
                      "app_term": term, "app_table": "activities"})

    approaches = ["ngram_nl", "ngram_bool", "default_ft", "like_pct", "like_prefix"]

    # counts: one COUNT per case per approach (untimed, single session)
    print("== 3. counting matches per case/approach ==")
    count_sqls = []
    for c in cases:
        for ap in approaches:
            if ap not in c:
                continue
            sql = c[ap]
            # turn the LIMIT-20 select into a count: wrap it
            inner = sql.rstrip(";")
            # strip ORDER BY ... LIMIT for counting
            if "ORDER BY" in inner:
                inner = inner[:inner.index("ORDER BY")]
            if inner.rstrip().endswith("LIMIT 20"):
                inner = inner.rstrip()[:-len("LIMIT 20")]
            count_sqls.append((f"{c['label']}||{ap}", inner))
    script = []
    for label, inner in count_sqls:
        safe_label = label.replace("\\", "\\\\").replace("'", "\\'")
        script.append(f"SELECT '{safe_label}', COUNT(*) FROM ({inner}) AS t;")
    with open(COUNT_DEBUG, "w", encoding="utf-8") as f:
        f.write("\n".join(script) + "\n")
    out, err, rc = run_mysql("\n".join(script))
    if rc != 0:
        print("count run failed:", err[:1000]); sys.exit(1)
    for line in out.strip().split("\n"):
        if not line.strip():
            continue
        label, cnt = line.rsplit("\t", 1)
        results["counts"][label] = int(cnt)
    print(f"  counted {len(results['counts'])} case/approach pairs")

    # timed runs: 3 reps
    print("== 4. timed runs (3 reps, SHOW PROFILES) ==")
    timed_queries = []
    for c in cases:
        for ap in approaches:
            if ap in c:
                timed_queries.append({"label": f"{c['label']}||{ap}", "sql": c[ap]})
    print(f"  {len(timed_queries)} timed queries per rep")
    reps = []
    for rep in range(3):
        merged = {}
        # profiling_history_size maxes out at 100; run in chunks of 80
        for i in range(0, len(timed_queries), 80):
            d = profile_run(timed_queries[i:i + 80])
            merged.update(d)
        reps.append(merged)
        print(f"  rep {rep+1}: {len(merged)}/{len(timed_queries)} durations captured")
    for q in timed_queries:
        vals = [r[q["label"]] for r in reps if q["label"] in r]
        if vals:
            results["timings_ms"][q["label"]] = {
                "median_ms": round(median(vals), 3),
                "runs_ms": [round(v, 3) for v in vals]}

    # ---- 5. top results / relevance ---------------------------------------
    print("== 5. top results for relevance cases ==")
    for term in ["রক্তদান শিবির", "শীতবস্ত্র বিতরণ"]:
        for ap, sql in [
                ("ngram_nl", nl("posts", "title_bn, body_bn", term).replace("LIMIT 20", "LIMIT 5")),
                ("default_ft", nl("posts_def", "title_bn, body_bn", term).replace("LIMIT 20", "LIMIT 5"))]:
            out, err, rc = run_mysql(
                f"SELECT p.id, ROUND(x.rel,4), p.title_bn FROM ({sql.rstrip(';')}) AS x "
                f"JOIN posts p ON p.id=x.id;")
            results["top_results"][f"{term}||{ap}"] = out.strip()
        out, err, rc = run_mysql(
            "SELECT id, title_bn FROM posts WHERE " +
            " AND ".join(f"(title_bn LIKE '%{w}%' OR body_bn LIKE '%{w}%')"
                         for w in term.split()) + " LIMIT 5;")
        results["top_results"][f"{term}||like_pct"] = out.strip()

    # ---- 6. EXPLAIN ---------------------------------------------------------
    print("== 6. EXPLAIN ==")
    explains = {
        "ngram_nl_word": "EXPLAIN SELECT id FROM posts WHERE MATCH(title_bn, body_bn) "
                         "AGAINST('রক্তদান' IN NATURAL LANGUAGE MODE);",
        "ngram_bool_prefix": "EXPLAIN SELECT id FROM posts WHERE MATCH(title_bn, body_bn) "
                             "AGAINST('রক্তদা*' IN BOOLEAN MODE);",
        "like_pct": "EXPLAIN SELECT id FROM posts WHERE title_bn LIKE '%রক্তদান%' "
                    "OR body_bn LIKE '%রক্তদান%';",
        "like_prefix_btree": "EXPLAIN SELECT id FROM persons WHERE name_bn LIKE 'মোহাম্মদ%';",
        "default_ft_word": "EXPLAIN SELECT id FROM posts_def WHERE MATCH(title_bn, body_bn) "
                           "AGAINST('রক্তদান' IN NATURAL LANGUAGE MODE);",
    }
    for label, sql in explains.items():
        out, err, rc = run_mysql(sql)
        results["explain"][label] = out.strip()

    # ---- 7. app-level approach ----------------------------------------------
    print("== 7. app-level full-scan timings ==")
    dump = {}
    for table, cols in [("posts", "id, title_bn, body_bn"),
                        ("persons", "id, name_bn, name_en"),
                        ("activities", "id, title_bn, body_bn")]:
        t0 = time.perf_counter()
        out, err, rc = run_mysql(f"SELECT {cols} FROM {table};")
        load_ms = (time.perf_counter() - t0) * 1000
        rows = []
        for line in out.strip().split("\n"):
            if line.strip():
                rows.append(line.split("\t"))
        dump[table] = rows
        results["app_level"][f"load_{table}"] = {
            "rows": len(rows), "bytes": len(out.encode("utf-8")),
            "load_ms": round(load_ms, 1)}
        print(f"  load {table}: {len(rows)} rows, {load_ms:.1f} ms")
    for c in cases:
        term = c["app_term"]
        rows = dump[c["app_table"]]
        text_idx = [1, 2] if c["app_table"] != "persons" else [1, 2]
        # persons: name_bn(1), name_en(2); posts/activities: title(1), body(2)
        times, counts = [], None
        for _ in range(3):
            t0 = time.perf_counter()
            hits = [r for r in rows
                    if any(term in (r[i] or "") for i in text_idx)]
            times.append((time.perf_counter() - t0) * 1000)
            counts = len(hits)
        results["app_level"][c["label"]] = {
            "median_ms": round(median(times), 3),
            "runs_ms": [round(v, 3) for v in times],
            "rows_matched": counts}

    # ---- 8. pagination -------------------------------------------------------
    print("== 8. pagination ==")
    pag_sql_count = ("SELECT COUNT(*) FROM posts WHERE MATCH(title_bn, body_bn) "
                     "AGAINST('সাতানিপাড়া' IN NATURAL LANGUAGE MODE);")
    out, _, _ = run_mysql(pag_sql_count)
    total = int(out.strip())
    pages = {}
    for offset in (0, 10, 20):
        t0 = time.perf_counter()
        out, _, _ = run_mysql(
            "SELECT id FROM posts WHERE MATCH(title_bn, body_bn) "
            "AGAINST('সাতানিপাড়া' IN NATURAL LANGUAGE MODE) "
            f"ORDER BY MATCH(title_bn, body_bn) AGAINST('সাতানিপাড়া' IN NATURAL LANGUAGE MODE) DESC "
            f"LIMIT 10 OFFSET {offset};")
        dt = (time.perf_counter() - t0) * 1000
        ids = [int(x) for x in out.strip().split("\n") if x.strip()]
        pages[offset] = {"ms": round(dt, 2), "ids": ids}
    overlap = (set(pages[0]["ids"]) & set(pages[10]["ids"])) | \
              (set(pages[0]["ids"]) & set(pages[20]["ids"])) | \
              (set(pages[10]["ids"]) & set(pages[20]["ids"]))
    results["pagination"] = {"query": "সাতানিপাড়া (ngram NL)",
                             "total_matching": total, "pages": pages,
                             "overlap_between_pages": sorted(overlap)}
    print(f"  total={total}, overlap={sorted(overlap)}")

    # ---- 9. insert maintenance ------------------------------------------------
    print("== 9. insert maintenance ==")
    ins_vals = ", ".join(
        f"('notice','published','পরীক্ষামূলক নোটিশ {i} রক্তদান','পরীক্ষামূলক বডি {i} সাতানিপাড়া')"
        for i in range(100))
    t0 = time.perf_counter()
    out, err, rc = run_mysql(
        f"INSERT INTO posts (category, status, title_bn, body_bn) VALUES {ins_vals};")
    ins_ms = (time.perf_counter() - t0) * 1000
    run_mysql("DELETE FROM posts WHERE title_bn LIKE 'পরীক্ষামূলক নোটিশ%';")
    results["insert_maintenance"] = {
        "insert_100_rows_with_ft_indexes_ms": round(ins_ms, 1),
        "note": "single multi-row INSERT of 100 rows, wall time incl. client round-trip"}
    print(f"  insert 100 rows: {ins_ms:.1f} ms")

    # ---- write outputs ---------------------------------------------------------
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"wrote {OUT_JSON}")

    md = ["# Bengali search benchmark — RAW RESULTS",
          "",
          f"Generated by run_benchmark.py on MySQL "
          f"{results['environment']['mysql_version']} "
          f"(database `{DATABASE}`, ngram_token_size/charset/collation: "
          f"{results['environment']['ngram_token_size_charset_collation']}). "
          f"All numbers were measured on that server; see README.md / Doc 15 §9 "
          f"for interpretation. Dataset is SYNTHETIC.",
          "",
          "## Row counts", "", "```", results["counts"]["rows"], "```", "",
          "## Table sizes (bytes)", "",
          "| table | rows | data_length | index_length |",
          "|---|---|---|---|"]
    for name, s in results["sizes_indexed"].items():
        md.append(f"| {name} | {s['rows']} | {s['data_length']} | {s['index_length']} |")
    md += ["", "Baseline (before indexes):", ""]
    for name, s in results["sizes_baseline"].items():
        md.append(f"- {name}: data={s['data_length']} index={s['index_length']}")
    md += ["", "## Index build times (ms)", ""]
    for k, v in results["index_build"].items():
        md.append(f"- {k}: {v['ms']} ms (rc={v['rc']})")
    md += ["", "## Timings — median of 3 runs (ms, server-side SHOW PROFILES)", "",
           "| case | approach | median_ms | runs_ms | rows |",
           "|---|---|---|---|---|"]
    for label, t in sorted(results["timings_ms"].items()):
        case, ap = label.rsplit("||", 1)
        cnt = results["counts"].get(label, "?")
        md.append(f"| {case} | {ap} | {t['median_ms']} | {t['runs_ms']} | {cnt} |")
    md += ["", "## App-level full-scan (Python substring over all rows)", ""]
    for k, v in results["app_level"].items():
        if k.startswith("load_"):
            md.append(f"- {k}: {v['rows']} rows, {v['bytes']} bytes, load {v['load_ms']} ms")
        else:
            md.append(f"- {k}: median {v['median_ms']} ms, runs {v['runs_ms']}, matched {v['rows_matched']}")
    md += ["", "## Pagination", "",
           f"- query: {results['pagination']['query']}",
           f"- total matching: {results['pagination']['total_matching']}",
           f"- overlap between pages: {results['pagination']['overlap_between_pages']}"]
    for off, p in results["pagination"]["pages"].items():
        md.append(f"- OFFSET {off}: {p['ms']} ms, ids {p['ids']}")
    md += ["", "## Insert maintenance", "",
           f"- insert 100 rows with FT indexes: {results['insert_maintenance']['insert_100_rows_with_ft_indexes_ms']} ms",
           "", "## EXPLAIN", ""]
    for k, v in results["explain"].items():
        md += [f"### {k}", "", "```", v, "```", ""]
    md += ["## Top-5 relevance samples", ""]
    for k, v in results["top_results"].items():
        md += [f"### {k}", "", "```", v, "```", ""]
    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.write("\n".join(md) + "\n")
    print(f"wrote {OUT_MD}")


if __name__ == "__main__":
    main()
