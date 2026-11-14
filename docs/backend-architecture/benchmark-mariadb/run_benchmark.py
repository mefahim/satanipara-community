#!/usr/bin/env python3
"""
Satanipara Community — Bengali search benchmark runner (MariaDB rebuild).
Drives the MariaDB CLI (no Python MySQL driver available in this VM).

Rebuilds the Phase 0.1 benchmark for MariaDB 11.8.9, where the MySQL
ngram FULLTEXT parser DOES NOT EXIST. Same synthetic dataset (3,900 rows,
generator seed 20261114 — same seed.sql md5 as Phase 0.1), same 35 test
cases, same case/approach count shape; the approaches are the MariaDB
ones:

  ft_nl        FULLTEXT with the DEFAULT parser, NATURAL LANGUAGE MODE
  ft_bool      same index, BOOLEAN MODE, exact words ('+a +b' for AND)
  ft_bool_wild same index, BOOLEAN MODE, wildcard ('a*' / '+a* +b*')
  tokens_ft    FULLTEXT over a precomputed `search_tokens` column
               (see tokenize.py), BOOLEAN MODE, plain terms
  like_pct     LIKE '%term%' (no index usable — full scan)
  like_prefix  LIKE 'term%' (B-tree index usable)
  app_level    Python substring scan over all rows (one-time load)

Connection (environment; never put a password on the command line):
  MDB_CLIENT    client binary, default 'mariadb' (falls back to 'mysql')
  MDB_SOCKET    Unix socket path (preferred for a local user-space server)
  MDB_HOST      default 127.0.0.1 (ignored when MDB_SOCKET is set)
  MDB_PORT      default 3307 (MariaDB test server; the MySQL 8.0.46
                server on this VM listens on 3306 — do NOT point here
                at 3306 or you will benchmark the wrong server)
  MDB_USER      default root
  MDB_PASSWORD  via environment only (passed as MYSQL_PWD to the client)
  MDB_DATABASE  scratch database, default 'bench' (DROPPED and recreated)

Timing: server-side durations from SHOW PROFILES (MariaDB supports it;
verified on 11.8.9), each query run 3x in separate sessions, median
reported. App-level timings are Python-side perf_counter medians of 3 runs.

Writes raw_results.json and raw_results.md next to this script.
Usage: python3 run_benchmark.py
"""
import hashlib
import json
import os
import subprocess
import sys
import time
from statistics import median

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tokenize import tokenize_text  # noqa: E402

CLIENT = os.environ.get("MDB_CLIENT", "mariadb")
SOCKET = os.environ.get("MDB_SOCKET", "")
HOST = os.environ.get("MDB_HOST", "127.0.0.1")
PORT = os.environ.get("MDB_PORT", "3307")
USER = os.environ.get("MDB_USER", "root")
DATABASE = os.environ.get("MDB_DATABASE", "bench")

BASE = [CLIENT, "-u", USER, "--batch", "--skip-column-names", "--raw",
        "--default-character-set=utf8mb4"]
if SOCKET:
    BASE += ["-S", SOCKET]
else:
    BASE += ["-h", HOST, "-P", PORT]
ENV = dict(os.environ)
if os.environ.get("MDB_PASSWORD"):
    ENV["MYSQL_PWD"] = os.environ["MDB_PASSWORD"]

OUT_JSON = "raw_results.json"
OUT_MD = "raw_results.md"


def run_sql(sql, db=DATABASE, timeout=300):
    """Run SQL script in one client invocation; return (stdout, stderr, rc)."""
    args = BASE + ([db] if db else [])
    p = subprocess.run(args, input=sql, capture_output=True, text=True,
                       encoding="utf-8", timeout=timeout, env=ENV)
    return p.stdout, p.stderr, p.returncode


def sql_str(s):
    return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"


def table_sizes(tables):
    run_sql(f"ANALYZE TABLE {tables};")
    out, err, rc = run_sql(
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


def fts_sizes():
    """True FULLTEXT index size per table, from the datadir filesystem.

    INFORMATION_SCHEMA.TABLES.INDEX_LENGTH does NOT include InnoDB
    FULLTEXT index data: it lives in hidden auxiliary tables whose files
    are named FTS_<table_id_hex>_*_INDEX_*.ibd under <datadir>/<schema>/.
    (Verified on 11.8.9: posts INDEX_LENGTH stayed 262144 after adding
    two FULLTEXT indexes.) This needs MDB_DATADIR set to the server's
    data directory; without it the sizes are recorded as unavailable.
    Returns {table: {"fts_bytes": int, "table_ibd_bytes": int}}.
    """
    datadir = os.environ.get("MDB_DATADIR", "")
    out_sizes = {}
    if not datadir:
        return {"note": "MDB_DATADIR not set — FTS auxiliary-table sizes unavailable "
                        "(INFORMATION_SCHEMA INDEX_LENGTH excludes FT data; see README)"}
    out, err, rc = run_sql(
        "SELECT TABLE_ID, NAME FROM INFORMATION_SCHEMA.INNODB_SYS_TABLES "
        f"WHERE NAME LIKE '{DATABASE}/%';")
    # index_id -> index name, for splitting FTS bytes per FT index
    idx_names = {}
    out2, _, _ = run_sql(
        "SELECT INDEX_ID, NAME FROM INFORMATION_SCHEMA.INNODB_SYS_INDEXES "
        "WHERE TABLE_ID IN (SELECT TABLE_ID FROM "
        "INFORMATION_SCHEMA.INNODB_SYS_TABLES "
        f"WHERE NAME LIKE '{DATABASE}/%');")
    for line in out2.strip().split("\n"):
        if not line.strip():
            continue
        iid, iname = line.split("\t")
        idx_names[format(int(iid), "016x")] = iname
    for line in out.strip().split("\n"):
        if not line.strip():
            continue
        tid, name = line.split("\t")
        table = name.split("/", 1)[1]
        if table.startswith("FTS_"):
            continue
        hexid = format(int(tid), "016x")
        prefix = f"FTS_{hexid}_"
        total = 0
        by_index = {}
        aux = 0
        d = os.path.join(datadir, DATABASE)
        try:
            for fn in os.listdir(d):
                if fn.startswith(prefix) and fn.endswith(".ibd"):
                    sz = os.path.getsize(os.path.join(d, fn))
                    total += sz
                    if "_INDEX_" in fn:
                        parts = fn.split("_")
                        iname = idx_names.get(parts[2], parts[2]) if len(parts) > 2 else "?"
                        by_index[iname] = by_index.get(iname, 0) + sz
                    else:
                        # BEING_DELETED / DELETED / CONFIG auxiliary tables
                        aux += sz
        except OSError as e:
            total = -1
        ibd = os.path.join(d, table + ".ibd")
        out_sizes[table] = {
            "fts_bytes": total,
            "fts_bytes_by_index": by_index,
            "fts_aux_tables_bytes": aux,
            "table_ibd_bytes": os.path.getsize(ibd) if os.path.exists(ibd) else -1}
    return out_sizes


def timed_alter(sql, label, results):
    t0 = time.perf_counter()
    out, err, rc = run_sql(sql)
    dt = (time.perf_counter() - t0) * 1000
    results["index_build"][label] = {"ms": round(dt, 1), "rc": rc,
                                     "stderr": err.strip()[:300]}
    print(f"  ALTER {label}: {dt:.1f} ms (rc={rc})")
    if rc != 0:
        print(f"    STDERR: {err[:500]}")
    return rc


def profile_run(queries):
    """Run queries in one session with profiling; return {label: duration_ms}.

    Two cases can share one identical SQL string (persons[মোহাম্মদ] and
    persons_prefix[মোহাম্মদ] have the same ft_bool_wild / tokens_ft SQL).
    SHOW PROFILES cannot tell them apart — and MariaDB strips /* */
    comments from the profiled text, so a comment tag does NOT
    disambiguate (tried in run 2: 0/171 durations captured). So identical
    SQL is measured ONCE and its duration is assigned to every label
    sharing it; the counts for those labels are still measured separately
    (they are equal: 37/37) and the sharing is noted here.
    """
    uniq = {}
    for q in queries:
        norm = " ".join(q["sql"].split()).rstrip(";")
        uniq.setdefault(norm, []).append(q["label"])
    script = ["SET profiling_history_size=100;", "SET profiling=1;"]
    for norm in uniq:
        script.append(norm + ";")
    script.append("SHOW PROFILES;")
    out, err, rc = run_sql("\n".join(script))
    if rc != 0:
        raise RuntimeError(f"profile run failed rc={rc}: {err[:500]}")
    durations = {}
    for line in out.strip().split("\n"):
        parts = line.split("\t")
        if len(parts) < 3:
            continue
        try:
            dur = float(parts[1])
        except ValueError:
            continue
        qtext = " ".join(parts[2].strip().split()).rstrip(";")
        for label in uniq.get(qtext, []):
            durations[label] = dur * 1000.0
    missing = [q["label"] for q in queries if q["label"] not in durations]
    if missing:
        print(f"  WARNING: no profile row for: {missing}")
        print("  SHOW PROFILES raw output (first 2000 chars):")
        print(out[:2000])
    return durations


def main():
    results = {"index_build": {}, "counts": {}, "timings_ms": {},
               "top_results": {}, "explain": {}, "app_level": {},
               "pagination": {}, "insert_maintenance": {}, "notes": [],
               "environment": {}, "probe": {}, "tokenisation": {},
               "tokens_stats": {}}

    # ---- 0. environment ------------------------------------------------------
    print("== 0. environment ==")
    out, err, rc = run_sql(
        "SELECT VERSION();"
        "SELECT @@innodb_ft_min_token_size, @@ft_min_word_len,"
        " @@innodb_ft_enable_stopword, @@innodb_ft_max_token_size,"
        " @@character_set_server, @@collation_server, @@port,"
        " @@innodb_buffer_pool_size;"
        "SELECT COUNT(*) FROM INFORMATION_SCHEMA.INNODB_FT_DEFAULT_STOPWORD;",
        db=None)
    print("  version/vars:\n" + out.strip())
    lines = out.strip().split("\n")
    results["environment"] = {
        "version": lines[0] if lines else "?",
        "ft_vars": lines[1] if len(lines) > 1 else "?",
        "default_stopword_rows": lines[2] if len(lines) > 2 else "?",
        "client": CLIENT, "socket": SOCKET or None,
        "host": HOST, "port": PORT, "database": DATABASE,
        "date": time.strftime("%Y-%m-%d"),
    }
    with open("seed.sql", "rb") as f:
        results["environment"]["seed_md5"] = hashlib.md5(f.read()).hexdigest()
    print("  seed.sql md5:", results["environment"]["seed_md5"],
          "(Phase 0.1 reference: b2164ed52f58e36d3954a42cebacad40)")

    # ---- 0b. tokenisation probe (small, controlled docs) ---------------------
    print("== 0b. tokenisation probe ==")
    probe_docs = [
        (1, "রক্তদান শিবির"),
        (2, "Blood Donation Camp — রক্তদান শিবির"),
        (3, "শীতবস্ত্র বিতরণ কর্মসূচি"),
        (4, "রক্ত দান করুন, জীবন বাঁচান"),
        (5, "the quick brown fox"),
        (6, "রক"),
        (7, "মাদ্রাসা শিক্ষার্থীদের সংবর্ধনা"),
        (8, "প্রশিক্ষণ ও শিক্ষার গুরুত্ব"),
        (9, "about time and about face"),
        (10, "is it about you"),
    ]
    sql = ["DROP DATABASE IF EXISTS probe;",
           "CREATE DATABASE probe CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;",
           "USE probe;",
           "CREATE TABLE docs (id INT PRIMARY KEY, txt TEXT) ENGINE=InnoDB "
           "DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;"]
    for i, t in probe_docs:
        sql.append(f"INSERT INTO docs VALUES ({i}, {sql_str(t)});")
    sql.append("ALTER TABLE docs ADD FULLTEXT INDEX ft_docs (txt);")
    out, err, rc = run_sql("\n".join(sql), db=None)
    if rc != 0:
        print(err[:1000]); sys.exit(1)
    out, err, rc = run_sql(
        "SET GLOBAL innodb_ft_aux_table='probe/docs';"
        "SELECT WORD FROM INFORMATION_SCHEMA.INNODB_FT_INDEX_TABLE ORDER BY WORD;",
        db=None)
    words = [l.strip() for l in out.strip().split("\n") if l.strip()]
    results["probe"]["ft_index_words"] = words
    print(f"  FT index words ({len(words)}): {words}")
    probe_queries = {
        "NL whole রক্তদান": "SELECT COUNT(*) FROM docs WHERE MATCH(txt) AGAINST('রক্তদান' IN NATURAL LANGUAGE MODE);",
        "BOOL whole রক্তদান": "SELECT COUNT(*) FROM docs WHERE MATCH(txt) AGAINST('রক্তদান' IN BOOLEAN MODE);",
        "BOOL wild রক্তদা*": "SELECT COUNT(*) FROM docs WHERE MATCH(txt) AGAINST('রক্তদা*' IN BOOLEAN MODE);",
        "BOOL wild রক* (2-char prefix)": "SELECT COUNT(*) FROM docs WHERE MATCH(txt) AGAINST('রক*' IN BOOLEAN MODE);",
        "BOOL exact রক (2-char, no wild)": "SELECT COUNT(*) FROM docs WHERE MATCH(txt) AGAINST('রক' IN BOOLEAN MODE);",
        "NL exact রক (2-char)": "SELECT COUNT(*) FROM docs WHERE MATCH(txt) AGAINST('রক' IN NATURAL LANGUAGE MODE);",
        "NL 1-char র": "SELECT COUNT(*) FROM docs WHERE MATCH(txt) AGAINST('র' IN NATURAL LANGUAGE MODE);",
        "BOOL stopword the": "SELECT COUNT(*) FROM docs WHERE MATCH(txt) AGAINST('the' IN BOOLEAN MODE);",
        "NL stopword the": "SELECT COUNT(*) FROM docs WHERE MATCH(txt) AGAINST('the' IN NATURAL LANGUAGE MODE);",
        "BOOL stopword about": "SELECT COUNT(*) FROM docs WHERE MATCH(txt) AGAINST('about' IN BOOLEAN MODE);",
        "BOOL +the +quick (stopword kills +)": "SELECT COUNT(*) FROM docs WHERE MATCH(txt) AGAINST('+the +quick' IN BOOLEAN MODE);",
        "BOOL +রক্তদান +শিবির (AND)": "SELECT COUNT(*) FROM docs WHERE MATCH(txt) AGAINST('+রক্তদান +শিবির' IN BOOLEAN MODE);",
        "BOOL রক্ত দান (OR)": "SELECT COUNT(*) FROM docs WHERE MATCH(txt) AGAINST('রক্ত দান' IN BOOLEAN MODE);",
        "BOOL phrase \"রক্তদান শিবির\"": "SELECT COUNT(*) FROM docs WHERE MATCH(txt) AGAINST('\"রক্তদান শিবির\"' IN BOOLEAN MODE);",
        "NL রক্তদান শিবির": "SELECT COUNT(*) FROM docs WHERE MATCH(txt) AGAINST('রক্তদান শিবির' IN NATURAL LANGUAGE MODE);",
        "BOOL wild শিক্ষা*": "SELECT COUNT(*) FROM docs WHERE MATCH(txt) AGAINST('শিক্ষা*' IN BOOLEAN MODE);",
    }
    for label, q in probe_queries.items():
        out, err, rc = run_sql("USE probe;\n" + q, db=None)
        results["probe"][label] = int(out.strip()) if out.strip().isdigit() else out.strip()
        print(f"  probe {label}: {results['probe'][label]}")
    run_sql("DROP DATABASE IF EXISTS probe;", db=None)

    # ---- 1. schema + seed ----------------------------------------------------
    print("== 1. loading schema + seed ==")
    for f in ("schema.sql", "seed.sql"):
        with open(f, encoding="utf-8") as fh:
            sql = fh.read()
        t0 = time.perf_counter()
        out, err, rc = run_sql(sql, db=None)
        print(f"  {f}: {(time.perf_counter()-t0)*1000:.0f} ms rc={rc}")
        if rc != 0:
            print(err[:2000]); sys.exit(1)
    out, err, rc = run_sql("SELECT (SELECT COUNT(*) FROM posts) p, "
                           "(SELECT COUNT(*) FROM persons) pe, "
                           "(SELECT COUNT(*) FROM activities) a;")
    print("  row counts (posts, persons, activities):", out.strip())
    results["counts"]["rows"] = out.strip()
    results["sizes_baseline"] = table_sizes("posts, persons, activities")
    print("  baseline sizes:", json.dumps(results["sizes_baseline"]))

    # ---- 2. indexes (default-parser FULLTEXT + B-tree) ----------------------
    print("== 2. building indexes ==")
    timed_alter("ALTER TABLE posts ADD FULLTEXT INDEX ft_posts "
                "(title_bn, body_bn);", "posts_ft", results)
    timed_alter("ALTER TABLE persons ADD FULLTEXT INDEX ft_persons "
                "(name_bn, name_en);", "persons_ft", results)
    timed_alter("ALTER TABLE activities ADD FULLTEXT INDEX ft_activities "
                "(title_bn, body_bn);", "activities_ft", results)
    timed_alter("ALTER TABLE persons ADD INDEX idx_persons_name_bn (name_bn);",
                "persons_name_btree", results)
    timed_alter("ALTER TABLE posts ADD INDEX idx_posts_title_bn (title_bn);",
                "posts_title_btree", results)
    results["sizes_indexed"] = table_sizes("posts, persons, activities")
    print("  indexed sizes:", json.dumps(results["sizes_indexed"]))

    # ---- 2b. tokens column (application-level tokenisation) ------------------
    print("== 2b. tokens column ==")
    timed_alter("ALTER TABLE posts ADD COLUMN search_tokens TEXT NULL;",
                "posts_add_tokens_col", results)
    timed_alter("ALTER TABLE persons ADD COLUMN search_tokens TEXT NULL;",
                "persons_add_tokens_col", results)
    timed_alter("ALTER TABLE activities ADD COLUMN search_tokens TEXT NULL;",
                "activities_add_tokens_col", results)
    t0 = time.perf_counter()
    updates = []
    for table, cols in [("posts", "title_bn, body_bn"),
                        ("persons", "name_bn, name_en"),
                        ("activities", "title_bn, body_bn")]:
        out, err, rc = run_sql(f"SELECT id, {cols} FROM {table} ORDER BY id;")
        n = 0
        tot_len = 0
        for line in out.strip().split("\n"):
            if not line.strip():
                continue
            parts = line.split("\t")
            rid = parts[0]
            text = " ".join(p for p in parts[1:] if p)
            toks = tokenize_text(text)
            tot_len += len(toks.encode("utf-8"))
            n += 1
            updates.append(
                f"UPDATE {table} SET search_tokens={sql_str(toks)} WHERE id={rid};")
        results["tokens_stats"][table] = {
            "rows": n, "tokens_bytes_total": tot_len,
            "tokens_bytes_avg": round(tot_len / n, 1) if n else 0}
        print(f"  tokenised {table}: {n} rows, avg {tot_len / n:.0f} bytes/row")
    with open("tokens.sql", "w", encoding="utf-8") as f:
        f.write("\n".join(updates) + "\n")
    with open("tokens.sql", encoding="utf-8") as fh:
        sql = fh.read()
    out, err, rc = run_sql(sql)
    pop_ms = (time.perf_counter() - t0) * 1000
    results["tokens_stats"]["populate_ms"] = round(pop_ms, 1)
    print(f"  tokens populate (python + {len(updates)} UPDATEs): {pop_ms:.0f} ms rc={rc}")
    if rc != 0:
        print(err[:1000]); sys.exit(1)
    timed_alter("ALTER TABLE posts ADD FULLTEXT INDEX ft_posts_tokens "
                "(search_tokens);", "posts_tokens_ft", results)
    timed_alter("ALTER TABLE persons ADD FULLTEXT INDEX ft_persons_tokens "
                "(search_tokens);", "persons_tokens_ft", results)
    timed_alter("ALTER TABLE activities ADD FULLTEXT INDEX ft_activities_tokens "
                "(search_tokens);", "activities_tokens_ft", results)
    results["sizes_tokens"] = table_sizes("posts, persons, activities")
    print("  sizes with tokens:", json.dumps(results["sizes_tokens"]))
    results["fts_sizes"] = fts_sizes()
    print("  FTS aux sizes:", json.dumps(results["fts_sizes"]))

    # ---- 3. test cases ---------------------------------------------------------
    # Same 35 case labels as Phase 0.1. Query forms per approach:
    #   ft_nl        MATCH(cols) AGAINST('term' IN NATURAL LANGUAGE MODE)
    #   ft_bool      MATCH(cols) AGAINST('+w1 +w2' IN BOOLEAN MODE) — exact words
    #   ft_bool_wild MATCH(cols) AGAINST('w*' / '+w1* +w2*' IN BOOLEAN MODE)
    #   tokens_ft    MATCH(search_tokens) AGAINST('term' IN BOOLEAN MODE)
    #                (prefixes are precomputed tokens, so no wildcard);
    #                multi-word relevance: '+w1 +w2'; spaced-compound
    #                spelling "a b": MATCH(tokens) AGAINST('ab') OR
    #                MATCH(tokens) AGAINST('+a +b') (two predicates)
    #   like_pct     LIKE '%term%' (AND-of-LIKE for multi-word)
    #   like_prefix  LIKE 'term%' on the B-tree index
    def nl(table, cols, term):
        return (f"SELECT id, MATCH({cols}) AGAINST({sql_str(term)} IN NATURAL LANGUAGE MODE) AS rel "
                f"FROM {table} WHERE MATCH({cols}) AGAINST({sql_str(term)} IN NATURAL LANGUAGE MODE) "
                f"ORDER BY rel DESC LIMIT 20;")

    def bl(table, cols, term):
        return (f"SELECT id, MATCH({cols}) AGAINST({sql_str(term)} IN BOOLEAN MODE) AS rel "
                f"FROM {table} WHERE MATCH({cols}) AGAINST({sql_str(term)} IN BOOLEAN MODE) "
                f"ORDER BY rel DESC LIMIT 20;")

    def tok(table, term):
        return (f"SELECT id, MATCH(search_tokens) AGAINST({sql_str(term)} IN BOOLEAN MODE) AS rel "
                f"FROM {table} WHERE MATCH(search_tokens) AGAINST({sql_str(term)} IN BOOLEAN MODE) "
                f"ORDER BY rel DESC LIMIT 20;")

    def tok_or(table, term1, term2):
        # spaced-compound spelling: joined token OR both parts present
        return (f"SELECT id FROM {table} WHERE "
                f"MATCH(search_tokens) AGAINST({sql_str(term1)} IN BOOLEAN MODE) "
                f"OR MATCH(search_tokens) AGAINST({sql_str(term2)} IN BOOLEAN MODE) LIMIT 20;")

    def like_pct(table, cond):
        return f"SELECT id FROM {table} WHERE {cond} LIMIT 20;"

    def plus_terms(term):
        return " ".join("+" + w for w in term.split())

    def plus_wild(term):
        return " ".join("+" + w + "*" for w in term.split())

    cases = []
    # --- posts: word matching
    for term in ["রক্তদান", "বৃত্তি", "শীতবস্ত্র", "মসজিদ", "প্রশিক্ষণ", "শ্রমিক"]:
        cases.append({"label": f"posts_word[{term}]", "group": "a_word",
                      "ft_nl": nl("posts", "title_bn, body_bn", term),
                      "ft_bool": bl("posts", "title_bn, body_bn", "+" + term),
                      "ft_bool_wild": bl("posts", "title_bn, body_bn", term + "*"),
                      "tokens_ft": tok("posts", term),
                      "like_pct": like_pct("posts", f"title_bn LIKE '%{term}%' OR body_bn LIKE '%{term}%'"),
                      "app_term": term, "app_table": "posts"})
    # --- posts: partial matching
    for term in ["রক্তদা", "শীতব", "বৃত্ত", "রক"]:
        cases.append({"label": f"posts_partial[{term}]", "group": "b_partial",
                      "ft_nl": nl("posts", "title_bn, body_bn", term),
                      "ft_bool": bl("posts", "title_bn, body_bn", "+" + term),
                      "ft_bool_wild": bl("posts", "title_bn, body_bn", term + "*"),
                      "tokens_ft": tok("posts", term),
                      "like_pct": like_pct("posts", f"title_bn LIKE '%{term}%' OR body_bn LIKE '%{term}%'"),
                      "app_term": term, "app_table": "posts"})
    # --- edge: 1-char query
    cases.append({"label": "posts_partial[র] (1-char edge)", "group": "b_partial",
                  "ft_nl": nl("posts", "title_bn, body_bn", "র"),
                  "ft_bool": bl("posts", "title_bn, body_bn", "+র"),
                  "ft_bool_wild": bl("posts", "title_bn, body_bn", "র*"),
                  "tokens_ft": tok("posts", "র"),
                  "like_pct": like_pct("posts", "title_bn LIKE '%র%' OR body_bn LIKE '%র%'"),
                  "app_term": "র", "app_table": "posts"})
    # --- posts: spelling variations
    for term in ["সাতানিপাড়া", "শাতানিপাড়া", "সাতানীপাড়া", "মাদ্রাসা",
                 "মাদরাসা", "রক্ত দান", "শীত বস্ত্র"]:
        if " " in term:
            a, b = term.split()
            tokens_q = tok_or("posts", a + b, plus_terms(term))
        else:
            tokens_q = tok("posts", term)
        cases.append({"label": f"posts_spelling[{term}]", "group": "d_spelling",
                      "ft_nl": nl("posts", "title_bn, body_bn", term),
                      "ft_bool": bl("posts", "title_bn, body_bn", plus_terms(term)),
                      "ft_bool_wild": bl("posts", "title_bn, body_bn", plus_wild(term)),
                      "tokens_ft": tokens_q,
                      "like_pct": like_pct("posts", f"title_bn LIKE '%{term}%' OR body_bn LIKE '%{term}%'"),
                      "app_term": term, "app_table": "posts"})
    # --- posts: mixed Bengali+English
    for term in ["Blood Donation", "SSC বৃত্তি", "Scholarship", "the"]:
        cases.append({"label": f"posts_mixed[{term}]", "group": "e_mixed",
                      "ft_nl": nl("posts", "title_bn, body_bn", term),
                      "ft_bool": bl("posts", "title_bn, body_bn", plus_terms(term)),
                      "ft_bool_wild": bl("posts", "title_bn, body_bn", plus_wild(term)),
                      "tokens_ft": tok("posts", plus_terms(term)),
                      "like_pct": like_pct("posts", f"title_bn LIKE '%{term}%' OR body_bn LIKE '%{term}%'"),
                      "app_term": term, "app_table": "posts"})
    # --- posts: multi-term relevance (also recorded for top-results)
    for term in ["রক্তদান শিবির", "শীতবস্ত্র বিতরণ"]:
        cases.append({"label": f"posts_relevance[{term}]", "group": "f_relevance",
                      "ft_nl": nl("posts", "title_bn, body_bn", term),
                      "ft_bool": bl("posts", "title_bn, body_bn", plus_terms(term)),
                      "ft_bool_wild": bl("posts", "title_bn, body_bn", plus_wild(term)),
                      "tokens_ft": tok("posts", plus_terms(term)),
                      "like_pct": like_pct("posts", " AND ".join(
                          f"(title_bn LIKE '%{w}%' OR body_bn LIKE '%{w}%')" for w in term.split())),
                      "app_term": term, "app_table": "posts"})
    # --- persons: names
    for term in ["মোহাম্মদ", "রহিম", "চক্রবর্তী", "শিক্ষক", "Mohammad", "মোহা"]:
        grp = "a_word" if term not in ("মোহা",) else "b_partial"
        if term == "Mohammad":
            grp = "e_mixed"
        cases.append({"label": f"persons[{term}]", "group": grp,
                      "ft_nl": nl("persons", "name_bn, name_en", term),
                      "ft_bool": bl("persons", "name_bn, name_en", "+" + term),
                      "ft_bool_wild": bl("persons", "name_bn, name_en", term + "*"),
                      "tokens_ft": tok("persons", term),
                      "like_pct": like_pct("persons", f"name_bn LIKE '%{term}%' OR name_en LIKE '%{term}%'"),
                      "app_term": term, "app_table": "persons"})
    # --- persons: prefix matching on title/name via B-tree
    cases.append({"label": "persons_prefix[মোহাম্মদ] (LIKE 'term%')", "group": "c_prefix",
                  "ft_bool_wild": bl("persons", "name_bn, name_en", "মোহাম্মদ*"),
                  "tokens_ft": tok("persons", "মোহাম্মদ"),
                  "like_prefix": like_pct("persons", "name_bn LIKE 'মোহাম্মদ%'"),
                  "app_term": "মোহাম্মদ", "app_table": "persons"})
    cases.append({"label": "posts_prefix[শিক্ষা] (LIKE 'term%')", "group": "c_prefix",
                  "ft_bool_wild": bl("posts", "title_bn, body_bn", "শিক্ষা*"),
                  "tokens_ft": tok("posts", "শিক্ষা"),
                  "like_prefix": like_pct("posts", "title_bn LIKE 'শিক্ষা%'"),
                  "app_term": "শিক্ষা", "app_table": "posts"})
    # --- activities
    for term in ["বৃত্তি", "শীতবস্ত্র", "রক্তদান"]:
        cases.append({"label": f"activities[{term}]", "group": "a_word",
                      "ft_nl": nl("activities", "title_bn, body_bn", term),
                      "ft_bool": bl("activities", "title_bn, body_bn", "+" + term),
                      "ft_bool_wild": bl("activities", "title_bn, body_bn", term + "*"),
                      "tokens_ft": tok("activities", term),
                      "like_pct": like_pct("activities", f"title_bn LIKE '%{term}%' OR body_bn LIKE '%{term}%'"),
                      "app_term": term, "app_table": "activities"})

    approaches = ["ft_nl", "ft_bool", "ft_bool_wild", "tokens_ft", "like_pct", "like_prefix"]
    print(f"  cases: {len(cases)}")

    # counts: one COUNT per case per approach (untimed, single session)
    print("== 3. counting matches per case/approach ==")
    count_sqls = []
    for c in cases:
        for ap in approaches:
            if ap not in c:
                continue
            sql = c[ap]
            inner = sql.rstrip(";")
            if "ORDER BY" in inner:
                inner = inner[:inner.index("ORDER BY")]
            if inner.rstrip().endswith("LIMIT 20"):
                inner = inner.rstrip()[:-len("LIMIT 20")]
            count_sqls.append((f"{c['label']}||{ap}", inner))
    script = []
    for label, inner in count_sqls:
        safe_label = label.replace("\\", "\\\\").replace("'", "\\'")
        script.append(f"SELECT '{safe_label}', COUNT(*) FROM ({inner}) AS t;")
    with open("count_debug.sql", "w", encoding="utf-8") as f:
        f.write("\n".join(script) + "\n")
    out, err, rc = run_sql("\n".join(script))
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
                ("ft_nl", nl("posts", "title_bn, body_bn", term).replace("LIMIT 20", "LIMIT 5")),
                ("ft_bool_wild", bl("posts", "title_bn, body_bn", plus_wild(term)).replace("LIMIT 20", "LIMIT 5")),
                ("tokens_ft", tok("posts", plus_terms(term)).replace("LIMIT 20", "LIMIT 5"))]:
            out, err, rc = run_sql(
                f"SELECT p.id, ROUND(x.rel,4), p.title_bn FROM ({sql.rstrip(';')}) AS x "
                f"JOIN posts p ON p.id=x.id;")
            results["top_results"][f"{term}||{ap}"] = out.strip()
        out, err, rc = run_sql(
            "SELECT id, title_bn FROM posts WHERE " +
            " AND ".join(f"(title_bn LIKE '%{w}%' OR body_bn LIKE '%{w}%')"
                         for w in term.split()) + " LIMIT 5;")
        results["top_results"][f"{term}||like_pct"] = out.strip()
    # NL top-20 precision probe: are all top-20 rows genuine matches?
    out, err, rc = run_sql(nl("posts", "title_bn, body_bn", "রক্তদান"))
    top20_ids = [l.split("\t")[0] for l in out.strip().split("\n") if l.strip()]
    genuine = 0
    for rid in top20_ids:
        o, _, _ = run_sql(f"SELECT COUNT(*) FROM posts WHERE id={rid} AND "
                          f"(title_bn LIKE '%রক্তদান%' OR body_bn LIKE '%রক্তদান%');")
        genuine += int(o.strip())
    results["top_results"]["precision_probe_ft_nl_রক্তদান_top20"] = (
        f"top20 ids={top20_ids} genuine(LIKE-containing)={genuine}/20")
    print(f"  NL top-20 precision for রক্তদান: {genuine}/20 genuine")

    # ---- 6. EXPLAIN ---------------------------------------------------------
    print("== 6. EXPLAIN ==")
    explains = {
        "ft_nl_word": "EXPLAIN SELECT id FROM posts WHERE MATCH(title_bn, body_bn) "
                      "AGAINST('রক্তদান' IN NATURAL LANGUAGE MODE);",
        "ft_bool_wild_prefix": "EXPLAIN SELECT id FROM posts WHERE MATCH(title_bn, body_bn) "
                               "AGAINST('রক্তদা*' IN BOOLEAN MODE);",
        "tokens_ft": "EXPLAIN SELECT id FROM posts WHERE MATCH(search_tokens) "
                     "AGAINST('রক্তদা' IN BOOLEAN MODE);",
        "like_pct": "EXPLAIN SELECT id FROM posts WHERE title_bn LIKE '%রক্তদান%' "
                    "OR body_bn LIKE '%রক্তদান%';",
        "like_prefix_btree": "EXPLAIN SELECT id FROM persons WHERE name_bn LIKE 'মোহাম্মদ%';",
        "ft_bool_2char_wild": "EXPLAIN SELECT id FROM posts WHERE MATCH(title_bn, body_bn) "
                              "AGAINST('রক*' IN BOOLEAN MODE);",
    }
    for label, sql in explains.items():
        out, err, rc = run_sql(sql)
        results["explain"][label] = out.strip()

    # ---- 7. app-level approach ----------------------------------------------
    print("== 7. app-level full-scan timings ==")
    dump = {}
    for table, cols in [("posts", "id, title_bn, body_bn"),
                        ("persons", "id, name_bn, name_en"),
                        ("activities", "id, title_bn, body_bn")]:
        t0 = time.perf_counter()
        out, err, rc = run_sql(f"SELECT {cols} FROM {table};")
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
        text_idx = [1, 2]
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
    pages_out = {}
    for label, where in [
            ("ft_nl সাতানিপাড়া",
             "MATCH(title_bn, body_bn) AGAINST('সাতানিপাড়া' IN NATURAL LANGUAGE MODE)"),
            ("ft_bool_wild সাতানিপাড়া*",
             "MATCH(title_bn, body_bn) AGAINST('সাতানিপাড়া*' IN BOOLEAN MODE)")]:
        out, _, _ = run_sql(f"SELECT COUNT(*) FROM posts WHERE {where};")
        total = int(out.strip())
        pages = {}
        for offset in (0, 10, 20):
            t0 = time.perf_counter()
            out, _, _ = run_sql(
                f"SELECT id FROM posts WHERE {where} "
                f"ORDER BY MATCH(title_bn, body_bn) AGAINST('সাতানিপাড়া' IN NATURAL LANGUAGE MODE) DESC "
                f"LIMIT 10 OFFSET {offset};")
            dt = (time.perf_counter() - t0) * 1000
            ids = [int(x) for x in out.strip().split("\n") if x.strip()]
            pages[offset] = {"ms": round(dt, 2), "ids": ids}
        overlap = (set(pages[0]["ids"]) & set(pages[10]["ids"])) | \
                  (set(pages[0]["ids"]) & set(pages[20]["ids"])) | \
                  (set(pages[10]["ids"]) & set(pages[20]["ids"]))
        pages_out[label] = {"total_matching": total, "pages": pages,
                            "overlap_between_pages": sorted(overlap)}
        print(f"  {label}: total={total}, overlap={sorted(overlap)}")
    results["pagination"] = pages_out

    # ---- 9. insert maintenance ------------------------------------------------
    print("== 9. insert maintenance ==")
    ins_vals = ", ".join(
        f"('notice','published','পরীক্ষামূলক নোটিশ {i} রক্তদান','পরীক্ষামূলক বডি {i} সাতানিপাড়া')"
        for i in range(100))
    t0 = time.perf_counter()
    out, err, rc = run_sql(
        f"INSERT INTO posts (category, status, title_bn, body_bn) VALUES {ins_vals};")
    ins_ms = (time.perf_counter() - t0) * 1000
    run_sql("DELETE FROM posts WHERE title_bn LIKE 'পরীক্ষামূলক নোটিশ%';")
    # with tokens: same 100 rows, tokens computed in Python first
    ins_vals_tok = []
    for i in range(100):
        t = f"পরীক্ষামূলক নোটিশ {i} রক্তদান"
        b = f"পরীক্ষামূলক বডি {i} সাতানিপাড়া"
        ins_vals_tok.append(
            f"('notice','published',{sql_str(t)},{sql_str(b)},{sql_str(tokenize_text(t + ' ' + b))})")
    t0 = time.perf_counter()
    out, err, rc = run_sql(
        "INSERT INTO posts (category, status, title_bn, body_bn, search_tokens) VALUES "
        + ", ".join(ins_vals_tok) + ";")
    ins_tok_ms = (time.perf_counter() - t0) * 1000
    run_sql("DELETE FROM posts WHERE title_bn LIKE 'পরীক্ষামূলক নোটিশ%';")
    results["insert_maintenance"] = {
        "insert_100_rows_main_ft_only_ms": round(ins_ms, 1),
        "insert_100_rows_with_tokens_ms": round(ins_tok_ms, 1),
        "note": "single multi-row INSERT of 100 rows each, wall time incl. client round-trip; "
                "tokens variant includes the precomputed search_tokens value in the INSERT "
                "(Python tokenise time NOT included — it is <1 ms/row at this scale)"}
    print(f"  insert 100 rows main-FT only: {ins_ms:.1f} ms; with tokens: {ins_tok_ms:.1f} ms")

    # ---- 10. tokenisation evidence from the bench tables ---------------------
    print("== 10. tokenisation evidence (bench/posts FT index) ==")
    out, err, rc = run_sql(
        "SET GLOBAL innodb_ft_aux_table='bench/posts';"
        "SELECT DISTINCT WORD FROM INFORMATION_SCHEMA.INNODB_FT_INDEX_TABLE "
        "WHERE WORD LIKE 'রক্ত%' OR WORD LIKE 'শিক্ষ%' ORDER BY WORD LIMIT 20;",
        db=None)
    results["tokenisation"]["posts_words_রক্ত_শিক্ষ"] = out.strip()
    out, _, _ = run_sql(
        "SELECT COUNT(*) FROM INFORMATION_SCHEMA.INNODB_FT_INDEX_TABLE WHERE WORD='রক';",
        db=None)
    results["tokenisation"]["word_রক_indexed"] = out.strip()
    out, _, _ = run_sql(
        "SELECT COUNT(*) FROM INFORMATION_SCHEMA.INNODB_FT_INDEX_TABLE WHERE WORD='the';",
        db=None)
    results["tokenisation"]["word_the_indexed"] = out.strip()
    out, _, _ = run_sql(
        "SELECT COUNT(DISTINCT DOC_ID) FROM INFORMATION_SCHEMA.INNODB_FT_INDEX_TABLE "
        "WHERE WORD='রক্তদান';", db=None)
    results["tokenisation"]["word_রক্তদান_index_docs"] = out.strip()
    print(f"  রক indexed rows: {results['tokenisation']['word_রক_indexed']}; "
          f"the indexed rows: {results['tokenisation']['word_the_indexed']}")

    # ---- write outputs ---------------------------------------------------------
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"wrote {OUT_JSON}")

    md = ["# Bengali search benchmark — RAW RESULTS (MariaDB rebuild)",
          "",
          f"Generated by run_benchmark.py on {results['environment']['date']}. "
          f"Server: **{results['environment']['version']}** "
          f"(port {results['environment']['port']}, socket {results['environment']['socket'] or 'TCP'}, "
          f"database `{DATABASE}`). All numbers are measured on this server; "
          "see README.md / 16-MARIADB-ADDENDUM.md §3.4 for interpretation. Dataset is SYNTHETIC.",
          "",
          "## Environment",
          "",
          f"- version: `{results['environment']['version']}`",
          f"- ft vars (min_token, ft_min_word_len, stopword enabled, max_token, charset, collation, port, buffer_pool): `{results['environment']['ft_vars']}`",
          f"- default stopword rows: {results['environment']['default_stopword_rows']}",
          f"- seed.sql md5: `{results['environment']['seed_md5']}` (Phase 0.1 reference b2164ed52f58e36d3954a42cebacad40)",
          "",
          "## Row counts", "", "```", results["counts"]["rows"], "```", "",
          "## Tokenisation probe (10 controlled docs, `probe` database)",
          "",
          f"- FT index words ({len(results['probe']['ft_index_words'])}): "
          + ", ".join(results["probe"]["ft_index_words"]),
          ""]
    for k, v in results["probe"].items():
        if k != "ft_index_words":
            md.append(f"- {k}: {v}")
    md += ["", "## Table sizes (bytes)", "",
           "| table | rows | data_length | index_length |",
           "|---|---|---|---|---|"]
    for name, s in results["sizes_tokens"].items():
        md.append(f"| {name} | {s['rows']} | {s['data_length']} | {s['index_length']} |")
    md += ["", "Baseline (before indexes):", ""]
    for name, s in results["sizes_baseline"].items():
        md.append(f"- {name}: data={s['data_length']} index={s['index_length']}")
    md += ["", "After main FT + B-tree indexes:", ""]
    for name, s in results["sizes_indexed"].items():
        md.append(f"- {name}: data={s['data_length']} index={s['index_length']}")
    md += ["", "True FULLTEXT index sizes (FTS auxiliary-table files on disk; "
           "INFORMATION_SCHEMA INDEX_LENGTH excludes FT data — see README):", ""]
    for name, s in results.get("fts_sizes", {}).items():
        md.append(f"- {name}: {s}")
    md += ["", "## Tokens column stats", ""]
    for k, v in results["tokens_stats"].items():
        md.append(f"- {k}: {v}")
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
    md += ["", "## Pagination", ""]
    for label, p in results["pagination"].items():
        md.append(f"- {label}: total matching {p['total_matching']}, "
                  f"overlap between pages: {p['overlap_between_pages']}")
        for off, pg in p["pages"].items():
            md.append(f"  - OFFSET {off}: {pg['ms']} ms, ids {pg['ids']}")
    md += ["", "## Insert maintenance", "",
           f"- insert 100 rows, main FT only: {results['insert_maintenance']['insert_100_rows_main_ft_only_ms']} ms",
           f"- insert 100 rows, with tokens: {results['insert_maintenance']['insert_100_rows_with_tokens_ms']} ms",
           "", "## EXPLAIN", ""]
    for k, v in results["explain"].items():
        md += [f"### {k}", "", "```", v, "```", ""]
    md += ["## Top-5 relevance samples", ""]
    for k, v in results["top_results"].items():
        md += [f"### {k}", "", "```", v, "```", ""]
    md += ["", "## Tokenisation evidence (bench/posts FT index)", ""]
    for k, v in results["tokenisation"].items():
        md += [f"- {k}:", "", "```", str(v), "```", ""]
    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.write("\n".join(md) + "\n")
    print(f"wrote {OUT_MD}")


if __name__ == "__main__":
    main()
