import { ui, banner, spinner, table, getErrorHint } from "../utils/ui.js";
import { isSkillInstalled } from "../utils/fs.js";
import { getProviders } from "../registry.js";

export async function searchCommand(
  query: string,
  opts: { provider?: string; cache?: boolean }
): Promise<void> {
  banner();

  const providers = getProviders(opts.provider);

  if (opts.cache === false) {
    for (const provider of providers) provider.clearCache();
  }
  const s = spinner(`Searching for "${query}"...`);
  s.start();

  const rows: string[][] = [];

  try {
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
  } catch (err) {
    s.fail("Search failed due to a network or provider error.");
    const hint = getErrorHint(err);
    if (hint) console.error(ui.dim(`  Hint: ${hint}`));
    throw err;
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
