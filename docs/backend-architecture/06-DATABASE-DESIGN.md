# 06 — Database Design (Preliminary Schema)

| | |
|---|---|
| **Document** | Satanipara Community — Phase 0 Backend Blueprint, doc 06 |
| **Status** | Planned — not yet implemented. Nothing in this document describes a live database. This is a **preliminary** schema: table and column definitions are to be finalised against the OpenAPI specification in Sprint 1 of development. |
| **Sources** | Decision Sheet (single source of truth, 2026-11-14); Audit Findings (repo audit, 2026-11-14, HEAD `6792f5e`); Research Notes (verified 2026-11-14); Engineering Plan v1.1 §7 (table catalogue), §6, §9 |
| **Companion docs** | `04-USER-ROLES-PERMISSIONS.md` (RBAC); `05-BACKEND-ARCHITECTURE.md` (architecture, state machines); `diagrams/ERD.md` (relationships) |

---

## 1. Design principles and conventions

### 1.1 Universal rules (per Engineering Plan v1.1 §7)

- **Every table** has `id` (`bigint`, auto-incrementing) as the primary key, plus `created_at` / `updated_at` timestamps, unless the table is a framework table whose structure Laravel defines (e.g. `jobs`, `cache`, `sessions`, `personal_access_tokens`).
- **Soft delete** (`deleted_at`) on every table holding important records. Nothing is removed from the database by a direct delete. Money and request tables are **never hard-deleted** (see §11).
- **Money is `numeric(12,2)`** (BDT), never float, never integer minor units mixed with decimals — one representation, everywhere (Decision Sheet).
- **Bilingual content** follows §9: translatable text lives in a translations table or in `name_bn` / `name_en` column pairs, with Bengali as the fallback.
- **No demo data** in the schema, the seeders, or the migrations. Demo values from the prototype are never inserted (see §13).

### 1.2 Naming conventions

- Tables are `snake_case`, plural (`members` are represented by `users` + `persons` — see §2.1 for why there is no separate `members` table).
- Foreign keys are `{table_singular}_id` (`user_id`, `request_id`, `household_id`).
- Pivot tables follow Laravel/Spatie conventions (`model_has_roles`, `role_has_permissions`, `media_links` is the polymorphic link table).
- Status columns are strings holding the enum values from the Decision Sheet (`pending`, `accepted`, `in_progress`, `completed`, `closed`, `rejected`, `cancelled` for expatriate requests; `draft`, `review`, `published`, `scheduled`, `archived` for content; `draft`, `published`, `reversed`, `discarded` for ledger entries (no `approved` state — approve IS publish, Doc 04 §6.1; the four transitions are defined in §7.1); `pending`, `approved`, `rejected`, `suspended` for user status). The prototype's integer statuses (0–3 — Audit Findings §5.5) are **not** carried forward.
- Boolean columns are `is_*` / `has_*` (`is_available` is **not** stored for donors — availability is computed, §6.3).
- Sensitive columns are listed per table under "Sensitive fields". Encrypted columns are noted as `encrypted` (Laravel's `encrypted` cast, or database-level encryption where the operations setup provides it — the mechanism is decided at build time; the requirement is that the value is not readable in plaintext from a database dump).

### 1.3 How to read the table entries

Each table entry gives: **purpose; primary key; important fields + types; foreign keys; indexes; unique constraints; relationships; soft-delete requirement; sensitive fields; retention policy.** Fields marked `(audit-proven)` are required by something the prototype's UI or data demonstrates (Audit Findings). Fields marked `[ADDITION vs Plan v1.1]` are tables or columns this blueprint adds beyond the plan's 38-table catalogue, with the reason stated. Everything else follows Plan v1.1 §7.

### 1.4 Table count

The plan's catalogue names **39 tables** in 7 domains (Identity 6, Community 8, Organisation 5, Activities & Content 7, Services 6, Finance 4, System 3 — `notifications_log`, `activity_log`, `settings`; the plan's "38" miscounts by one — mechanically verified, Phase 0.1, Investigator C). This blueprint keeps all 39 and adds **8 tables** (flagged `[ADDITION]`), bringing the total to **48 application tables** (39 + 8 + 1 `sequences` counter table, defined 2026-11-14, §7.5 — the 48th application table), plus 2 Spatie pivot tables (`role_has_permissions`, `model_has_permissions`) = **50 defined tables**, plus 8 Laravel framework tables (§8.6) = **58 physical tables**. The additions are: `blood_consents`, `contact_messages`, `faqs`, `annual_reports`, `infrastructure_facilities`, `data_requests` (6 in Phase 0) + `service_types` (§6.8) and `constitution_versions` (§4.6) (2 in Phase 0.1). The count is stated here so a reviewer can reconcile it against the plan: **39 (plan, corrected) + 8 (additions) + 1 (`sequences`, §7.5) = 48 application tables; 50 defined; 58 physical**. Doc 15 §16 carries the authoritative inventory.

---

## 2. Domain A — Identity (6 plan tables + framework tables)

The identity domain is M1 (Identity & Membership). It holds accounts, roles, permissions, devices, and push subscriptions.

### 2.1 `users`

| Item | Detail |
|---|---|
| **Purpose** | The account. One row per person who can log in (Super Admin, Expatriate Helper, or a registered Member — 'Member' here is a person-kind, not a role; Phase 1 roles are Super Admin and Expatriate Helper only, doc 04 §3). A `user` is the credential + status; the person's biographical record is `persons` (§3.2), linked 1:1. This split exists because a user may exist before their full profile is complete (pending approval), and because a person record may exist in the databank without an account (e.g. a household member who never registers). |
| **Primary key** | `id` bigint. |
| **Fields** | `name_bn` varchar, `name_en` varchar (nullable); `phone` varchar (encrypted — see §11; the lookup key is `phone_hash`, below); `phone_hash` varchar (HMAC-SHA256 of the normalised phone, for lookup without decryption — §11); `password` varchar (hash only, never plaintext); `email` varchar nullable (optional in Phase 1 — the prototype has no email field, Audit Findings §2.4; collected only if a future email feature needs it); `status` varchar: `pending` / `approved` / `rejected` / `suspended` (default `pending`); `rejection_reason` text nullable; `approved_by` bigint nullable (FK → `users.id`, the Super Admin who approved); `approved_at` timestamp nullable; `suspended_reason` text nullable; `suspended_at` timestamp nullable; `last_login_at` timestamp nullable; `locked_until` timestamp nullable (login lockout — doc 04 §5.2); `failed_login_attempts` integer default 0; `must_change_password` boolean default false (forced change on first login after a reset/bootstrap); `deletion_requested_at` timestamp nullable (30-day grace — doc 05 §9.2); `member_no` varchar nullable UNIQUE (format `MEM-YYYY-####` proposed — M-02); `member_type` varchar nullable (`resident` / `expat` / `student` — M-03); `locale` varchar default `'bn'` (`bn` / `en`); `theme` varchar default `'light'` (`light` / `dark` — persisted preference; the prototype's theme was session-only, Audit Findings §6; Q-20, open: whether these columns are populated/persisted is decided by Q-20 — until then they are nullable/unused; the columns are the natural home if persistence is confirmed); `created_at`, `updated_at`, `deleted_at` (soft delete). |
| **Foreign keys** | `approved_by` → `users.id` (self-reference, `ON DELETE SET NULL`). |
| **Indexes** | `phone_hash` (unique — see below); `status`; `created_at`. |
| **Unique constraints** | `phone_hash` UNIQUE (one account per phone number — the audit notes registration never checked duplicates, Audit Findings §7.3; the real system does). |
| **Relationships** | Has one `persons` row (1:1, `persons.user_id`); has many `roles` (via `model_has_roles`); has many `user_devices`; has many `push_subscriptions`; has many `personal_access_tokens` (Sanctum, §8); has many `service_requests` (as applicant, `applicant_user_id` nullable — requests can also be submitted without an account); has many `blood_requests` (as requester, nullable); has many `donor` records (a user may be a donor — `blood_donors.user_id`); has many `notifications` (as recipient). |
| **Soft delete** | Yes. A soft-deleted user keeps their id so that audit-log and ledger references do not break; personal fields are anonymised on permanent deletion (see §11). |
| **Sensitive fields** | `phone` (encrypted), `password` (hash only), `email` (if collected). `phone_hash` is a one-way hash, not reversible. |
| **Retention** | Accounts are retained for the life of the platform unless a deletion request is completed (30-day grace, then anonymisation — doc 05 §9.2). Audit-log rows referencing a deleted user keep the user id, not the personal data. |

### 2.2 `roles`, `permissions`, `model_has_roles` (+ Spatie pivots)

| Item | Detail |
|---|---|
| **Purpose** | Spatie Laravel Permission v8 (`^8.0`) storage. `roles` and `permissions` are the rows the RBAC catalogue (doc 04 §4) is seeded from; `model_has_roles` links users to roles; `role_has_permissions` and `model_has_permissions` are Spatie's standard pivots (the plan's §7 lists `roles`, `permissions`, `model_has_roles` by name; the two further pivots are part of the package's standard schema and are included here so the schema is complete — they are not counted as additions). |
| **Primary key** | `id` bigint (`roles`, `permissions`). Pivots use composite keys per Spatie's schema. |
| **Fields** | `roles`: `name` varchar (e.g. `super-admin`, `expatriate-helper` — there is no `member` role; Member is a person-kind, not a role), `guard_name` varchar (default `web`), timestamps. `permissions`: `name` varchar (e.g. `members.view`, `finance.approve`), `guard_name` varchar, timestamps. `model_has_roles`: `role_id`, `model_type`, `model_id`. `role_has_permissions`: `permission_id`, `role_id`. `model_has_permissions`: `permission_id`, `model_type`, `model_id`. |
| **Foreign keys** | Per Spatie's migrations (cascade on role/permission delete — deleting a role removes its assignments; deleting a permission removes it from roles). |
| **Indexes** | `roles.name` + `guard_name` (unique together); `permissions.name` + `guard_name` (unique together); pivot indexes per Spatie's schema. |
| **Unique constraints** | (`name`, `guard_name`) on both `roles` and `permissions`. |
| **Relationships** | `roles` ↔ `permissions` (many-to-many via `role_has_permissions`); `users` ↔ `roles` (many-to-many via `model_has_roles`, polymorphic so other models could hold roles in future — Phase 1 policy is one role per user, doc 04 §3.3). |
| **Soft delete** | No. Roles and permissions are configuration. Deleting a role is a governed act (doc 04 §5.6 — confirmation + re-authentication + audit log) and is a hard delete of the row, with the audit log as the record that it existed. (If the organisation prefers, a role can be "retired" by removing all its permissions instead of deleting the row — an operational choice.) |
| **Sensitive fields** | None. |
| **Retention** | Permanent. The audit log preserves the history of role/permission changes. |

### 2.3 `user_devices`

| Item | Detail |
|---|---|
| **Purpose** | One row per device a user has logged in from (M1/M9/M12). Records the FCM token and platform so App Push can reach the device in Phase 3, and so the user can see and revoke their devices (doc 05 §8.2). |
| **Primary key** | `id` bigint. |
| **Fields** | `user_id` bigint (FK); `device_name` varchar (e.g. "Fahim's phone" — user-supplied or derived); `platform` varchar (`web` / `android` / `ios`); `fcm_token` text nullable (encrypted — a push token is a credential); `fcm_token_hash` binary(32) nullable (SHA-256 of the plaintext token, computed in application code before encryption — see §11.2A; `NULL` exactly when `fcm_token` is `NULL`); `app_version` varchar nullable; `last_seen_at` timestamp; `created_at`, `updated_at`. |
| **Foreign keys** | `user_id` → `users.id` (`ON DELETE CASCADE` — a deleted user's devices go with the user). |
| **Indexes** | `user_id`; (`user_id`, `fcm_token_hash`) (unique — see below). Lookup on token refresh is by (`user_id`, `fcm_token_hash`); the full value is then verified in application code by decrypting the candidate row's `fcm_token` and comparing with `hash_equals()` (SQL-side verification is impossible — the stored value is ciphertext). |
| **Unique constraints** | (`user_id`, `fcm_token_hash`) UNIQUE (`uk_user_token_hash`) — one row per device token per user. `fcm_token_hash` is `NULL` exactly when `fcm_token` is `NULL` (enforced by `CHECK ((fcm_token IS NULL) = (fcm_token_hash IS NULL))`); MariaDB unique indexes permit multiple `NULL`s, so token-less device rows are unaffected. The hash is computed in application code from the plaintext token before encryption (PHP `hash('sha256', $token, true)`); a generated column cannot be used, because the stored value is ciphertext and Laravel's encryption is non-deterministic (a generated column would hash the ciphertext, which differs on every write of the same token). Same user + same token re-registered → upsert (refresh `last_seen_at`, `device_name`, `app_version`); different user + same token → separate row (per-user scope, as before). Never index the `TEXT` column itself: MariaDB 11.8.9 InnoDB rejects a `UNIQUE` index on `TEXT` without a prefix length (error 1170), and a prefix unique enforces uniqueness of the prefix, not the value — it is not a substitute. |
| **Relationships** | Belongs to `users`. |
| **Soft delete** | No — device rows are ephemeral. A device is deleted when its token is revoked or expires, or when the user removes it. |
| **Sensitive fields** | `fcm_token` (encrypted); `fcm_token_hash` (a lookup key for a credential — never exposed in an API response or log, like `fcm_token`). |
| **Retention** | Until revoked, expired, or the user is deleted. Stale devices (not seen in 180 days) are pruned by a scheduled job. |

### 2.4 `push_subscriptions`

| Item | Detail |
|---|---|
| **Purpose** | Browser Web Push (VAPID) subscriptions (M9). One row per browser subscription, so the notification service can push to a helper's browser even when it is closed (doc 05 §12). |
| **Primary key** | `id` bigint. |
| **Fields** | `user_id` bigint (FK); `endpoint` text (the push-service URL — unique per subscription, via its hash — see below); `endpoint_hash` binary(32) (SHA-256 of the endpoint — STORED generated column, see Unique constraints); `public_key` text; `auth_token` text (encrypted — subscription keys are credentials); `content_encoding` varchar nullable; `created_at`, `updated_at`. |
| **Foreign keys** | `user_id` → `users.id` (`ON DELETE CASCADE`). |
| **Indexes** | `user_id`; `endpoint_hash` (unique — see below). |
| **Unique constraints** | `endpoint_hash` UNIQUE (`uk_endpoint_hash`) — one row per subscription endpoint, globally. `endpoint_hash` is `BINARY(32) GENERATED ALWAYS AS (UNHEX(SHA2(endpoint, 256))) STORED` with a named `CONSTRAINT chk_endpoint_hash_not_null CHECK (endpoint_hash IS NOT NULL)` — MariaDB does not permit `NOT NULL` on a generated column (the `STORED NOT NULL` form fails with ERROR 1064 on MariaDB 11.8.9, verified 2026-11-14; see 16-MARIADB-ADDENDUM.md §6). The `UNIQUE` index is on the hash, not on `endpoint`: MariaDB 11.8.9 InnoDB rejects a `UNIQUE` index on a `TEXT` column without a prefix length (error 1170), and a prefix unique enforces uniqueness of the prefix, not the value — it is not a substitute. Lookup is `WHERE endpoint_hash = UNHEX(SHA2(?, 256)) AND endpoint = ?` (hash probe via the index, then full-value verification). Re-registration of the same endpoint (same or different user) → upsert on the existing row (refresh keys and `user_id`, audit-logged; a different user takes over the subscription — the endpoint identifies a browser, not a person). A 1062 whose full values differ is a hash collision: reject, alert, never overwrite. |
| **Relationships** | Belongs to `users`. |
| **Soft delete** | No — a subscription is deleted when it expires, is revoked, or the push service returns 410 Gone (weekly cleanup job — doc 05 §10.3). |
| **Sensitive fields** | `auth_token` (encrypted); `endpoint` (a capability URL — treated as sensitive, never exposed in an API response); `endpoint_hash` (a lookup key for the endpoint — never exposed in an API response or log). |
| **Retention** | Until revoked/expired. |

---

## 3. Domain B — Community (8 plan tables)

The community domain is M2 (Community Profile). It is the databank: households, people, professions, institutions, landmarks, freedom fighters, family links. Statistics are **computed from these tables, never stored** (§9).

### 3.1 `households`

| Item | Detail |
|---|---|
| **Purpose** | A household (বাড়ি) — the unit the community databank counts. One household has many persons. The prototype has no household concept (its directory is a flat list of 10 entries — Audit Findings §5.1); households are a Plan v1.1 §7 structure that the real databank needs so that "families" can be counted honestly instead of hand-typed. |
| **Primary key** | `id` bigint. |
| **Fields** | `holding_no` varchar nullable (house/holding number, if the community uses one); `area` varchar (পাড়া — e.g. the prototype's areas: উত্তর/মধ্য/দক্ষিণ/পূর্ব/বাজার পাড়া; stored as a controlled vocabulary, not free text — the area list is reference data agreed with the client); `address_bn` text nullable; `address_en` text nullable; `head_person_id` bigint nullable (FK → `persons.id`, the household head); `visibility` varchar default `'private'` (`public` / `members-only` / `private` — doc 04 §7.1); `consent_status` varchar default `'pending'` (`pending` / `granted` / `withdrawn` — §11); `consent_recorded_at` timestamp nullable; `created_at`, `updated_at`, `deleted_at`. |
| **Foreign keys** | `head_person_id` → `persons.id` (`ON DELETE SET NULL`). |
| **Indexes** | `area`; `visibility`; `consent_status`. |
| **Unique constraints** | None (holding numbers are not guaranteed unique until the client confirms they are). |
| **Relationships** | Has many `persons` (`persons.household_id`); has one head `persons` row. |
| **Soft delete** | Yes. |
| **Sensitive fields** | `address_bn` / `address_en` (location of a family — members-only at most, never public). |
| **Retention** | Retained while the household is part of the community. On a deletion request, anonymised (address removed, persons anonymised per §11). |

### 3.2 `persons`

| Item | Detail |
|---|---|
| **Purpose** | A person in the databank (M2). This is the table statistics are computed from (population, gender/age breakdown, expatriate-by-country counts — Plan v1.1 §6, M2). A `persons` row may or may not have a `users` account (§2.1). |
| **Primary key** | `id` bigint. |
| **Fields** | `user_id` bigint nullable (FK → `users.id`, 1:1 — null for databank-only persons); `household_id` bigint nullable (FK → `households.id`); `name_bn` varchar; `name_en` varchar nullable; `gender` varchar nullable (`male` / `female` / `other` / `prefer_not_to_say`); `date_of_birth` date nullable (encrypted — §11; age is computed, the date itself is sensitive); `profession_id` bigint nullable (FK → `professions.id`); `occupation_bn` varchar nullable (free-text occupation where no profession row fits); `profession_bn` varchar nullable (denormalised snapshot of the linked profession's Bengali name, refreshed on write — for search; the source of truth is `professions`); `area_bn` varchar nullable (denormalised snapshot of the household's area, refreshed on write — for search; the source of truth is `households`); `is_expatriate` boolean default false; `expatriate_country_id` bigint nullable (FK → `countries.id`); `phone` varchar nullable (encrypted; `phone_hash` as in `users`); `phone_hash` varchar nullable; `visibility` varchar default `'private'` (`public` / `members-only` / `private`); `consent_status` varchar default `'pending'`; `consent_recorded_at` timestamp nullable; `is_freedom_fighter` boolean default false (denormalised flag for the honour page — the detail is `freedom_fighters`, §3.7); `created_at`, `updated_at`, `deleted_at`. |
| **Foreign keys** | `user_id` → `users.id` (`ON DELETE SET NULL`); `household_id` → `households.id` (`ON DELETE SET NULL`); `profession_id` → `professions.id` (`ON DELETE SET NULL`); `expatriate_country_id` → `countries.id` (`ON DELETE SET NULL`). |
| **Indexes** | `household_id`; `profession_id`; `expatriate_country_id`; `is_expatriate`; `visibility`; `phone_hash`; a FULLTEXT index (default parser — MariaDB 11.8.9 has no ngram parser; `WITH PARSER ngram` is a syntax error) on `name_bn` + `name_en` + `profession_bn` + `area_bn` for directory search (per the search decision — doc 05 §10.4 and ADR-010 as rewritten for MariaDB; measured on MariaDB 11.8.9, 35 cases / 171 timed queries, `benchmark-mariadb/` — default-parser FULLTEXT + BOOLEAN MODE with `+term*` wildcards as a model scope). The `profession_bn`/`area_bn` columns are included because a name-only index cannot answer profession/area queries (e.g. `শিক্ষক`) — Investigator E. |
| **Unique constraints** | `user_id` UNIQUE where not null (one person record per account). `phone_hash` UNIQUE where not null (one databank entry per phone). |
| **Relationships** | Belongs to `households` and (optionally) `users`; belongs to `professions` and `countries`; has one `freedom_fighters` row (1:1, where applicable); has many `person_family_links` (as person and as relative); may be a `committee_members` person, an `advisors` person, or a `past_leaders` person (M3 links by `person_id` where the person is in the databank, or by name where they are historical — see §4). |
| **Soft delete** | Yes. |
| **Sensitive fields** | `date_of_birth`, `phone` (encrypted); `name_bn`/`name_en` are personal data (visibility-scoped). |
| **Retention** | Retained while the person is part of the community. On a deletion request, anonymised (name replaced by a token, phone/date of birth removed) — the row stays so that historical aggregates and committee records do not break, but it no longer identifies anyone (§11). |

### 3.3 `professions`

| Item | Detail |
|---|---|
| **Purpose** | Reference data: the profession taxonomy for the professionals directory (doctor, engineer, teacher, advocate, journalist, government officer, police/army, business — Plan v1.1 §6, M2; the prototype's directory categories were `teacher` / `doctor` / `professional` / `business` / `institution` / `place` — Audit Findings §5.1). |
| **Primary key** | `id` bigint. |
| **Fields** | `name_bn` varchar; `name_en` varchar; `slug` varchar; `is_active` boolean default true; `sort_order` integer default 0; `created_at`, `updated_at`. |
| **Foreign keys** | None. |
| **Indexes** | `slug` (unique); `is_active`. |
| **Unique constraints** | `slug` UNIQUE. |
| **Relationships** | Has many `persons`. |
| **Soft delete** | No — a profession is retired by `is_active = false`, not deleted (persons already linked keep their history). |
| **Sensitive fields** | None. |
| **Retention** | Permanent reference data. |

### 3.4 `countries`

| Item | Detail |
|---|---|
| **Purpose** | Reference data: countries (for expatriate location and for the expatriate request's `country` field). |
| **Primary key** | `id` bigint. |
| **Fields** | `name_bn` varchar; `name_en` varchar; `code` varchar (ISO 3166-1 alpha-2, e.g. `SA`, `AE`, `MY`); `is_active` boolean default true; `created_at`, `updated_at`. |
| **Foreign keys** | None. |
| **Indexes** | `code` (unique). |
| **Unique constraints** | `code` UNIQUE. |
| **Relationships** | Has many `persons` (as `expatriate_country_id`); has many `service_requests` (as `country_id` — the applicant's country). |
| **Soft delete** | No — retired by `is_active = false`. |
| **Sensitive fields** | None. |
| **Retention** | Permanent reference data. |

### 3.5 `institutions`

| Item | Detail |
|---|---|
| **Purpose** | Schools, mosques, madrasas, clinics, and other institutions in the area (M2). The prototype's directory has 3 institutions (High School, Jame Mosque, Community Clinic — Audit Findings §5.1) with no detail fields; the real table carries type, services, hours, contact, and location (Audit Findings §3 #5). |
| **Primary key** | `id` bigint. |
| **Fields** | `name_bn` varchar; `name_en` varchar nullable; `type` varchar (`school` / `mosque` / `madrasa` / `clinic` / `other`); `description_bn` text nullable; `description_en` text nullable; `area` varchar nullable; `address_bn` text nullable; `phone` varchar nullable (encrypted — an institution's public contact number is publishable only with consent; the stored value is the verified contact, and a separate `public_phone` flag governs display); `show_phone_publicly` boolean default false; `hours_bn` varchar nullable; `services_bn` text nullable; `visibility` varchar default `'public'`; `consent_status` varchar default `'pending'`; `created_at`, `updated_at`, `deleted_at`. |
| **Foreign keys** | None. |
| **Indexes** | `type`; `area`; `visibility`; FULLTEXT index (default parser — MariaDB has no ngram parser) on `name_bn` + `name_en`. |
| **Unique constraints** | None. |
| **Relationships** | Has many `media_links` (photos, polymorphic). |
| **Soft delete** | Yes. |
| **Sensitive fields** | `phone` (encrypted; display governed by `show_phone_publicly`). |
| **Retention** | Retained while the institution exists. On removal, soft-deleted (history preserved). |

### 3.6 `landmarks`

| Item | Detail |
|---|---|
| **Purpose** | Named places and landmarks (fields, graveyards, roads, the historic banyan square — Plan v1.1 §7; the prototype's "ঐতিহাসিক পুরনো বটতলা" is a `place` directory entry, Audit Findings §5.1). Distinct from `infrastructure_facilities` (§3.8 addition): a landmark is a named place of community significance; a facility is a built asset with a status/condition. |
| **Primary key** | `id` bigint. |
| **Fields** | `name_bn` varchar; `name_en` varchar nullable; `type` varchar (`field` / `graveyard` / `road` / `square` / `pond` / `other`); `description_bn` text nullable; `description_en` text nullable; `area` varchar nullable; `status` varchar (`active` / `damaged` / `removed` — M-24); `location_note_bn` text nullable (a textual location — there is no map in Phase 1, Audit Findings §8.13; M-24); `visibility` varchar default `'public'`; `created_at`, `updated_at`, `deleted_at`. |
| **Foreign keys** | None. |
| **Indexes** | `type`; `area`. |
| **Unique constraints** | None. |
| **Relationships** | Has many `media_links` (photos). |
| **Soft delete** | Yes. |
| **Sensitive fields** | None. |
| **Retention** | Permanent (a landmark does not stop existing because it is removed from the site; soft-delete preserves history). |

### 3.7 `freedom_fighters`

| Item | Detail |
|---|---|
| **Purpose** | Freedom-fighter profiles for the honour page (M2 — Plan v1.1 §6: "মুক্তিযোদ্ধা পরিচিতি (বিশেষ সম্মান পেজ)"). 1:1 with `persons`. |
| **Primary key** | `id` bigint. |
| **Fields** | `person_id` bigint (FK → `persons.id`, unique); `biography_bn` text nullable; `biography_en` text nullable; `honours_bn` text nullable; `is_published` boolean default false (published only with consent — these are named individuals); `consent_status` varchar default `'pending'`; `created_at`, `updated_at`, `deleted_at`. |
| **Foreign keys** | `person_id` → `persons.id` (`ON DELETE CASCADE`). |
| **Indexes** | `person_id` (unique); `is_published`. |
| **Unique constraints** | `person_id` UNIQUE (1:1). |
| **Relationships** | Belongs to `persons` (1:1). |
| **Soft delete** | Yes. |
| **Sensitive fields** | Biographical detail is personal data; publication requires `consent_status = granted` and `is_published = true`. |
| **Retention** | Permanent honour record; withdrawn from public view on consent withdrawal (unpublish, not delete). |

### 3.8 `person_family_links` — and `infrastructure_facilities` [ADDITION vs Plan v1.1]

**`person_family_links`** (plan table):

| Item | Detail |
|---|---|
| **Purpose** | Family relationships between `persons` rows (M1/M2 — a Member's family records, doc 04 §2.3; the prototype's profile form had a `family` textarea with no source data, Audit Findings §8.8). |
| **Primary key** | `id` bigint. |
| **Fields** | `person_id` bigint (FK → `persons.id`); `related_person_id` bigint (FK → `persons.id`); `relationship` varchar (`spouse` / `parent` / `child` / `sibling` / `other`); `relationship_bn` varchar nullable (free-text Bengali relationship where the enum does not fit); `created_at`, `updated_at`. |
| **Foreign keys** | Both → `persons.id` (`ON DELETE CASCADE`). |
| **Indexes** | `person_id`; `related_person_id`. |
| **Unique constraints** | (`person_id`, `related_person_id`, `relationship`) UNIQUE. |
| **Relationships** | Belongs to two `persons` rows. |
| **Soft delete** | No — the link is deleted when either person is deleted/anonymised (cascade). |
| **Sensitive fields** | The link itself reveals a family relationship; visibility follows the more restrictive of the two persons' visibility. |
| **Retention** | Follows the persons' retention. |

**`infrastructure_facilities`** [ADDITION vs Plan v1.1]:

| Item | Detail |
|---|---|
| **Purpose** | Community infrastructure/facility records — the feature the prototype **does not have at all** (Audit Findings §3 #6: no infrastructure listing, no map, no facilities section). The plan's `landmarks` covers named places; it does not cover facilities with a condition/status (a tube-well, a culvert, a community hall, a road section). This table is added so the feature has a home when the client supplies facility data. It is **not** built in Phase 1 unless the client supplies data — the table is defined here so the API and admin do not have to be redesigned later. |
| **Primary key** | `id` bigint. |
| **Fields** | `name_bn` varchar; `name_en` varchar nullable; `type` varchar (`water` / `road` / `hall` / `drainage` / `electricity` / `other`); `area` varchar nullable; `description_bn` text nullable; `status` varchar (`good` / `needs_repair` / `under_repair` / `out_of_service`); `location_note_bn` text nullable (a textual location — there is no map in Phase 1, Audit Findings §8.13); `latitude` decimal(10,7) nullable; `longitude` decimal(10,7) nullable (stored for a future map; **not** displayed publicly until the client approves location publication); `visibility` varchar default `'public'`; `created_at`, `updated_at`, `deleted_at`. |
| **Foreign keys** | None. |
| **Indexes** | `type`; `area`; `status`. |
| **Unique constraints** | None. |
| **Relationships** | Has many `media_links` (photos). |
| **Soft delete** | Yes. |
| **Sensitive fields** | Coordinates are sensitive until the client approves publication (a precise location of a facility can identify a household). |
| **Retention** | Retained while the facility exists; soft-deleted on removal. |

---

## 4. Domain C — Organisation (5 plan tables + 1 addition)

The organisation domain is M3. It holds the organisation's identity, constitution, committee, advisors, past leaders, and achievements.

### 4.1 `committee_terms`

| Item | Detail |
|---|---|
| **Purpose** | A committee term (মেয়াদ) — a dated period during which a committee holds office. Terms make succession auditable: an old committee is archived into history, not overwritten (Plan v1.1 §6, M3). |
| **Primary key** | `id` bigint. |
| **Fields** | `name_bn` varchar (e.g. "২০২৪–২০২৬ মেয়াদ" — the label is client-supplied; no dates are invented); `name_en` varchar nullable; `starts_on` date; `ends_on` date nullable (null = current term); `is_current` boolean default false; `is_current_key` TINYINT GENERATED ALWAYS AS (IF(`is_current` AND `deleted_at` IS NULL, 1, NULL)) STORED (the uniqueness key — see Unique constraints); `created_at`, `updated_at`, `deleted_at`. |
| **Foreign keys** | None. |
| **Indexes** | `is_current`; `starts_on`. |
| **Unique constraints** | `is_current_key` UNIQUE (`uk_one_current_term`) — MariaDB allows multiple NULLs in a unique index, so at most one row can hold `1`. **Invariant:** at most one `committee_terms` row has `is_current = true` at any time. Terms may overlap on dates during a transition; only the *current* flag is exclusive. Soft-deleted rows must not block activation — the `deleted_at IS NULL` guard in the generated column is essential, because soft-deleted rows still occupy the table. Activation is a transaction: lock the rows, clear the old current, set the new one; the unique index is the backstop and a 1062 duplicate-key error is caught and reported as 409. No partial unique index exists on MariaDB — this generated-column design replaces it (Phase 0.1, Investigator A §2.1). **Tests (must pass on a real MariaDB 11.8.9 instance):** two concurrent `activate()` calls on different terms → exactly one succeeds, the other gets 409 / retries; final state has exactly one `is_current = true`; activating an already-current term is a no-op; soft-deleting the current term then activating another succeeds. (UV-10: the design is reasoned from documented MySQL 8.4 semantics and must be re-proven on MariaDB 11.8.9 semantics by the named tests before the docs claim it as enforced — see 16-MARIADB-ADDENDUM.md.) |
| **Relationships** | Has many `committee_members`. |
| **Soft delete** | Yes (an erroneous term is soft-deleted, preserving the members linked to it). |
| **Sensitive fields** | None. |
| **Retention** | Permanent — terms are history. |

### 4.2 `committee_members`

| Item | Detail |
|---|---|
| **Purpose** | One person's membership of a committee term, in a role (President, General Secretary, Treasurer, Organising Secretary, Expatriate Affairs Secretary — the prototype's demo committee, Audit Findings §5.3, is the shape, not the data). |
| **Primary key** | `id` bigint. |
| **Fields** | `committee_term_id` bigint (FK); `person_id` bigint nullable (FK → `persons.id` — null where the member is historical and not in the databank); `name_bn` varchar (denormalised — the display name, so a historical member without a `persons` row still renders); `name_en` varchar nullable; `role_bn` varchar; `role_en` varchar nullable; `role_key` varchar (`president` / `general_secretary` / `treasurer` / `organising_secretary` / `expatriate_affairs_secretary` / `member` / `other`); `single_holder_key` VARCHAR GENERATED ALWAYS AS (IF(`role_key` IN ('president', 'general_secretary', 'treasurer') AND `deleted_at` IS NULL, CONCAT(`committee_term_id`, ':', `role_key`), NULL)) STORED (the uniqueness key — see Unique constraints); `photo_media_id` bigint nullable (FK → `media.id`); `display_order` integer default 0; `is_published` boolean default false; `created_at`, `updated_at`, `deleted_at`. |
| **Foreign keys** | `committee_term_id` → `committee_terms.id` (`ON DELETE RESTRICT` — a term with members cannot be deleted); `person_id` → `persons.id` (`ON DELETE SET NULL` — the name stays if the person record is anonymised); `photo_media_id` → `media.id` (`ON DELETE SET NULL`). |
| **Indexes** | `committee_term_id`; `role_key`; `is_published`. |
| **Unique constraints** | `single_holder_key` UNIQUE (`uk_single_holder`) — at most one holder of each single-holder role (`president`, `general_secretary`, `treasurer`) per term; multi-holder roles (`member`, `other`) produce NULL and are exempt (MariaDB allows multiple NULLs in a unique index). No partial unique index exists on MariaDB — this generated-column design replaces it (Phase 0.1, Investigator A §2.2; UV-10 applies — prove by test on a real MariaDB 11.8.9 instance; see 16-MARIADB-ADDENDUM.md). |
| **Relationships** | Belongs to `committee_terms`; belongs to `persons` (optional); has one `media` (photo). |
| **Soft delete** | Yes. |
| **Sensitive fields** | A named person's committee role is public by design (with consent — `is_published` + the person's `consent_status`). No phone is stored here. |
| **Retention** | Permanent — past committees are history. |

### 4.3 `advisors`

| Item | Detail |
|---|---|
| **Purpose** | Advisory council members (M3). Same shape as committee members but without terms (advisors are not term-bound in the plan). |
| **Primary key** | `id` bigint. |
| **Fields** | `person_id` bigint nullable (FK → `persons.id`); `name_bn` varchar; `name_en` varchar nullable; `title_bn` varchar nullable (e.g. "প্রধান উপদেষ্টা"); `title_en` varchar nullable; `photo_media_id` bigint nullable (FK → `media.id`); `display_order` integer default 0; `is_published` boolean default false; `created_at`, `updated_at`, `deleted_at`. |
| **Foreign keys** | `person_id` → `persons.id` (`ON DELETE SET NULL`); `photo_media_id` → `media.id` (`ON DELETE SET NULL`). |
| **Indexes** | `is_published`; `display_order`. |
| **Unique constraints** | None. |
| **Relationships** | Belongs to `persons` (optional); has one `media` (photo). |
| **Soft delete** | Yes. |
| **Sensitive fields** | As §4.2 — public by design with consent; no phone. |
| **Retention** | Permanent. |

### 4.4 `past_leaders`

| Item | Detail |
|---|---|
| **Purpose** | Former presidents / general secretaries (M3) — the historical record. The prototype's two demo former leaders (Audit Findings §5.3) show the shape: one with an open-ended term ("1999 — "), one with a blank term. The real table requires complete terms where known, and records "unknown" explicitly where not known — it never invents a date. |
| **Primary key** | `id` bigint. |
| **Fields** | `person_id` bigint nullable (FK → `persons.id`); `name_bn` varchar; `name_en` varchar nullable; `role_bn` varchar; `role_en` varchar nullable; `role_key` varchar (`president` / `general_secretary` / `other`); `term_start_year` integer nullable; `term_end_year` integer nullable (null = open/unknown, recorded as such — never guessed); `term_note_bn` varchar nullable (e.g. "মেয়াদ যাচাইাধীন" — term under verification); `photo_media_id` bigint nullable; `is_published` boolean default false; `display_order` integer default 0; `created_at`, `updated_at`, `deleted_at`. |
| **Foreign keys** | `person_id` → `persons.id` (`ON DELETE SET NULL`); `photo_media_id` → `media.id` (`ON DELETE SET NULL`). |
| **Indexes** | `role_key`; `term_start_year`; `is_published`. |
| **Unique constraints** | None. |
| **Relationships** | Belongs to `persons` (optional); has one `media` (photo). |
| **Soft delete** | Yes. |
| **Sensitive fields** | As §4.2. |
| **Retention** | Permanent — this is the organisation's history. |

### 4.5 `achievements`

| Item | Detail |
|---|---|
| **Purpose** | Organisation achievements / milestones for the timeline (M3). The heritage timeline ("The Meridian") has exactly **one verified milestone** today — the 1999 founding (Audit Findings §2.2, QA D10: intentional, not a defect). This table holds milestones; a milestone is published only when `is_verified = true` and the client has supplied the supporting document. No milestone is invented. |
| **Primary key** | `id` bigint. |
| **Fields** | `year` integer (the milestone year; nullable only for undated era blocks — the prototype's three undated era blocks, Audit Findings §2.2, are **not** milestones and are not stored here; they are frontend copy); `title_bn` varchar; `title_en` varchar nullable; `body_bn` text nullable; `body_en` text nullable; `is_verified` boolean default false; `verified_by` bigint nullable (FK → `users.id`); `verified_at` timestamp nullable; `verification_note` text nullable (what document verified it); `display_order` integer default 0; `is_published` boolean default false; `created_at`, `updated_at`, `deleted_at`. |
| **Foreign keys** | `verified_by` → `users.id` (`ON DELETE SET NULL`). |
| **Indexes** | `year`; `is_verified`; `is_published`. |
| **Unique constraints** | None. |
| **Relationships** | Belongs to `users` (verifier). Has many `media_links` (supporting images/documents). |
| **Soft delete** | Yes. |
| **Sensitive fields** | None. |
| **Retention** | Permanent. An unverified milestone is never published; a published milestone that proves wrong is unpublished (not deleted) with a correction note. |

### 4.6 `constitution_versions` [ADDITION vs Plan v1.1 — Phase 0.1]

| Item | Detail |
|---|---|
| **Purpose** | The organisation's constitution versions (M3): the governing document, versioned. A new version supersedes the old; history is kept. **Reason for the addition:** the constitution is a governed document and needs a versioned home; previously no table held it (Investigator C, M-05). |
| **Primary key** | `id` bigint. |
| **Fields** | `version` varchar (e.g. `2026-01`); `title_bn` varchar; `body_bn` longtext; `body_en` longtext nullable; `effective_from` date; `supersedes_version_id` bigint nullable (FK → `constitution_versions.id` — the previous version, added by a follow-up migration, §10 step 11); `is_current` boolean default false; `is_current_key` TINYINT GENERATED ALWAYS AS (IF(`is_current` AND `deleted_at` IS NULL, 1, NULL)) STORED (same pattern as §4.1); `approved_by` bigint nullable (FK → `users.id`); `approved_at` timestamp nullable; `document_media_id` bigint nullable (FK → `media.id` — the signed PDF/scan); `created_at`, `updated_at`, `deleted_at`. |
| **Foreign keys** | `supersedes_version_id` → `constitution_versions.id` (`ON DELETE SET NULL`); `approved_by` → `users.id` (`ON DELETE SET NULL`); `document_media_id` → `media.id` (`ON DELETE SET NULL`). |
| **Indexes** | `is_current`; `effective_from`. |
| **Unique constraints** | `version` UNIQUE. `is_current_key` UNIQUE (`uk_one_current_constitution`) — at most one current constitution (same generated-column pattern as §4.1). |
| **Relationships** | Belongs to `users` (approver, optional); has one `media` (document, optional). |
| **Soft delete** | Yes. |
| **Sensitive fields** | None. |
| **Retention** | Permanent — constitutions are history. |

---

## 5. Domain D — Activities & Content (7 plan tables + 2 additions)

The activities & content domain is M4 (Annual Activities) + M7 (Content). Content follows the publish lifecycle (doc 05 §9.3).

### 5.1 `activities`

| Item | Detail |
|---|---|
| **Purpose** | Annual activities (M4): scholarship awards, blood camps, winter-clothing distribution, tree plantation, medical camps, relief — by year and category. The prototype has 6 demo activities (Audit Findings §5.2) with a year and a date but **no category field** (Audit Findings §8.7 — the category filter had no data behind it). The real table stores the category. |
| **Primary key** | `id` bigint. |
| **Fields** | `year` integer (e.g. 2026); `category` varchar (`scholarship` / `winter_clothing` / `blood_donation` / `medical_camp` / `tree_plantation` / `national_day` / `relief` / `other` — Plan v1.1 §6, M4); `title_bn` varchar; `title_en` varchar nullable; `body_bn` text; `body_en` text nullable; `event_date` date nullable; `beneficiary_count` integer nullable (count of people helped — a number, not prose; null = not recorded); `status` varchar default `'draft'` (`draft` / `review` / `published` / `archived`); `published_at` timestamp nullable; `annual_report_id` bigint nullable (FK → `annual_reports.id` — the annual report this activity belongs to, if any; added by a later migration, after `annual_reports` exists — §10 step 7; M-25); `created_by` bigint (FK → `users.id`); `updated_by` bigint nullable (FK → `users.id`); `created_at`, `updated_at`, `deleted_at`. |
| **Foreign keys** | `created_by` → `users.id` (`ON DELETE RESTRICT`); `updated_by` → `users.id` (`ON DELETE SET NULL`). |
| **Indexes** | `year`; `category`; `status`; `published_at`; FULLTEXT index (default parser — MariaDB has no ngram parser) on `title_bn` + `body_bn`. |
| **Unique constraints** | None. |
| **Relationships** | Has many `media_links` (photos/video); belongs to `annual_reports` optionally via `annual_report_id` (see §5.8 — a nullable FK added on this table, not a separate table: `annual_report_id` bigint nullable → `annual_reports.id`; M-25). |
| **Soft delete** | Yes. |
| **Sensitive fields** | None in the activity itself. Photos of identifiable people are governed by the `media` consent flags (§5.4). |
| **Retention** | Permanent — activities are the organisation's annual record; archived by year, never deleted. |

### 5.2 `posts`

| Item | Detail |
|---|---|
| **Purpose** | Notices, news, event announcements, job circulars, student-success stories (M7 — Plan v1.1 §6: categories নোটিশ, সংবাদ, অনুষ্ঠান ঘোষণা, চাকরির বিজ্ঞপ্তি, শিক্ষার্থীর সাফল্য). One table, distinguished by `category`; translations in `post_translations` (§5.3). The prototype renders news/notices/events/jobs through one helper (`edRow()` — Audit Findings §4.9); the real system keeps them as one resource with a category, which is the same shape done properly. |
| **Primary key** | `id` bigint. |
| **Fields** | `category` varchar (`notice` / `news` / `event` / `job` / `success_story`); `slug` varchar; `tag` varchar nullable (a short tag/label for the post — M-20); `employer_bn` varchar nullable; `employer_en` varchar nullable (the employer, for job circulars — M-20); `application_deadline` date nullable (for job circulars — M-20); `status` varchar default `'draft'` (`draft` / `review` / `published` / `scheduled` / `archived`); `is_urgent` boolean default false (urgent notice → homepage ticker + push, doc 05 §9.3); `publish_at` timestamp nullable (scheduled publish); `expires_at` timestamp nullable (notices auto-archive at expiry); `verified` boolean default false (**mandatory for job circulars** — only verified circulars are published, doc 05 §9.3); `author_id` bigint (FK → `users.id`); `published_by` bigint nullable (FK → `users.id` — the publisher, distinct from the author when the roles split, doc 04 §6.3); `published_at` timestamp nullable; `created_at`, `updated_at`, `deleted_at`. |
| **Foreign keys** | `author_id` → `users.id` (`ON DELETE RESTRICT`); `published_by` → `users.id` (`ON DELETE SET NULL`). |
| **Indexes** | `category`; `status`; `is_urgent`; `publish_at`; `expires_at`; `slug` (unique). |
| **Unique constraints** | `slug` UNIQUE. |
| **Relationships** | Has many `post_translations`; has many `media_links`; belongs to `users` (author, publisher). |
| **Soft delete** | Yes. |
| **Sensitive fields** | None. A job circular's employer contact is published only when the circular is verified and the contact is approved for publication. |
| **Retention** | Published posts are retained permanently as the organisation's public record; archived posts remain visible as history. Drafts may be deleted (soft-delete) by their author or a Super Admin. |

### 5.3 `post_translations`

| Item | Detail |
|---|---|
| **Purpose** | The Bengali/English content of a `posts` row (M7). This is the translations-table pattern (§9): the `posts` row holds the language-neutral fields (category, status, dates, flags); this table holds the language-specific fields. |
| **Primary key** | `id` bigint. |
| **Fields** | `post_id` bigint (FK); `locale` varchar (`bn` / `en`); `title` varchar; `body` text; `excerpt` varchar nullable; `created_at`, `updated_at`. |
| **Foreign keys** | `post_id` → `posts.id` (`ON DELETE CASCADE`). |
| **Indexes** | `post_id`; `locale`. |
| **Unique constraints** | (`post_id`, `locale`) UNIQUE — one translation per language per post. |
| **Relationships** | Belongs to `posts`. |
| **Soft delete** | No — follows the post (cascade). |
| **Sensitive fields** | None. |
| **Retention** | Follows the post. |

### 5.4 `media`

| Item | Detail |
|---|---|
| **Purpose** | The media library (M7): one row per uploaded file (photo or video), with its metadata, variants, and consent flags. The prototype has 21 embedded base64 demo images with no upload path and no consent record (Audit Findings §5.6); the real system has an upload path and a consent flag on every image of a person. |
| **Primary key** | `id` bigint. |
| **Fields** | `disk` varchar (e.g. `public` / `local` — the Storage disk, §11 of doc 05); `path` varchar (relative path on the disk); `original_name` varchar; `mime_type` varchar; `size_bytes` bigint; `width` integer nullable; `height` integer nullable; `duration_seconds` integer nullable (video only); `poster_media_id` bigint nullable (self-reference — the poster frame for a video); `variants` JSON nullable (derived variants: thumbnail/WebP paths and dimensions — stored as MariaDB `JSON` (a `LONGTEXT` alias; JSON validation differs from MySQL — see 16-MARIADB-ADDENDUM.md), not as separate rows, because variants are derived, not independent records); `caption_bn` varchar nullable; `caption_en` varchar nullable; `consent_status` varchar default `'pending'` (`pending` / `granted` / `withdrawn` / `not_applicable` — `not_applicable` for images with no identifiable person, e.g. a landscape); `consent_recorded_at` timestamp nullable; `consent_note` text nullable (who gave consent, and how — e.g. "verbal, at the event, recorded by [name]"); `uploaded_by` bigint (FK → `users.id`); `created_at`, `updated_at`, `deleted_at`. |
| **Foreign keys** | `uploaded_by` → `users.id` (`ON DELETE RESTRICT`); `poster_media_id` → `media.id` (`ON DELETE SET NULL`). |
| **Indexes** | `disk`; `mime_type`; `consent_status`; `uploaded_by`; `created_at`. |
| **Unique constraints** | `path` UNIQUE (one row per stored file). |
| **Relationships** | Has many `media_links` (polymorphic — the usages); belongs to `users` (uploader); may be the poster of another `media` row (video). |
| **Soft delete** | Yes — soft-deleting removes the file from public view immediately; the file itself is removed from storage after the retention/grace period, or immediately on consent withdrawal (§11). |
| **Sensitive fields** | The file itself may be sensitive (a voucher photo, a person's portrait). The `disk` determines whether it is publicly reachable; private files live on the non-public disk and are served through a controller + signed URL (doc 05 §11.1). |
| **Retention** | Published media is retained while it is published. On consent withdrawal, the file is removed from public view immediately and deleted from storage (the `media` row is soft-deleted with the consent record kept in the audit log). |

### 5.5 `media_links`

| Item | Detail |
|---|---|
| **Purpose** | The polymorphic link between a `media` row and the record it illustrates (an activity, a post, a gallery album, an institution, a landmark, a person, a request update, a finance voucher). One media file can be used in more than one place; the link records where, and in what order. |
| **Primary key** | `id` bigint. |
| **Fields** | `media_id` bigint (FK → `media.id`); `linkable_type` varchar (the model class, e.g. `activities`); `linkable_id` bigint; `role` varchar (`cover` / `gallery` / `voucher` / `photo` / `poster` — what the image is for on that record); `sort_order` integer default 0; `created_at`, `updated_at`. |
| **Foreign keys** | `media_id` → `media.id` (`ON DELETE CASCADE`). (`linkable_id` is polymorphic — no FK.) |
| **Indexes** | (`linkable_type`, `linkable_id`); `media_id`; `role`. |
| **Unique constraints** | None (the same image may legitimately appear twice on one record in different roles). |
| **Relationships** | Belongs to `media`; belongs to the polymorphic owner. |
| **Soft delete** | No — follows the media row or the owner (deleted when either is deleted). |
| **Sensitive fields** | None (sensitivity lives on the `media` row). |
| **Retention** | Follows the owner. |

### 5.6 `events`

| Item | Detail |
|---|---|
| **Purpose** | Upcoming events (M7) — distinct from `posts` (category `event`) and from `activities` (past annual activities). An `events` row is a dated, forward-looking occasion (a blood camp on a date, at a venue) with a time and a venue; a `posts` row in category `event` is the announcement of it. In practice the two are created together; the split exists because an event has a date/time/venue and (later) registrations, while an announcement has a body and a publish lifecycle. If the build team finds the split is over-engineering, the two may be merged into `posts` with `event_date`/`venue` columns — that is a build-time simplification to record, not a silent change. The prototype's 2 demo events (Audit Findings §5.2) have no date/time/venue fields beyond prose; the real table has them. |
| **Primary key** | `id` bigint. |
| **Fields** | `title_bn` varchar; `title_en` varchar nullable; `body_bn` text nullable; `body_en` text nullable; `starts_at` timestamp; `ends_at` timestamp nullable; `venue_bn` varchar nullable; `venue_en` varchar nullable; `post_id` bigint nullable (FK → `posts.id` — the announcement, if one exists); `status` varchar default `'draft'` (`draft` / `published` / `completed` / `cancelled`); `created_by` bigint (FK → `users.id`); `created_at`, `updated_at`, `deleted_at`. |
| **Foreign keys** | `post_id` → `posts.id` (`ON DELETE SET NULL`); `created_by` → `users.id` (`ON DELETE RESTRICT`). |
| **Indexes** | `starts_at`; `status`; `post_id`. |
| **Unique constraints** | None. |
| **Relationships** | Belongs to `posts` (optional); has many `media_links`; belongs to `users` (creator). |
| **Soft delete** | Yes. |
| **Sensitive fields** | None. |
| **Retention** | Permanent — past events become part of the annual record (and may be linked to an `activities` row for the year). |

### 5.7 `gallery_albums`

| Item | Detail |
|---|---|
| **Purpose** | Photo/video albums (M7) — the grouping for the gallery. The prototype's gallery is a flat list of 8 images (Audit Findings §5.2); the real gallery groups images into albums (by year and category — Plan v1.1 §6, M7). |
| **Primary key** | `id` bigint. |
| **Fields** | `title_bn` varchar; `title_en` varchar nullable; `year` integer nullable; `category` varchar nullable; `cover_media_id` bigint nullable (FK → `media.id`); `is_published` boolean default false; `display_order` integer default 0; `created_by` bigint (FK → `users.id`); `created_at`, `updated_at`, `deleted_at`. |
| **Foreign keys** | `cover_media_id` → `media.id` (`ON DELETE SET NULL`); `created_by` → `users.id` (`ON DELETE RESTRICT`). |
| **Indexes** | `year`; `category`; `is_published`. |
| **Unique constraints** | None. |
| **Relationships** | Has many `media` (via `media_links` with `linkable_type = gallery_albums`); has one cover `media`. |
| **Soft delete** | Yes. |
| **Sensitive fields** | None on the album; the consent flags live on the `media` rows. An album is publishable only when every image in it has `consent_status` in (`granted`, `not_applicable`) — enforced by the publish service, not by a flag. |
| **Retention** | Permanent. |

### 5.8 `faqs` [ADDITION vs Plan v1.1] and `annual_reports` [ADDITION vs Plan v1.1]

**`faqs`** [ADDITION]:

| Item | Detail |
|---|---|
| **Purpose** | Frequently asked questions (M7). The prototype has 5 demo Q&As (Audit Findings §5.3) rendered from a `FACTS` array, with no search, categories, or admin editing (Audit Findings §3 #36). The plan's `posts` table could hold FAQs as a category, but FAQs are not posts: they have no author, no publish date, no expiry, and they are ordered, not dated. A dedicated table keeps the FAQ admin simple and the API clean. **Reason for the addition:** the audit proves an FAQ entity is needed, and the plan's catalogue has no table that fits it without distortion. |
| **Primary key** | `id` bigint. |
| **Fields** | `question_bn` text; `question_en` text nullable; `answer_bn` text; `answer_en` text nullable; `category` varchar nullable; `sort_order` integer default 0; `is_published` boolean default true; `created_at`, `updated_at`, `deleted_at`. |
| **Foreign keys** | None. |
| **Indexes** | `category`; `is_published`; `sort_order`. |
| **Unique constraints** | None. |
| **Relationships** | None. |
| **Soft delete** | Yes. |
| **Sensitive fields** | None. |
| **Retention** | Permanent while published; soft-deleted on removal. |

**`annual_reports`** [ADDITION]:

| Item | Detail |
|---|---|
| **Purpose** | Published annual reports (M8/M4): one row per year, holding the report file and its metadata. The prototype's "report" is a `.txt` generated in the browser (Audit Findings §2.3) with a note that no PDF is generated in the demo. The plan's catalogue has `ledger_entries` and `projects` but no table for the report itself — the report is the published artefact the public downloads, and it needs a row (year, title, file, audited flag, published date). **Reason for the addition:** the audit proves an annual-report entity is needed (Audit Findings §3 #29 — "Real audited annual reports (PDF + summary, versioned by year)"), and the plan's §7 has no table for it. |
| **Primary key** | `id` bigint. |
| **Fields** | `year` integer; `title_bn` varchar; `title_en` varchar nullable; `file_media_id` bigint (FK → `media.id` — the PDF); `summary_bn` text nullable; `summary_en` text nullable; `is_audited` boolean default false; `audited_by_bn` varchar nullable (the auditor's name, as supplied by the client); `published_at` timestamp nullable; `is_published` boolean default false; `created_by` bigint (FK → `users.id`); `created_at`, `updated_at`, `deleted_at`. |
| **Foreign keys** | `file_media_id` → `media.id` (`ON DELETE RESTRICT` — a published report's file cannot be deleted); `created_by` → `users.id` (`ON DELETE RESTRICT`). |
| **Indexes** | `year` (unique — see below); `is_published`; `is_audited`. |
| **Unique constraints** | `year` UNIQUE (one annual report per year; a revised report for the same year is a new version of the same row, with the file replaced and the replacement audit-logged — not a second row). |
| **Relationships** | Has one `media` (the PDF file); has many `activities` (linked by `activities.annual_report_id`). |
| **Soft delete** | Yes — but a published report is **never** soft-deleted to hide a mistake; a corrected report replaces the file with a new version and a correction note. Soft-delete is for drafts only. |
| **Sensitive fields** | None — the report is a public document by definition. |
| **Retention** | Permanent. Annual reports are the organisation's public financial record. |

---

## 6. Domain E — Services (6 plan tables + 2 additions)

The services domain is M5 (Expatriate Support) + M6 (Blood Donor). It is the most sensitive domain in the platform (Plan v1.1 §6).

### 6.1 `service_requests`

| Item | Detail |
|---|---|
| **Purpose** | An expatriate support request (M5). The core entity of the platform's most sensitive module. One row per request, identified publicly by its Request ID. **The Request ID is a public identifier, never a credential** — tracking requires the secret issued at submission (doc 04 §7.4, doc 07 §8.3). |
| **Primary key** | `id` bigint. (The public identifier is `request_no`, below — the bigint `id` is internal only and never exposed in a URL.) |
| **Fields** | `request_no` varchar (the Request ID, format `EXP-YYYY-####` — Decision Sheet; generated server-side from a per-year sequence inside a transaction, so uniqueness is guaranteed — the prototype's random IDs could collide, Audit Findings §8.10); `service_type_id` bigint (FK → `service_types.id` — the service, from the admin-managed catalogue, §6.8); `service_key` varchar (snapshot of the service key at submission — history must not change if the catalogue is renamed); `service_name_bn` varchar (snapshot of the service name at submission); `for_whom_bn` varchar (beneficiary — e.g. "মা — উত্তর পাড়া"); `details_bn` text (≥ 10 characters — Audit Findings §7.1, server-side); `urgency` varchar (`normal` / `urgent` — the prototype's `when` select (urgent/today/tomorrow/week) is split here into `urgency` + `needed_by`, because "when" conflated urgency with a date); `needed_by` varchar nullable (`today` / `tomorrow` / `week` / null — the timing preference, kept for compatibility with the prototype's options); `is_emergency` boolean default false (emergency flag for ERT escalation — the prototype has no expatriate-emergency path, Audit Findings §3 #17; the flag exists so one can be built); `applicant_user_id` bigint nullable (FK → `users.id` — null when the request is submitted without an account, which the prototype allows and Phase 1 keeps, Audit Findings §3.1); `applicant_name_bn` varchar (the applicant, as given in the form); `applicant_phone` varchar (encrypted — §11; `applicant_phone_hash` for lookup); `applicant_phone_hash` varchar; `applicant_country_id` bigint nullable (FK → `countries.id`); `beneficiary_phone` varchar nullable (encrypted, where the beneficiary is not the applicant); `status` varchar default `'pending'` (`pending` / `accepted` / `in_progress` / `completed` / `closed` / `rejected` / `cancelled` — Decision Sheet); `assigned_helper_id` bigint nullable (FK → `users.id` — the helper; null until assigned); `assigned_at` timestamp nullable; `backup_helper_id` bigint nullable (FK → `users.id` — the backup helper for this request, doc 05 §9.1; current assignment only — assignment history is not retained in Phase 1, M-04 option (a)); `backup_assigned_at` timestamp nullable; `tracking_secret_hash` varchar (SHA-256 of the 128-bit tracking secret — the Request ID is never a credential, doc 04 §7.4); `tracking_secret_set_at` timestamp; `tracking_failed_attempts` integer default 0; `tracking_locked_until` timestamp nullable; `tracking_last_used_at` timestamp nullable; `rejection_reason` text nullable (mandatory when `status = rejected`); `cancellation_reason` text nullable; `no_expense_declaration` boolean default false (the "no expenses incurred" declaration that allows completion without an expense line — doc 05 §9.1); `closed_by_applicant` boolean default false; `closed_at` timestamp nullable; `created_at`, `updated_at`, `deleted_at` (soft delete — but see the retention rule: a request is never hard-deleted, and soft-deletion is for erroneous duplicates only, with the audit log as the record). |
| **Foreign keys** | `applicant_user_id` → `users.id` (`ON DELETE SET NULL` — the request survives the applicant's account deletion, anonymised); `applicant_country_id` → `countries.id` (`ON DELETE SET NULL`); `assigned_helper_id` → `users.id` (`ON DELETE SET NULL`); `backup_helper_id` → `users.id` (`ON DELETE SET NULL`); `service_type_id` → `service_types.id` (`ON DELETE RESTRICT` — a service in use cannot be deleted; deactivate it instead). |
| **Indexes** | `request_no` (unique); `status`; `service_type_id`; `assigned_helper_id`; `backup_helper_id`; `applicant_user_id`; `applicant_phone_hash`; `created_at`. |
| **Unique constraints** | `request_no` UNIQUE. |
| **Relationships** | Belongs to `users` (applicant, assigned helper, backup helper); belongs to `countries`; belongs to `service_types`; has many `service_request_updates`; has many `service_request_expenses`; has many `media_links` (photos attached to updates/expenses — via the update/expense rows, not directly). |
| **Soft delete** | Yes — but a request is soft-deleted only when it is an erroneous duplicate. A genuine request is never deleted; it ends in `closed`, `rejected`, or `cancelled`. |
| **Sensitive fields** | `applicant_phone`, `beneficiary_phone` (encrypted); `applicant_name_bn`, `for_whom_bn`, `details_bn` (personal data — visible to Super Admins, the assigned helper, and the applicant; **never** in the public tracking view — doc 04 §7.4). |
| **Retention** | Permanent. Requests are the organisation's service record. On an applicant's deletion request, the request is anonymised (names/phones removed) but the service history (service, status, expenses, dates) is kept. |

### 6.2 `service_request_updates`

| Item | Detail |
|---|---|
| **Purpose** | A status-change note / progress update on a request (M5). The step notes the applicant sees in tracking. The prototype's step notes are a 4-element array with "—" for missing steps (Audit Findings §5.5); the real system stores each update as a row with an actor and a timestamp, so the timeline is a real history, not a filled array. |
| **Primary key** | `id` bigint. |
| **Fields** | `service_request_id` bigint (FK); `author_id` bigint (FK → `users.id` — the helper or Super Admin who wrote it); `status_from` varchar nullable; `status_to` varchar nullable (both recorded when the update accompanies a transition; null when it is a plain note); `note_bn` text; `note_en` text nullable; `is_visible_to_applicant` boolean default true (internal notes — e.g. "waiting for the pharmacy to open" — may be hidden from the applicant; the default is visible, because the applicant is entitled to know what is happening); `created_at`, `updated_at`. |
| **Foreign keys** | `service_request_id` → `service_requests.id` (`ON DELETE CASCADE`); `author_id` → `users.id` (`ON DELETE RESTRICT` — the author is part of the record). |
| **Indexes** | `service_request_id`; `created_at`. |
| **Unique constraints** | None. |
| **Relationships** | Belongs to `service_requests` and `users`; has many `media_links` (photos attached to the update — the prototype's Home §05 copy promises "ছবিসহ আপডেট" (photo updates), Audit Findings §9.8, which no prototype implements). |
| **Soft delete** | No — updates are history. An erroneous update is corrected by a new update, not by deleting the old one. (If a genuinely sensitive note is posted by mistake, a Super Admin may hide it by setting `is_visible_to_applicant = false` and recording the reason in the audit log.) |
| **Sensitive fields** | `note_bn` may contain personal detail; visibility is governed by `is_visible_to_applicant` and by the request's own visibility rules. |
| **Retention** | Permanent — the update history is the audit trail of the request. |

### 6.3 `service_request_expenses`

| Item | Detail |
|---|---|
| **Purpose** | An itemised expense line on a request (M5): the actual product cost + transport, borne by the applicant. **There is no service-charge field** (Decision Sheet). The prototype's demo request has two lines (medicine ৳850 + transport ৳120 = ৳970, charge ৳0 — Audit Findings §5.5); the real table stores exactly that shape. |
| **Primary key** | `id` bigint. |
| **Fields** | `service_request_id` bigint (FK); `item_bn` varchar (e.g. "ওষুধ (প্রেসক্রিপশন অনুযায়ী)"); `item_en` varchar nullable; `kind` varchar (`product` / `transport` / `other` — the two kinds the policy names, plus `other` for a genuinely different cost, with a note); `amount` numeric(12,2) (BDT, never float); `voucher_media_id` bigint nullable (FK → `media.id` — the receipt/voucher photo; required by policy for product costs above a threshold set at build time, recommended for all); `recorded_by` bigint (FK → `users.id` — the helper or Super Admin who recorded it); `recorded_at` timestamp (defaults to `created_at`); `created_at`, `updated_at`. |
| **Foreign keys** | `service_request_id` → `service_requests.id` (`ON DELETE CASCADE`); `voucher_media_id` → `media.id` (`ON DELETE SET NULL`); `recorded_by` → `users.id` (`ON DELETE RESTRICT`). |
| **Indexes** | `service_request_id`; `kind`; `recorded_at`. |
| **Unique constraints** | None. |
| **Relationships** | Belongs to `service_requests`; has one `media` (voucher); belongs to `users` (recorder). |
| **Soft delete** | No — an expense line is never deleted. A wrong line is corrected by a **reversal expense line** (a negative line of the same kind, linked by `reverses_expense_id` — a self-referencing nullable FK added on this table: `reverses_expense_id` bigint nullable → `service_request_expenses.id`), mirroring the finance ledger's reversal-only rule. The total shown to the applicant is the sum of the lines including reversals. |
| **Sensitive fields** | A voucher photo may contain personal data (a prescription, a shop receipt with a name). Vouchers live on the non-public disk (doc 05 §11.1) and are visible only to Super Admins, the assigned helper, and the applicant. |
| **Retention** | Permanent — expenses are the financial record of the request. |

### 6.4 `emergency_team_members`

| Item | Detail |
|---|---|
| **Purpose** | The Emergency Response Team roster (M5): 3–5 people (Decision Sheet), with a primary/backup designation. The prototype mentions the ERT (3–5 people) in copy only, with no roster (Audit Findings §3 #17). |
| **Primary key** | `id` bigint. |
| **Fields** | `user_id` bigint nullable (FK → `users.id` — null where the ERT member is not a platform user, e.g. a community volunteer reached by phone); `person_id` bigint nullable (FK → `persons.id` — the databank person, where the team member is in the databank; persons are the source of truth, C §4); `name_bn` varchar; `name_en` varchar nullable; `phone` varchar (encrypted — the ERT phone is the one number that must be reachable in an emergency, and it is visible only to Super Admins and to the assigned helper on an emergency request); `phone_hash` varchar; `role_in_team` varchar (`primary` / `backup`); `is_on_call` boolean default false; `display_order` integer default 0; `is_active` boolean default true; `created_at`, `updated_at`, `deleted_at`. |
| **Foreign keys** | `user_id` → `users.id` (`ON DELETE SET NULL`); `person_id` → `persons.id` (`ON DELETE SET NULL`). |
| **Indexes** | `is_on_call`; `is_active`; `role_in_team`; `person_id`. |
| **Unique constraints** | None (the 3–5 size is enforced by the admin UI and a validation rule, not by a database constraint — the size is a policy, and the policy may change). |
| **Relationships** | Belongs to `users` (optional); belongs to `persons` (optional). |
| **Soft delete** | Yes. |
| **Sensitive fields** | `phone` (encrypted; visible only to Super Admins and on emergency requests). |
| **Retention** | Retained while the person is on the team; soft-deleted on leaving. The phone is removed on deletion (anonymised). |

### 6.5 `blood_donors`

| Item | Detail |
|---|---|
| **Purpose** | The blood-donor registry (M6). One row per donor. The prototype has 6 demo donors (Audit Findings §5.2) with masked phones; the real table stores the phone encrypted and computes availability. |
| **Primary key** | `id` bigint. |
| **Fields** | `user_id` bigint nullable (FK → `users.id` — null for a donor registered by a Super Admin on someone's behalf, or for a donor without an account); `person_id` bigint nullable (FK → `persons.id` — the databank person, where the donor is in the databank; persons are the source of truth, C §4); `name_bn` varchar; `name_en` varchar nullable; `blood_group` varchar (`A+` / `A-` / `B+` / `B-` / `O+` / `O-` / `AB+` / `AB-` — all 8 groups; the prototype has donors in only 6 of 8, Audit Findings §5.2); `area` varchar; `phone` varchar (encrypted); `phone_hash` varchar; `last_donation_date` date nullable (null = never donated / unknown); `is_active` boolean default true (the donor is listed); `consent_status` varchar default `'pending'` (`pending` / `granted` / `withdrawn` — consent to be listed and contacted; §11); `consent_recorded_at` timestamp nullable; `created_at`, `updated_at`, `deleted_at`. |
| **Foreign keys** | `user_id` → `users.id` (`ON DELETE SET NULL`); `person_id` → `persons.id` (`ON DELETE SET NULL`). |
| **Indexes** | `blood_group`; `area`; `is_active`; `phone_hash`; `last_donation_date`; `person_id`. |
| **Unique constraints** | `phone_hash` UNIQUE where not null (one donor record per phone). `user_id` UNIQUE where not null (one donor record per account). |
| **Relationships** | Belongs to `users` (optional); belongs to `persons` (optional); has many `blood_consents` (§6.7); has many `blood_requests` (as a responding donor, via the consent/response linkage — see §6.6). |
| **Soft delete** | Yes — withdrawal from the registry is a soft-delete (the donor disappears from search immediately; the consent/reveal history stays in the audit log and in `blood_consents`). |
| **Sensitive fields** | `phone` (encrypted — **never** in a list response; revealed only through the consent flow, doc 04 §7.3). `name_bn` is visible in search (names are public in the donor directory by design, with consent). |
| **Retention** | Retained while the donor is listed. On withdrawal, soft-deleted and the phone is removed (anonymised) after the retention period for the consent history expires (see §11). |
| **Computed, not stored** | **Availability is computed, not stored.** A donor is available if `is_active = true` AND (`last_donation_date` is null OR `last_donation_date` is more than 90 days ago) — Engineering Plan v1.1 §6, M6. There is no `is_available` column, so no one can hand-edit an "available" flag to bypass the 90-day rule. The computation is a query scope / accessor, and the daily scheduler job (§10.3 of doc 05) exists only if the implementation materialises it. |

### 6.6 `blood_requests`

| Item | Detail |
|---|---|
| **Purpose** | An emergency blood request (M6). The prototype's blood form shows a confirmation and creates **no record** (Audit Findings §3 #19); the real table is the record. |
| **Primary key** | `id` bigint. |
| **Fields** | `request_no` varchar (format `BLD-YYYY-####` — a parallel format to the expatriate `EXP-YYYY-####`, so the two request types are never confused; the format is a blueprint decision, recorded here so it is chosen deliberately); `blood_group` varchar (one of the 8 groups); `units` integer (`1` / `2` / `3` / `4` — the prototype's options were 1/2/3/4+ bags, Audit Findings §2.4; `4` means "4 or more", recorded as `units = 4, units_note = '4+'` where the distinction matters); `units_note` varchar nullable; `hospital_bn` varchar (≥ 3 characters — Audit Findings §7.1); `hospital_en` varchar nullable; `needed_by` timestamp nullable (when the blood is needed); `requester_name_bn` varchar nullable (the requester, where given); `requester_phone` varchar (encrypted; `requester_phone_hash` for lookup); `requester_phone_hash` varchar; `requester_user_id` bigint nullable (FK → `users.id`); `status` varchar default `'submitted'` (`submitted` / `notified` / `responded` / `fulfilled` / `cancelled`); `fulfilled_by_donor_id` bigint nullable (FK → `blood_donors.id` — the donor who gave, once confirmed); `fulfilled_at` timestamp nullable; `created_at`, `updated_at`, `deleted_at`. |
| **Foreign keys** | `requester_user_id` → `users.id` (`ON DELETE SET NULL`); `fulfilled_by_donor_id` → `blood_donors.id` (`ON DELETE SET NULL`). |
| **Indexes** | `request_no` (unique); `blood_group`; `status`; `created_at`; `requester_phone_hash`. |
| **Unique constraints** | `request_no` UNIQUE. |
| **Relationships** | Belongs to `users` (requester, optional); belongs to `blood_donors` (fulfilling donor, optional); has many `blood_consents` (one per donor asked/granted for this request). |
| **Soft delete** | Yes — but a genuine request is never deleted; it ends `fulfilled` or `cancelled`. |
| **Sensitive fields** | `requester_phone` (encrypted); `requester_name_bn` (personal data — visible to Super Admins, the coordinator, and the responding donor; not in a public list). |
| **Retention** | Permanent. On fulfilment, the donor's `last_donation_date` is updated (doc 05 §9.5). |

### 6.7 `blood_consents` [ADDITION vs Plan v1.1]

| Item | Detail |
|---|---|
| **Purpose** | A donor's consent grant (or revocation) for a specific blood request (M6). The plan's catalogue has `blood_requests` but **no consent table** — and the prototype's consent was a requester-side click, not a donor-side act (Audit Findings §3 #19). Without this table, the consent rule (doc 04 §7.3) cannot be enforced or audited. **Reason for the addition:** the audit proves a donor-consent entity is needed, and the plan's §7 has no table for it. |
| **Primary key** | `id` bigint. |
| **Fields** | `blood_request_id` bigint (FK → `blood_requests.id`); `blood_donor_id` bigint (FK → `blood_donors.id`); `status` varchar (`requested` / `granted` / `revoked` / `expired`); `requested_at` timestamp (when the donor was asked); `granted_at` timestamp nullable; `revoked_at` timestamp nullable; `expires_at` timestamp nullable (lapses when the request is fulfilled/cancelled); `revealed_to_requester_at` timestamp nullable (when the number was actually shown — the audit record of the reveal); `revealed_to_user_id` bigint nullable (FK → `users.id` — who saw the number, where the requester has an account); `channel` varchar nullable (`web_push` / `in_app` / `phone` — how the donor was asked); `created_at`, `updated_at`. |
| **Foreign keys** | `blood_request_id` → `blood_requests.id` (`ON DELETE CASCADE`); `blood_donor_id` → `blood_donors.id` (`ON DELETE CASCADE`); `revealed_to_user_id` → `users.id` (`ON DELETE SET NULL`). |
| **Indexes** | (`blood_request_id`, `blood_donor_id`); `status`; `granted_at`. |
| **Unique constraints** | (`blood_request_id`, `blood_donor_id`) UNIQUE — one consent record per donor per request (its `status` moves `requested → granted → revoked/expired`). |
| **Relationships** | Belongs to `blood_requests` and `blood_donors`; belongs to `users` (the reveal recipient). |
| **Soft delete** | No — consent records are history. A revocation is a status change, not a deletion. |
| **Sensitive fields** | The row itself is the record of a phone reveal; it is visible only to Super Admins (and to the donor, for their own consents). |
| **Retention** | Permanent — the consent history is the evidence that a reveal was lawful. |

### 6.8 `service_types` [ADDITION vs Plan v1.1 — Phase 0.1]

| Item | Detail |
|---|---|
| **Purpose** | The expatriate service catalogue (M5): the services a request can ask for. Admin-managed (permission `service_types.manage`); the request stores both the FK and a snapshot of the key/name at submission time, so a later catalogue rename does not rewrite history. **Reason for the addition:** the service list was a hardcoded enum on `service_requests` with no admin-managed home and no snapshot; the catalogue needs a table (Investigator C §3). |
| **Primary key** | `id` bigint. |
| **Fields** | `key` varchar (e.g. `grocery`, `medicine`, `hospital`, `elderly`, `home`, `document`, `general` — the 7 prototype values are the seed candidates, pending Q-22); `name_bn` varchar; `name_en` varchar nullable; `description_bn` text nullable; `is_active` boolean default true; `sort_order` integer default 0; `created_at`, `updated_at`, `deleted_at`. |
| **Foreign keys** | None. |
| **Indexes** | `is_active`; `sort_order`. |
| **Unique constraints** | `key` UNIQUE. |
| **Relationships** | Has many `service_requests`. |
| **Soft delete** | Yes (deactivate instead of deleting a service in use — `service_requests.service_type_id` is `ON DELETE RESTRICT`). |
| **Sensitive fields** | None. |
| **Retention** | Permanent — the catalogue is configuration history. |
| **Seed candidates (pending Q-22)** | `grocery`, `medicine`, `hospital`, `elderly`, `home`, `document`, `general` (the prototype's 7 services). The plan's M5 lists the same set in slightly different words — Q-22 decides the final list. |

---

## 7. Domain F — Finance (4 plan tables)

The finance domain is M8. The rules are the strictest in the platform: ledger entries are immutable, corrections are reversal-only, and entry and approval are separated (doc 04 §6.1, doc 05 §9.4).

### 7.1 `ledger_entries`

| Item | Detail |
|---|---|
| **Purpose** | One row per financial transaction (M8): income, expense, or donation. The prototype's `FINANCE` array (Audit Findings §5.4) has 5 rows for 2026, 4 for 2025, 3 for 2024 — with no dates, payees, receipts, or sub-categories. The real table has all of those. |
| **Primary key** | `id` bigint. |
| **Fields** | `entry_no` varchar (a human-readable sequential number, e.g. `LE-2026-0001` — generated server-side, unique; the format is a blueprint decision); `entry_date` date (the date the transaction happened — not the date it was entered); `kind` varchar (`income` / `expense` / `donation` — the prototype's 3 kinds, Audit Findings §5.4); `category_id` bigint (FK → `finance_categories.id`); `project_id` bigint nullable (FK → `projects.id` — the project account this entry belongs to, if any); `activity_id` bigint nullable (FK → `activities.id` — the annual activity this entry belongs to, if any); `item_bn` varchar (e.g. "সদস্য চাঁদা"); `item_en` varchar nullable; `amount` numeric(12,2) (signed: income/donation positive, expense negative — matching the prototype's convention where expenses are negative, Audit Findings §5.4; the sign is a stored convention, documented here so reports sum correctly); `payee_bn` varchar nullable (who paid / who was paid); `note_bn` text nullable; `voucher_media_id` bigint nullable (FK → `media.id` — the receipt/voucher image); `donor_name_bn` varchar nullable (shown publicly **only with that donor's consent** — Plan v1.1 §6, M8; stored separately from `payee_bn` so the consent rule can be applied to it alone); `donor_name_consented` boolean default false; `status` varchar default `'draft'` (`draft` / `published` / `reversed` / `discarded` — `reversed` when a reversal is approved (F6); `discarded` when a draft is discarded (the discard gap found in Phase 0.1, A §2.3 item 5 — a draft discard now has a status, not just an audit-log line); `approved` is NOT a status — approve IS publish (single step, doc 04 §6.1)); `entered_by` bigint (FK → `users.id`); `approved_by` bigint nullable (FK → `users.id` — **must differ from `entered_by`**, enforced by the service AND by named `CHECK chk_ledger_dual_control (approved_by IS NULL OR approved_by <> entered_by)` (MariaDB enforces CHECKs since 10.2.1), doc 04 §6.1). Named CHECKs (do not rely on auto-generated names): `chk_ledger_amount_nonzero (amount <> 0)`, `chk_ledger_status (status IN ('draft','published','reversed','discarded'))`, `chk_ledger_dual_control`, `chk_ledger_kind (kind IN ('income','expense','donation'))`. `ledger_reversals` carries `chk_reversal_dual_control (approved_by IS NULL OR approved_by <> created_by)`; `approved_at` timestamp nullable; `published_at` timestamp nullable; `rejected_by` bigint nullable (FK → `users.id`); `rejected_at` timestamp nullable; `rejection_reason` text nullable (≥ 10 characters — the F6a reject reason, doc 07 §14.7; a rejected entry stays `draft`); `discarded_by` bigint nullable (FK → `users.id`); `discarded_at` timestamp nullable; `discard_reason` text nullable; `created_at`, `updated_at`. **No `deleted_at`.** |
| **Foreign keys** | `category_id` → `finance_categories.id` (`ON DELETE RESTRICT`); `project_id` → `projects.id` (`ON DELETE SET NULL`); `activity_id` → `activities.id` (`ON DELETE SET NULL`); `voucher_media_id` → `media.id` (`ON DELETE SET NULL`); `entered_by` → `users.id` (`ON DELETE RESTRICT`); `approved_by` → `users.id` (`ON DELETE RESTRICT` — MariaDB 11.8.9: a CHECK may not reference a column whose FK uses `ON DELETE SET NULL` (ERROR 1901), so the dual-control CHECK `chk_ledger_dual_control` and a SET NULL FK cannot coexist; verified 2026-11-14, `tests/ledger-suite/TEST-RESULTS.md` §4 M-2. Users are soft-deleted/anonymised, never hard-deleted (§11), so a hard delete of an approver must fail (1452) rather than null out an approval on a published entry. Fallback if SET NULL is ever insisted on: drop the two dual-control CHECKs and enforce dual control on INSERT with a BEFORE INSERT trigger — T1 already enforces it on UPDATE). |
| **Indexes** | `entry_no` (unique); `entry_date`; `kind`; `category_id`; `project_id`; `status`; `entered_by`. |
| **Unique constraints** | `entry_no` UNIQUE. |
| **Relationships** | Belongs to `finance_categories`, `projects` (optional), `activities` (optional), `media` (voucher); belongs to `users` (enterer, approver); has many `ledger_reversals` (as the original). |
| **Soft delete** | **No.** A ledger entry is never deleted — not soft, not hard. A draft entry that is wrong is discarded only while it is still a draft (status becomes `discarded`, with `discarded_by`/`discarded_at`/`discard_reason`, and the discard is audit-logged); a published entry is corrected by a reversal (§7.2). The absence of `deleted_at` is deliberate and is the strongest statement in this schema: the ledger is append-only. **Permitted transitions (the only ones):** `draft → draft` (field edit, F3a), `draft → published` (approve IS publish, F4), `draft → discarded` (F3b), `published → reversed` (only via an approved reversal, F6 + F4). Every other transition is forbidden. **Enforcement, three layers:** (1) the service issues guarded updates (`UPDATE … WHERE id = ? AND status = 'draft'` / `AND status = 'published'`, 0 affected rows → 409) and checks dual control before writing; (2) the `satanipara_app` database user has `DELETE` revoked on `ledger_entries` (and on `ledger_reversals` and `activity_log`) and holds no DDL privilege — see the privilege matrix in §7.1 "Database users" (new row, E-16); (3) database triggers, created by the migration user: `trg_ledger_entries_bu` (BEFORE UPDATE) rejects all updates to `reversed`/`discarded` rows, accepts on `published` rows **only** the status flip to `reversed` with every other column unchanged except `updated_at`, and on `draft` rows accepts field edits and status to `draft`/`published`/`discarded` only, rejecting changes to `id`/`entry_no`/`entered_by` and requiring a non-null approver ≠ enterer when publishing; `trg_ledger_entries_bd` (BEFORE DELETE) rejects every delete, for every database user including root and the migration user. All triggers raise SQLSTATE 45000. Triggers cannot see the acting application user and cannot fire on `TRUNCATE` — those gaps are closed by the privilege separation and the runbook (see §7.1 "What triggers cannot enforce"). Entry numbers come from the `sequences` table (`SELECT … FOR UPDATE`, no duplicates under concurrency). (Proven on MySQL 8.0.46, Phase 0.1.1 Worker B `TEST-LOG.md`; re-run against MariaDB 11.8.9 at scaffold before claiming MariaDB enforcement — Doc 10 T-LED-14; see 16-MARIADB-ADDENDUM.md.) |
| **Database users** | Four users (canonical grants — see also Doc 08 §3.1, Doc 11 §2.2): `satanipara_app` (the application; `SELECT, INSERT, UPDATE` on `ledger_entries`/`ledger_reversals`, **no `DELETE`**, no DDL); `satanipara_migrate` (deploy pipeline only, holds DDL incl. `CREATE TRIGGER`; never in the app `.env`; its `DELETE` is still blocked by the BEFORE DELETE trigger); `satanipara_backup` (`SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER`, read-only, for `mysqldump`); `satanipara_report` (`SELECT` only on the finance tables, created only when the Finance Auditor role is needed). |
| **What triggers cannot enforce** | The acting application user (a trigger sees only the MariaDB session user, never the Laravel user id — dual control as "who clicked" is enforced by the service + the `approved_by` CHECK); `TRUNCATE TABLE` (DDL, fires no trigger — closed by the app user having no `DROP` privilege); dropping the trigger itself (closed by the app user having no `TRIGGER` privilege, code review on migrations, and the post-deploy drift check). |
| **Sensitive fields** | `payee_bn` and voucher images are admin-only (the public sees aggregates — doc 04 §7.2). `donor_name_bn` is public only when `donor_name_consented = true`. |
| **Retention** | Permanent. The ledger is the organisation's financial record; it is never purged. |

### 7.2 `ledger_reversals`

| Item | Detail |
|---|---|
| **Purpose** | A reversal entry correcting a published ledger entry (M8). The original stays untouched; the reversal is a new entry of equal and opposite amount, linked to the original. When a reversal is approved, the original entry's `status` becomes `reversed` (§7.1). (Plan v1.1 §7 lists `ledger_reversals` as a table; an alternative design is to store reversals as `ledger_entries` rows with a `reverses_entry_id` self-reference. This blueprint keeps the plan's separate table, because a separate table makes "show me all corrections" a trivial query and makes it impossible to confuse a reversal with an ordinary entry in a report. If the build team prefers the self-reference, that is a build-time decision to record — the rule that matters is reversal-only correction, not the table shape.) |
| **Primary key** | `id` bigint. |
| **Fields** | `ledger_entry_id` bigint (FK → `ledger_entries.id` — the original); `reversal_entry_id` bigint (FK → `ledger_entries.id` — the reversal entry itself, which is a full `ledger_entries` row of the opposite amount and the same category/project/activity); `reason_bn` text (why the correction was needed — mandatory); `reason_en` text nullable; `created_by` bigint (FK → `users.id`); `approved_by` bigint nullable (FK → `users.id` — the approver of the reversal, who must differ from the reversal's `created_by`; the creator MAY be the original entry's enterer — the Phase 0 'where possible' wording is deleted, B §3.7.2 scenario 6); `created_at`, `updated_at`. |
| **Foreign keys** | `ledger_entry_id` → `ledger_entries.id` (`ON DELETE RESTRICT`); `reversal_entry_id` → `ledger_entries.id` (`ON DELETE RESTRICT`); `created_by` → `users.id`; `approved_by` → `users.id` (`ON DELETE RESTRICT` — same ERROR 1901 reconciliation as `ledger_entries.approved_by`, see §7.1; fallback: drop `chk_reversal_dual_control` and enforce dual control on INSERT with a BEFORE INSERT trigger). |
| **Indexes** | `ledger_entry_id`; `reversal_entry_id` (unique — one reversal row per reversal entry). |
| **Unique constraints** | `reversal_entry_id` UNIQUE **and `ledger_entry_id` UNIQUE (`uk_one_reversal_per_original`) — one reversal per original, ever.** A second reversal attempt returns 409 (Doc 07 F6). A reversal entry can never itself be reversed: no `ledger_reversals` row may reference a reversal entry as its original. A wrong reversal is corrected by a fresh ordinary ledger entry (new `entry_no`, draft → published with dual control), with a note referencing the erroneous reversal's `entry_no`; that correcting entry is not linked via `ledger_reversals` and changes no status. |
| **Relationships** | Belongs to two `ledger_entries` rows (original and reversal). |
| **Soft delete** | No — a reversal is itself a ledger record. The link row is immutable: no `UPDATE` except the one-time fill of `approved_by` when the reversal entry is approved (enforced by `trg_ledger_reversals_bu`), no `DELETE` ever (`trg_ledger_reversals_bd`), and no second link row for the same original (unique key above). The reversal entry, once published, is immutable like any published entry (§7.1). |
| **Sensitive fields** | As §7.1 (via the linked entries). |
| **Retention** | Permanent. |

### 7.3 `finance_categories`

| Item | Detail |
|---|---|
| **Purpose** | Reference data: the categories a ledger entry belongs to (e.g. member subscriptions, expatriate donations, scholarships, health camps, relief — the prototype's items imply the categories, Audit Findings §5.4, but the prototype stores no category beyond the 3 kinds). |
| **Primary key** | `id` bigint. |
| **Fields** | `name_bn` varchar; `name_en` varchar nullable; `kind` varchar (`income` / `expense` / `donation` — the kinds this category applies to); `slug` varchar; `is_active` boolean default true; `sort_order` integer default 0; `created_at`, `updated_at`. |
| **Foreign keys** | None. |
| **Indexes** | `slug` (unique); `kind`; `is_active`. |
| **Unique constraints** | `slug` UNIQUE. |
| **Relationships** | Has many `ledger_entries`. |
| **Soft delete** | No — retired by `is_active = false` (entries already in the category keep their history). |
| **Sensitive fields** | None. |
| **Retention** | Permanent reference data. |

### 7.4 `projects`

| Item | Detail |
|---|---|
| **Purpose** | Project accounts (M8): per-project budget vs spent vs status. The prototype's Direction D has **no** project-accounts table (Audit Findings §3 #28) — the feature exists only in the editorial alternative's `LEDGER` (4 projects: scholarship ৳125,000/118,500; winter clothing ৳90,000/87,500; medical fund ৳150,000/132,000; humanitarian fund ৳120,000/94,500 — demo figures, not real). The plan's §7 includes `projects`; this table is the plan's table, and the editorial demo figures are **not** seeded. |
| **Primary key** | `id` bigint. |
| **Fields** | `name_bn` varchar; `name_en` varchar nullable; `description_bn` text nullable; `budget` numeric(12,2) (the approved budget); `status` varchar (`ongoing` / `completed` / `paused` / `cancelled`); `starts_on` date nullable; `ends_on` date nullable; `created_by` bigint (FK → `users.id`); `created_at`, `updated_at`, `deleted_at`. |
| **Foreign keys** | `created_by` → `users.id` (`ON DELETE RESTRICT`). |
| **Indexes** | `status`; `starts_on`. |
| **Unique constraints** | None. |
| **Relationships** | Has many `ledger_entries` (the entries charged to the project). |
| **Soft delete** | Yes (a cancelled project is soft-deleted only if it has no entries; a project with entries is closed by `status = cancelled`, not deleted — its entries are history). |
| **Sensitive fields** | None (project totals are public by design — the public finance page shows project totals, Plan v1.1 §6, M8). |
| **Retention** | Permanent. |
| **Computed, not stored** | **Spent is computed, not stored.** The amount spent on a project is the sum of its published `ledger_entries` (expenses, negative) — never a hand-typed `spent` column. The editorial alternative's `spent` figures are a stored value in a demo array; the real system computes them (§9). |

---

### 7.5 `sequences` [DEFINED 2026-11-14 — the 48th application table]

| | |
|---|---|
| **Purpose** | Per-year sequence counters for `EXP-` / `BLD-` / `LE-` numbers (entry numbers, §7.1). Created early (migration order §10 step 1) so every later migration can use it. This table was referenced by Doc 06 §7.1 and §10 step 1 but had no definition anywhere in Doc 06 or `diagrams/ERD.md` and was not in the 47-application-table count — a pre-existing gap (not MariaDB-caused), corrected 2026-11-14; see 16-MARIADB-ADDENDUM.md §3.10. Counts are now **48 application / 50 defined / 58 physical** tables. |
| **Fields** | `id` bigint AUTO_INCREMENT PRIMARY KEY; `scope` varchar(50) NOT NULL (e.g. `LE`, `EXP`, `BLD`); `year` smallint NOT NULL; `next_value` bigint NOT NULL DEFAULT 1; `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP. |
| **Unique constraints** | `UNIQUE (scope, year)` (`uk_sequences_scope_year`) — one counter row per scope per year. |
| **Allocation** | `SELECT … FOR UPDATE` on the (`scope`, `year`) row inside the allocating transaction (no duplicates under concurrency; `SELECT … FOR UPDATE` on InnoDB is identical on MariaDB 11.8.9). Gaps are investigated and never reused (see §9.4). |
| **Tests** | Concurrent allocation (no duplicate numbers) — Doc 10 V-LOCK-01 / Doc 16 §6. |

## 8. Domain G — System (plan tables + framework tables + 2 additions)

The system domain is M9/M10 cross-cutting storage: notifications, audit, settings, contact messages, data-rights requests, and Laravel's framework tables.

### 8.1 `notifications_log`

| Item | Detail |
|---|---|
| **Purpose** | The delivery log for every notification the system sends (M9 — Plan v1.1 §6: "প্রতিটি পাঠানোর লগ থাকবে (কার কাছে, কখন, সফল/ব্যর্থ)" — every send is logged: to whom, when, success/failure). Distinct from Laravel's `notifications` table (the in-app notification records themselves — see §8.6): this table is the **delivery** record. **Two sources of truth, never merged (Phase 0.1, B §3.9):** `notifications` is what the user was told (read state); `notifications_log` is the delivery-attempt record. A failed send is retried at most 3 times with exponential back-off; the retry count is `attempts`. |
| **Primary key** | `id` bigint. |
| **Fields** | `notification_id` varchar (non-null in practice — every log row corresponds to a database notification; nullable only for sends that failed before the notification row was created); `user_id` bigint nullable (FK → `users.id` — the recipient; null where the recipient is not a user, e.g. a role broadcast that failed before resolution); `channel` varchar (`database` / `web_push` / `fcm` / `apns` / `mail`); `title_bn` varchar nullable; `title_en` varchar nullable; `body_bn` text nullable; `event` varchar (the domain event that caused it, e.g. `expatriate.request.submitted`); `related_type` varchar nullable; `related_id` bigint nullable (polymorphic link to the subject — a request, a blood request, a post); `status` varchar (`sent` / `failed` / `pending`); `provider_response` text nullable (the push service's response, for debugging — never containing a token); `attempts` integer default 1; `created_at`, `updated_at`. |
| **Foreign keys** | `user_id` → `users.id` (`ON DELETE SET NULL` — the log survives the user's deletion, anonymised). |
| **Indexes** | `user_id`; `channel`; `event`; `status`; `created_at`; (`related_type`, `related_id`). |
| **Unique constraints** | None. |
| **Relationships** | Belongs to `users` (recipient, optional). |
| **Soft delete** | No — the log is history. |
| **Sensitive fields** | `title_bn`/`body_bn` may contain a request ID or a name; the log is visible only to Super Admins (`notifications.view_log`). |
| **Retention** | Retained for 2 years, then archived (exported to cold storage) — a retention decision recorded here so it is chosen deliberately. The in-app notification records (§8.6) follow their own retention. |

### 8.2 `activity_log`

| Item | Detail |
|---|---|
| **Purpose** | The immutable audit log (M10 — doc 04 §5.7). Every admin action, every status transition, every consent grant/revoke, every phone reveal, every export, every settings change. **Append-only: no update, no delete, no truncate through the application.** |
| **Primary key** | `id` bigint. |
| **Fields** | `actor_id` bigint nullable (FK → `users.id` — null for `system` actions, e.g. the scheduler archiving a notice); `actor_role` varchar nullable (the actor's role **at the time** of the action — roles change, and the log must record what the actor was when they acted); `action` varchar (e.g. `members.approve`, `finance.reports.publish`, `expatriate.requests.advance`, `donors.view_contact`, `roles.assign`); `subject_type` varchar; `subject_id` bigint nullable; `before` JSON nullable (the relevant field values before the change); `after` JSON nullable (after the change); MariaDB stores `JSON` as a `LONGTEXT` alias and adds implicit `CHECK (JSON_VALID(...))` constraints automatically (M-4, verified 2026-11-14) — the drift check must match on the named CHECKs, not on an exact CHECK count (Doc 10). `ip_address` varchar nullable; `user_agent` text nullable; `created_at` (no `updated_at` — a log row is never updated). |
| **Foreign keys** | `actor_id` → `users.id` (`ON DELETE SET NULL` — the log survives the actor's deletion; the `actor_role` and the id remain). |
| **Indexes** | `actor_id`; `action`; (`subject_type`, `subject_id`); `created_at`. |
| **Unique constraints** | None. |
| **Relationships** | Belongs to `users` (actor, optional). |
| **Soft delete** | **No — and no hard delete either.** There is no `deleted_at` and no delete path. The `app` database user has no `DELETE`/`UPDATE` privilege on this table (mandatory, four-user design — ADR-003, doc 04 §5.7; the Phase 0 'where the hosting allows it' hedge is deleted — on MariaDB 11.8.9 it is fully implementable (see 16-MARIADB-ADDENDUM.md)). BEFORE UPDATE/DELETE triggers raise SQLSTATE 45000 as a second layer. An optional hash chain over the rows is a recommendation, not a decision (Phase 0.1, A §2.4). |
| **Sensitive fields** | `before`/`after` must never contain a password, a token, a full phone number in plaintext (store the hash), or file contents. The log writer enforces this by allow-listing the fields it records per action. |
| **Retention** | Permanent. Included in backups. No automatic purge in Phase 1. |

### 8.3 `settings`

| Item | Detail |
|---|---|
| **Purpose** | Key-value site configuration (M10): brand strings, contact details, office hours, policy text, announcement-strip content, the ERT size (3–5), the emergency disclaimer text, feature flags. The prototype re-types policy copy (no charge / 999 / ERT 3–5) as inline HTML in several places (Audit Findings §4.10); the real system stores it once, here. |
| **Primary key** | `id` bigint. |
| **Fields** | `key` varchar (e.g. `site.tagline_bn`, `contact.office_hours_bn`, `policy.no_service_charge_bn`, `emergency.disclaimer_bn`, `ert.size_min`, `ert.size_max`); `value` text (the value — JSON for structured values, plain text otherwise; the `type` column says which); `type` varchar (`string` / `text` / `integer` / `boolean` / `json`); `is_public` boolean default false (whether the setting may be exposed through the public API — e.g. the tagline is public, the backup schedule is not); `updated_by` bigint nullable (FK → `users.id`); `created_at`, `updated_at`. |
| **Foreign keys** | `updated_by` → `users.id` (`ON DELETE SET NULL`). |
| **Indexes** | `key` (unique); `is_public`. |
| **Unique constraints** | `key` UNIQUE. |
| **Relationships** | Belongs to `users` (last updater). |
| **Soft delete** | No — a setting is removed by deleting the row (a governed act, audit-logged). |
| **Sensitive fields** | None — secrets never live in `settings` (they live in environment variables). A code review checks that no secret is added here. |
| **Retention** | Permanent while the setting exists. Changes are audit-logged (the log is the history). |

### 8.4 `contact_messages` [ADDITION vs Plan v1.1]

| Item | Detail |
|---|---|
| **Purpose** | The contact-message inbox (M10/M11). The prototype's contact form shows a confirmation and the message "goes nowhere" (Audit Findings §3 #35). The plan's §7 has no table for contact messages — the inbox is implied by the contact feature but never given a table. **Reason for the addition:** the audit proves a contact-message entity is needed, and the plan's catalogue has no table for it. |
| **Primary key** | `id` bigint. |
| **Fields** | `name_bn` varchar (≥ 2 characters); `phone` varchar (encrypted; `phone_hash` for lookup); `phone_hash` varchar; `message_bn` text (≥ 10 characters); `status` varchar default `'new'` (`new` / `read` / `replied` / `resolved`); `replied_by` bigint nullable (FK → `users.id`); `replied_at` timestamp nullable; `reply_note` text nullable (an internal note on the reply — the reply itself is sent out of band in Phase 1, e.g. by phone, and the note records that it happened); `created_at`, `updated_at`, `deleted_at`. |
| **Foreign keys** | `replied_by` → `users.id` (`ON DELETE SET NULL`). |
| **Indexes** | `status`; `phone_hash`; `created_at`. |
| **Unique constraints** | None. |
| **Relationships** | Belongs to `users` (replier, optional). |
| **Soft delete** | Yes. |
| **Sensitive fields** | `phone` (encrypted); `name_bn` + `message_bn` (personal data — admin-only). |
| **Retention** | Retained for 2 years after resolution, then anonymised (name/phone removed, message kept only if it has organisational value — a decision recorded per message, not a bulk rule). |

### 8.5 `data_requests` [ADDITION vs Plan v1.1]

| Item | Detail |
|---|---|
| **Purpose** | Data-rights requests (M1): a member's request for access to, correction of, or deletion of their own data. The prototype's privacy view promises the right to correct/delete "via office application" with no flow (Audit Findings §3 #37). The plan's §7 has no table for it. **Reason for the addition:** the audit proves a data-rights entity is needed (Audit Findings §9.14), and the privacy promise in the prototype is unenforceable without a record of the request. |
| **Primary key** | `id` bigint. |
| **Fields** | `user_id` bigint nullable (FK → `users.id` — null where the requester has no account, e.g. a databank-only person); `requester_name_bn` varchar; `requester_phone` varchar (encrypted; `requester_phone_hash`); `requester_phone_hash` varchar; `type` varchar (`access` / `correction` / `deletion` / `export`); `details_bn` text nullable (what the requester wants corrected, or what they want to know); `status` varchar default `'new'` (`new` / `in_review` / `completed` / `rejected`); `handled_by` bigint nullable (FK → `users.id`); `handled_at` timestamp nullable; `resolution_note` text nullable; `created_at`, `updated_at`, `deleted_at`. |
| **Foreign keys** | `user_id` → `users.id` (`ON DELETE SET NULL`); `handled_by` → `users.id` (`ON DELETE SET NULL`). |
| **Indexes** | `user_id`; `type`; `status`; `requester_phone_hash`; `created_at`. |
| **Unique constraints** | None. |
| **Relationships** | Belongs to `users` (requester and handler, both optional). |
| **Soft delete** | Yes — but a deletion request that is completed results in the **anonymisation** of the person's records (§11), not in the deletion of this row: the row is the evidence that the request was handled. |
| **Sensitive fields** | `requester_phone` (encrypted); the request itself is admin-only (`data_rights.manage`). |
| **Retention** | Permanent — the handling record is kept even after the person's data is anonymised. |

### 8.6 Framework tables (Laravel — not counted in the application-table count, §1.4)

These tables are created by Laravel's own migrations and packages. They are listed here so the schema is complete; their structure follows the framework, not this document.

| Table | Purpose |
|---|---|
| `personal_access_tokens` | Sanctum tokens (SHA-256 hashed, one per device — doc 05 §8). Created by `php artisan install:api`. |
| `notifications` | Laravel's database-notification records (the in-app notification list — the durable record every other channel delivers). Recipient, title, body, link, read/unread, timestamp. Pruned per the notification retention policy (read notifications older than 1 year are pruned by a scheduled job; unread notifications are never pruned automatically). |
| `jobs` / `failed_jobs` | The database queue (doc 05 §10.1). Standard Laravel structure. |
| `cache` | The database cache store (doc 05 §5.8). Standard Laravel structure. |
| `sessions` | The database session store (doc 05 §5.4 of doc 04). Standard Laravel structure. |
| `password_reset_tokens` | Laravel's password-reset token table. **Note:** in Phase 1 the reset is Super-Admin-mediated via a system-generated temporary password (doc 04 §5.5) — no reset link is sent, so this table is NOT used by the Phase 1 reset flow; it remains in the framework schema for a future self-service flow (Q-04). |
| `migrations` | Laravel's migration tracking. |

---

## 9. Cross-cutting rules

### 9.1 Statistics — computed, not stored

Per Engineering Plan v1.1 §7 and the Decision Sheet: **statistics are computed from data, never hand-typed.** "মোট জনসংখ্যা" (total population), "প্রবাসী সংখ্যা" (expatriate count), member/family counts, and finance totals are queries over `persons`, `households`, `users`, and `ledger_entries` — cached for 15 minutes (or invalidated on write, doc 05 §5.8) and never stored in a column.

- The prototype's Home §02 shows "তথ্য হালনাগাদ হচ্ছে" (information being updated) for member/family and expatriate counts (Audit Findings §2.2) — that honesty placeholder is the correct behaviour when the underlying data is unverified. The real system shows a computed number **only when the underlying data is verified**; until then it shows the same "updating" state. A computed number from unverified data is worse than no number.
- The project "spent" figure is computed (§7.4). Donor availability is computed (§6.5). The finance totals on the public page are computed from published entries (§7.1). No table in this schema has a `total_*`, `count_*`, or `spent` column.
- The monthly finance summary is **computed on read from published entries, with a 15-minute cache** (Phase 0.1 decision on M-08 — no stored snapshot table in Phase 1). **Known limitation:** a later reversal changes the next computed summary — the summary is always 'as of now', not a frozen historical record. A stored-snapshot table remains a future option if the organisation needs frozen monthly figures.

### 9.2 Bilingual content rule

- **Bengali is the primary language and the fallback.** Every user-facing string exists in Bengali. English is provided where the content is translated; where it is not, the API returns the Bengali text (with a flag that it is untranslated) rather than an empty string or a machine translation.
- **Two patterns, used consistently:**
  1. **Translations table** (`post_translations`, §5.3) for long-form content (posts) — one row per locale, unique per (`post_id`, `locale`).
  2. **`_bn` / `_en` column pairs** (`name_bn` / `name_en`, `title_bn` / `title_en`, `body_bn` / `body_en`) for short fields on reference and record tables (persons, institutions, activities, FAQs, finance items). The `_en` column is nullable; the `_bn` column is required.
- **The prototype's approach is not carried forward:** the prototype stores demo entries as BN+EN objects in JS arrays and translates only the UI chrome (Audit Findings §2.3 — "demo data entries stay in their stored language"). The real system stores both languages in the database and serves the requested locale, with Bengali fallback.
- **Search** runs over both languages (the full-text index covers `name_bn` + `name_en` where the table is searchable).
- **The API contract** (doc 05 §5.4) returns a translatable field as an object (`{"bn": "...", "en": "..."}`) or in the requested locale with fallback — fixed per endpoint in the OpenAPI specification.

### 9.3 Consent — first-class columns

Every table holding personal data carries `consent_status` (`pending` / `granted` / `withdrawn`) and `consent_recorded_at`, per the pattern in `households`, `persons`, `institutions`, `blood_donors`, and `media`. The rules:

- **Nothing personal is published without `consent_status = granted`.** A directory entry, a committee photo, a gallery image, a donor listing, a freedom-fighter profile, or a donor's name in finance — all require a recorded grant.
- **Consent withdrawal takes effect immediately** in the read path (the record is hidden from public and members-only views the moment the status flips to `withdrawn`). The historical record of the grant stays in the audit log.
- **Consent is per-purpose, not blanket.** Being listed as a donor (consent to be listed) is different from consenting to reveal your number for a specific blood request (`blood_consents`, §6.7). The columns record the listing consent; the per-request consent is its own table.
- **Consent is recorded with provenance:** who recorded it, when, and how (in person, by phone, in writing). The `consent_note` on `media` (§5.4) is the pattern; the same note-keeping applies where a consent is recorded by an admin on someone's behalf.

### 9.4 Data integrity rules

- **Foreign keys are real database constraints**, not application-level conventions. Every FK in this document is a database FK with an explicit `ON DELETE` action. `RESTRICT` is used where deleting the parent would destroy history (a user who entered a ledger entry, a term with members); `SET NULL` where the reference is informational and the record must survive (a person anonymised but still named on a committee); `CASCADE` where the child has no meaning without the parent (a translation without its post, an update without its request).
- **Check constraints** enforce the small invariants the database can check cheaply: `amount` on `ledger_entries` is non-zero; `units` on `blood_requests` is between 1 and 4; `blood_group` is one of the 8 values; `status` is one of the enum values for the table; `approved_by` differs from `entered_by` on `ledger_entries` (`chk_ledger_dual_control`) and from `created_by` on `ledger_reversals` (`chk_reversal_dual_control`) (enforced by `CHECK` constraints — MariaDB enforces them since 10.2.1; the application enforces them in all cases as well; the check constraint is defence in depth). CHECK constraints are row-local only — status-transition rules live in triggers (§7.1), not in CHECKs.
- **Token/endpoint hash columns are coupled to their values:** `push_subscriptions.endpoint_hash` is a STORED generated column (it cannot drift from `endpoint`); `user_devices.fcm_token_hash` is computed in application code from the plaintext token before encryption, and `CHECK ((fcm_token IS NULL) = (fcm_token_hash IS NULL))` enforces that the hash is `NULL` exactly when the token is. Uniqueness is enforced on the hash columns (`uk_endpoint_hash`, `uk_user_token_hash`), never on the `TEXT` columns (Doc 06 §§2.3–2.4).

- **Transactions** wrap every multi-record change (doc 05 §5.5). The audit-log write is in the same transaction as the action (doc 04 §5.7).
- **No `float`/`double` for money, ever.** `numeric(12,2)` throughout. The application uses a decimal type (not a PHP float) when computing totals.
- **Request IDs and entry numbers are generated in a transaction** (per-year sequence), never random, never client-supplied (doc 05 §9.1, §9.4).
- **The `deleted_at` rule:** a table either has `deleted_at` (soft delete) or it does not, for the reasons stated per table. There is no table where soft delete is "to be decided".

---

## 10. Migration execution order

Migrations run in dependency order — a table is created only after the tables it references exist. The order below is the required order; the migration filenames carry a timestamp prefix that enforces it. **Media comes before organisation** (step 5 before step 6) — the Phase 0 order had organisation before media, which is wrong because organisation tables reference `media` (committee photos, constitution documents).

0. **Framework tables first:** `sessions`, `cache`, `jobs`, `failed_jobs`, `password_reset_tokens`, `personal_access_tokens` (Sanctum), `notifications` (Laravel database notifications).
1. **Counter table:** `sequences` (per-year sequence counters for `EXP-` / `BLD-` / `LE-` numbers — created early so every later migration can use it; allocation is `SELECT … FOR UPDATE`, §7.1).
2. **Identity:** `users` → `roles`, `permissions`, `model_has_roles`, `role_has_permissions`, `model_has_permissions` (Spatie) → `user_devices`, `push_subscriptions`.
3. **Reference data:** `professions`, `countries`, `finance_categories`, `service_types`.
4. **Community:** `households` → `persons` (references `households`, `professions`, `countries`) → `person_family_links` → `institutions`, `landmarks`, `freedom_fighters`, `infrastructure_facilities`.
5. **Media (before the tables that reference it):** `media` → `media_links`.
6. **Organisation:** `committee_terms` → `committee_members`, `advisors`, `past_leaders`, `achievements`, `constitution_versions`.
7. **Activities & Content:** `activities` → `posts`, `post_translations` → `events` → `gallery_albums` → `faqs` → `annual_reports` (references `media`; `activities.annual_report_id` is added by a later migration, after `annual_reports` exists).
8. **Services:** `service_requests` (references `users`, `countries`, `service_types`) → `service_request_updates`, `service_request_expenses` (references `media`) → `emergency_team_members` → `blood_donors` → `blood_requests` → `blood_consents`.
9. **Finance:** `projects` → `ledger_entries` (references `finance_categories`, `projects`, `activities`, `media`, `users`) → `ledger_reversals`.
10. **System:** `settings`, `contact_messages`, `data_requests`, `notifications_log`, `activity_log`.
11. **Self-references added last:** `households.head_person_id` (references `persons`, created after both exist), `service_request_expenses.reverses_expense_id`, `media.poster_media_id`, `constitution_versions.supersedes_version_id` — each added by a follow-up migration, not in the table's initial creation, so the order has no cycle.
12. **Seeders run after all migrations:** permission seeder (doc 04 §4) → role seeder (Phase 1 roles only) → reference-data seeders (professions, countries, finance categories, service catalogue) → settings seeder (defaults) → bootstrap Super Admin (doc 04 §3.1, by console command, not by seeder). **No demo data is seeded** (§13).

**Production `migrate:rollback` is staging-only.** On production the pre-deploy backup is the only rollback — DDL is not transactional on MariaDB 11.8.9 (ADR-003 as superseded by 16-MARIADB-ADDENDUM.md, Doc 11 §4.3). A migration that fails stops the deploy.

---

## 11. Privacy and consent (data-protection design)

### 11.1 Encrypted fields

The following columns are stored **encrypted at rest** (Laravel's `encrypted` cast or equivalent — the mechanism is decided at build time; the requirement is that a database dump does not reveal them):

- `users.phone`, `persons.phone`, `blood_donors.phone`, `service_requests.applicant_phone` / `beneficiary_phone`, `blood_requests.requester_phone`, `contact_messages.phone`, `data_requests.requester_phone`, `emergency_team_members.phone`, `institutions.phone`, `persons.date_of_birth`, `user_devices.fcm_token`, `push_subscriptions.auth_token`.

### 11.2 `phone_hash` — lookup without decryption

For every encrypted phone column there is a companion `phone_hash` column holding an **HMAC-SHA256** of the normalised phone number (digits only, with the country code normalised — the normalisation rule is fixed at build time and documented in the runbook), keyed by an application secret that is **not** the database password and is **not** stored in the database.

- The hash lets the system find a user/donor/request by phone (login, duplicate check, donor lookup) without decrypting every row.
- The hash is one-way: it cannot be reversed into a phone number without the HMAC key and a brute-force over the phone-number space (which the key makes infeasible for an attacker who has only the database).
- The HMAC key is an environment secret, rotated per the operations runbook. Rotating it requires re-hashing (a maintenance migration) — the rotation procedure is documented before the first rotation is needed.

### 11.2A `endpoint_hash` / `fcm_token_hash` — lookup without decryption (SHA-256, unkeyed)

For the two `TEXT` values that carry a uniqueness invariant (`push_subscriptions.endpoint`, `user_devices.fcm_token`), uniqueness is enforced on a `BINARY(32)` hash column, never on the `TEXT` column (MariaDB 11.8.9 InnoDB rejects a `UNIQUE` index on `TEXT` without a prefix length, error 1170; a prefix unique is not a substitute — Doc 06 §§2.3–2.4).

- **Algorithm:** SHA-256, unkeyed — `UNHEX(SHA2(value, 256))` in SQL, `hash('sha256', $value, true)` in PHP. Stored raw binary, 32 bytes. No HMAC key: endpoints and FCM tokens are high-entropy random bearer values, not enumerable like phone numbers, so a key adds management and rotation burden with no benefit. (Contrast `phone_hash` above, which is HMAC precisely because phone numbers are enumerable.)
- **Input bytes:** the exact value as submitted, UTF-8, with **no normalisation** — no trimming, no case-folding, no URL canonicalisation. Endpoints and tokens are case-sensitive opaque strings.
- **`endpoint_hash`:** STORED generated column (`GENERATED ALWAYS AS (UNHEX(SHA2(endpoint, 256))) STORED`, plus named `CHECK (endpoint_hash IS NOT NULL)` — `NOT NULL` is not permitted on a generated column on MariaDB), unique (`uk_endpoint_hash`). The endpoint is stored in plaintext, so the database can hash it; the generated column cannot drift from the stored value.
- **`fcm_token_hash`:** computed in **application code** from the plaintext token **before** encryption, stored in the same write; unique per user (`uk_user_token_hash` on (`user_id`, `fcm_token_hash`)). A generated column is impossible here: the database only ever sees ciphertext, and Laravel's encryption is non-deterministic (random IV), so a hash of the ciphertext would differ on every write of the same token. Computing the hash in PHP also keeps the plaintext token out of SQL text and MariaDB logs. The single place that sets the hash is the model mutator / service method that receives the plaintext token; `CHECK ((fcm_token IS NULL) = (fcm_token_hash IS NULL))` is the database backstop.
- **Verification:** a hash match is never treated as a value match on its own. For `endpoint`, lookup is `WHERE endpoint_hash = UNHEX(SHA2(?, 256)) AND endpoint = ?`. For `fcm_token`, lookup is by (`user_id`, `fcm_token_hash`), then the candidate row's `fcm_token` is decrypted and compared with `hash_equals()` in application code. On a 1062, re-read by hash and compare full values: equal → true duplicate (upsert per §§2.3–2.4); different → genuine hash collision → reject with 500, critical alert, never overwrite.
- **Sensitivity:** both hash columns are lookup keys for bearer credentials. Never return them in an API response, never write them to logs, never include them in audit-log `before`/`after` payloads.

### 11.3 No PII in public APIs

- No public endpoint returns a phone number, a date of birth, an address, or a family detail. The public donor search returns names, groups, areas, and availability — phones masked (`01••• •••421` as in the prototype's display). The public tracking view returns only the Tier-S allowlist (Doc 04 §7.4 — `request_no`, `status`, `service`, the 4-node tracking timeline with sanitised notes, itemised expense lines + total, constant service charge 0; no applicant/beneficiary name or phone, no details, no vouchers, no author identities).
- API Resources (§5.4 of doc 05) are the enforcement point: a field is present in a response only when the caller's permissions allow it.
- Error messages never leak PII (a "not found" for a tracking lookup does not say whether the ID exists in a different form; a login failure does not say whether the number is registered — doc 04 §5.3).

### 11.4 Consent withdrawal — effect

| Withdrawal | Effect |
|---|---|
| Donor withdraws listing consent | `blood_donors.consent_status = withdrawn`, `is_active = false`, soft-deleted from search immediately. Past `blood_consents` rows stay (history). |
| Donor revokes a per-request consent | `blood_consents.status = revoked`, the number is hidden from the requester immediately. The reveal history stays in the audit log. |
| Member withdraws directory consent | The `persons`/`households` row's `visibility` drops to `private` and `consent_status = withdrawn`; the entry disappears from the public and members-only directory immediately. |
| Person in a photo withdraws photo consent | `media.consent_status = withdrawn`; the image is removed from public view immediately and deleted from storage (the `media` row is soft-deleted; the consent record stays in the audit log). |
| Member requests account deletion | `data_requests` row (type `deletion`) → 30-day grace → **anonymisation** (§11.5). |

### 11.5 Anonymisation (not deletion) where records must survive

Where a person has finance or request records, the account/person is **anonymised**, not deleted: the name is replaced by a token (e.g. "Deleted member #<id>"), the phone/date of birth/address are removed (set to null, and the encrypted values destroyed), **`phone_hash` is destroyed** (the lookup key is gone, so the phone cannot be re-derived or re-linked), the photo is deleted, and the row stays so that the ledger, the request history, and the audit log keep their referential integrity. Ledger `payee_bn` is anonymised by default on a deletion request (AO-11 open — the organisation decides whether payee names survive anonymisation). Anonymisation is itself audit-logged (who requested it, who performed it, when). The 30-day grace period (doc 05 §9.2) gives the member a chance to cancel the request.

---

## 12. Financial integrity (summary — the rules, in one place)

- **Ledger entries are immutable.** No `deleted_at` on `ledger_entries` (§7.1). A published entry is never edited and never deleted, **except for the single `published → reversed` status flip performed by the reversal service when a reversal is approved** (changing only `status`, plus `updated_at`). Corrections are reversal entries only (§7.2).
- **Amounts are `numeric(12,2)`**, never float (§1.1). Income/donation positive, expense negative (the stored convention, §7.1).
- **Entry numbers are sequential and unique** (`entry_no`, §7.1 — allocated from the `sequences` table under `SELECT … FOR UPDATE`). Gaps are investigated and never reused: a gap means a draft was discarded (the discard sets status `discarded` and is audit-logged) **or** a transaction that allocated a number rolled back. A discarded row keeps its `entry_no` forever.
- **Every entry has a category, a date, and an enterer.** A draft entry has no approver; a published entry has an approver who differs from the enterer (doc 04 §6.1).
- **Vouchers:** a voucher image (`voucher_media_id`) is attached where a receipt exists. Vouchers live on the non-public disk (doc 05 §11.1).
- **Monthly summary:** computed on read from published entries (§9.1), 15-minute cache; no stored snapshot in Phase 1. The public sees the summary, not the entries.
- **Project spent is computed** (§7.4), never stored.
- **Donor names in finance appear only with consent** (`donor_name_consented`, §7.1).

## 13. Backup and recovery strategy

Per the Decision Sheet and Research Notes §7.5; the operational detail lives in the runbook, the design is recorded here.

| Item | Standard |
|---|---|
| **Tool** | `spatie/laravel-backup` v10 (resolve at install time; do not quote a patch number). |
| **What is backed up** | The database (`mysqldump` — the binary must be on `PATH` in the app image, or `dump.dump_binary_path` set per connection) **and** the uploads (`storage/app/public`). Excluded: `storage/framework` (cache/views/sessions). **Never an unencrypted `.env`.** |
| **Schedule** | Nightly `backup:run` (via the scheduler — doc 05 §10.3). |
| **Destinations** | **Local + one off-server S3-compatible disk.** Local-only is not a backup (the package's own warning — Research Notes §7.5). |
| **Cleanup** | `backup:clean` on schedule, per the retention policy below. |
| **Retention** | **Three-tier (Phase 0.1, B §3.11): daily backups 30 days / weekly backups 12 weeks / monthly backups 12 months.** The runbook states the mechanism (`backup:clean` rules per tier). Audit log: permanent (no purge). Donor-phone destruction period: open (AO-12). |
| **Restore test** | **Monthly automated restore check + quarterly full restore rehearsal, mandatory, documented.** This single cadence satisfies both sources: the Decision Sheet's monthly restore test (the backup package's recommendation) is met by the monthly automated check, and the task brief / Plan v1.1 quarterly test is met by the quarterly full rehearsal. The full rehearsal restores to a staging environment, verified by booting the application and checking that logins, the request queue, and the finance summary render. The test is evidenced (a dated runbook entry) — an untested backup is assumed broken. The operations runbook records the adopted cadence. |
| **RPO / RTO** | **RPO 24 hours / RTO 4 hours** (per Engineering Plan v1.1, cited in the Decision Sheet). Nightly backups give an RPO of up to 24 hours; the RTO of 4 hours is the target for restoring the application + database from the off-server backup onto a fresh VPS. |
| **Encryption** | Off-server backups are encrypted at rest (server-side encryption on the S3-compatible disk, or an encrypted archive — the mechanism is decided at build time and recorded in the runbook). Backup archives contain encrypted phone columns (already encrypted in the database) and hashed passwords — but they also contain the application key material if `.env` is included, which is why `.env` is **never** in a backup. |
| **What is not backed up** | The demo prototype (it is a static file in a public GitHub repo), the Git repository itself (GitHub is the backup for code), and the `storage/framework` cache. |

## 14. Demo-to-production migration strategy

**Demo data is never migrated.** This is a standing rule (Decision Sheet) and it is restated here because it is the easiest rule to break by accident.

| Item | Rule |
|---|---|
| **What "demo data" means** | Everything in the prototype: the 10 directory entries, the 6 donors, the 6 activities, the 2 news / 2 notices / 2 events / 1 job, the 8 gallery images, the 5 committee / 3 advisory / 2 former-leader demo names, the 5 constitution summaries, the 5 FAQs, the 3 years of finance rows (2024–2026 demo figures), the seeded request `EXP-2026-1052` (৳970), the second request `EXP-2026-1047` (editorial/v1 only), and the two demo accounts with plaintext passwords (Audit Findings §5). All of it is labelled নমুনা/Demo in the source. None of it is real. |
| **What is migrated** | **Nothing.** The production database starts empty (apart from reference data and the permission/role seed). |
| **How real data gets in** | **Fresh seed + client-supplied real data via templates.** The build team provides import templates (spreadsheets with the exact columns for members, directory entries, committee, donors, finance opening balances) and the client (or the Super Admin, once appointed) fills them with real, verified, consented data. The import is run by the Super Admin through the admin panel or by a console import command, validated row by row, and audit-logged. A row that fails validation is rejected with a reason — it is never silently fixed or silently skipped. |
| **Consent re-collection** | **Every person's consent is re-collected.** Demo data has no consent record (Audit Findings §5.6 — no image has a consent record; the directory entries are invented names). Real data is published only with a recorded grant (§9.3). For the donor registry, each donor confirms their listing and their phone. For photos, each identifiable person confirms. For committee members, each person confirms their listing. There is no bulk "the client said it is fine" consent — consent is per person, per purpose, recorded. |
| **Finance opening balances** | The opening ledger is built from the client's real, audited records — entered as `ledger_entries` with `entry_date` set to the real transaction dates, and approved through the normal draft → approval path (§7.1). The demo finance rows (2024–2026, Audit Findings §5.4) are **not** used as opening balances. If the client has no audited records for a year, that year is shown as "তথ্য হালনাগাদ হচ্ছে" (updating) — never filled with demo figures. |
| **Request IDs** | The per-year sequence starts at `EXP-2026-0001` (or the first number the client agrees). The demo IDs (`EXP-2026-1052`, `EXP-2026-1047`) are **not** reserved or reused — reusing a demo ID would let someone who saw the prototype track a real request. |
| **Accounts** | The two demo accounts are never created. The first real account is the bootstrap Super Admin (doc 04 §3.1). Members register (or are created by the Super Admin) and are approved — the approval queue starts empty. |
| **Statistics** | The home-page statistics start in the "তথ্য হালনাগাদ হচ্ছে" state (as the prototype does — Audit Findings §2.2) and show computed numbers only once the underlying data is real and verified (§9.1). |
| **What happens to the prototype** | The prototype stays in its public GitHub repo as the design reference. It is not deleted, not deployed as the production site, and not connected to the backend. The production site is the Next.js build (doc 05 §6.2). |

## 15. Changes from Engineering Plan v1.1

This document **agrees** with Engineering Plan v1.1 §7 on: the 39-table catalogue in 7 domains (Identity 6, Community 8, Organisation 5, Activities & Content 7, Services 6, Finance 4, System 3); the universal rules (`id` bigint, `created_at`/`updated_at`, soft delete on important records, never hard-delete money/request tables); statistics computed not stored; money never edited/deleted (reversal only); RPO 24h / RTO 4h; the state machines (§9 of the plan, doc 05 §9); and the per-module table groupings.

It **differs or extends** the plan in the following places:

1. **8 added tables** (flagged `[ADDITION]` in the text): `blood_consents` (§6.7 — the plan has no donor-consent table, and the audit proves one is needed), `contact_messages` (§8.4 — the plan has no contact-inbox table), `faqs` (§5.8 — the plan has no FAQ table), `annual_reports` (§5.8 — the plan has no annual-report table), `infrastructure_facilities` (§3.8 — the plan's `landmarks` covers named places, not facilities with a condition), `data_requests` (§8.5 — the plan has no data-rights table), `service_types` (§6.8 — Phase 0.1, the admin-managed service catalogue), `constitution_versions` (§4.6 — Phase 0.1, the versioned constitution). Total: 39 + 8 + 1 (`sequences`, §7.5) = **48 application tables** (50 defined incl. 2 Spatie pivots; 58 physical incl. 8 framework tables — §1.4).
2. **Database:** the plan says PostgreSQL 16. The blueprint said **MySQL 8.4 LTS + InnoDB (Phase 0.1, Confirmed — Fahim; ADR-003)**; that decision is superseded — the blueprint now says **MariaDB 11.8.9 + InnoDB (2026-11-14, Confirmed — Fahim; see 16-MARIADB-ADDENDUM.md)**. The Phase 0 "current major at scaffold time" wording is superseded.
3. **Framework tables listed explicitly** (§8.6): Sanctum tokens, sessions, cache, jobs, password-reset tokens, Laravel notifications — the plan's "System (2+)" mentions jobs/failed_jobs/cache in passing; this document lists the full set so the schema is complete.
4. **Restore-test frequency — resolved.** The Decision Sheet records the backup package's recommendation of a monthly restore test; the task brief for this blueprint specifies a **quarterly** restore test. The blueprint resolves this as one cadence (§13): a **monthly automated restore check** plus a **quarterly full restore rehearsal** (mandatory, documented) — the monthly check satisfies the Decision Sheet, the quarterly rehearsal satisfies the task brief and Plan v1.1. Resolved as a blueprint cadence; the runbook adoption is DB-3 (§16).
5. **Prototype corrections recorded in the schema:** integer statuses → string enums (§1.2); random Request IDs → per-year sequence (§6.1); no category on activities → `category` stored (§5.1); no consent table → `blood_consents` (§6.7); requester-click consent → donor-side consent (§6.7, doc 04 §7.3); demo finance `.txt` → published `annual_reports` (§5.8); no contact inbox → `contact_messages` (§8.4); no data-rights flow → `data_requests` (§8.5); no infrastructure → `infrastructure_facilities` (§3.8); flat demo directory → `households` + `persons` (§3.1–§3.2).
6. **Encrypted phones + `phone_hash`** (§11.1–§11.2): the plan does not specify phone storage. This document requires encryption at rest with HMAC lookup, because phone numbers are the platform's primary identifier and its most sensitive field.
7. **Phase 0.1 integrity designs (Investigator A §2):** one-current-term and single-holder-role invariants preserved with STORED generated columns + unique indexes (§§4.1–4.2, §4.6); finance immutability enforced by four database users, `REVOKE DELETE`, and BEFORE UPDATE/DELETE triggers (§7.1); audit log append-only by privilege + trigger (§8.2); ledger status enum gains `reversed` and `discarded` (§7.1); tracking secret replaces Request-ID-as-bearer-token (§6.1, doc 04 §7.4).

## 16. Open questions

| # | Question | Status |
|---|---|---|
| D11 | Expatriate wizard is 3 steps in the build, 4 in Design System §7.1. No schema impact (the wizard's step count does not change the `service_requests` table). | Under review — UX only |
| DB-1 | `events` vs `posts` (category `event`) — merge or keep separate (§5.6)? | **Decided (Phase 0.1, M-26): keep separate.** E2 creates both rows in one transaction; the rule is that an event and its announcement post are two rows, created together. |
| DB-2 | `ledger_reversals` as a separate table vs a self-referencing `reverses_entry_id` on `ledger_entries` (§7.2)? The rule (reversal-only) is fixed; the table shape is a build-time decision. | Under review — decide at build |
| DB-3 | Restore-test frequency: quarterly (task brief) vs monthly (Decision Sheet / package recommendation). | **Open — the cadence is decided** (monthly automated restore check + quarterly full restore rehearsal, §13); the runbook adoption is the remaining step. The item stays open until the runbook records the adopted cadence. |
| DB-4 | Exact HMAC normalisation rule for phone numbers (country-code handling) and the key-rotation procedure — §11.2. | Under review — decide at build |
| DB-5 | The 90-day donor rule is computed (§6.5). If the implementation materialises it, the daily job exists; if computed on read, it does not. Decide at build; the rule is fixed either way. | Under review — decide at build |
| DB-6 | `infrastructure_facilities` is defined but not built in Phase 1 unless the client supplies facility data (§3.8). Confirm with the client whether facility data exists. | Under review — client decision |

---

*End of doc 06. Companion: `diagrams/ERD.md` (relationships in Mermaid), `04-USER-ROLES-PERMISSIONS.md` (RBAC), `05-BACKEND-ARCHITECTURE.md` (architecture, state machines).*
