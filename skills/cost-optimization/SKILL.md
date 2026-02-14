---
name: cost-optimization
description: Cloud cost optimization with concrete examples for right-sizing containers, CDN caching, database query costs, serverless tuning, spot instances, reserved capacity, and build time reduction.
---

## Container Right-Sizing

Monitor CPU and memory for 7 days before setting limits. Set requests to P50, limits to P99.

**BAD:** Guessing resource limits. Over-provisioned containers waste money.

```yaml
resources:
  requests:
    memory: "1Gi"
    cpu: "1000m"
  limits:
    memory: "2Gi"
    cpu: "2000m"
```

**GOOD:** Use actual usage data from monitoring.

```bash
kubectl top pod myapp-12345 --containers
```

If P50 is 200Mi/100m and P99 is 400Mi/300m:

```yaml
resources:
  requests:
    memory: "200Mi"
    cpu: "100m"
  limits:
    memory: "400Mi"
    cpu: "300m"
```

### Vertical Pod Autoscaler

Get sizing recommendations from real workload data.

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: myapp-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  updateMode: "Off"  # Recommendation mode only
```

Check recommendations:

```bash
kubectl describe vpa myapp-vpa
```

### Cost Calculation

**Example:** 10 pods running 24/7 with 1Gi memory, 1 CPU.

- Memory: 10 pods × 1 GiB × $0.0004/hr = $29/month
- CPU: 10 pods × 1 core × $0.04/hr = $292/month
- Total: $321/month

Right-size to 200Mi memory, 100m CPU:

- Memory: 10 pods × 0.2 GiB × $0.0004/hr = $5.80/month
- CPU: 10 pods × 0.1 core × $0.04/hr = $29.20/month
- Total: $35/month

**Savings: 89% ($286/month)**

## Horizontal Pod Autoscaler

Scale replicas based on actual load. Do not run excess capacity during low traffic.

**BAD:** Fixed replica count. Wastes money overnight and weekends.

```yaml
spec:
  replicas: 10
```

**GOOD:** HPA scales from 2 to 10 based on CPU usage.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### Cost Impact

If baseline traffic needs 2 pods and peak traffic needs 10 pods for 2 hours/day:

- Fixed 10 replicas: 10 × 24hr = 240 pod-hours/day
- HPA (2 baseline + 8 peak for 2hr): 2 × 24 + 8 × 2 = 64 pod-hours/day

**Savings: 73% (176 pod-hours/day)**

## CDN Caching

Cache static assets with long TTLs. Use content hashes for cache busting.

**BAD:** No cache headers. Every request hits the origin.

```http
GET /app.js
Cache-Control: no-cache
```

**GOOD:** 1-year cache with content hash in filename.

```http
GET /app.abc123.js
Cache-Control: public, max-age=31536000, immutable
```

### API Response Caching

Even 60 seconds of caching eliminates burst traffic.

**BAD:** No caching on API that returns the same data for all users.

```http
GET /api/categories
Cache-Control: no-store
```

**GOOD:** Cache for 60 seconds at CDN edge.

```http
GET /api/categories
Cache-Control: public, max-age=60, s-maxage=60
```

### Stale-While-Revalidate

Serve cached content while fetching fresh data in the background.

```http
Cache-Control: max-age=60, stale-while-revalidate=300
```

User gets instant response from cache. CDN fetches fresh data asynchronously.

### Cost Impact

**Example:** 1M requests/month to origin at $0.01/10k requests = $100/month.

With 90% cache hit rate:

- Cached requests: 900k (free at edge)
- Origin requests: 100k ($1/month)

**Savings: 99% ($99/month)**

## Database Query Cost

Monitor query frequency × duration. A 10ms query running 10,000/min costs more than a 1s query running once.

**BAD:** N+1 query in a loop. 1 query to get orders, 100 queries to get users.

```typescript
const orders = await db.orders.findMany();
for (const order of orders) {
  order.user = await db.users.findUnique({ where: { id: order.userId } });
}
```

**GOOD:** Single query with join.

```typescript
const orders = await db.orders.findMany({ include: { user: true } });
```

### Cost Impact

- N+1: 101 queries × 10ms × 1000 req/min = 1,010,000ms/min
- Join: 1 query × 15ms × 1000 req/min = 15,000ms/min

**Query time reduced by 98%.**

### Slow Query Logging

Enable slow query log. Investigate queries over 100ms.

```sql
-- PostgreSQL
SET log_min_duration_statement = 100;

-- MySQL
SET long_query_time = 0.1;
```

Use `EXPLAIN ANALYZE` to find missing indexes.

```sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123;
```

If it shows a sequential scan, add an index.

```sql
CREATE INDEX idx_orders_user_id ON orders(user_id);
```

## Serverless Cold Starts

**BAD:** Java Lambda with 1GB memory, VPC attached. Cold start: 5 seconds.

```yaml
Runtime: java17
MemorySize: 1024
VpcConfig:
  SubnetIds: [subnet-abc]
```

**GOOD:** Node.js Lambda with 512MB memory, no VPC. Cold start: 200ms.

```yaml
Runtime: nodejs20.x
MemorySize: 512
```

### Provisioned Concurrency

Eliminate cold starts for latency-sensitive functions.

```yaml
ProvisionedConcurrencyConfig:
  ProvisionedConcurrentExecutions: 5
```

**Cost:** $0.000004/GB-second provisioned. For 5 concurrent × 512MB × 24/7:

- $0.000004 × 0.5 GB × 5 × 2,592,000 seconds/month = $25.92/month

Use only for critical functions.

### Lambda Memory = CPU

Lambda allocates CPU proportional to memory. Under-provisioned memory = slower execution = higher duration costs.

**Example:** Function takes 1000ms at 128MB, 200ms at 1024MB.

- 128MB: $0.0000000021/ms × 1000ms × 1M invocations = $2.10
- 1024MB: $0.0000000167/ms × 200ms × 1M invocations = $3.34

128MB is cheaper per millisecond but slower execution costs more total.

## Spot Instances

Use spot for stateless, fault-tolerant workloads. Never for databases or single-instance services.

**BAD:** Running production database on spot. Termination = downtime.

**GOOD:** Batch processing on spot with auto-replacement.

```yaml
# AWS Auto Scaling Group
MixedInstancesPolicy:
  InstancesDistribution:
    OnDemandPercentageAboveBaseCapacity: 0
    SpotAllocationStrategy: capacity-optimized
  LaunchTemplate:
    LaunchTemplateSpecification:
      LaunchTemplateId: lt-abc123
      Version: $Latest
    Overrides:
      - InstanceType: m5.large
      - InstanceType: m5a.large
      - InstanceType: m5n.large
```

Diversify across instance types and AZs. Spot pricing varies by type and zone.

### Graceful Shutdown

Handle 2-minute termination notice.

```bash
# User data script
while true; do
  TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
  if curl -H "X-aws-ec2-metadata-token: $TOKEN" -s http://169.254.169.254/latest/meta-data/spot/termination-time | grep -q 'T'; then
    echo "Spot termination notice received. Draining..."
    kubectl drain $(hostname) --ignore-daemonsets --delete-emptydir-data
    break
  fi
  sleep 5
done
```

### Cost Impact

Spot instances are 70-90% cheaper than on-demand.

- On-demand m5.large: $0.096/hr × 720hr/month = $69.12/month
- Spot m5.large: $0.029/hr × 720hr/month = $20.88/month

**Savings: 70% ($48.24/month per instance)**

## Reserved Instances

Commit to 1-year or 3-year terms for steady-state workloads.

**Example:** 10 m5.large instances running 24/7.

- On-demand: $0.096/hr × 10 × 8760hr/year = $8,409.60/year
- 1-year RI (all upfront): $0.058/hr × 10 × 8760hr/year = $5,080.80/year

**Savings: 40% ($3,328.80/year)**

### Reserved Capacity Strategy

1. Analyze 3 months of usage. Identify consistent baseline.
2. Purchase RIs for 80% of baseline. Use on-demand for peaks.
3. Start with 1-year commitments. Only 3-year if workload is certain.
4. Use convertible RIs if instance type may change.

### Track Utilization

Unused reservations are pure waste. Monitor monthly.

```bash
aws ce get-reservation-utilization \
  --time-period Start=2026-01-01,End=2026-01-31 \
  --granularity MONTHLY
```

Target 95%+ utilization. Below 90% means over-commitment.

## Build Time Optimization

Cache dependencies. Download once, reuse until lockfile changes.

**BAD:** Installing dependencies on every build.

```dockerfile
COPY . .
RUN npm install
```

**GOOD:** Cache dependencies in a separate layer.

```dockerfile
COPY package*.json ./
RUN npm ci
COPY . .
```

Lockfile changes invalidate cache. Source changes do not.

### Parallel Build Steps

Run linting, type checking, and tests concurrently.

```yaml
# GitHub Actions
jobs:
  build:
    steps:
      - run: npm run build
  lint:
    steps:
      - run: npm run lint
  test:
    steps:
      - run: npm test
```

All three jobs run in parallel. Total time = max(build, lint, test), not sum.

### Turborepo Remote Cache

Share build artifacts across CI machines.

```json
{
  "remoteCache": {
    "signature": true
  }
}
```

First build uploads cache. Subsequent builds download and skip rebuilding.

### Cost Impact

**Example:** 100 builds/day × 10 minutes = 1000 minutes/day.

With caching, reduce to 3 minutes/build:

- Before: 1000 min/day × $0.008/min = $8/day ($240/month)
- After: 300 min/day × $0.008/min = $2.40/day ($72/month)

**Savings: 70% ($168/month)**

## Cost Monitoring

Set billing alerts at 50%, 80%, 100% of budget.

**AWS:**

```bash
aws budgets create-budget --account-id 123456789012 --budget file://budget.json
```

**budget.json:**

```json
{
  "BudgetName": "Monthly Infrastructure Budget",
  "BudgetLimit": { "Amount": "1000", "Unit": "USD" },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
```

### Tag All Resources

Untagged resources are invisible costs.

```yaml
tags:
  team: backend
  environment: production
  service: api
```

Query spend by tag.

```bash
aws ce get-cost-and-usage \
  --time-period Start=2026-01-01,End=2026-01-31 \
  --granularity MONTHLY \
  --group-by Type=TAG,Key=team
```

### Automate Non-Production Shutdown

Dev and staging environments running 24/7 waste 65% of their cost.

**AWS Lambda to stop instances outside business hours:**

```python
import boto3

ec2 = boto3.client('ec2')

def lambda_handler(event, context):
    instances = ec2.describe_instances(
        Filters=[{'Name': 'tag:environment', 'Values': ['dev', 'staging']}]
    )

    instance_ids = [i['InstanceId'] for r in instances['Reservations'] for i in r['Instances']]

    if instance_ids:
        ec2.stop_instances(InstanceIds=instance_ids)
```

Run on cron: stop at 6 PM, start at 8 AM.

**Savings:** 14 hours/day × 7 days = 68% reduction for non-production.
