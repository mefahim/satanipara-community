# FONT_COMPARISON.md — Satanipara Community, DIRECTION D

Date: 2026-11-14 | Status: **PROVISIONAL recommendation — not screenshot-verified.**
Builds on `../redesign/TYPOGRAPHY_RESEARCH.md` (candidate table, per-font
assessments, comparison matrix, QA checklist) — it is not repeated here from
scratch; this document adds (a) new verification evidence, (b) one extra face
(Alkatra) checked and excluded, and (c) the Direction D hierarchy, which is
deliberately different from the broadsheet redesign's system.

> ⚠️ VERIFICATION LIMIT — READ FIRST
> Google Fonts **does load in this environment** (see §5 — this corrects the
> earlier audit-sandbox finding), and the font files themselves were inspected
> (§4). But **no rendered screenshot was taken**: no browser was available to
> this researcher, so no claim is made that any face was *seen* rendered.
> The recommendation is evidence-based (catalogue facts + font-file shaping
> data + published design notes). The final decision MUST be confirmed from
> actual rendered screenshots of `FONT_COMPARISON.html` during build QA.
> If screenshots contradict this recommendation, the screenshots win.

## 1. What the ui-ux-pro-max skill search returned

Script invoked by full path with python3 (per the skill's SKILL.md):
`~/workspace/satanipara-community-website/redesign/.agents/skills/ui-ux-pro-max/scripts/search.py`

| Query | Domain | Result | Useful? |
|---|---|---|---|
| `Bengali fonts typography pairing` | `typography` | 1 result: "Bold Typography Mobile" — Inter (sans workhorse) + Playfair Display Italic (quotes only) + JetBrains Mono (labels). No Bengali content. | Partly. No Bengali pairing exists in the skill's database, but the *structure* — one confident sans workhorse, serif reserved for quotes — independently matches the Direction D approach. |
| `Bengali sans serif variable` | `google-fonts` | 8 results, incl. Noto Sans Bengali (wght 100–900, wdth 62.5–100), Noto Serif Bengali (same axes), Anek Bangla (wght 100–800, wdth 75–125), Baloo Da 2 (wght 400–800), Mina (400/700). | Yes — corroborates the Google Fonts metadata API (§3) exactly. |
| `serif display editorial` | `typography` | 5 generic Latin editorial pairings (Playfair/Inter, Cormorant/Libre Baskerville, Newsreader/Roboto…). No Bengali content. | As a negative: this is the broadsheet pattern (serif display + sans body). Direction D deliberately does NOT use it. |

Verdict on the skill: its font data is accurate where it covers Bengali faces,
but it holds **no Bengali-specific pairing guidance** — all pairing
recommendations in this document come from the Google Fonts catalogue,
font-file inspection, and the prior TYPOGRAPHY_RESEARCH.md, not from the skill.

## 2. Candidates — verified facts (Google Fonts metadata API, 2026-11-14)

All Bengali-subset families on Google Fonts (complete list from
`https://fonts.google.com/metadata/fonts`, fetched 2026-11-14, 200, 2.7 MB):
Alkatra, Anek Bangla, Atma, Baloo Da 2, Galada, Google Sans, Hind Siliguri,
Mina, Noto Sans Bengali, Noto Serif Bengali, Tiro Bangla. (Google Sans is
proprietary and not servable via css2 for general use — excluded without
further consideration. Noto Sans Bengali UI is not in the public metadata.)

| Font | Designer | Category | Weights / axes | Italic | Licence |
|---|---|---|---|---|---|
| **Anek Bangla** | Ek Type | Sans Serif | Variable wght 100–800, wdth 75–125 | No (synthetic only) | OFL 1.1 |
| **Tiro Bangla** | Tiro Typeworks (Hudson/Ross) | Serif | 400 only, no variable | Yes — true italic 400 | OFL 1.1 |
| **Noto Sans Bengali** | Google | Sans Serif | Variable wght 100–900, wdth 62.5–100 | No | OFL 1.1 |
| **Noto Serif Bengali** | Google | Serif | Variable wght 100–900, wdth 62.5–100 | No — see note | OFL 1.1 |
| **Baloo Da 2** | Ek Type | Display | Variable wght 400–800 | No | OFL 1.1 |
| **Hind Siliguri** | Indian Type Foundry | Sans Serif | Static 300/400/500/600/700 | No | OFL 1.1 |
| **Alkatra** (new) | Suman Bhandary | Display | Variable wght 400–700 | No | OFL 1.1 |
| **Manrope** (English) | Mikhail Sharanda | Sans Serif | Variable wght 200–800 | No | OFL 1.1 |

Notes:
- Noto Serif Bengali: a css2 request with `ital` returned HTTP 200, but the
  metadata lists no italic axis and no italic style — the API silently ignores
  the axis. Treat as **no true italic** (same as the prior research).
- Hind Siliguri / Atma: a css2 range request (`wght@300..700`) returns HTTP 400
  because they are static families; explicit weights (`wght@300;400;500;600;700`)
  return 200. Atma (static 300–700) and Galada (400 only) and Mina (400/700)
  were considered and excluded: display-only or decorative, no role the
  shortlist does not already fill better (same reasoning as the prior research).
- Alkatra (new in this round): display face inspired by Bengal wall graffiti
  drawn with stick and tar; 4 weights; OFL. **Excluded**: the graffiti voice
  is the wrong register for a 27-year-old sangha's trust surfaces (accounts,
  request status, committee), and third-party catalogue data reports only
  ~84 Bengali glyphs — thin coverage for conjunct-heavy civic copy. It is in
  the specimen so the exclusion is visible, not assumed.

## 3. Per-font judgement (new evidence in bold)

### Anek Bangla — the Direction D workhorse
- **New: font-file probe (§4) confirms full Bengali shaping data** — `cjct`,
  `half`, `blwf`, `rphf`, `vatu` features present; all digits ০–৯, hasant and
  vowel signs in cmap; single-glyph ligatures for ক্ষ and জ্ঞ; 348 ligature
  rules. Ra-phala conjuncts (ত্র শ্র ফ্র ব্র হ্র) form via below-base
  substitution (`blwf`), which is present — as in every candidate.
- Tall x-height, open spacing, matched Latin for mixed lines; width axis
  75–125 is the widest of any Bengali face (Noto only narrows, 62.5–100) —
  the condensed end gives display headlines a distinct voice without a
  second family. TDC 2022 award. Weaknesses unchanged: no true italic;
  youngest candidate, least battle-tested in long body copy.

### Tiro Bangla — demoted to pull-quotes only in Direction D
- **New: probe confirms its shaping data is complete** (357 ligature rules;
  single-glyph ligatures for ক্ষ ষ্ট জ্ঞ ন্ত ণ্ড স্থ — the most of any face
  after Noto Serif Bengali; all components of শ্রী present). This does NOT
  clear the old pdkef fontkit-hang flag — that was a PDF-tooling shaping
  path, not a browser path — but there is no font-file evidence of a
  missing শ্র/ফ্র glyph. Visual QA in a browser is still mandatory.
- Single weight 400 remains the hard limit: it cannot carry a hierarchy by
  itself. In Direction D it is used exactly where 400 + true italic is a
  virtue — pull quotes — and nowhere else.

### Noto Serif Bengali — quote fallback / display fallback
- **New: widest shaping data of the set** — 522 ligature rules, 665 glyphs in
  the 400 Bengali subset; single-glyph ligatures for ক্ষ ষ্ট জ্ঞ ন্ত ণ্ড স্থ.
  Real bold to 900. No true italic; no `half`/`vatu` features (its conjuncts
  resolve through ligatures + `blwf` instead). Bookish, correct, unmemorable
  — the safe serif.

### Noto Sans Bengali — runner-up workhorse
- **New: thinnest ligature set (108 rules)** — but that is a design choice,
  not a defect: Noto Sans forms most conjuncts via half-forms/contextual
  substitution, and it is the most deployed Bengali web face in existence.
  All digits/signs present; `cjct`/`half`/`blwf`/`rphf`/`vatu` all present.
  The zero-risk workhorse if Anek fails visual QA.

### Baloo Da 2 — not recommended (unchanged)
Rounded, playful; wrong tone at institutional scale. 318 ligature rules,
shaping data complete — the rejection is tonal, not technical.

### Hind Siliguri — incumbent, fallback only (unchanged)
Static 300–700, no variable axis, no italic. 385 ligature rules; shaping
data complete. The reported malformed digit ১ is still unverified anywhere —
it must be checked visually if Hind Siliguri is ever used for numerals.

### Alkatra — considered and excluded (new)
Graffiti display voice; thin reported glyph coverage (~84 Bengali glyphs).
265 ligature rules; shaping data present but the face is wrong for this
client and its coverage is the thinnest of the set.

## 4. Font-file shaping probe (new evidence — what it is and is not)

Method (no installs; fontTools 4.46.0 already present in this VM): downloaded
each family's Bengali-subset woff2 at weight 400 from the live css2 API and
inspected cmap + GSUB with fontTools. Test strings: ক্ষ ত্র ষ্ট জ্ঞ শ্র ফ্র
ব্র হ্র ন্ত ণ্ড স্থ + শ্রী + ০১২৩৪৫৬৭৮৯.

| Face | Glyphs (400 subset) | Ligature rules | Single-glyph ligatures among the 11 test conjuncts | Digits/signs missing |
|---|---|---|---|---|
| Anek Bangla | 517 | 348 | ক্ষ, জ্ঞ | none |
| Tiro Bangla | 460 | 357 | ক্ষ, ষ্ট, জ্ঞ, ন্ত, ণ্ড, স্থ | none |
| Noto Sans Bengali | 405 | 108 | ক্ষ, ষ্ট, জ্ঞ, ণ্ড | none |
| Noto Serif Bengali | 665 | 522 | ক্ষ, ষ্ট, জ্ঞ, ন্ত, ণ্ড, স্থ | none |
| Baloo Da 2 | 483 | 318 | ক্ষ, জ্ঞ | none |
| Hind Siliguri | 492 | 385 | ক্ষ, জ্ঞ | none |
| Alkatra | 397 | 265 | ক্ষ, জ্ঞ | none |

What this proves: every candidate contains all component codepoints, all
Bengali digits, hasant and vowel signs, and a complete Indic shaping feature
set (`akhn`, `rphf`, `blwf`, `half`/`cjct` as applicable). No candidate is
missing a test conjunct at the font-file level.
What it does NOT prove: how any conjunct *looks* when rendered. Ra-phala
conjuncts (ত্র শ্র ফ্র ব্র হ্র) appear in no face as a single ligature — they
are formed by below-base substitution, which is standard Bengali shaping and
present in all seven faces — but whether the rendered join is clean, whether
vowel signs collide at small sizes, and whether শ্রী renders correctly can
only be settled by a screenshot. **This probe narrows the risk; it does not
replace visual QA.**

## 5. Font-loading verification — LOADED in this environment

Exact checks run 2026-11-14 from this VM (curl, short timeouts, no retries):

| Check | Result |
|---|---|
| `curl fonts.googleapis.com/css2?family=Anek+Bangla:wght@400;700` | HTTP 200 in 1.02s |
| `curl fonts.gstatic.com` (root) | HTTP 404 in 0.66s — expected; the root path does not exist. Not a failure. |
| `curl fonts.googleapis.com/` (root) | HTTP 404 — expected; same reason. |
| css2 for Tiro Bangla, Noto Sans/Serif Bengali, Baloo Da 2, Manrope, Galada, Mina, Alkatra | HTTP 200 each |
| Actual woff2 download (Anek Bangla Bengali subset, from the css2 response URL) | HTTP 200, 155,676 bytes in 0.90s; `file` reports valid WOFF2 |
| All 7 Bengali-subset woff2 files (400) | Downloaded, valid `wOF2` magic bytes, 41–82 KB each |

**Result: LOADED.** Google Fonts (css2 API + gstatic font files) is reachable
from this VM on 2026-11-14. This corrects the earlier audit-sandbox finding
that Google Fonts could not load — that sandbox evidently differed from this
environment. Consequence: the specimen file can be meaningfully screenshot-
checked from a browser running in/near this environment, and the "fonts
cannot load here" blocker no longer applies. The choice still stays
PROVISIONAL because no rendered screenshot exists yet.

## 6. Comparison matrix (updated — ★ = best in row)

| Criterion | Anek Bangla | Tiro Bangla | Noto Sans Bengali | Noto Serif Bengali | Baloo Da 2 | Hind Siliguri | Alkatra |
|---|---|---|---|---|---|---|---|
| Character beauty | Modern, confident | ★ literary, distinctive | Neutral | Bookish, calm | Playful | Neutral-humanist | Graffiti, brash |
| Conjunct shaping data (§4) | ★ complete | ★ complete (most single ligatures) | Complete (half-form path) | ★ most ligatures (522) | Complete | Complete | Complete, thin coverage |
| Readability at small sizes | ★ tall x-height | Poor (400 only) | ★ proven | Fair | Fair | Good | Poor |
| Weight consistency / hierarchy | ★ 100–800 + width | 400 only | ★ 100–900 | ★ 100–900 | 400–800 | 300–700 static | 400–700 |
| Heading personality | ★ weight-led, modern | ★ literary | Neutral | Calm | Playful | Neutral | Street-poster |
| Paragraph readability | Good (check word-space) | Not for paragraphs | ★ proven | ★ proven (serif) | Poor | Good | Not for paragraphs |
| Mixed BN/EN lines | ★ matched Latin | Good | ★ matched Latin | ★ matched Latin | Good | Good | Fair |
| Performance (variable = 1 file) | ★ 1 file | 2 small files | ★ 1 file | ★ 1 file | 1 file | 5 static files | 1 file |
| Risk | Low–medium | Medium (visual শ্র check) | Low | Low | Low (wrong tone) | Low (digit ১ check) | Medium (tone + coverage) |

## 7. RECOMMENDATION — Direction D typographic hierarchy

**Primary system: Anek Bangla variable as the single confident workhorse**
(display + UI + body), **weight-led, not size-led**; Tiro Bangla italic
reserved for pull-quotes only; Manrope for English.

| Role | Face / stack | Size | Weight / width | Line-height |
|---|---|---|---|---|
| Hero display (BN) | `'Anek Bangla','Noto Sans Bengali','Hind Siliguri',sans-serif` | clamp(2.75rem, 6vw, 4.25rem) | 800, wdth 78–85 | 1.15 |
| Section title (BN) | Anek Bangla | clamp(1.6rem, 3vw, 2.25rem) | 700, wdth 90–100 | 1.25 |
| Subhead / card title (BN) | Anek Bangla | 20–22px | 600–700 | 1.4 |
| Body (BN) | Anek Bangla | 17px | 400 | 1.85 |
| UI / labels / buttons (BN) | Anek Bangla | 15–16px | 600 (buttons 600–700) | 1.6 |
| Kicker / eyebrow (BN) | Anek Bangla | 14px | 600, forest green, with a small gold diamond marker (◆, never a rule) | 1.5 |
| Pull quote (BN) | `'Tiro Bangla','Noto Serif Bengali',serif` italic | clamp(1.5rem, 3vw, 2rem) | 400 italic only | 1.5 |
| English display | `'Manrope','Anek Bangla',sans-serif` | same scale as BN, −10% | 800 | 1.2 |
| English body | Manrope | 16px | 400 | 1.65 |
| Numerals / stats | Anek Bangla 700–800 (Bengali numerals ০–৯ in BN copy); Manrope 700 (Latin numerals) | 28–40px for stats | 700–800 | 1.2 |

Load only the weights used (Anek variable wght 100–800 + wdth axis;
Tiro 400 + italic; Manrope 400/600/700/800) via `display=swap`, subsets
`bengali,latin`. `lang="bn"` on Bengali blocks, `lang="en"` on English runs.

### How this differs from the broadsheet redesign (not a silent repeat)
The broadsheet system was **serif-led and size-led**: Tiro Bangla 400 as the
hero/section display face, hierarchy created by making the serif bigger,
gold rules as structural dividers, newspaper voice throughout. Direction D
inverts every one of those decisions:
- **Display voice:** sans, not serif. The hero is Anek 800 condensed — the
  hierarchy is created by *weight and width*, not by size. The hero is in
  fact slightly *smaller* than the broadsheet hero at the top of its clamp.
- **Serif role:** Tiro is demoted from structural display face to a single
  accent voice (pull quotes, italic only). If Tiro is removed entirely, the
  system still works — in the broadsheet system, removing Tiro removed the
  identity.
- **Dividers:** no gold rules as structure. Gold appears only as small
  accents (kicker marker, button hover, a single diamond) — the page is held
  together by whitespace and weight contrast, not rules.
- **Voice:** modern premium / creative-studio (Apple-like weight-led system)
  rather than civic-broadsheet / newspaper.
- **Layout role of type:** type does not carry the editorial frame; the frame
  is space and colour, and type is the confident voice inside it.

The evidence still points to Tiro+Anek as the best *faces* — that is why the
faces recur. What changes is the *system*: which face leads, what creates
hierarchy, and what the serif is for. That is a genuine difference in design,
not a relabelling.

### Runner-up — same Direction D idea, different face
If Anek fails screenshot QA (conjuncts, word-space, small-size rendering):
- Workhorse: `'Noto Sans Bengali','Hind Siliguri',sans-serif` variable
  100–900, same weight-led scale (display 800, section 700, body 400).
- Quotes: `'Noto Serif Bengali',serif` at 600–700 (real bold replaces the
  Tiro italic voice; no fake italic).
- English unchanged (Manrope). No layout, spacing or component change is
  needed for this swap — the Direction D layout is font-swap-safe by design.

### Fallback stack (if Google Fonts is unreachable at runtime)
- Bengali: `'Anek Bangla','Noto Sans Bengali','Hind Siliguri',sans-serif`
  (system Bengali fonts take over; verified readable in the prior research).
- English: `'Manrope','Anek Bangla',sans-serif`.
- Revert option if the whole Direction D idea is rejected: the broadsheet
  Tiro-led system in `../redesign/TYPOGRAPHY_RESEARCH.md` (unchanged).

### Typographic rules (carried over, unchanged)
1. Bengali body never below 15px (16–17px standard); Bengali sized ~10%
   larger than Latin at the same level; line-height 1.85 Bengali body,
   1.15–1.25 Bengali display.
2. Never letter-space Bengali; never set Bengali in uppercase transforms.
3. Never fake-bold Tiro (400 only) or fake-italic Anek/Noto — if the face
   lacks the weight/style, use size, colour, or the fallback face instead.
4. Conjunct test string at QA: `ক্ষ ত্র ষ্ট জ্ঞ শ্র ফ্র ব্র হ্র ন্ত ণ্ড স্থ`
   + `শ্রী` + numerals `০১২৩৪৫৬৭৮৯`.
5. Bengali numerals ০–৯ in Bengali copy; check ১ specifically in Anek and
   Hind Siliguri at QA.

## 8. QA checklist — still needs a real browser

- [ ] Screenshot `FONT_COMPARISON.html` in Chrome, Safari, Android Chrome at 360px + 1280px.
- [ ] Conjunct rows: every conjunct forms as one joined shape in Anek at 17px body and at 48px display; no visible hasant + separate letters. Pay special attention to শ্র / ফ্র / ত্র (ra-phala, below-base path).
- [ ] শ্রী renders correctly in Anek (body) and Tiro (quote) — the everyday honorific must not break.
- [ ] Bengali numerals ০১২৩৪৫৬৭৮৯ render correctly in Anek at body size; check ১ in Anek and Hind Siliguri.
- [ ] No synthetic bold/italic anywhere (inspect computed styles; Tiro headings must be 400, Anek must never be oblique).
- [ ] Mixed line "প্রবাসে থেকেও থাকুন পরিবারের কাছাকাছি। — Satanipara Community" reads as one line height, no size jump between scripts.
- [ ] Anek condensed display (wdth ~78, 800) at hero size: no clipping of vowel signs or the মাত্রা at line-height 1.15.
- [ ] Fallback test: block Google Fonts; page still reads cleanly in system Bengali fonts.
- [ ] The specimen's live "Font-load status" box (top) reports every face loaded in the QA browser; any face reported not-loaded is a fail, not a pass.
- [ ] If any check fails: swap to the runner-up system (§7), re-screenshot, record the swap and the failing evidence in the QA report. Screenshots win over this document.

## 9. Sources

- Google Fonts metadata API (`fonts.google.com/metadata/fonts`, fetched
  2026-11-14): complete Bengali-subset family list, axes, weights, categories.
- Google Fonts css2 API + gstatic woff2 downloads (2026-11-14): per-family
  availability, Bengali subsets, file validity.
- fontTools 4.46.0 GSUB/cmap inspection of the 7 downloaded Bengali-subset
  woff2 files (2026-11-14): shaping features, ligature rules, digit/sign
  coverage. Method and limits in §4.
- ui-ux-pro-max skill search (local CSV data): typography + google-fonts
  domains — see §1 for exactly what it returned and its limits.
- FontArray catalogue pages: Anek Bangla
  (fontarray.com/font/google-anek-bangla), Alkatra
  (fontarray.com/font/google-alkatra); Fontpair / Figma / easyindiantyping
  for Alkatra provenance (Suman Bhandary, Jan 2023, OFL, graffiti origin).
- Prior research: `../redesign/TYPOGRAPHY_RESEARCH.md` (candidate table,
  per-font assessments, LaTeXbangla 2.1, Tiro Indic record, pdkef
  fontkit-hang flag, Ek Type / Anek project notes).
- Fit Width paper (fitwidth.com, Oct 2026 catalogue census): Anek's wdth
  75–125 is among the widest width axes on Google Fonts; width changes
  weight/proportion, so condensed display must be screenshot-checked.
