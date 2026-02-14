---
name: dependency-audit
description: "Multi-ecosystem dependency auditing for npm, Go, and Python. Covers vulnerability scanning, SPDX license compliance, lockfile hygiene, and automated update tooling."
---

## Purpose

Catch vulnerable, outdated, or license-incompatible dependencies before they reach production. Establish repeatable audit workflows across Node.js, Go, and Python ecosystems.

## npm Audit

### Running Audits

- `npm audit` reports known vulnerabilities from the npm advisory database.
- `npm audit fix` applies semver-compatible patches automatically.
- `npm audit fix --force` allows breaking upgrades. Review changes before committing.
- Use `npm audit --json` for CI pipelines. Parse the output and fail on high/critical severity.

### Reducing Noise

- Ignore advisories that only affect devDependencies in production builds.
- Use `npm audit --omit=dev` to scope the audit to production deps.
- For false positives, document exceptions in a `.nsprc` or use `overrides` in package.json.

### Lockfile Hygiene

- Always commit `package-lock.json`. Never add it to `.gitignore`.
- Run `npm ci` in CI, not `npm install`. It respects the lockfile exactly.
- Periodically delete `node_modules` and `package-lock.json`, then reinstall to flush stale resolutions.
- Check for duplicate packages: `npm ls --all | grep deduped` or use `npm dedupe`.

## Go Module Auditing

### Vulnerability Scanning

- `govulncheck ./...` scans for known vulnerabilities in Go dependencies.
- Install: `go install golang.org/x/vuln/cmd/govulncheck@latest`.
- It checks only functions your code actually calls, reducing false positives.

### Module Maintenance

- `go mod tidy` removes unused dependencies and adds missing ones.
- `go mod verify` checks that downloaded modules match their checksums.
- `go mod graph` shows the full dependency tree. Pipe to `dot` for visualization.
- Pin indirect dependencies by running `go get <module>@<version>` explicitly.

### Replace Directives

- Use `replace` in go.mod for local development forks. Never ship replace directives.
- CI should fail if go.mod contains replace directives on the main branch.

## Python Dependency Auditing

### pip-audit

- Install: `pip install pip-audit`.
- Run: `pip-audit -r requirements.txt` or `pip-audit` in a virtualenv.
- Use `--fix` to auto-upgrade vulnerable packages.
- Supports multiple sources: PyPI advisory DB, OSV.

### Lockfile Strategies

- Use `pip-compile` (from pip-tools) to generate pinned `requirements.txt` from `requirements.in`.
- Poetry uses `poetry.lock`. Always commit it.
- Run `pip check` to detect broken dependency chains after install.

## SPDX License Compliance

### Scanning

- Use `license-checker` (npm), `go-licenses` (Go), or `pip-licenses` (Python).
- Export results in SPDX format for legal review.
- Maintain an allowlist of approved licenses: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC.

### Blocklist

- Block copyleft licenses (GPL, AGPL, LGPL) in proprietary projects unless legal approves.
- Block SSPL, Commons Clause, and other source-available licenses that restrict SaaS use.
- Fail CI when a new dependency introduces a blocked license.

### SBOM Generation

- Generate Software Bill of Materials using `syft` or `cdxgen`.
- Attach SBOM to releases for supply chain transparency.
- SPDX and CycloneDX are the two main SBOM formats. Pick one and stay consistent.

## Dependabot Configuration

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: "/"
    schedule:
      interval: weekly
    open-pull-requests-limit: 10
    labels:
      - dependencies
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]
```

- Group minor and patch updates to reduce PR noise.
- Set `open-pull-requests-limit` to avoid flooding the PR queue.
- Use `ignore` rules for dependencies you manage manually.

## Renovate Configuration

- Renovate offers more control than Dependabot: automerge, custom grouping, regex managers.
- Store config in `renovate.json` or `.github/renovate.json`.
- Enable automerge for patch updates with passing CI: `"automerge": true, "matchUpdateTypes": ["patch"]`.
- Use `packageRules` to group related dependencies (e.g., all eslint packages).

## CI Integration

- Run audit commands as a dedicated CI step, not inside the build.
- Fail the pipeline on critical/high vulnerabilities. Warn on medium.
- Cache audit results to avoid redundant scans on unchanged lockfiles.
- Schedule weekly full audits even if no code changed.

## Troubleshooting

- Conflicting peer dependencies: use `--legacy-peer-deps` temporarily, then fix the root cause.
- Phantom dependencies (using undeclared deps): run `depcheck` (npm) to find them.
- Go checksum mismatches: delete the module cache with `go clean -modcache` and retry.
- pip resolver conflicts: use `pip install --use-feature=fast-deps` or switch to Poetry.
