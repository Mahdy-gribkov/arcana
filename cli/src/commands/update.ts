import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { getInstallDir, installSkill, readSkillMeta, writeSkillMeta } from "../utils/fs.js";
import { getProvider, getProviders } from "../registry.js";
import { ui, banner, spinner } from "../utils/ui.js";
import { loadConfig } from "../utils/config.js";

export async function updateCommand(
  skill: string | undefined,
  opts: { all?: boolean; provider?: string }
): Promise<void> {
  banner();

  if (!skill && !opts.all) {
    console.log(ui.error("  Specify a skill name or use --all"));
    console.log(ui.dim("  Usage: arcana update <skill>"));
    console.log(ui.dim("         arcana update --all"));
    console.log();
    process.exit(1);
  }

  const installDir = getInstallDir();
  if (!existsSync(installDir)) {
    console.log(ui.dim("  No skills installed."));
    console.log();
    return;
  }

  const providerName = opts.provider ?? loadConfig().defaultProvider;

  if (opts.all) {
    await updateAll(installDir, providerName);
  } else {
    await updateOne(skill!, installDir, providerName);
  }
}

async function updateOne(
  skillName: string,
  installDir: string,
  providerName: string
): Promise<void> {
  const skillDir = join(installDir, skillName);
  if (!existsSync(skillDir)) {
    console.log(ui.error(`  Skill "${skillName}" is not installed.`));
    console.log();
    process.exit(1);
  }

  const s = spinner(`Checking ${ui.bold(skillName)} for updates...`);
  s.start();

  try {
    const provider = getProvider(providerName);
    const remote = await provider.info(skillName);

    if (!remote) {
      s.fail(`Skill "${skillName}" not found on ${providerName}`);
      console.log();
      process.exit(1);
    }

    const meta = readSkillMeta(skillName);
    if (meta?.version === remote.version) {
      s.info(`${ui.bold(skillName)} is already up to date (v${remote.version})`);
      console.log();
      return;
    }

    s.text = `Updating ${ui.bold(skillName)}...`;
    const files = await provider.fetch(skillName);
    installSkill(skillName, files);
    writeSkillMeta(skillName, { version: remote.version, installedAt: new Date().toISOString(), source: providerName });

    s.succeed(`Updated ${ui.bold(skillName)} to v${remote.version}`);
    console.log();
  } catch (err) {
    s.fail(`Failed to update ${skillName}`);
    if (err instanceof Error) console.error(ui.dim(`  ${err.message}`));
    console.log();
    process.exit(1);
  }
}

async function updateAll(installDir: string, providerName: string): Promise<void> {
  const installed = readdirSync(installDir).filter(
    (d) => statSync(join(installDir, d)).isDirectory()
  );

  if (installed.length === 0) {
    console.log(ui.dim("  No skills installed."));
    console.log();
    return;
  }

  const s = spinner(`Checking ${installed.length} skills for updates...`);
  s.start();

  let updated = 0;
  let upToDate = 0;
  let notFound = 0;

  try {
    const providers = getProviders(providerName === "arcana" ? undefined : providerName);

    for (const skillName of installed) {
      let found = false;

      for (const provider of providers) {
        const remote = await provider.info(skillName);
        if (!remote) continue;
        found = true;

        const meta = readSkillMeta(skillName);
        if (meta?.version === remote.version) {
          upToDate++;
          break;
        }

        s.text = `Updating ${ui.bold(skillName)}...`;
        const files = await provider.fetch(skillName);
        installSkill(skillName, files);
        writeSkillMeta(skillName, { version: remote.version, installedAt: new Date().toISOString(), source: provider.name });
        updated++;
        break;
      }

      if (!found) notFound++;
    }

    s.succeed(`Update complete`);
    console.log(ui.dim(`  ${updated} updated, ${upToDate} up to date, ${notFound} not in provider`));
    console.log();
  } catch (err) {
    s.fail("Update failed");
    if (err instanceof Error) console.error(ui.dim(`  ${err.message}`));
    console.log();
    process.exit(1);
  }
}
