import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { ui, banner, spinner, table, getErrorHint } from "../utils/ui.js";
import { isSkillInstalled, getInstallDir, readSkillMeta } from "../utils/fs.js";
import { getProviders } from "../registry.js";

const DESC_TRUNCATE_LENGTH = 80;

export async function listCommand(opts: {
  provider?: string;
  all?: boolean;
  cache?: boolean;
  installed?: boolean;
}): Promise<void> {
  banner();

  if (opts.installed) {
    listInstalled();
    return;
  }

  const providers = getProviders(opts.all ? undefined : opts.provider);

  if (opts.cache === false) {
    for (const provider of providers) provider.clearCache();
  }

  const s = spinner("Fetching skills...");
  s.start();

  try {
    const rows: string[][] = [];

    for (const provider of providers) {
      const skills = await provider.list();
      for (const skill of skills) {
        const installed = isSkillInstalled(skill.name);
        const status = installed ? ui.success("[installed]") : "";
        rows.push([
          ui.bold(skill.name),
          ui.dim(`v${skill.version}`),
          skill.description.slice(0, DESC_TRUNCATE_LENGTH) + (skill.description.length > DESC_TRUNCATE_LENGTH ? "..." : ""),
          providers.length > 1 ? ui.dim(skill.source) : "",
          status,
        ]);
      }
    }

    s.stop();

    if (rows.length === 0) {
      console.log(ui.dim("  No skills found."));
    } else {
      console.log(ui.bold(`  ${rows.length} skills available:`));
      console.log();
      table(rows);
    }

    console.log();
  } catch (err) {
    s.fail("Failed to fetch skills");
    const hint = getErrorHint(err);
    if (hint) console.error(ui.dim(`  Hint: ${hint}`));
    throw err;
  }
}

function listInstalled(): void {
  const installDir = getInstallDir();
  if (!existsSync(installDir)) {
    console.log(ui.dim("  No skills installed."));
    console.log();
    return;
  }

  const dirs = readdirSync(installDir).filter((d) =>
    statSync(join(installDir, d)).isDirectory()
  );

  if (dirs.length === 0) {
    console.log(ui.dim("  No skills installed."));
    console.log();
    return;
  }

  const rows: string[][] = [];
  for (const name of dirs) {
    const meta = readSkillMeta(name);
    rows.push([
      ui.bold(name),
      ui.dim(meta ? `v${meta.version}` : "unknown"),
      ui.dim(meta?.source ?? "local"),
      ui.dim(meta?.installedAt ? new Date(meta.installedAt).toLocaleDateString() : ""),
    ]);
  }

  console.log(ui.bold(`  ${rows.length} skills installed:`));
  console.log();
  table(rows);
  console.log();
}
