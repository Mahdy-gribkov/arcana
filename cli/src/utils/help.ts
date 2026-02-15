import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import * as p from "@clack/prompts";
import chalk from "chalk";
import { ui } from "./ui.js";

const RESET = "\x1b[0m";

const GRAYS = [
  "\x1b[38;5;250m",
  "\x1b[38;5;248m",
  "\x1b[38;5;245m",
  "\x1b[38;5;243m",
  "\x1b[38;5;240m",
  "\x1b[38;5;238m",
];

const BANNER_LINES = [
  " █████╗ ██████╗  ██████╗ █████╗ ███╗   ██╗ █████╗ ",
  "██╔══██╗██╔══██╗██╔════╝██╔══██╗████╗  ██║██╔══██╗",
  "███████║██████╔╝██║     ███████║██╔██╗ ██║███████║",
  "██╔══██║██╔══██╗██║     ██╔══██║██║╚██╗██║██╔══██║",
  "██║  ██║██║  ██║╚██████╗██║  ██║██║ ╚████║██║  ██║",
  "╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝",
];

const noColor = !!(process.env.NO_COLOR || process.env.TERM === "dumb");

export function renderBanner(): string {
  if (noColor) {
    return BANNER_LINES.map((l) => `  ${l}`).join("\n");
  }
  return BANNER_LINES.map((line, i) => `  ${GRAYS[i]}${line}${RESET}`).join("\n");
}

interface CommandEntry {
  cmd: string;
  desc: string;
}

const COMMAND_GROUPS: Record<string, CommandEntry[]> = {
  "GETTING STARTED": [
    { cmd: "init", desc: "Initialize arcana in current project" },
    { cmd: "doctor", desc: "Check environment and diagnose issues" },
  ],
  SKILLS: [
    { cmd: "list", desc: "List available skills" },
    { cmd: "search <query>", desc: "Search across providers" },
    { cmd: "info <skill>", desc: "Show skill details" },
    { cmd: "install [skills...]", desc: "Install one or more skills" },
    { cmd: "update [skills...]", desc: "Update installed skills" },
    { cmd: "uninstall [skills...]", desc: "Remove one or more skills" },
  ],
  DEVELOPMENT: [
    { cmd: "create <name>", desc: "Create a new skill from template" },
    { cmd: "validate [skill]", desc: "Validate skill structure" },
    { cmd: "audit [skill]", desc: "Audit skill quality" },
  ],
  CONFIGURATION: [
    { cmd: "config [key] [val]", desc: "View or modify configuration" },
    { cmd: "providers", desc: "Manage skill providers" },
    { cmd: "clean", desc: "Remove orphaned data" },
    { cmd: "stats", desc: "Show session analytics" },
  ],
};

const EXAMPLES = [
  "$ arcana install code-reviewer typescript golang",
  '$ arcana search "testing"',
  "$ arcana init --tool claude",
];

function padRight(str: string, width: number): string {
  return str + " ".repeat(Math.max(0, width - str.length));
}

export function buildCustomHelp(version: string): string {
  const lines: string[] = [];

  lines.push("");
  lines.push(renderBanner());
  lines.push("");
  lines.push(`  ${ui.bold("Supercharge any AI coding agent.")}${" ".repeat(20)}${ui.dim(`v${version}`)}`);
  lines.push("");
  lines.push(`  ${ui.dim("USAGE")}`);
  lines.push("    arcana <command> [options]");

  for (const [group, commands] of Object.entries(COMMAND_GROUPS)) {
    lines.push("");
    lines.push(`  ${ui.dim(group)}`);
    for (const { cmd, desc } of commands) {
      lines.push(`    ${ui.cyan(padRight(cmd, 22))}${ui.dim(desc)}`);
    }
  }

  lines.push("");
  lines.push(`  ${ui.dim("EXAMPLES")}`);
  for (const ex of EXAMPLES) {
    lines.push(`    ${ui.cyan(ex)}`);
  }

  lines.push("");
  lines.push(`  ${ui.dim("LEARN MORE")}`);
  lines.push(`    arcana <command> --help          ${ui.dim("Show help for a command")}`);
  lines.push(`    ${ui.dim("https://github.com/mahdy-gribkov/arcana")}`);
  lines.push("");

  return lines.join("\n");
}

const FIRST_RUN_FLAG = join(homedir(), ".arcana", ".initialized");

export function isFirstRun(): boolean {
  return !existsSync(FIRST_RUN_FLAG);
}

export function markInitialized(): void {
  const dir = join(homedir(), ".arcana");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(FIRST_RUN_FLAG, new Date().toISOString(), "utf-8");
}

export function showWelcome(version: string): void {
  console.log(renderBanner());
  console.log();
  p.intro(chalk.bold(`arcana v${version}`));
  p.log.step("Get started:");
  p.log.info(`Run ${chalk.cyan("arcana doctor")} to check your environment`);
  p.log.info(`Run ${chalk.cyan("arcana list")} to browse available skills`);
  p.log.info(`Run ${chalk.cyan("arcana install <skill>")} to install your first skill`);
  p.outro("Happy coding!");
}
