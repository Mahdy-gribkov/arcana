import type { Provider } from "../providers/base.js";
import { ui, banner, spinner } from "../utils/ui.js";
import { installSkill, getInstallDir, isSkillInstalled, writeSkillMeta } from "../utils/fs.js";
import { getProvider, getProviders } from "../registry.js";
import { loadConfig } from "../utils/config.js";

export async function installCommand(
  skillName: string | undefined,
  opts: { provider?: string; all?: boolean }
): Promise<void> {
  banner();

  if (!skillName && !opts.all) {
    console.log(ui.error("  Specify a skill name or use --all"));
    console.log(ui.dim("  Usage: arcana install <skill-name>"));
    console.log(ui.dim("         arcana install --all"));
    console.log();
    process.exit(1);
  }

  const providerName = opts.provider ?? loadConfig().defaultProvider;
  const providers = opts.all ? getProviders() : [getProvider(providerName)];

  if (opts.all) {
    await installAll(providers);
  } else {
    await installOne(skillName!, providers[0]);
  }
}

async function installOne(skillName: string, provider: Provider): Promise<void> {
  if (isSkillInstalled(skillName)) {
    console.log(ui.warn(`  ${skillName} is already installed. Reinstalling...`));
  }

  const s = spinner(`Fetching ${ui.bold(skillName)} from ${ui.dim(provider.name)}...`);
  s.start();

  try {
    const files = await provider.fetch(skillName);
    s.text = `Installing ${ui.bold(skillName)}...`;
    const dir = installSkill(skillName, files);

    const remote = await provider.info(skillName);
    writeSkillMeta(skillName, { version: remote?.version ?? "0.0.0", installedAt: new Date().toISOString(), source: provider.name });

    s.succeed(`Installed ${ui.bold(skillName)} (${files.length} files)`);
    console.log(ui.dim(`  Location: ${dir}`));
    console.log();
  } catch (err) {
    s.fail(`Failed to install ${skillName}`);
    if (err instanceof Error) {
      console.error(ui.dim(`  ${err.message}`));
    }
    console.log();
    process.exit(1);
  }
}

async function installAll(providers: Provider[]): Promise<void> {
  const s = spinner("Fetching skill list...");
  s.start();

  let installed = 0;
  let skipped = 0;

  try {
    for (const provider of providers) {
      const skills = await provider.list();

      for (const skill of skills) {
        if (isSkillInstalled(skill.name)) {
          skipped++;
          continue;
        }
        s.text = `Installing ${ui.bold(skill.name)} from ${ui.dim(provider.name)}...`;
        const files = await provider.fetch(skill.name);
        installSkill(skill.name, files);
        writeSkillMeta(skill.name, { version: skill.version, installedAt: new Date().toISOString(), source: provider.name });
        installed++;
      }
    }

    s.succeed(`Installed ${installed} skills to ${ui.dim(getInstallDir())}`);
    if (skipped > 0) {
      console.log(ui.dim(`  Skipped ${skipped} already installed`));
    }
    console.log();
  } catch (err) {
    s.fail("Installation failed");
    if (err instanceof Error) {
      console.error(ui.dim(`  ${err.message}`));
    }
    console.log();
    process.exit(1);
  }
}
