---
name: doc-generation
description: "Documentation generation from code including OpenAPI and GraphQL introspection, architecture diagrams with Mermaid and C4, README scaffolding, and changelog automation."
---

## Purpose

Generate accurate, maintainable documentation directly from source code and schemas. Reduce drift between implementation and docs by automating extraction and rendering.

## OpenAPI Documentation

### Generation from Code

- **TypeScript/Express:** Use `tsoa` or `swagger-jsdoc` to generate OpenAPI specs from decorators or JSDoc comments.
- **Go:** Use `swaggo/swag` to generate from Go doc comments. Run `swag init` to produce `docs/swagger.json`.
- **Python/FastAPI:** OpenAPI spec is generated automatically at `/openapi.json`.
- **NestJS:** Use `@nestjs/swagger` module. Decorate DTOs with `@ApiProperty()`.

### Spec-First Approach

- Write the OpenAPI spec first in YAML. Generate server stubs and client SDKs from it.
- Use `openapi-generator-cli` to produce typed clients for any language.
- Validate specs with `spectral lint openapi.yaml`. Enforce naming conventions and response schemas.

### Rendering

- **Swagger UI:** Embed in the app at `/docs`. Lightweight, interactive.
- **Redocly:** Better for public-facing API docs. Supports custom themes.
- **Stoplight Elements:** React component for embedding docs in existing apps.
- Host generated docs as static files. Rebuild on every CI push to main.

## GraphQL Introspection

### Schema Extraction

- Enable introspection in development. Disable it in production for security.
- Extract schema: `npx graphql-codegen --config codegen.yml` or `get-graphql-schema <endpoint> > schema.graphql`.
- Use GraphQL Voyager to render interactive dependency graphs of your schema.

### Documentation Tools

- **SpectaQL:** Generates static documentation from a GraphQL schema.
- **GraphQL Docs:** Auto-generates reference pages for queries, mutations, and types.
- Document deprecations inline: `@deprecated(reason: "Use newField instead")`.

### Type Generation

- Use `graphql-codegen` to generate TypeScript types from the schema.
- Generate React hooks for queries and mutations automatically.
- Keep generated files in a `__generated__` directory. Never edit them manually.

## Architecture Diagrams with Mermaid

### Embedding

- Use fenced code blocks with `mermaid` language tag in Markdown.
- GitHub, GitLab, and Notion render Mermaid natively.
- For static rendering, use `mmdc` (mermaid-cli): `mmdc -i diagram.mmd -o diagram.svg`.

### Diagram Types

- **Flowchart:** System flows, decision trees, user journeys.
- **Sequence:** API call chains, authentication flows, webhook processing.
- **Entity Relationship:** Database schema visualization.
- **Class:** TypeScript interface relationships, Go struct hierarchies.
- **Gantt:** Project timelines directly in docs.

### Best Practices

- Keep diagrams under 20 nodes. Split complex systems into sub-diagrams.
- Store `.mmd` source files alongside the code they describe.
- Add diagram source to CI validation. Render and diff on PRs.

## C4 Model Diagrams

### Levels

1. **System Context:** Shows the system and its interactions with users and external systems.
2. **Container:** Shows the high-level technology choices (web app, API, database, message queue).
3. **Component:** Shows the internal components within a container.
4. **Code:** Class-level detail. Usually auto-generated, rarely maintained manually.

### Tooling

- Use Structurizr DSL to define C4 models as code.
- Export to PlantUML, Mermaid, or Structurizr's web renderer.
- Store the DSL file in the repo root: `workspace.dsl`.
- Render during CI and publish to a shared docs site.

### Writing C4 Models

```
workspace {
    model {
        user = person "User"
        system = softwareSystem "My System" {
            webapp = container "Web App" "Next.js"
            api = container "API" "Go"
            db = container "Database" "PostgreSQL"
        }
        user -> webapp "Uses"
        webapp -> api "Calls"
        api -> db "Reads/Writes"
    }
}
```

## README Generation

### Structure

- **Title and badges:** Project name, CI status, version, license.
- **One-liner:** What the project does in one sentence.
- **Quick start:** Clone, install, run in 3 commands or fewer.
- **Configuration:** Required env vars, config files.
- **Usage:** Common commands, API examples, screenshots.
- **Architecture:** Link to C4 or Mermaid diagrams.
- **Contributing:** Link to CONTRIBUTING.md.
- **License:** SPDX identifier and link.

### Automation

- Use `readme-md-generator` for interactive scaffolding.
- Pull version, description, and scripts from `package.json` or `go.mod`.
- Generate command reference from CLI help output: `mycli --help > docs/commands.md`.
- Badge services: shields.io for static badges, GitHub Actions status badges for CI.

## Changelog Automation

### Conventional Changelog

- Generate changelogs from conventional commit messages.
- Use `standard-version` (npm) or `release-please` (GitHub Action).
- Group entries by type: Features, Bug Fixes, Breaking Changes.
- Link each entry to its commit or PR.

### Release-Please

- Runs as a GitHub Action. Creates a release PR that updates CHANGELOG.md and bumps version.
- Supports monorepos with per-package changelogs.
- Merging the release PR creates a GitHub Release with the changelog as the body.

### Manual Changelog Standards

- Follow Keep a Changelog format: Added, Changed, Deprecated, Removed, Fixed, Security.
- Date format: ISO 8601 (YYYY-MM-DD).
- Link version headers to diff URLs: `[1.0.0]: https://github.com/user/repo/compare/v0.9.0...v1.0.0`.

## CI Documentation Pipeline

- Generate docs on every push to main. Deploy to GitHub Pages, Vercel, or Netlify.
- Run link checkers (`lychee`, `markdown-link-check`) to catch broken links.
- Validate code examples in docs by extracting and executing them in CI.
- Use `markdownlint` to enforce consistent Markdown formatting.

## Troubleshooting

- Mermaid not rendering: check for syntax errors with the Mermaid live editor.
- OpenAPI spec invalid: run `openapi-generator validate -i openapi.yaml`.
- Changelog missing entries: ensure commit messages follow the conventional format exactly.
- Generated types stale: add codegen to the CI pipeline and fail if output differs from committed files.
