import { existsSync, rmSync, readdirSync, lstatSync, readlinkSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { getInstallDir } from "../utils/fs.js";
import { ui, banner } from "../utils/ui.js";

export async function uninstallCommand(skillName: string): Promise<void> {
  banner();

  const installDir = getInstallDir();
  const skillDir = join(installDir, skillName);

  if (!existsSync(skillDir)) {
    console.log(ui.error(`  Skill "${skillName}" is not installed.`));
    console.log();
    process.exit(1);
  }

  // Remove skill directory
  rmSync(skillDir, { recursive: true, force: true });

  // Remove any symlinks in ~/.claude/skills/ pointing to this skill
  let symlinksRemoved = 0;
  const symlinkDir = join(homedir(), ".claude", "skills");
  if (existsSync(symlinkDir)) {
    for (const entry of readdirSync(symlinkDir)) {
      const fullPath = join(symlinkDir, entry);
      try {
        const stat = lstatSync(fullPath);
        if (stat.isSymbolicLink()) {
          const target = readlinkSync(fullPath);
          if (target.includes(skillName)) {
            rmSync(fullPath);
            symlinksRemoved++;
          }
        }
      } catch { /* skip */ }
    }
  }

  console.log(ui.success(`  Uninstalled ${ui.bold(skillName)}`));
  if (symlinksRemoved > 0) {
    console.log(ui.dim(`  Removed ${symlinksRemoved} symlink${symlinksRemoved > 1 ? "s" : ""}`));
  }
  console.log();
}
