# ADR-008 — Queue driver (database first)

| | |
|---|---|
| Status | **Recommended** |
| Date | 2026-11-14 |
| Sources | Research Notes §7.1 (laravel.com/docs/13.x/queues — primary for the driver list and defaults); Decision Sheet; Engineering Plan v1.1 (Redis queue/cache + Horizon — timing superseded, see below) |

## Context

The system needs a queue for work that should not block a web request: sending notifications (new expatriate request → helpers), expatriate-request emails (when an email provider exists), nightly cleanup, backup jobs, and Scout indexing (if queued indexing is enabled). Laravel ships `sync`, `database`, `redis`, `beanstalkd`, `sqs`, and `null` drivers, and the shipped `config/queue.php` defaults `QUEUE_CONNECTION` to `database`. The expected volume is a few jobs an hour to a few thousand a day — far below the database driver's comfort zone. The choice is which driver to start on and when to move.

## Options considered

1. **Database driver** (jobs in a `jobs`/`failed_jobs` table; `FOR UPDATE SKIP LOCKED` where supported — MariaDB ≥ 10.6 qualifies, so MariaDB 11.8.9 qualifies).
2. **Redis driver** (with Horizon v5 for monitoring, dashboards, and auto-scaling).
3. **SQS** (fully managed, durable, per-operation cost) — rejected: only sensible if already on AWS, which this project is not.
4. **Sync driver** — rejected for production: jobs run inline in the web request, so a slow notification blocks the response. Acceptable for local development and tests only.

## Advantages

- **Database:** one less service to run, monitor, and back up. Jobs participate in database transactions (a job dispatched inside a rolled-back transaction never exists — with Redis, `after_commit` handling is needed). Jobs are inspectable in SQL. Latency is bounded by the worker `--sleep` interval, which is fine at this volume.
- **Redis:** lower latency, higher throughput (hundreds of jobs/second), blocking pops, Horizon dashboards and auto-scaling.
- **Both:** Laravel's queue routing by class (`Queue::route(...)`, Laravel 13) lets the default queue/connection be defined centrally either way.

## Disadvantages

- **Database:** higher latency than Redis (worker polling interval), lower throughput ceiling, no Horizon (Horizon is Redis-only). If job volume grows past ~10/second sustained, or queue latency becomes user-visible, the driver is the wrong one.
- **Redis:** a separately managed service with memory sizing; a Redis used as a cache with an `allkeys-lru` eviction policy must never share an instance/DB with queues (eviction can silently delete queued jobs — use `noeviction` for queue Redis or separate instances). Horizon is another component to run and secure.
- **Either:** unique jobs and `WithoutOverlapping` need a cache driver that supports atomic locks (memcached, redis, dynamodb, database, file, array all support them — Research Notes §7.1).

## Security implications

- No material difference for this workload. The queue must not be reachable from the internet in either case; the worker runs under Supervisor/systemd-equivalent supervision, never `queue:listen` in production (Research Notes §7.1).
- Failed jobs are visible and retryable; a failed job that contains sensitive data (e.g. a notification payload with a phone number) must be handled under the same logging rules as everything else (Doc 08 §9.2 — no full phone numbers in logs).

## Scalability implications

- The database driver is comfortable to a few thousand jobs a day. The upgrade triggers are defined in advance: (a) queue latency becomes user-visible, (b) Horizon monitoring is wanted, or (c) job volume grows past ~10/second sustained. When any trigger fires, the move is to Redis + Horizon v5, and cache moves to Redis at the same time (ADR-009).
- Queue routing by class (Laravel 13) means the routing decision is centralised, so the move does not require touching every dispatch site.

## Maintenance implications

- Database driver: the `jobs` table is part of the normal database backup; no additional service to patch or monitor beyond the worker process itself.
- Redis + Horizon (when adopted): another service to run, monitor, and back up (its data is ephemeral by design, but its configuration is not), plus Horizon's dashboard to secure (it must not be publicly accessible).

## Final recommendation

**Start on the database queue driver** (Laravel's shipped default). Run the worker under Supervisor/systemd, never `queue:listen` in production. Move to Redis + Horizon v5 only when one of the three triggers above fires.

## Reason for selection

Engineering Plan v1.1 specified Redis + Horizon from day one; the timing is superseded (per the Decision Sheet's divergence rule). The expected queue volume (notifications, nightly cleanup, backup jobs) is orders of magnitude below the database driver's comfort zone, and the database driver removes a whole service — with its monitoring, memory sizing, and eviction hazards — from the day-one operational surface. The upgrade path is defined and cheap, so starting simple does not trap the project.
