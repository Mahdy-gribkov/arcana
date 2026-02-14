---
name: container-security
description: Container security from build to runtime. Image scanning, minimal base images, rootless execution, secrets management, supply chain verification, and runtime policies with concrete Dockerfile examples.
---

## Image Scanning

Run Trivy before every push. Fail CI on HIGH or CRITICAL vulnerabilities.

```bash
trivy image myapp:latest --severity HIGH,CRITICAL --exit-code 1
```

Use Grype as a second scanner. Different scanners catch different CVEs.

```bash
grype myapp:latest --fail-on high
```

Store scan results as build artifacts for trending.

```bash
trivy image myapp:latest --format json --output scan-results.json
```

## Minimal Base Images

**BAD:** Using full OS images with unnecessary packages.

```dockerfile
FROM ubuntu:22.04
RUN apt-get update && apt-get install -y curl ca-certificates
COPY app /app
CMD ["/app"]
```

**GOOD:** Use distroless for runtime. Zero shell, zero package manager.

```dockerfile
FROM golang:1.23 AS builder
WORKDIR /build
COPY . .
RUN CGO_ENABLED=0 go build -o app

FROM gcr.io/distroless/static-debian12
COPY --from=builder /build/app /app
CMD ["/app"]
```

**For Node.js apps:**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /build
COPY package*.json ./
RUN npm ci --only=production
COPY . .

FROM gcr.io/distroless/nodejs20-debian12
COPY --from=builder /build /app
WORKDIR /app
CMD ["server.js"]
```

**For statically compiled binaries (Go, Rust):**

```dockerfile
FROM golang:1.23 AS builder
WORKDIR /build
COPY . .
RUN CGO_ENABLED=0 go build -o app

FROM scratch
COPY --from=builder /build/app /app
CMD ["/app"]
```

## Rootless Containers

**BAD:** Running as root. Attackers who escape the container have root on the host.

```dockerfile
FROM node:20-alpine
COPY . /app
CMD ["node", "server.js"]
```

**GOOD:** Create a non-root user and switch to it.

```dockerfile
FROM node:20-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --chown=appuser:appgroup . .
USER appuser
CMD ["node", "server.js"]
```

For distroless images, use the built-in `nonroot` user.

```dockerfile
FROM gcr.io/distroless/static-debian12:nonroot
COPY --chown=65532:65532 app /app
USER 65532
CMD ["/app"]
```

### Runtime Flags

Run containers read-only and drop all capabilities.

```bash
docker run --read-only --cap-drop=ALL --user 65532 myapp:latest
```

For Kubernetes:

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 65532
  readOnlyRootFilesystem: true
  capabilities:
    drop:
      - ALL
```

## Secrets Management

**BAD:** Baking secrets into the image. They persist in layers even if deleted.

```dockerfile
FROM node:20-alpine
ENV DATABASE_PASSWORD=supersecret
COPY . /app
CMD ["node", "server.js"]
```

**GOOD:** Inject secrets at runtime via environment variables or mounted files.

```bash
docker run -e DATABASE_PASSWORD="$(cat /secure/db-password)" myapp:latest
```

For Kubernetes, use Secrets mounted as volumes or environment variables.

```yaml
env:
  - name: DATABASE_PASSWORD
    valueFrom:
      secretKeyRef:
        name: db-credentials
        key: password
```

### Build-Time Secrets

Use BuildKit secrets for credentials needed during build (e.g., private registry tokens).

**BAD:** Copying `.env` file into the image.

```dockerfile
COPY .env /build/.env
RUN npm install --registry=https://private.npm.com
```

**GOOD:** Mount secrets during build without persisting them.

```dockerfile
# syntax=docker/dockerfile:1
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm install --registry=https://private.npm.com
```

Build with:

```bash
docker buildx build --secret id=npmrc,src=.npmrc .
```

### Audit .dockerignore

Ensure secrets never enter the build context.

```
.env
.env.*
*.key
*.pem
secrets/
credentials.json
```

Scan committed Dockerfiles for hardcoded tokens.

```bash
gitleaks detect --source . --no-git
```

## Supply Chain Security

### Sign Images with Cosign

Sign after building. Verify before deploying.

```bash
cosign sign myregistry.com/myapp:v1.0.0
```

Verify signature before pull.

```bash
cosign verify --key cosign.pub myregistry.com/myapp:v1.0.0
```

### Generate SBOM

Create a Software Bill of Materials for every release.

```bash
syft myapp:latest -o json > sbom.json
trivy image --format cyclonedx --output sbom.json myapp:latest
```

Attach SBOM to the image as an OCI artifact.

```bash
cosign attach sbom --sbom sbom.json myregistry.com/myapp:v1.0.0
```

### Pin Dependencies by Digest

**BAD:** Using mutable tags. Tags can be overwritten.

```dockerfile
FROM node:20-alpine
```

**GOOD:** Pin by digest. Digest is immutable.

```dockerfile
FROM node:20-alpine@sha256:abc123...
```

Find digests with:

```bash
docker pull node:20-alpine
docker inspect node:20-alpine | jq -r '.[0].RepoDigests[0]'
```

## Runtime Policies

### Kubernetes Admission Control

Use OPA Gatekeeper or Kyverno to enforce policies at deploy time.

**Example Gatekeeper policy:** Block containers running as root.

```yaml
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sPSPAllowPrivilegeEscalationContainer
metadata:
  name: must-run-as-nonroot
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
  parameters:
    runAsUser:
      rule: MustRunAsNonRoot
```

**Example Kyverno policy:** Require CPU and memory limits.

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-resource-limits
spec:
  validationFailureAction: enforce
  rules:
    - name: check-limits
      match:
        resources:
          kinds:
            - Pod
      validate:
        message: "CPU and memory limits are required"
        pattern:
          spec:
            containers:
              - resources:
                  limits:
                    memory: "?*"
                    cpu: "?*"
```

### Seccomp Profiles

Restrict system calls available to containers.

**BAD:** Default seccomp profile allows 300+ syscalls.

**GOOD:** Use Docker's default seccomp profile at minimum.

```bash
docker run --security-opt seccomp=default.json myapp:latest
```

For Kubernetes:

```yaml
securityContext:
  seccompProfile:
    type: RuntimeDefault
```

### Runtime Monitoring with Falco

Alert on suspicious behavior inside containers.

**Example Falco rule:** Detect shell execution in containers.

```yaml
- rule: Shell Spawned in Container
  desc: Detect shell execution inside a container
  condition: >
    spawned_process and
    container and
    proc.name in (bash, sh, zsh)
  output: "Shell spawned in container (user=%user.name container=%container.id image=%container.image.repository)"
  priority: WARNING
```

Falco alerts can trigger automated responses (kill pod, notify security team).

## Dockerfile Best Practices

**BAD:** Multiple issues in one Dockerfile.

```dockerfile
FROM ubuntu:latest
RUN apt-get update
RUN apt-get install -y curl wget
ADD https://example.com/app.tar.gz /app.tar.gz
RUN tar -xzf /app.tar.gz
ENV SECRET_KEY=abc123
COPY . .
CMD bash start.sh
```

**GOOD:** Minimal, secure, efficient.

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine@sha256:abc123... AS builder
WORKDIR /build
COPY package*.json ./
RUN npm ci --only=production
COPY . .

FROM gcr.io/distroless/nodejs20-debian12:nonroot
WORKDIR /app
COPY --from=builder /build /app
USER 65532
CMD ["server.js"]
```

**Fixes:**

1. Pin base image by digest.
2. Use multi-stage build to separate build and runtime.
3. Use distroless runtime image.
4. Run as non-root user.
5. No secrets in environment variables.
6. Use `COPY` instead of `ADD` (no auto-extraction or URL fetching).
7. Combine `apt-get update` and `install` in one layer to avoid cache staleness.

## CI Checklist

1. Lint Dockerfile with Hadolint.

```bash
hadolint Dockerfile
```

2. Scan for secrets in build context.

```bash
gitleaks detect --source . --no-git
```

3. Build and scan image.

```bash
docker build -t myapp:latest .
trivy image myapp:latest --exit-code 1 --severity HIGH,CRITICAL
```

4. Sign image and generate SBOM.

```bash
cosign sign myregistry.com/myapp:v1.0.0
syft myapp:latest -o json > sbom.json
```

5. Push to registry with immutable tag.

```bash
docker tag myapp:latest myregistry.com/myapp:v1.0.0
docker push myregistry.com/myapp:v1.0.0
```

6. Verify signature before deploying.

```bash
cosign verify --key cosign.pub myregistry.com/myapp:v1.0.0
```

## Common Mistakes

**Using `latest` tag.** Tags are mutable. Pin versions or digests.

**Using `ADD` instead of `COPY`.** `ADD` auto-extracts archives and fetches URLs, expanding attack surface.

**Separate `apt-get update` and `install` layers.** The update layer gets cached and becomes stale.

**BAD:**

```dockerfile
RUN apt-get update
RUN apt-get install -y curl
```

**GOOD:**

```dockerfile
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
```

**Mounting Docker socket.** Grants full host access. Never do this in production.

```bash
# BAD
docker run -v /var/run/docker.sock:/var/run/docker.sock myapp
```
