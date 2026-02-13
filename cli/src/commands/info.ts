import { ui, banner, spinner } from "../utils/ui.js";
import { isSkillInstalled } from "../utils/fs.js";
import { getProviders } from "../registry.js";

export async function infoCommand(
  skillName: string,
  opts: { provider?: string }
): Promise<void> {
  banner();

  const providers = getProviders(opts.provider);
  const s = spinner(`Looking up ${ui.bold(skillName)}...`);
  s.start();

  try {
    for (const provider of providers) {
      const skill = await provider.info(skillName);
      if (skill) {
        s.stop();
        const installed = isSkillInstalled(skillName);

        console.log(ui.bold(`  ${skill.name}`) + ui.dim(` v${skill.version}`));
        if (installed) {
          console.log("  " + ui.success("Installed"));
        }
        console.log();
        console.log("  " + skill.description);
        console.log();
        console.log(ui.dim(`  Source: ${skill.source}`));
        if (skill.repo) {
          console.log(ui.dim(`  Repo:   ${skill.repo}`));
        }
        console.log();
        console.log(
          ui.dim(`  Install: `) + ui.cyan(`arcana install ${skill.name}`)
        );
        console.log();
        return;
      }
    }
  } catch (err) {
    s.fail("Lookup failed due to a network or provider error.");
    throw err;
  }

  s.fail(`Skill "${skillName}" not found`);
  console.log();
  process.exit(1);
}
