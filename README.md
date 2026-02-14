# Arcana

Agent skills that work across AI coding tools. Drop them into your tools directory and they just work. No configuration. No dependencies. Plain markdown and Python scripts.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Skills](https://img.shields.io/badge/Skills-60-blue.svg)](#skills)
[![Platforms](https://img.shields.io/badge/Platforms-7-green.svg)](#compatibility)

## What Is This

A collection of agent skills that follow the open [Agent Skills standard](https://docs.anthropic.com/en/docs/agents/skills). They are not tied to one tool. Install them on Claude Code, Codex CLI, Cursor, Gemini CLI, or any compatible agent. Each skill teaches your AI assistant how to handle a specific task or workflow.

## Skills

| Skill | Category | Description |
|-------|----------|-------------|
| api-design | API | REST API and GraphQL design best practices including resource naming, HTTP methods, status codes, pagination (cursor vs ... |
| api-testing | API | API testing expertise covering contract testing with Pact, API mocking with MSW and Prism, load testing with k6 and Locust... |
| code-reviewer | Code Quality | Use this skill to review code. It supports both local changes (staged or working tree) |
| codebase-dissection | Code Quality | Systematic methodology for analyzing, understanding, and diagnosing problems in any codebase. Covers architecture mappin... |
| frontend-code-review | Code Quality | "Trigger when the user requests a review of frontend files (e.g., `.tsx`, `.ts`, `.js`). Support both pending-change rev... |
| database-design | Database | Database architecture and query optimization for PostgreSQL and SQLite. Covers schema design, normalization to 3NF, deno... |
| frontend-design | Design | Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to ... |
| container-security | DevOps | Container security including image scanning with Trivy and Grype, minimal base images, rootless containers, supply chain... |
| cost-optimization | DevOps | Cloud and infrastructure cost optimization covering container right-sizing, CDN caching, database query cost analysis... |
| ci-cd-automation | DevOps | Continuous integration and deployment pipelines, automated testing, build automation, and team workflows for game develo... |
| ci-cd-pipelines | DevOps | GitHub Actions and GitLab CI/CD pipeline expertise. Workflow syntax, job matrix, dependency caching (npm, pip, go, docke... |
| docker-kubernetes | DevOps | Production Docker and Kubernetes patterns including multi-stage builds, minimal base images, non-root users, layer cachi... |
| dependency-audit | DevOps | Dependency auditing covering npm audit, go mod tidy, pip-audit, license compliance, lockfile hygiene, Dependabot config... |
| doc-generation | Documentation | Documentation generation from code including OpenAPI, GraphQL schema docs, Mermaid diagrams, changelog automation... |
| env-config | DevOps | Environment configuration patterns covering .env management, validation with Zod/envalid, 12-factor config, Docker env... |
| update-docs | Documentation | This skill should be used when the user asks to "update documentation for my changes", "check docs for this PR", "what d... |
| docx | Documents | "Use this skill whenever the user wants to create, read, edit, or manipulate Word documents (.docx files). Triggers incl... |
| xlsx | Documents | "Use this skill any time a spreadsheet file is the primary input or output. This means any task where the user wants to:... |
| fullstack-developer | Full-Stack | Modern web development expertise covering React, Node.js, databases, and full-stack architecture. Use when: building web... |
| asset-optimization | Game Dev | Asset pipeline optimization, compression, streaming, and resource management for efficient game development and delivery... |
| audio-systems | Game Dev | Game audio systems, music, spatial audio, sound effects, and voice implementation. Build immersive audio experiences wit... |
| daw-music | Game Dev | Digital Audio Workstation usage, music composition, interactive music systems, and game audio implementation for immersi... |
| game-design-theory | Game Dev | Comprehensive game design theory covering MDA framework, player psychology, balance principles, and progression systems.... |
| game-engines | Game Dev | Master game engines - Unity, Unreal Engine, Godot. Engine-specific workflows, systems architecture, and production best ... |
| game-servers | Game Dev | Game server architecture, scalability, matchmaking, and backend systems for online games. Build robust, scalable multipl... |
| game-tools-workflows | Game Dev | Game development tools, asset pipelines, version control, build systems, and team development workflows for efficient pr... |
| gameplay-mechanics | Game Dev | Core gameplay mechanics implementation, system interactions, feedback loops, and iterative balance refinement for engagi... |
| graphics-rendering | Game Dev | 3D graphics, shaders, VFX, lighting, rendering optimization. Create stunning visuals with production-ready techniques. |
| level-design | Game Dev | Level design fundamentals, pacing, difficulty progression, environmental storytelling, and spatial design for engaging g... |
| memory-management | Game Dev | Game memory optimization, object pooling, garbage collection tuning, and efficient resource management for target platfo... |
| monetization-systems | Game Dev | Game monetization strategies, in-app purchases, battle passes, ads integration, and player retention mechanics. Ethical ... |
| networking-servers | Game Dev | Multiplayer systems, netcode, game servers, synchronization, and anti-cheat. Build scalable, responsive multiplayer expe... |
| particle-systems | Game Dev | Creating visual effects using particle systems, physics simulation, and post-processing for polished, dynamic game graph... |
| programming-architecture | Game Dev | Game code architecture, design patterns, scalable systems, and maintainable code structure for complex games. |
| publishing-platforms | Game Dev | Platform submission processes, certification requirements, and distribution across Steam, Epic, console, and mobile plat... |
| shader-techniques | Game Dev | Advanced shader programming, visual effects, custom materials, and rendering optimization for stunning game graphics. |
| synchronization-algorithms | Game Dev | Network synchronization, lag compensation, client prediction, and state consistency for responsive multiplayer games. |
| game-programming-languages | Languages | Game programming languages - C#, C++, GDScript. Learn syntax, patterns, and engine-specific idioms for professional game... |
| golang-pro | Languages | Master Go 1.21+ with modern patterns, advanced concurrency, performance optimization, and production-ready microservices... |
| python-best-practices | Languages | Modern Python 3.12+ development with strict type hints, ruff linting, uv package manager, async/await patterns, dataclas... |
| rust-best-practices | Languages | Idiomatic Rust development with ownership, borrowing, lifetimes, error handling (thiserror/anyhow), async Tokio patterns... |
| typescript | Languages | TypeScript code style and optimization guidelines. Use when writing TypeScript code (.ts, .tsx, .mts files), reviewing c... |
| typescript-advanced | Languages | Advanced TypeScript patterns including branded/nominal types, discriminated unions with exhaustive matching, conditional... |
| git-workflow | DevOps | Git workflow expertise covering conventional commits, branch strategies, rebase, merge conflict resolution, git hooks... |
| go-linter-configuration | Linting | Configure and troubleshoot golangci-lint for Go projects. Handle import resolution issues, type-checking problems, and o... |
| find-skills | Meta | Helps users discover and install agent skills when they ask questions like "how do I do X", "find a skill for X", "is th... |
| skill-creation-guide | Meta | Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an exist... |
| skill-creator | Meta | Create or update Claude skills. Use for new skills, skill references, skill scripts, optimizing existing skills, extendi... |
| incident-response | Operations | Incident response procedures covering on-call runbooks, postmortem templates, rollback procedures, communication protocols... |
| local-security | Security | Developer workstation security covering SSH key management, GPG signing, credential managers, multi-IDE security... |
| project-migration | Migration | Migrate project folders while preserving Claude Code session data. Use when moving, renaming, or reorganizing project di... |
| monitoring-observability | Monitoring | Production observability and monitoring expertise including structured logging with JSON and correlation IDs, Prometheus... |
| npm-package | Packages | npm and pnpm package authoring expertise. Covers tsup and unbuild bundling, dual ESM/CJS exports, package.json fields (m... |
| optimization-performance | Performance | Game optimization, performance profiling, multi-platform support, and frame rate optimization for smooth gameplay experi... |
| performance-optimization | Performance | Web and backend performance optimization including Core Web Vitals (LCP, FID, INP, CLS), bundle analysis with webpack-bu... |
| refactoring-patterns | Code Quality | Code refactoring patterns including extract method/class, inline, dead code elimination, dependency injection, SOLID... |
| security-review | Security | Code security review covering OWASP Top 10, injection prevention (SQL, XSS, command injection), authentication and autho... |
| testing-strategy | Testing | Comprehensive testing expertise across unit, integration, and e2e tests. Covers pytest, Vitest, Jest, Go testing, Playwr... |
| remotion-best-practices | Video | Video creation in React using Remotion. Covers animations, compositions, audio sync, text effects, 3D integration with T... |

## CLI

Arcana is also a universal AI development CLI. Skills, scaffolding, diagnostics, and analytics for every agent.

```bash
# Skills
npx arcana install golang-pro        # Install a skill
npx arcana install --all             # Install all skills
npx arcana list                      # List available skills
npx arcana search "code review"      # Search across providers
npx arcana info codebase-dissection  # Show skill details
npx arcana create my-skill           # Create a new skill
npx arcana validate --all --fix      # Validate and fix all skills
npx arcana update --all              # Update all installed skills
npx arcana uninstall old-skill       # Remove a skill

# Environment
npx arcana init                      # Scaffold AI tool config (CLAUDE.md, .cursor/rules/, etc.)
npx arcana doctor                    # Diagnose environment issues
npx arcana clean --dry-run           # Preview cleanup of stale data
npx arcana stats                     # Session analytics and token usage
npx arcana config list               # View configuration

# Providers
npx arcana providers --add someone/their-skills
npx arcana list --provider someone/their-skills
```

Skills are installed to `~/.agents/skills/`, the standard location for all compatible tools.

## Quick Start

**Option 1: CLI (recommended)**
```bash
npx @mahdy-gribkov/arcana install --all
```

**Option 2: Claude Code**
```bash
/install mahdy-gribkov/arcana
```

**Option 3: Manual**
```bash
git clone https://github.com/mahdy-gribkov/arcana.git
cp -r arcana/skills/* ~/.agents/skills/
```

## Compatibility

These skills follow the open Agent Skills standard, established December 2025.

| Platform | Status |
|----------|--------|
| Claude Code (Anthropic) | Fully supported |
| Codex CLI (OpenAI) | Supported (AGENTS.md) |
| Cursor AI | Supported (.cursor/rules/) |
| Gemini CLI (Google) | Supported (GEMINI.md) |
| Windsurf (Codeium) | Supported (.windsurfrules) |
| Antigravity (Google) | Supported (GEMINI.md) |
| Aider | Supported (.aider.conf.yml) |

## Support This Project

I build and maintain these skills in my free time. If they save you time or teach you something useful, consider supporting the project.

- [GitHub Sponsors](https://github.com/sponsors/mahdy-gribkov)
- [Buy Me a Coffee](https://buymeacoffee.com/mahdygribkov)
- [Ko-fi](https://ko-fi.com/mahdygribkov)

Starring the repo also helps. It costs nothing and makes the project more visible.

## Contributing

Want to add a skill or improve an existing one? Check [CONTRIBUTING.md](CONTRIBUTING.md) for the process and quality checklist.

## Security

Found a vulnerability? See [SECURITY.md](SECURITY.md) for how to report it.

## Credits

Created by [Mahdy Gribkov](https://mahdygribkov.vercel.app). Software engineer building tools for developers.

- [Portfolio](https://mahdygribkov.vercel.app)
- [GitHub](https://github.com/mahdy-gribkov)
- [LinkedIn](https://linkedin.com/in/mahdy-gribkov)

## License

[MIT](LICENSE)
