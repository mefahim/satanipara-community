#!/usr/bin/env python3
"""
Satanipara Community — Bengali search benchmark (MariaDB rebuild):
application-level tokeniser for the `tokens_ft` approach.

What it does
------------
Given a piece of Bengali / English-mixed text, produce the space-separated
token string stored in a table's `search_tokens` column. The column is then
indexed with a plain default-parser FULLTEXT index, and searched with
`MATCH(search_tokens) AGAINST('<term>' IN BOOLEAN MODE)`.

Tokens emitted for each word (word = maximal run of non-punctuation,
non-space characters; punctuation = Unicode categories P* and S*):
  1. the word itself (lowercased — affects Latin only);
  2. every proper prefix of the word of length >= 2 characters
     (e.g. 'রক্তদান' -> 'রক', 'রক্ত', 'রক্তদ', 'রক্তদা', 'রক্তদান');
  3. for each adjacent word pair, the de-spaced join ('রক্ত' + 'দান'
     -> 'রক্তদান') and every proper prefix of that join of length >= 2
     (so a spaced spelling 'রক্ত দান' is findable by the query 'রক্তদান'
     and by the partial query 'রক্তদা').

What it deliberately does NOT do (v1)
--------------------------------------
  * No spelling-variant expansion: 'সাতানিপাড়া' does NOT emit
    'শাতানিপাড়া' / 'সাতানীপাড়া'. Variant tolerance would need a
    curated variant map maintained by the application; that is future
    work, and the benchmark measures the gap (see queries.md group (d)).
  * No transliteration: Bengali words do NOT emit Latin transliterations
    ('রক্তদান' does not emit 'roktodan'). Mixed BN/EN matching relies on
    the text actually containing both scripts.
  * No stemming: 'শিক্ষার্থীদের' does not emit 'শিক্ষা' as a separate
    token — but its prefix tokens DO include 'শিক্ষা' (prefix of length
    5), so a query for 'শিক্ষা' matches it. Prefix tokens are the whole
    point: they turn the default parser's whole-word index into a
    prefix-capable index without any server feature.

Known limits (measured — see run_benchmark.py / raw_results.md)
---------------------------------------------------------------
  * Tokens shorter than innodb_ft_min_token_size (3 on MariaDB 11.8.9,
    default) are NOT indexed, even when they are in the column. The
    2-character prefix tokens ('রক', 'মো', ...) are therefore dead
    weight in the index: a query for a 2-character term returns 0 rows
    through MATCH(search_tokens). 2-character queries must be routed to
    the boolean-wildcard path (`term*` on the main FULLTEXT index),
    which DOES expand 2-character prefixes (verified in the probe).
    1-character terms return 0 rows everywhere; the application must
    require >= 2 characters per term.
  * Prefixes are emitted exactly as typed, INCLUDING prefixes ending in
    a combining mark ('রক্তদা' ends in vowel sign া, 'রক্' ends in
    hasant). Verified by probe on MariaDB 11.8.9 (2026-11-14): the
    default parser indexes such tokens and MATCH finds them. Stripping
    them (as an earlier tokeniser version did) deletes the exact text a
    user has typed mid-word and makes partial queries return 0 rows.
  * Tokens longer than innodb_ft_max_token_size (84) are dropped; words
    are capped at 84 characters here so the stored column never
    contains a token the index would silently ignore.
  * The tokens column roughly triples the indexed text volume (measured
    in the benchmark: index sizes are recorded in raw_results.json).
    It must be maintained by the application on every INSERT/UPDATE
    (model observer / mutator) — the database cannot derive it, because
    MariaDB has no equivalent of MySQL's ngram parser and generated
    columns cannot run this tokeniser.

Deterministic: same input text -> same token string (sorted, deduped).
"""
import re
import unicodedata

MAX_TOKEN_LEN = 84  # == innodb_ft_max_token_size (MariaDB default)
MIN_PREFIX_LEN = 2


def _words(text):
    """Split text into words, stripping punctuation/symbols.

    Bengali combining marks (vowel signs, hasant, etc.) are Unicode
    category Mn/Mc, NOT punctuation, so they survive — 'শিক্ষার্থীদের'
    stays one word. Em-dash, comma, full stop, quotes, brackets are
    category P*/S* and split words, matching the default parser's own
    tokenisation (verified against INNODB_FT_INDEX_TABLE, see probe).
    """
    out = []
    cur = []
    for ch in text:
        cat = unicodedata.category(ch)
        if ch.isspace() or cat.startswith("P") or cat.startswith("S"):
            if cur:
                out.append("".join(cur))
                cur = []
        else:
            cur.append(ch)
    if cur:
        out.append("".join(cur))
    return out


def _prefixes(word):
    """Word itself + proper prefixes of length >= MIN_PREFIX_LEN.

    All prefixes are emitted EXACTLY as typed, including prefixes ending
    in a combining mark. Verified by probe (probe2 database, MariaDB
    11.8.9, 2026-11-14): the default parser indexes a token ending in
    hasant ('রক্' — indexed, MATCH returns 1 row) and tokens ending in
    vowel signs ('রক্তদা' — 2 rows, 'শিক্ষা' — 2 rows, 'মাদ্রাসা' —
    1 row). An earlier version of this tokeniser stripped trailing
    combining marks, which wrongly deleted the token 'রক্তদা' — the
    exact text a user has typed after 6 keystrokes of 'রক্তদান' — and
    made the tokens approach return 0 rows for that partial query.
    Never strip; the parser keeps them.
    """
    toks = set()
    w = word.lower()[:MAX_TOKEN_LEN]
    if len(w) < MIN_PREFIX_LEN:
        return toks
    toks.add(w)
    for i in range(MIN_PREFIX_LEN, len(w)):
        toks.add(w[:i])
    return toks


def tokenize_text(text):
    """Return the sorted, space-joined token string for `text`."""
    words = _words(text or "")
    toks = set()
    for w in words:
        toks |= _prefixes(w)
    for a, b in zip(words, words[1:]):
        # Skip joins involving digits ('কর্মসূচি' + '2026' would emit the
        # junk token 'কর্মসূচি2026', which no query ever contains).
        if any(ch.isdigit() for ch in a + b):
            continue
        joined = (a + b).lower()[:MAX_TOKEN_LEN]
        if len(joined) >= MIN_PREFIX_LEN:
            toks |= _prefixes(joined)
    return " ".join(sorted(toks))


if __name__ == "__main__":
    import sys
    for sample in [
        "রক্তদান শিবির",
        "রক্ত দান করুন, জীবন বাঁচান",
        "Blood Donation Camp — রক্তদান শিবির",
        "মাদ্রাসা শিক্ষার্থীদের সংবর্ধনা",
        "শীতবস্ত্র বিতরণ কর্মসূচি 2026",
    ]:
        print(f"{sample!r}\n  -> {tokenize_text(sample)}\n")
    if len(sys.argv) > 1:
        print(tokenize_text(" ".join(sys.argv[1:])))
