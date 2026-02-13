import { ui, banner, table, spinner } from "../utils/ui.js";
import { loadConfig, addProvider, removeProvider } from "../utils/config.js";
import { httpGet, HttpError } from "../utils/http.js";

export async function providersCommand(opts: {
  add?: string;
  remove?: string;
}): Promise<void> {
  banner();

  if (opts.add) {
    const parts = opts.add.split("/");
    if (parts.length !== 2) {
      console.log(ui.error("  Format: owner/repo (e.g. user/skills-repo)"));
      console.log();
      process.exit(1);
    }
    const name = parts.join("/");
    const s = spinner(`Validating ${opts.add}...`);
    s.start();
    try {
      const [owner, repo] = parts;
      await httpGet(`https://raw.githubusercontent.com/${owner}/${repo}/main/.claude-plugin/marketplace.json`);
      s.succeed(`Provider ${opts.add} verified`);
    } catch {
      try {
        const [owner, repo] = parts;
        await httpGet(`https://raw.githubusercontent.com/${owner}/${repo}/master/.claude-plugin/marketplace.json`);
        s.succeed(`Provider ${opts.add} verified`);
      } catch {
        s.fail(`Could not find marketplace.json at ${opts.add}`);
        console.log(ui.dim("  Ensure the repo has .claude-plugin/marketplace.json"));
        console.log();
        process.exit(1);
      }
    }
    addProvider({ name, type: "github", url: opts.add, enabled: true });
    console.log(ui.success(`  Added provider: ${name}`));
    console.log(ui.dim(`  Use: arcana list --provider ${name}`));
    console.log();
    return;
  }

  if (opts.remove) {
    if (opts.remove === "arcana") {
      console.log(ui.error("  Cannot remove the default provider."));
      console.log();
      process.exit(1);
    }
    const removed = removeProvider(opts.remove);
    if (removed) {
      console.log(ui.success(`  Removed provider: ${opts.remove}`));
    } else {
      console.log(ui.error(`  Provider "${opts.remove}" not found.`));
    }
    console.log();
    return;
  }

  const config = loadConfig();
  console.log(ui.bold("  Configured providers:"));
  console.log();

  const rows = config.providers.map((p) => [
    p.name === config.defaultProvider
      ? ui.brand(p.name) + ui.dim(" (default)")
      : ui.bold(p.name),
    ui.dim(p.type),
    ui.dim(p.url),
    p.enabled ? ui.success("enabled") : ui.dim("disabled"),
  ]);

  table(rows);
  console.log();
  console.log(ui.dim("  Add:    arcana providers --add owner/repo"));
  console.log(ui.dim("  Remove: arcana providers --remove name"));
  console.log();
}
