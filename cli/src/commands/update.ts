import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { getInstallDir, installSkill, readSkillMeta, writeSkillMeta } from "../utils/fs.js";
import { getProvider, getProviders } from "../registry.js";
import { ui, banner, spinner } from "../utils/ui.js";
import { loadConfig } from "../utils/config.js";

export async function updateCommand(
  skill: string | undefined,
  opts: { all?: boolean; provider?: string; json?: boolean }
): Promise<void> {
  if (!opts.json) {
    banner();
  }

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
    await updateAll(installDir, providerName, opts.json);
  } else {
    await updateOne(skill!, installDir, providerName, opts.json);
  }
}

async function updateOne(
  skillName: string,
  installDir: string,
  providerName: string,
  json?: boolean
): Promise<void> {
  const skillDir = join(installDir, skillName);
  if (!existsSync(skillDir)) {
    if (json) {
      console.log(JSON.stringify({ updated: [], upToDate: [], failed: [skillName] }));
    } else {
      console.log(ui.error(`  Skill "${skillName}" is not installed.`));
      console.log();
    }
    process.exit(1);
  }

  const s = json ? { start: () => {}, succeed: () => {}, info: () => {}, fail: () => {}, text: "" } : spinner(`Checking ${ui.bold(skillName)} for updates...`);
  s.start();

  try {
    const provider = getProvider(providerName);
    const remote = await provider.info(skillName);

    if (!remote) {
      if (json) {
        console.log(JSON.stringify({ updated: [], upToDate: [], failed: [skillName] }));
      } else {
        s.fail(`Skill "${skillName}" not found on ${providerName}`);
        console.log();
      }
      process.exit(1);
    }

    const meta = readSkillMeta(skillName);
    if (meta?.version === remote.version) {
      if (json) {
        console.log(JSON.stringify({ updated: [], upToDate: [skillName], failed: [] }));
      } else {
        s.info(`${ui.bold(skillName)} is already up to date (v${remote.version})`);
        console.log();
      }
      return;
    }

    s.text = `Updating ${ui.bold(skillName)}...`;
    const files = await provider.fetch(skillName);
    installSkill(skillName, files);
    writeSkillMeta(skillName, { version: remote.version, installedAt: new Date().toISOString(), source: providerName });

    if (json) {
      console.log(JSON.stringify({ updated: [skillName], upToDate: [], failed: [] }));
    } else {
      s.succeed(`Updated ${ui.bold(skillName)} to v${remote.version} (${files.length} files)`);
      console.log();
    }
  } catch (err) {
    if (json) {
      console.log(JSON.stringify({ updated: [], upToDate: [], failed: [skillName] }));
    } else {
      s.fail(`Failed to update ${skillName}`);
      if (err instanceof Error) console.error(ui.dim(`  ${err.message}`));
      console.log();
    }
    process.exit(1);
  }
}

async function updateAll(installDir: string, providerName: string, json?: boolean): Promise<void> {
  const installed = readdirSync(installDir).filter(
    (d) => statSync(join(installDir, d)).isDirectory()
  );

  if (installed.length === 0) {
    if (json) {
      console.log(JSON.stringify({ updated: [], upToDate: [], failed: [] }));
    } else {
      console.log(ui.dim("  No skills installed."));
      console.log();
    }
    return;
  }

  const s = json ? { start: () => {}, succeed: () => {}, text: "" } : spinner(`Checking ${installed.length} skills for updates...`);
  s.start();

  const updatedList: string[] = [];
  const upToDateList: string[] = [];
  const failedList: string[] = [];

  const providers = getProviders(providerName === "arcana" ? undefined : providerName);

  const total = installed.length;
  for (let i = 0; i < total; i++) {
    const skillName = installed[i]!;
    let found = false;

    try {
      for (const provider of providers) {
        const remote = await provider.info(skillName);
        if (!remote) continue;
        found = true;

        const meta = readSkillMeta(skillName);
        if (meta?.version === remote.version) {
          upToDateList.push(skillName);
          break;
        }

        s.text = `Updating ${ui.bold(skillName)} (${i + 1}/${total})...`;
        const files = await provider.fetch(skillName);
        installSkill(skillName, files);
        writeSkillMeta(skillName, { version: remote.version, installedAt: new Date().toISOString(), source: provider.name });
        updatedList.push(skillName);
        break;
      }
    } catch (err) {
      failedList.push(skillName);
      if (err instanceof Error && !json) console.error(ui.dim(`  Failed to update ${skillName}: ${err.message}`));
      continue;
    }

    if (!found) failedList.push(skillName);
  }

  if (json) {
    console.log(JSON.stringify({ updated: updatedList, upToDate: upToDateList, failed: failedList }));
  } else {
    s.succeed(`Update complete`);
    console.log(ui.dim(`  ${updatedList.length} updated, ${upToDateList.length} up to date${failedList.length > 0 ? `, ${failedList.length} failed` : ""}`));
    console.log();
  }
  if (failedList.length > 0) process.exit(1);
}
