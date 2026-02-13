import { createInterface } from "node:readline/promises";
import { existsSync, rmSync } from "node:fs";
import { resolve, sep } from "node:path";
import { stdin, stdout } from "node:process";
import { getSkillDir, listSymlinks } from "../utils/fs.js";
import { ui, banner } from "../utils/ui.js";

export async function uninstallCommand(
  skillName: string,
  opts: { yes?: boolean } = {}
): Promise<void> {
  banner();

  const skillDir = getSkillDir(skillName);

  if (!existsSync(skillDir)) {
    console.log(ui.error(`  Skill "${skillName}" is not installed.`));
    console.log();
    process.exit(1);
  }

  if (!opts.yes) {
    const rl = createInterface({ input: stdin, output: stdout });
    let answer: string;
    try {
      answer = await rl.question(`  Uninstall ${ui.bold(skillName)}? (y/N): `);
    } finally {
      rl.close();
    }
    if (answer.trim().toLowerCase() !== "y" && answer.trim().toLowerCase() !== "yes") {
      console.log(ui.dim("  Cancelled."));
      console.log();
      return;
    }
  }

  // Remove skill directory
  rmSync(skillDir, { recursive: true, force: true });

  // Remove any symlinks in ~/.claude/skills/ pointing to this skill
  let symlinksRemoved = 0;
  const expectedTarget = resolve(getSkillDir(skillName));
  for (const link of listSymlinks()) {
    try {
      const normalizedTarget = resolve(link.target);
      if (normalizedTarget === expectedTarget || normalizedTarget.startsWith(expectedTarget + sep)) {
        rmSync(link.fullPath);
        symlinksRemoved++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(ui.warn(`  Could not remove symlink ${link.name}: ${msg}`));
    }
  }

  console.log(ui.success(`  Uninstalled ${ui.bold(skillName)}`));
  if (symlinksRemoved > 0) {
    console.log(ui.dim(`  Removed ${symlinksRemoved} symlink${symlinksRemoved > 1 ? "s" : ""}`));
  }
  console.log();
}
