---
name: cost-optimization
description: Cloud and infrastructure cost optimization covering container right-sizing, CDN caching, database query costs, serverless tuning, spot instances, reserved capacity, and build time reduction.
---

## Purpose

Reduce infrastructure and operational costs without sacrificing performance or reliability. This skill provides actionable patterns for identifying waste, right-sizing resources, and making cost-aware engineering decisions.

## Container Right-Sizing

- Start with resource limits based on actual usage, not guesses. Monitor CPU and memory for 7 days before setting limits.
- Use Vertical Pod Autoscaler (VPA) in recommendation mode to get sizing suggestions from real workload data.
- Set requests to the P50 usage and limits to the P99 usage. This balances efficiency with headroom.
- Over-provisioned containers waste money. Under-provisioned containers cause OOM kills and throttling.
- Review resource allocation monthly. Traffic patterns change, and last quarter's sizing may not fit today's load.
- Use namespace-level resource quotas to prevent teams from over-requesting without accountability.
- Consolidate low-utilization containers onto fewer nodes. Bin-packing saves node costs.

## CDN Caching Strategies

- Cache static assets (JS, CSS, images, fonts) at the CDN with long TTLs (1 year). Use content hashes in filenames for cache busting.
- Cache API responses at the CDN when data changes infrequently. Even 60 seconds of caching eliminates burst traffic to the origin.
- Use `Cache-Control: stale-while-revalidate` to serve cached content while fetching fresh data in the background.
- Set `Vary` headers correctly. Incorrect `Vary` headers cause low cache hit rates and duplicate cached entries.
- Monitor cache hit ratio. Below 80% for static assets means misconfigured caching rules.
- Use edge functions (Cloudflare Workers, Lambda@Edge) to customize caching logic without hitting the origin.
- Compress responses with Brotli at the CDN. Smaller payloads reduce bandwidth costs and improve load times.
- Purge cache selectively on deploy. Full cache purges cause origin traffic spikes.

## Database Query Cost Analysis

- Enable slow query logging. Any query over 100ms deserves investigation.
- Use `EXPLAIN ANALYZE` (PostgreSQL) or `EXPLAIN` (MySQL) to understand query execution plans.
- Add indexes for columns used in WHERE, JOIN, and ORDER BY clauses. Missing indexes cause full table scans.
- Monitor query frequency, not just query duration. A 10ms query running 10,000 times per minute costs more than a 1-second query running once.
- Use connection pooling (PgBouncer, ProxySQL) to reduce connection overhead. Each connection consumes memory.
- Partition large tables by date or tenant. Queries that touch smaller partitions run faster and cost less.
- Archive old data to cold storage. Keeping 5 years of logs in hot storage wastes money.
- Review and remove unused indexes. Each index slows writes and consumes storage.

## Serverless Cold Starts

- Choose runtimes with fast cold starts: Node.js and Python start in under 200ms. Java and .NET take 1-5 seconds without optimization.
- Keep deployment packages small. Fewer dependencies means faster initialization.
- Use provisioned concurrency for latency-sensitive functions. It eliminates cold starts but costs more.
- Warm critical functions with scheduled invocations during expected traffic windows.
- Avoid VPC-attached Lambda functions unless necessary. VPC attachment adds 2-5 seconds to cold starts (improved but still measurable).
- Use Lambda layers for shared dependencies. Layers are cached across invocations.
- Profile initialization code. Move heavy setup (SDK clients, DB connections) outside the handler to reuse across warm invocations.
- Set memory proportional to CPU needs. Lambda allocates CPU linearly with memory. Under-provisioned memory means slower execution and higher duration costs.

## Spot and Preemptible Instances

- Use spot instances for stateless, fault-tolerant workloads: batch jobs, CI runners, data processing.
- Never use spot for stateful services (databases, message queues) or single-instance workloads.
- Diversify across instance types and availability zones. Spot pricing and availability vary by type and zone.
- Set up graceful shutdown handlers. Spot instances get a 2-minute warning before termination.
- Use spot fleet or managed instance groups to automatically replace terminated instances.
- Combine spot with on-demand in a mixed fleet. Run baseline on reserved/on-demand, burst on spot.
- Monitor spot pricing trends. Some instance types are consistently cheap, others are volatile.

## Reserved Capacity

- Commit to reserved instances or savings plans for steady-state workloads that run 24/7.
- Analyze 3 months of usage data before purchasing. Reservations for declining workloads waste money.
- Use 1-year commitments over 3-year unless you are certain the workload persists. Technology changes fast.
- Convertible reservations cost more but allow instance type changes. Choose these for evolving workloads.
- Apply reserved capacity to the largest, most stable workloads first. Maximize the discount impact.
- Track reservation utilization monthly. Unused reservations are pure waste.
- Consider compute savings plans over instance-specific reservations for flexibility across instance families.

## Build Time Optimization

- Cache dependencies between builds. Download once, reuse until the lockfile changes.
- Use incremental builds where the toolchain supports it (TypeScript `tsBuildInfo`, Go build cache, Gradle daemon).
- Parallelize build steps. Linting, type checking, and unit tests can run concurrently.
- Use remote build caches (Turborepo, Gradle remote cache, Bazel remote execution) to share cached artifacts across CI machines.
- Right-size CI runners. Paying for 8-core machines when builds are I/O-bound wastes money. Paying for 2-core machines when builds are CPU-bound wastes time (which costs money).
- Run only affected tests on pull requests. Full test suites run on merge to main.
- Measure and track build times. Set alerts for regressions. A build that slows by 10 seconds per week adds 8 minutes per month.
- Remove unnecessary build steps. Dead linter rules, redundant type checks, and unused test suites all add up.

## Cost Monitoring and Governance

- Set up billing alerts at 50%, 80%, and 100% of monthly budget.
- Tag all resources with team, environment, and service. Untagged resources are invisible costs.
- Review cost reports weekly for anomalies. Catch runaway costs before the monthly bill arrives.
- Use cost allocation reports to attribute spending to teams. Visibility drives accountability.
- Automate shutdown of non-production environments outside business hours. Dev and staging environments running 24/7 waste 65% of their cost.
- Audit storage costs quarterly. Delete orphaned volumes, snapshots, and unused buckets.
- Calculate cost per request, cost per user, or cost per transaction. These unit economics reveal efficiency trends better than total spend.
