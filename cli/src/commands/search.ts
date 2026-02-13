import { ui, banner, spinner, table } from "../utils/ui.js";
import { isSkillInstalled } from "../utils/fs.js";
import { getProviders } from "../registry.js";

export async function searchCommand(
  query: string,
  opts: { provider?: string }
): Promise<void> {
  banner();

  const providers = getProviders(opts.provider);
  const s = spinner(`Searching for "${query}"...`);
  s.start();

  const rows: string[][] = [];

  for (const provider of providers) {
    const results = await provider.search(query);
    for (const skill of results) {
      const installed = isSkillInstalled(skill.name);
      rows.push([
        ui.bold(skill.name),
        skill.description.slice(0, 60) + (skill.description.length > 60 ? "..." : ""),
        ui.dim(skill.source),
        installed ? ui.success("[installed]") : "",
      ]);
    }
  }

  s.stop();

  if (rows.length === 0) {
    console.log(ui.dim(`  No skills matching "${query}"`));
  } else {
    console.log(ui.bold(`  ${rows.length} results for "${query}":`));
    console.log();
    table(rows);
  }

  console.log();
}
