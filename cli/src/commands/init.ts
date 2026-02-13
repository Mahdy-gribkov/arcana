import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { ui, banner } from "../utils/ui.js";

type ToolName = "claude" | "cursor" | "codex" | "gemini" | "antigravity" | "windsurf" | "aider";

interface ProjectInfo {
  name: string;
  type: string;
  lang: string;
}

function detectProject(cwd: string): ProjectInfo {
  const name = basename(cwd);
  if (existsSync(join(cwd, "go.mod"))) return { name, type: "Go", lang: "go" };
  if (existsSync(join(cwd, "Cargo.toml"))) return { name, type: "Rust", lang: "rust" };
  if (existsSync(join(cwd, "requirements.txt")) || existsSync(join(cwd, "pyproject.toml")))
    return { name, type: "Python", lang: "python" };
  if (existsSync(join(cwd, "package.json"))) {
    try {
      const raw = readFileSync(join(cwd, "package.json"), "utf-8");
      const pkg = JSON.parse(raw) as Record<string, Record<string, string> | undefined>;
      if (pkg.dependencies?.next || pkg.devDependencies?.next) return { name, type: "Next.js", lang: "typescript" };
      if (pkg.dependencies?.react || pkg.devDependencies?.react) return { name, type: "React", lang: "typescript" };
    } catch { /* ignore */ }
    return { name, type: "Node.js", lang: "typescript" };
  }
  return { name, type: "Unknown", lang: "general" };
}

function claudeTemplate(proj: ProjectInfo): string {
  return `# CLAUDE.md - ${proj.name}

## Project
- **Type:** ${proj.type}
- **Language:** ${proj.lang}

## Coding Preferences
- Follow existing patterns in the codebase
- Handle errors explicitly
- Use meaningful variable names, no abbreviations

## Build & Test
<!-- Add build/test commands so Claude can verify changes -->
<!-- Example: npm test, go test ./..., pytest -->

## Project Structure
<!-- Describe your project structure here -->
`;
}

function cursorTemplate(proj: ProjectInfo): string {
  return `---
description: Project conventions for ${proj.name}
globs:
---

# ${proj.name} (${proj.type})

## Language
${proj.lang}

## Coding Standards
- Follow existing patterns in the codebase
- Handle errors explicitly
- Use meaningful variable names
`;
}

function codexTemplate(proj: ProjectInfo): string {
  return `# AGENTS.md - ${proj.name}

## Project
Type: ${proj.type} | Language: ${proj.lang}

## Sandbox
Codex runs in a sandboxed environment with no network access.
All dependencies must be pre-installed before the session.

## Guidelines
- Follow existing patterns in the codebase
- Handle errors explicitly
- Use meaningful variable names
`;
}

function geminiTemplate(proj: ProjectInfo): string {
  return `# GEMINI.md - ${proj.name}

## Project Context
This is a ${proj.type} project using ${proj.lang}.

## Project Files
<!-- List key files and directories so Gemini can navigate the codebase -->
<!-- Example: src/ - main source, tests/ - test files -->

## Instructions
- Follow existing patterns in the codebase
- Handle errors explicitly
- Use meaningful variable names
`;
}

function antigravityTemplate(proj: ProjectInfo): string {
  return `# GEMINI.md - ${proj.name}

## Project Context
This is a ${proj.type} project using ${proj.lang}.

## Project Files
<!-- List key files and directories so the agent can navigate the codebase -->
<!-- Example: src/ - main source, tests/ - test files -->

## Instructions
- Follow existing patterns in the codebase
- Handle errors explicitly
- Use meaningful variable names
`;
}

function windsurfTemplate(proj: ProjectInfo): string {
  return `# Windsurf Cascades Rules - ${proj.name}

Project: ${proj.name} (${proj.type})
Language: ${proj.lang}

## Rules
- Follow existing patterns in the codebase
- Handle errors explicitly
- Use meaningful variable names
- Always explain changes before applying them
`;
}

function aiderTemplate(_proj: ProjectInfo): string {
  return `# Aider Configuration
model: sonnet
auto-commits: true
auto-test: false
# Add conventions below
conventions:
  - Follow existing patterns in the codebase
  - Write clean, maintainable code
  - Handle errors explicitly
`;
}

const TOOL_FILES: Record<ToolName, { path: string | ((cwd: string) => string); template: (p: ProjectInfo) => string; label: string }> = {
  claude: { path: "CLAUDE.md", template: claudeTemplate, label: "Claude Code" },
  cursor: {
    path: join(".cursor", "rules", "project.mdc"),
    template: cursorTemplate,
    label: "Cursor",
  },
  codex: { path: "AGENTS.md", template: codexTemplate, label: "Codex CLI" },
  gemini: { path: "GEMINI.md", template: geminiTemplate, label: "Gemini CLI" },
  antigravity: { path: "GEMINI.md", template: antigravityTemplate, label: "Antigravity" },
  windsurf: { path: ".windsurfrules", template: windsurfTemplate, label: "Windsurf" },
  aider: { path: ".aider.conf.yml", template: aiderTemplate, label: "Aider" },
};

export async function initCommand(opts: { tool?: string }): Promise<void> {
  banner();

  const cwd = process.cwd();
  const proj = detectProject(cwd);

  console.log(ui.bold("  Project detected"));
  console.log(ui.dim(`  Name: ${proj.name}`));
  console.log(ui.dim(`  Type: ${proj.type}`));
  console.log();

  if (opts.tool && opts.tool !== "all" && !(opts.tool in TOOL_FILES)) {
    const valid = Object.keys(TOOL_FILES).join(", ");
    console.log(ui.error(`  Unknown tool: ${opts.tool}`));
    console.log(ui.dim(`  Valid tools: ${valid}`));
    console.log();
    process.exit(1);
  }

  const tools: ToolName[] = opts.tool === "all" || !opts.tool
    ? ["claude", "cursor", "codex", "gemini", "antigravity", "windsurf", "aider"]
    : [opts.tool as ToolName];

  let created = 0;
  let skipped = 0;

  for (const tool of tools) {
    const entry = TOOL_FILES[tool];
    if (!entry) {
      console.log(ui.warn(`  Unknown tool: ${tool}`));
      continue;
    }

    const relPath = typeof entry.path === "function" ? entry.path(cwd) : entry.path;
    const fullPath = join(cwd, relPath);

    if (existsSync(fullPath)) {
      console.log(ui.dim(`  Skip ${relPath} (already exists)`));
      skipped++;
      continue;
    }

    const content = entry.template(proj);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content, "utf-8");
    console.log(ui.success(`  Created ${relPath}`) + ui.dim(` (${entry.label})`));
    created++;
  }

  console.log();
  if (created > 0) {
    console.log(ui.dim(`  ${created} file${created > 1 ? "s" : ""} created. Edit them to match your project.`));
  } else {
    console.log(ui.dim("  All config files already exist."));
  }
  if (skipped > 0) console.log(ui.dim(`  ${skipped} skipped (already exist)`));
  console.log();
}
