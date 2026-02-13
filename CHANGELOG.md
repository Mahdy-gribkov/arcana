# Changelog

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
- batch-publish.py: publish all skills in one command
- fix-sasmp.py: fix non-standard SASMP/OpenClaw frontmatter
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
