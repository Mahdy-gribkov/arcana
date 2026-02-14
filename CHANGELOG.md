# Changelog

## 2.1.0.0 (2026-02-14)

Pre-production review skill, CLI hardening, security audit, 60 skills at PERFECT quality.

### New Skill
- `pre-production-review`: 8-domain codebase analysis (security, data, backend, external, frontend, infra, performance, quality). Includes 5 analysis scripts and 3 reference docs. Inspired by [UCOF](https://github.com/nativardi/ucof) by @nativardi.

### CLI Improvements
- `--json` flag added to info, config, install, update, uninstall commands (was only on list, search, validate, doctor, stats, audit)
- `arcana create` now scaffolds scripts/ and references/ directories with .gitkeep
- `arcana init` now suggests relevant skills based on detected project type
- `arcana audit` command for automated skill quality scoring (8 checks, 100-point scale)
- Pre-commit hook: `scripts/hooks/pre-commit` runs security scan automatically

### Security Hardening
- Shell scripts: input validation rejects paths with shell metacharacters ($, `, ;, |, &)
- Shell scripts: symlink protection (! -type l) on all find commands
- Shell scripts: binary file protection (grep -I) on all scanning
- Shell scripts: improved JSON escaping, stdin size limits
- CLI: stronger path traversal protection (reject .., case-insensitive on Windows)
- CLI: SSRF protection with redirect hostname allowlist
- CLI: symlink-safe getDirSize (lstatSync instead of statSync)
- CLI: increased temp file entropy (16 bytes + PID)

### Quality
- All 60 skills rewritten to PERFECT quality (code in every section, BAD/GOOD pairs)
- 4 validation scripts added (security-review, database-design, typescript-advanced, golang-pro)
- Test count: 45 -> 66 (new: audit.test.ts, fs.test.ts)
- README rewritten with SVG branding, comparison table, full skill catalog
- Remotion promo video project (30s, 5 scenes, 1920x1080)

### Changed
- Total skills: 59 -> 60
- Total CLI tests: 45 -> 66
- security-scan.sh: added scan-secrets.sh to exclusion list

---

## 2.1.0-rc (2026-02-14)

Quality infrastructure, 10 new skills, JSON output, security automation.

### Testing
- Added vitest with 35 unit tests across 5 test suites (frontmatter, UI, HTTP, config, atomic writes)
- Tests run in CI pipeline (typecheck -> unit-tests -> smoke)

### CI/CD
- Unit test job added to test-cli.yml workflow
- Dependabot for npm and GitHub Actions dependencies (weekly)
- Security scanning workflow: npm audit + secret/path leak detection
- Feature request issue template

### New Features
- `--json` flag on list, search, validate, doctor commands
- `NO_COLOR` environment variable support (chalk.level = 0)
- Validation improvements: warn on quoted descriptions, info on missing ## headings

### New Skills (10)
- api-testing, container-security, cost-optimization, dependency-audit, doc-generation
- env-config, git-workflow, incident-response, local-security, refactoring-patterns

### Security
- `scripts/security-scan.sh`: scans for hardcoded paths, secrets, personal data, .env files
- CI workflow runs security scan on push and weekly

### Changed
- Total skills: 50 -> 60
- Total CLI tests: 0 -> 35

## 2.0.4 (2026-02-14)

Complete audit: 50+ fixes across CLI, repo, CI/CD, and documentation.

### Bug Fixes
- search.ts, info.ts: added try/catch for provider errors (was crashing on network failure)
- stats --json: banner no longer corrupts JSON output
- http.ts: redirect loop protection (max 5), 403 rate-limit detection fixed
- create.ts: validates description max length (1024 chars)
- init.ts: --tool validates against known tools, cursor path no longer has side effects
- install --all, update --all: one failure no longer kills entire batch
- config: validates installDir non-empty, defaultProvider must be a configured provider
- marketplace.json: fixed version numbers for 13 updated skills

### New Features
- `arcana list --installed`: show locally installed skills with metadata
- `arcana install --dry-run`: preview what would be installed
- `arcana uninstall --yes`: skip confirmation prompt
- `arcana list --no-cache` / `arcana search --no-cache`: bypass provider cache
- Environment variable overrides: ARCANA_INSTALL_DIR, ARCANA_DEFAULT_PROVIDER
- Fuzzy search: typos like "typscript" now find "typescript"
- Update command shows file count on success

### UX Improvements
- Batch install/update shows progress counter (5/49)
- List description truncation bumped to 80 chars
- Doctor shows disk usage threshold in warning
- Clean --dry-run shows what categories were checked
- Error messages suggest specific fixes (check internet, run doctor)
- Init templates are tool-specific (Cursor .mdc, Aider YAML, Codex sandbox)
- Validate: non-standard fields shown as info, not warnings
- Uninstall prompts for confirmation by default

### Code Quality
- tsconfig: noUncheckedIndexedAccess enabled
- registry.ts: deduplicated provider slug parsing (parseProviderSlug)
- frontmatter.ts: exported MIN/MAX_DESC_LENGTH constants
- types.ts: removed unused category field
- Atomic writes for create.ts

### Repo Infrastructure
- .gitignore: expanded from 6 to 30+ entries
- CI: validate-skills.yml fixed for master branch, Python-based description extraction
- CI: npm-publish.yml adds smoke test
- .github/CODEOWNERS: all files require @mahdy-gribkov review
- PR template: added testing, breaking changes, related issues sections
- SECURITY.md: added 90-day disclosure timeline
- CONTRIBUTING.md: added SKILL.md template example
- package.json: fixed homepage, added bugs URL, repository directory

## 2.0.3 (2026-02-13)

Full quality pass: 18 bug fixes, 3 new shared utilities, 3 new platform scaffolds. Security hardening based on patterns from Vercel CLI, gh CLI, and npm.

### Security
- github.ts: path traversal guard rejects `..` and absolute paths from marketplace tree API
- installSkill(): atomic install via temp `.installing` dir, crash recovery on restart
- writeSkillMeta(), saveConfig(): atomic writes via temp file + rename pattern
- config.ts: corrupted config.json now warns instead of silent fallback to defaults
- providers.ts: validates marketplace.json exists before adding a provider

### Fixed
- install.ts: writes `.arcana-meta.json` so `update` can track versions
- install.ts/update.ts: use config `defaultProvider` instead of hardcoded "arcana"
- install.ts: says "Reinstalling..." instead of "Updating..." when overwriting
- uninstall.ts: symlink matching uses `resolve()` + `sep`, no false partial matches
- uninstall.ts: logs warnings on symlink removal failures instead of silent catch
- frontmatter.ts: quoted values (`name: "foo"`) no longer include the quotes
- frontmatter.ts: handles YAML multiline descriptions (`|` and `>` markers)
- config.ts (utils): partial config no longer wipes providers array (shallow merge fix)
- config.ts (command): warns when setting installDir to a relative path
- config.ts (command): `arcana config reset` clears provider cache
- github.ts: VALID_SLUG regex requires alphanumeric start/end
- github.ts: default branch changed to "main" (arcana.ts passes "master" explicitly)
- stats.ts: JSONL line counting uses buffer scan, token count labeled as rough estimate
- doctor.ts: imports DoctorCheck from types.ts, proper git-not-installed error message
- errorAndExit(): default hint suggests `arcana doctor` when no specific hint given

### Added
- `utils/http.ts`: shared HTTP client with exponential backoff, jitter, retry on 429/5xx, rate limit detection, GITHUB_TOKEN support
- `utils/errors.ts`: structured CliError, HttpError, RateLimitError, ConfigError types
- `utils/atomic.ts`: atomicWriteSync (temp file + rename pattern from npm)
- `arcana init --tool windsurf` scaffolds `.windsurfrules`
- `arcana init --tool antigravity` scaffolds `GEMINI.md`
- `arcana init --tool aider` scaffolds `.aider.conf.yml`
- Platform count: 4 -> 7 (Claude, Cursor, Codex, Gemini, Antigravity, Windsurf, Aider)

### Changed
- github.ts: uses shared http.ts instead of local httpGet (retry, rate limits, auth)
- index.ts: centralized error handler for CliError/HttpError/RateLimitError
- getDirSize(): shared iterative implementation in utils/fs.ts, removed from doctor.ts and clean.ts
- getInstallDir(): reads from config instead of hardcoded path
- Codex scaffold: `codex.md` -> `AGENTS.md` (matches OpenAI's actual standard)
- README: compatibility table updated with all 7 platforms and their config files

## 2.0.2 (2026-02-13)

Expanded CLI from skill installer to AI development tool. 8 new commands for skill lifecycle, environment management, diagnostics, and analytics.

### Added - CLI Commands (8)
- `arcana create <name>` - Interactive skill scaffolding with frontmatter validation
- `arcana validate [skill] [--all] [--fix]` - Validate SKILL.md structure, auto-fix broken frontmatter
- `arcana update [skill] [--all]` - Update installed skills from provider
- `arcana uninstall <skill>` - Remove skill + associated symlinks
- `arcana init [--tool claude|cursor|codex|gemini|all]` - Scaffold AI tool config for current project
- `arcana doctor` - 7 diagnostic checks (Node version, skills, symlinks, git, config, disk, health)
- `arcana clean [--dry-run]` - Prune broken symlinks and stale project data
- `arcana stats [--json]` - Session analytics (session count, tokens, active projects)
- `arcana config [key] [value] | list | reset` - Get/set arcana configuration

### Added - Utilities
- `utils/frontmatter.ts` - SKILL.md parsing, validation, and auto-fixing
- `utils/fs.ts` - Skill metadata tracking (`.arcana-meta.json`)
- `types.ts` - SkillFrontmatter, ValidationResult, SkillMeta, DoctorCheck interfaces

### Changed
- CLI: 5 commands -> 14 commands (including help)
- Total code: ~800 lines -> ~2,000 lines
- Description: "Universal AI development CLI"

## 2.0.1 (2026-02-13)

Tripled skill count. Added 36 new skills across 15 categories, batch publishing pipeline, and automation tooling.

### Added - New Skills (36)
- **Languages**: rust-best-practices, python-best-practices, typescript-advanced, game-programming-languages
- **DevOps**: docker-kubernetes, ci-cd-pipelines, ci-cd-automation
- **Security**: security-review
- **Testing**: testing-strategy
- **API**: api-design
- **Database**: database-design
- **Packages**: npm-package
- **Monitoring**: monitoring-observability
- **Performance**: performance-optimization, optimization-performance
- **Full-Stack**: fullstack-developer
- **Documentation**: update-docs
- **Linting**: go-linter-configuration
- **Game Dev**: asset-optimization, audio-systems, daw-music, game-design-theory, game-engines, game-servers, game-tools-workflows, gameplay-mechanics, graphics-rendering, level-design, memory-management, monetization-systems, networking-servers, particle-systems, programming-architecture, publishing-platforms, shader-techniques, synchronization-algorithms

### Added - Tooling
- batch-publish.py (local tooling, not in repo): publish all skills in one command
- fix-sasmp.py (local tooling, not in repo): fix non-standard SASMP/OpenClaw frontmatter
- Extended CATEGORY_MAP for all 49 skills

### Changed
- Total skills: 13 -> 49
- Fixed frontmatter on 26 broken SKILL.md files
- Cleaned nested duplicate directories

## 2.0.0 (2026-02-13)

Initial public release. Renamed repo to Arcana, added npm CLI.

### Added
- 13 skills: codebase-dissection, code-reviewer, frontend-code-review, frontend-design, golang-pro, typescript, docx, xlsx, remotion-best-practices, skill-creator, skill-creation-guide, find-skills, project-migration
- CLI: `npx @mahdy-gribkov/arcana install <skill>`
- CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md
- GitHub issue/PR templates, FUNDING.yml
- CI validation (description quality checks)

## 1.0.0 (2026-02-13)

Initial release.

### Added
- project-migration: migrate project folders while preserving Claude Code session data
