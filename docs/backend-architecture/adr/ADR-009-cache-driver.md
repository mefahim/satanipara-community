# ADR-009 — Cache driver (database first)

| | |
|---|---|
| Status | **Recommended** |
| Date | 2026-11-14 |
| Sources | Research Notes §7.2; Decision Sheet; Engineering Plan v1.1 (Redis cache — timing superseded, see below) |

## Context

The application needs a cache for framework data (configuration, routes, compiled views), permission caching (Spatie), rate-limit state, and application-level caching of expensive public reads. Laravel's cache stores include `array` (tests only), `file`, `database`, `memcached`, `redis`, and `dynamodb`. The shipped default cache store in recent Laravel skeletons is `database`. The choice is which store to start on — with one hard constraint that shapes it: **Redis and Memcached support cache tags; the database and file drivers do not** (documented Laravel limitation).

## Options considered

1. **Database cache** (to start).
2. **Redis cache** (from day one, or when Redis is adopted for queues).
3. **File cache** — considered and rejected as the primary store: zero setup, but single-server only, slower, and no tags.
4. **Memcached** — considered and rejected: fast and simple, but no tag support, volatile, and an older ecosystem than Redis for this stack.

## Advantages

- **Database:** zero new services; survives multi-server; inspectable in SQL; matches the queue choice (ADR-008); fine at this scale.
- **Redis:** in-memory speed, cache tags, atomic locks, shared across servers, rate limiting. The natural home for the cache once Redis exists for any reason.
- **File:** zero setup — but its limitations (below) rule it out as the primary store.

## Disadvantages

- **Database:** slowest of the options; **no cache-tag support** — tag-dependent code written against Redis will break on the database driver. This is the central risk of this ADR and it is managed by rule, not by hope (see below).
- **Redis:** a separately managed service with memory sizing; a Redis used as a cache with an `allkeys-lru` eviction policy must never share an instance/DB with queues (eviction can silently delete queued jobs — use `noeviction` for queue Redis or separate instances).
- **File:** single-server only, no tags, slower than Redis, and cache files on disk are an operational nuisance.
- **Memcached:** no tag support, volatile (a restart empties it), and no reason to prefer it over Redis in this stack.

## Security implications

- No material difference for this workload. The cache must never contain secrets, tokens, or full phone numbers; cached data is treated as non-sensitive by construction (if a value is sensitive, it is not cached, or it is cached encrypted — to be decided per value, not assumed).
- Cache keys use explicit prefixes (`CACHE_PREFIX`, `REDIS_PREFIX` — Laravel 13 defaults use hyphenated suffixes; set them explicitly to retain predictable behaviour, Research Notes §1).

## Scalability implications

- The database cache is adequate at this scale. The move to Redis is triggered by any of: Redis being adopted for queues/Horizon (ADR-008), tag-based caching being needed, or cache latency becoming measurable in request times.
- **The tag rule (binding):** no tag-dependent code is written unless Redis is adopted. If permission caching (Spatie) or any tag-based caching is adopted, prefer Redis from the start of that work, because switching cache drivers later invalidates cached data only (safe) but tag-dependent code written against Redis will break on database/file. This rule is enforced in code review.

## Maintenance implications

- Database cache: one less service; cache contents are in the database backup (which is harmless — cached data is regenerable — but the backup should exclude or tolerate the cache tables if they grow large; to be confirmed at scaffold time).
- Redis (when adopted): the cache moves to Redis at the same time as the queue (ADR-008), and **sessions stay on `database`** (per Research Notes §7.2) unless a deliberate decision moves them.

## Final recommendation

**Start on the database cache driver** (zero new services; matches the queue choice), with the binding rule that **no tag-dependent code is written unless Redis is adopted**. If Redis is added for any reason (queues/Horizon/Reverb), move the cache to Redis at the same time and keep sessions on `database`.

## Reason for selection

Engineering Plan v1.1 specified Redis cache from day one; the timing is superseded (per the Decision Sheet's divergence rule). At this scale the database cache is sufficient, and it removes a service from the day-one surface. The risk — tag-dependent code breaking on the database driver — is real but is controlled by an explicit, review-enforced rule rather than by paying for Redis before it is needed.
