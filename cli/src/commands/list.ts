import { ui, banner, spinner, table } from "../utils/ui.js";
import { isSkillInstalled } from "../utils/fs.js";
import { getProviders } from "../registry.js";

export async function listCommand(opts: {
  provider?: string;
  all?: boolean;
}): Promise<void> {
  banner();

  const providers = getProviders(opts.all ? undefined : opts.provider);
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
          skill.description.slice(0, 60) + (skill.description.length > 60 ? "..." : ""),
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
    throw err;
  }
}
