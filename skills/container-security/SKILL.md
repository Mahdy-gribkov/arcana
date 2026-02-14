---
name: container-security
description: Container security practices covering image scanning, minimal base images, rootless execution, secrets management, supply chain verification, and runtime policy enforcement.
---

## Purpose

Secure container workloads from build to runtime. This skill covers image hardening, vulnerability scanning, secret injection, supply chain integrity, and runtime defense.

## Image Scanning

- Run `trivy image <image>:<tag>` before every push to a registry. Fail CI on HIGH or CRITICAL findings.
- Use `grype <image>` as a second opinion scanner. Different scanners catch different CVEs.
- Scan both the final image and intermediate build stages. Multi-stage builds can leak vulnerabilities into earlier layers.
- Pin scanner versions in CI to avoid surprise behavior changes.
- Store scan results as build artifacts. Compare across releases to track vulnerability trends.
- Integrate scanning into pull request checks. Block merges that introduce new HIGH+ vulnerabilities.

## Minimal Base Images

- Default to `distroless` images for production. They contain only the application and its runtime dependencies.
- Use `scratch` for statically compiled binaries (Go, Rust). Zero OS surface means zero OS-level CVEs.
- Alpine is a reasonable middle ground when you need a shell for debugging. Pin the version explicitly.
- Never use `latest` tags for base images. Pin to a digest or specific version.
- Audit base image contents with `docker image inspect` and `dive` to find unnecessary packages.
- Remove package managers in the final stage. If `apt-get` exists in production, attackers can install tools.

## Multi-Stage Builds

- Separate build dependencies from runtime dependencies using multi-stage Dockerfiles.
- Copy only the compiled artifact into the final stage. Do not copy source code, test files, or build tools.
- Use `COPY --from=builder` to pull specific files rather than entire directories.
- Label each stage clearly: `FROM golang:1.23 AS builder`, `FROM gcr.io/distroless/static AS runtime`.
- Run tests in a dedicated stage. Test failures stop the build before the runtime image is created.

## Rootless Containers

- Add `USER nonroot` or `USER 65534` in the Dockerfile. Never run production containers as root.
- Set filesystem permissions during the build so the non-root user can read application files.
- Use `--read-only` flag at runtime to prevent filesystem writes outside mounted volumes.
- Drop all Linux capabilities with `--cap-drop=ALL`, then add back only what the application needs.
- Test locally with `podman` in rootless mode to catch permission issues early.

## Secrets Management

- Never bake secrets into images. Use runtime injection via environment variables or mounted volumes.
- Prefer secret stores (Vault, AWS Secrets Manager, SOPS) over plain environment variables.
- Use Docker BuildKit secrets (`--mount=type=secret`) for build-time credentials like private registry tokens.
- Rotate secrets on a schedule. Automate rotation so it does not depend on human memory.
- Audit `.dockerignore` to ensure `.env` files, private keys, and credentials never enter the build context.
- Scan committed Dockerfiles and compose files for hardcoded tokens with `gitleaks` or `trufflehog`.

## Supply Chain Security

- Sign images with `cosign` after building. Verify signatures before deploying.
- Generate SBOM (Software Bill of Materials) with `syft` or `trivy` for every release image.
- Store SBOMs alongside images in the registry using OCI artifacts.
- Use `cosign verify-attestation` to confirm provenance before pulling third-party images.
- Pin dependencies by digest, not tag. Tags are mutable and can be overwritten.
- Enable Docker Content Trust (`DOCKER_CONTENT_TRUST=1`) to enforce signature verification on pull.

## Runtime Policies

- Use admission controllers (OPA Gatekeeper, Kyverno) to enforce security policies at deploy time.
- Block containers that run as root, use privileged mode, or mount the Docker socket.
- Set resource limits (CPU, memory) to prevent resource exhaustion attacks.
- Enable seccomp profiles to restrict system calls. Use the default Docker seccomp profile at minimum.
- Monitor runtime behavior with Falco. Alert on unexpected process execution, network connections, or file access.
- Isolate sensitive workloads with dedicated node pools and network policies.

## CI Integration Checklist

- Lint Dockerfiles with `hadolint`. Catch common mistakes before building.
- Scan for secrets in the build context before `docker build`.
- Build and scan the image. Fail on HIGH+ vulnerabilities.
- Sign the image and generate SBOM.
- Push to a private registry with immutable tags.
- Verify the signature in the deployment pipeline before rolling out.

## Common Mistakes

- Trusting base images without scanning them. Official images still contain CVEs.
- Using `ADD` instead of `COPY`. `ADD` auto-extracts archives and fetches URLs, expanding attack surface.
- Ignoring layer caching behavior. Changing a `COPY` early in the Dockerfile invalidates all subsequent layers.
- Running `apt-get update` and `apt-get install` in separate layers. The update layer gets cached and becomes stale.
- Mounting the Docker socket into containers. This grants full host access.
