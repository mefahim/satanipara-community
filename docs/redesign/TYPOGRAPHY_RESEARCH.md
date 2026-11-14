# TYPOGRAPHY_RESEARCH.md — Satanipara Community redesign, Phase 3

Date: 2026-11-14 | Status: research + evidence-based recommendation — NOT final.
Research method: Google Fonts catalogue data (via FontArray / Fontsource /
Google Fonts metadata summaries and the LaTeXbangla 2.1 font table), designer
and licence records, and Bengali-script readability guidance. Google Fonts
specimen pages themselves returned no extractable content to the text fetcher
on 2026-11-14, so no specimen-page claim is made from a direct page read.

> ⚠️ VERIFICATION LIMIT — READ FIRST
> No live browser was available to this research phase, so **no screenshot
> verification was performed**. Nothing in this document claims a font was seen
> rendered. The recommendation below is evidence-based (catalogue facts +
> published design notes), but **the final font decision MUST be confirmed from
> actual rendered screenshots during the build QA phase**: the same strings in
> TYPOGRAPHY_SPECIMEN.html, screenshotted in Chrome + Safari + an Android
> phone browser at 360px and 1280px, checking conjuncts (ক্ষ ত্র ষ্ট জ্ঞ শ্র ফ্র),
> Bengali numerals (০১২৩৪৫৬৭৮৯), vowel signs, line-height collisions, and
> mixed BN/EN lines. If screenshots contradict this recommendation, the
> screenshots win and the runner-up system (below) is adopted without redesign
> — the layout is deliberately font-swap-safe.

## Candidate table (all verified on Google Fonts, all SIL OFL 1.1)

| Font | Designer | On Google Fonts | Weights / styles | Variable? | Italic? | Scripts |
|---|---|---|---|---|---|---|
| **Anek Bangla** | Ek Type (Bangla: Sulekha Rajkumar; Latin: Yesha Goshar) | Feb 2022 | 8 (100–800) | Yes — weight 100–800, width 75–125 | No (synthetic only) | Bengali, Latin, Latin Ext. |
| **Tiro Bangla** | Tiro Typeworks; John Hudson, Fiona Ross, Neelakash Kshetrimayum | May 2022 | 2 (Regular 400 + Italic 400) | No | Yes — true italic | Bengali, Latin |
| **Noto Sans Bengali** | Google (Noto project) | Nov 2020 | 9 (100–900) | Yes — weight 100–900, width 62.5–100 | No | Bengali, Latin, Latin Ext. |
| **Noto Serif Bengali** | Google (Noto project) | Nov 2020 | 9 (100–900) | Yes — weight 100–900, width 62.5–100 | No (synthetic only) | Bengali, Latin, Latin Ext. |
| **Baloo Da 2** | Ek Type (Noopur Datye, Sulekha Rajkumar) | Jan 2016 | 5 (400–800) | Yes — weight 400–800 | No | Bengali, Latin, Latin Ext., Vietnamese |
| **Hind Siliguri** (incumbent, v1) | Indian Type Foundry (Jyotish Sonowal) | Jun 2016 | 5 static (300–700) | No | No | Bengali, Latin, Latin Ext. |
| **Manrope** (English only) | Mikhail Sharanda | Oct 2019 | 7 (200–800) | Yes — weight 200–800 | No | Latin (no Bengali) |

Licensing: every Bengali candidate above is SIL Open Font License 1.1 — free
for commercial use, including client work and logos; the font file itself may
not be sold standalone. Manrope is likewise OFL 1.1.

## Per-font assessment

### Anek Bangla — recommended for UI + body (Bengali)
- **Strengths:** the only Bengali candidate designed as a *contemporary
  multi-script UI system*: variable weight + width (condensed headlines to open
  text from one file), tall x-height (lowercase ~77% of cap height — helps small
  sizes), open spacing that keeps conjuncts from tangling, and Latin drawn to
  match the Bengali so mixed lines look coherent. Award-winning Ek Type project
  (TDC 2022). 8 weights give real hierarchy without a second family.
- **Weaknesses:** no true italic (emphasis must come from weight/colour);
  LaTeXbangla's table notes its bold is synthetic in that toolchain and its
  word-space is wide (2.1×) — on the web this means checking letter/word
  spacing at small sizes rather than trusting defaults. Youngest of the serious
  candidates, so the least battle-tested in long Bengali body copy.
- **Best for:** navigation, buttons, labels, form text, body copy, section
  headings at 600–700. The workhorse.

### Tiro Bangla — recommended for editorial display headings ONLY
- **Strengths:** the most distinctive Bengali voice available on Google Fonts:
  a traditional literary serif from the Murty Classical Library / Indigo
  project (Harvard University Press commission, 2012; Google Fonts commission,
  2019; released June 2022), drawn by John Hudson & Fiona Ross. True italic —
  the only candidate with one — gives quotes and kickers a genuine voice.
  At large sizes it is the clearest expression of "Bengali editorial".
- **Weaknesses (serious, and why it is display-only):** a single weight
  (400) — no bold at all, so hierarchy must come from size, never weight;
  headings below ~28px lose presence and must switch to the fallback serif.
  A third-party PDF-tooling report (pdkef font-candidate research, 2026-09)
  records fontkit hanging on ফ্র / শ্র shaping in Tiro Bangla — that is a
  PDF-library shaping path, NOT a browser path (browsers use HarfBuzz), and it
  is unverified in browsers, but শ্রী is an everyday honorific, so this MUST
  be screenshot-checked in-browser before launch. If it fails, drop Tiro.
- **Best for:** hero tagline, section titles ≥32px, pull quotes (italic).
  Never for body, buttons, or small text.

### Noto Serif Bengali — runner-up display face; fallback serif
- **Strengths:** the safe serif: 9 weights (100–900) variable with *real*
  bold faces, widest glyph coverage (925 glyphs), same Noto reliability as the
  sans, designed for extended reading. If Tiro fails QA, this replaces it with
  zero layout change.
- **Weaknesses:** neutral/bookish personality — correct but unmemorable; less
  distinctive than Tiro at display size. No true italic.
- **Best for:** display headings if Tiro is rejected; sub-headings at 600–700
  under a Tiro hero; long-form article body if a serif body is ever wanted.

### Noto Sans Bengali — runner-up UI/body face; universal fallback
- **Strengths:** the most reliable Bengali face in existence for the web:
  9 weights variable, real bold, 1,030 glyphs, ships as the system fallback
  on many devices, proven at small sizes and in forms. The zero-risk choice.
- **Weaknesses:** neutral to a fault — it will never be the reason anyone
  remembers the site. Slightly narrower colour than Anek at display sizes.
- **Best for:** body/UI if Anek fails QA; always the first fallback in the
  stack (`'Anek Bangla','Noto Sans Bengali',sans-serif`).

### Baloo Da 2 — display accent only; NOT recommended for this site
- Rounded, expressive, friendly — but that friendliness reads playful /
  childlike at institutional scale. Good for a poster or a children's section;
  wrong for a 27-year-old sangha's trust surfaces (accounts, request status,
  committee). 5 weights variable, but no role in this system that Anek/Tiro
  do not do better. Keep in the specimen for comparison only.

### Hind Siliguri — incumbent; fallback only
- Honest, humanist, proven in v1 and widely used for Bengali UI (5 static
  weights 300–700, no variable, no italic). A published report notes a
  malformed Bengali digit "১" in some weights — unverified here, but it must
  be checked if Hind Siliguri is ever used for numerals. Superseded by Anek
  for this redesign (variable axes + more contemporary voice), but kept as the
  second fallback in the stack because it is already proven in this project.

### Manrope — recommended for English
- Geometric-grotesque hybrid, variable 200–800, OFL, hugely popular (#17 on
  Google Fonts). Crisp at headings (700) and tidy at body (400). No italic —
  emphasis by weight/colour, quotes in the Bengali serif. Pairs well with both
  Anek and Tiro because it is neutral without being invisible. Carries no
  Bengali glyphs, so it must never be the sole family in a mixed line — the
  font stack must always list a Bengali face first for Bengali text, Manrope
  for Latin runs (via `lang="en"` spans or the EN toggle).

## Faces considered and excluded (with reasons)

- **SolaimanLipi, Kalpurush, Siyam Rupali, Nikosh, Mukti** — respected for
  Bengali print/body (LaTeXbangla's tested set), but NOT on Google Fonts, no
  verified CDN/web distribution or variable fonts, and licensing for web use
  is not established in the sources checked. Do not self-host them for this
  project without a separate licence check. Their existence is noted so the
  build team does not "discover" them later as if unconsidered.
- **Galada, Mina, Atma** — Google Fonts Bengali display faces, but display-only
  (single/few weights, decorative), with no UI or body role. Galada is a
  legitimate poster face; none fits a civic broadsheet.
- **Noto Sans Bengali UI** — a UI-tuned Noto variant; redundant once Anek +
  Noto Sans Bengali are in the stack.

## Comparison matrix (judgement from catalogue facts + published notes; ★ = best in row)

| Criterion | Anek Bangla | Tiro Bangla | Noto Sans Bengali | Noto Serif Bengali | Baloo Da 2 | Hind Siliguri |
|---|---|---|---|---|---|---|
| Conjunct rendering (design intent) | ★ open spacing | Traditional, must verify শ্র/ফ্র | ★ proven | ★ proven | Good | Good |
| Readability at small sizes (13–15px) | ★ tall x-height | Poor (serif, 400 only) | ★ proven | Fair | Fair | Good |
| Weight consistency / hierarchy | ★ 100–800 var. | 400 only | ★ 100–900 var. | ★ 100–900 var. | 400–800 var. | 300–700 static |
| Heading personality | Modern, confident | ★ literary, distinctive | Neutral | Bookish, calm | Playful | Neutral-humanist |
| Paragraph readability | Good (check word-space) | Not for paragraphs | ★ proven | ★ proven (serif) | Poor (rounded) | Good |
| Mixed BN/EN lines | ★ matched Latin | Good (Castora Latin) | ★ matched Latin | ★ matched Latin | Good | Good |
| Performance (variable = 1 file) | ★ 1 file | 2 small files | ★ 1 file | ★ 1 file | 1 file | 5 static files |
| Risk | Low–medium | Medium (verify শ্র) | Low | Low | Low (wrong tone) | Low (digit ১ check) |

## Recommendation

**Primary system — adopt for the build, pending screenshot QA:**
- **Display / hero / section titles (BN):** `'Tiro Bangla', 'Noto Serif Bengali', serif` — 400 only, size-led hierarchy (hero clamp(2.6rem, 7vw, 4.4rem), section clamp(1.7rem, 3.4vw, 2.4rem)); italic for pull quotes/kickers.
- **UI + body (BN):** `'Anek Bangla', 'Noto Sans Bengali', 'Hind Siliguri', sans-serif` — body 400 at 17px, line-height 1.8; UI/labels 600 at 15px; buttons 600–700 at 16px.
- **English:** `'Manrope', 'Anek Bangla', sans-serif` — headings 700, body 400 at 16px, line-height 1.65. Bengali text inside English pages keeps the Bengali stack.
- **Numerals:** Bengali numerals ০–৯ in Bengali copy; test ১ specifically in Anek and Hind Siliguri at QA.

**Runner-up system — adopt automatically if Tiro or Anek fails screenshot QA:**
- Display: `'Noto Serif Bengali', serif` at 700 (real bold restores weight-led hierarchy).
- UI/body: `'Noto Sans Bengali', 'Hind Siliguri', sans-serif`.
- English unchanged (Manrope). No layout, spacing, or component change is needed
  for this swap — that is a deliberate property of the direction, not luck.

## Typographic rules for the build (carry into the design system)

1. Bengali body never below 15px (16–17px standard); Bengali sized ~10% larger
   than Latin at the same hierarchy level; line-height 1.8 for Bengali body,
   1.35–1.25 for Bengali display.
2. Never letter-space Bengali, never set Bengali in uppercase transforms —
   both break the মাত্রা stroke and vowel-sign placement.
3. Never fake bold (`font-weight: 700` on Tiro Bangla) or fake italic
   (synthetic oblique on Anek/Noto) — if the face lacks the weight/style, use
   size, colour, or the fallback face instead.
4. Conjunct test string at QA: `ক্ষ ত্র ষ্ট জ্ঞ শ্র ফ্র ব্র হ্র ন্ত ণ্ড স্থ`
   + `শিক্ষা • ঐক্য • শান্তি • প্রগতি` + `শ্রী` + numerals `০১২৩৪৫৬৭৮৯`.
5. Load only the weights used (Anek 400/500/600/700 + width axis if needed;
   Tiro 400 + italic; Manrope 400/600/700/800) via `display=swap`, subset
   `bengali,latin`; self-host if the build already self-hosts fonts.
6. `lang="bn"` on Bengali blocks, `lang="en"` on English runs — this is what
   lets the browser pick the right face per run and helps screen readers.

## QA checklist (build phase — the decision is not final until these pass)

- [ ] Specimen screenshots (Chrome, Safari, Android Chrome) at 360px + 1280px.
- [ ] Conjuncts + শ্রী + numerals render correctly in Tiro at hero size and
      in Anek at 15px body; no clipping of vowel signs at line-height 1.8.
- [ ] No synthetic bold/italic anywhere in the rendered pages (inspect
      computed styles on Tiro headings).
- [ ] Mixed line "প্রবাসে থেকেও থাকুন পরিবারের কাছাকাছি। — Satanipara Community"
      reads as one line height, no size jump between scripts.
- [ ] Fallback test: block Google Fonts; page still reads cleanly in system
      Bengali fonts (Noto Sans Bengali / system fallback).
- [ ] If any check fails: swap to the runner-up system, re-screenshot, record
      the swap and the failing evidence in the QA report.

## Sources

- FontArray catalogue pages (Google Fonts metadata summaries, accessed
  2026-11-14): Anek Bangla, Tiro Bangla, Noto Sans Bengali, Noto Serif
  Bengali, Baloo Da 2, Hind Siliguri, Manrope.
- Fontsource / npm metadata: @fontsource-variable/baloo-da-2,
  @fontsource/noto-sans-bengali, @fontsource/hind-siliguri (weights, subsets,
  variable axes).
- LaTeXbangla 2.1 user guide (CTAN, Oct 2026) — Table 1: default bold/italic/
  scale/word-space per Bengali font, incl. real-vs-synthetic bold.
- Tiro Indic collection record — centaur.reading.ac.uk/109224 (Hudson & Ross,
  2022; Harvard/Murty commission history; Google Fonts commission 2019).
- pdkef font-candidate research brief (GitHub, shlomsh/pdkef, 2026-09) —
  Hind Siliguri vs Tiro Bangla screening; Tiro fontkit hang on ফ্র/শ্র
  (PDF-tooling path, not browsers — flagged as a check, not a verdict).
- Ek Type / Anek project notes — platform-mag.com, 1001fonts.com, luc.devroye.org.
- Bengali font guidance — fontarray.com/blog/best-fonts-for-bangla-design
  (conjunct testing, 10–20% Bengali size uplift, line-height 1.8–2.0).
