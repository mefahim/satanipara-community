# ADR-002 — PHP version (8.4 / 8.5)

| | |
|---|---|
| Status | **Confirmed** |
| Date | 2026-11-14 |
| Sources | Research Notes §2 (php.net/supported-versions.php — primary, checked 2026-11-14); Decision Sheet; Laravel 13 requirements (PHP 8.3–8.5, Research Notes §1) |

## Context

Laravel 13 requires PHP ≥ 8.3 and supports up to 8.5. The project must choose a target PHP branch for development and production. PHP branches receive 2 years of active support then 2 years of security-only support. PHP 8.2 reaches end of life on 31 Dec 2026 — weeks after this blueprint was written — and PHP 8.6 was not yet generally available (GA planned 19 Nov 2026) and is outside Laravel 13's published PHP range.

## Options considered

1. **PHP 8.4** (active support to 31 Dec 2026; security to 31 Dec 2028). The conservative choice.
2. **PHP 8.5** (active support to 31 Dec 2027; security to 31 Dec 2029). The longest runway; the current stable branch at the time of writing.
3. **PHP 8.3** (security-only; security to 31 Dec 2027). The floor — acceptable as a minimum, poor as a target.
4. **PHP 8.2** — rejected outright: end of life 31 Dec 2026.
5. **PHP 8.6** — rejected as a target: not yet GA at the time of writing, and Laravel 13 does not document support for it.

## Advantages

- **8.4:** widest host and package maturity at the time of writing; conservative; property hooks and asymmetric visibility available; security support to 31 Dec 2028.
- **8.5:** longest security runway (to 31 Dec 2029); current stable branch; keeps the Pest 5 upgrade path open (Pest 5 requires PHP ^8.4 — Research Notes §8), so choosing 8.4+ either way preserves that option.
- **Either 8.4 or 8.5:** both satisfy Laravel 13, both are in active support, and both avoid the 8.2 end-of-life cliff.

## Disadvantages

- **8.4:** active support ends 31 Dec 2026 (weeks after this decision), so it is effectively a security-only branch for most of the project's life; its runway is a year shorter than 8.5's.
- **8.5:** the newest branch; marginally less host/package maturity than 8.4 at the time of writing (the difference is small and shrinking).
- **Both:** a PHP upgrade will be needed within the project's life (8.4's security ends 2028, 8.5's in 2029). This is normal PHP lifecycle management, not a defect of the choice.

## Security implications

- PHP 8.2 must never be used: it stops receiving even security fixes on 31 Dec 2026.
- Both 8.4 and 8.5 receive security fixes for the whole of their support windows; the choice between them is a runway decision, not a security decision.
- PHP 8.6 must not be adopted until it is GA, has received its first patch releases, and Laravel documents support for it.

## Scalability implications

- None material. PHP version is not a scaling factor at this workload; the choice affects language features available to the codebase (notably property hooks on 8.4+), not throughput.

## Maintenance implications

- Pin the exact PHP version in the deployment (Docker image / server) and in `composer.json` (`"php": "^8.4"` or `"^8.5"` as decided at scaffold). Record the decision and its support end-date in the runbook so the next upgrade is scheduled, not discovered.
- If 8.4 is chosen, plan the move to 8.5 (or its successor) during 2028; if 8.5 is chosen, during 2029.

## Final recommendation

**Target PHP 8.4 (conservative) or PHP 8.5 (longest runway); floor 8.3; never 8.2.** The final pick between 8.4 and 8.5 is made at scaffold time, based on what the host provides and what the packages resolve to, and is recorded in the runbook. Either satisfies this ADR.

## Reason for selection

PHP 8.2 is end of life within weeks, 8.3 is already security-only with the shortest remaining runway, and 8.6 is not yet released or supported by Laravel 13. The choice is therefore between the two supported branches, and both are acceptable — the ADR confirms the range and the floor rather than pretending the difference between 8.4 and 8.5 is decisive.
