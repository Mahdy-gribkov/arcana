---
name: dependency-audit
description: Audit dependencies for vulnerabilities, license compliance, and outdated packages across npm, Go, and Python. Includes reading audit output, prioritizing fixes, and CI automation.
---

# Dependency Audit

## Audit Workflow

Follow this pattern for all ecosystems:

1. **Scan** - Run audit tools to detect issues
2. **Read** - Parse output, understand severity
3. **Prioritize** - Sort by risk (critical > high > medium)
4. **Fix** - Apply patches or upgrade
5. **Automate** - Add to CI to prevent regressions

## npm Audit

### Step 1: Run Basic Audit

```bash
# Interactive report
npm audit

# JSON output for parsing
npm audit --json > audit-report.json

# Production dependencies only
npm audit --omit=dev
```

### Step 2: Read npm Audit Output

**Example output:**
```
┌───────────────┬──────────────────────────────────────────────────────────────┐
│ High          │ Prototype Pollution in lodash                                │
├───────────────┼──────────────────────────────────────────────────────────────┤
│ Package       │ lodash                                                       │
├───────────────┼──────────────────────────────────────────────────────────────┤
│ Patched in    │ >=4.17.21                                                    │
├───────────────┼──────────────────────────────────────────────────────────────┤
│ Dependency of │ express                                                      │
├───────────────┼──────────────────────────────────────────────────────────────┤
│ Path          │ express > lodash                                             │
├───────────────┼──────────────────────────────────────────────────────────────┤
│ More info     │ https://github.com/advisories/GHSA-xxxx-xxxx-xxxx           │
└───────────────┴──────────────────────────────────────────────────────────────┘
```

**How to prioritize:**
```
1. Severity: Critical/High in production deps
2. Exploitability: Check "More info" for exploit details
3. Path: Direct deps easier to fix than transitive
4. Patch availability: "Patched in" shows if fix exists
```

### Step 3: Apply Fixes

```bash
# Auto-fix compatible updates
npm audit fix

# Include breaking changes (review first!)
npm audit fix --force

# Update specific package
npm update lodash@4.17.21
```

**BAD - Ignoring transitive vulnerabilities:**
```json
// package.json
{
  "dependencies": {
    "express": "4.17.0"  // Brings vulnerable lodash@4.17.0
  }
}
```

**GOOD - Force resolution to patched version:**
```json
// package.json
{
  "dependencies": {
    "express": "4.17.0"
  },
  "overrides": {
    "lodash": "4.17.21"  // Force all packages to use safe version
  }
}
```

### Step 4: Parse JSON for CI

```javascript
// scripts/audit-check.js
const auditReport = require('./audit-report.json');

const critical = auditReport.metadata.vulnerabilities.critical || 0;
const high = auditReport.metadata.vulnerabilities.high || 0;

if (critical > 0 || high > 0) {
  console.error(`Found ${critical} critical and ${high} high vulnerabilities`);
  process.exit(1);
}

console.log('No critical or high vulnerabilities found');
```

Run in CI:
```yaml
- run: npm audit --json > audit.json
- run: node scripts/audit-check.js
```

## Go Module Auditing

### Step 1: Run govulncheck

```bash
# Install
go install golang.org/x/vuln/cmd/govulncheck@latest

# Scan entire project
govulncheck ./...

# JSON output
govulncheck -json ./... > vuln-report.json
```

### Step 2: Read govulncheck Output

**Example output:**
```
Vulnerability #1: GO-2024-1234
    SQL Injection in github.com/lib/pq

    More info: https://pkg.go.dev/vuln/GO-2024-1234

    Module: github.com/lib/pq
    Found in: github.com/lib/pq@v1.10.0
    Fixed in: github.com/lib/pq@v1.10.9

    Call stacks in your code:
      main.go:45:12: main.queryDatabase calls pq.Open
```

**How to prioritize:**
```
1. "Call stacks in your code" - Only fix if you actually use it
2. "Fixed in" - Check if upgrade is available
3. Module type: Direct dep = easy fix, indirect = may need parent update
```

### Step 3: Fix Vulnerabilities

```bash
# Update specific module
go get github.com/lib/pq@v1.10.9

# Update all dependencies
go get -u ./...

# Verify checksums
go mod verify

# Clean up
go mod tidy
```

**BAD - Using replace to mask the issue:**
```go
// go.mod
replace github.com/lib/pq v1.10.0 => github.com/lib/pq v1.10.9
// Don't ship replace directives - fix the real dependency
```

**GOOD - Proper upgrade:**
```bash
go get github.com/lib/pq@v1.10.9
go mod tidy
```

### Step 4: CI Integration

```yaml
# .github/workflows/security.yml
- uses: actions/setup-go@v5
  with:
    go-version: '1.23'

- name: Run govulncheck
  run: |
    go install golang.org/x/vuln/cmd/govulncheck@latest
    govulncheck ./...
```

## Python Dependency Auditing

### Step 1: Run pip-audit

```bash
# Install
pip install pip-audit

# Audit installed packages
pip-audit

# Audit requirements file
pip-audit -r requirements.txt

# JSON output
pip-audit --format json > audit.json
```

### Step 2: Read pip-audit Output

**Example output:**
```
Found 2 known vulnerabilities in 1 package

Name    Version  ID             Fix Versions
------  -------  -------------  ------------
urllib3 1.26.0   PYSEC-2021-59  1.26.5
urllib3 1.26.0   GHSA-q2q7-5pp4 1.26.9
```

**How to prioritize:**
```
1. Check Fix Versions column - if present, upgrade available
2. Multiple vulnerabilities in one package = higher priority
3. Check if package is direct or transitive dependency
```

### Step 3: Apply Fixes

```bash
# Auto-upgrade vulnerable packages
pip-audit --fix

# Manual upgrade
pip install urllib3==1.26.9

# Using pip-compile (recommended)
pip-compile --upgrade-package urllib3==1.26.9 requirements.in
pip install -r requirements.txt
```

**BAD - Unpinned dependencies:**
```
# requirements.txt
requests
flask
```

**GOOD - Pinned with pip-compile:**
```
# requirements.in
requests>=2.28.0
flask>=2.3.0

# Generate requirements.txt
$ pip-compile requirements.in
# Creates requirements.txt with exact versions:
requests==2.31.0
flask==2.3.2
urllib3==1.26.9  # Transitive dep, pinned
```

### Step 4: CI Integration

```yaml
- uses: actions/setup-python@v5
  with:
    python-version: '3.12'

- run: pip install pip-audit
- run: pip-audit -r requirements.txt --format json --output audit.json

- name: Check for vulnerabilities
  run: |
    if grep -q '"vulnerabilities": \[\]' audit.json; then
      echo "No vulnerabilities found"
    else
      echo "Vulnerabilities detected"
      cat audit.json
      exit 1
    fi
```

## License Compliance

### Step 1: Scan Licenses

```bash
# npm
npx license-checker --json > licenses.json

# Go
go install github.com/google/go-licenses@latest
go-licenses report ./... --template licenses.tpl > licenses.txt

# Python
pip install pip-licenses
pip-licenses --format=json > licenses.json
```

### Step 2: Define Allowed/Blocked Lists

```javascript
// scripts/check-licenses.js
const licenses = require('./licenses.json');

const ALLOWED = ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC'];
const BLOCKED = ['GPL', 'AGPL', 'LGPL', 'SSPL', 'Commons Clause'];

for (const [pkg, info] of Object.entries(licenses)) {
  const license = info.licenses || '';

  if (BLOCKED.some(b => license.includes(b))) {
    console.error(`Blocked license in ${pkg}: ${license}`);
    process.exit(1);
  }

  if (!ALLOWED.some(a => license.includes(a))) {
    console.warn(`Unknown license in ${pkg}: ${license}`);
  }
}
```

### Step 3: Generate SBOM

```bash
# Using syft (multi-language)
syft dir:. -o spdx-json > sbom.spdx.json

# Using cdxgen (Node/Python/Go)
npm install -g @cyclonedx/cdxgen
cdxgen -o sbom.json
```

Attach to releases:
```yaml
- name: Generate SBOM
  run: syft dir:. -o spdx-json > sbom.spdx.json

- name: Upload to release
  uses: softprops/action-gh-release@v1
  with:
    files: sbom.spdx.json
```

## Automated Dependency Updates

### Dependabot Configuration

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
      - automated
    ignore:
      # Don't auto-update major versions
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]
    groups:
      eslint:
        patterns:
          - "eslint*"
          - "@typescript-eslint/*"

  - package-ecosystem: gomod
    directory: "/"
    schedule:
      interval: weekly
    open-pull-requests-limit: 5

  - package-ecosystem: pip
    directory: "/"
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
```

### Renovate Configuration

```json
// renovate.json
{
  "extends": ["config:base"],
  "packageRules": [
    {
      "matchUpdateTypes": ["patch"],
      "automerge": true,
      "automergeType": "pr",
      "automergeStrategy": "squash"
    },
    {
      "matchPackagePatterns": ["^@types/"],
      "groupName": "type definitions"
    }
  ],
  "schedule": ["after 10pm every weekday"]
}
```

## CI Audit Pipeline

```yaml
# .github/workflows/audit.yml
name: Dependency Audit

on:
  schedule:
    - cron: '0 0 * * 1'  # Weekly on Monday
  push:
    branches: [main]

jobs:
  audit-npm:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm audit --audit-level=high

  audit-go:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.23'

      - run: |
          go install golang.org/x/vuln/cmd/govulncheck@latest
          govulncheck ./...

  audit-python:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - run: |
          pip install pip-audit
          pip-audit -r requirements.txt
```

## Quick Reference

**Severity Prioritization:**
```
Critical: Fix immediately (< 24 hours)
High:     Fix in next sprint (< 1 week)
Medium:   Fix when convenient
Low:      Monitor, fix if easy
```

**Common Audit Commands:**
```bash
# npm
npm audit --audit-level=high
npm audit fix --dry-run

# Go
govulncheck ./...
go mod verify

# Python
pip-audit -r requirements.txt
pip-audit --fix
```

**Lockfile Hygiene:**
```
npm:    Commit package-lock.json, use npm ci in CI
Go:     Commit go.sum, run go mod verify
Python: Commit requirements.txt (from pip-compile) or poetry.lock
```

---

**Use this skill**: When security vulnerabilities are detected, before major releases, or when setting up dependency monitoring in CI.
