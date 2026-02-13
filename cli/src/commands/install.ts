import type { Provider } from "../providers/base.js";
import { ui, banner, spinner, getErrorHint } from "../utils/ui.js";
import { installSkill, getInstallDir, isSkillInstalled, writeSkillMeta } from "../utils/fs.js";
import { getProvider, getProviders } from "../registry.js";
import { loadConfig } from "../utils/config.js";

export async function installCommand(
  skillName: string | undefined,
  opts: { provider?: string; all?: boolean; dryRun?: boolean }
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
    await installAll(providers, opts.dryRun);
  } else {
    await installOne(skillName!, providers[0]!, opts.dryRun);
  }
}

async function installOne(skillName: string, provider: Provider, dryRun?: boolean): Promise<void> {
  if (!dryRun && isSkillInstalled(skillName)) {
    console.log(ui.warn(`  ${skillName} is already installed. Reinstalling...`));
  }

  const s = spinner(`Fetching ${ui.bold(skillName)} from ${ui.dim(provider.name)}...`);
  s.start();

  try {
    const files = await provider.fetch(skillName);

    if (dryRun) {
      s.succeed(`Would install ${ui.bold(skillName)} (${files.length} files)`);
      console.log();
      return;
    }

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
    const hint = getErrorHint(err);
    if (hint) console.error(ui.dim(`  Hint: ${hint}`));
    console.log();
    process.exit(1);
  }
}

async function installAll(providers: Provider[], dryRun?: boolean): Promise<void> {
  const s = spinner("Fetching skill list...");
  s.start();

  if (dryRun) {
    let total = 0;
    for (const provider of providers) {
      try {
        const skills = await provider.list();
        total += skills.length;
      } catch (err) {
        if (err instanceof Error) console.error(ui.dim(`  Failed to list ${provider.name}: ${err.message}`));
      }
    }
    s.succeed(`Would install ${total} skills`);
    console.log();
    return;
  }

  let installed = 0;
  let skipped = 0;
  let failed = 0;

  for (const provider of providers) {
    let skills;
    try {
      skills = await provider.list();
    } catch (err) {
      failed++;
      if (err instanceof Error) console.error(ui.dim(`  Failed to list ${provider.name}: ${err.message}`));
      continue;
    }

    const total = skills.length;
    for (let i = 0; i < total; i++) {
      const skill = skills[i]!;
      if (isSkillInstalled(skill.name)) {
        skipped++;
        continue;
      }
      try {
        s.text = `Installing ${ui.bold(skill.name)} (${i + 1}/${total}) from ${ui.dim(provider.name)}...`;
        const files = await provider.fetch(skill.name);
        installSkill(skill.name, files);
        writeSkillMeta(skill.name, { version: skill.version, installedAt: new Date().toISOString(), source: provider.name });
        installed++;
      } catch (err) {
        failed++;
        if (err instanceof Error) console.error(ui.dim(`  Failed to install ${skill.name}: ${err.message}`));
      }
    }
  }

  s.succeed(`Installed ${installed} skills${failed > 0 ? `, ${failed} failed` : ""}`);
  if (skipped > 0) {
    console.log(ui.dim(`  Skipped ${skipped} already installed`));
  }
  console.log();
  if (failed > 0) process.exit(1);
}
