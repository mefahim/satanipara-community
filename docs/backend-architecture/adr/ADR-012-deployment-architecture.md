# ADR-012 — Deployment architecture (single VPS, Docker, GitHub Actions)

| | |
|---|---|
| Status | **Recommended** — pending hosting/domain confirmation |
| Date | 2026-11-14 |
| Sources | Research Notes §7 (infrastructure); Decision Sheet; Engineering Plan v1.1 (Docker, GitHub Actions CI/CD, single VPS 4 vCPU/8 GB RAM/80 GB SSD, Ubuntu 24.04 LTS, Let's Encrypt, Cloudflare free tier — agreed); Doc 11 (Deployment & Operations) |

## Context

The platform starts as a small community system (a few thousand users) on infrastructure the organisation can afford and the team can operate. The deployment architecture must support: a Laravel API, a Filament admin panel, a Next.js public website, a PostgreSQL database, a queue worker and scheduler, nightly backups, and a staging environment that is a production copy. No infrastructure exists yet — no server has been provisioned and no domain has been confirmed — so this ADR is Recommended, not Confirmed.

## Options considered

1. **Single VPS, Docker Compose, GitHub Actions** (app/worker/scheduler/PostgreSQL/Redis-when-adopted/Nginx; Ubuntu 24.04 LTS; 4 vCPU/8 GB RAM/80 GB SSD to start).
2. **Managed platform (PaaS)** — e.g. a Laravel hosting platform or a generic PaaS. Less operational work, but recurring cost, less control, and a dependency on a provider the organisation has not chosen.
3. **Shared hosting (cPanel)** — cheapest, but no Docker, no queue worker supervision, often no PostgreSQL (see ADR-003), and no CI/CD story. Rejected for the primary deployment; it remains relevant only as the fallback that would force the MySQL decision in ADR-003.
4. **Multi-server / Kubernetes from day one** — rejected: operational complexity wildly disproportionate to the workload.

## Advantages

- **One server, one bill, one operational surface.** The team operates a single VPS; the organisation pays for a single VPS.
- **Docker Compose gives reproducibility:** the same image runs as `app`, `worker`, and `scheduler`, so a bug cannot exist in one role and not the others; staging runs the same images as production (Doc 11 §1).
- **GitHub Actions gives a real pipeline:** gates on every pull request, automatic staging deploys, manual-approval production deploys with a pre-deploy backup (Doc 11 §4).
- **Let's Encrypt + Cloudflare free tier** give TLS and basic DDoS protection at no licence cost.
- **Upgrade path is clear:** if the VPS is outgrown, the database can move to a managed service and the application tier can scale horizontally (the API is stateless — ADR-006) without an architecture change.

## Disadvantages

- **Single point of failure:** one VPS means one host. If it fails, the system is down until it is rebuilt from the backup (RTO 4h, Doc 11 §6.2). That is accepted at this scale and is mitigated by the off-server backup and the documented rebuild procedure — not by buying redundancy the budget does not support.
- **The team operates the server:** OS patching, firewall, Docker, TLS renewal, and monitoring are the team's responsibility. A PaaS would remove some of that; the cost is control and money.
- **VPS access has been intermittent** in this project's history (the workspace's standing notes record repeated SSH resets and a period when the VPS-hosted subdomains were unreachable). Deploys must not depend on a single fragile access route; the documented fallback (a self-contained script run by Fahim on the VPS) exists for that reason.
- **The Next.js website's hosting is undecided** (same VPS vs separate hosting — Doc 11 §11 item 1). This ADR does not decide it.

## Security implications

- SSH by key only, password login disabled, root login disabled; firewall allows only 80/443 and the SSH port from authorised sources; the database port is never exposed (Doc 08 §11, Doc 11 §2).
- Deploys happen only through the pipeline from the organisation's GitHub repository; nobody edits code on the server (Doc 08 §11).
- `APP_DEBUG=false` in production, Telescope disabled, `.env` readable only by the application user (Doc 08 §4, §11).
- If Cloudflare is used, the trusted-proxy configuration must be set correctly so the real client IP reaches the application for rate limiting (Doc 11 §3).

## Scalability implications

- The starting size (4 vCPU / 8 GB RAM / 80 GB SSD, per Engineering Plan v1.1) is a starting size, reviewed at each phase against the load test (Doc 10 §8). Vertical scaling (a larger VPS) is the first step; horizontal scaling is available later because the API is stateless.
- Redis is included in the Compose file commented out, not running, until ADR-008/ADR-009's triggers fire.

## Maintenance implications

- Ubuntu 24.04 LTS with automatic security updates for OS packages; Docker images rebuilt on deploy; the runbook (Doc 11 §10) documents the setup so a new developer can rebuild the server.
- The pipeline is the maintenance story: every change goes through pull-request gates, staging, and an approved production deploy. There is no "quick fix on the server".

## Final recommendation

**Single VPS (4 vCPU / 8 GB RAM / 80 GB SSD to start, Ubuntu 24.04 LTS), Docker Compose (app/worker/scheduler/PostgreSQL/Nginx, Redis only when adopted), GitHub Actions CI/CD (gates → staging auto-deploy → manual-approval production with pre-deploy backup), Let's Encrypt with auto-renewal, Cloudflare free tier as an optional layer.** Status is Recommended until the hosting account and the organisation's domain are confirmed.

## Reason for selection

It is the architecture Engineering Plan v1.1 specified, it matches the workload and the budget, it gives a reproducible staging/production pair and a real CI/CD pipeline, and it keeps a clear upgrade path. A PaaS would cost more for control the project does not yet need; shared hosting cannot run this stack properly; multi-server is unjustifiable at this scale. The single point of failure is accepted explicitly, with the RTO/RPO and the restore rehearsal as the mitigation.
