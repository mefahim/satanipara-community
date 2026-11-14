# 15 — Phase 0.1 Review and Resolution

> **MariaDB addendum note (2026-11-14):** the database decision recorded in this document — MySQL 8.4 LTS + InnoDB, Confirmed Phase 0.1 — was superseded the same day by Fahim's decision that **MariaDB 11.8.9 is the production engine** (see 16-MARIADB-ADDENDUM.md). This document remains the verbatim Phase 0.1/0.1.1 record: its narrative, measurements (all on MySQL 8.0.46), and counts (48/50/58 tables after the `sequences` definition, 134 endpoints) stand as history, except where §22 records an amendment. The still-operative rows amended by the addendum are: §1 authoritative numbers, §6 history rows (count parentheticals), §9.5 re-test checklist, §10 C-1/C-2/C-24, §11 REG-TECH-03/REG-ORG-14, §12 check 5 and §17 inventory row (count parentheticals — the check records themselves stand), §13 RK-1/RK-14 (RK-2's re-test now runs via the amended §9.5), §19 ADR rows, §21.3/§21.5 check 6/§21.6, and §22 itself. §17's CK rows stand as the Phase 0.1 record; the hash/ledger/search items they point to are re-pointed via §9.5, §22 and Doc 10. Do not read any other "MySQL 8.4 is the standard" sentence in this document as current.

| | |
|---|---|
| Document | Satanipara Community — Phase 0 Backend Blueprint, Doc 15 |
| Status | **Phase 0.1 record** — the reconciliation of the Phase 0 blueprint against five independent investigator findings (A–E), 2026-11-14 |
| Baseline | Commit `f4934b7` ("Phase 0: Laravel backend architecture blueprint — repo audit, RBAC, database, API, security, ADRs, roadmap") |
| Sources | Investigator A (MySQL reconciliation), B (security & governance), C (database & API), D (roadmap & cross-document), E (Bengali search benchmark); Phase 0 decision sheet; research notes |

---

## 1. Executive summary

Phase 0 published a complete Laravel backend blueprint (Docs 01–14, 13 ADRs, 4 diagram documents) at commit `f4934b7`. Five investigators then reviewed it independently — MySQL compatibility, security and governance, database/API consistency, roadmap and cross-document consistency, and Bengali search quality — and found it **internally inconsistent in material ways**: the database was still PostgreSQL in the text after the decision had moved to MySQL; the table count was wrong (44 vs 47 defined); the endpoint count was cited inconsistently (108 vs the plan's ~70); permission names contradicted each other across documents; the same decision was recorded as a rule in one document and an open question in another; and three different phase schemes were used without labels.

Phase 0.1 applied **every correction** from findings A–E — 401 scripted replacements across Docs 01–14, the ADRs, the diagrams, the backend README, and the root README (scripts S1–S5b, each exact-match with count assertions), plus two tables added to the schema and the ERD, 25 new API endpoints, and two rewritten ADRs (ADR-003 and ADR-010). **Published 2026-11-14T12:29:01Z as commit `d05cbc70d383587cb5bf4083bec9b9fca06c8a5f` on `main` ("Phase 0.1: reconcile architecture, security and database blueprint", 34 files changed, 1182 insertions, 526 deletions).** The staging copy at `~/workspace/satanipara-phase0-1/publish/` and the push plan `~/workspace/satanipara-phase0-1/PUSH_PLAN-0.1.md` are the pre-publication record of that push, retained as history — they are no longer the deliverable.

The authoritative numbers after Phase 0.1 (updated Phase 0.1.1 — see §21; amended 2026-11-14 — see §22) are: **MariaDB 11.8.9 + InnoDB** (Confirmed, Fahim, 2026-11-14 — supersedes MySQL 8.4 LTS + InnoDB; see 16-MARIADB-ADDENDUM.md); **48 application tables** (50 defined incl. 2 Spatie pivots; 58 physical incl. 8 Laravel framework tables — `sequences` defined as the 48th table, 2026-11-14); **134 endpoints**; **14 ADRs** (13 Phase 0.1 + ADR-014 MariaDB 11.8.9; ADR-003 superseded by ADR-014); **21 Awaiting Organisation decisions** (AO-01–AO-21) plus the merged owner-decision register in §11.

The gate assessment is in §20. In one line: the blueprint is now **internally consistent and verified by Batch 6**, with the remaining work being owner decisions (Fahim / the organisation), not blueprint errors.

## 2. Baseline commit + scope

- **Baseline:** `f4934b7f3e08ec993675551aa65030fd54102b13`, verified clean before any edit (`git status` clean, `git log -1` matched). All edits were made in a staging copy at `~/workspace/satanipara-phase0-1/publish/` (layout `publish/docs/backend-architecture/...` + `publish/README.md`); the clone at `~/workspace/satanipara-repo-audit/` was never edited.
- **Scope of Phase 0.1:** reconcile the Phase 0 blueprint only. No Laravel code was added, no UI file was modified, `index.html` / `alternatives/` / `docs/direction-d|redesign|v1` were untouched, and no price was introduced anywhere (the quotation is separate, recommendations only, not final, not sent).
- **Inputs:** five investigator findings files (`A-mysql-reconciliation.md`, `B-security-governance.md`, `C-database-api.md`, `D-roadmap-crossdoc.md`, `E-bengali-benchmark.md`) plus the benchmark artefacts in `~/workspace/satanipara-phase0-1/benchmark/` (`generate_dataset.py`, `seed.sql`, `schema.sql`, `run_benchmark.py`, `raw_results.json/.md`, `count_debug.sql`). The benchmark raw files total ~1.98 MB (`seed.sql` alone ~1.8 MB), above the <1 MB threshold for inclusion in the repo — so the raw files were **not** copied into the docs in Phase 0.1; the methodology, dataset characteristics, measured results, recommendation, and re-test checklist are in §9, and the raw files stayed local, referenced by path. **Phase 0.1.1 supersedes that exclusion for the reproducible parts: the generator, schema, queries list, runner, README and 8.4 run guide are now published as `docs/backend-architecture/benchmark/` (77 KB of text, no generated datasets, no binaries — see §9 and `benchmark/README.md`). The generated `seed.sql` (~1.8 MB) and the raw 8.0.46 result files stay out of the repo by design; they are regenerated on demand.**
- **What Phase 0.1 did not do:** it did not re-decide anything Fahim or the organisation must decide (those are AO-01–AO-21 and §11); it did not run the scaffold (no MySQL 8.4 instance exists in this environment — see §13); it did not change the product scope (Phase 1 = Super Admin + Expatriate Helper only, no OTP, Direction D as the working frontend direction).

## 3. Original findings

| # | Investigator | What was found |
|---|---|---|
| A | MySQL reconciliation | 31 items (INV-01–INV-31): every PostgreSQL reference, feature, and assumption in the blueprint, reconciled to MySQL 8.4 LTS + InnoDB. Supplied: integrity designs (§2.1 one-current-term, §2.2 single-holder roles, §2.3 finance integrity, §2.4 audit append-only), a 30-item compatibility checklist (CK-01–CK-30, §5), a full ADR-003 rewrite (§4.1), and 13 unverified items (UV-01–UV-13) — notably UV-10: the generated-column/trigger designs were never executed against a real MySQL 8.4 instance in this environment. |
| B | Security & governance | A single password policy (§3.1.4, ready-to-paste); the tracking-secret design (§3.4); Super Admin governance (§3.6); finance dual control (§3.7); guest workflow (§3.8); notifications reconciliation (§3.9); retention (§3.11); API privacy (§3.12); and an Awaiting Organisation register (§6.2, AO-01–AO-17). Also a 24-item consolidated correction list (§5) and an honesty note (§6.1): OWASP ASVS numbers were verified through secondary sources, HIBP reachability from the production VPS was not verified, and no code was inspected or executed. |
| C | Database & API | 26 mismatches (M-01–M-26), 9 permission-name mismatches (§2.3), 10 endpoints promised by Doc 03 with no Doc 07 counterpart (§2.4), ERD defects E-04/E-06/E-07, the `service_types` design (§3), persons-as-source-of-truth (§4), and a corrected 13-step migration order (§5). Correction specs C-01–C-23. Mechanically verified counts: 47 tables defined, 108 endpoint IDs at baseline. |
| D | Roadmap & cross-document | A canonical module→phase table (§2), findings R-01–R-17, 12 broken section references (B-01–B-12), terminology collisions T-01–T-13, a 104-line stale-PostgreSQL inventory (§5.3), present-tense-as-implemented items P-01–P-10, and a decision register (§4: REG-SCOPE, REG-DB-01, REG-TECH, REG-FIN-01, REG-AUTH-01–08, REG-PROD, REG-OPS, REG-ORG-01–14). |
| E | Bengali search benchmark | Measured on MySQL 8.0.46 (NOT 8.4), synthetic dataset, 3,900 rows. Recommendation: ngram `FULLTEXT` + **BOOLEAN MODE** as primary; natural-language mode must NOT be the default; Scout database engine defaults to natural-language mode. Full results in §9. |

## 4. Root cause analysis

The inconsistencies were not typos. They had five structural causes, and Phase 0.1 fixed the causes, not just the symptoms:

1. **The database decision moved after the blueprint was written.** Phase 0 was drafted against the plan's PostgreSQL lean ("narrow lean, VPS-only"); Fahim's confirmed decision — **MySQL 8.4 LTS + InnoDB** — arrived as a Phase 0.1 constraint. Every PostgreSQL sentence, feature reference (`jsonb`, GIN, `pg_dump`, `pg_trgm`, transactional DDL, partial unique indexes, vector search), and diagram label was therefore stale at once. Fix: ADR-003 rewritten as Confirmed, every reference replaced or explicitly marked superseded (CK-01–CK-05), and the decision closed in Doc 13 Q-26/A-06 so it cannot drift again.
2. **No single authoritative inventory.** The table count (44) and endpoint count (108) were each derived independently per document, so they drifted: the plan miscounted its own tables (38 stated vs 39 named — the 39th is the third System table), two Spatie pivots were uncounted, and Doc 07's count did not match Doc 03's promises. Fix: one authoritative inventory (Doc 06 §1.4, ERD, and §16 of this document, all mechanically reconciled) and one endpoint count (132 at Phase 0.1, mechanically verified — no duplicate IDs; 134 after Phase 0.1.1 — see §21).
3. **No decision-status discipline.** The same item was a rule in one document and an open question in another (finance dual control: rule in Doc 04 §6.1, proposal in Doc 07 F4; password length: 12 in Doc 04, 8 in Docs 07/08/09, 6-floor in Doc 02; restore cadence: "resolved" in Doc 06 §15, "under review" in §16, "confirmed at scaffold" in Doc 11). Fix: every decision now carries one status — **Confirmed / Recommended / Awaiting Organisation** — in exactly one authoritative location, with other documents citing it (see §8, §10, §11).
4. **Three phase schemes, no labels.** Product Phase 1 (Decision Sheet scope), roadmap phases (Doc 12, Phases 0–9 + Future Mobile), and plan phases (Engineering Plan v1.1, Phases 1/2/3) were all written as bare "Phase N". Fix: the vocabulary box (Doc 12 §1.5, backend README §3) and the canonical module→phase table; every plan-sense occurrence now reads "plan Phase N", and Doc 14 §4 carries a "Doc 12 equivalent" column with the rule that Doc 12 governs build order where the two disagree.
5. **Prototype behaviour quoted as product decisions.** The prototype's public tracking exposed applicant name and area, and its pending-login behaviour refused login — both were carried into the blueprint as if decided. Fix: the tracking exposure is replaced by the Tier-S allowlist (§7, item 1 of §7's table — see Doc 04 §7.4), and the pending-login behaviour is recorded as **Recommended, pending Fahim's confirmation** (REG-AUTH-01), not as a fact.

## 5. Affected documents

Every document in the blueprint was affected except Doc 01's audit record itself (which is a record of the prototype, not a design decision — only its §3.4/#16 prototype note was annotated with the display rule).

| Document | Nature of change |
|---|---|
| 01 — Repository Audit | §3.4/#16 annotated with the 4-node timeline display rule (R-14); L107 MySQL line. |
| 02 — Product Requirements | Module→phase table rebuilt with both phase columns; REQ-M1-004 (pending login), REQ-M1-011 (reset mechanism), REQ-M1-013 (password), REQ-M5-013 (tracking secret + Tier-S), REQ-M7-005 (review = same-person checkpoint), REQ-M7-007/M8-005/M9-005/M9-006 (plan-phase labels), REQ-M10-004 (permanent retention), NFR-013 (three-tier retention + canonical restore sentence), M12 heading, §7 out-of-scope labels, L288 stack (MySQL 8.4 LTS). |
| 03 — Dynamic Content Inventory | Homepage/settings rows → `settings` keys, no draft workflow (M-07); notification templates → code constants (M-06); Facility/landmark split (M-23); service catalogue → `service_types` table + S1–S5 (M-22/C §3); finance rows → approve-and-publish one step, computed-on-read summaries (M-08); contact permissions; `finance.publish` → `finance.reports.publish`; plan-phase labels. |
| 04 — User Roles & Permissions | ERT mapping (§1.1); go-live expectation of two Super Admins (§3.1/§3.2, no-self-removal absolute); permission catalogue (`accept`/`advance` replace `update`, `service_types.manage` added, `reports.publish` deleted); password policy §5.1 (single policy); throttling §5.2; mobile tokens 30 days (§5.4); mediated reset §5.5; audit two-user design §5.7; MFA TOTP behind flag §5.8; finance §6.1 (approve IS publish, deadlock warning, reversal rule); tracking §7.2/§7.3/§7.4 rewrite; §8.1 `finance.reports.publish`; §8.7 content editor; §8.15 REG-AUTH-01; §10 items; §11 RBAC-1–RBAC-5 (RBAC-5 closed). |
| 05 — Backend Architecture | §3 fully rewritten as the MySQL decision (§§3.1–3.5); §1 L16; §2.3/§2.4 version lines; §4.2 module→phase table; §5.2 password parenthetical; §5.5 DDL-not-transactional note; §6.2 client phases; §8.2 token 30 days; §9.1 4-node timeline rule + guest confirm-close; §9.3 review checkpoint; §10.1 SKIP LOCKED (MySQL ≥ 8.0.1); §10.4 search (boolean mode, E measured); §13 `mysqldump` + three-tier retention; §15 agreement/divergence lines; ARCH-2. |
| 06 — Database Design | §1.4 counts rewritten (39 + 8 = 47 application; 49 defined; 57 physical — now 48/50/58: `sequences` defined as the 48th table 2026-11-14, see Doc 16); `users` (`member_no`, `member_type`, Q-20 annotation); `member` role example deleted (E-07); `persons` denormalised search snapshots + ngram FULLTEXT incl. `profession_bn`/`area_bn` (E); institutions/activities/posts FULLTEXT; landmarks `status` + `location_note_bn` (M-24); committee generated-column designs (§4.1/§4.2); new `constitution_versions` (§4.6); `posts` fields (M-20); `media` `JSON`; `service_requests` (service_type_id + snapshots, tracking-secret columns, backup-helper columns); ERT + blood_donors `person_id` FKs; new `service_types` (§6.8); `ledger_entries` (status enum, reject + discard columns, CHECKs, trigger/REVOKE/`sequences` enforcement); `ledger_reversals` (approver rule); `notifications_log` (two sources of truth); `activity_log` (JSON, two-user + trigger); framework tables (§8.6); monthly summary computed on read (M-08); CHECK sentence; migration order steps 0–12 (media before organisation); §11.5 (`phone_hash` destruction, ledger payee AO-11); §12 (computed summary, `sequences`); §13 (`mysqldump`, three-tier retention); §15 rewritten; §16 DB-1 decided, DB-3 open until runbook adopts. |
| 07 — API Architecture | §6 search (boolean mode); §7 password → Doc 04 §5.1; §8.2 token 30 days; §8.3 tracking-secret design; §9 rate limits; §12 two sources of truth + guest no-notification; §14 intro count 108 → 132; A1 (423 rule, `remember?` deleted); A5 (`pending`, Side B login); A6 (mediated temp password, `members.reset_password`); P7–P11 new public endpoints; C2 → C2a/C2b/C2c; C3 `kind` discriminator; C4 decided `visibility=private`; C7/C8 `community.infrastructure.manage`; C9–C11 new; J1/J2 employer/deadline; G3 `media.manage`; X1 rewritten; X2 replaced by `POST /expatriate-requests/track`; X7 `accept`/`advance`; X8 `expatriate.expenses.create`; X11/X12 added; B2/B5/B6/B7/B8/B9 fixes; F3 field names; F4 approve IS publish + dual control mandatory; F5 deleted; F6a reject added; F8 `finance.reports.publish`; F10 added; T4 hard delete; T5 `device_name?`; M2 default decided + M4–M7; §14.12 D1–D11 → AD1–AD11 + AD12/AD13; new §14.13 service catalogue S1–S5; §16 traceability; §17 rewritten. |
| 08 — Security Architecture | §3.1 SUPERUSER → MySQL granular privileges; §5 session timeouts cite Doc 04 §5.4 in full (T-12); backup ref Doc 11 §7 (B-06); §14 open items updated (items 2/3/5/8 decided, items 1/4/6/7 open). |
| 09 — Admin Dashboard | §3.1 `dashboard.view_admin`/`view_helper` (T-01); §3.2 password per Doc 04 §5.1, permissions `members.*` + `users.manage_roles`, self-lockout guard mandatory; §3.4/§3.15 AD2/AD3/AD8 (R-15); §3.11 finance (approve-and-publish one step, reject, status enum, dual control mandatory, `finance.publish` removed). |
| 10 — Testing & Quality | MySQL 8.4 test DB + concurrency/CI tests; §5 pending-login test corrected to Side B; §11 restore ref Doc 11 §7.3 (B-07). |
| 11 — Deployment & Operations | MySQL 8.4, non-transactional DDL, `mysqldump`; §2.3 website phase → Doc 12 Phase 7 (B-11); §7.3 canonical restore sentence (R-09); §11 items 3/5 decided. |
| 12 — Development Roadmap | Phase vocabulary box + canonical module→phase table (§1.5); Phase 0 scope/deliverables corrected (R-03); Phase 2 AD4–AD5 (R-15); Phase 5 M9 remainder + tracking-boundary risk; Phase 6 dual control mandatory + acceptance warning (R-06/R-16); Phase 7 M9 remainder; Phase 9 canonical restore sentence; L68/L78. |
| 13 — Open Questions & Assumptions | Q-01 ref fixed (B-02); Q-02 tracking boundary (mechanism decided, AO-04 open); Q-05 password policy (decided except AO-01); Q-11 dual control (decided in part); Q-13 Bengali search (measured, re-test open); Q-22 service catalogue (table + seed candidates); Q-26 CLOSED (MySQL 8.4 LTS, Fahim 2026-11-14); A-06 rewritten; new AO register section (AO-01–AO-17). |
| 14 — Acceptance Criteria | §4 retitled + "Doc 12 equivalent" column + governing sentence (R-02); AC-M1-03 (Side B login); AC-M5-09 (Tier-S + 4-node rule); AC-M7-05 (review checkpoint); AC-X-BKP-02 (canonical restore sentence); M12 heading (Future Mobile); G-18 and P0-09 unticked with exception lists (R-08); P0-07 numbers corrected (132 endpoints, 8 added tables). |
| ADRs 001–013 | ADR-001 (vector search unavailable on MySQL — corrected 2026-11-14: available natively on MariaDB 11.7+; see Doc 16 §7); ADR-002 (effective PHP floor 8.4 + reason); ADR-003 full rewrite from A §4.1 with two Phase 0.1 adjustments (monthly summary computed on read, not a snapshot; FTS fallback = E's measured ngram+boolean result); ADR-005 (Spatie MySQL 1071 note); ADR-007 (Doc 11 §7 refs); ADR-008 (SKIP LOCKED MySQL ≥ 8.0.1); ADR-010 full rewrite (Scout database engine in BOOLEAN MODE, E measured basis); ADR-012 (MySQL 8.4, cPanel sentence rewritten, Doc 11 §7.2 ref); ADR-013 (`mysqldump`, binary-log PITR, PHP floor 8.4, Doc 11 §7 refs); ADR-004/009/011 one-line "no database dependency — verified Phase 0.1" notes; adr/README (ADR-003 Confirmed). |
| Diagrams | API-FLOW: 5× "participant DB as PostgreSQL" → "MySQL 8.4" (the sixth occurrence cited by A was the engine-neutral money-rules line, L171 — it stays); "4-step Meridian timeline" → 4-node rule. ERD: `jsonb` → `json`; §2.8 ref → §1/§3.7; ERT cardinality one-to-many (E-04); count sentence (39 named + 8 additions = 47 application; 49 defined; 57 physical — now 48/50/58, see Doc 16); two new boxes (`service_types`, `constitution_versions`) with relationships; `service_requests` box updated (`service_type_id` + snapshots). SYSTEM-ARCHITECTURE: PG node → MySQL 8.4 LTS (InnoDB) node, `SVC --> DB`, L121/L140/L162 MySQL. |
| Backend README | Version line (MySQL 8.4 LTS); table counts (47/49/57 — now 48/50/58, see Doc 16); phase vocabulary box (§3); ERD line. |
| Root README | Stack line (MySQL 8.4); PostgreSQL bullet → MySQL bullet; search bullet (Scout BOOLEAN MODE); backup bullet (monthly check + quarterly rehearsal); "What the plan changed" (47 application tables, 132 endpoints — now 48 application tables, 134 endpoints, see Doc 16); module→phase table (both columns + canonical sentence); M12/Future Mobile; status table (Direction D "Under review", website Doc 12 Phase 7, tracking/forgot-password rows updated); "Next steps" item 4 (Doc 12 Phase 2); documentation list (MySQL 8.4 LTS, 47 tables, 132 endpoints, Doc 15 added — now MariaDB 11.8.9, 48 tables, 134 endpoints, see Doc 16). |

## 6. Corrections made

401 scripted replacements in total (S1: 50, S2: 52, S3a: 26, S3b: 24, S4: 40, S5a: 166, S5b: 43), each an exact-match replacement with a count assertion; every miss was reported and fixed before proceeding. Beyond the replacements:

- **Two tables added** to the schema and the ERD: `service_types` (Doc 06 §6.8, C §3 — the admin-managed service catalogue; endpoints S1–S5; permission `service_types.manage`; 7 seed candidates pending Q-22) and `constitution_versions` (Doc 06 §4.6, C M-05 — versioned constitution with the one-current-version generated-column pattern).
- **25 new endpoints added** (132 = 108 + 25 − 1 deleted F5): S1–S5 (service catalogue), X11/X12 (guest confirm-close/cancel), F6a (reject), F10 (single project account), P7 (public finance summary), data-requests +3, public announcements/emergency-contacts/contact +3, freedom-fighters +1, family +3, C9/C10/C11, C2 split into C2a/C2b/C2c (+2). Mechanically verified: 132 endpoint rows, no duplicate IDs. Phase 0.1.1 adds F3a/F3b → 134 endpoint rows (134 = 108 + 27 − 1; see §21).
- **ADR-003 rewritten** (full text from A §4.1) and **ADR-010 rewritten** (Scout database engine in BOOLEAN MODE, on E's measured basis).
- **Doc 13 Q-26 closed** as Decided 2026-11-14 by Fahim (MySQL 8.4 LTS + InnoDB); A-06 rewritten.
- **Doc 14 G-18 and P0-09 unticked, then re-ticked** with exception lists (their ticked claims were false — see §14); P0-07 numbers corrected. Re-ticked after Batch 6 passed (§12).
- **Decision-sheet addendum** written: `~/workspace/satanipara-phase0/decision-sheet-0.1.md` (the original `decision-sheet.md` is untouched as the Phase 0 record). It supersedes the Phase 0 sheet's database paragraph (MySQL 8.4 LTS Confirmed), records the authoritative counts (47/55, 49/57 with additions), the password policy, the tracking-secret design, and the canonical module→phase map.
- **Batch 6 verification fixes (39 further corrections, two rounds — see §12):** round 1 (18): Doc 02 Bengali-search paragraph rewrite (Q-12 → Q-13) and REQ-M8-004 Q-09 → Q-11; Doc 06 §1.4 'Doc 15 §8' → §16, §8.2 `finance.publish` example → `finance.reports.publish`, §10 double rule removed; Doc 07 AD5 'As D4' → 'As AD4', X11/X12 `request_no` redundancy removed, 'Doc 15 §4' → §6 (×2), M3 row reordered; Doc 08 §3.7 '5 attempts/minute' → '5 per 15 minutes'; Doc 11 §7.1 retention 'proposed' → decided; backend README Doc 07 row + 'agrees' paragraph 108 → 132, plan tables 38 → 39; ADR-013 retention 'proposed' → decided; Doc 14 P0-09 stale trailing lines deleted, AC-X-BKP-01 monthly tier added. Round 2 (21): Doc 05 `pg_dump`/`pg_trgm` comparisons removed, endpoint count 108 → 132; Doc 08 §3.8 deleted permissions + self-lockout 'proposed' → mandatory, §5 password 8 → Doc 04 §5.1; Doc 09 `reports.view` → `dashboard.view_admin`, `contact.view`/`reply` → `contact_messages.*`, `settings.view`/`update` → `settings.manage`; Doc 14 G-09 108 → 132; Doc 13 AO-17 label dropped; API-FLOW §4 finance diagram rewritten (approve IS publish, F5 gone, dual control mandatory) + B5 revocation note corrected; ADR-003 `pg_dump`/`pg_trgm` comparisons removed; ADR-006 108 → 132 (×2); Doc 13 Q-13 `pg_trgm` → 'PostgreSQL trigram-search'. Total corrections: 401 scripted + 39 Batch 6 = **440**.

## 7. Conflict resolutions (editor decisions)

Where investigators disagreed, or where a finding conflicted with the task's confirmed constraints, the editor decided once, recorded it here, and applied it consistently everywhere. "Not adopted" entries are as important as adoptions — they record what was considered and rejected, so a later reader does not re-open them by accident.

| # | Conflict | Decision | Rationale / consequence |
|---|---|---|---|
| 1 | Pending-member login: B Side B (can log in, locked screen) vs D R-05 (needs Fahim's word) | Adopt B's Side B as the single consistent text — pending user **can** log in, sees "awaiting approval" screen, services locked (Doc 05 §9.2 / Doc 04 §8.15 position; status value `pending`, not `pending_review`) — but mark it **Recommended, pending Fahim's confirmation (REG-AUTH-01)**, not Confirmed. | D is right that only Fahim can settle it; B is right about which side the blueprint's own §8.15 already implements. Recording it as Recommended keeps the docs consistent without pretending Fahim has decided. |
| 2 | Finance dual control: B (mandatory) vs D R-06 (proposal, needs decision) | **Mandatory, enforced.** "Proposed" removed from Doc 07 F4, §17 item 4, Doc 09 §3.11, Doc 12 Phase 6. | The task position and B agree; D's single-Super-Admin deadlock consequence is recorded as a risk + handover warning (Doc 12 Phase 6 acceptance criteria carry the warning; two Super Admins from day one is the mitigation, REG-AUTH-05/RBAC-2 open). |
| 3 | Password policy: B (single policy) vs D R-07 (contradiction) | B's single policy (12/16, no composition, Argon2id, mandatory breach screening) is the authoritative text in Doc 04 §5.1; Docs 05/07/08 cite it. Q-05 stays open only for AO-01. | One policy, one location. The NIST deviation (12 < 15) stays in the text, flagged, never edited out. |
| 4 | Ledger status enum: C M-15 (`approved` state) vs B (single-step approve+publish) | Enum becomes `draft` / `published` / `reversed` / `discarded`. C's `approved` value NOT adopted (no separate approved state exists once F4 collapses approve+publish); `reversed` adopted (F6 marks the original `reversed`); `discarded` added per A §2.3 item 5. | Consequence recorded explicitly: A's immutability trigger must allow the `published → reversed` transition (reversal service only); as written in A it rejects all updates where OLD.status = 'published'. Reconciled in Doc 06 §7.1/§2.3. |
| 5 | M-04 backup helper: C option (a) columns vs option (b) table | Option (a) — `service_requests.backup_helper_id` + `backup_assigned_at` columns; Doc 03 §14 amended (assignment history not retained in Phase 1; current assignment only). Option (b) `service_request_assignments` recorded as a future option if history is later required. | Preserves the authoritative 49/57 count. |
| 6 | M-06 notification templates: table vs code constants | **Non-table branch** — templates are code constants versioned in git; "draft → published (versioned)" workflow language deleted from Doc 03 §32. B's `notifications.templates.manage` permission therefore NOT added — recorded as superseded by this decision. | Preserves the authoritative 49/57 count; a template is code, not content, in Phase 1. |
| 7 | M-07 page_sections/seo_meta: tables vs settings keys | **Non-table branch** — homepage/SEO/nav/footer managed as `settings` keys, no draft workflow (Doc 03 §§4/29–31 amended). | Preserves the authoritative 49/57 count. |
| 8 | M-08 finance_monthly_summaries: table vs computed on read | **Non-table branch** — monthly summaries computed on read from published entries with 15-minute cache (Doc 06 §§9.1/12; "stored snapshot" sentences deleted). Known limitation recorded: a later reversal changes the next computed summary — the snapshot table remains a future option. | Preserves the authoritative 49/57 count. |
| 9 | D4/D5 permissions: B §4.5 (`users.create`/`users.update`) vs C §2.3 | Follow C — use `members.create` + `users.manage_roles` jointly on AD4/AD5; do NOT add `users.create`/`users.update` to the catalogue. | C's mechanical permission audit is the stronger evidence; no new permissions are invented. |
| 10 | D7 reports permission: B (`reports.view`) vs C (`dashboard.view_admin`) | Follow C — AD7 uses `dashboard.view_admin`; B's alternative (add `reports.view`) not adopted. | Same as #9. |
| 11 | Endpoint ID collision: D R-15 (Doc 07 §14.12 D1–D11 collide with §14.1 D1–D11) | Rename §14.12 endpoint IDs D1–D11 → **AD1–AD11**; cross-references updated in Docs 09, 12 (and anywhere citing D4/D5/D7–D11). The D11 open-question ID (wizard step count) keeps its name. | The collision was real; renaming the admin set is the smaller change. |
| 12 | Password-reset mechanism: B §3.6.5 (mediated temp password) vs D T-10 (reduce Doc 04 §5.5 to "mechanism open") | Adopt B's mediated temp-password flow as the Phase 1 mechanism (system-generated, 24h, single-use, no reset link, no `new_password` field). D's T-10 reduction NOT adopted. Q-04 stays open only for whether a self-service/email flow is added later. | B supplies a complete, implementable mechanism; T-10 would leave Phase 1 with no reset path at all. |
| 13 | T-04 `pending_review` (directory-entry revert value) | Superseded by the decided `visibility=private` rule (C4). `pending_review` appears nowhere as a user status. | One revert rule, not two. |
| 14 | `reports.publish` vs `finance.reports.publish` | `reports.publish` deleted; `finance.reports.publish` kept (D T-03, C, B agree). | — |
| 15 | Ledger trigger vs reversal (A §2.3 vs F6) | A's BEFORE UPDATE trigger rejects updates where OLD.status = 'published' — **except** the `published → reversed` transition performed by the reversal service. Recorded in Doc 06 §7.1/§2.3. | Without the exception, F6 could never mark an entry `reversed` and the ledger would be uncorrectable. |
| 16 | Persons search snapshots (E applied literally) | `persons` carries denormalised `profession_bn` / `area_bn` search snapshots, and the ngram FULLTEXT index covers them (Doc 06 §3.2). A name-only FT index cannot answer `শিক্ষক` (E measured 0 rows). | Editor decision applying E literally; the snapshots are search-only, not source of truth (persons remain the source of truth per C §4). |
| 17 | ADR-003's two adjustments (A §4.1 as supplied vs Phase 0.1 decisions) | (a) Monthly summary = computed on read, not a snapshot (M-08, #8 above). (b) FTS fallback = E's measured ngram+boolean result, not A's unmeasured `LIKE` fallback. | A was written before E measured; E's measurement supersedes A's guess. |
| 18 | Restore cadence DB-3 (R-09 vs the editor's S2 "Decided") | R-09 governs: the cadence is decided (monthly automated check + quarterly full rehearsal), but **DB-3 stays open until the runbook adopts the split**. Doc 06 §15 item 4 softened to "resolved as a blueprint cadence; the runbook adoption is DB-3". | A blueprint cadence is not an adopted runbook entry. |
| 19 | Locale/theme columns (R-13) | Q-20 annotation corrected: whether `locale`/`theme` are populated/persisted is decided by Q-20 (open) — until then they are nullable/unused; the columns are the natural home if persistence is confirmed. The S2 wording ("the working decision") pre-decided it and was corrected. | Columns are not a decision. |
| 20 | REG-TECH-06 endpoint count (D §4: "108-endpoint inventory is the count") | Superseded by C's mechanical recount and the Phase 0.1 edits: **132**. D's note was written before the recount. | Mechanically verified findings beat stated figures. |

## 8. Proposed decisions (Recommended)

These are the editor's recommendations, recorded as **Recommended** — implementable as written, but Fahim or the organisation may still change them. Each is stated once, in its authoritative location, and cited elsewhere.

| # | Decision | Authoritative location | Status |
|---|---|---|---|
| R-1 | Pending-member login: Side B (login succeeds, "awaiting approval" screen, services locked) | Doc 04 §8.15, Doc 05 §9.2, Doc 07 A5, Doc 02 REQ-M1-004, Doc 14 AC-M1-03 | Recommended — REG-AUTH-01 (Fahim's confirmation needed) |
| R-2 | Tracking-secret validity after a terminal status: 90 days | Doc 04 §7.4 (AO-03) | Recommended — AO-03 |
| R-3 | Donor phone destruction period after withdrawal: 90 days | Doc 06 §11.5 (AO-12) | Recommended — AO-12 |
| R-4 | CAPTCHA: none in Phase 1 (rate limits + honeypot + minimum submit time); provider named only if spam/targeted lockout is observed | Doc 07 §9 (AO-09) | Recommended — AO-09 |
| R-5 | Ledger payee anonymisation on member deletion: anonymise (default) | Doc 06 §11.5 (AO-11) | Recommended — AO-11 |
| R-6 | Media recoverability window: 30 days | Doc 06 §12 (AO-14) | Recommended — AO-14 |
| R-7 | No time-based purge of former-member records (currently: none) | Doc 06 §11.5 (AO-15) | Recommended — AO-15 |
| R-8 | Activity detail, unknown ID: 404 (not fall back to the first activity) | Doc 02 REQ-M4-003 (REG-PROD-06) | Recommended — REG-PROD-06 |
| R-9 | Swagger/OpenAPI UI: not exposed on production | Doc 07 §10 (REG-PROD-18) | Recommended — REG-PROD-18 |
| R-10 | Two Super Admins from day one | Doc 04 §3.1/§3.2 (REG-AUTH-05, RBAC-2) | Recommended — REG-AUTH-05 |
| R-11 | Media: local `public` disk first, S3-compatible later on stated triggers | ADR-007 (REG-TECH-07) | Recommended |
| R-12 | Queue: database driver first; Redis + Horizon v5 only on triggers | ADR-008 (REG-TECH-08) | Recommended |
| R-13 | Cache: database driver first; no tag-dependent code unless Redis adopted | ADR-009 (REG-TECH-09) | Recommended |
| R-14 | Search: Scout `database` engine first (BOOLEAN MODE); Meilisearch only if typo/Bengali search demonstrably fails | ADR-010, §9 (REG-TECH-10) | Recommended — now measured (§9) |
| R-15 | Deployment: single VPS 4vCPU/8GB/80GB, Ubuntu 24.04 LTS, Docker Compose, GitHub Actions, Let's Encrypt, Cloudflare free optional | ADR-012 (REG-TECH-12) | Recommended — pending hosting/domain confirmation |
| R-16 | Reverb (realtime) optional; NOT relied on for Phase 1 notifications | Doc 05 §12.3 (REG-TECH-15) | Recommended |
| R-17 | Filament Shield: NOT adopted; adopt only after version/maintenance/compat check | Doc 05 ARCH-5 (REG-TECH-16) | Under review |
| R-18 | Pest 4 / PHPUnit 12 default; Pest 5 opt-in only; Larastan 3.x; Pint v1 | Doc 05 §2.3 (REG-TECH-17) | Recommended — confirm at scaffold |
| R-19 | Next.js / Flutter versions: verify current stable at build time, do not assert | Doc 05 §2.3 (REG-TECH-18) | Recommended |
| R-20 | Infrastructure data model (C6–C8) and project accounts (F9) and video gallery (G4–G5): proposed until Sprint 1 confirmation | Doc 07 §17 item 7 (REG-PROD-15/16/17) | Proposed |
| R-21 | Log retention: audit logs for the life of the system; application logs 90 days | Doc 08 §14 item 6 (REG-OPS-03) | Proposed |
| R-22 | Finance draft edit + discard endpoints: F3a (`PUT /api/v1/finance/entries/{id}`) edits a draft entry (`id`, `entry_no`, `entered_by` never change); F3b (`POST /api/v1/finance/entries/{id}/discard`) discards a draft (reason ≥10 chars) — a status change, never a delete, `entry_no` never reused | Doc 07 §14.7 (F3a/F3b); Doc 09 §3.11; Doc 14 AC-M8-06 | Recommended — Phase 0.1.1 (Worker B) |
| R-23 | Finance rejection separation: the F6a rejecter must differ from the entry's enterer (same permission `finance.approve`, same dual-control error); a rejected entry stays `draft` and can be corrected (F3a) and resubmitted (F4) | Doc 04 §6.1 item 7; Doc 07 F6a | Recommended — Phase 0.1.1 (Worker B) |
| R-24 | Push-subscription re-registration by a different user: upsert transfers the row to the new user, audit-logged (the endpoint identifies a browser, not a person) | Doc 06 §2.4 (Worker A) | Recommended — Phase 0.1.1 (Worker A) |
| R-25 | Public-tracking JSON field names and ISO 8601 UTC timestamps (Worker C `ALLOWLIST.md` §7): exact response shape as proposed | Doc 07 X2; Doc 04 §7.4 | Proposed — Phase 0.1.1 (Worker C) |

## 9. Bengali full-text search — methodology, dataset, measured results, recommendation

Investigator E measured Bengali search on **MySQL 8.0.46, not 8.4**. Nothing in this section is a claim about 8.4 performance. **Superseded for production 2026-11-14:** MariaDB 11.8.9 has no ngram parser, so the §9.4 ngram recommendation does NOT transfer — the adopted approach is default-parser FULLTEXT + BOOLEAN MODE with `+term*` wildcards as a model scope (see §22 and 16-MARIADB-ADDENDUM.md §3.4). This section stays verbatim as the Phase 0.1 measurement record. The 8.0 → 8.4 ngram feature-set equivalence was verified from the MySQL 8.4 manual (§14.9.8); timings on 8.4 were not measured and are required before launch (re-test checklist below).

**Reproducibility package (Phase 0.1.1):** the generator, schema, queries list, runner, README and 8.4 run guide are published as `docs/backend-architecture/benchmark/` (`README.md`, `generate_dataset.py`, `schema.sql`, `queries.md`, `run_benchmark.py`, `RUN-ON-8.4.md` — 77 KB of text; no generated datasets, no binaries). The generated `seed.sql` (~1.8 MB) and the raw 8.0.46 result files stay out of the repo by design and are regenerated on demand. The package was verified end-to-end on 2026-11-14 (Worker D): the generator reproduces the Phase 0.1 `seed.sql` byte-for-byte (md5 `b2164ed52f58e36d3954a42cebacad40`), and the packaged runner re-run on MySQL 8.0.46 reproduced all 133 count pairs exactly (see the package `README.md` and the Phase 0.1.1 test log).

### 9.1 Methodology

- **Engine:** MySQL 8.0.46 (local instance), InnoDB, `utf8mb4`. Approaches compared per query: default-parser `FULLTEXT` (natural language), ngram-parser `FULLTEXT` in **BOOLEAN MODE** (`ngram_bool`), ngram-parser `FULLTEXT` in **NATURAL LANGUAGE MODE** (`ngram_nl`), `LIKE '%term%'` (`like_pct`), `LIKE 'term%'` prefix (`like_prefix`) on B-tree indexes, and an app-level full scan (`app_level`: one-time load of the whole table via the `mysql` CLI, then Python substring scan per query — timings only, recorded in the raw results).
- **Timing:** median of 3 runs, server-side `SHOW PROFILES`. Counts are exact row counts per approach.
- **Cases:** **35 test cases, 133 timed queries, 133 count pairs** (see `benchmark/queries.md` for the full list with expected-behaviour notes). Correction (Phase 0.1.1): the Phase 0.1 report E §3.3 said "37 cases, 134 count pairs". The runner defines 35 distinct case labels and the raw results contain 35 cases and 133 count pairs; the extra "134th" count entry is the `rows` row-count line, not a case. The 133 timed queries were correct.
- **Reproduction:** `docs/backend-architecture/benchmark/` — see the package `README.md`. The Phase 0.1 raw result files (`raw_results.json/.md`) are regenerated by running the package, not stored in the repo.

### 9.2 Dataset characteristics

- **Synthetic, 3,900 rows:** `posts` 1,800; `persons` 1,500; `activities` 600. Seed `20261114`. **No real organisation data** — names, notices, and activities are generated. Results describe the approaches on this dataset, not on production data.
- **Index build times:** `posts_ngram_ft` 548.4 ms; `persons_ngram_ft` 95.5 ms; `activities_ngram_ft` 129.7 ms; `persons_name_btree` 30.2 ms; `posts_title_btree` 36.7 ms.
- **Known dataset limit:** the `persons` FULLTEXT index covered **names only** — `profession_bn` / `area_bn` were not indexed. The query `শিক্ষক` (teacher) returned 0 rows under boolean mode, default-parser FULLTEXT and `LIKE`, because the data was not in the indexed/searched columns — but **175 rows under ngram natural-language mode** (pure bigram noise: NL matches any document containing any one of the query's bigrams). The 0s are correct for a name-only index; the 175 is further evidence NL mode is unusable as a default. This is a dataset/index defect, not an engine defect — and it is why Doc 06 §3.2 now requires the `persons` FT index to cover `profession_bn` / `area_bn` (denormalised search snapshots, §7 item 16).

### 9.3 Measured results (median of 3 runs)

Single-word cases — boolean counts identical to `LIKE '%term%'` in every case:

| Case | `LIKE '%term%'` | ngram BOOLEAN | ngram NATURAL | default-parser FT |
|---|---|---|---|---|
| activities[বৃত্তি] | 46 rows, 0.605 ms | 46 rows, 0.939 ms | 505 rows, 1.275 ms | — |
| activities[রক্তদান] | 66 rows, 0.432 ms | 66 rows, 1.186 ms | 600 rows, 1.465 ms | — |
| activities[শীতবস্ত্র] | 49 rows, 0.588 ms | 49 rows, 1.183 ms | 528 rows, 1.483 ms | — |
| persons[মোহাম্মদ] | 37 rows, 0.821 ms | 37 rows, 0.865 ms | 482 rows, 1.165 ms | 37 rows, 0.355 ms |
| persons[চক্রবর্তী] | 58 rows, 0.425 ms | 58 rows, 1.081 ms | 247 rows, 0.885 ms | 58 rows, 0.271 ms |
| persons[মোহা] (partial) | 37 rows, 0.733 ms | 37 rows, 0.594 ms | 341 rows, 0.586 ms | **0 rows**, 0.141 ms |
| persons[রহিম] | 33 rows, 0.832 ms | 33 rows, 0.624 ms | 289 rows, 0.641 ms | 33 rows, 0.255 ms |
| persons[শিক্ষক] | 0 rows, 1.126 ms | 0 rows, 0.145 ms | **175 rows**, 0.436 ms | **0 rows**, 0.121 ms |

Other cases:

- **Prefix/autocomplete:** `persons_prefix[মোহাম্মদ]` — `LIKE 'term%'` 37 rows, 0.18 ms; ngram boolean 37 rows, 0.774 ms. `posts_prefix[শিক্ষা]` — `LIKE 'term%'` 60 rows, 0.237 ms; ngram boolean **792 rows**, 8.018 ms (ngram matches the substring anywhere, not just at the start — it is a substring tool, not a prefix tool).
- **Relevance (multi-word):** `posts_relevance[রক্তদান শিবির]` — ngram natural 1,800/1,800 rows, 8.803 ms; `posts_relevance[শীতবস্ত্র বিতরণ]` — 1,800/1,800 rows, 9.062 ms. Natural-language mode matched ~100% of rows. Top-20 precision for `রক্তদান`: **8/20**.
- **Spelling variants NOT tolerated by any approach:** `মাদরাসা` vs `মাদ্রাসা`, `সাতানিপাড়া` vs `শাতানিপাড়া` vs `সাতানীপাড়া`, `রক্ত দান` vs `রক্তদান`, `শীত বস্ত্র` vs `শীতবস্ত্র` — natural-language mode returned 1,800 rows for each variant (no discrimination); boolean mode returns only the variant's own rows (`শাতানিপাড়া` 54, `সাতানীপাড়া` 54, `মাদরাসা` 38, `মাদরাসা` 51 — identical to `LIKE`), so the variant result sets are disjoint and a user typing the variant spelling misses ~94% of the org-name rows. No approach corrects spelling.
- **1-character edge:** `posts_partial[র]` — `LIKE` 1,800 rows, 0.102 ms; ngram boolean 1,800 rows, 2.704 ms; ngram natural 0 rows.
- **App-level full-scan (Python substring over all rows):** loading 1,800 posts (1,003,964 bytes) took 35.9 ms — a full scan is not a search strategy, recorded only as a baseline.
- **Speed summary:** default-parser FULLTEXT was fastest (median 0.12–0.92 ms across the measured cases) but returned **0 rows for partials**; ngram boolean was 0.15–14.96 ms on single-word cases (cost scales with the true match-set size — `সাতানিপাড়া`, 928 matches, 14.96 ms; `শীতব`, 50 matches, 0.63 ms); `LIKE '%term%'` was 0.10–5.64 ms. At 3,900 rows, speed does not decide anything — correctness does.

### 9.4 Recommendation (adopted)

1. **Primary: ngram `FULLTEXT` + BOOLEAN MODE.** Boolean counts matched `LIKE '%term%'` exactly in every single-word case, including partials (`মোহা` → 37/37).
2. **NATURAL LANGUAGE MODE must NOT be the default.** It matched ~100% of rows (e.g. `রক্তদান` → 1,800/1,800) with top-20 precision 8/20. **Scout's database engine defaults to natural-language mode** — if Scout is adopted, it must be configured to boolean mode (ADR-010 rewritten accordingly).
3. **Prefix/autocomplete: `LIKE 'term%'` on a B-tree index** (never `term*` in boolean mode — boolean `*` is a suffix wildcard, not a prefix operator, and ngram boolean is substring matching, not prefix matching).
4. **Query-builder rules:** ≥2 characters per term; escape boolean operators in user input; split multi-word input and join with `+` AND operators.
5. **Spelling variants are NOT tolerated** — no approach corrects them. Do not promise typo tolerance; Meilisearch remains the later option if typo tolerance is ever required (REG-TECH-10).
6. **`persons` FT index must add `profession_bn` / `area_bn`** (done in Doc 06 §3.2 — a name-only index cannot answer `শিক্ষক`).

### 9.5 Re-test checklist (before launch)

- [ ] Re-validate the search approach on **MariaDB 11.8.9** (the ngram benchmark cannot be re-run as-is — MariaDB has no ngram parser; the MariaDB benchmark is measured: 35 cases / 171 timed queries in `benchmark-mariadb/` — re-run it on production per `benchmark-mariadb/RUN-ON-PRODUCTION.md`) and record whether the 8.0 MySQL results hold in any form. File the production MariaDB `raw_results.json/.md` as a dated, version-labelled artefact; do not overwrite the 8.0.46 summary above in place.
- [ ] Re-run on a **real-data snapshot** (real Bengali names/notices, with consent) — synthetic data cannot validate relevance.
- [ ] Verify the boolean query-builder rules (§9.4 item 4) in the actual search implementation, including operator escaping.
- [ ] 50k-row scale check — re-measure index build times and query latencies at an order of magnitude more rows.
- [ ] Confirm the `persons` FT index covers `profession_bn` / `area_bn` in the migrated schema (`INFORMATION_SCHEMA.STATISTICS`).

## 10. Confirmed decisions

These are **Confirmed** after Phase 0.1. A Confirmed decision is closed unless Fahim reverses it; it is not re-opened by a later investigator disagreeing with it.

| # | Decision | Authority |
|---|---|---|
| C-1 | Database: **MariaDB 11.8.9 + InnoDB** (supersedes MySQL 8.4 LTS + InnoDB, itself the Phase 0.1 decision). PostgreSQL superseded everywhere; historical mentions explicitly marked superseded, never presented as current. | Fahim, 2026-11-14 (Doc 13 Q-26 closed, then superseded; ADR-003 as superseded by 16-MARIADB-ADDENDUM.md) |
| C-2 | Authoritative counts: **48 application tables** (50 defined, 58 physical); **134 endpoints**. (`sequences` defined as the 48th table, 2026-11-14 — see Doc 16 §3.10.) | | Mechanically verified (C; Batch 6 §12) |
| C-3 | Phase 1 admin roles: exactly **Super Admin + Expatriate Helper**; the Expatriate Helper IS the ERT operational role (no third role). No OTP. | Decision Sheet; REG-SCOPE-01 |
| C-4 | Direction D is the approved **working** frontend direction; the client's formal Design OK is still pending (REG-ORG-09). | Decision Sheet; Doc 13 A-01 |
| C-5 | Password policy (single, authoritative in Doc 04 §5.1): 12 chars minimum all accounts, **16 enforced for Super Admin**, no composition rules, mandatory breach screening (HIBP k-anonymity 2s timeout + local ≥10,000 list always enforced + context blocklist), Argon2id m=19 MiB t=2 p=1 (bcrypt cost ≥12 fallback with >72-byte rejection), history 5, no expiry, temp passwords random ≥16 chars single-use 24h. Documented deviation from the NIST 800-63B-4 15-char single-factor floor (primary-verified at https://doi.org/10.6028/NIST.SP.800-63B-4, §3.1.1.2). | B §3.1; NIST SP 800-63B-4 (primary) |
| C-6 | Tracking-secret design: Request ID is never a credential; 128-bit secret (`random_bytes(16)`, 32 hex chars), SHA-256 hash storage, `POST /api/v1/expatriate-requests/track` with body (never GET/URL), uniform 404, 10/min/IP + 5/min/Request ID, 10 failures/60 min → 60-min lock, Tier-S allowlist view. | B §3.4; Doc 04 §7.4; Doc 07 §8.3/X2 |
| C-7 | Finance dual control **mandatory, enforced**; approve IS publish (single step, F4); `finance.publish` deleted; F6a reject endpoint (reason ≥10 chars, stays `draft`); reversal-approver rule (approver ≠ reversal creator; creator MAY be original enterer). | B §3.7; Doc 04 §6.1; Doc 07 F4/F6a |
| C-8 | Ledger status enum: `draft` / `published` / `reversed` / `discarded`. No `approved` state. | §7 item 4 |
| C-9 | Guest workflow: X11 confirm-close + X12 cancel (secret-authenticated); **no completion-notification channel for guests in Phase 1** — tracking IS the notification. | B §3.8 |
| C-10 | Notifications: two sources of truth (`notifications` = what the user was told/read state; `notifications_log` = delivery attempts; retry ≤3 with exponential back-off; `notification_id` non-null in practice). | B §3.9 |
| C-11 | Retention: three-tier backup retention (daily 30d / weekly 12w / monthly 12m); audit log permanent; no invented periods beyond the blueprint figures (confirmation as organisational policy is AO-16). | B §3.11 |
| C-12 | API privacy: authenticated rate limit 120/min/user; B6 strict bucket 10/min/user; A1 423 only after correct password presented, else generic 401; X7 `accept`/`advance`; X8 `expatriate.expenses.create`; M2 phone-change default = Super Admin re-verification required (AO-17 is the open question, the default is decided). | B §3.12 |
| C-13 | Restore cadence (canonical sentence): **"Monthly automated restore check + quarterly full restore rehearsal, mandatory, documented (Doc 06 §13)."** | Phase 0 review; R-09 |
| C-14 | Canonical module→phase map (Doc 12 §1.5): M1→Ph2, M2/M3→Ph3, M4/M7→Ph4, M5/M6→Ph5, M8→Ph6, M9→Ph5 (partial) + Ph7 (remainder), M10→Ph8 (separate approval), M11→Ph7, M12→Future Mobile. | D §2 |
| C-15 | 4-node timeline display rule (R-14): public tracking shows Pending → Accepted → In Progress → Completed; `closed` is a completion banner; `rejected`/`cancelled` replace the timeline with a terminal-state notice. | Doc 05 §9.1, Doc 07 X2, Doc 14 AC-M5-09 |
| C-16 | Content `review` is a same-person checkpoint in Phase 1, not a second-person approval (R-17). | Doc 02 REQ-M7-005, Doc 05 §9.3, Doc 14 AC-M7-05 |
| C-17 | Directory edit of a published entry: `visibility=private` (T-04 `pending_review` superseded). | Doc 07 C4 |
| C-18 | Four database users, mandatory: `satanipara_app` (DML, no DELETE on ledger/audit tables), `satanipara_migrate` (DDL, deploy pipeline only), `satanipara_backup` (read-only + LOCK TABLES), `satanipara_report` (read-only, provisioned only when the Finance Auditor role is needed). `REVOKE DELETE` on `ledger_entries` for `satanipara_app`; append-only triggers (SQLSTATE 45000) on `activity_log` and `ledger_entries`. | A §2.3/§2.4; Doc 04 §5.7; Doc 06 §8.2 |
| C-19 | Self-lockout guard **mandatory**: a Super Admin cannot remove their own Super Admin role. | Doc 04 §3.2; Doc 09 §3.2 |
| C-20 | Session values: 120 min member/helper idle, 30 min Super Admin idle, 12 h absolute; mobile tokens 30 days; no hard concurrent-session limit. | B §4.3; Doc 04 §5.4 |
| C-21 | Login throttling: 5/15 min, then 10 → 30-min lock growing 30 → 60 → 240 min; A1 423 only after a correct password. | B §3.1/§4.2; Doc 04 §5.2 |
| C-22 | Password-reset mechanism: Super-Admin-mediated, system-generated single-use temporary password, 24 h expiry, no reset link, no `new_password` field. (The delivery channel / identity-verification procedure is AO-05.) | B §3.6.5; Doc 04 §5.5 |
| C-23 | Migration order (13 steps, C §5): media before organisation; counter table step 1; `service_types` step 3; `constitution_versions` step 6; deferred FKs step 11; seeders step 12; production `migrate:rollback` is staging-only. | C §5; Doc 06 §10 |
| C-24 | Bengali search: ngram `FULLTEXT` + BOOLEAN MODE as primary **on MySQL only — SUPERSEDED for production** (MariaDB 11.8.9 has no ngram parser); natural-language mode must NOT be the default; Scout database engine in boolean mode if adopted. The MariaDB search approach is decided in 16-MARIADB-ADDENDUM.md. | E; §9; 16-MARIADB-ADDENDUM.md |
| C-25 | Effective PHP floor is **8.4** (spatie/laravel-backup v10.4.0 requires `php ^8.4`); PHP target 8.4/8.5, floor 8.3, never 8.2. The 8.4-vs-8.5 pick is open (REG-TECH-02a). | A (Packagist metadata); ADR-002, ADR-013 |
| C-26 | No prices anywhere in the blueprint (quotation is separate, recommendations only, not final, not sent). | Task constraint; root README |

## 11. Awaiting Organisation decisions — outstanding owner-decision register

Merged from B §6.2 (AO-01–AO-17), D §4 (REG-*), and the C/D open items, deduplicated. Phase 0.1.1 adds AO-18–AO-21 (Tier-S B-only fields, Worker C). "Owner" is the party who must decide; "Blocks" is what cannot proceed (or cannot be called final) until it is decided. Nothing here is decided by the editor.

| # | Decision | Owner | Blocks |
|---|---|---|---|
| AO-01 | 15-character minimum for **all** accounts (full NIST SP 800-63B-4 single-factor compliance) vs 12 for Members/Helpers (documented deviation)? | Fahim (Doc 13 Q-05) | Nothing in Phase 1 (12 is implementable now); the deviation note must stay until decided. |
| AO-02 | Is MFA for Super Admins **required at launch** or deferred/optional? (Build TOTP behind a flag either way.) | Organisation (Doc 04 §11 RBAC-3) | Go-live MFA posture; the runbook entry. Build is not blocked. |
| AO-03 | Tracking-secret validity period after a terminal status (recommended: 90 days). | Organisation | Phase 1 tracking build (the value is configurable; the build needs a number before launch). |
| AO-04 | Should the Tier-S tracking view additionally include the applicant's first name or the beneficiary name? (Default: no.) | Organisation (Doc 13 Q-02) | The tracking response shape. |
| AO-05 | **Identity-verification procedure** (in person? call-back to a known number? other?) + the **outbound channel** for delivering temporary passwords, tracking secrets, and completion updates (in person? phone call? later email?). | Organisation (with Fahim) | Password-reset delivery, secret regeneration, recovery authorisation — all three flows need a named procedure before go-live. |
| AO-06 | Emergency escalation rules for flagged expatriate requests (who is alerted, in what order, what counts as an emergency). | Organisation (Doc 13 Q-17) | Emergency request handling (the flag exists; the rules do not). |
| AO-07 | **Who, by office, authorises a recovery bootstrap** (e.g. President / General Secretary — name the office). | Organisation | Recovery path (Doc 04 §5.8/RBAC-4) — without a named authoriser the procedure cannot be executed. |
| AO-08 | Is the single-approver finance exception (written sign-off) wanted at all, and if so who signs it and for how long? (Default: not used.) | Organisation (client sign-off) | Nothing in Phase 1 (the exception is a policy document, not code). |
| AO-09 | CAPTCHA provider (if spam/targeted lockout is observed) — which provider, and is it approved? Default Phase 1: no CAPTCHA. | Organisation (with Fahim / build team) | Nothing in Phase 1; the mitigation path must be named before it is needed. |
| AO-10 | Guest blood-request status checking: add a secret-authenticated blood-tracking endpoint, or update guest blood requesters out of band by phone? | Organisation | Guest blood-requester experience (currently no status-check path for guests). |
| AO-11 | On member deletion, are `payee_bn` / `donor_name_bn` in ledger entries anonymised, or kept for financial-record integrity? (Default until decided: anonymise.) | Organisation (with Fahim) | Phase 1 anonymisation job (it must know whether to rewrite ledger payee fields). |
| AO-12 | Donor phone destruction period after withdrawal (recommended: 90 days). | Organisation | Phase 1 donor-withdrawal build. |
| AO-13 | `notifications_log` cold-storage mechanism after 2 years (destination, format, access control). | Organisation / build team | Nothing in Phase 1 (first archive ≥ 2 years after launch). |
| AO-14 | Media recoverability window (blueprint: 30 days). | Organisation | Phase 1 media pipeline (purge job timing). |
| AO-15 | Any time-based purge of former-member records (currently: none). | Organisation | Nothing in Phase 1. |
| AO-16 | Confirmation of the blueprint's retention periods as organisational policy (2-year `notifications_log`, 1-year read-notification prune, 90-day application logs, 30-day backups, 30-day deletion grace). | Organisation | Handover sign-off (the build implements the blueprint figures; the runbook records them as "to be confirmed at handover"). |
| AO-17 | Phone-number change re-verification by a Super Admin (Doc 07 M2). Default until decided: **required** (the phone is the login identifier). | Organisation (with Fahim) | Member profile-update build (M2). |
| AO-18 | Should the Tier-S tracking view additionally include the request timing preference (`urgency`, `needed_by`) and/or the request-level timestamps (`created_at`, `updated_at`)? These appear only in Investigator B §3.4.3 — in no repo doc's Tier-S summary. (Default until decided: no — excluded.) | Organisation (Doc 13 Q-02) | The tracking response shape (X2). |
| AO-19 | Should the Tier-S tracking view additionally include the `rejection_reason` / `cancellation_reason` text for terminal requests? It appears only in Investigator B §3.4.3 — in no repo doc's Tier-S summary. (Default until decided: no — excluded; a `rejected`/`cancelled` request shows `status` + empty `timeline` only.) | Organisation (Doc 13 Q-02) | The tracking response shape (X2); the terminal-state notice copy. |
| AO-20 | Should the Tier-S tracking view additionally include the `no_expense_declaration` flag? It appears only in Investigator B §3.4.3 — in no repo doc's Tier-S summary. (Default until decided: no — excluded; a completed request with no expenses shows `expenses: []` and `expense_total: 0`.) | Organisation (Doc 13 Q-02) | The tracking response shape (X2). |
| AO-21 | Should the Tier-S tracking view additionally include plain (non-transition) progress notes and/or update photos (incl. the completion photo, Doc 05 §9.1)? Doc 03 §14 and Doc 14 AC-M5-04 state or imply they are included; every Tier-S summary excludes them. (Default until decided: no — excluded; plain notes and photos stay visible only to the logged-in applicant, helpers, and Super Admins.) | Organisation (Doc 13 Q-02) | The tracking response shape (X2); whether the completion photo ever reaches the public view. |
| REG-AUTH-01 | Pending-member login: Side B (Recommended, §8 R-1) vs Side A (refused). | Fahim | Phase 2 (auth endpoints A1/A5) and Doc 10 §5 authorisation matrix. |
| REG-AUTH-05 | Two Super Admins from day one (Recommended, §8 R-10) vs start with one. | Organisation | Phase 1 (bootstrap) + Phase 6 (a one-Super-Admin organisation cannot publish finance). |
| REG-PROD-02 | Expatriate submission in production: public (no login) vs member-only. | Organisation + Fahim (Doc 13 Q-03) | Phase 5 (before intake endpoint finalised). |
| REG-PROD-03 | Expatriate wizard: 3 steps (built) vs 4 steps (Design System §7.1) — D11. | Fahim / design owner (Doc 13 Q-01) | Phase 7 (web client build) — backend NOT blocked. |
| REG-PROD-04 | Homepage structure: plan's 11 parts vs Direction D's 9 sections. | Fahim / design owner (Doc 13 Q-19) | Phase 7. |
| REG-PROD-05 | Language/theme preference persistence (per user? per device? session-only? `prefers-color-scheme`?). | Fahim (Doc 13 Q-20) | Phase 7. Doc 06 already has `locale`/`theme` columns — that is not the decision (R-13). |
| REG-PROD-06 | Activity detail, unknown ID: fall back to first activity vs 404 (Recommended: 404, §8 R-8). | Fahim (Doc 13 Q-16) | Phase 4. |
| REG-PROD-07 | Expatriate service list: 7 (prototype `SVC`) vs 6 (plan). | Organisation + Fahim (Doc 13 Q-22) | Phase 5. The catalogue table exists; the final list is the open part. |
| REG-PROD-08 | Event RSVP: display-only (default) vs registration. | Organisation (Doc 13 Q-18) | Phase 4. If RSVP, it is a new entity + scope. |
| REG-PROD-09 | Map: include or not; provider; what location data is published. | Organisation + Fahim (Doc 13 Q-15) | Phase 3 (infrastructure). Exact household locations never published. |
| REG-PROD-11 | Voting rights: real future requirement or copy to correct ("ভোটাধিকারসহ সব সুবিধা"). | Organisation (Doc 13 Q-21) | None in Phase 1 (copy fix when decided). If real, it is a new module (separate approval). |
| REG-PROD-15 | Infrastructure data model + whether a map is wanted (C6–C8 scope). | Organisation (facility data?) + Fahim | Phase 3. C6–C8 stay proposed until facility data is confirmed. |
| REG-PROD-16 | Project accounts scope (F9). | Organisation + Fahim (Sprint 1) | Phase 6. |
| REG-PROD-17 | Video gallery scope (G4–G5). | Organisation + Fahim (Sprint 1) | Phase 4 (as placeholder); build = plan Phase 2. |
| REG-PROD-18 | Swagger/OpenAPI UI exposed on production or not (Recommended: not exposed, §8 R-9). | Build team / Fahim | Phase 1. |
| REG-TECH-02a | PHP 8.4 (conservative) vs 8.5 (longest runway). | Build team at scaffold | Phase 1. Host PHP availability + package resolution at scaffold; record in runbook. |
| REG-TECH-03 | Database version/pinning detail under MariaDB 11.8.9 (exact 11.8 patch as verified on the host, charset `utf8mb4` / collation `utf8mb4_unicode_ci` for Bengali, `innodb` settings). | Build team + Fahim | Phase 1. MariaDB 11.8 LTS lifecycle check at scaffold; Bengali collation decision (`utf8mb4` + `utf8mb4_unicode_ci`) recorded in 16-MARIADB-ADDENDUM.md. |
| REG-OPS-03 | Log retention (audit logs for life of system; app logs 90 days — Proposed, §8 R-21). | Organisation | Phase 1. |
| REG-OPS-04 | Concurrent-session policy (one session per user? multiple?). Session/timeout values are decided (C-20). | Build team / Fahim | Phase 2. |
| REG-OPS-05 | CSP `unsafe-inline` exception for a named dependency (if any). | Build team | Phase 7. |
| REG-OPS-07 | Named incident contact + breach-notification wording; on-call contact + alert channel. | Organisation | Phase 9 (before go-live). |
| REG-OPS-08 | Next.js hosting: same VPS vs separate hosting. | Fahim / build team | Phase 7. |
| REG-OPS-09 | Cloudflare enabled? + trusted-proxy config if so. | Build team | Phase 1/7. |
| REG-OPS-10 | Support channel (single named channel for org issue reports) + warranty model. | Organisation | Phase 9. |
| REG-OPS-11 | Admin dashboard (Doc 12 Phase 8) separate approval — **gate, not a decision to pre-answer**. | Fahim / organisation | Phase 8. Separate written approval, recorded, before Phase 8 starts. |
| REG-OPS-12 | Future Mobile (Flutter app) separate decision + budget; Apple Developer account (Q-23). | Organisation | Future Mobile. |
| REG-ORG-01 | Final domain name + in whose name/email registered. | Organisation (Doc 13 Q-07) | Phase 1 (Sanctum stateful domains, SSL, sitemap/SEO). |
| REG-ORG-02 | Formal logo, or logo design as separate scope. | Organisation (Doc 13 Q-08) | Phase 7 — backend NOT blocked. |
| REG-ORG-03 | Final Expatriate Helper list (names + numbers) + ERT roster (3–5) + backups. | Organisation (Doc 13 Q-09) | Phase 2 (accounts) + Phase 5 (notifications). |
| REG-ORG-04 | Primary data owner (statistics, committee info) — is that person the Super Admin? | Organisation (Doc 13 Q-25) | Phase 3 (data onboarding). |
| REG-ORG-05 | Real contact details (office address, hours, phone, email) — verified. | Organisation (Doc 13 Q-06) | Phase 7 (contact page). Until verified, "updating" state. |
| REG-ORG-06 | Public vs members-only statistics policy. | Organisation (Doc 13 Q-10) | Phase 3 (`visibility` defaults, `GET /public/stats`). |
| REG-ORG-07 | Public finance summary level (monthly totals only vs project-level detail) + second approval step for published figures. | Organisation (Doc 13 Q-11) | Phase 6. Linked to REG-FIN-01 (dual control is decided; the summary level is not). |
| REG-ORG-08 | Real data: members/families, committee/advisory/former leaders, donor registry with consent, finance records + audited reports, photos with consent, constitution text, verified history beyond 1999, domain + logo. | Organisation (Doc 13 A-02) | Phases 3–6, 9 (data-migration rehearsal). Via the Phase 0 data-collection template; consent per record. |
| REG-ORG-09 | Client Design OK for Direction D (formal). | Organisation / client (Doc 13 A-01) | Phase 7 (final visual build). Until then Direction D is the *working* direction, not finally approved. |
| REG-ORG-10 | UAT testers (2–3) + named sign-off owner per step. | Organisation (Doc 13 Q-24) | Every phase's UAT (Doc 12). |
| REG-ORG-11 | Hosting/domain/store account ownership (all in organisation's name/email, never the developer's). | Organisation (Doc 13 Q-27) | Phase 1. Handover includes full access + restore drill. |
| REG-ORG-12 | Online donation/payment in future? (Phase 2, merchant-account readiness) + Apple Developer account. | Organisation (Doc 13 Q-12/Q-23, deferred) | No Phase 1 block. |
| REG-ORG-13 | Office-holder contact-display rules (committee contact details shown under org's rules). | Organisation (Doc 13 Q-06 part) | Phase 3. |
| REG-ORG-14 | Bengali FTS test data (real Bengali names/notices for the search-quality test). | Organisation (Doc 13 Q-13 / REG-TECH-10) | Phases 3–4. Real Bengali corpus; test run on MariaDB 11.8.9. |
| DB-3 | Restore-test cadence: the cadence is decided (C-13); the **runbook adoption** is the remaining step. | Build team (runbook) | Phase 1 (backup job) / Phase 9 (rehearsal). Stays open until the runbook records the adopted cadence. |

## 12. Verification evidence (Batch 6)

Batch 6 verification was run after all Phase 0.1 edits, against the staging copy. Each check, its result, and its evidence are recorded in `~/workspace/satanipara-phase0-1/verification-log.md`. Summary:

> **Batch 6 status: PASS — all 13 checks passed (2026-11-14, script `/tmp/b6check.py`, full output in `~/workspace/satanipara-phase0-1/verification-log.md`).** Doc 14 G-18 and P0-09 were re-ticked on this pass (§14).

Checks (all executed, none claimed). The full diff was read end to end (3,198 lines, 32 files changed + this document new) before the scripted checks ran; the scripted checks were re-run after every fix round, and the final run below is on the final tree.

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Full diff staging vs the `f4934b7` clone, read in full | PASS | 3,198 lines; 33 files changed + this document new (34 files in the push set); scope matches the edit plan (Docs 01–14, backend README, 13 ADRs + adr/README, 3 diagrams, root README); the only file with no diff is `diagrams/RBAC-MATRIX.md`, which is expected (no edits applied to it). |
| 2 | Markdown lint + structure (C9) | PASS | `mdl`/`markdownlint` unavailable; Python `markdown` module not installed — stated, not assumed. Structure check by script: code fences balanced, no heading jumps, in all 35 staging files. |
| 3 | Broken internal links (C1) | PASS | 13 links checked (targets resolved in staging, falling back to the clone for repo paths such as `index.html`/`alternatives/`); 0 broken. |
| 4 | Endpoint count + duplicate IDs (C2) | PASS | 132 endpoint rows in Doc 07 §14, 132 unique IDs, no duplicates. (Batch 6, Phase 0.1. Phase 0.1.1 adds F3a/F3b → 134 rows, re-verified in §21.) |
| 5 | Table inventory + ERD/schema reconciliation (C3) | PASS | Doc 06 headings: 47 application tables (3 combined sections: §2.2 covers roles/permissions/model_has_roles + 2 pivots, §3.8 and §5.8 cover 2 each); 2 pivots named in §2.2; 8 framework rows in §8.6; ERD: 49 boxes; §16: 57 tables. All three sets agree. (Now 48/50/58 — `sequences` defined as the 48th table 2026-11-14; see Doc 16 §3.10.) |
| 6 | ADR status consistency (C4) | PASS | 13 ADR files vs the backend README table vs the adr/README table agree: 8 Confirmed, 5 Recommended. |
| 7 | Stale/contradictory terminology (C5) | PASS | 0 unclassified hits after the 39 Batch 6 fixes. Remaining hits are classified: Doc 15's own change record quoting superseded values; 'deleted' notes (Doc 05 'e.g. 300', Doc 13 `finance.publish`); Doc 14 P0-09's explanation of the false claim. |
| 8 | PostgreSQL mentions (C6) | PASS | 42 mentions; 0 live recommendations. All are explicitly marked superseded, or limitation comparisons naming what MySQL lacks (vector search, native FTS configurability). Zero `pg_` tokens outside this document's own history (§4) and checklist (§17) rows. |
| 9 | Roadmap consistency (C7) | PASS | Canonical module→phase map agrees in Doc 12 §1.5 and the root README module table (incl. combined rows M2/M3, M4/M7, M5/M6 and the M9 partial / M10 separate-approval / M12 Future Mobile rows). |
| 10 | Present-tense scan (C8) | PASS | 0 unclassified hits. The 8 flagged lines were reviewed: negations ('none of them is implemented', 'nothing has been built'), a future acceptance condition (Doc 08 §13), and design statements about the future deployment. |
| 11 | Duplicate/contradictory decisions (C10) | PASS | 0 leftover flags on decided items (C4, F4, M2, AD5, dual control, approve-is-publish). Items that are genuinely still open (C6–C8, G4–G5, F9–F10, log retention, export, unpublish endpoint) keep their flags. |
| 12 | 'Wholly proposed' count (C11) | PASS | '7 wholly proposed' everywhere it is stated (Doc 05, ADR-006, Doc 07 §14 intro/§16). |
| 13 | Decision-status reclassification (spot-check in C10/C11) | PASS | Decided items carry 'Decided (Phase 0.1)' markers; open items carry AO numbers and named owners (§11). |

Batch 6 found 39 further issues in two rounds (listed in §6); every issue was fixed and the affected checks re-run to pass. The check scripts themselves had 5 bugs found and fixed during the run (table-heading parse for combined sections, ADR-table regex for unbolded/trailing-text statuses, roadmap combined rows, present-tense negations, set-operator precedence) — no document content was changed to satisfy a check; each check failure was triaged as a document bug or a check bug on the evidence. Gate-closing edits after the last script run (this section, §6, §14, §17 CK-01, §20, the Doc 14 G-18/P0-09 re-ticks, 3× `pgvector` rewords) were verified by re-running the full check script on the final tree — all 13 checks pass.

## 13. Remaining risks

| # | Risk | Why it remains | Mitigation / next step |
|---|---|---|---|
| RK-1 | Generated-column / trigger integrity designs (A §2.1–§2.4) never executed against a real MySQL 8.4 instance in this environment (A UV-10). | No MySQL 8.4 instance exists in this environment; Phase 0 is documentation only. | Scaffold-time execution + tests (CK-15/16/17/21/22). The designs are written as SQL, not as prose, so they are directly testable. |
| RK-2 | Bengali search measured on MySQL 8.0.46, not 8.4 (§9). | No 8.4 instance; 8.0→8.4 ngram equivalence is manual-verified, not timing-verified. | Re-test checklist §9.5 before launch. |
| RK-3 | HIBP Pwned Passwords reachability from the production VPS unverified (B §6.1 item 3). | No VPS access in this investigation. | The policy does not depend on it: the local ≥10,000 list is always enforced; the online check is best-effort with a 2-second timeout (fail-open on remote, fail-closed on local). |
| RK-4 | OWASP ASVS requirement numbers and cheat-sheet parameters verified through secondary sources, not the ASVS PDF itself (B §6.1 item 2). | Primary source not opened in the investigation. | Confirm against https://owasp.org/www-project-application-security-verification-standard/ and the Password Storage Cheat Sheet before citing them as primary. |
| RK-5 | No user research on whether members can reliably use 12- or 16-character passwords/passphrases (B §6.1 item 4). | No user research exists in the blueprint. | A short usability check with real members before launch (recommended, not a Phase 0.1 deliverable). AO-01 is the decision hook. |
| RK-6 | Single-Super-Admin deadlock: one Super Admin + dual control mandatory = no finance publication until a second approver exists. | Structural consequence of C-7. | Two Super Admins from day one (Recommended, §8 R-10 / REG-AUTH-05); Doc 12 Phase 6 acceptance criteria carry the warning. |
| RK-7 | Pending-member login is Recommended, not Confirmed (REG-AUTH-01). | Only Fahim can settle it. | Fahim's word; then the losing side is deleted in one edit (the register records both sides). |
| RK-8 | The live prototype still exposes applicant name/area in public tracking and refuses pending login — the design fixes it, the prototype does not. | The prototype is a static demo; Phase 0.1 edits the blueprint, not the prototype. | The build implements Doc 04 §7.4 / Doc 07 X2, not the prototype's `doTrack()`. Do not quote the prototype's behaviour as the product's. |
| RK-9 | Demo logins are plaintext in the prototype source (Doc 13, Phase 0 audit). | Prototype artefact. | Never carry demo logins into the real system; delete them at handover (REG-SCOPE-07). |
| RK-10 | Random Request IDs can collide (Phase 0 audit defect, carried forward). | The prototype generates IDs client-side. | The build uses the `sequences` table with `SELECT … FOR UPDATE` allocation (Doc 06 §12, CK-16). |
| RK-11 | Real data not yet supplied (REG-ORG-08). | Organisation-side. | Data-collection template; late data delays the affected step, not the quality bar. |
| RK-12 | D11 wizard step count unresolved (REG-PROD-03). | Needs the design owner. | Backend is not blocked; the web client build is. |
| RK-13 | Donor consent in the prototype is a requester-side click; the real consent flow is donor-side. | Prototype limitation. | The build implements the donor-side consent flow (Doc 07 B-series, Doc 10 §4.3). |
| RK-14 | The two `TEXT`-unique designs (`endpoint_hash` / `fcm_token_hash`, Doc 06 §§2.3–2.4) and the ledger trigger/check designs (Doc 06 §7.1) are proven on MySQL 8.0.46 only; re-run on 8.4 at scaffold. | No MySQL 8.4 instance exists in this environment; Phase 0.1.1 is documentation only. | Scaffold-time execution + tests (CK-31; Doc 10 §4.4 T-LED-14, added in Phase 0.1.1). |

## 14. Phase 0.1 acceptance status

- **Doc 14 G-18** ("All documentation reviewed for consistency") — **unticked in Phase 0.1, re-ticked after Batch 6 passed (§12, 2026-11-14)**. The exception list was: 31 MySQL items, 26 database/API mismatches, 12 broken references found — plus 39 further issues found and fixed in Batch 6.
- **Doc 14 P0-09** ("Terminology consistent") — **unticked in Phase 0.1, re-ticked after Batch 6 passed (§12, 2026-11-14)**. The exception list was: endpoint count cited inconsistently, table count wrong, four permission names contradicted Doc 04; all corrected in Phase 0.1 and verified by Batch 6 (checks C2/C3/C5/C10).
- **Doc 14 P0-07** ("Divergences explicit") — **stays ticked**, numbers corrected (132 endpoints at Phase 0.1, 8 added tables; 134 endpoints after Phase 0.1.1 — see §21). The divergences were stated explicitly; the figures were wrong, now fixed.
- **Phase 0.1 acceptance** is the gate in §20. It is not the same as Phase 0's gate: Phase 0.1 accepts the *reconciled blueprint*, not the product. The product gates (Doc 14) still apply at build time.

## 15. Reconciliation matrix

| Area | ERD | Database Schema (Doc 06) | API (Doc 07) | RBAC (Doc 04) | Roadmap (Doc 12) | Status |
|---|---|---|---|---|---|---|
| Database engine | MySQL 8.4 node | MySQL 8.4 LTS + InnoDB (§1.4) | — | MySQL granular privileges (§3.1) | MySQL 8.4 scaffold step | Reconciled |
| Table inventory | 49 boxes (47 app + 2 pivots) | 47 app / 49 defined / 57 physical (§1.4) | — | — | — | Reconciled (§16). Now 50 boxes / 48/50/58 — `sequences` defined 2026-11-14; see Doc 16 §3.10. |
| Service catalogue | `service_types` box + `catalogues` relation | §6.8 + `service_requests.service_type_id` + snapshots | S1–S5 (§14.13) | `service_types.manage` (§4.2) | Phase 5 (M5) | Reconciled |
| Persons as source of truth | `person_id` FKs on `blood_donors` / `emergency_team_members` | §6.4/§6.5 nullable FKs | B-series / X-series use `person_id` | — | Phase 5 | Reconciled |
| Finance ledger | `ledger_entries` / `ledger_reversals` boxes | §7.1/§7.2 (enum, CHECKs, trigger, REVOKE) | F3/F4/F6/F6a/F8/F10 | `finance.create`/`approve`/`reverse`/`reports.publish` (§4.2, §6.1) | Phase 6 (dual control mandatory) | Reconciled |
| Tracking | — | `tracking_secret_hash` + columns (§6.1) | X2 `POST /expatriate-requests/track` | Tier-S allowlist (§7.4) | Phase 5 | Reconciled |
| Password policy | — | `password` hash only (§2.1) | A5/A6 (12 minimum) | §5.1 single policy | Phase 2 | Reconciled (AO-01 open) |
| Notifications | `notifications_log` box | §8.1 two sources of truth | T-series | `notifications.*` (§4.2) | Phase 5 (partial) + Phase 7 | Reconciled |
| Retention / backup | — | §12 three-tier; §13 restore cadence | — | — | Phase 9 (canonical sentence) | Reconciled (DB-3 runbook adoption open) |
| Migration order | — | §10 steps 0–12 (media before organisation) | — | — | Phase 1 | Reconciled |
| Module→phase | — | — | §14 intro (134) | — | §1.5 canonical table | Reconciled |
| Search | FULLTEXT notes (§3.2 etc.) | ngram FULLTEXT indexes (§3.2/§3.5/§5.1) | §6 boolean mode | — | Phases 3–4 | Reconciled (§9) |
| Roles (2, Phase 1) | `roles` box; ERT = roster, not role | `users.status` + role seed (§2.1/§2.2) | A5/AD4/AD5 | §1.1/§2 catalogue | Phase 2 | Reconciled |

## 16. Authoritative table inventory

The single authoritative inventory. Doc 06 §1.4, the ERD, and this section agree: **48 application tables, 50 defined, 58 physical.** (`sequences` defined as the 48th table, 2026-11-14 — see Doc 16 §3.10.)

### 16.1 The 39 plan tables (corrected — the plan text says 38 but names 39)

| Domain | Tables (count) |
|---|---|
| Identity (6) | `users`, `roles`, `permissions`, `model_has_roles`, `user_devices`, `push_subscriptions` |
| Community (8) | `households`, `persons`, `professions`, `countries`, `institutions`, `landmarks`, `freedom_fighters`, `person_family_links` |
| Organisation (5) | `committee_terms`, `committee_members`, `advisors`, `past_leaders`, `achievements` |
| Activities & Content (7) | `activities`, `posts`, `post_translations`, `media`, `media_links`, `events`, `gallery_albums` |
| Services (6) | `service_requests`, `service_request_updates`, `service_request_expenses`, `emergency_team_members`, `blood_donors`, `blood_requests` |
| Finance (4) | `ledger_entries`, `ledger_reversals`, `finance_categories`, `projects` |
| System (3) | `notifications_log`, `activity_log`, `settings` |

### 16.2 The 8 additions (flagged `[ADDITION]` in Doc 06)

| Table | Domain | Doc 06 | Reason |
|---|---|---|---|
| `blood_consents` | Services | §6.7 | The plan has no donor-consent table; the audit proves one is needed. |
| `contact_messages` | System | §8.4 | The plan has no contact-inbox table. |
| `faqs` | Activities & Content | §5.8 | The plan has no FAQ table. |
| `annual_reports` | Activities & Content | §5.8 | The plan has no annual-report table. |
| `infrastructure_facilities` | Community | §3.8 | The plan's `landmarks` covers named places, not facilities with a condition. |
| `data_requests` | System | §8.5 | The plan has no data-rights table. |
| `service_types` | Services | §6.8 | Phase 0.1 (C §3) — the admin-managed service catalogue. |
| `constitution_versions` | Organisation | §4.6 | Phase 0.1 (C M-05) — the versioned constitution. |

**39 (plan, corrected) + 8 (additions) + 1 (`sequences`, defined 2026-11-14) = 48 application tables.**

### 16.3 Pivots and framework tables

- **2 Spatie pivot tables** (drawn in the ERD, counted in "defined"): `role_has_permissions`, `model_has_permissions`. 48 + 2 = **50 defined tables**.
- **8 Laravel framework tables** (listed in Doc 06 §8.6 and ERD §1/§3.7, not drawn in full): `personal_access_tokens`, `notifications`, `jobs`, `failed_jobs`, `cache`, `sessions`, `password_reset_tokens`, `migrations`. 50 + 8 = **58 physical tables**.

## 17. MySQL compatibility checklist (A CK-01–CK-31)

Status after Phase 0.1. "Recorded" means the blueprint now states it; "scaffold-time" means it is verified when the scaffold runs against a real MySQL 8.4 instance (no such instance exists in this environment — RK-1).

| # | Check | Phase 0.1 status |
|---|---|---|
| CK-01 | Zero `postgres`/`PostgreSQL`/`pg_` references remain except in a marked "superseded" history note | **Verified — Batch 6 (§12), with the scope stated:** zero `pg_` tokens outside this document's history (§4) and checklist (§17) rows; zero PostgreSQL recommendations. Remaining PostgreSQL mentions are either explicitly marked superseded, or limitation comparisons naming a PostgreSQL-only feature MySQL lacks (vector search, native FTS configurability). |
| CK-02 | Doc 13 Q-26 closed as Decided; A-06 rewritten for MySQL 8.4 | Done |
| CK-03 | Doc 14 + README version lines say MySQL 8.4 LTS, not PostgreSQL 16 | Done |
| CK-04 | ADR-012 Compose list + cPanel sentence rewritten for MySQL 8.4 | Done |
| CK-05 | Diagrams carry no PostgreSQL label (`API-FLOW`, `SYSTEM-ARCHITECTURE` node + text, `ERD` `jsonb`) | Done (Batch 6 grep verifies) |
| CK-06 | Laravel 13 (`^13.0`, v13.42.0 seen) supports MySQL 8.4 (floor MySQL 5.7+) | Verified (A, Packagist) |
| CK-07 | PHP 8.4 (security to 31 Dec 2028) and PHP 8.5 (security to 31 Dec 2029) both run Laravel 13 + MySQL 8.4 | Verified (A, php.net) |
| CK-08 | `pdo_mysql` present on PHP 8.4 and 8.5 in every environment; asserted by `php -m` in CI | Scaffold-time assertion |
| CK-09 | Effective PHP floor recorded as **8.4** (backup v10.4.0 requires `php ^8.4`); ADR-002 + ADR-013 carry the reason | Recorded (Phase 0.1); scaffold assertion pending |
| CK-10 | Sanctum 4.4.0 admits Laravel 13 | Verified (A, Packagist) |
| CK-11 | Spatie Permission 8.5.0 admits Laravel 13; MySQL 1071 note recorded in ADR-005 | Verified (range); note recorded |
| CK-12 | Filament 5.x floors met; Laravel 13 admission confirmed by resolving Composer at scaffold | Verified (floors, primary); admission secondary — confirm at scaffold |
| CK-13 | spatie/laravel-backup v10 on MySQL: `mysqldump` on `PATH` (or `dump_binary_path` set); nightly `backup:run` + `backup:clean` work | Scaffold-time (build image, run `which mysqldump`, run a real backup) |
| CK-14 | Every table InnoDB + `utf8mb4` / `utf8mb4_0900_ai_ci`; `sql_mode` includes `STRICT_TRANS_TABLES`; `SELECT VERSION()` starts with `8.4.` | Scaffold-time boot check |
| CK-15 | Generated-column unique indexes exist and enforce: one current term (`uk_one_current_term`), single-holder roles (`uk_single_holder`) | Design written (Doc 06 §4.1/§4.2); execution pending (RK-1) |
| CK-16 | Per-year sequence counters (`EXP-`, `BLD-`, `LE-`) allocate under `SELECT … FOR UPDATE` with no duplicates under concurrency | Design written; execution pending (RK-1) |
| CK-17 | `CHECK` constraints exist and are enforced (`amount <> 0`, `units 1–4`, `blood_group` 8 values, status enums, `approved_by <> entered_by`) | Design written; execution pending (RK-1) |
| CK-18 | `FULLTEXT` indexes exist on every searchable column pair; Scout `database` engine returns ranked results on MySQL | Design written; execution pending (RK-1) |
| CK-19 | Bengali search empirical test run on MySQL 8.4; parser decision recorded in Doc 13 Q-13 | Partially done — measured on 8.0.46 (§9); re-test on 8.4 pending (§9.5) |
| CK-20 | Secondary-verified MySQL manual facts re-confirmed against `dev.mysql.com/doc/refman/8.4/en/` before being written into the runbook | Runbook step |
| CK-21 | Four database users exist (`satanipara_migrate` DDL, `satanipara_app` runtime, `satanipara_backup` read-only, `satanipara_report` read-only when provisioned); `satanipara_app` has no `UPDATE`/`DELETE` on `activity_log`, no `DELETE` on `ledger_entries`, no `ALTER/DROP/CREATE` anywhere; runtime never connects as `root`/`migrate` | Provisioning-time; assert in CI |
| CK-22 | Append-only triggers exist on `activity_log` and `ledger_entries` (SQLSTATE 45000 on violating writes) | Design written; execution pending (RK-1) |
| CK-23 | Monthly restore check + quarterly full rehearsal performed **on MySQL** | Operational cadence — first rehearsal before launch |
| CK-24 | CI runs the full suite against a real MySQL 8.4 service (not SQLite, not PostgreSQL); migration suite runs twice, second run a no-op | CI configuration |
| CK-25 | Migration discipline: one DDL statement per migration; no migration wraps DDL in a transaction expecting rollback; post-deploy schema-drift check in smoke tests | Authoring rule + CI lint |
| CK-26 | No `vector()` / `whereVectorSimilarTo` / `pgvector` / `jsonb()` / `FILTER (` / `CREATE MATERIALIZED` / `DEFERRABLE` in the codebase (CI grep) | CI grep to add |
| CK-27 | Spatie Permission migration runs cleanly on MySQL 8.4 (no error 1071); if 1071 appears, the vendor fix is applied and recorded | Scaffold-time |
| CK-28 | Horizon v5.51.0 admits Laravel 13 (Redis-only — not used day-one) | Verified (A, Packagist) |
| CK-29 | Telescope v5.28.0 admits Laravel 13; enabled dev-only, never production | Verified (A, Packagist) |
| CK-30 | Scout v11.10.0 admits Laravel 13 | Verified (A, Packagist) |
| CK-31 | No `UNIQUE` index on any `TEXT`/`BLOB` column; `push_subscriptions.endpoint_hash` (STORED generated, `uk_endpoint_hash`) and `user_devices.fcm_token_hash` (app-computed, `uk_user_token_hash`) exist and enforce the two TEXT uniqueness invariants; prefix uniques used nowhere as a uniqueness substitute | Design written (Doc 06 §§2.3–2.4, Phase 0.1.1 Worker A); execution pending (RK-1); re-test on MySQL 8.4 required |

## 18. Security reconciliation checklist

Every B finding, its Phase 0.1 disposition, and where it lives now. "Applied" means the blueprint text now states it; "Open" means an AO decision is still needed.

| # | Area | Disposition | Location |
|---|---|---|---|
| S-1 | Single password policy (12/16, no composition, breach screening, Argon2id, history 5, no expiry) | Applied | Doc 04 §5.1; Docs 02/05/07/09 cite it |
| S-2 | NIST 800-63B-4 15-char floor deviation, documented and flagged, never described as "NIST-compliant" without qualification | Applied (primary-verified) | Doc 04 §5.1 |
| S-3 | Breach screening: HIBP k-anonymity 2s timeout + local ≥10,000 list always enforced + context blocklist; rejection message says why, in plain Bengali/English | Applied | Doc 04 §5.1 |
| S-4 | Hashing: Argon2id m=19 MiB t=2 p=1; bcrypt cost ≥12 fallback with >72-byte rejection; no truncation, ever | Applied | Doc 04 §5.1 |
| S-5 | Throttling: 5/15 min, 10 → 30-min lock growing 30 → 60 → 240 min; A1 423 only after correct password | Applied | Doc 04 §5.2; Doc 07 §9 |
| S-6 | Sessions: 120/30 min idle, 12 h absolute; mobile tokens 30 days; no hard concurrent-session limit | Applied | Doc 04 §5.4; Doc 08 §5 |
| S-7 | Reset: mediated temp password, 24 h, single-use, no link, no `new_password` field | Applied (mechanism); delivery channel open (AO-05) | Doc 04 §5.5 |
| S-8 | MFA TOTP: build behind a flag | Applied (build); required-at-launch open (AO-02) | Doc 04 §5.8 |
| S-9 | Recovery bootstrap: named authoriser required | Open (AO-07) | Doc 04 §5.8/RBAC-4 |
| S-10 | Super Admin governance: two from day one (Recommended); no self-removal (mandatory); bootstrap tightenings | Applied (mandatory parts); second admin open (REG-AUTH-05) | Doc 04 §3.1/§3.2 |
| S-11 | Tracking secret: 128-bit, SHA-256 hash, POST only, uniform 404, rate limits + lockout, Tier-S allowlist (canonical field table in Worker C `ALLOWLIST.md`, Phase 0.1.1) | Applied (mechanism + Tier-S core allowlist); B-only fields held out as AO-18–AO-21; allowlist extension open (AO-04); validity period open (AO-03) | Doc 04 §7.4; Doc 07 §8.3/X2 |
| S-12 | Finance dual control mandatory; approve IS publish; F6a reject; reversal-approver rule | Applied | Doc 04 §6.1; Doc 07 F4/F6a |
| S-13 | Single-approver finance exception (written sign-off) | Open (AO-08; default: not used) | Doc 04 §6.1 |
| S-14 | Guest workflow: X11/X12 secret-authenticated; no completion-notification channel in Phase 1 | Applied | Doc 07 §14.7 (X11/X12) |
| S-15 | Guest blood-request status checking | Open (AO-10) | Doc 07 §17 |
| S-16 | Notifications: two sources of truth; retry ≤3 exponential back-off | Applied | Doc 06 §8.1; Doc 07 §12 |
| S-17 | Retention: three-tier backup; audit log permanent; `phone_hash` destruction on anonymisation | Applied (figures); confirmation as policy open (AO-16); donor-phone period open (AO-12); ledger payee open (AO-11); cold storage open (AO-13); media window open (AO-14); former-member purge open (AO-15) | Doc 06 §§11.5/12/13 |
| S-18 | API privacy: 120/min/user; B6 strict bucket; M2 phone-change default = Super Admin re-verification required | Applied (defaults); phone-change confirmation open (AO-17) | Doc 07 §9; Doc 07 M2 |
| S-19 | Permission catalogue: canonical names only (`members.*`, `dashboard.view_admin`/`view_helper`, `community.infrastructure.manage`, `media.manage`, `service_types.manage`, `expatriate.requests.accept`/`advance`, `expatriate.expenses.create`, `finance.reports.publish`); `users.create`/`users.update`/`reports.publish`/`finance.publish`/`contact.view`/`contact.reply`/`settings.view`/`settings.update`/`pending_review` deleted everywhere | Applied | Doc 04 §4.2; Doc 07 §14 |
| S-20 | Four database users + triggers + REVOKE (CK-21/CK-22) | Applied (design); execution pending (RK-1) | Doc 04 §5.7; Doc 06 §8.2 |
| S-21 | CAPTCHA: none in Phase 1 by default | Recommended (AO-09) | Doc 07 §9 |

## 19. ADR status summary


> **MariaDB note (2026-11-14):** the ADR statuses in this table are the Phase 0.1 record. ADR-003 (MySQL 8.4 LTS, Confirmed) is superseded by 16-MARIADB-ADDENDUM.md (new ADR-014, MariaDB 11.8.9, Confirmed); ADR-010's search recommendation is superseded for production (rewritten for MariaDB 11.8.9); ADR-012's deployment model is superseded by the actual shared host. See the addendum for the current status of each.

| ADR | Title | Status | Phase 0.1 change |
|---|---|---|---|
| ADR-001 | Laravel 13 | Confirmed | Vector-search-unavailable-on-MySQL note added. (Corrected 2026-11-14: vector search IS available natively on MariaDB 11.7+ via Laravel 13 — no Phase 1 use case; see 16-MARIADB-ADDENDUM.md §7.) |
| ADR-002 | PHP version | Confirmed | Effective floor 8.4 recorded + reason (backup v10.4.0). |
| ADR-003 | Database (MySQL 8.4 LTS) | **Confirmed, then Superseded 2026-11-14 — see 16-MARIADB-ADDENDUM.md** | **Full rewrite** from A §4.1 (was: PostgreSQL Recommended, pending hosting confirmation). Two Phase 0.1 adjustments (§7 item 17). |
| ADR-004 | Sanctum auth | Confirmed | "No database dependency — verified Phase 0.1" note. |
| ADR-005 | Spatie Permission | Confirmed | MySQL 1071 index-length note added. |
| ADR-006 | REST API-first | Confirmed | — |
| ADR-007 | Media storage | Recommended | Doc 11 §7 refs (B-09). |
| ADR-008 | Queue driver | Recommended | SKIP LOCKED MySQL ≥ 8.0.1 note. |
| ADR-009 | Cache driver | Recommended | "No database dependency — verified Phase 0.1" note. |
| ADR-010 | Search | Recommended | **Full rewrite** — Scout database engine in BOOLEAN MODE, on E's measured basis. **Rewritten 2026-11-14 for MariaDB 11.8.9** (default-parser FULLTEXT + BOOLEAN MODE with `+term*` wildcards as a model scope, NOT Scout — see 16-MARIADB-ADDENDUM.md §3.4). |
| ADR-011 | Filament admin | Confirmed | "No database dependency — verified Phase 0.1" note. |
| ADR-012 | Deployment | Recommended (pending hosting/domain confirmation) | MySQL 8.4; cPanel sentence rewritten; Doc 11 §7.2 ref. (Deployment model since superseded by the actual Hostinger shared host — see addendum.) |
| ADR-013 | Backup strategy | Confirmed | `mysqldump`, binary-log PITR, PHP floor 8.4, Doc 11 §7 refs. |

No ADR is open. ADR-007/008/009/010/012 are Recommended (not Confirmed) because they carry a scaffold-time or hosting confirmation; the distinction is recorded in each ADR.

## 20. Final gate assessment

> **Gate status: COMPLETE (2026-11-14).** Batch 6 passed on every check (§12). Every critical inconsistency is resolved + verified, or explicitly pending owner approval with its implications and blocked phase stated (§11); the explicitly unverified items (§13) are scaffold-time or pre-launch checks, not blueprint defects.

The directive §10 gate is COMPLETE only if every critical inconsistency is resolved + verified, or explicitly pending owner approval with its implications and blocked phase stated. On the evidence in this document:

- **Resolved + verified (Batch 6, §12):** the MySQL reconciliation (A), the database/API mismatches (C), the roadmap/cross-document inconsistencies (D), and the Bengali search measurement (E). All 13 Batch 6 checks pass.
- **Explicitly pending owner approval, with implications + blocked phase:** the 21 AO decisions (AO-01–AO-21) and the merged register in §11. None of them blocks the blueprint's internal consistency; each blocks a named phase, stated in the register.
- **Explicitly unverified, not hidden:** RK-1 (integrity designs never executed on real MySQL 8.4), RK-2 (search measured on 8.0.46, not 8.4), RK-3/RK-4 (HIBP reachability, ASVS primary source), RK-5 (no user research on password lengths). Each is a scaffold-time or pre-launch check, named in §13 and in the CK checklist (§17).

Batch 6 passed on every check, so the gate is **COMPLETE** (with the §11 register and §13 risks carried forward as owner/scaffold items, not as blueprint defects). The §12 evidence stands as the record; any later edit to the blueprint re-opens the gate until Batch 6 is re-run and §12 updated.

---

## 21. Phase 0.1.1 record (2026-11-14)

Phase 0.1.1 applies the four Phase 0.1.1 workers' drafted edits to the Phase 0.1 record (baseline commit `d05cbc70`). Documentation only: no Laravel code, no migrations, no UI files; nothing pushed (the edited clone is uncommitted). Application log: `~/workspace/satanipara-phase0-1-1/work/APPLICATION-LOG.md`; Item 6 verification log: `~/workspace/satanipara-phase0-1-1/work/VERIFICATION-LOG-0.1.1.md`.

### 21.1 What changed, by item

- **Item 1 — TEXT/BLOB uniqueness (Worker A).** The two `TEXT` uniqueness invariants are now enforced on `BINARY(32)` SHA-256 hash columns, never on the `TEXT` columns: `push_subscriptions.endpoint_hash` (STORED generated column, `uk_endpoint_hash`) and `user_devices.fcm_token_hash` (application-computed before encryption, `uk_user_token_hash` on (`user_id`, `fcm_token_hash`)). Files: Doc 06 §§2.3–2.4, §9.4, new §11.2A, §11.3 (via C E-06-1's Tier-S sentence — see Item 3); `diagrams/ERD.md` boxes + §3.1; Doc 05 §3.4; Doc 08 §6.2; Doc 10 §5 (incl. concurrent re-registration tests); ADR-003; Doc 15 §17 (CK-31) and §13 (RK-14). Same-endpoint re-registration by a different user → upsert transfers the row, audit-logged (coordinator ruling 1; new R-24). No table added or removed.
- **Item 2 — Ledger immutability (Worker B).** Canonical transition set written once in Doc 06 §7.1 (`draft → draft`, `draft → published`, `draft → discarded`, `published → reversed`; every other transition forbidden), with the three-layer enforcement (guarded service updates, `satanipara_app` `DELETE` revoked, BEFORE UPDATE/DELETE triggers, SQLSTATE 45000) and the "what triggers cannot enforce" limits; one reversal per original, ever (`ledger_entry_id` UNIQUE, `uk_one_reversal_per_original`); two-step reversal (F6 creates the reversal draft, F4 approves it — the original flips to `reversed` only on approval); new endpoints F3a (edit draft) and F3b (discard draft) in Doc 07 §14.7 and Doc 09 §3.11; rejecter-must-differ-from-enterer (Doc 04 §6.1 item 7, new R-23); canonical named CHECKs (`chk_ledger_dual_control`, `chk_reversal_dual_control`, …); four database users (`satanipara_app`, `satanipara_migrate`, `satanipara_backup`, `satanipara_report` — Doc 06 §7.1, Doc 08 §3.1, Doc 11 §2.3). Files: Doc 06 §§1.2/7.1/7.2/9.4/12, Doc 07 F3a/F3b/F6, Doc 09 §3.11, Doc 02 REQ-M8-002/REQ-M8-006, Doc 14 AC-M8-05–AC-M8-11, Doc 05 §9.4, Doc 04 §6.1, ERD ledger boxes + §3 note, Doc 08 §3.1, Doc 11 §2.3. (B's E-04, which targeted the investigator working note `~/workspace/satanipara-phase0-1/A-mysql-reconciliation.md`, was NOT applied — outside the repo clone; the repo docs already state the Phase 0.1 rule. B's E-18 cites Doc 11 §2.2; the `db` service actually lives in §2.3 — applied there.)
- **Item 3 — Public-tracking allowlist (Worker C).** One canonical Tier-S allowlist wording (Doc 04 §7.4), with the full field table + sample response in Worker C `ALLOWLIST.md`; itemised expense lines + server-computed total + constant `service_charge: 0` (a literal, not a column); "sanitised" defined (visible-flag only + author stripped, not automated scrubbing); Request ID alone returns nothing; uniform 404 for unknown/wrong/revoked/expired/locked secrets; secret re-issue only after out-of-band identity verification + re-authentication + audit; B-only fields held out as AO-18–AO-21 (default: excluded). Files: Doc 04 §§2.3/2.4/7.2/7.4/9/11, Doc 07 §8.3/X2/§17, Doc 08 (open-decisions item 8, §3.4), Doc 13 Q-02/A-08, Doc 02 REQ-M5-009/REQ-M5-013, Doc 06 §11.3, Doc 03 §14, Doc 05 §9.1, Doc 14 AC-M5-04/AC-M5-09, Doc 15 §10 (S-11) and §11 (AO-18–AO-21). JSON field names + ISO 8601 UTC timestamps are Proposed (new R-25), not Confirmed.
- **Item 4 — Consistency (Worker D).** Doc 15 §1/§2 stale publication statements corrected (Phase 0.1 published 2026-11-14T12:29:01Z as `d05cbc70…`, 34 files, 1182+/526−; benchmark package published); Doc 13 header + Q-01/Q-04/Q-10/Q-16/Q-19 status lines corrected to match the decided/recommended state; Doc 08 §2/§3.7/§7 password wordings aligned to the single Doc 04 §5.1 policy (12/16, Argon2id, no composition — the §7 "≥8 with letter + digit" rule is deleted); Doc 04 §8.15 REG-AUTH-01 reference corrected to Doc 15 §8 R-1 and §11; Doc 13 A-08 closed as superseded per Worker C (D's alternative A-08 rewording was set aside in the merge — C's closed row already states the Tier-S allowlist as the live rule). The `decision-sheet-0.1.md` reword (D C-20) was DECLINED by the coordinator — the sheet stays as the Phase 0.1 record.
- **Item 5 — Benchmark package (Worker D).** Published verbatim at `docs/backend-architecture/benchmark/` (`README.md`, `generate_dataset.py`, `schema.sql`, `queries.md`, `run_benchmark.py`, `RUN-ON-8.4.md`; 78,781 bytes, 6 files md5-verified identical to the work package). The package states 35 cases / 133 timed queries / 133 count pairs (correcting E §3.3's "37 cases / 134 count pairs"; the 134th count entry is the `rows` row-count line). Doc 15 §9 replaced in full (§9.1–§9.5, incl. the corrected `persons[শিক্ষক]` NL count 175, the spelling-variant correction, and corrected speed ranges); ADR-010 rewritten in full (recommendation unchanged). Editor correction: Worker D wrote "88 KB of text" for the package; the measured total is 78,781 bytes (~77 KB) — applied as 77 KB in §2 and §9.

### 21.2 New decisions

- **R-22 (Recommended):** F3a/F3b draft edit + discard endpoints (Doc 07 §14.7; Doc 09 §3.11; Doc 14 AC-M8-06).
- **R-23 (Recommended):** F6a rejecter must differ from the entry's enterer (Doc 04 §6.1 item 7).
- **R-24 (Recommended):** push-endpoint re-registration by a different user → upsert transfers the row, audit-logged (Doc 06 §2.4).
- **R-25 (Proposed):** public-tracking JSON field names + ISO 8601 UTC timestamps (Worker C `ALLOWLIST.md` §7).
- **AO-18–AO-21 (Awaiting Organisation):** Tier-S B-only fields held out of the allowlist — AO-18 urgency/timestamps, AO-19 rejection/cancellation reasons, AO-20 `no_expense_declaration`, AO-21 plain notes/photos (Doc 15 §11; mirrored in Doc 13 §AO). AO-03 (90-day secret validity, recommended) and AO-04 unchanged.

### 21.3 Counts after Phase 0.1.1 (mechanically recomputed)

- **Endpoints: 134** (108 at Phase 0 + 25 added in Phase 0.1 + 2 added in Phase 0.1.1 (F3a/F3b) − 1 deleted in Phase 0.1). Doc 07 §14 contains 134 endpoint rows, 134 unique IDs, no duplicates. Updated everywhere the count is stated (Doc 07 intro/§16/§17, Doc 05, Doc 14 G-09/P0-07, backend README, root README, ADR-006, Doc 15 §1/§6/§10 C-2/§12/§14/§15/§20). Historical Phase 0.1 record rows (§5 table, §6 Batch 6 record, §7 item 20, Doc 14 P0-09 exception list) are left verbatim as the Phase 0.1 record, with Phase 0.1.1 parentheticals where the statement would otherwise read as current.
- **Decisions: R-1–R-25 (25 Recommended/Proposed), C-1–C-26 (26 Confirmed), AO-01–AO-21 (21 Awaiting Organisation, in both Doc 15 §11 and Doc 13 §AO), CK-01–CK-31 (31), RK-1–RK-14 (14).**
- **Tables: 47 application / 49 defined / 57 physical — unchanged** (no table added or removed; two columns added to existing tables only). ERD: 49 boxes (47 app + 2 pivots), agreeing with Doc 06 §1.4 and §16. (48/50/58 after the `sequences` definition, 2026-11-14 — see Doc 16 §3.10.)

### 21.4 Test evidence summary (worker-reported, except where noted as editor-verified)

- **Worker A (Item 1):** MySQL 8.0.46, scratch database `satanipara_test_a`. Pass/fail summary: 17 rows — 16 PASS, 1 NOT REPRODUCED (S1-clean trailing-space claim, recorded honestly; the design is immune either way). Proves: `UNIQUE` on `TEXT` fails (1170), prefix unique ≠ full-value unique, both hash designs work end to end (1062 on duplicates, upsert refreshes, hash-lookup + full-value verify, `NULL` semantics, CHECK coupling 3819). Laravel's non-deterministic encryption premise was demonstrated logically (different ciphertexts hash differently), not executed against Laravel.
- **Worker B (Item 2):** MySQL 8.0.46, scratch database `satanipara_test_b`. Results §3: 14 trigger/CHECK cases, all PASS (draft edit, dual-control publish, published-row update/delete refused 1644 incl. as root, second reversal refused 1062, CHECK violations 3819, discard + discarded-row immutability, link-row immutability). Privilege tests §4–§5: 5 attempts as the restricted app user, all as designed (DELETE/TRUNCATE/DROP TRIGGER refused 1142; draft INSERT succeeds; published UPDATE stopped by the trigger 1644). **T5 (`trg_ledger_reversals_bi`, BEFORE INSERT on `ledger_reversals`) was NOT executed — stays Unverified** (TESTS.md T-LED-13).
- **Worker C (Item 3):** no database tests (documentation reconciliation only).
- **Worker D (Item 5):** generator + packaged runner re-runs pass on MySQL 8.0.46; 8.4 pending. **Editor note 2026-11-14:** the 8.4 re-run is closed — MariaDB 11.8.9 is the engine; the MariaDB production re-run is the open item (see §22). **Editor-verified independently (2026-11-14, this phase):** the packaged generator reproduces the Phase 0.1 `seed.sql` byte-for-byte (md5 `b2164ed52f58e36d3954a42cebacad40`, 3,900 INSERTs); the packaged runner re-run on local MySQL 8.0.46 produced 133 timed queries, 133 count pairs (+ the `rows` line = 134 count keys), 35 distinct case labels, and `persons[শিক্ষক]` ngram-NL = 175. No MySQL 8.4 instance exists in this environment — nothing was measured on 8.4.

### 21.5 Item 6 verification summary (editor, 2026-11-14)

Full method + evidence: `~/workspace/satanipara-phase0-1-1/work/VERIFICATION-LOG-0.1.1.md`.

| # | Check | Result |
|---|---|---|
| 1 | MySQL index compatibility (TEXT/BLOB + UNIQUE) | **PASS** — only the two hash-column designs; every prefix-unique mention states it is not a substitute |
| 2 | Ledger transition + immutability | **PASS** (with 3 noted shorthand wordings + 1 pre-existing Doc 10 flow shorthand; the authoritative texts all state the single `published → reversed` exception) |
| 3 | Public-tracking privacy reconciliation | **PASS** — re-run 2026-11-14 after the coordinator's two one-line fixes (Doc 12 Phase 5 risk line now lists AO-03/AO-04/AO-18–AO-21; RBAC-MATRIX `expatriate.track` row now states the secret-authenticated Tier-S allowlist); the canonical allowlist wording is identical in Docs 04, 07, 08, 13, 15 |
| 4 | Password-policy consistency | **PASS** — only Doc 04 §5.1 states the production policy; no ≥8/≥6 production minimum and no composition rule remains anywhere |
| 5 | Internal-link validation | **PASS** — re-run 2026-11-14 after T-LED-01–T-LED-34 were added to Doc 10 §4.4: 667 Doc § + 128 ADR + 53 Doc Q references resolve, 0 broken, 0 dangling (the `Doc 10 T-LED-14` citation in Doc 06 §7.1 now resolves). No markdown linter is installed (`markdownlint`/`mdl` absent) — structure was checked by script (code fences balanced, no heading jumps), not by a linter |
| 6 | ERD/schema + count consistency | **PASS** — ERD 49 boxes; endpoints 134/134 unique; R 1–25, C 1–26, AO 1–21, CK 1–31; tables 47/49/57 agree. (Now 48/50/58 — `sequences` defined 2026-11-14; see Doc 16 §3.10.) |
| 7 | Documentation diff review | **PASS** — 19 files changed + `benchmark/` new, all within `docs/backend-architecture/` (+ root `README.md`); 188 insertions, 127 deletions, 1,092 diff lines read in full; no Laravel code, no migrations, no UI files; `index.html`, `alternatives/`, `docs/direction-d|redesign|v1` untouched |

### 21.6 Remaining risks

- **RK-1 / RK-14 (MariaDB 11.8.9 re-run required):** the hash-column designs, ledger triggers/CHECKs, and Bengali search timings are proven on MySQL 8.0.46 only. Re-run/re-validate on a real MariaDB 11.8.9 instance at scaffold (search: `benchmark-mariadb/RUN-ON-PRODUCTION.md` / 16-MARIADB-ADDENDUM.md; ledger: Doc 10 T-LED-14 as replaced by the provisioned-database re-run; hash designs: CK-31). Ledger note: T5 was executed 2026-11-14 on MariaDB 11.8.9 (43/43 suite PASS — see §22).
- **T5 — EXECUTED 2026-11-14 on MariaDB 11.8.9:** the BEFORE INSERT trigger on `ledger_reversals` (`trg_ledger_reversals_bi`) was executed and all four branches proven (43/43 suite PASS — `tests/ledger-suite/TEST-RESULTS.md` §2; Doc 10 T-LED-13 updated). The Phase 0.1.1 record above ("T5 untested") is superseded by this result.
- **Laravel encrypted-cast non-determinism:** the `fcm_token_hash` design depends on Laravel's encryption being non-deterministic (random IV) — confirm at scaffold that the cast behaves as assumed; if it ever became deterministic, the generated-column alternative would need revisiting.
- **T-LED tests (fixed by the coordinator, 2026-11-14):** T-LED-01–T-LED-34 are now in Doc 10 §4.4 (state-machine, privilege, CHECK and contract tests); the `Doc 10 T-LED-14` citation in Doc 06 §7.1 resolves. (Worker B's list was T-LED-01–T-LED-34: 01–31 state-machine/privilege/CHECK tests + 32–34 contract tests.)
- **"Two database users" staleness (fixed by the coordinator, 2026-11-14):** Doc 15 §10 C-18, §18 CK-21 and §18 S-20, Doc 06 §13 item 7, ADR-003, Doc 04 §5.7 and Doc 06 §8.2 now state the canonical four-user matrix (`satanipara_app`, `satanipara_migrate`, `satanipara_backup`, `satanipara_report`). (The ADR-003 and §5.7/§8.2 "two-user design" phrases were found by the coordinator's re-run grep, not by the editor — fixed in the same pass.) The two remaining "two-user" mentions in Doc 15 §4 are the historical record of what Phase 0.1 changed, and stay as history.
- **Check 3 divergences (fixed by the coordinator, 2026-11-14):** Doc 12 Phase 5 risk line now lists the open parts (AO-03, AO-04, AO-18–AO-21); the RBAC-MATRIX `expatriate.track` row now states the secret-authenticated Tier-S allowlist. Checks 3 and 5 re-run: both PASS.

### 21.7 Gate statement

> **Gate status: COMPLETE (2026-11-14).** All Item 6 checks pass after the coordinator's three fixes (two Tier-S one-liners, T-LED-01–T-LED-34 added to Doc 10 §4.4, four-user wording in C-18/CK-21/S-20 and Doc 06 §13) and the re-run of checks 3 and 5. The §11 register (now AO-01–AO-21) and §13 risks (now RK-1–RK-14) are carried forward as owner/scaffold items, not as blueprint defects.

---

## 22. MariaDB addendum (2026-11-14) — what this record no longer states as current

Fahim confirmed on 2026-11-14 that **MariaDB 11.8.9 on Hostinger Shared Hosting is the production database engine**, superseding the MySQL 8.4 LTS decision recorded in this document. The full decision record is `16-MARIADB-ADDENDUM.md`; the new ADR is `adr/ADR-014-mariadb-11-8-9.md` (ADR-003 is superseded by ADR-014; its body is kept verbatim as the Phase 0.1 record).

**What changed (and where it is recorded):**

- **Engine:** MySQL 8.4 LTS + InnoDB → **MariaDB 11.8.9 + InnoDB** (Doc 16 §1, §3.1; ADR-014). Lifecycle: GA 4 Jun 2025; community binaries to 4 Jun 2028; source security fixes to 2030 — the LTS upgrade must be planned before June 2028.
- **Counts:** **48 application / 50 defined / 58 physical tables** (`sequences` defined as the 48th application table, Doc 06 §7.5 — a pre-existing-gap correction, not a MariaDB change; Doc 16 §3.10). Endpoints unchanged at **134**. ADRs now **14** (ADR-014 added).
- **Search:** the ngram `FULLTEXT` + BOOLEAN MODE recommendation (§9, C-24, ADR-010) does NOT transfer to MariaDB (no ngram parser). The adopted approach is default-parser FULLTEXT + BOOLEAN MODE with `+term*` wildcards as an Eloquent model scope (NOT Scout), autocomplete via `LIKE 'term%'` on a B-tree, explicit ordering (never MATCH relevance), `LIKE '%term%'` fallback only for 1-char/mid-word cases; the `search_tokens` column is conditional on an explicit product decision (Awaiting Organisation). Measured on MariaDB 11.8.9: **35 cases / 171 timed queries** (`benchmark-mariadb/`). Production re-run + real-data snapshot + scale check still open (Doc 13 Q-13).
- **Collation:** pinned `utf8mb4_unicode_ci` (not `utf8mb4_0900_ai_ci`). **Resolved:** `utf8mb4_0900_ai_ci` EXISTS on MariaDB 11.8.9 (ID 255) — the pin stands regardless (Doc 16 §3.2, §6).
- **Generated column:** `push_subscriptions.endpoint_hash` drops `NOT NULL`, gains a named `CHECK (endpoint_hash IS NOT NULL)` — **verified** on MariaDB 11.8.9: the `NOT NULL` form fails with ERROR 1064; the CHECK form works (Doc 16 §6, F-02).
- **Error codes:** CHECK violations are **4025** on MariaDB, not MySQL's 3819 (Doc 10 T-LED-27/28/29/30 updated).
- **Ledger:** both `approved_by` FKs use `ON DELETE RESTRICT` (a CHECK may not reference a column whose FK uses `ON DELETE SET NULL` — ERROR 1901; fallback documented in Doc 06 §7.1/§7.2). **T5 EXECUTED 2026-11-14 on MariaDB 11.8.9** — all four branches proven, 43/43 suite PASS (`tests/ledger-suite/TEST-RESULTS.md`). T-LED-14 is replaced by the provisioned-database re-run.
- **Server defaults (measured on local MariaDB 11.8.9):** `sql_mode` has no `ONLY_FULL_GROUP_BY`; `innodb_snapshot_isolation = 1` (ON); `innodb_ft_min_token_size = 3` (Doc 16 §6).
- **Backup binary:** `mariadb-dump` **verified present** on the host at `/usr/bin/mariadb-dump` (client 11.8.9-MariaDB). `DB_CONNECTION=mariadb`.
- **Vector search:** available natively on MariaDB 11.7+ via Laravel 13 — no Phase 1 use case; the old "PostgreSQL-only / unavailable" claims are corrected (Doc 16 §7).
- **Deployment:** current deployment is Hostinger shared hosting (Server Foundation Report); the Docker/VPS model in Doc 11 §§2.2–2.3 and ADR-012 is a future migration target, not current.

**Still Unverified (provisioning probes):** U-03 per-table revokes on shared hosting, U-05 restore rehearsal with triggers, U-08 full migration suite, and the production re-runs (search, ledger suite, identities as applied). **Live check added by this addendum:** zero live "MySQL 8.4 is the standard" claims remain; the MySQL 8.4 sentences in this document's §§1–21 are the marked Phase 0.1/0.1.1 history, and §17's MySQL checklist is the Phase 0.1 record.

**This section is the amendment record.** The narrative above (§§1–21) stays verbatim as the Phase 0.1/0.1.1 history; where a still-operative row was amended, the amendment is in place (see the banner at the top of this document for the list).
