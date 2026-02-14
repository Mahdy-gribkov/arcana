---
name: api-testing
description: "API testing and contract testing with Pact, mocking strategies, load testing using k6 and Locust, OpenAPI schema validation, and Postman/Insomnia collection management."
---

## Purpose

Verify API correctness, enforce contracts between services, validate performance under load, and maintain portable test collections. Catch regressions before they reach consumers.

## Contract Testing with Pact

### Consumer-Driven Contracts

- The consumer defines the contract: what requests it sends and what responses it expects.
- The provider verifies the contract: it runs the Pact tests against its actual implementation.
- Contracts live in a Pact Broker or Pactflow. Both sides pull from the same source of truth.

### Consumer Side

```typescript
import { PactV3 } from '@pact-foundation/pact';

const provider = new PactV3({
  consumer: 'frontend',
  provider: 'user-api',
});

describe('User API', () => {
  it('returns user by id', async () => {
    await provider
      .given('user 1 exists')
      .uponReceiving('a request for user 1')
      .withRequest({ method: 'GET', path: '/users/1' })
      .willRespondWith({
        status: 200,
        body: { id: 1, name: 'Alice' },
      })
      .executeTest(async (mockServer) => {
        const res = await fetch(`${mockServer.url}/users/1`);
        expect(res.status).toBe(200);
      });
  });
});
```

### Provider Side

- Run provider verification against the published pacts.
- Use provider states to set up test data: `given('user 1 exists')` triggers a setup hook.
- Verify in CI on every provider change. Fail the build if a contract breaks.

### Pact Broker

- Self-host or use Pactflow (managed service).
- Enable the "can-i-deploy" check in CI to prevent deploying incompatible versions.
- Tag pacts by environment: `main`, `staging`, `production`.

## API Mocking

### Local Mocking

- Use MSW (Mock Service Worker) for browser and Node.js API mocking.
- Intercept at the network level, not the module level. Tests stay close to real behavior.
- Define handlers once, reuse across unit and integration tests.

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const handlers = [
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({ id: params.id, name: 'Alice' });
  }),
];

const server = setupServer(...handlers);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Schema-Based Mocking

- Use Prism (from Stoplight) to generate a mock server from an OpenAPI spec.
- Run: `prism mock openapi.yaml`. It validates requests and returns spec-compliant responses.
- Use for frontend development when the backend is not ready.

### Record and Replay

- Use Polly.js or VCR to record real API responses and replay them in tests.
- Store recordings as fixtures. Refresh periodically to catch API drift.
- Scrub sensitive data from recordings before committing.

## Load Testing with k6

### Basic Test

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '2m',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('http://localhost:3000/api/health');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

### Scenarios

- **Smoke test:** 1-2 VUs for 30 seconds. Verify the endpoint works.
- **Load test:** Expected concurrent users for 5-10 minutes. Find the baseline.
- **Stress test:** Ramp beyond expected load. Find the breaking point.
- **Soak test:** Sustained load for 1-4 hours. Find memory leaks and connection exhaustion.

### CI Integration

- Run smoke tests on every PR. Run full load tests on a schedule (nightly or weekly).
- Export results to Grafana Cloud k6 or InfluxDB for trending.
- Fail the pipeline if p95 latency exceeds the threshold.

## Load Testing with Locust

### Basic Test

```python
from locust import HttpUser, task, between

class ApiUser(HttpUser):
    wait_time = between(1, 3)

    @task
    def get_health(self):
        self.client.get("/api/health")

    @task(3)
    def get_users(self):
        self.client.get("/api/users")
```

- Weight tasks with the `@task(n)` decorator. Higher weight means more frequent execution.
- Run with web UI: `locust -f locustfile.py --host=http://localhost:3000`.
- Run headless for CI: `locust -f locustfile.py --headless -u 100 -r 10 -t 2m`.

### When to Use Locust vs k6

- k6: better for developers, JavaScript-native, lower resource usage, built-in thresholds.
- Locust: better for Python teams, more flexible user behavior modeling, web dashboard.

## OpenAPI Schema Validation

### Request/Response Validation

- Use `express-openapi-validator` (Node.js) to validate requests and responses against the spec at runtime.
- Use `openapi-core` (Python) for the same in Flask/Django.
- Fail requests that do not match the spec in development. Log violations in production.

### Test-Time Validation

- After each API test, validate the response against the OpenAPI spec.
- Use `ajv` with the JSON Schema extracted from the OpenAPI spec.
- Catch schema drift: if the implementation diverges from the spec, tests fail.

### Spec Diffing

- Use `oasdiff` to detect breaking changes between spec versions.
- Run in CI on PRs that modify the spec. Flag breaking changes for review.
- Categories: breaking (removed endpoint, changed type), non-breaking (added field, new endpoint).

## Postman/Insomnia Collections

### Collection Structure

- Organize by resource: Users, Orders, Products. Not by HTTP method.
- Use folders for CRUD operations within each resource.
- Include setup and teardown requests (create test data, clean up).

### Environment Management

- Define environments: Local, Staging, Production.
- Use variables for base URL, auth tokens, and test data IDs.
- Never store real credentials in collections. Use environment variables.

### Automation

- Export collections to JSON. Commit to the repo in a `tests/api/` directory.
- Run Postman collections in CI with Newman: `newman run collection.json -e env.json`.
- Run Insomnia collections with Inso: `inso run test "Test Suite"`.
- Generate collections from OpenAPI specs: `openapi-to-postmanv2 -s openapi.yaml -o collection.json`.

## Test Organization

- Separate unit tests (mock everything) from integration tests (real HTTP).
- Run contract tests independently from load tests. Different cadence, different infra.
- Tag tests by type: `@smoke`, `@regression`, `@load`. Run subsets in different CI stages.
- Store test fixtures (request/response pairs) in version control alongside tests.

## Troubleshooting

- Flaky API tests: add retry logic for network errors, not for assertion failures.
- Contract verification failing: check provider states setup. Missing state is the most common cause.
- k6 results inconsistent: ensure the test target is isolated. Shared environments skew results.
- Mock server not intercepting: check URL patterns. Trailing slashes and query params matter.
