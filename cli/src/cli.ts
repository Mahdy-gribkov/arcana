import { createRequire } from "node:module";
import { Command } from "commander";
import { listCommand } from "./commands/list.js";
import { installCommand } from "./commands/install.js";
import { infoCommand } from "./commands/info.js";
import { searchCommand } from "./commands/search.js";
import { providersCommand } from "./commands/providers.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { version: string };

export function createCli(): Command {
  const program = new Command();

  program
    .name("arcana")
    .description("Universal agent skill package manager")
    .version(pkg.version);

  program
    .command("list")
    .description("List available skills")
    .option("-p, --provider <name>", "Provider to list from")
    .option("-a, --all", "List from all providers")
    .action((opts) => listCommand(opts));

  program
    .command("install [skill]")
    .description("Install a skill")
    .option("-p, --provider <name>", "Provider to install from")
    .option("-a, --all", "Install all skills")
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
    .action((query, opts) => searchCommand(query, opts));

  program
    .command("providers")
    .description("Manage skill providers")
    .option("--add <owner/repo>", "Add a GitHub provider")
    .option("--remove <name>", "Remove a provider")
    .action((opts) => providersCommand(opts));

  return program;
}
