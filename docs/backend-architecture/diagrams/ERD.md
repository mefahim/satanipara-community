# Entity Relationship Diagram (ERD)

| | |
|---|---|
| **Document** | Satanipara Community — Phase 0 Backend Blueprint, diagrams/ERD.md |
| **Status** | Planned — not yet implemented. |
| **Sources** | `06-DATABASE-DESIGN.md` (authoritative table definitions); Decision Sheet; Audit Findings; Engineering Plan v1.1 §7 |
| **Rule** | Table names below are exactly those in `06-DATABASE-DESIGN.md`. If a name here differs from doc 06, doc 06 governs and the discrepancy must be reported to the coordinator. |

---

## 1. How to read this diagram

- The diagram is a Mermaid `erDiagram`. Each box is a table; the lines are foreign-key relationships. Cardinality notation: `||--o{` = one-to-many, `||--||` = one-to-one, `}o--o{` = many-to-many.
- **Tables are grouped by domain** (Identity, Community, Organisation, Activities & Content, Services, Finance, System) matching doc 06 §§2–8. The Mermaid diagram itself is one diagram — the grouping is by the section headings and the relationship guide in §3, because Mermaid `erDiagram` has no subgraphs.
- **Only the key columns are shown** in each box (primary key, foreign keys, and the one or two columns that define the row's meaning). The full column lists are in doc 06.
- **Polymorphic links** (`media_links`, `model_has_roles`, `notifications_log.related_*`, `activity_log.subject_*`) cannot be drawn as ordinary foreign keys, because the target table varies per row. They are shown as a dashed relationship to the most common target and explained in §3.
- **Framework tables** (`personal_access_tokens`, `notifications`, `jobs`, `failed_jobs`, `cache`, `sessions`, `password_reset_tokens`, `migrations`) are listed in §1 / §3.7 but not drawn in full — they are Laravel's tables, and their relationships are the framework's, not the application's.
- **Soft delete:** every table marked "soft delete: yes" in doc 06 carries `deleted_at`. It is omitted from the boxes below for readability — its presence is governed by doc 06, not by this diagram.

---

## 2. Mermaid diagram

```mermaid
erDiagram
    %% ============ Domain A — Identity (M1) ============
    users {
        bigint id PK
        varchar phone_hash UK
        varchar password
        varchar status
        bigint approved_by FK
        timestamp locked_until
    }
    roles {
        bigint id PK
        varchar name UK
        varchar guard_name
    }
    permissions {
        bigint id PK
        varchar name UK
        varchar guard_name
    }
    model_has_roles {
        bigint role_id FK
        varchar model_type
        bigint model_id
    }
    role_has_permissions {
        bigint permission_id FK
        bigint role_id FK
    }
    model_has_permissions {
        bigint permission_id FK
        varchar model_type
        bigint model_id
    }
    user_devices {
        bigint id PK
        bigint user_id FK
        varchar platform
        text fcm_token
    }
    push_subscriptions {
        bigint id PK
        bigint user_id FK
        text endpoint UK
        text auth_token
    }

    %% ============ Domain B — Community (M2) ============
    households {
        bigint id PK
        varchar area
        bigint head_person_id FK
        varchar visibility
        varchar consent_status
    }
    persons {
        bigint id PK
        bigint user_id FK
        bigint household_id FK
        varchar name_bn
        bigint profession_id FK
        bigint expatriate_country_id FK
        varchar phone_hash UK
        varchar visibility
        varchar consent_status
    }
    professions {
        bigint id PK
        varchar name_bn
        varchar slug UK
    }
    countries {
        bigint id PK
        varchar name_en
        varchar code UK
    }
    institutions {
        bigint id PK
        varchar name_bn
        varchar type
        varchar area
        varchar visibility
    }
    landmarks {
        bigint id PK
        varchar name_bn
        varchar type
        varchar area
    }
    freedom_fighters {
        bigint id PK
        bigint person_id FK_UK
        boolean is_published
    }
    person_family_links {
        bigint id PK
        bigint person_id FK
        bigint related_person_id FK
        varchar relationship
    }
    infrastructure_facilities {
        bigint id PK
        varchar name_bn
        varchar type
        varchar status
        varchar visibility
    }

    %% ============ Domain C — Organisation (M3) ============
    committee_terms {
        bigint id PK
        varchar name_bn
        date starts_on
        date ends_on
        boolean is_current
    }
    constitution_versions {
        bigint id PK
        varchar version UK
        varchar title_bn
        date effective_from
        boolean is_current
        bigint supersedes_version_id FK
        bigint approved_by FK
        bigint document_media_id FK
    }
    committee_members {
        bigint id PK
        bigint committee_term_id FK
        bigint person_id FK
        varchar role_key
        boolean is_published
    }
    advisors {
        bigint id PK
        bigint person_id FK
        varchar name_bn
        boolean is_published
    }
    past_leaders {
        bigint id PK
        bigint person_id FK
        varchar name_bn
        varchar role_key
        int term_start_year
        int term_end_year
    }
    achievements {
        bigint id PK
        int year
        varchar title_bn
        boolean is_verified
        boolean is_published
    }

    %% ============ Domain D — Activities & Content (M4/M7) ============
    activities {
        bigint id PK
        int year
        varchar category
        varchar title_bn
        varchar status
        bigint annual_report_id FK
        bigint created_by FK
    }
    posts {
        bigint id PK
        varchar category
        varchar slug UK
        varchar status
        boolean is_urgent
        timestamp publish_at
        timestamp expires_at
        boolean verified
        bigint author_id FK
        bigint published_by FK
    }
    post_translations {
        bigint id PK
        bigint post_id FK
        varchar locale
        varchar title
    }
    media {
        bigint id PK
        varchar disk
        varchar path UK
        varchar mime_type
        json variants
        varchar consent_status
        bigint uploaded_by FK
    }
    media_links {
        bigint id PK
        bigint media_id FK
        varchar linkable_type
        bigint linkable_id
        varchar role
    }
    events {
        bigint id PK
        varchar title_bn
        timestamp starts_at
        varchar status
        bigint post_id FK
    }
    gallery_albums {
        bigint id PK
        varchar title_bn
        int year
        bigint cover_media_id FK
        boolean is_published
    }
    faqs {
        bigint id PK
        text question_bn
        text answer_bn
        int sort_order
        boolean is_published
    }
    annual_reports {
        bigint id PK
        int year UK
        varchar title_bn
        bigint file_media_id FK
        boolean is_audited
        boolean is_published
    }

    %% ============ Domain E — Services (M5/M6) ============
    service_types {
        bigint id PK
        varchar key UK
        varchar name_bn
        boolean is_active
        integer sort_order
    }
    service_requests {
        bigint id PK
        varchar request_no UK
        bigint service_type_id FK
        varchar service_key
        varchar service_name_bn
        varchar status
        bigint applicant_user_id FK
        bigint applicant_country_id FK
        bigint assigned_helper_id FK
        boolean no_expense_declaration
    }
    service_request_updates {
        bigint id PK
        bigint service_request_id FK
        bigint author_id FK
        varchar status_from
        varchar status_to
        boolean is_visible_to_applicant
    }
    service_request_expenses {
        bigint id PK
        bigint service_request_id FK
        varchar kind
        decimal amount
        bigint voucher_media_id FK
        bigint recorded_by FK
        bigint reverses_expense_id FK
    }
    emergency_team_members {
        bigint id PK
        bigint user_id FK
        varchar name_bn
        varchar role_in_team
        boolean is_on_call
    }
    blood_donors {
        bigint id PK
        bigint user_id FK
        varchar name_bn
        varchar blood_group
        varchar area
        varchar phone_hash UK
        date last_donation_date
        varchar consent_status
    }
    blood_requests {
        bigint id PK
        varchar request_no UK
        varchar blood_group
        int units
        varchar status
        bigint requester_user_id FK
        bigint fulfilled_by_donor_id FK
    }
    blood_consents {
        bigint id PK
        bigint blood_request_id FK
        bigint blood_donor_id FK
        varchar status
        timestamp granted_at
        timestamp revoked_at
    }

    %% ============ Domain F — Finance (M8) ============
    ledger_entries {
        bigint id PK
        varchar entry_no UK
        date entry_date
        varchar kind
        bigint category_id FK
        bigint project_id FK
        bigint activity_id FK
        decimal amount
        varchar status
        bigint entered_by FK
        bigint approved_by FK
    }
    ledger_reversals {
        bigint id PK
        bigint ledger_entry_id FK
        bigint reversal_entry_id FK_UK
        bigint created_by FK
    }
    finance_categories {
        bigint id PK
        varchar name_bn
        varchar kind
        varchar slug UK
    }
    projects {
        bigint id PK
        varchar name_bn
        decimal budget
        varchar status
    }

    %% ============ Domain G — System (M9/M10) ============
    notifications_log {
        bigint id PK
        bigint user_id FK
        varchar channel
        varchar event
        varchar status
        varchar related_type
        bigint related_id
    }
    activity_log {
        bigint id PK
        bigint actor_id FK
        varchar actor_role
        varchar action
        varchar subject_type
        bigint subject_id
    }
    settings {
        bigint id PK
        varchar key UK
        text value
        boolean is_public
    }
    contact_messages {
        bigint id PK
        varchar name_bn
        varchar phone_hash
        varchar status
        bigint replied_by FK
    }
    data_requests {
        bigint id PK
        bigint user_id FK
        varchar type
        varchar status
        bigint handled_by FK
    }

    %% ============ Relationships — Identity ============
    users ||--o{ user_devices : has
    users ||--o{ push_subscriptions : has
    users ||--o{ users : approves
    roles ||--o{ model_has_roles : assigned_via
    permissions ||--o{ role_has_permissions : granted_via
    permissions ||--o{ model_has_permissions : granted_directly
    roles ||--o{ role_has_permissions : holds

    %% ============ Relationships — Community ============
    households ||--o{ persons : contains
    persons ||--o| households : heads
    users ||--o| persons : has_profile
    professions ||--o{ persons : classifies
    countries ||--o{ persons : expatriate_in
    persons ||--o| freedom_fighters : honoured_as
    persons ||--o{ person_family_links : related_to
    persons ||--o{ person_family_links : related_from

    %% ============ Relationships — Organisation ============
    committee_terms ||--o{ committee_members : has
    persons ||--o{ committee_members : serves_as
    persons ||--o{ advisors : advises_as
    persons ||--o{ past_leaders : led_as
    media ||--o{ committee_members : photo_of
    media ||--o{ advisors : photo_of
    media ||--o{ past_leaders : photo_of
    users ||--o{ constitution_versions : approves
    media ||--o| constitution_versions : document_of
    constitution_versions ||--o| constitution_versions : supersedes

    %% ============ Relationships — Activities & Content ============
    users ||--o{ activities : creates
    annual_reports ||--o{ activities : covers
    posts ||--o{ post_translations : translated_as
    users ||--o{ posts : authors
    users ||--o{ posts : publishes
    posts ||--o| events : announced_by
    media ||--o{ media_links : used_in
    media ||--o| gallery_albums : covers
    media ||--o| annual_reports : file_of
    users ||--o{ media : uploads

    %% ============ Relationships — Services ============
    users ||--o{ service_requests : applies_as
    users ||--o{ service_requests : assigned_helper
    countries ||--o{ service_requests : applicant_country
    service_types ||--o{ service_requests : catalogues
    service_requests ||--o{ service_request_updates : has
    users ||--o{ service_request_updates : writes
    service_requests ||--o{ service_request_expenses : has
    media ||--o{ service_request_expenses : voucher_for
    service_request_expenses ||--o| service_request_expenses : reverses
    users ||--o{ emergency_team_members : serves_on
    users ||--o| blood_donors : registered_as
    blood_requests ||--o{ blood_consents : asks
    blood_donors ||--o{ blood_consents : grants
    users ||--o{ blood_requests : requests
    blood_donors ||--o{ blood_requests : fulfils

    %% ============ Relationships — Finance ============
    finance_categories ||--o{ ledger_entries : categorises
    projects ||--o{ ledger_entries : charges
    activities ||--o{ ledger_entries : funds
    media ||--o{ ledger_entries : voucher_for
    users ||--o{ ledger_entries : enters
    users ||--o{ ledger_entries : approves
    ledger_entries ||--o{ ledger_reversals : corrected_by
    ledger_entries ||--o| ledger_reversals : reversal_of
    users ||--o{ projects : creates

    %% ============ Relationships — System ============
    users ||--o{ notifications_log : receives
    users ||--o{ activity_log : acts_in
    users ||--o{ contact_messages : replies_to
    users ||--o{ data_requests : requests_as
    users ||--o{ data_requests : handles
    users ||--o{ settings : updates
```

---

## 3. Relationship guide

One paragraph per major relationship, with cardinalities and delete behaviours. "Delete behaviour" states what the foreign key does (`CASCADE`, `SET NULL`, `RESTRICT`, or "no FK — polymorphic").

### 3.1 Identity

- **Users ↔ roles (many-to-many, via `model_has_roles`).** A user holds roles; a role is held by many users. Phase 1 policy is one role per user (doc 04 §3.3), but the schema supports many. Deleting a role removes its assignments (Spatie cascade); deleting a user removes their assignments. The role/permission rows themselves are never soft-deleted (doc 06 §2.2).
- **Roles ↔ permissions (many-to-many, via `role_has_permissions`).** A role holds many permissions; a permission belongs to many roles. This is the table the Role–Permission Matrix (`diagrams/RBAC-MATRIX.md`) is a picture of. Deleting a permission removes it from all roles; deleting a role removes its permission links.
- **Users → user_devices (one-to-many).** A user has many devices (one per login device, each with an FCM token). Delete behaviour: `CASCADE` — deleting a user deletes their devices. Devices are ephemeral rows, never soft-deleted.
- **Users → push_subscriptions (one-to-many).** A user has many browser push subscriptions (one per browser). Delete behaviour: `CASCADE`. A subscription is deleted when it expires or the push service returns 410 Gone.
- **Users → users, self-reference (`approved_by`).** A Super Admin approves a Member; the approver is recorded. Delete behaviour: `SET NULL` — the approval record survives even if the approving admin's account is later removed.

### 3.2 Community

- **Households → persons (one-to-many).** A household contains many persons; a person belongs to at most one household. Delete behaviour: `SET NULL` on `persons.household_id` — deleting a household does not delete its people (they may move or the household record may be wrong). The household head (`households.head_person_id`) is a one-to-one-ish reference back to `persons`: `SET NULL` if the head's person record is deleted.
- **Users ↔ persons (one-to-one, optional).** A user has at most one person record (their databank profile); a person may have no account. Delete behaviour: `SET NULL` on `persons.user_id` — the databank record survives the account's deletion (anonymised per doc 06 §11.5).
- **Professions / countries → persons (one-to-many).** A profession classifies many persons; a country is the expatriate home of many persons. Delete behaviour: `SET NULL` — retiring a profession or country never deletes people.
- **Persons → freedom_fighters (one-to-one).** A person has at most one freedom-fighter profile. Delete behaviour: `CASCADE` — the profile has no meaning without the person. Publication additionally requires `is_published` and a consent grant.
- **Persons ↔ persons, via `person_family_links` (many-to-many, self-referencing).** A family link joins two person rows with a relationship (`spouse`, `parent`, `child`, `sibling`, `other`). Delete behaviour: `CASCADE` on both ends — the link dies with either person. Visibility follows the more restrictive of the two persons' visibility.
- **Institutions, landmarks, infrastructure_facilities (standalone).** These three have no foreign keys to each other or to persons. They are reference/catalogue tables: institutions (schools, mosques, clinics) and landmarks (named places) and facilities (built assets with a condition) are independent records, each with its own visibility and consent. Each may have many `media_links` (photos). Delete behaviour: soft delete; media links follow the owner.

### 3.3 Organisation

- **Committee_terms → committee_members (one-to-many).** A term has many members; a member belongs to one term. Delete behaviour: `RESTRICT` on the term — a term with members cannot be deleted, because terms are history. A member row references a person optionally (`person_id`, `SET NULL`) and carries a denormalised `name_bn`, so a historical member without a databank record still renders.
- **Persons → advisors / past_leaders (one-to-many, optional).** An advisor or past leader may link to a databank person or stand alone by name. Delete behaviour: `SET NULL` — the listing survives the person record's anonymisation. Past leaders carry `term_start_year` / `term_end_year` (nullable — unknown is recorded as unknown, never guessed) and a `term_note_bn` where the term is under verification.
- **Constitution_versions (one current, versioned).** A new version supersedes the old; history is kept (retention: permanent). At most one current version (`uk_one_current_constitution`, same generated-column pattern as `committee_terms`). A version is approved by a Super Admin (`approved_by`, `SET NULL`) and may carry its signed PDF/scan as a `media` row (`document_media_id`, `SET NULL`).
- **Achievements (standalone).** Milestones for the heritage timeline. Only one verified milestone exists today (the 1999 founding). A milestone is published only when `is_verified = true`. Delete behaviour: soft delete; an unverified milestone is never published, and a published milestone that proves wrong is unpublished with a correction note, not deleted.

### 3.4 Activities & Content

- **Activities (standalone, with optional links).** An activity belongs to a year and a category, is created by a user (`created_by`, `RESTRICT` — the creator is part of the record), and may link to an `annual_reports` row (`annual_report_id`, `SET NULL`). Its photos/video come through `media_links`. Delete behaviour: soft delete; activities are the annual record and are archived by year, never hard-deleted.
- **Posts → post_translations (one-to-many).** A post has one translation per locale (`bn`, `en`), unique per (`post_id`, `locale`). Delete behaviour: `CASCADE` — translations die with the post. The post row holds language-neutral fields (category, status, dates, flags); the translations hold title/body/excerpt.
- **Users → posts (two relationships).** `author_id` (who wrote it, `RESTRICT`) and `published_by` (who published it, `SET NULL`) are separate columns, so the author/publisher separation (doc 04 §6.3) is visible in the data when the Content Editor role exists.
- **Posts ↔ events (one-to-one, optional).** An event may have an announcement post (`events.post_id`, `SET NULL`). An event is a dated occasion with a time and venue; the post is the announcement with a publish lifecycle. (Open question DB-1 in doc 06: whether to merge them — the relationship is drawn as it stands in doc 06.)
- **Media → media_links (one-to-many, polymorphic).** A media file is used in many places; a usage links a media row to any record via (`linkable_type`, `linkable_id`) plus a `role` (`cover`, `gallery`, `voucher`, `photo`, `poster`). There is **no foreign key** on `linkable_id` (polymorphic) — the application enforces the link, and deleting an owner deletes its links. The media row itself is deleted only when no link references it (or by explicit media deletion, which removes the file from storage after the retention rule in doc 06 §5.4).
- **Gallery_albums → media (via `media_links`, plus a cover).** An album groups images; its cover is a direct `cover_media_id` (`SET NULL`). An album is publishable only when every image in it has consent (`granted` or `not_applicable`) — enforced by the publish service, not by a flag.
- **Annual_reports → media (one-to-one, the file).** A report's PDF is a `media` row (`file_media_id`, `RESTRICT` — a published report's file cannot be deleted). One report per year (`year` UNIQUE); a revised report replaces the file on the same row, audit-logged.

### 3.5 Services

- **Service_types → service_requests (one-to-many).** The service catalogue (admin-managed, permission `service_types.manage`). A request stores both the FK (`service_type_id`, `RESTRICT` — deactivate instead of deleting a service in use) and a snapshot of the key/name at submission (`service_key`, `service_name_bn`), so a later catalogue rename does not rewrite history. Seed candidates (7, pending Q-22): grocery, medicine, hospital, elderly, home, document, general.
- **Users → service_requests (two relationships).** `applicant_user_id` (who applied — nullable, because requests can be submitted without an account; `SET NULL` on user deletion, with the request anonymised) and `assigned_helper_id` (which helper owns it; `SET NULL` if the helper's account is removed). The public identifier is `request_no` (`EXP-YYYY-####`, UNIQUE), never the bigint `id`.
- **Service_requests → service_request_updates (one-to-many).** A request has many updates; each update records its author, the status transition it accompanied (`status_from` → `status_to`, nullable for a plain note), and whether the applicant may see it (`is_visible_to_applicant`). Delete behaviour: `CASCADE` on the request, but updates are **never deleted individually** — an erroneous update is corrected by a new update.
- **Service_requests → service_request_expenses (one-to-many).** A request has many itemised expense lines (product cost + transport, `numeric(12,2)`). A wrong line is corrected by a **reversal expense line** — the self-reference `reverses_expense_id` (nullable FK to the same table). Delete behaviour: `CASCADE` on the request; expense lines are never deleted individually.
- **Users → emergency_team_members (one-to-many, optional).** One user may serve on the ERT across multiple terms; the roster is a list, not a single seat. An ERT member may be a platform user or a volunteer reached by phone (`user_id` nullable, `SET NULL`). The team is 3–5 people by policy (not by a database constraint).
- **Users ↔ blood_donors (one-to-one, optional).** A user may have one donor record; a donor may have no account. `phone_hash` is UNIQUE where not null. Availability is **computed** (90-day rule from `last_donation_date`), never stored — there is no `is_available` column to hand-edit.
- **Blood_requests → blood_consents (one-to-many).** A blood request asks many donors; each donor has one consent row per request (`blood_request_id`, `blood_donor_id` UNIQUE together), whose status moves `requested → granted → revoked/expired`. The row records `granted_at`, `revoked_at`, and `revealed_to_requester_at` — the audit record of the phone reveal.
- **Blood_donors → blood_requests (fulfilment).** `blood_requests.fulfilled_by_donor_id` (`SET NULL`) records who gave, once confirmed; fulfilment updates the donor's `last_donation_date`, which drives the 90-day availability computation.

### 3.6 Finance

- **Finance_categories / projects / activities → ledger_entries (one-to-many).** An entry belongs to one category (`RESTRICT` — a category with entries cannot be deleted), optionally to one project (`SET NULL`) and optionally to one activity (`SET NULL`). Its voucher is a `media` row (`SET NULL`). Delete behaviour: **there is no delete** — `ledger_entries` has no `deleted_at` (doc 06 §7.1). A draft that is wrong is discarded only while still a draft (audit-logged); a published entry is corrected by a reversal.
- **Users → ledger_entries (two relationships).** `entered_by` (`RESTRICT`) and `approved_by` (`SET NULL`). The service enforces `entered_by ≠ approved_by` (doc 04 §6.1) — the separation of duties is an application rule, and the two columns are what make it auditable.
- **Ledger_entries ↔ ledger_reversals (one-to-many, via two FKs).** A reversal row links an original entry (`ledger_entry_id`) to its reversal entry (`reversal_entry_id`, UNIQUE — one reversal row per reversal entry). The reversal entry is itself a full `ledger_entries` row of equal and opposite amount. Both FKs are `RESTRICT`.
- **Projects (standalone).** A project has a budget (`numeric(12,2)`) and a status. **Spent is computed** (the sum of its published expense entries), never stored — there is no `spent` column.

### 3.7 System

- **Users → notifications_log (one-to-many, optional).** A delivery-log row records a send to a user (or to a role broadcast, where `user_id` is null). Delete behaviour: `SET NULL` — the log survives the user's deletion, anonymised. Retention is 2 years, then archival (doc 06 §8.1).
- **Users → activity_log (one-to-many, optional).** An audit row records an actor (`actor_id`, `SET NULL`) and the actor's role **at the time** (`actor_role` — roles change, the log must not). The subject is polymorphic (`subject_type`, `subject_id`) — **no FK**, by design, because the subject may be any table. The table is **append-only**: no `updated_at`, no `deleted_at`, no delete path, and the application database user has no `DELETE`/`UPDATE` privilege on it where the hosting allows it.
- **Users → contact_messages / data_requests / settings.** A contact message is replied to by a user (`replied_by`, `SET NULL`); a data-rights request is made by a user (optional, `SET NULL`) and handled by a user (`handled_by`, `SET NULL`); a setting records its last updater (`updated_by`, `SET NULL`). In all three cases the record survives the user's removal.
- **Framework tables** (not drawn): `personal_access_tokens` belongs to `users` (Sanctum, `CASCADE`); `notifications` (Laravel database notifications) belongs to a notifiable (polymorphic — users in Phase 1); `jobs` / `failed_jobs` are standalone; `cache` and `sessions` are key-value stores with no application FKs; `password_reset_tokens` is keyed by email/phone per Laravel's structure.

---

## 4. Changes from Engineering Plan v1.1

This diagram follows Engineering Plan v1.1 §7 (39 tables named, 7 domains — the plan text says 38, corrected Phase 0.1) and adds the 8 tables doc 06 flags as `[ADDITION]`: `blood_consents`, `contact_messages`, `faqs`, `annual_reports`, `infrastructure_facilities`, `data_requests`, `service_types`, `constitution_versions` — 47 application tables in total (49 defined incl. the 2 Spatie pivots, 57 physical incl. the 8 Laravel framework tables). It also draws the Spatie pivots (`role_has_permissions`, `model_has_permissions`) that the plan's §7 lists only in part, and lists (but does not draw) the Laravel framework tables. Where this diagram and doc 06 disagree, doc 06 governs.

---

*End of diagrams/ERD.md. Companion: `06-DATABASE-DESIGN.md` (authoritative definitions), `diagrams/RBAC-MATRIX.md` (roles and permissions).*
