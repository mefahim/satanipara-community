# ADR-007 — Media storage (local first, S3-compatible later)

| | |
|---|---|
| Status | **Recommended** |
| Date | 2026-11-14 |
| Sources | Research Notes §7.4; Decision Sheet; Engineering Plan v1.1 (S3-compatible media storage — timing superseded, see below); Doc 07 §11 |

## Context

The platform stores media: activity photos, gallery images, committee photos, receipt photos, proof-of-delivery photos, and annual-report PDFs. The prototype embedded 21 base64 JPEGs totalling ~13 MB in a single HTML file (Audit Findings §1.1) — that approach is not carried forward; media must be files, referenced by URL. The choice is where those files live to start, and how the system moves if it outgrows that choice.

## Options considered

1. **Local `public` disk on the VPS, via Laravel's Storage facade** (to start), with private files on a non-public local disk served through controllers + signed URLs.
2. **S3-compatible object storage from day one** (Cloudflare R2, MinIO, DigitalOcean Spaces, Wasabi, Backblaze B2) via the `s3` driver with a custom endpoint.
3. **Local disk with hard-coded `public_path()` writes** — rejected: it makes the storage location unchangeable without touching every call site.
4. **Base64-embedding media in pages or in the database** — rejected: it is what the prototype did, and it is why the prototype file is 13 MB.

## Advantages

- **Local first:** zero cost, zero configuration, files live on the VPS and are backed up with the application (Doc 11 §7). Adequate for the expected volume (tens to low hundreds of images, plus PDFs).
- **Facade abstraction:** all file access goes through Laravel's `Storage` facade, so the disk can be flipped to S3-compatible later without touching call sites (`store('x', 'public')` works identically on either disk).
- **S3-compatible later:** durable (11-nines class), off-server by construction, CDN-friendly — available when volume, CDN, or off-server durability requires it, without a rewrite.
- **Private files are private on either disk:** they live on a non-public disk and are served through a controller that checks the policy, then returns a signed, time-limited URL (Doc 07 §11).

## Disadvantages

- **Local:** a second server or a CDN migration later means moving files; the VPS disk is a single point of failure for media (mitigated by the backup, which includes uploads — Doc 11 §7).
- **S3-compatible from day one:** per-GB + per-request cost, credentials to manage, and public-vs-signed URL decisions for member photos and documents from the start — cost and complexity the project does not yet need.
- **Either:** the team must be disciplined about never writing to `public_path()` directly; a single hard-coded write creates a migration problem later. Code review enforces this.

## Security implications

- Uploaded files are validated by content (MIME sniffing), scanned with ClamAV, never executed, and stored under server-generated filenames (Doc 08 §3.6). This applies identically on either disk.
- Private files (member photos, receipts, proof-of-delivery photos, donor-related documents) must never be publicly listable. On local disk that means a non-public disk + controller; on S3-compatible storage it means private buckets + signed URLs. The discipline is the same; the mechanism differs.
- Public files are served by direct URL with cache headers; signed URLs for private files expire (15–60 minutes, Doc 08 §6.3) and are never logged.

## Scalability implications

- Local storage scales to the VPS disk (80 GB to start, Doc 11 §2.1). Media volume is the most likely reason to outgrow it.
- The trigger to move to S3-compatible storage is defined in advance: (a) media volume outgrows comfortable VPS disk, (b) a CDN is wanted, or (c) off-server durability is required before backups are proven. When any trigger fires, the move is a configuration change (disk + endpoint), not a code change.

## Maintenance implications

- One abstraction (the Storage facade) to maintain. The backup includes the uploads directory, so media is covered by the same backup/restore discipline as the database (Doc 11 §7, §7.3).
- Image handling: the backend stores the original and generates the display sizes it needs (thumbnail, standard, wide). EXIF data is stripped from published images (Doc 08 §3.6).

## Final recommendation

**Start on the local `public` disk via the Storage facade (never hard-coded `public_path()` writes); private files on a non-public local disk served through controllers + signed URLs. Move to S3-compatible storage when one of the three triggers above fires.**

## Reason for selection

Engineering Plan v1.1 specified S3-compatible storage; the timing is superseded (per the Decision Sheet's divergence rule: the plan's versions and day-one choices are updated by the research). S3-compatible storage is the right destination, but not the right starting point: it adds cost, credentials, and operational surface for a volume the VPS handles comfortably, and the facade makes the later move cheap. Starting local with the discipline to keep the abstraction clean buys simplicity now without closing the durable-storage door later.
