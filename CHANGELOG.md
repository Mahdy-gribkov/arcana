# Changelog

## 3.0.0 (2026-02-13)

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
