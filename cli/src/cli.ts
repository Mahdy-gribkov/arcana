import { createRequire } from "node:module";
import { Command } from "commander";
import { listCommand } from "./commands/list.js";
import { installCommand } from "./commands/install.js";
import { infoCommand } from "./commands/info.js";
import { searchCommand } from "./commands/search.js";
import { providersCommand } from "./commands/providers.js";
import { createCommand } from "./commands/create.js";
import { validateCommand } from "./commands/validate.js";
import { updateCommand } from "./commands/update.js";
import { uninstallCommand } from "./commands/uninstall.js";
import { initCommand } from "./commands/init.js";
import { doctorCommand } from "./commands/doctor.js";
import { cleanCommand } from "./commands/clean.js";
import { statsCommand } from "./commands/stats.js";
import { configCommand } from "./commands/config.js";
import { auditCommand } from "./commands/audit.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { version: string };

export function createCli(): Command {
  const program = new Command();

  program
    .name("arcana")
    .description("Universal AI development CLI")
    .version(pkg.version);

  program
    .command("list")
    .description("List available skills")
    .option("-p, --provider <name>", "Provider to list from")
    .option("-a, --all", "List from all providers")
    .option("--installed", "Show only installed skills")
    .option("--no-cache", "Bypass skill cache")
    .option("-j, --json", "Output as JSON")
    .action((opts) => listCommand(opts));

  program
    .command("install [skill]")
    .description("Install a skill")
    .option("-p, --provider <name>", "Provider to install from")
    .option("-a, --all", "Install all skills")
    .option("--dry-run", "Show what would be installed without installing")
    .action((skill, opts) => installCommand(skill, opts));

  program
    .command("info <skill>")
    .description("Show skill details")
    .option("-p, --provider <name>", "Provider to search")
    .action((skill, opts) => infoCommand(skill, opts));

  program
    .command("search <query>")
    .description("Search for skills across providers")
    .option("-p, --provider <name>", "Limit search to provider")
    .option("--no-cache", "Bypass skill cache")
    .option("-j, --json", "Output as JSON")
    .action((query, opts) => searchCommand(query, opts));

  program
    .command("providers")
    .description("Manage skill providers")
    .option("--add <owner/repo>", "Add a GitHub provider")
    .option("--remove <name>", "Remove a provider")
    .action((opts) => providersCommand(opts));

  program
    .command("create <name>")
    .description("Create a new skill from template")
    .action((name) => createCommand(name));

  program
    .command("validate [skill]")
    .description("Validate skill structure and metadata")
    .option("-a, --all", "Validate all installed skills")
    .option("-f, --fix", "Auto-fix common issues")
    .option("-j, --json", "Output as JSON")
    .action((skill, opts) => validateCommand(skill, opts));

  program
    .command("update [skill]")
    .description("Update installed skills")
    .option("-a, --all", "Update all installed skills")
    .option("-p, --provider <name>", "Update from specific provider")
    .action((skill, opts) => updateCommand(skill, opts));

  program
    .command("uninstall <skill>")
    .description("Uninstall a skill")
    .option("-y, --yes", "Skip confirmation prompt")
    .action((skill, opts) => uninstallCommand(skill, opts));

  program
    .command("init")
    .description("Initialize arcana in current project")
    .option("-t, --tool <name>", "Target tool (claude, cursor, codex, gemini, antigravity, windsurf, aider, all)")
    .action((opts) => initCommand(opts));

  program
    .command("doctor")
    .description("Check environment and diagnose issues")
    .option("-j, --json", "Output as JSON")
    .action((opts) => doctorCommand(opts));

  program
    .command("clean")
    .description("Remove orphaned data and temp files")
    .option("-n, --dry-run", "Show what would be removed without deleting")
    .action((opts) => cleanCommand(opts));

  program
    .command("stats")
    .description("Show session analytics and token usage")
    .option("-j, --json", "Output as JSON")
    .action((opts) => statsCommand(opts));

  program
    .command("config [action] [value]")
    .description("View or modify arcana configuration")
    .action((action, value) => configCommand(action, value));

  program
    .command("audit [skill]")
    .description("Audit skill quality (code examples, BAD/GOOD pairs, structure)")
    .option("-a, --all", "Audit all installed skills")
    .option("-j, --json", "Output as JSON")
    .action((skill, opts) => auditCommand(skill, opts));

  return program;
}
